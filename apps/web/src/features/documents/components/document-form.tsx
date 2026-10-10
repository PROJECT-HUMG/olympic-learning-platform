import { useState, useEffect, useRef } from "react";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type {
  CreateDocumentRequest,
  UpdateDocumentRequest,
  DocumentResponse,
} from "@/features/documents/types/documents.types";
import { useDocumentMetadata } from "@/features/documents/hooks/use-documents";
import { useUploadFile } from "@/features/documents/hooks/use-storage";
import { UploadDropzone } from "@/features/documents/components/upload-dropzone";
import { cn } from "@/lib/utils";
import type { CreationState } from "@/components/ui/creation-dialog";

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
  onStateChange?: (state: CreationState) => void;
}

export function DocumentForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  onStateChange,
}: DocumentFormProps) {
  const isEditMode = !!initialData;
  const metadataQuery = useDocumentMetadata();
  const metadata = metadataQuery.data;
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

  const isDirty = form.formState.isDirty || !!selectedFile || !!uploadedFileId || !!uploadError;
  const isBusy = !!isLoading || uploadFile.isPending;

  const lastReportedState = useRef<CreationState | null>(null);
  useEffect(() => {
    if (
      !lastReportedState.current ||
      lastReportedState.current.dirty !== isDirty ||
      lastReportedState.current.busy !== isBusy
    ) {
      lastReportedState.current = { dirty: isDirty, busy: isBusy };
      onStateChange?.({ dirty: isDirty, busy: isBusy });
    }
  }, [isDirty, isBusy, onStateChange]);

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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="min-w-0 space-y-5 sm:space-y-8 w-full">
        <div className={cn("grid min-w-0 grid-cols-1 gap-5 sm:gap-8", !isEditMode ? "lg:grid-cols-2" : "lg:grid-cols-1")}>
          {/* Left Column: Form Fields */}
          <div className="min-w-0 space-y-4 sm:space-y-6 max-w-3xl">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Tiêu đề tài liệu <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tiêu đề..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {metadataQuery.isPending && <p role="status" className="text-sm text-muted-foreground">Đang tải danh mục, môn học và thẻ…</p>}
            {metadataQuery.isError && (
              <div role="alert" className="space-y-2 text-sm text-muted-foreground">
                <p>Chưa tải được danh mục, môn học và thẻ.</p>
                <Button type="button" variant="outline" disabled={metadataQuery.isFetching} onClick={() => void metadataQuery.refetch()}>Thử lại bộ chọn</Button>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-3">
              {/* Category */}
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Phân loại <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      disabled={metadataQuery.isPending || metadataQuery.isError}
                      value={field.value}
                      onValueChange={(val) => form.setValue("categoryId", val, { shouldValidate: true, shouldDirty: true })}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn danh mục" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {metadata?.categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Subject */}
              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Môn học <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      disabled={metadataQuery.isPending || metadataQuery.isError}
                      value={field.value}
                      onValueChange={(val) => form.setValue("subjectId", val, { shouldValidate: true, shouldDirty: true })}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn môn học" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {metadata?.subjects.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tag */}
              <FormField
                control={form.control}
                name="tagIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thẻ phân loại</FormLabel>
                    <Select
                      disabled={metadataQuery.isPending || metadataQuery.isError}
                      value={field.value?.[0] || ""}
                      onValueChange={(val) => form.setValue("tagIds", [val], { shouldValidate: true, shouldDirty: true })}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn thẻ..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {metadata?.tags.map((tag) => (
                          <SelectItem key={tag.id} value={tag.id}>
                            {tag.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả chi tiết</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nhập mô tả về tài liệu này..."
                      className="min-h-[120px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Right Column: File Upload (Only Create Mode) */}
          {!isEditMode && (
            <div className="min-w-0 space-y-2">
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

        <div className="flex flex-col-reverse gap-3 pt-4 border-t sm:flex-row sm:flex-wrap sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isBusy}
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            loading={isLoading}
            disabled={
              uploadFile.isPending ||
              (!isEditMode && !uploadedFileId)
            }
          >
            {isEditMode ? "Lưu thay đổi" : "Tạo tài liệu"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
