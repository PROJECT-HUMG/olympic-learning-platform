const allowedFiles = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export function validateRecognitionFiles(files: File[], photos = false): string | null {
  if (!files.length) return photos ? "Chọn ảnh để tải lên." : "Cần ít nhất một file minh chứng.";
  if (files.length > (photos ? 10 : 3)) return photos ? "Mỗi album tối đa 10 ảnh." : "Mỗi hồ sơ tối đa 3 file minh chứng.";
  if (files.some(file => !(photos ? allowedFiles.slice(0, 3) : allowedFiles).includes(file.type))) return photos ? "Ảnh cần là JPEG, PNG hoặc WebP." : "Minh chứng cần là JPEG, PNG, WebP hoặc PDF.";
  if (files.some(file => !file.size || file.size > 5 * 1024 * 1024)) return "Mỗi file cần có nội dung và không quá 5 MB.";
  if (files.reduce((sum, file) => sum + file.size, 0) > 15 * 1024 * 1024) return "Tổng dung lượng mỗi lần gửi không quá 15 MB.";
  return null;
}
