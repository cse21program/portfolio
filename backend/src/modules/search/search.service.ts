import { prisma } from "@common/database/prisma";
import { blogsRepository } from "../blogs/blogs.repository";
import { isPublishedBlog } from "../blogs/blogs.types";
import { coursesRepository } from "../courses/courses.repository";
import { isPublishedCourse } from "../courses/courses.types";
import { projectsRepository } from "../projects/projects.repository";
import { servicesRepository } from "../services/services.repository";
import { isPublishedService } from "../services/services.types";
import { skillsRepository } from "../skills/skills.repository";
import { topicsRepository } from "../topics/topics.repository";
import { tutorialsRepository } from "../tutorials/tutorials.repository";
import { isPublishedTutorial } from "../tutorials/tutorials.types";
import { siteAccessService } from "../site-access/site-access.service";
import {
  itemPriceBand,
  matchesAccessFilter,
  matchesPriceFilter,
  matchesSkillFilter,
  matchesTopicFilter,
  matchesYearFilter,
  paidCents,
  popularityScore,
  searchAccess,
  searchPriceBands,
  uniqueSorted,
  uniqueYears,
  type SearchAccess,
  type SearchPriceBand,
} from "./search.filters";
import {
  emptySearchFacets,
  haystackOf,
  matchesNeedle,
  searchKinds,
  takeGroup,
  type SearchCandidate,
  type SearchFacets,
  type SearchGroup,
  type SearchKind,
  type SearchResults,
} from "./search.types";
import type { SearchQueryInput } from "./search.validation";

function candidate(
  kind: SearchKind,
  title: string,
  href: string,
  summary: string,
  meta: string,
  extra: Omit<SearchCandidate, "kind" | "title" | "href" | "summary" | "meta">,
): SearchCandidate {
  return { kind, title, href, summary, meta, ...extra };
}

async function popularityMaps() {
  const [likes, reviews] = await Promise.all([
    prisma.blogLike.groupBy({
      by: ["slug"],
      _count: { _all: true },
    }),
    prisma.review.groupBy({
      by: ["kind", "slug"],
      where: { status: "approved" },
      _count: { _all: true },
    }),
  ]);

  const likeCounts = new Map(likes.map((row) => [row.slug, row._count._all]));
  const reviewCounts = new Map(
    reviews.map((row) => [`${row.kind}:${row.slug}`, row._count._all]),
  );

  return {
    likes: (slug: string) => likeCounts.get(slug) ?? 0,
    reviews: (kind: string, slug: string) => reviewCounts.get(`${kind}:${slug}`) ?? 0,
  };
}

async function searchProjects(needle: string, scores: Awaited<ReturnType<typeof popularityMaps>>) {
  const projects = await projectsRepository.list();
  return projects
    .filter((item) => item.published !== false)
    .filter((item) =>
      matchesNeedle(haystackOf([item.title, item.shortDescription, item.category, item.technologies]), needle),
    )
    .map((item) =>
      candidate("project", item.title, `/projects/${item.slug}`, item.shortDescription, item.category, {
        publishedAt: item.startDate,
        skill: "",
        topic: "",
        free: null,
        priceCents: null,
        featured: item.featured,
        popularity: popularityScore(item.featured, scores.reviews("project", item.slug)),
      }),
    );
}

async function searchSkills(needle: string) {
  const skills = await skillsRepository.list();
  return skills
    .filter((item) => item.published)
    .filter((item) =>
      matchesNeedle(
        haystackOf([
          item.name,
          item.summary,
          item.field,
          item.level,
          item.topics.filter((topic) => topic.published).map((topic) => topic.title),
        ]),
        needle,
      ),
    )
    .map((item) =>
      candidate("skill", item.name, `/skills/${item.slug}`, item.summary, item.field, {
        publishedAt: "",
        skill: item.name,
        topic: "",
        free: null,
        priceCents: null,
        featured: item.featured,
        popularity: popularityScore(item.featured),
      }),
    );
}

async function searchTopics(needle: string) {
  const topics = await topicsRepository.list();
  return topics
    .filter((item) => item.published)
    .filter((item) => matchesNeedle(haystackOf([item.title, item.summary, item.skill, item.field]), needle))
    .map((item) =>
      candidate("topic", item.title, `/topics/${item.skillSlug}/${item.slug}`, item.summary, item.skill, {
        publishedAt: "",
        skill: item.skill,
        topic: item.title,
        free: null,
        priceCents: null,
        featured: false,
        popularity: 0,
      }),
    );
}

async function searchBlogs(needle: string, scores: Awaited<ReturnType<typeof popularityMaps>>) {
  const blogs = await blogsRepository.list();
  return blogs
    .filter(isPublishedBlog)
    .filter((item) =>
      matchesNeedle(
        haystackOf([item.title, item.excerpt, item.category, item.skill, item.topic, item.tags]),
        needle,
      ),
    )
    .map((item) =>
      candidate("blog", item.title, `/blog/${item.slug}`, item.excerpt, item.category, {
        publishedAt: item.publishedAt,
        skill: item.skill,
        topic: item.topic,
        free: true,
        priceCents: 0,
        featured: false,
        popularity: popularityScore(false, scores.likes(item.slug)),
      }),
    );
}

async function searchTutorials(needle: string, scores: Awaited<ReturnType<typeof popularityMaps>>) {
  const tutorials = await tutorialsRepository.list();
  return tutorials
    .filter(isPublishedTutorial)
    .filter((item) =>
      matchesNeedle(
        haystackOf([
          item.title,
          item.description,
          item.skill,
          item.sections.map((section) => section.title),
          item.sections.map((section) => section.summary),
        ]),
        needle,
      ),
    )
    .map((item) =>
      candidate("tutorial", item.title, `/tutorials/${item.slug}`, item.description, item.skill, {
        publishedAt: item.publishedAt,
        skill: item.skill,
        topic: "",
        free: item.free,
        priceCents: paidCents(item.free, item.price),
        featured: false,
        popularity: popularityScore(false, scores.reviews("tutorial", item.slug)),
      }),
    );
}

async function searchCourses(needle: string, scores: Awaited<ReturnType<typeof popularityMaps>>) {
  const courses = await coursesRepository.list();
  return courses
    .filter(isPublishedCourse)
    .filter((item) =>
      matchesNeedle(
        haystackOf([
          item.title,
          item.subtitle,
          item.description,
          item.skill,
          item.category,
          item.modules.map((courseModule) => courseModule.title),
          item.modules.flatMap((courseModule) => courseModule.lessons.map((lesson) => lesson.title)),
        ]),
        needle,
      ),
    )
    .map((item) =>
      candidate("course", item.title, `/courses/${item.slug}`, item.subtitle || item.description, item.skill, {
        publishedAt: item.publishedAt,
        skill: item.skill,
        topic: "",
        free: item.free,
        priceCents: paidCents(item.free, item.salePrice, item.price),
        featured: item.featured,
        popularity: popularityScore(item.featured, scores.reviews("course", item.slug)),
      }),
    );
}

async function searchServices(needle: string, scores: Awaited<ReturnType<typeof popularityMaps>>) {
  const services = await servicesRepository.list();
  return services
    .filter(isPublishedService)
    .filter((item) =>
      matchesNeedle(haystackOf([item.title, item.shortDescription, item.category, item.technologies]), needle),
    )
    .map((item) =>
      candidate("service", item.title, `/services/${item.slug}`, item.shortDescription, item.category, {
        publishedAt: item.publishedAt,
        skill: "",
        topic: "",
        free: false,
        priceCents: paidCents(false, item.startingPrice),
        featured: item.featured,
        popularity: popularityScore(item.featured, scores.reviews("service", item.slug)),
      }),
    );
}

const catalogForKind: Record<SearchKind, "projects" | "skills" | "blogs" | "tutorials" | "courses" | "services"> = {
  project: "projects",
  skill: "skills",
  topic: "skills",
  blog: "blogs",
  tutorial: "tutorials",
  course: "courses",
  service: "services",
};

const searchers: Record<
  SearchKind,
  (needle: string, scores: Awaited<ReturnType<typeof popularityMaps>>) => Promise<SearchCandidate[]>
> = {
  project: searchProjects,
  skill: (needle) => searchSkills(needle),
  topic: (needle) => searchTopics(needle),
  blog: searchBlogs,
  tutorial: searchTutorials,
  course: searchCourses,
  service: searchServices,
};

function facetsOf(items: SearchCandidate[]): SearchFacets {
  const access = searchAccess.filter((value) => items.some((item) => matchesAccessFilter(item.free, value)));
  const prices = searchPriceBands.filter((band) =>
    items.some((item) => itemPriceBand(item.free, item.priceCents) === band),
  );
  return {
    years: uniqueYears(items.map((item) => item.publishedAt)),
    skills: uniqueSorted(items.map((item) => item.skill)),
    topics: uniqueSorted(items.map((item) => item.topic)),
    access,
    prices,
  };
}

function matchesFilters(
  item: SearchCandidate,
  filters: {
    year?: string;
    skill?: string;
    topic?: string;
    access?: SearchAccess;
    price?: SearchPriceBand;
  },
) {
  return (
    matchesYearFilter(item.publishedAt, filters.year) &&
    matchesSkillFilter(item.skill, filters.skill) &&
    matchesTopicFilter(item.topic, filters.topic) &&
    matchesAccessFilter(item.free, filters.access) &&
    matchesPriceFilter(item.free, item.priceCents, filters.price)
  );
}

export const searchService = {
  async search(input: SearchQueryInput): Promise<SearchResults> {
    const query = input.q.trim();
    const kind = input.kind ?? null;
    const sort = input.sort;
    if (!query) {
      return { query: "", kind, sort, total: 0, groups: [], facets: emptySearchFacets };
    }

    const needle = query.toLowerCase();
    const requested = kind ? [kind] : [...searchKinds];
    const kinds: SearchKind[] = [];
    for (const current of requested) {
      if (await siteAccessService.isOpen(catalogForKind[current])) {
        kinds.push(current);
      }
    }
    const scores = await popularityMaps();
    const matched: SearchCandidate[] = [];

    for (const current of kinds) {
      matched.push(...(await searchers[current](needle, scores)));
    }

    const facets = facetsOf(matched);
    const filtered = matched.filter((item) =>
      matchesFilters(item, {
        year: input.year,
        skill: input.skill,
        topic: input.topic,
        access: input.access,
        price: input.price,
      }),
    );

    const groups: SearchGroup[] = [];
    for (const current of kinds) {
      const group = takeGroup(
        current,
        filtered.filter((item) => item.kind === current),
        needle,
        sort,
      );
      if (group) {
        groups.push(group);
      }
    }

    return {
      query,
      kind,
      sort,
      total: groups.reduce((sum, group) => sum + group.items.length, 0),
      groups,
      facets,
    };
  },
};
