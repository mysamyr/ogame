export class BadRequestError extends Error {
  public readonly statusCode: number = 400;
  public readonly error: string;
  constructor(error: string) {
    super('Bad request');
    this.name = this.constructor.name;
    this.statusCode = 400;
    this.error = error;
  }
}
export class ValidationError<T = unknown> extends Error {
  public readonly statusCode: number = 400;
  public readonly errors: T;
  constructor(errors: T) {
    super('Validation error');
    this.name = this.constructor.name;
    this.statusCode = 400;
    this.errors = errors;
  }
}
