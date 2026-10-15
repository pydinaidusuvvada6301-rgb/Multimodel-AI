import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { authenticate } from '../middleware/auth.middleware.js';
import { AuthenticatedRequest, ConversationRecord } from '../types/index.js';
import { inMemoryDb } from '../config/database.js';

const router = Router();
router.use(authenticate);

// GET /api/v1/conversations
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { workspaceId } = req.query as { workspaceId?: string };

    const list: any[] = [];
    for (const c of inMemoryDb.conversations.values()) {
      if (c.user_id !== userId) continue;
      if (workspaceId && c.workspace_id !== workspaceId) continue;
      list.push(c);
    }

    list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    res.json({
      success: true,
      data: list,
      meta: { total: list.length },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/conversations
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { title = 'New Conversation', workspaceId } = req.body;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const conversation: ConversationRecord = {
      id,
      user_id: userId,
      workspace_id: workspaceId || null,
      title: title.trim(),
      created_at: now,
      updated_at: now,
    };

    inMemoryDb.conversations.set(id, conversation);

    res.status(201).json({
      success: true,
      data: conversation,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/conversations/:conversationId/messages
router.get('/:conversationId/messages', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const conversationId = req.params.conversationId as string;

    const conv = inMemoryDb.conversations.get(conversationId);
    if (!conv || conv.user_id !== userId) {
      res.status(404).json({
        success: false,
        error: { code: 'CONVERSATION_NOT_FOUND', message: 'Conversation not found or unauthorized.' },
      });
      return;
    }

    const messages = [];
    for (const msg of inMemoryDb.messages.values()) {
      if (msg.conversation_id === conversationId) {
        // Collect citations for message
        const citations = [];
        for (const cit of inMemoryDb.message_citations.values()) {
          if (cit.message_id === msg.id) citations.push(cit);
        }
        messages.push({ ...msg, citations });
      }
    }

    messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    res.json({
      success: true,
      data: {
        conversation: conv,
        messages,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/conversations/:conversationId
router.patch('/:conversationId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const conversationId = req.params.conversationId as string;
    const { title } = req.body;

    const conv = inMemoryDb.conversations.get(conversationId);
    if (!conv || conv.user_id !== userId) {
      res.status(404).json({
        success: false,
        error: { code: 'CONVERSATION_NOT_FOUND', message: 'Conversation not found or unauthorized.' },
      });
      return;
    }

    if (title) conv.title = title.trim();
    conv.updated_at = new Date().toISOString();

    res.json({
      success: true,
      data: conv,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/conversations/:conversationId
router.delete('/:conversationId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const conversationId = req.params.conversationId as string;

    const conv = inMemoryDb.conversations.get(conversationId);
    if (!conv || conv.user_id !== userId) {
      res.status(404).json({
        success: false,
        error: { code: 'CONVERSATION_NOT_FOUND', message: 'Conversation not found or unauthorized.' },
      });
      return;
    }

    // Delete associated messages and citations
    for (const [msgId, msg] of inMemoryDb.messages.entries()) {
      if (msg.conversation_id === conversationId) {
        for (const [citId, cit] of inMemoryDb.message_citations.entries()) {
          if (cit.message_id === msgId) inMemoryDb.message_citations.delete(citId);
        }
        inMemoryDb.messages.delete(msgId);
      }
    }

    inMemoryDb.conversations.delete(conversationId);

    res.json({
      success: true,
      data: { deleted: true },
      meta: { message: 'Conversation deleted.' },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
