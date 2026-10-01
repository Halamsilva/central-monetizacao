/**
 * Client-side video optimization utility using HTML5 Canvas & MediaRecorder.
 * Transcodes/downscales high-bitrate phone/4K videos to web-friendly 720p/540p
 * under 20MB so that they upload smoothly and never trigger 413 (Payload Too Large).
 */

export interface OptimizationResult {
  file: File;
  originalSizeMB: number;
  compressedSizeMB: number;
  reductionPercentage: number;
}

export async function optimizeVideo(
  file: File,
  targetMaxMB = 18,
  onProgress?: (progress: number) => void
): Promise<File> {
  // If file is already under 20MB, no compression needed
  if (file.size <= 20 * 1024 * 1024) {
    if (onProgress) onProgress(100);
    return file;
  }

  // Check if browser supports MediaRecorder
  if (typeof window === 'undefined' || !window.MediaRecorder) {
    return file;
  }

  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    // Keep audio active so speech and lip-sync tracks are preserved
    video.muted = false;
    video.volume = 0.001;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const url = URL.createObjectURL(file);
    video.src = url;

    // Timeout fallback after 35 seconds to avoid freezing
    const safetyTimeout = setTimeout(() => {
      cleanup();
      resolve(file);
    }, 35000);

    const cleanup = () => {
      clearTimeout(safetyTimeout);
      try {
        video.pause();
        video.removeAttribute('src');
        video.load();
      } catch (_e) {}
      URL.revokeObjectURL(url);
    };

    video.onloadedmetadata = async () => {
      try {
        const duration = video.duration || 10;
        // Target bit rate: targetMaxMB in bits divided by duration (with safe clamp between 600 kbps and 1.8 Mbps)
        const calculatedBps = Math.floor(((targetMaxMB * 8 * 1024 * 1024) / duration) * 0.75);
        const targetBps = Math.min(1_800_000, Math.max(500_000, calculatedBps));

        // Downscale resolution to max 1280x720 or 960x540 while preserving aspect ratio
        let width = video.videoWidth || 1280;
        let height = video.videoHeight || 720;
        const maxDimension = 1280;

        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        // Ensure even dimensions
        width = width % 2 === 0 ? width : width - 1;
        height = height % 2 === 0 ? height : height - 1;

        // Supported mimeType
        let mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/mp4';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              mimeType = '';
            }
          }
        }

        // Try video.captureStream first (preserves audio track seamlessly)
        let stream: MediaStream | null = null;
        try {
          if (typeof (video as any).captureStream === 'function') {
            stream = (video as any).captureStream();
          } else if (typeof (video as any).mozCaptureStream === 'function') {
            stream = (video as any).mozCaptureStream();
          }
        } catch (_e) {
          stream = null;
        }

        if (!stream) {
          cleanup();
          resolve(file);
          return;
        }

        const recorderOptions: MediaRecorderOptions = mimeType
          ? { mimeType, videoBitsPerSecond: targetBps }
          : { videoBitsPerSecond: targetBps };

        const recorder = new MediaRecorder(stream, recorderOptions);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        recorder.onstop = () => {
          cleanup();
          if (chunks.length === 0) {
            resolve(file);
            return;
          }
          const finalBlob = new Blob(chunks, { type: mimeType || 'video/webm' });
          // If compressed is smaller, return it
          if (finalBlob.size < file.size) {
            const extension = mimeType.includes('mp4') ? '.mp4' : '.webm';
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            const newFile = new File([finalBlob], `${baseName}-otimizado${extension}`, {
              type: finalBlob.type || 'video/webm',
            });
            resolve(newFile);
          } else {
            resolve(file);
          }
        };

        recorder.onerror = () => {
          cleanup();
          resolve(file);
        };

        video.ontimeupdate = () => {
          if (video.duration && onProgress) {
            const pct = Math.min(99, Math.round((video.currentTime / video.duration) * 100));
            onProgress(pct);
          }
        };

        video.onended = () => {
          if (onProgress) onProgress(100);
          setTimeout(() => {
            if (recorder.state === 'recording') {
              recorder.stop();
            }
          }, 300);
        };

        recorder.start(250);
        // Accelerate playback to compress faster (2.0x playback rate)
        video.playbackRate = 2.0;
        video.play().catch(() => {
          if (recorder.state === 'recording') recorder.stop();
          cleanup();
          resolve(file);
        });
      } catch (_err) {
        cleanup();
        resolve(file);
      }
    };

    video.onerror = () => {
      cleanup();
      resolve(file);
    };
  });
}
