import type { Request, Response, NextFunction } from 'express';
import APIResponse from '../lib/classes/APIResponse';
import { getResponseMethod } from '../lib/helpers';
import FS from '../common/file';

declare global {
  namespace Express {
    interface Response {
      generalResponse(message: string, data?: any, statusCode?: number): void;
      generalError(message: string, data?: any, errorCode?: number | null): void;
    }
  }
}

/** Normalises the `data` argument of generalError into a list of error messages. */
const toErrorList = (data: any): string[] | undefined => {
  if (!data) return undefined;
  if (Array.isArray(data.errors)) return data.errors.map(String);
  if (typeof data.error === 'string') return [data.error];
  return undefined;
};

export default function handleAPIResponse(req: Request, res: Response, next: NextFunction): void {
  res.generalResponse = function (message: string, data: any = null, statusCode?: number): void {
    const code = statusCode ?? getResponseMethod(req.method);
    // Response data is not logged: it can contain tokens.
    FS.writeText({ data: null, message, status: 'success', code, endPoint: req.originalUrl });
    res.status(code).json(APIResponse.success(message, data));
  };

  res.generalError = function (message: string, data: any = null, errorCode: number | null = null): void {
    const code = errorCode || 400;
    FS.writeText({ data, message, status: 'failure', code, endPoint: req.originalUrl });
    res.status(code).json(APIResponse.error(message, code, toErrorList(data)));
  };

  next();
}
