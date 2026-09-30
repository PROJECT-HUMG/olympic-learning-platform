import { useState } from "react";
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
import type {
  CreateDocumentRequest,
  UpdateDocumentRequest,
  DocumentResponse,
} from "@/features/documents/types/documents.types";
import { useDocumentMetadata } from "@/features/documents/hooks/use-documents";
import { useUploadFile } from "@/features/documents/hooks/use-storage";
import { UploadDropzone } from "@/features/documents/components/upload-dropzone";
import { Loader2 } from "lucide-react";
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
  onCancel: () => void;
  isLoading?: boolean;
}

export function DocumentForm({ initialData, onSubmit, onCancel, isLoading }: DocumentFormProps) {
  const isEditMode = !!initialData;
  const { data: metadata } = useDocumentMetadata();
  const uploadFile = useUploadFile();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

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

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setUploadError(null);
    setUploadedFileId(null);
    setUploadProgress(0);

    uploadFile.mutate(
      {
        file,
        folder: "DOCUMENT",
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            setUploadProgress(percentCompleted);
          }
        },
      },
      {
        onSuccess: (res) => {
          setUploadedFileId(res.id);
        },
        onError: (err: any) => {
          setUploadError(
            err.response?.data?.message || "Lỗi tải lên tệp",
          );
          setSelectedFile(null);
        },
      },
    );
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setUploadedFileId(null);
    setUploadError(null);
    setUploadProgress(0);
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
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 w-full">
      <div className={cn("grid gap-8", !isEditMode ? "lg:grid-cols-2" : "lg:grid-cols-1")}>
        {/* Left Column: Form Fields */}
        <div className="space-y-6 max-w-3xl">
          {/* Title */}
          <div className="space-y-2">
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

          <div className="grid gap-6 sm:grid-cols-3">
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

            {/* Tag */}
            <div className="space-y-2">
              <Label>Thẻ phân loại</Label>
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
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả chi tiết</Label>
            <Textarea
              id="description"
              placeholder="Nhập mô tả về tài liệu này..."
              className="min-h-[120px] resize-y"
              {...form.register("description")}
            />
          </div>
        </div>

        {/* Right Column: File Upload (Only Create Mode) */}
        {!isEditMode && (
          <div className="space-y-2">
            <Label>Tệp đính kèm <span className="text-destructive">*</span></Label>

            <UploadDropzone
              onFileSelect={handleFileSelect}
              onClear={handleClearFile}
              progress={uploadProgress}
              isPending={uploadFile.isPending}
              selectedFile={selectedFile}
              uploadedFileId={uploadedFileId}
              error={uploadError}
              accept=".pdf"
              maxSizeMB={50}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
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
