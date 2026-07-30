import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminUsersService } from "../services/admin-users.service";
import type { AdminUsersSearchRequest } from "../types/admin.types";
import { toast } from "sonner";

export const QUERY_KEY_ADMIN_USERS = ["admin", "users"] as const;
export const QUERY_KEY_ADMIN_PERMISSIONS = ["admin", "permissions"] as const;

export function useAdminUsers(params: AdminUsersSearchRequest) {
  return useQuery({
    queryKey: [...QUERY_KEY_ADMIN_USERS, params],
    queryFn: async () => {
      const { data } = await adminUsersService.search(params);
      return data;
    },
    placeholderData: (previousData) => previousData,
  });
}

export function useGrantPermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, permission }: { userId: string; permission: string }) =>
      adminUsersService.grantPermission(userId, permission),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_ADMIN_USERS });
      toast.success("Đã cấp quyền thành công");
    },
    onError: () => {
      toast.error("Không thể cấp quyền");
    },
  });
}

export function useRevokePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, permission }: { userId: string; permission: string }) =>
      adminUsersService.revokePermission(userId, permission),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_ADMIN_USERS });
      toast.success("Đã thu hồi quyền thành công");
    },
    onError: () => {
      toast.error("Không thể thu hồi quyền");
    },
  });
}

export function useAvailablePermissions() {
  return useQuery({
    queryKey: QUERY_KEY_ADMIN_PERMISSIONS,
    queryFn: async () => {
      const { data } = await adminUsersService.getAvailablePermissions();
      return data;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours (rarely changes)
  });
}
