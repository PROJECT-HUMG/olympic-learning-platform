import { useState } from "react";
import { useAdminUsers, useGrantPermission, useRevokePermission, useAvailablePermissions } from "@/features/admin/hooks/use-admin-users";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppPagination } from "@/components/ui/app-pagination";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Shield, ShieldAlert, Loader2, Search } from "lucide-react";
import type { AdminUserResponse } from "@/features/admin/types/admin.types";
import { useDebounce } from "@/hooks/use-debounce";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(0);
  
  const { data, isLoading } = useAdminUsers({
    search: debouncedSearch,
    page,
    size: 10,
  });

  const [selectedUser, setSelectedUser] = useState<AdminUserResponse | null>(null);

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý người dùng</h1>
          <p className="text-muted-foreground mt-1">Quản lý tài khoản và phân quyền hệ thống</p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
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

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden flex flex-col min-h-[400px]">
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
            ) : !data || data.content.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">
                  Không tìm thấy người dùng nào.
                </TableCell>
              </TableRow>
            ) : (
              data.content.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary border shrink-0">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          (user.fullName || user.username || "U")[0].toUpperCase()
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{user.fullName || user.username}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.permissions.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">Không có</span>
                      ) : (
                        user.permissions.map(p => (
                          <Badge key={p} variant="outline" className="text-[10px] py-0">{p}</Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(user.createdAt), "dd/MM/yyyy", { locale: vi })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedUser(user)}
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
              currentPage={page}
              totalPages={data.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <PermissionDialog 
        user={selectedUser} 
        open={!!selectedUser} 
        onOpenChange={(open) => !open && setSelectedUser(null)} 
      />
    </div>
  );
}

function PermissionDialog({ user, open, onOpenChange }: { user: AdminUserResponse | null, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { data: availablePermissions = [] } = useAvailablePermissions();
  const grantMutation = useGrantPermission();
  const revokeMutation = useRevokePermission();

  if (!user) return null;

  const handleTogglePermission = (permissionId: string, hasPermission: boolean) => {
    if (hasPermission) {
      revokeMutation.mutate({ userId: user.id, permission: permissionId });
    } else {
      grantMutation.mutate({ userId: user.id, permission: permissionId });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quản lý phân quyền</DialogTitle>
          <DialogDescription>
            Tài khoản: <span className="font-semibold text-foreground">{user.email}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 flex flex-col gap-3">
          {availablePermissions.length === 0 && (
            <div className="text-center text-sm text-muted-foreground italic py-4">
              Không có quyền hạn nào được định nghĩa
            </div>
          )}
          {availablePermissions.map((permission) => {
            const hasPermission = user.permissions.includes(permission.id);
            return (
              <div key={permission.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full text-primary">
                    {hasPermission ? <Shield className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{permission.id}</span>
                    <span className="text-xs text-muted-foreground">{permission.description}</span>
                  </div>
                </div>
                
                <Button 
                  size="sm"
                  variant={hasPermission ? "destructive" : "default"}
                  onClick={() => handleTogglePermission(permission.id, hasPermission)}
                  disabled={grantMutation.isPending || revokeMutation.isPending}
                >
                  {grantMutation.isPending || revokeMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : hasPermission ? (
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
