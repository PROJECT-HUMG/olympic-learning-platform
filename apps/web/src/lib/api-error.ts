export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  code?: string;
  messageKey?: string;
  invalidParams?: Array<{ field: string; message: string }>;
  errors?: Record<string, string[]>;
}

export const ERROR_MESSAGE_MAP: Record<string, string> = {
  "error.validation": "Dữ liệu nhập vào không hợp lệ.",
  "error.auth.required": "Vui lòng đăng nhập để tiếp tục.",
  "error.auth.invalidCredentials": "Email hoặc mật khẩu không chính xác.",
  "error.auth.refreshMissing": "Thiếu phiên đăng nhập.",
  "error.auth.refreshInvalid": "Phiên đăng nhập không hợp lệ.",
  "error.auth.refreshExpired": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  "error.auth.registrationDisabled": "Chức năng đăng ký tạm thời bị đóng.",
  "error.auth.emailNotVerified": "Email chưa được xác thực. Vui lòng kiểm tra hộp thư.",
  "error.auth.emailTokenMissing": "Thiếu mã xác thực email.",
  "error.auth.emailTokenInvalid": "Mã xác thực email không hợp lệ.",
  "error.auth.emailTokenExpired": "Mã xác thực email đã hết hạn. Vui lòng yêu cầu gửi lại.",
  "error.user.disabled": "Tài khoản của bạn đã bị vô hiệu hóa.",
  "error.accessDenied": "Bạn không có quyền thực hiện thao tác này.",
  "error.resource.notFound": "Không tìm thấy tài nguyên yêu cầu.",
  "error.resource.duplicate": "Email hoặc Tên đăng nhập đã được sử dụng.",
  "error.resource.invalidName": "Tên không hợp lệ.",
  "error.auth.invalidCurrentPassword": "Mật khẩu hiện tại không chính xác.",
  "error.storage.uploadFailed": "Tải file lên thất bại. Vui lòng thử lại sau.",
  "error.storage.fileNotFound": "Không tìm thấy file yêu cầu.",
  "error.storage.typeNotAllowed": "Định dạng file không được hỗ trợ.",
  "error.storage.tooLarge": "Dung lượng file vượt quá giới hạn cho phép (Tối đa 5MB).",
  "error.internal": "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
};

export class ApiError extends Error {
  public readonly status: number;
  public readonly title: string;
  public readonly detail: string;
  public readonly code?: string;
  public readonly messageKey?: string;
  public readonly errors?: Record<string, string[]>;

  constructor(problem: ProblemDetail) {
    const mappedDetail =
      (problem.messageKey && ERROR_MESSAGE_MAP[problem.messageKey]) ||
      problem.detail ||
      "Đã xảy ra lỗi. Vui lòng thử lại.";

    super(mappedDetail);
    this.name = "ApiError";
    this.status = problem.status || 500;
    this.title = problem.title || "Lỗi Hệ Thống";
    this.detail = mappedDetail;
    this.code = problem.code;
    this.messageKey = problem.messageKey;
    this.errors = problem.errors;
  }
}

export function parseApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  const axiosError = error as {
    response?: { data?: ProblemDetail; status?: number };
  };

  if (axiosError.response?.data?.messageKey || axiosError.response?.data?.title) {
    return new ApiError(axiosError.response.data);
  }

  return new ApiError({
    type: "about:blank",
    title: "Unexpected Error",
    status: axiosError.response?.status || 500,
    detail: "Đã xảy ra lỗi không xác định. Vui lòng thử lại.",
  });
}
