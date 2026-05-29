type RecentAgent = {
  id: string;
  viewedAt: string;
};

const getStorageKey = (userId?: string | null) =>
  `central_agent_activity_${userId || 'guest'}`;

const readActivity = (userId?: string | null) => {
  if (typeof window === 'undefined') {
    return { favoriteIds: [] as string[], recent: [] as RecentAgent[] };
  }

  try {
    const parsed = JSON.parse(localStorage.getItem(getStorageKey(userId)) || '{}');

    return {
      favoriteIds: Array.isArray(parsed.favoriteIds) ? parsed.favoriteIds : [],
      recent: Array.isArray(parsed.recent) ? parsed.recent : [],
    };
  } catch {
    return { favoriteIds: [] as string[], recent: [] as RecentAgent[] };
  }
};

const writeActivity = (
  userId: string | null | undefined,
  activity: { favoriteIds: string[]; recent: RecentAgent[] }
) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getStorageKey(userId), JSON.stringify(activity));
};

export const getFavoriteAgentIds = (userId?: string | null) =>
  readActivity(userId).favoriteIds;

export const toggleFavoriteAgent = (userId: string | null | undefined, agentId: string) => {
  const activity = readActivity(userId);
  const isFavorite = activity.favoriteIds.includes(agentId);
  const favoriteIds = isFavorite
    ? activity.favoriteIds.filter((id) => id !== agentId)
    : [agentId, ...activity.favoriteIds];

  writeActivity(userId, {
    ...activity,
    favoriteIds,
  });

  return favoriteIds;
};

export const markAgentUsed = (userId: string | null | undefined, agentId: string) => {
  const activity = readActivity(userId);
  const recent = [
    { id: agentId, viewedAt: new Date().toISOString() },
    ...activity.recent.filter((item) => item.id !== agentId),
  ].slice(0, 12);

  writeActivity(userId, {
    ...activity,
    recent,
  });

  return recent;
};

export const getRecentAgentIds = (userId?: string | null) =>
  readActivity(userId).recent.map((item) => item.id);
