import { ErrorCode } from './codes.js';
import type { ApiErrorPayload } from './payload.js';

export interface AppErrorOptions<TDetails = Record<string, unknown>> {
  cause?: unknown;
  code?: ErrorCode;
  details?: TDetails;
  statusCode?: number;
}

export class AppError<TDetails = Record<string, unknown>> extends Error {
  public readonly code: ErrorCode;
  public readonly details?: TDetails;
  public override readonly message: string;
  public readonly statusCode: number;

  constructor(message: string, options?: AppErrorOptions<TDetails>);
  constructor(
    message: string,
    statusCode?: number,
    code?: ErrorCode,
    details?: TDetails
  );
  constructor(
    message: string,
    statusCodeOrOptions?: number | AppErrorOptions<TDetails>,
    code?: ErrorCode,
    details?: TDetails
  ) {
    let statusCode = 500;
    let errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
    let errorDetails: TDetails | undefined;
    let cause: unknown;

    if (
      typeof statusCodeOrOptions === 'object' &&
      statusCodeOrOptions !== null
    ) {
      statusCode = statusCodeOrOptions.statusCode ?? 500;
      errorCode = statusCodeOrOptions.code ?? ErrorCode.INTERNAL_SERVER_ERROR;
      errorDetails = statusCodeOrOptions.details;
      cause = statusCodeOrOptions.cause;
    } else {
      if (typeof statusCodeOrOptions === 'number') {
        statusCode = statusCodeOrOptions;
      }
      if (code !== undefined) {
        errorCode = code;
      }
      if (details !== undefined) {
        errorDetails = details;
      }
    }

    super(message, cause !== undefined ? { cause } : undefined);
    this.name = this.constructor.name;
    this.message = message;
    this.code = errorCode;
    this.statusCode = statusCode;
    this.details = errorDetails;

    Object.setPrototypeOf(this, new.target.prototype);

    const ErrorWithCapture = Error as unknown as {
      captureStackTrace?: (target: object, constructorOpt?: unknown) => void;
    };
    if (typeof ErrorWithCapture.captureStackTrace === 'function') {
      ErrorWithCapture.captureStackTrace(this, this.constructor);
    }
  }

  public toPayload(): ApiErrorPayload<ErrorCode, TDetails> {
    return {
      code: this.code,
      message: this.message,
      ...(this.details !== undefined ? { details: this.details } : {}),
    };
  }
}
