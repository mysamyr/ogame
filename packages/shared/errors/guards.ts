import { AppError } from './app-error.js';
import { ErrorCode } from './codes.js';
import {
  BadRequestError,
  ConflictError,
  InternalServerError,
  NotFoundError,
  ValidationError,
} from './domain-errors.js';
import type { ApiErrorPayload } from './payload.js';

export function isApiError(data: unknown): data is ApiErrorPayload {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const candidate = data as Record<string, unknown>;

  return (
    typeof candidate.code === 'string' &&
    Object.values(ErrorCode).includes(candidate.code as ErrorCode) &&
    typeof candidate.message === 'string'
  );
}

export function hydrateApiError(
  payload: unknown,
  statusCode?: number
): AppError {
  if (payload instanceof AppError) {
    return payload as AppError;
  }

  if (isApiError(payload)) {
    const { code, details, message } = payload;
    const resolvedDetails =
      typeof details === 'object' && details !== null ? details : undefined;

    switch (code) {
      case ErrorCode.BAD_REQUEST:
        return new BadRequestError(message, resolvedDetails);
      case ErrorCode.VALIDATION_ERROR:
        return new ValidationError(resolvedDetails ?? {}, message);
      case ErrorCode.NOT_FOUND:
        return new NotFoundError(message, resolvedDetails);
      case ErrorCode.CONFLICT:
        return new ConflictError(message, resolvedDetails);
      case ErrorCode.INTERNAL_SERVER_ERROR:
        return new InternalServerError(message, resolvedDetails);
      default:
        return new AppError(message, {
          code,
          details: resolvedDetails,
          statusCode: statusCode ?? 500,
        });
    }
  }

  let message = 'An unexpected error occurred';
  let fallbackDetails: Record<string, unknown> | undefined;

  if (typeof payload === 'object' && payload !== null) {
    const record = payload as Record<string, unknown>;
    fallbackDetails = record;

    if (typeof record.message === 'string' && record.message.trim() !== '') {
      message = record.message;
    } else if (typeof record.error === 'string' && record.error.trim() !== '') {
      message = record.error;
    }
  } else if (typeof payload === 'string' && payload.trim() !== '') {
    message = payload;
  }

  switch (statusCode) {
    case 400:
      return new BadRequestError(message, fallbackDetails);
    case 404:
      return new NotFoundError(message, fallbackDetails);
    case 409:
      return new ConflictError(message, fallbackDetails);
    case 422:
      return new ValidationError(fallbackDetails ?? {}, message);
    case 500:
    default:
      return new InternalServerError(message, fallbackDetails);
  }
}
