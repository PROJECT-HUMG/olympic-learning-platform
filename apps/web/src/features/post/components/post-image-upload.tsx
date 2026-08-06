import { useState, useRef } from "react";
import { Loader2, X, UploadCloud } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { storageService } from "@/features/documents/services/storage.service";
import { toast } from "sonner";

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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Định dạng không hợp lệ", {
        description: "Vui lòng chọn một tệp hình ảnh (JPEG, PNG, v.v.)",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Tệp quá lớn", {
        description: "Kích thước ảnh tối đa là 5MB.",
      });
      return;
    }

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
    if (!isUploading) {
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
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
            <Button 
              type="button" 
              variant="secondary" 
              size="sm" 
              onClick={triggerFileInput}
              className="h-8"
            >
              Thay đổi ảnh
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              size="icon" 
              onClick={handleRemove}
              className="absolute top-2 right-2 h-7 w-7 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div 
          onClick={triggerFileInput}
          className={`relative aspect-video w-full rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center p-6 text-center cursor-pointer ${isUploading ? 'pointer-events-none bg-muted/30' : ''}`}
        >
          {isUploading ? (
            <div className="w-full flex flex-col items-center justify-center space-y-4 px-8">
              <div className="p-3 bg-primary/10 text-primary rounded-full animate-pulse">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <div className="w-full space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground font-medium">
                  <span>Đang tải lên...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2 w-full" />
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 bg-primary/5 text-primary/70 rounded-full mb-3">
                <UploadCloud className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                Nhấn để tải ảnh lên
              </p>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                Hỗ trợ JPEG, PNG. Kích thước tối đa 5MB. Khuyên dùng ảnh tỉ lệ 16:9.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
