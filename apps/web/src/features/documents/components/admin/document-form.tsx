import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import type {
  CreateDocumentRequest,
  UpdateDocumentRequest,
  DocumentResponse,
} from "@/features/documents/types/documents.types";
import { useDocumentMetadata } from "@/features/documents/hooks/use-documents";
import { useUploadFile } from "@/features/documents/hooks/use-storage";
import { UploadCloud, File, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống").max(255),
  description: z.string().max(5000).optional(),
  categoryId: z.string().min(1, "Vui lòng chọn danh mục"),
  subjectId: z.string().min(1, "Vui lòng chọn môn học"),
  // Note: Tag is optional in UI for simplicity, but backend requires at least 1? 
  // Let's assume tagIds is an array of strings. We'll use a simple select for now (1 tag) or multi-select if available.
  // Since standard Select is single, we'll just pick the first tag or empty array for now.
  tagIds: z.array(z.string()).optional(), 
});

type FormValues = z.infer<typeof formSchema>;

interface DocumentFormProps {
  initialData?: DocumentResponse;
  onSubmit: (data: CreateDocumentRequest | UpdateDocumentRequest) => void;
  isLoading?: boolean;
}

export function DocumentForm({ initialData, onSubmit, isLoading }: DocumentFormProps) {
  const isEditMode = !!initialData;
  const { data: metadata } = useDocumentMetadata();
  const uploadFile = useUploadFile();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      categoryId: initialData?.category?.id || "",
      subjectId: initialData?.subject?.id || "",
      tagIds: initialData?.tags?.map((t) => t.id) || [],
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadError(null);
    setUploadedFileId(null);
    setUploadProgress(0);

    // Auto upload immediately
    uploadFile.mutate(
      { 
        file, 
        folder: "DOCUMENT",
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      },
      {
        onSuccess: (res) => {
          setUploadedFileId(res.id);
        },
        onError: (err: any) => {
          setUploadError(err.response?.data?.message || "Lỗi tải lên tệp");
          setSelectedFile(null);
        },
      }
    );
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setUploadedFileId(null);
    setUploadError(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (values: FormValues) => {
    if (!isEditMode && !uploadedFileId) {
      setUploadError("Vui lòng tải lên tệp tài liệu");
      return;
    }

    const tagIds = values.tagIds || [];
    // If backend requires @NotEmpty for tags but user didn't select, we might pass a default or handle it.
    // For now, pass what we have.

    if (isEditMode) {
      onSubmit({
        title: values.title,
        description: values.description || "",
        categoryId: values.categoryId,
        subjectId: values.subjectId,
        tagIds: tagIds,
      } as UpdateDocumentRequest);
    } else {
      onSubmit({
        title: values.title,
        description: values.description || "",
        categoryId: values.categoryId,
        subjectId: values.subjectId,
        tagIds: tagIds,
        fileId: uploadedFileId!,
      } as CreateDocumentRequest);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 max-w-3xl">
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Title */}
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="title">Tiêu đề tài liệu <span className="text-destructive">*</span></Label>
          <Input
            id="title"
            placeholder="Nhập tiêu đề..."
            {...form.register("title")}
          />
          {form.formState.errors.title && (
            <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label>Phân loại <span className="text-destructive">*</span></Label>
          <Select
            value={form.watch("categoryId")}
            onValueChange={(val) => form.setValue("categoryId", val, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn danh mục" />
            </SelectTrigger>
            <SelectContent>
              {metadata?.categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.categoryId && (
            <p className="text-sm text-destructive">{form.formState.errors.categoryId.message}</p>
          )}
        </div>

        {/* Subject */}
        <div className="space-y-2">
          <Label>Môn học <span className="text-destructive">*</span></Label>
          <Select
            value={form.watch("subjectId")}
            onValueChange={(val) => form.setValue("subjectId", val, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn môn học" />
            </SelectTrigger>
            <SelectContent>
              {metadata?.subjects.map((sub) => (
                <SelectItem key={sub.id} value={sub.id}>
                  {sub.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.subjectId && (
            <p className="text-sm text-destructive">{form.formState.errors.subjectId.message}</p>
          )}
        </div>

        {/* Tag (Simplified as Single Select for now, ideally Multi-Select) */}
        <div className="sm:col-span-2 space-y-2">
          <Label>Thẻ phân loại (Tag)</Label>
          <Select
            value={form.watch("tagIds")?.[0] || ""}
            onValueChange={(val) => form.setValue("tagIds", [val], { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn thẻ..." />
            </SelectTrigger>
            <SelectContent>
              {metadata?.tags.map((tag) => (
                <SelectItem key={tag.id} value={tag.id}>
                  {tag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Tạm thời chỉ hỗ trợ chọn 1 thẻ.</p>
        </div>

        {/* Description */}
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="description">Mô tả chi tiết</Label>
          <Textarea
            id="description"
            placeholder="Nhập mô tả về tài liệu này..."
            className="min-h-[120px] resize-y"
            {...form.register("description")}
          />
        </div>

        {/* File Upload (Only Create Mode) */}
        {!isEditMode && (
          <div className="sm:col-span-2 space-y-2">
            <Label>Tệp đính kèm <span className="text-destructive">*</span></Label>
            
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors",
                uploadError ? "border-destructive/50 bg-destructive/5" : "border-border hover:bg-muted/50 hover:border-primary/50",
                selectedFile && !uploadError ? "bg-muted/30 border-solid" : ""
              )}
            >
              {selectedFile ? (
                <div className="flex items-center gap-4 w-full max-w-md bg-background p-4 rounded-lg border shadow-sm">
                  <div className="h-10 w-10 shrink-0 bg-primary/10 text-primary rounded flex items-center justify-center">
                    <File className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {uploadFile.isPending && (
                      <div className="flex items-center gap-2">
                        <Progress value={uploadProgress} className="h-1.5" />
                        <span className="text-xs font-medium min-w-[3ch]">{uploadProgress}%</span>
                      </div>
                    )}
                  </div>
                  {!uploadFile.isPending && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      onClick={handleClearFile}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                    <UploadCloud className="size-6" />
                  </div>
                  <p className="text-sm font-medium mb-1">Kéo thả tệp vào đây hoặc nhấp để tải lên</p>
                  <p className="text-xs text-muted-foreground mb-4">Hỗ trợ PDF, DOCX, ZIP (Tối đa 50MB)</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Chọn tệp
                  </Button>
                </>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.zip,.rar"
              />
            </div>
            
            {uploadError && (
              <p className="text-sm text-destructive font-medium">{uploadError}</p>
            )}
            {uploadedFileId && !uploadFile.isPending && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Tải lên thành công!</p>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          disabled={isLoading || uploadFile.isPending}
        >
          Hủy bỏ
        </Button>
        <Button
          type="submit"
          disabled={
            isLoading || 
            uploadFile.isPending || 
            (!isEditMode && !uploadedFileId)
          }
        >
          {isLoading && <Loader2 className="size-4 mr-2 animate-spin" />}
          {isEditMode ? "Lưu thay đổi" : "Tạo tài liệu"}
        </Button>
      </div>
    </form>
  );
}
