export const isSupabaseStorageUrl = (value?: string | null) => {
  if (!value) return false;

  try {
    const url = new URL(value);
    return (
      url.hostname.endsWith('.supabase.co') &&
      url.pathname.includes('/storage/v1/object/')
    );
  } catch {
    return false;
  }
};

export const canLoadExternalMedia = (value?: string | null) =>
  Boolean(value) && !isSupabaseStorageUrl(value);
