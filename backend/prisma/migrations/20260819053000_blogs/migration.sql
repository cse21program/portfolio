CREATE TABLE "blogs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "featuredImageUrl" TEXT,
    "author" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skill" TEXT NOT NULL DEFAULT '',
    "topic" TEXT NOT NULL DEFAULT '',
    "readingTime" TEXT NOT NULL DEFAULT '',
    "publishedAt" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'published',
    "seoTitle" TEXT NOT NULL DEFAULT '',
    "seoDescription" TEXT NOT NULL DEFAULT '',
    "canonicalUrl" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blogs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "blogs_slug_key" ON "blogs"("slug");
CREATE INDEX "blogs_sortOrder_idx" ON "blogs"("sortOrder");
CREATE INDEX "blogs_status_idx" ON "blogs"("status");
CREATE INDEX "blogs_category_idx" ON "blogs"("category");
