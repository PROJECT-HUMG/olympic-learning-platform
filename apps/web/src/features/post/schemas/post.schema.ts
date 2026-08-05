import { z } from "zod";

export const CreatePostSchema = z.object({
  title: z
    .string()
    .min(1, "Tiêu đề không được để trống")
    .max(255, "Tiêu đề không được vượt quá 255 ký tự"),
  summary: z
    .string()
    .max(500, "Mô tả ngắn không được vượt quá 500 ký tự")
    .optional(),
  content: z.string().min(1, "Nội dung không được để trống"),
  thumbnailId: z.string().uuid("ID ảnh thu nhỏ không hợp lệ").optional().nullable(),
  type: z.enum(["BLOG", "NEWS", "ANNOUNCEMENT"], {
    message: "Vui lòng chọn loại bài viết",
  }),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"], {
    message: "Vui lòng chọn trạng thái",
  }),
  publishedAt: z.iso.datetime({ message: "Định dạng thời gian không hợp lệ" }).optional().nullable(),
});

// Assuming PUT requires the same fields as POST. 
// If it's a PATCH, we could use CreatePostSchema.partial()
export const UpdatePostSchema = CreatePostSchema;

export type CreatePostInput = z.infer<typeof CreatePostSchema>;
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>;
