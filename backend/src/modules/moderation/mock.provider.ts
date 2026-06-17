import { createHash } from 'node:crypto';
import type { CategoryKey } from '../../constants/moderation';
import type {
  CategoryClassification,
  CategoryDescriptor,
  ModerationImageInput,
  ModerationProvider,
} from './provider.types';

/**
 * Deterministic, dependency-free moderation provider. The same image always yields
 * the same result, so the platform behaves predictably in tests and demos without
 * any API key. Most images come back clean; a deterministic minority are flagged.
 *
 * As a demo aid, a filename containing a category keyword (e.g. "violence.jpg")
 * forces a high-confidence detection for that category.
 */
export class MockModerationProvider implements ModerationProvider {
  readonly name = 'mock';

  private hashInt(input: string): number {
    const hex = createHash('sha256').update(input).digest('hex').slice(0, 8);
    return parseInt(hex, 16);
  }

  // Maps loose filename keywords to categories for predictable demo inputs.
  private static readonly KEYWORDS: Record<string, CategoryKey> = {
    violence: 'graphic_violence',
    gore: 'graphic_violence',
    hate: 'hate_symbols',
    selfharm: 'self_harm',
    'self-harm': 'self_harm',
    extremist: 'extremist_propaganda',
    propaganda: 'extremist_propaganda',
    weapon: 'weapons_contraband',
    drug: 'weapons_contraband',
    harassment: 'harassment_humiliation',
  };

  private keywordCategory(filename?: string): CategoryKey | null {
    if (!filename) return null;
    const lower = filename.toLowerCase();
    for (const [kw, category] of Object.entries(MockModerationProvider.KEYWORDS)) {
      if (lower.includes(kw)) return category;
    }
    return null;
  }

  async screen(
    image: ModerationImageInput,
    categories: CategoryDescriptor[],
  ): Promise<CategoryClassification[]> {
    const baseHash = this.hashInt(image.base64.slice(0, 256) + (image.filename ?? ''));
    const forced = this.keywordCategory(image.filename);

    // ~1 in 5 images (by hash) get one category boosted to a violation band.
    const unlucky = baseHash % 5 === 0;
    const boostedCategory = unlucky && categories.length > 0
      ? categories[baseHash % categories.length].key
      : null;

    return categories.map((cat) => {
      const h = this.hashInt(image.base64.slice(0, 256) + cat.key);
      const isHigh = forced === cat.key || boostedCategory === cat.key;
      // High band 75-95; low band 1-45 — keeps most categories comfortably clean.
      const confidence = isHigh ? 75 + (h % 21) : h % 45;
      const reasoning = isHigh
        ? `Visual features consistent with ${cat.label.toLowerCase()} were detected with high confidence.`
        : `No strong indicators of ${cat.label.toLowerCase()} were found in the image.`;
      return { category: cat.key, confidence, reasoning };
    });
  }
}
