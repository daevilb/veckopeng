// /path/to/veckopeng/backend/familyAuth.ts

import { Request, Response, NextFunction } from 'express';

const FAMILY_API_KEY = process.env.FAMILY_API_KEY;

if (!FAMILY_API_KEY) {
  console.warn(
    '[Veckopeng] WARNING: FAMILY_API_KEY is not set. ' +
    'API is running WITHOUT auth. Set FAMILY_API_KEY in your environment for protection.'
  );
}

export function requireFamilyKey(req: Request, res: Response, next: NextFunction) {
  if (!FAMILY_API_KEY) {
    // No key configured -> unsecured/dev mode
    return next();
  }

  const headerKey = req.header('x-family-key');

  if (!headerKey) {
    return res.status(401).json({ error: 'Missing family key' });
  }

  if (headerKey !== FAMILY_API_KEY) {
    return res.status(403).json({ error: 'Invalid family key' });
  }

  return next();
}