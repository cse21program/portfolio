CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "fullDescription" TEXT NOT NULL DEFAULT '',
    "thumbnailUrl" TEXT,
    "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "demoVideoUrl" TEXT,
    "category" TEXT NOT NULL DEFAULT '',
    "technologies" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "features" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "architecture" TEXT NOT NULL DEFAULT '',
    "problem" TEXT NOT NULL DEFAULT '',
    "requirements" TEXT NOT NULL DEFAULT '',
    "solution" TEXT NOT NULL DEFAULT '',
    "challenges" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "solutions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "lessons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'Shipped',
    "startDate" TEXT NOT NULL DEFAULT '',
    "endDate" TEXT NOT NULL DEFAULT '',
    "githubUrl" TEXT,
    "liveUrl" TEXT,
    "docsUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "seoTitle" TEXT NOT NULL DEFAULT '',
    "seoDescription" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");
CREATE INDEX "projects_sortOrder_idx" ON "projects"("sortOrder");
CREATE INDEX "projects_featured_idx" ON "projects"("featured");
