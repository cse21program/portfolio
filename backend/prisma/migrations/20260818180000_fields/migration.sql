CREATE TABLE "fields" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "overview" TEXT NOT NULL DEFAULT '',
    "iconUrl" TEXT,
    "thumbnailUrl" TEXT,
    "bannerUrl" TEXT,
    "videoUrl" TEXT,
    "embedVideoUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "seoTitle" TEXT NOT NULL DEFAULT '',
    "seoDescription" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fields_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "fields_slug_key" ON "fields"("slug");
CREATE INDEX "fields_sortOrder_idx" ON "fields"("sortOrder");
CREATE INDEX "fields_featured_idx" ON "fields"("featured");

INSERT INTO "fields" (
    "id",
    "name",
    "slug",
    "summary",
    "overview",
    "videoUrl",
    "embedVideoUrl",
    "sortOrder",
    "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    grouped.field,
    TRIM(BOTH '-' FROM regexp_replace(lower(grouped.field), '[^a-z0-9]+', '-', 'g')),
    grouped.field,
    '',
    grouped."fieldVideoUrl",
    grouped."fieldEmbedVideoUrl",
    grouped."sortOrder",
    CURRENT_TIMESTAMP
FROM (
    SELECT
        "field",
        MIN("sortOrder") AS "sortOrder",
        (ARRAY_AGG("fieldVideoUrl") FILTER (WHERE "fieldVideoUrl" IS NOT NULL))[1] AS "fieldVideoUrl",
        (ARRAY_AGG("fieldEmbedVideoUrl") FILTER (WHERE "fieldEmbedVideoUrl" IS NOT NULL))[1] AS "fieldEmbedVideoUrl"
    FROM "skills"
    WHERE TRIM("field") <> ''
    GROUP BY "field"
) AS grouped;

ALTER TABLE "skills" ADD COLUMN "fieldId" TEXT;

UPDATE "skills" AS skill
SET "fieldId" = field.id
FROM "fields" AS field
WHERE field.name = skill.field;

ALTER TABLE "skills" ALTER COLUMN "fieldId" SET NOT NULL;
ALTER TABLE "skills" ADD CONSTRAINT "skills_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "skills_fieldId_idx" ON "skills"("fieldId");
DROP INDEX IF EXISTS "skills_field_idx";

ALTER TABLE "skills" DROP COLUMN "field";
ALTER TABLE "skills" DROP COLUMN "fieldVideoUrl";
ALTER TABLE "skills" DROP COLUMN "fieldEmbedVideoUrl";
