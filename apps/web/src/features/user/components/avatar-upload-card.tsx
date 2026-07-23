import { useRef, useState } from "react";
import { Upload, Trash2, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpdateAvatar, useRemoveAvatar } from "../hooks/use-avatar";
import type { UserProfile } from "../types/user.types";

interface AvatarUploadCardProps {
  user: UserProfile;
}

export function AvatarUploadCard({ user }: AvatarUploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const updateAvatarMutation = useUpdateAvatar();
  const removeAvatarMutation = useRemoveAvatar();

  const isUploading = updateAvatarMutation.isPending;
  const isRemoving = removeAvatarMutation.isPending;
  const isPending = isUploading || isRemoving;

  const currentAvatar = previewUrl || user.avatarUrl || "";

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Kích thước file không được vượt quá 5MB.");
      return;
    }

    // Create local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Upload
    updateAvatarMutation.mutate(file, {
      onSettled: () => {
        setPreviewUrl(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      },
    });
  }

  function handleRemoveAvatar() {
    if (confirm("Bạn có chắc chắn muốn xóa ảnh đại diện hiện tại?")) {
      removeAvatarMutation.mutate();
    }
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
        {/* Avatar Display */}
        <div className="relative group">
          <div className="relative size-28 overflow-hidden rounded-full border-2 border-border/80 bg-muted shadow-inner sm:size-32">
            {currentAvatar ? (
              <img
                src={currentAvatar}
                alt={user.fullName || user.username}
                className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-primary/10 text-2xl font-bold text-primary">
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

          <button
            type="button"
            disabled={isPending}
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 flex size-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md hover:bg-accent transition-colors disabled:opacity-50"
            title="Đổi ảnh đại diện"
          >
            <Camera className="size-4" />
          </button>
        </div>

        {/* Actions & Hints */}
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={isUploading}
              disabled={isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 size-4" />
              Tải ảnh lên
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
          </div>
        </div>
      </div>
    </div>
  );
}
