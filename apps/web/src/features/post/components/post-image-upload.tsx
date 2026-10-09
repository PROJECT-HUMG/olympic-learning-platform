import { useState, useRef } from "react";
import { Loader2, X, UploadCloud } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { storageService } from "@/features/documents/services/storage.service";
import { toast } from "sonner";
import { validatePostImage } from "../lib/post-image-validation.ts";

interface PostImageUploadProps {
  value?: string;
  onChange: (id: string | null) => void;
  initialPreviewUrl?: string;
}

export function PostImageUpload({ onChange, initialPreviewUrl }: PostImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreviewUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInFlight = useRef(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // Permit choosing the same file after validation/failure.
    if (!file || uploadInFlight.current) return;
    const issue = validatePostImage(file);

    if (issue === "type") {
      toast.error("Định dạng không hợp lệ", {
        description: "Vui lòng chọn một tệp hình ảnh (JPEG, PNG, v.v.)",
      });
      return;
    }

    if (issue === "size") {
      toast.error("Tệp quá lớn", {
        description: "Kích thước ảnh tối đa là 5MB.",
      });
      return;
    }

    uploadInFlight.current = true;
    try {
      setIsUploading(true);
      setProgress(0);
      
      const response = await storageService.uploadFile(file, "POST", (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });
      
      onChange(response.id);
      setPreviewUrl(response.url);
      toast.success("Tải lên thành công");
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Tải lên thất bại", {
        description: "Đã có lỗi xảy ra khi tải ảnh lên. Vui lòng thử lại.",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      uploadInFlight.current = false;
      setIsUploading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const triggerFileInput = () => {
    if (!uploadInFlight.current) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      
      {previewUrl ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border group bg-muted">
          <img 
            src={previewUrl} 
            alt="Thumbnail preview" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
            <Button 
              type="button" 
              variant="secondary" 
              size="sm" 
              onClick={triggerFileInput}
              disabled={isUploading}
              aria-busy={isUploading}
              className="min-h-11"
            >
              {isUploading ? "Đang tải lên…" : "Thay đổi ảnh"}
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              size="icon" 
              onClick={handleRemove}
              disabled={isUploading}
              aria-label="Xóa ảnh đại diện bài viết"
              className="absolute top-2 right-2 size-11 rounded-full"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative aspect-video min-h-44 w-full">
          <Button
            type="button"
            variant="ghost"
            aria-label="Chọn ảnh đại diện bài viết"
            aria-busy={isUploading}
            disabled={isUploading}
            onClick={triggerFileInput}
            className="h-full min-h-44 w-full flex-col gap-0 whitespace-normal rounded-xl border-2 border-dashed border-muted-foreground/25 p-6 text-center hover:border-primary/50 hover:bg-muted/50"
          >
            {isUploading ? (
              <>
                <Loader2 aria-hidden="true" className="mb-3 size-6 animate-spin text-primary" />
                <span className="text-sm">Đang tải lên… {progress}%</span>
              </>
            ) : (
              <>
                <span className="mb-3 rounded-full bg-primary/5 p-4 text-primary/70">
                  <UploadCloud aria-hidden="true" className="size-8" />
                </span>
                <span className="mb-1 text-sm font-medium text-foreground">Nhấn để tải ảnh lên</span>
                <span className="max-w-[200px] text-xs font-normal text-muted-foreground">
                  Hỗ trợ JPEG, PNG. Kích thước tối đa 5MB. Khuyên dùng ảnh tỉ lệ 16:9.
                </span>
              </>
            )}
          </Button>
          {isUploading && <Progress aria-label="Tiến trình tải ảnh" value={progress} className="absolute inset-x-6 bottom-6 h-2 w-auto" />}
        </div>
      )}
    </div>
  );
}
