import { ErrorCode } from './codes.js';

export interface ApiErrorPayload<
  TCode extends ErrorCode = ErrorCode,
  TDetails = Record<string, unknown>,
> {
  code: TCode;
  details?: TDetails;
  message: string;
  stack?: string;
}
