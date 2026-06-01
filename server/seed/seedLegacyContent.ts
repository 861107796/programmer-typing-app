import { getLegacySeedContent } from "./legacyContent";

export async function seedLegacyContentIfEmpty(contentRepository: {
  count: () => Promise<number>;
  create: (input: {
    category: string;
    topic: string;
    difficulty: string;
    length: string;
    label: string;
    prompt: string;
    isActive: boolean;
  }) => Promise<unknown>;
}) {
  const count = await contentRepository.count();

  if (count > 0) {
    return { seeded: false, inserted: 0 };
  }

  const items = getLegacySeedContent();

  for (const item of items) {
    await contentRepository.create({
      category: item.category,
      topic: item.topic,
      difficulty: item.difficulty,
      length: item.length,
      label: item.label,
      prompt: item.prompt,
      isActive: true,
    });
  }

  return { seeded: true, inserted: items.length };
}
