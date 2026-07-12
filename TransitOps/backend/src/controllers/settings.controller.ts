import { Response, NextFunction } from 'express';
import * as bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { AppError } from '../utils/errors.js';
import { AuthenticatedRequest } from '../types.js';
import { Role } from '@prisma/client';

export const getAllUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      status: 'success',
      data: { users }
    });
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name || !role) {
      return next(new AppError('Please provide email, password, name, and role', 400));
    }

    // Validate role
    if (!Object.values(Role).includes(role as Role)) {
      return next(new AppError('Invalid role specified', 400));
    }

    // Check unique email
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return next(new AppError('User with that email already exists', 400));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role as Role
      }
    });

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(new AppError('Please provide currentPassword and newPassword', 400));
    }

    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return next(new AppError('User no longer exists', 404));
    }

    // Match password
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return next(new AppError('Incorrect current password', 401));
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedNewPassword }
    });

    res.status(200).json({
      status: 'success',
      message: 'Password successfully changed!'
    });
  } catch (err) {
    next(err);
  }
};

export const updateUserRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return next(new AppError('Please provide a role', 400));
    }

    if (!Object.values(Role).includes(role as Role)) {
      return next(new AppError('Invalid role specified', 400));
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Prevent changing own role (to avoid lockouts)
    if (req.user && req.user.id === id) {
      return next(new AppError('You cannot change your own role to prevent system lockout.', 400));
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: role as Role }
    });

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role
        }
      }
    });
  } catch (err) {
    next(err);
  }
};
