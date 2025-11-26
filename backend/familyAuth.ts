// backend/familyAuth.ts
import type { Request, Response, NextFunction } from "express";

/**
 * Family key authentication middleware is currently disabled.
 * All requests are allowed. You can re-enable authentication later
 * by adding validation logic here.
 */
export function requireFamilyKey(_req: Request, _res: Response, next: NextFunction) {
  return next();
}
