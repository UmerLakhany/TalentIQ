import { Request, Response, NextFunction, RequestHandler } from 'express';
import { validate } from 'class-validator';

type DTOType<T> = { new(): T };

/**
 * Validates req.body against a class-validator DTO.
 * Unknown fields are stripped (whitelist), so clients cannot set fields such as `role`.
 */
function validateDTO<T extends object>(DTOClass: DTOType<T>): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dtoInstance = Object.assign(new DTOClass(), req.body ?? {});
    const errors = await validate(dtoInstance, { whitelist: true });

    if (errors.length > 0) {
      // One message per field. Constraints are reported in reverse decorator order, so the
      // last one is the first rule written in the DTO (e.g. "is required").
      const errorMessages = errors
        .map((error) => Object.values(error.constraints || {}).pop())
        .filter((msg): msg is string => Boolean(msg));
      return res.generalError('Validation Error!', { errors: errorMessages }, 400);
    }

    req.body = dtoInstance;
    next();
  };
}

export default validateDTO;
