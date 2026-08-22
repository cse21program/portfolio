import { logger } from "@common/utils/logger";
import { notificationsRepository } from "../notifications/notifications.repository";
import { STUDIO_FOLLOW_TARGET } from "./follows.constants";
import { followsRepository } from "./follows.repository";

const FANOUT_CHUNK = 100;

type LiveCandidate = { slug: string; status: string; publishedAt: string };

export function newlyLiveItems<T extends LiveCandidate>(
  previous: LiveCandidate[],
  next: T[],
  isLive: (item: LiveCandidate) => boolean,
) {
  const wasLive = new Set(previous.filter(isLive).map((item) => item.slug));
  return next.filter(isLive).filter((item) => !wasLive.has(item.slug));
}

function chunk<T>(items: T[], size: number) {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
}

type PublishKind = "note" | "course" | "tutorial";

const KIND_COPY: Record<
  PublishKind,
  { one: (title: string) => { title: string; body: string; href: string }; manyHref: string; manyNoun: string }
> = {
  note: {
    one: (title) => ({
      title: `New note: ${title}`,
      body: `${title} is now on the studio.`,
      href: "",
    }),
    manyHref: "/blog",
    manyNoun: "notes",
  },
  course: {
    one: (title) => ({
      title: `New course: ${title}`,
      body: `${title} is open on the studio.`,
      href: "",
    }),
    manyHref: "/courses",
    manyNoun: "courses",
  },
  tutorial: {
    one: (title) => ({
      title: `New tutorial: ${title}`,
      body: `${title} is now on the studio.`,
      href: "",
    }),
    manyHref: "/tutorials",
    manyNoun: "tutorials",
  },
};

function hrefFor(kind: PublishKind, slug: string) {
  if (kind === "note") {
    return `/blog/${slug}`;
  }
  if (kind === "course") {
    return `/courses/${slug}`;
  }
  return `/tutorials/${slug}`;
}

export async function notifyStudioPublish(input: {
  kind: PublishKind;
  items: Array<{ title: string; slug: string }>;
  exceptUserId?: string;
}) {
  if (input.items.length === 0) {
    return;
  }

  try {
    const copy = KIND_COPY[input.kind];
    const notice =
      input.items.length === 1
        ? {
            title: copy.one(input.items[0].title).title,
            body: copy.one(input.items[0].title).body,
            href: hrefFor(input.kind, input.items[0].slug),
          }
        : {
            title: `${input.items.length} new ${copy.manyNoun} on the studio`,
            body: input.items
              .slice(0, 3)
              .map((item) => item.title)
              .join(" · "),
            href: copy.manyHref,
          };

    const userIds = await followsRepository.listActiveFollowerIds(
      STUDIO_FOLLOW_TARGET.type,
      STUDIO_FOLLOW_TARGET.key,
      input.exceptUserId,
    );
    if (userIds.length === 0) {
      return;
    }

    for (const group of chunk(userIds, FANOUT_CHUNK)) {
      await notificationsRepository.createMany(
        group.map((userId) => ({
          userId,
          type: "FOLLOW_UPDATE",
          title: notice.title,
          body: notice.body,
          href: notice.href,
        })),
      );
    }
  } catch (error) {
    logger.error("follows.notify_failed", {
      kind: input.kind,
      count: input.items.length,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}
