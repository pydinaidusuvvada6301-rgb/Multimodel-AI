import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth/auth.service.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';
import { env } from '../config/env.js';

const router = Router();

const RegisterSchema = z.object({
  email: z.string().email('Please provide a valid email address.').max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .max(128, 'Password must not exceed 128 characters.'),
  displayName: z.string().min(2, 'Name must be at least 2 characters.').max(100),
});

const LoginSchema = z.object({
  email: z.string().email('Please provide a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long.'),
});

// POST /api/v1/auth/register
router.post('/register', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = RegisterSchema.parse(req.body);
    const tokens = await AuthService.register(validated);

    // Set secure HTTP-only cookie for refresh token
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      data: {
        user: tokens.user,
        accessToken: tokens.accessToken,
      },
      meta: { message: 'Account registered successfully.' },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/login
router.post('/login', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = LoginSchema.parse(req.body);
    const tokens = await AuthService.login(validated.email, validated.password);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        user: tokens.user,
        accessToken: tokens.accessToken,
      },
      meta: { message: 'Logged in successfully.' },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!rawRefreshToken) {
      res.status(401).json({
        success: false,
        error: {
          code: 'REFRESH_TOKEN_MISSING',
          message: 'Refresh token not found in cookies or request payload.',
        },
      });
      return;
    }

    const tokens = await AuthService.refreshToken(rawRefreshToken);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        user: tokens.user,
        accessToken: tokens.accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/logout
router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    await AuthService.logout(rawRefreshToken);
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      data: { loggedOut: true },
      meta: { message: 'Successfully logged out.' },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: { user: req.user },
  });
});

// POST /api/v1/auth/change-password
router.post('/change-password', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = ChangePasswordSchema.parse(req.body);
    await AuthService.changePassword(req.user!.id, validated.currentPassword, validated.newPassword);

    res.json({
      success: true,
      data: { changed: true },
      meta: { message: 'Password updated successfully.' },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', authLimiter, async (req: Request, res: Response) => {
  // Safe message that avoids account enumeration
  res.json({
    success: true,
    data: { sent: true },
    meta: {
      message: 'If an account exists for this email, password reset instructions have been dispatched.',
    },
  });
});

export default router;
