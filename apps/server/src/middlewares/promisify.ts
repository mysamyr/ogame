import type { NextFunction, Request, Response } from 'express';

export const promisify =
  <Params = unknown, Res = void, Body = unknown, Query = unknown>(
    handler: (
      req: Request<Params, Res, Body, Query>,
      res: Response
    ) => void | Promise<void>
  ) =>
  (
    req: Request<Params, Res, Body, Query>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = handler(req, res);
      if (result && typeof result.then === 'function') {
        result.catch(next);
      }
    } catch (err) {
      next(err);
    }
  };
