import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { generateCodeFromName } from "@/lib/string-utils";

const formSchema = z.object({
  code: z.string().min(1, "Mã không được để trống").max(50, "Tối đa 50 ký tự"),
  name: z.string().min(1, "Tên không được để trống").max(255, "Tối đa 255 ký tự"),
  description: z.string().max(1000, "Tối đa 1000 ký tự").optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SystemCategoryFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initialData?: {
    code: string;
    name: string;
    description?: string;
  } | null;
  onSubmit: (data: FormValues) => void;
  isPending?: boolean;
  hideDescription?: boolean;
}

export function SystemCategoryFormModal({
  open,
  onOpenChange,
  title,
  initialData,
  onSubmit,
  isPending,
  hideDescription,
}: SystemCategoryFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    clearErrors,
    formState: { errors, dirtyFields },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
    },
  });

  const nameValue = watch("name");

  useEffect(() => {
    if (open && !initialData && !dirtyFields.code && nameValue !== undefined) {
      if (nameValue) {
        setValue("code", generateCodeFromName(nameValue), { shouldValidate: true });
      } else {
        setValue("code", "");
        clearErrors("code");
      }
    }
  }, [nameValue, initialData, dirtyFields.code, setValue, clearErrors, open]);

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          code: initialData.code,
          name: initialData.name,
          description: initialData.description || "",
        });
      } else {
        reset({
          code: "",
          name: "",
          description: "",
        });
      }
    }
  }, [open, initialData, reset]);

  const onSubmitForm = (values: FormValues) => {
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form noValidate onSubmit={handleSubmit(onSubmitForm)} className="space-y-4 pt-4">
          <FormField
            id="name"
            label="Tên"
            placeholder="Nhập tên..."
            disabled={isPending}
            error={errors.name?.message}
            {...register("name")}
          />
          <FormField
            id="code"
            label="Mã"
            placeholder="Nhập mã..."
            disabled={isPending}
            error={errors.code?.message}
            {...register("code")}
          />
          {!hideDescription && (
            <div className="space-y-1.5">
              <label htmlFor="description" className="text-sm font-medium text-foreground cursor-pointer select-none">
                Mô tả
              </label>
              <Textarea
                id="description"
                placeholder="Nhập mô tả (không bắt buộc)..."
                className="resize-none"
                disabled={isPending}
                {...register("description")}
                aria-invalid={Boolean(errors.description)}
              />
              {errors.description && (
                <p role="alert" className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>
          )}
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
