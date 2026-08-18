import { skills } from "@/content/skills";
import type { KnowledgeTopic } from "@/types/public";
import { normalizeTopicList } from "@/types/topics";

export const topics: KnowledgeTopic[] = normalizeTopicList(
  skills.flatMap((skill) =>
    skill.topics.map((topic) => ({
      ...topic,
      skill: skill.name,
      skillSlug: skill.slug,
      field: skill.field,
      fieldSlug: skill.fieldSlug ?? "",
    })),
  ),
);
