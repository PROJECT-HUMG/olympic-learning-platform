import { apiClient } from "@/lib/axios";
import type { AdminUserResponse, AdminUsersSearchRequest, Page, PermissionInfo } from "../types/admin.types";

export const adminUsersService = {
  search(params: AdminUsersSearchRequest) {
    return apiClient.get<Page<AdminUserResponse>>("/admin/users", { params });
  },

  grantPermission(userId: string, permission: string) {
    return apiClient.post<void>(`/admin/users/${userId}/permissions/${permission}`);
  },

  revokePermission(userId: string, permission: string) {
    return apiClient.delete<void>(`/admin/users/${userId}/permissions/${permission}`);
  },

  getAvailablePermissions() {
    return apiClient.get<PermissionInfo[]>("/admin/users/permissions");
  }
};
