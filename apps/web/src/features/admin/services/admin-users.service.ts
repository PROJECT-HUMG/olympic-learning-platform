import { apiClient } from "@/lib/axios";
import type { AdminUserResponse, AdminUsersSearchRequest, Page, PermissionInfo, InviteUserRequest, InviteUserResponse } from "../types/admin.types";

export const adminUsersService = {
  invite(data: InviteUserRequest) {
    return apiClient.post<InviteUserResponse>("/admin/users", data).then(response => response.data);
  },

  search(params: AdminUsersSearchRequest, signal?: AbortSignal) {
    return apiClient.get<Page<AdminUserResponse>>("/admin/users", { params, signal });
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
