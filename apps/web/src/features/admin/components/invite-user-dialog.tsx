import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreationDialog } from "@/components/ui/creation-dialog";
import { FormField } from "@/components/ui/form-field";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { parseApiError } from "@/lib/api-error";
import { useInviteUser } from "../hooks/use-admin-users";
import type { InviteUserRequest, InviteUserResponse } from "../types/admin.types";

const schema = z.object({
  fullName: z.string().trim().min(1, "Vui lòng nhập họ tên").max(120, "Tối đa 120 ký tự"),
  email: z.string().trim().email("Email chưa hợp lệ").max(100, "Tối đa 100 ký tự"),
  username: z.string().trim().min(3, "Tên đăng nhập cần ít nhất 3 ký tự").max(100, "Tối đa 100 ký tự"),
  role: z.enum(["STUDENT", "LECTURER", "ADMIN"]),
});

export function InviteUserDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (result: InviteUserResponse) => void }) {
  const invite = useInviteUser();
  const errorRef = useRef<HTMLParagraphElement>(null);
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<InviteUserRequest>({ resolver: zodResolver(schema), defaultValues: { fullName: "", email: "", username: "", role: "LECTURER" } });
  useEffect(() => { if (invite.isError) errorRef.current?.focus(); }, [invite.isError]);
  return <CreationDialog className="creation-dialog--compact" open onOpenChange={open => { if (!open) onClose(); }} title="Mời tài khoản" description="Tạo tài khoản và gửi liên kết đặt mật khẩu dùng một lần đến email người nhận. Tài khoản chỉ được kích hoạt sau khi người nhận hoàn tất." dirty={isDirty} busy={invite.isPending}>
    {close => <form noValidate className="space-y-4" aria-busy={invite.isPending} onSubmit={handleSubmit(async values => { try { onCreated(await invite.mutateAsync(values)); } catch { /* Keep entered values and show the server failure below. */ } })}>
      <FormField id="invite-full-name" label="Họ và tên" autoComplete="off" required maxLength={120} disabled={invite.isPending} error={errors.fullName?.message} {...register("fullName")} />
      <FormField id="invite-email" label="Email nhận lời mời" type="email" autoComplete="off" required maxLength={100} disabled={invite.isPending} error={errors.email?.message} {...register("email")} />
      <FormField id="invite-username" label="Tên đăng nhập" autoComplete="off" required maxLength={100} disabled={invite.isPending} error={errors.username?.message} {...register("username")} />
      <label className="flex flex-col gap-2 text-sm" htmlFor="invite-role">Vai trò<NativeSelect id="invite-role" disabled={invite.isPending} {...register("role")}><option value="LECTURER">Giảng viên</option><option value="STUDENT">Sinh viên</option><option value="ADMIN">Quản trị viên</option></NativeSelect></label>
      {errors.role && <p role="alert" className="text-sm text-destructive">Vui lòng chọn vai trò.</p>}
      <p className="text-sm text-muted-foreground">Vai trò quyết định quyền truy cập khi tài khoản được kích hoạt. Kiểm tra email và vai trò trước khi gửi.</p>
      {invite.isError && <p ref={errorRef} tabIndex={-1} role="alert" className="text-sm text-destructive">
        {parseApiError(invite.error).status === 409 ? "Email hoặc tên đăng nhập đã được sử dụng. Kiểm tra danh sách tài khoản trước khi tạo lời mời khác." : "Chưa xác nhận được kết quả tạo lời mời. Nội dung được giữ nguyên. Nếu kết nối bị ngắt, hãy kiểm tra danh sách tài khoản trước khi thử lại."}
      </p>}
      <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" disabled={invite.isPending} onClick={close}>Hủy</Button><Button type="submit" loading={invite.isPending}>Tạo lời mời</Button></div>
    </form>}
  </CreationDialog>;
}
