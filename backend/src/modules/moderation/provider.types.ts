import type { CategoryKey } from '../../constants/moderation';

/** A category to screen against, with presentation metadata for the AI prompt. */
export interface CategoryDescriptor {
  key: CategoryKey;
  label: string;
  description: string;
}

/** The image to screen, as base64 plus its MIME type. */
export interface ModerationImageInput {
  base64: string;
  mimeType: string;
  filename?: string;
}

/** The AI's assessment for a single category. */
export interface CategoryClassification {
  category: CategoryKey;
  confidence: number; // 0-100: likelihood the image violates this category
  reasoning: string;
}

/**
 * A moderation provider screens an image against a set of categories and returns
 * a confidence + reasoning per category. Enforcement (threshold/auto-block) is
 * applied separately by the verdict engine — providers only classify.
 */
export interface ModerationProvider {
  readonly name: string;
  screen(
    image: ModerationImageInput,
    categories: CategoryDescriptor[],
  ): Promise<CategoryClassification[]>;
}
