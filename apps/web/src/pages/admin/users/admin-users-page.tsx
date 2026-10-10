import { SearchInput } from "@/components/ui/search-input";
import { AvatarImage } from "@/features/user/components/avatar-image";
import { PageHeader } from "@/components/ui/page-header";
import { useState } from "react";
import {
  useAdminUsers,
  useGrantPermission,
  useRevokePermission,
  useAvailablePermissions,
} from "@/features/admin/hooks/use-admin-users";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AppPagination } from "@/components/ui/app-pagination";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Shield, ShieldAlert, Loader2 } from "lucide-react";
import type { AdminUserResponse } from "@/features/admin/types/admin.types";
import { useDebounce } from "@/hooks/use-debounce";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, refetch, isFetching } = useAdminUsers({
    search: debouncedSearch,
    page,
    size: 10,
  });

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const selectedUser =
    data?.content.find((user) => user.id === selectedUserId) ?? null;

  return (
    <div className="page-shell">
      <PageHeader title="Quản lý người dùng" description="Quản lý tài khoản và phân quyền hệ thống." />

      <div className="page-toolbar filter-panel">
        <div className="relative flex-1 max-w-md">
          <SearchInput aria-label="Tìm theo email, tên"
            placeholder="Tìm theo email, tên..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-9 bg-background"
          />
        </div>
      </div>

      <div className="page-table flex flex-col min-h-[400px]">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Người dùng</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Quyền hạn</TableHead>
              <TableHead>Ngày tham gia</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Đang tải dữ liệu...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div role="alert" className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Không thể tải danh sách người dùng.
                    </p>
                    <Button
                      variant="outline"
                      disabled={isFetching}
                      onClick={() => void refetch()}
                    >
                      Thử lại
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : !data || data.content.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-64 text-center text-muted-foreground"
                >
                  Không tìm thấy người dùng nào.
                </TableCell>
              </TableRow>
            ) : (
              data.content.map((user) => (
                <TableRow
                  key={user.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary border shrink-0">
                        {user.avatarUrl ? (
                          <AvatarImage crop={user.avatarCrop}
                            src={user.avatarUrl}
                            alt="Avatar"
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          (user.fullName ||
                            user.username ||
                            "U")[0].toUpperCase()
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {user.fullName || user.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "ADMIN" ? "default" : "secondary"}
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.permissions.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">
                          Không có
                        </span>
                      ) : (
                        user.permissions.map((p) => (
                          <Badge
                            key={p}
                            variant="outline"
                            className="text-[10px] py-0"
                          >
                            {p}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(user.createdAt), "dd/MM/yyyy", {
                      locale: vi,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedUserId(user.id)}
                      disabled={isFetching}
                      className="min-h-11"
                    >
                      Sửa quyền
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {data && data.totalPages > 1 && (
          <div className="p-4 border-t mt-auto">
            <AppPagination
              currentPage={page + 1}
              totalPages={data.totalPages}
              onPageChange={(nextPage) => setPage(nextPage - 1)}
            />
          </div>
        )}
      </div>

      <PermissionDialog
        user={selectedUser}
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUserId(null)}
      />
    </div>
  );
}

function PermissionDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AdminUserResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    data: availablePermissions = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useAvailablePermissions();
  const grantMutation = useGrantPermission();
  const revokeMutation = useRevokePermission();

  if (!user) return null;

  const handleTogglePermission = (
    permissionId: string,
    hasPermission: boolean,
  ) => {
    if (hasPermission) {
      revokeMutation.mutate({ userId: user.id, permission: permissionId });
    } else {
      grantMutation.mutate({ userId: user.id, permission: permissionId });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quản lý phân quyền</DialogTitle>
          <DialogDescription>
            Tài khoản:{" "}
            <span className="font-semibold text-foreground">{user.email}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 flex flex-col gap-3">
          {isLoading && (
            <p
              role="status"
              className="py-4 text-center text-sm text-muted-foreground"
            >
              Đang tải quyền hạn…
            </p>
          )}
          {isError && (
            <div role="alert" className="space-y-3 py-4 text-center">
              <p className="text-sm text-muted-foreground">
                Không thể tải danh sách quyền.
              </p>
              <Button
                variant="outline"
                disabled={isFetching}
                onClick={() => void refetch()}
              >
                Thử lại
              </Button>
            </div>
          )}
          {!isLoading && !isError && availablePermissions.length === 0 && (
            <div className="text-center text-sm text-muted-foreground italic py-4">
              Không có quyền hạn nào được định nghĩa
            </div>
          )}
          {!isLoading &&
            !isError &&
            availablePermissions.map((permission) => {
              const hasPermission = user.permissions.includes(permission.id);
              return (
                <div
                  key={permission.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 border rounded-lg bg-muted/20"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                      {hasPermission ? (
                        <Shield className="w-5 h-5" />
                      ) : (
                        <ShieldAlert className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <span className="break-all font-medium text-sm">
                        {permission.id}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {permission.description}
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="min-h-11"
                    variant={hasPermission ? "destructive" : "default"}
                    onClick={() =>
                      handleTogglePermission(permission.id, hasPermission)
                    }
                    loading={
                      grantMutation.isPending || revokeMutation.isPending
                    }
                  >
                    {hasPermission ? (
                      "Thu hồi"
                    ) : (
                      "Cấp quyền"
                    )}
                  </Button>
                </div>
              );
            })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
