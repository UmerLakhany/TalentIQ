import { Request, Response, NextFunction, RequestHandler } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

type DTOType<T> = { new(): T };

/**
 * One message per invalid field, including fields inside nested objects/arrays.
 * Constraints are reported in reverse decorator order, so the last one is the first rule
 * written in the DTO (e.g. "is required").
 */
const collectMessages = (errors: ValidationError[]): string[] =>
  errors.flatMap((error) => {
    const own = Object.values(error.constraints || {}).pop();
    return own ? [own] : collectMessages(error.children || []);
  });

/**
 * Validates req.body against a class-validator DTO.
 * Unknown fields are stripped (whitelist), so clients cannot set fields such as `role`.
 */
function validateDTO<T extends object>(DTOClass: DTOType<T>): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const dtoInstance = plainToInstance(DTOClass, body) as T;
    const errors = await validate(dtoInstance, { whitelist: true });

    if (errors.length > 0) {
      const errorMessages = [...new Set(collectMessages(errors))];
      return res.generalError('Validation Error!', { errors: errorMessages }, 400);
    }

    req.body = dtoInstance;
    next();
  };
}

export default validateDTO;
