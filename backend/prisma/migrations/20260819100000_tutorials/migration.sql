CREATE TABLE "tutorials" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'Beginner',
    "prerequisites" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "duration" TEXT NOT NULL DEFAULT '',
    "thumbnailUrl" TEXT,
    "skill" TEXT NOT NULL DEFAULT '',
    "relatedSkillSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relatedCourseSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "price" TEXT NOT NULL DEFAULT 'Free',
    "free" BOOLEAN NOT NULL DEFAULT true,
    "sections" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'published',
    "publishedAt" TEXT NOT NULL DEFAULT '',
    "seoTitle" TEXT NOT NULL DEFAULT '',
    "seoDescription" TEXT NOT NULL DEFAULT '',
    "canonicalUrl" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tutorials_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tutorials_slug_key" ON "tutorials"("slug");
CREATE INDEX "tutorials_sortOrder_idx" ON "tutorials"("sortOrder");
CREATE INDEX "tutorials_status_idx" ON "tutorials"("status");
CREATE INDEX "tutorials_difficulty_idx" ON "tutorials"("difficulty");
