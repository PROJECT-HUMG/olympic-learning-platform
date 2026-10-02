import { useRef, useState, useEffect } from "react";
import { Trash2, Loader2, Check, X, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useUpdateAvatar, useRemoveAvatar } from "../hooks/use-avatar";
import type { UserProfile } from "../types/user.types";
import { toast } from "sonner";

interface AvatarUploadCardProps {
  user: UserProfile;
}

export function AvatarUploadCard({ user }: AvatarUploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);

  const updateAvatarMutation = useUpdateAvatar();
  const removeAvatarMutation = useRemoveAvatar();

  const isUploading = updateAvatarMutation.isPending;
  const isRemoving = removeAvatarMutation.isPending;
  const isPending = isUploading || isRemoving;

  // Cleanup object URL when previewUrl changes or component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const displayAvatar = previewUrl || user.avatarUrl || "";

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dung lượng file vượt quá giới hạn cho phép (Tối đa 5MB).");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validate image type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Định dạng file không hỗ trợ (chỉ nhận JPG, PNG, WebP).");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Create local preview without uploading yet
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
  }

  function handleCancelPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleSaveAvatar() {
    if (!selectedFile) return;

    updateAvatarMutation.mutate(selectedFile, {
      onSuccess: () => {
        handleCancelPreview();
      },
    });
  }

  function handleRemoveAvatar() {
    removeAvatarMutation.mutate(undefined, {
      onSuccess: () => {
        handleCancelPreview();
      },
    });
  }

  const roleLabels = { STUDENT: "Sinh viên", LECTURER: "Giảng viên", ADMIN: "Quản trị viên" };
  const statusLabels = { ACTIVE: "Hoạt động", PENDING: "Chờ xác thực", DISABLED: "Đã khóa" };

  return (
    <section className="profile-identity" aria-label="Ảnh đại diện và tài khoản">
      <div className="profile-identity__band" aria-hidden="true" />
      <div className="profile-identity__body">
        <div className="profile-identity__portrait">
          <div className="profile-identity__avatar">
            {displayAvatar && failedAvatar !== displayAvatar ? (
              <img src={displayAvatar} alt={user.fullName || user.username} onError={() => setFailedAvatar(displayAvatar)} />
            ) : <span>{(user.fullName || user.username).charAt(0).toUpperCase()}</span>}
            {isPending && <div role="status" aria-label="Đang xử lý ảnh đại diện" className="profile-identity__busy">
              <Loader2 className="size-6 animate-spin" aria-hidden="true" />
            </div>}
          </div>
          {selectedFile && <span className="profile-identity__preview">Xem trước</span>}
        </div>
        <h2 className="profile-identity__name">{user.fullName || user.username}</h2>
        <div className="profile-identity__labels">
          <Badge variant="secondary">{roleLabels[user.role] || user.role}</Badge>
          <Badge variant="outline">{statusLabels[user.status] || user.status}</Badge>
        </div>

        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
          tabIndex={-1} aria-label="Chọn file ảnh đại diện" onChange={handleFileSelect} />
        <div className="profile-identity__actions">
          {selectedFile ? <>
            <Button type="button" size="sm" loading={isUploading} disabled={isPending} onClick={handleSaveAvatar}>
              <Check aria-hidden="true" />Lưu ảnh mới
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={handleCancelPreview}>
              <X aria-hidden="true" />Hủy
            </Button>
          </> : <>
            <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => fileInputRef.current?.click()}>
              <ImagePlus aria-hidden="true" />Chọn ảnh mới
            </Button>
            {user.avatarUrl && <AlertDialog>
              <AlertDialogTrigger asChild><Button type="button" variant="ghost" size="sm" loading={isRemoving} disabled={isPending}>
                <Trash2 aria-hidden="true" />Xóa ảnh
              </Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Xóa ảnh đại diện?</AlertDialogTitle>
                  <AlertDialogDescription>Ảnh hiện tại sẽ được xóa và tài khoản dùng ảnh mặc định.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRemoveAvatar} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Xóa ảnh</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>}
          </>}
        </div>
        <p className="profile-identity__help">{selectedFile ? selectedFile.name : "Ảnh đại diện giúp bạn bè nhận ra bạn trong phòng học."}</p>
        <p className="profile-identity__formats">JPG, PNG hoặc WebP. Tối đa 5 MB.</p>
      </div>
    </section>
  );
}
