import type {
  PracticeCategory,
  PracticeDifficulty,
  PracticeLength,
  PracticeTopic,
} from "../../src/domain/types";

import type {
  ChallengeAssignmentRecord,
} from "../repositories/challengeAssignmentRepository";
import type {
  ContentFilters,
  ContentRecord,
  CreateContentInput,
} from "../repositories/contentRepository";

const categories = new Set<PracticeCategory>(["code", "command", "technical"]);
const difficulties = new Set<PracticeDifficulty>(["easy", "medium", "hard"]);
const lengths = new Set<PracticeLength>(["short", "medium", "long"]);
const topics = new Set<PracticeTopic>([
  "javascript",
  "typescript",
  "python",
  "sql",
  "shell",
  "json",
  "yaml",
  "git",
  "npm",
  "pip",
  "filesystem",
  "search",
  "docker",
  "curl",
  "api",
  "database",
  "logging",
  "deploy",
  "debugging",
  "docs",
  "errors",
]);

function toDateKey(value?: string) {
  return value?.trim() || new Date().toISOString().slice(0, 10);
}

function assertValidInput(input: CreateContentInput) {
  if (!categories.has(input.category as PracticeCategory)) {
    throw new Error("Invalid category");
  }

  if (!topics.has(input.topic as PracticeTopic)) {
    throw new Error("Invalid topic");
  }

  if (!difficulties.has(input.difficulty as PracticeDifficulty)) {
    throw new Error("Invalid difficulty");
  }

  if (!lengths.has(input.length as PracticeLength)) {
    throw new Error("Invalid length");
  }

  if (!input.label.trim() || !input.prompt.trim()) {
    throw new Error("Label and prompt are required");
  }
}

function toContentResponse(record: ContentRecord) {
  return {
    id: record.id,
    category: record.category,
    topic: record.topic,
    difficulty: record.difficulty,
    length: record.length,
    label: record.label,
    prompt: record.prompt,
    isActive: Boolean(record.is_active),
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function toAssignmentResponse(record: ChallengeAssignmentRecord) {
  return {
    dateKey: record.date_key,
    contentItemId: record.content_item_id,
    source: record.source as "manual" | "generated",
  };
}

interface ContentServiceDependencies {
  contentRepository: {
    list: (filters?: ContentFilters) => Promise<ContentRecord[]>;
    create: (input: CreateContentInput) => Promise<ContentRecord>;
    update: (
      id: string,
      input: CreateContentInput,
    ) => Promise<ContentRecord | null>;
    findById: (id: string) => Promise<ContentRecord | null>;
    delete: (id: string) => Promise<void>;
    listActiveByPreference: () => Promise<ContentRecord[]>;
  };
  challengeAssignmentRepository: {
    listByDate: (dateKey: string) => Promise<ChallengeAssignmentRecord[]>;
    getByDate: (dateKey: string) => Promise<ChallengeAssignmentRecord | null>;
    upsert: (
      dateKey: string,
      contentItemId: string,
      source: "manual" | "generated",
    ) => Promise<ChallengeAssignmentRecord | null>;
    isContentAssigned: (contentItemId: string) => Promise<boolean>;
    listRecent: (limit?: number) => Promise<ChallengeAssignmentRecord[]>;
  };
}

export function createContentService(dependencies: ContentServiceDependencies) {
  return {
    async listContent(filters: ContentFilters) {
      const items = await dependencies.contentRepository.list(filters);
      return items.map(toContentResponse);
    },

    async createContent(input: CreateContentInput) {
      assertValidInput(input);
      const item = await dependencies.contentRepository.create(input);
      return toContentResponse(item);
    },

    async updateContent(id: string, input: CreateContentInput) {
      assertValidInput(input);
      const updated = await dependencies.contentRepository.update(id, input);

      if (!updated) {
        throw new Error("Content not found");
      }

      return toContentResponse(updated);
    },

    async deleteContent(id: string) {
      if (await dependencies.challengeAssignmentRepository.isContentAssigned(id)) {
        throw new Error("Prompt is assigned to a daily challenge");
      }

      await dependencies.contentRepository.delete(id);
    },

    async listAssignments(dateKey?: string) {
      const assignments = dateKey
        ? await dependencies.challengeAssignmentRepository.listByDate(dateKey)
        : await dependencies.challengeAssignmentRepository.listRecent(7);

      return assignments.map(toAssignmentResponse);
    },

    async assignDailyChallenge(dateKey: string, contentItemId: string) {
      const item = await dependencies.contentRepository.findById(contentItemId);

      if (!item) {
        throw new Error("Content not found");
      }

      const assignment = await dependencies.challengeAssignmentRepository.upsert(
        dateKey,
        contentItemId,
        "manual",
      );

      if (!assignment) {
        throw new Error("Challenge assignment failed");
      }

      return toAssignmentResponse(assignment);
    },

    async generateDailyChallenge(dateKeyInput?: string) {
      const dateKey = toDateKey(dateKeyInput);
      const existing = await dependencies.challengeAssignmentRepository.getByDate(
        dateKey,
      );

      if (existing) {
        return toAssignmentResponse(existing);
      }

      const recentAssignments =
        await dependencies.challengeAssignmentRepository.listRecent(5);
      const recentIds = new Set(
        recentAssignments.map((assignment) => assignment.content_item_id),
      );

      const eligible = await dependencies.contentRepository.listActiveByPreference();
      const next =
        eligible.find((item) => !recentIds.has(item.id)) ?? eligible[0] ?? null;

      if (!next) {
        throw new Error(
          "No eligible content available for challenge generation.",
        );
      }

      const assignment = await dependencies.challengeAssignmentRepository.upsert(
        dateKey,
        next.id,
        "generated",
      );

      if (!assignment) {
        throw new Error("Challenge assignment failed");
      }

      return toAssignmentResponse(assignment);
    },

    async getDailyChallengeContent(dateKeyInput?: string) {
      const dateKey = toDateKey(dateKeyInput);
      const assignment =
        (await dependencies.challengeAssignmentRepository.getByDate(dateKey)) ??
        (await dependencies.challengeAssignmentRepository.upsert(
          dateKey,
          (
            await (async () => {
              const generated = await this.generateDailyChallenge(dateKey);
              return generated.contentItemId;
            })()
          ),
          "generated",
        ));

      if (!assignment) {
        throw new Error("Challenge assignment failed");
      }

      const content = await dependencies.contentRepository.findById(
        assignment.content_item_id,
      );

      if (!content) {
        throw new Error("Assigned challenge content not found");
      }

      return {
        dateKey,
        source: assignment.source as "manual" | "generated",
        content: {
          id: content.id,
          category: content.category as PracticeCategory,
          topic: content.topic as PracticeTopic,
          difficulty: content.difficulty as PracticeDifficulty,
          length: content.length as PracticeLength,
          label: content.label,
          prompt: content.prompt,
        },
      };
    },
  };
}
