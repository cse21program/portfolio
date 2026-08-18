ALTER TABLE "skill_topics" RENAME TO "topics";
ALTER INDEX "skill_topics_pkey" RENAME TO "topics_pkey";
ALTER INDEX "skill_topics_skillId_slug_key" RENAME TO "topics_skillId_slug_key";
ALTER INDEX "skill_topics_skillId_sortOrder_idx" RENAME TO "topics_skillId_sortOrder_idx";
ALTER TABLE "topics" RENAME CONSTRAINT "skill_topics_skillId_fkey" TO "topics_skillId_fkey";

ALTER TABLE "topics" ADD COLUMN "body" TEXT NOT NULL DEFAULT '';
ALTER TABLE "topics" ADD COLUMN "codeSnippets" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "topics" ADD COLUMN "resources" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "topics" ADD COLUMN "externalLinks" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "topics" ADD COLUMN "relatedProjectSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "topics" ADD COLUMN "relatedCertificateSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "topics" ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "topics_published_idx" ON "topics"("published");
