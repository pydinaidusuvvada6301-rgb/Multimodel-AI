import { env } from '../../config/env.js';

export interface ModelCapability {
  id: string;
  name: string;
  intendedTasks: string[];
  inputModalities: ('text' | 'document' | 'image' | 'audio' | 'video' | 'structured')[];
  outputModalities: ('text' | 'json' | 'structured')[];
  contextWindowTokens: number;
  maxOutputTokens: number;
  isAvailable: boolean;
  isDefault: boolean;
  fallbackModelId?: string;
  provider: 'google';
}

export const SUPPORTED_MODELS: Record<string, ModelCapability> = {
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    intendedTasks: [
      'general_chat',
      'document_qa',
      'summarization',
      'image_analysis',
      'audio_transcription',
      'video_analysis',
      'cross_modal_analysis',
      'coding_help',
    ],
    inputModalities: ['text', 'document', 'image', 'audio', 'video', 'structured'],
    outputModalities: ['text', 'json', 'structured'],
    contextWindowTokens: 1048576,
    maxOutputTokens: 8192,
    isAvailable: true,
    isDefault: true,
    fallbackModelId: 'gemini-1.5-flash',
    provider: 'google',
  },
  'gemini-1.5-flash': {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    intendedTasks: [
      'general_chat',
      'document_qa',
      'summarization',
      'image_analysis',
      'audio_transcription',
      'video_analysis',
    ],
    inputModalities: ['text', 'document', 'image', 'audio', 'video'],
    outputModalities: ['text', 'json'],
    contextWindowTokens: 1048576,
    maxOutputTokens: 8192,
    isAvailable: true,
    isDefault: false,
    fallbackModelId: 'gemini-2.5-flash',
    provider: 'google',
  },
  'gemini-1.5-pro': {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    intendedTasks: [
      'deep_reasoning',
      'cross_modal_analysis',
      'large_document_synthesis',
      'coding_help',
    ],
    inputModalities: ['text', 'document', 'image', 'audio', 'video'],
    outputModalities: ['text', 'json'],
    contextWindowTokens: 2097152,
    maxOutputTokens: 8192,
    isAvailable: true,
    isDefault: false,
    fallbackModelId: 'gemini-2.5-flash',
    provider: 'google',
  },
  'gemini-2.0-flash': {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    intendedTasks: ['low_latency_chat', 'fast_vision_analysis', 'transcription'],
    inputModalities: ['text', 'document', 'image', 'audio', 'video'],
    outputModalities: ['text', 'json'],
    contextWindowTokens: 1048576,
    maxOutputTokens: 8192,
    isAvailable: true,
    isDefault: false,
    fallbackModelId: 'gemini-2.5-flash',
    provider: 'google',
  },
};

export class ModelRegistry {
  /**
   * Get all server-approved models and their capability specifications
   */
  public static getAllModels(): ModelCapability[] {
    const defaultModel = env.GEMINI_MODEL || 'gemini-2.5-flash';
    return Object.values(SUPPORTED_MODELS).map((m) => ({
      ...m,
      isDefault: m.id === defaultModel,
    }));
  }

  /**
   * Find model by ID or return default model
   */
  public static getModel(modelId?: string): ModelCapability {
    if (modelId && SUPPORTED_MODELS[modelId]) {
      return SUPPORTED_MODELS[modelId];
    }
    const defaultId = env.GEMINI_MODEL || 'gemini-2.5-flash';
    return SUPPORTED_MODELS[defaultId] || SUPPORTED_MODELS['gemini-2.5-flash'];
  }

  /**
   * Select an optimal model capable of the requested modality
   */
  public static selectModelForModality(
    modality: 'text' | 'document' | 'image' | 'audio' | 'video'
  ): ModelCapability {
    const defaultModel = this.getModel();
    if (defaultModel.inputModalities.includes(modality)) {
      return defaultModel;
    }
    const match = Object.values(SUPPORTED_MODELS).find((m) =>
      m.inputModalities.includes(modality)
    );
    return match || defaultModel;
  }

  /**
   * Validate whether a requested model ID is allowed and supports the task
   */
  public static validateModelChoice(
    modelId: string,
    requiredModality?: 'text' | 'document' | 'image' | 'audio' | 'video'
  ): { valid: boolean; model: ModelCapability; reason?: string } {
    const model = SUPPORTED_MODELS[modelId];
    if (!model) {
      return {
        valid: false,
        model: this.getModel(),
        reason: `Model '${modelId}' is not in the server-approved model registry.`,
      };
    }

    if (requiredModality && !model.inputModalities.includes(requiredModality)) {
      return {
        valid: false,
        model,
        reason: `Model '${model.name}' does not support '${requiredModality}' modality.`,
      };
    }

    return { valid: true, model };
  }
}
