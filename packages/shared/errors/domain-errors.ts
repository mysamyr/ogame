import { AppError } from './app-error.js';
import { ErrorCode } from './codes.js';

export class BadRequestError<
  TDetails = Record<string, unknown>,
> extends AppError<TDetails> {
  public readonly error: string;

  constructor(message = 'Bad request', details?: TDetails) {
    super(message, {
      code: ErrorCode.BAD_REQUEST,
      details,
      statusCode: 400,
    });
    this.error = message;
  }
}

export class ValidationError<T = unknown> extends AppError {
  public readonly errors?: T;

  constructor(
    errorsOrMessage?: T | string,
    messageOrDetails?: string | Record<string, unknown>,
    details?: Record<string, unknown>
  ) {
    let message = 'Validation error';
    let errors: T | undefined;
    let resolvedDetails: Record<string, unknown> | undefined;

    if (typeof errorsOrMessage === 'string') {
      message = errorsOrMessage;
      if (typeof messageOrDetails === 'object' && messageOrDetails !== null) {
        resolvedDetails = messageOrDetails;
      } else if (details) {
        resolvedDetails = details;
      }
    } else {
      errors = errorsOrMessage;
      if (typeof messageOrDetails === 'string') {
        message = messageOrDetails;
      }
      if (details) {
        resolvedDetails = details;
      } else if (typeof errors === 'object' && errors !== null) {
        resolvedDetails = {
          errors,
          fieldErrors: errors,
          ...(errors as Record<string, unknown>),
        };
      } else if (errors !== undefined) {
        resolvedDetails = { errors };
      }
    }

    super(message, {
      code: ErrorCode.VALIDATION_ERROR,
      details: resolvedDetails,
      statusCode: 400,
    });

    this.errors = errors;
  }
}

export class NotFoundError<
  TDetails = Record<string, unknown>,
> extends AppError<TDetails> {
  constructor(message = 'Not found', details?: TDetails) {
    super(message, {
      code: ErrorCode.NOT_FOUND,
      details,
      statusCode: 404,
    });
  }
}

export class ConflictError<
  TDetails = Record<string, unknown>,
> extends AppError<TDetails> {
  constructor(message = 'Conflict', details?: TDetails) {
    super(message, {
      code: ErrorCode.CONFLICT,
      details,
      statusCode: 409,
    });
  }
}

export class InternalServerError<
  TDetails = Record<string, unknown>,
> extends AppError<TDetails> {
  constructor(message = 'Internal server error', details?: TDetails) {
    super(message, {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      details,
      statusCode: 500,
    });
  }
}
