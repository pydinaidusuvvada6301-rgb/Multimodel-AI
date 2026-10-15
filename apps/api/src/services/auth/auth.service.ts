import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../config/env.js';
import { inMemoryDb, pool, isPostgresConnected } from '../../config/database.js';
import { AuthUser } from '../../types/index.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export class AuthService {
  /**
   * Register a new user
   */
  public static async register(data: {
    email: string;
    password: string;
    displayName: string;
  }): Promise<TokenPair> {
    const normalizedEmail = data.email.trim().toLowerCase();

    // Check if user already exists
    let existingUser = null;
    if (isPostgresConnected && pool) {
      const res = await pool.query('SELECT * FROM app_users WHERE LOWER(email) = $1', [normalizedEmail]);
      if (res.rows.length > 0) existingUser = res.rows[0];
    } else {
      for (const u of inMemoryDb.app_users.values()) {
        if (u.email.toLowerCase() === normalizedEmail) {
          existingUser = u;
          break;
        }
      }
    }

    if (existingUser) {
      const error: any = new Error('An account with this email address already exists.');
      error.status = 409;
      error.code = 'EMAIL_ALREADY_EXISTS';
      throw error;
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(data.password, 10);
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newUser = {
      id: userId,
      email: normalizedEmail,
      password_hash: passwordHash,
      display_name: data.displayName.trim(),
      avatar_url: null,
      email_verified_at: null,
      created_at: now,
      updated_at: now,
    };

    inMemoryDb.app_users.set(userId, newUser);

    // Create default profile and initial workspace
    inMemoryDb.profiles.set(userId, {
      id: userId,
      display_name: newUser.display_name,
      bio: '',
      preferences: { theme: 'dark', defaultDetail: 'balanced' },
      created_at: now,
      updated_at: now,
    });

    const defaultWorkspaceId = crypto.randomUUID();
    inMemoryDb.workspaces.set(defaultWorkspaceId, {
      id: defaultWorkspaceId,
      user_id: userId,
      name: 'Default Workspace',
      description: 'Your primary workspace for multimodal notes and knowledge synthesis.',
      category: 'general',
      created_at: now,
      updated_at: now,
    });

    if (isPostgresConnected && pool) {
      try {
        await pool.query(
          `INSERT INTO app_users (id, email, password_hash, display_name) VALUES ($1, $2, $3, $4)`,
          [newUser.id, newUser.email, newUser.password_hash, newUser.display_name]
        );
        await pool.query(
          `INSERT INTO profiles (id, display_name) VALUES ($1, $2)`,
          [newUser.id, newUser.display_name]
        );
        await pool.query(
          `INSERT INTO workspaces (id, user_id, name, description) VALUES ($1, $2, $3, $4)`,
          [defaultWorkspaceId, userId, 'Default Workspace', 'Primary knowledge workspace']
        );
      } catch (err: any) {
        console.warn('⚠️ Error persisting new user to PostgreSQL:', err.message);
      }
    }

    const authUser: AuthUser = {
      id: userId,
      email: newUser.email,
      displayName: newUser.display_name,
    };

    return await this.issueTokens(authUser);
  }

  /**
   * Log in user with email and password
   */
  public static async login(email: string, password: string): Promise<TokenPair> {
    const normalizedEmail = email.trim().toLowerCase();

    let user: any = null;
    if (isPostgresConnected && pool) {
      const res = await pool.query('SELECT * FROM app_users WHERE LOWER(email) = $1', [normalizedEmail]);
      if (res.rows.length > 0) user = res.rows[0];
    } else {
      for (const u of inMemoryDb.app_users.values()) {
        if (u.email.toLowerCase() === normalizedEmail) {
          user = u;
          break;
        }
      }
    }

    if (!user) {
      const error: any = new Error('Invalid email or password.');
      error.status = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const error: any = new Error('Invalid email or password.');
      error.status = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
    };

    return await this.issueTokens(authUser);
  }

  /**
   * Issue signed access token and rotating refresh token
   */
  public static async issueTokens(user: AuthUser, userAgent?: string): Promise<TokenPair> {
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        displayName: user.displayName,
      },
      env.JWT_ACCESS_SECRET,
      {
        expiresIn: env.JWT_ACCESS_TTL as any,
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
      }
    );

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const sessionId = crypto.randomUUID();
    const session = {
      id: sessionId,
      user_id: user.id,
      token_hash: tokenHash,
      user_agent: userAgent || null,
      expires_at: expiresAt,
      revoked_at: null,
      created_at: new Date().toISOString(),
    };

    inMemoryDb.refresh_sessions.set(sessionId, session);

    if (isPostgresConnected && pool) {
      try {
        await pool.query(
          `INSERT INTO refresh_sessions (id, user_id, token_hash, user_agent, expires_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [session.id, session.user_id, session.token_hash, session.user_agent, session.expires_at]
        );
      } catch (err: any) {
        console.warn('⚠️ Error inserting refresh session into PostgreSQL:', err.message);
      }
    }

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user,
    };
  }

  /**
   * Rotate refresh token
   */
  public static async refreshToken(rawRefreshToken: string): Promise<TokenPair> {
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    let session: any = null;
    let sessionId: string | null = null;

    for (const [id, s] of inMemoryDb.refresh_sessions.entries()) {
      if (s.token_hash === tokenHash && !s.revoked_at) {
        session = s;
        sessionId = id;
        break;
      }
    }

    if (!session || new Date(session.expires_at) < new Date()) {
      const error: any = new Error('Invalid or expired refresh token. Please log in again.');
      error.status = 401;
      error.code = 'INVALID_REFRESH_TOKEN';
      throw error;
    }

    // Revoke old session
    session.revoked_at = new Date().toISOString();

    // Look up user
    const user = inMemoryDb.app_users.get(session.user_id);
    if (!user) {
      const error: any = new Error('User not found.');
      error.status = 401;
      throw error;
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
    };

    return await this.issueTokens(authUser);
  }

  /**
   * Revoke session on logout
   */
  public static async logout(rawRefreshToken?: string): Promise<void> {
    if (!rawRefreshToken) return;
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    for (const s of inMemoryDb.refresh_sessions.values()) {
      if (s.token_hash === tokenHash) {
        s.revoked_at = new Date().toISOString();
        break;
      }
    }
  }

  /**
   * Change user password
   */
  public static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = inMemoryDb.app_users.get(userId);
    if (!user) {
      const error: any = new Error('User not found.');
      error.status = 404;
      throw error;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      const error: any = new Error('Current password is incorrect.');
      error.status = 400;
      error.code = 'INCORRECT_CURRENT_PASSWORD';
      throw error;
    }

    user.password_hash = await bcrypt.hash(newPassword, 10);
    user.updated_at = new Date().toISOString();
  }
}
