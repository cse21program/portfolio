-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "href" TEXT NOT NULL DEFAULT '',
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "adminNote" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reviews_userId_kind_slug_key" ON "reviews"("userId", "kind", "slug");

-- CreateIndex
CREATE INDEX "reviews_kind_slug_status_idx" ON "reviews"("kind", "slug", "status");

-- CreateIndex
CREATE INDEX "reviews_userId_createdAt_idx" ON "reviews"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "reviews_status_idx" ON "reviews"("status");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
