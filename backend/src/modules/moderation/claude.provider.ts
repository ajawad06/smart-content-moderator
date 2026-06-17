import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env';
import { ApiError } from '../../middleware/error';
import { isCategoryKey } from '../../constants/moderation';
import { logger } from '../../utils/logger';
import type {
  CategoryClassification,
  CategoryDescriptor,
  ModerationImageInput,
  ModerationProvider,
} from './provider.types';

const SUPPORTED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
type SupportedMediaType = (typeof SUPPORTED_MEDIA_TYPES)[number];

/** Uses a Claude vision model to classify an image against each category. */
export class ClaudeModerationProvider implements ModerationProvider {
  readonly name = 'claude';
  private client: Anthropic;

  constructor() {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error('MODERATION_PROVIDER=claude requires ANTHROPIC_API_KEY to be set');
    }
    this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }

  private buildPrompt(categories: CategoryDescriptor[]): string {
    const list = categories
      .map((c) => `- "${c.key}" (${c.label}): ${c.description}`)
      .join('\n');
    return [
      'You are a content moderation classifier. Analyze the image and assess it against EACH',
      'of the following policy categories. For every category return a confidence score from 0',
      'to 100 (how strongly the image violates that category) and a brief one-sentence reason.',
      '',
      'Categories:',
      list,
      '',
      'Return one entry per category. Be objective and base scores only on what is visible.',
    ].join('\n');
  }

  private outputSchema(categoryKeys: string[]) {
    return {
      type: 'object',
      additionalProperties: false,
      properties: {
        classifications: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              category: { type: 'string', enum: categoryKeys },
              confidence: { type: 'integer' },
              reasoning: { type: 'string' },
            },
            required: ['category', 'confidence', 'reasoning'],
          },
        },
      },
      required: ['classifications'],
    };
  }

  async screen(
    image: ModerationImageInput,
    categories: CategoryDescriptor[],
  ): Promise<CategoryClassification[]> {
    if (!SUPPORTED_MEDIA_TYPES.includes(image.mimeType as SupportedMediaType)) {
      throw new ApiError(400, `Unsupported image type for AI moderation: ${image.mimeType}`);
    }

    let response;
    try {
      response = await this.client.messages.create({
        model: env.ANTHROPIC_MODEL,
        max_tokens: 2048,
        output_config: {
          format: {
            type: 'json_schema',
            schema: this.outputSchema(categories.map((c) => c.key)),
          },
        },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: image.mimeType as SupportedMediaType,
                  data: image.base64,
                },
              },
              { type: 'text', text: this.buildPrompt(categories) },
            ],
          },
        ],
      } as Anthropic.MessageCreateParamsNonStreaming);
    } catch (err) {
      logger.error('Claude moderation request failed', err);
      throw new ApiError(502, 'AI moderation provider request failed');
    }

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new ApiError(502, 'AI moderation provider returned no content');
    }

    return this.parse(textBlock.text, categories);
  }

  /** Parses and normalizes the model's JSON, guaranteeing one entry per requested category. */
  private parse(raw: string, categories: CategoryDescriptor[]): CategoryClassification[] {
    let parsed: { classifications?: unknown };
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new ApiError(502, 'AI moderation provider returned invalid JSON');
    }
    const items = Array.isArray(parsed.classifications) ? parsed.classifications : [];
    const byCategory = new Map<string, CategoryClassification>();
    for (const item of items as Record<string, unknown>[]) {
      const category = String(item.category ?? '');
      if (!isCategoryKey(category)) continue;
      const confidence = Math.max(0, Math.min(100, Math.round(Number(item.confidence) || 0)));
      byCategory.set(category, {
        category,
        confidence,
        reasoning: String(item.reasoning ?? '').slice(0, 500),
      });
    }
    // Ensure completeness: fill any category the model omitted with a safe default.
    return categories.map(
      (c) =>
        byCategory.get(c.key) ?? {
          category: c.key,
          confidence: 0,
          reasoning: 'No assessment returned by the model for this category.',
        },
    );
  }
}
