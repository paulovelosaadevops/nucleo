import type {
  ApiErrorPayload,
  ValidationError,
} from "@/types/api";

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly path?: string;
  readonly validationErrors: ValidationError[];

  constructor(
    message: string,
    status: number,
    payload?: ApiErrorPayload,
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.code = payload?.code;
    this.path = payload?.path;
    this.validationErrors =
      payload?.validationErrors ??
      payload?.fieldErrors ??
      payload?.errors ??
      [];
  }

  static fromPayload(
    status: number,
    statusText: string,
    payload?: ApiErrorPayload,
  ): ApiError {
    const message =
      payload?.message ??
      payload?.error ??
      statusText ??
      "Não foi possível concluir a operação";

    return new ApiError(message, status, payload);
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocorreu um erro inesperado";
}