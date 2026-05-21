import { supabase } from './supabase';

export interface NoticeFeedItem {
  id: string;
  title: string;
  content: string;
  link: string | null;
  is_pinned: boolean;
  is_highlighted: boolean;
  thumbnail_url: string | null;
  banner_url: string | null;
  created_at: string;
  is_automated?: boolean;
}

export const fetchNoticeFeed = async (limit?: number): Promise<NoticeFeedItem[]> => {
  const { data: manualAnnouncements, error: manualError } = await supabase
    .from('announcements')
    .select('*');

  if (manualError) throw manualError;

  const { data: autoNotifications, error: autoError } = await supabase
    .from('notifications')
    .select('*');

  const formattedAuto: NoticeFeedItem[] = (autoError ? [] : autoNotifications || []).map((noti: any) => ({
    id: noti.id,
    title: noti.title,
    content: noti.message,
    link: '/agents',
    is_pinned: false,
    is_highlighted: true,
    thumbnail_url: null,
    banner_url: null,
    created_at: noti.created_at,
    is_automated: true,
  }));

  const allNotices: NoticeFeedItem[] = [...(manualAnnouncements || []), ...formattedAuto];

  allNotices.sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return typeof limit === 'number' ? allNotices.slice(0, limit) : allNotices;
};
