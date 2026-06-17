import Groq from 'groq-sdk';
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

/** Uses a Groq-hosted vision model (Llama 4) to classify an image against each category. */
export class GroqModerationProvider implements ModerationProvider {
  readonly name = 'groq';
  private client: Groq;

  constructor() {
    if (!env.GROQ_API_KEY) {
      throw new Error('MODERATION_PROVIDER=groq requires GROQ_API_KEY to be set');
    }
    this.client = new Groq({ apiKey: env.GROQ_API_KEY });
  }

  private buildPrompt(categories: CategoryDescriptor[]): string {
    const list = categories.map((c) => `- "${c.key}" (${c.label}): ${c.description}`).join('\n');
    return [
      'You are a content moderation classifier. Analyze the image and assess it against EACH',
      'of the following policy categories. For every category return a confidence score from 0',
      'to 100 (how strongly the image violates that category) and a brief one-sentence reason.',
      '',
      'Categories:',
      list,
      '',
      'Respond with ONLY a JSON object of the exact shape:',
      '{"classifications":[{"category":"<key>","confidence":<0-100>,"reasoning":"<one sentence>"}]}',
      'Include one entry per category. Base scores only on what is visible in the image.',
    ].join('\n');
  }

  async screen(
    image: ModerationImageInput,
    categories: CategoryDescriptor[],
  ): Promise<CategoryClassification[]> {
    if (!SUPPORTED_MEDIA_TYPES.includes(image.mimeType as SupportedMediaType)) {
      throw new ApiError(400, `Unsupported image type for AI moderation: ${image.mimeType}`);
    }

    let content: string | null;
    try {
      const completion = await this.client.chat.completions.create({
        model: env.GROQ_MODEL,
        temperature: 0,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: this.buildPrompt(categories) },
              {
                type: 'image_url',
                image_url: { url: `data:${image.mimeType};base64,${image.base64}` },
              },
            ],
          },
        ],
      });
      content = completion.choices[0]?.message?.content ?? null;
    } catch (err) {
      logger.error('Groq moderation request failed', err);
      throw new ApiError(502, 'AI moderation provider request failed');
    }

    if (!content) throw new ApiError(502, 'AI moderation provider returned no content');
    return this.parse(content, categories);
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
