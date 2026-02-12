/**
 * Adapter for converting kodrdriv Config to ai-service AIConfig
 */

import type { Config } from '../types';
import type { AIConfig } from '@grunnverk/ai-service';

/**
 * Convert kodrdriv Config to AIConfig.
 *
 * Provider selection is handled by ai-service's resolveProvider():
 * - If model is specified, provider is detected from model name
 * - If no model, picks based on available API keys (prefers Anthropic)
 * - Explicit apiKey or provider can override auto-detection
 */
export function toAIConfig(config: Config): AIConfig {
    return {
        // Let resolveProvider handle API key detection from environment
        // Only pass explicit key if configured
        apiKey: (config as any).apiKey || (config as any).openaiApiKey || undefined,
        provider: (config as any).provider || 'auto',
        model: config.model,
        reasoning: config.openaiReasoning,
        commands: {
            commit: config.commit ? {
                model: config.commit.model,
                reasoning: config.commit.openaiReasoning,
            } : undefined,
            release: config.release ? {
                model: config.release.model,
                reasoning: config.release.openaiReasoning,
            } : undefined,
            review: config.review ? {
                model: config.review.model,
                reasoning: config.review.openaiReasoning,
            } : undefined,
        },
    };
}

