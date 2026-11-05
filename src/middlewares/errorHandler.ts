import { Request, Response, NextFunction } from 'express';
import { ForeignKeyConstraintError, UniqueConstraintError, ValidationError } from 'sequelize';
import APIResponse from '../lib/classes/APIResponse';

export class ErrorResponse extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 404) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: string[] | undefined;

  // UniqueConstraintError extends ValidationError, so it must be checked first.
  if (err instanceof UniqueConstraintError) {
    statusCode = 409;
    message = 'Duplicate entry found.';
    errors = err.errors.map((e) => `${e.path} already exists`);
  } else if (err instanceof ValidationError) {
    statusCode = 400;
    errors = err.errors.map((e) => e.message);
    message = errors[0] ?? 'Validation Error!';
  } else if (err instanceof ForeignKeyConstraintError) {
    statusCode = 400;
    message = req.method === 'POST'
      ? 'Cannot create record due to wrong data provided.'
      : 'Cannot delete record due to dependent data.';
  } else if (err instanceof ErrorResponse) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err?.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Malformed JSON in request body.';
  }

  if (statusCode >= 500) console.error(err);

  res.status(statusCode).json({
    ...APIResponse.error(message, statusCode, errors),
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 && { stack: err?.stack }),
  });
};

export default errorHandler;
