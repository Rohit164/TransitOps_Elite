import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AuthenticatedRequest } from '../types.js';
import { AppError } from '../utils/errors.js';

/**
 * Restricts access to specified roles.
 * Checks the user's role decoded from JWT against the list of allowed roles.
 */
export const restrictTo = (...allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('You must be logged in to access this resource.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Access denied: You do not have permissions for this action.', 403));
    }

    next();
  };
};
