export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly title: string;
  public readonly detail: string;
  public readonly errors?: Record<string, string[]>;

  constructor(problem: ProblemDetail) {
    super(problem.detail);
    this.name = "ApiError";
    this.status = problem.status;
    this.title = problem.title;
    this.detail = problem.detail;
    this.errors = problem.errors;
  }
}

export function parseApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  const axiosError = error as {
    response?: { data?: ProblemDetail; status?: number };
  };

  if (axiosError.response?.data?.title) {
    return new ApiError(axiosError.response.data);
  }

  return new ApiError({
    type: "about:blank",
    title: "Unexpected Error",
    status: axiosError.response?.status || 500,
    detail: "An unexpected error occurred. Please try again.",
  });
}
