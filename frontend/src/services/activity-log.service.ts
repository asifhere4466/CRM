import api from './api';
import { ActivityLog } from '@/types';

export const activityLogService = {
  async getActivityLogs(page: number = 1, limit: number = 50) {
    const response = await api.get<{
      data: ActivityLog[];
      meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(`/activity-logs?page=${page}&limit=${limit}`);
    return response.data;
  },

  async getActivityLogsByEntity(entityType: string, entityId: string) {
    const response = await api.get<ActivityLog[]>(
      `/activity-logs/${entityType}/${entityId}`
    );
    return response.data;
  },
};
