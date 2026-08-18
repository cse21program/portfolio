CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "years" TEXT NOT NULL DEFAULT '',
    "summary" TEXT NOT NULL,
    "overview" TEXT NOT NULL DEFAULT '',
    "iconUrl" TEXT,
    "imageUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "seoTitle" TEXT NOT NULL DEFAULT '',
    "seoDescription" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "skill_topics" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "overview" TEXT NOT NULL DEFAULT '',
    "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "videoUrl" TEXT,
    "relatedBlogSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "relatedTutorialSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "relatedCourseSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "seoTitle" TEXT NOT NULL DEFAULT '',
    "seoDescription" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_topics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "skills_slug_key" ON "skills"("slug");
CREATE INDEX "skills_sortOrder_idx" ON "skills"("sortOrder");
CREATE INDEX "skills_field_idx" ON "skills"("field");
CREATE INDEX "skills_featured_idx" ON "skills"("featured");
CREATE UNIQUE INDEX "skill_topics_skillId_slug_key" ON "skill_topics"("skillId", "slug");
CREATE INDEX "skill_topics_skillId_sortOrder_idx" ON "skill_topics"("skillId", "sortOrder");

ALTER TABLE "skill_topics" ADD CONSTRAINT "skill_topics_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
