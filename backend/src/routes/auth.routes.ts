import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth/auth.service.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';
import { inMemoryDb } from '../config/database.js';
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
    const result = await AuthService.register(validated);

    // Helper for cross-origin cookies across Render & Vercel
    const cookieOptions = {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: (env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
      maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    };

    if (result.refreshToken) {
      res.cookie('refreshToken', result.refreshToken, cookieOptions);
    }

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
        needsVerification: result.needsVerification || false,
      },
      meta: {
        message: result.needsVerification
          ? 'Registration successful. Please verify your email to unlock all features.'
          : 'Account registered successfully.',
      },
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

    const cookieOptions = {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: (env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
      maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    };

    res.cookie('refreshToken', tokens.refreshToken, cookieOptions);

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

// POST /api/v1/auth/resend-verification
router.post('/resend-verification', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Email address is required.' },
      });
      return;
    }

    const result = await AuthService.resendVerification(email);
    res.json({
      success: true,
      data: result,
      meta: { message: result.message },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Email address is required.' },
      });
      return;
    }

    const result = await AuthService.requestPasswordReset(email);
    res.json({
      success: true,
      data: result,
      meta: { message: result.message },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/reset-password
router.post('/reset-password', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Valid email and new password (min 8 characters) required.' },
      });
      return;
    }

    const result = await AuthService.resetPassword(email, newPassword);
    res.json({
      success: true,
      data: result,
      meta: { message: result.message },
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

    const cookieOptions = {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: (env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
      maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    };

    res.cookie('refreshToken', tokens.refreshToken, cookieOptions);

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

    const cookieOptions = {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: (env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
    };
    res.clearCookie('refreshToken', cookieOptions);

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
  const userId = req.user!.id;
  let workspaceCount = 0;
  let documentCount = 0;

  for (const w of inMemoryDb.workspaces.values()) {
    if (w.user_id === userId) workspaceCount++;
  }
  for (const d of inMemoryDb.documents.values()) {
    if (d.user_id === userId && !d.deleted_at) documentCount++;
  }

  res.json({
    success: true,
    data: {
      user: req.user,
      stats: {
        workspaceCount,
        documentCount,
      },
    },
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

// POST /api/v1/auth/delete-account (Section 2.E: Explicit confirmation required)
router.post('/delete-account', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { confirmation } = req.body;
    if (confirmation !== 'DELETE') {
      res.status(400).json({
        success: false,
        error: {
          code: 'CONFIRMATION_REQUIRED',
          message: 'Please type DELETE to confirm account and resource deletion.',
        },
      });
      return;
    }

    const userId = req.user!.id;
    await AuthService.deleteAccount(userId);

    const cookieOptions = {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: (env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
    };
    res.clearCookie('refreshToken', cookieOptions);

    res.json({
      success: true,
      data: { deleted: true },
      meta: { message: 'Account and associated resources successfully deleted.' },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
