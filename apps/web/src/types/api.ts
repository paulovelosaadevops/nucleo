export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiErrorPayload {
  timestamp?: string;
  status?: number;
  error?: string;
  code?: string;
  message?: string;
  path?: string;
  validationErrors?: ValidationError[];
  fieldErrors?: ValidationError[];
  errors?: ValidationError[];
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}