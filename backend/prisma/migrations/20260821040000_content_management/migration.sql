-- CreateTable
CREATE TABLE "certificates" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "issueDate" TEXT NOT NULL DEFAULT '',
    "expiryDate" TEXT NOT NULL DEFAULT '',
    "credentialId" TEXT NOT NULL DEFAULT '',
    "skill" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT,
    "documentUrl" TEXT,
    "documentName" TEXT,
    "verificationUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'published',
    "publishedAt" TEXT NOT NULL DEFAULT '',
    "seoTitle" TEXT NOT NULL DEFAULT '',
    "seoDescription" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "certificates_slug_key" ON "certificates"("slug");
CREATE INDEX "certificates_sortOrder_idx" ON "certificates"("sortOrder");
CREATE INDEX "certificates_status_idx" ON "certificates"("status");
CREATE INDEX "certificates_featured_idx" ON "certificates"("featured");

ALTER TABLE "projects" ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX "projects_published_idx" ON "projects"("published");
