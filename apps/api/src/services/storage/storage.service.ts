import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { env } from '../../config/env.js';
import { supabase } from '../../config/database.js';

// Local private fallback directory when Supabase Storage credentials are not supplied
const LOCAL_STORAGE_DIR = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
  fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
}

export interface StoredFileResult {
  bucket: string;
  storagePath: string;
  sha256: string;
  fileSizeBytes: number;
}

export class StorageService {
  /**
   * Save a buffer or file to private storage
   */
  public static async uploadFile(
    userId: string,
    workspaceId: string,
    documentId: string,
    originalFilename: string,
    mimeType: string,
    buffer: Buffer
  ): Promise<StoredFileResult> {
    // Sanitize filename to prevent path traversal
    const safeFilename = path.basename(originalFilename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `users/${userId}/workspaces/${workspaceId}/${documentId}/${safeFilename}`;
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    // 1. Try Supabase Storage if configured
    if (supabase && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { error } = await supabase.storage
          .from(env.STORAGE_BUCKET)
          .upload(storagePath, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (!error) {
          return {
            bucket: env.STORAGE_BUCKET,
            storagePath,
            sha256,
            fileSizeBytes: buffer.length,
          };
        }
        console.warn('⚠️ Supabase storage upload returned error, falling back to local storage:', error.message);
      } catch (err: any) {
        console.warn('⚠️ Supabase storage upload exception, falling back to local storage:', err.message);
      }
    }

    // 2. Resilient local private storage fallback
    const localDir = path.dirname(path.join(LOCAL_STORAGE_DIR, storagePath));
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }

    const fullLocalPath = path.join(LOCAL_STORAGE_DIR, storagePath);
    await fs.promises.writeFile(fullLocalPath, buffer);

    return {
      bucket: 'local-private',
      storagePath,
      sha256,
      fileSizeBytes: buffer.length,
    };
  }

  /**
   * Read file content buffer from private storage
   */
  public static async getFileBuffer(bucket: string, storagePath: string): Promise<Buffer> {
    if (bucket === env.STORAGE_BUCKET && supabase) {
      const { data, error } = await supabase.storage.from(bucket).download(storagePath);
      if (!error && data) {
        const arrayBuffer = await data.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
    }

    // Read from local private storage
    const fullLocalPath = path.join(LOCAL_STORAGE_DIR, storagePath);
    if (fs.existsSync(fullLocalPath)) {
      return await fs.promises.readFile(fullLocalPath);
    }

    throw new Error(`Storage object not found at path: ${storagePath}`);
  }

  /**
   * Generate a time-bounded signed download URL
   */
  public static async getSignedDownloadUrl(
    bucket: string,
    storagePath: string,
    expiresInSeconds = 3600
  ): Promise<string> {
    if (bucket === env.STORAGE_BUCKET && supabase) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(storagePath, expiresInSeconds);

      if (!error && data?.signedUrl) {
        return data.signedUrl;
      }
    }

    // For local private storage, return a secure token-signed local download route
    const token = crypto
      .createHmac('sha256', env.JWT_ACCESS_SECRET)
      .update(`${storagePath}:${Date.now() + expiresInSeconds * 1000}`)
      .digest('hex');

    const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    return `/api/v1/documents/local-download?path=${encodeURIComponent(storagePath)}&token=${token}&exp=${exp}`;
  }

  /**
   * Delete a file from private storage
   */
  public static async deleteFile(bucket: string, storagePath: string): Promise<void> {
    if (bucket === env.STORAGE_BUCKET && supabase) {
      try {
        await supabase.storage.from(bucket).remove([storagePath]);
      } catch (err: any) {
        console.warn('⚠️ Supabase storage removal warning:', err.message);
      }
    }

    // Delete local copy if present
    const fullLocalPath = path.join(LOCAL_STORAGE_DIR, storagePath);
    if (fs.existsSync(fullLocalPath)) {
      try {
        await fs.promises.unlink(fullLocalPath);
      } catch (err: any) {
        console.warn('⚠️ Local storage unlink warning:', err.message);
      }
    }
  }
}
