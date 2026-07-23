import { useRef, useState, useEffect } from "react";
import { Trash2, Loader2, Check, X, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    if (confirm("Bạn có chắc chắn muốn xóa ảnh đại diện hiện tại?")) {
      removeAvatarMutation.mutate(undefined, {
        onSuccess: () => {
          handleCancelPreview();
        },
      });
    }
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
        {/* Avatar Display */}
        <div className="relative shrink-0">
          <div className="relative size-28 overflow-hidden rounded-full border-2 border-border/80 bg-muted shadow-inner sm:size-32">
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt={user.fullName || user.username}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-primary/10 text-3xl font-bold text-primary">
                {(user.fullName || user.username).charAt(0).toUpperCase()}
              </div>
            )}

            {isPending && (
              <div
                role="progressbar"
                aria-label="Đang xử lý ảnh đại diện"
                className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-xs"
              >
                <Loader2 className="size-6 animate-spin text-white" aria-hidden="true" />
              </div>
            )}
          </div>

          {selectedFile && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-xs">
              Xem trước
            </span>
          )}
        </div>

        {/* Actions & Description */}
        <div className="flex-1 space-y-3 text-center sm:text-left">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Ảnh Đại Diện
            </h3>
            <p className="text-sm text-muted-foreground">
              Hỗ trợ định dạng JPG, PNG hoặc WebP. Dung lượng tối đa 5MB.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
          />

          <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            {selectedFile ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  loading={isUploading}
                  disabled={isPending}
                  onClick={handleSaveAvatar}
                >
                  <Check className="mr-2 size-4" />
                  Lưu ảnh mới
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={handleCancelPreview}
                >
                  <X className="mr-2 size-4" />
                  Hủy
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="mr-2 size-4" />
                  Chọn ảnh mới
                </Button>

                {user.avatarUrl && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    loading={isRemoving}
                    disabled={isPending}
                    onClick={handleRemoveAvatar}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Xóa ảnh
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
