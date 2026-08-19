CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL,
    "overview" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "thumbnailUrl" TEXT,
    "promoVideoUrl" TEXT,
    "instructor" TEXT NOT NULL DEFAULT 'Rezaul Karim',
    "category" TEXT NOT NULL DEFAULT '',
    "skill" TEXT NOT NULL DEFAULT '',
    "difficulty" TEXT NOT NULL DEFAULT 'Beginner',
    "language" TEXT NOT NULL DEFAULT 'English',
    "duration" TEXT NOT NULL DEFAULT '',
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "outcomes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "audience" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "price" TEXT NOT NULL DEFAULT 'Free',
    "salePrice" TEXT NOT NULL DEFAULT '',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "free" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "certificateAvailable" BOOLEAN NOT NULL DEFAULT false,
    "relatedSkillSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relatedTutorialSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relatedCourseSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "modules" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'published',
    "publishedAt" TEXT NOT NULL DEFAULT '',
    "seoTitle" TEXT NOT NULL DEFAULT '',
    "seoDescription" TEXT NOT NULL DEFAULT '',
    "canonicalUrl" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");
CREATE INDEX "courses_sortOrder_idx" ON "courses"("sortOrder");
CREATE INDEX "courses_status_idx" ON "courses"("status");
CREATE INDEX "courses_difficulty_idx" ON "courses"("difficulty");
CREATE INDEX "courses_featured_idx" ON "courses"("featured");
