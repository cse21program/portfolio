ALTER TABLE "profiles" ADD COLUMN "gallery" JSONB NOT NULL DEFAULT '[]';

UPDATE "profiles"
SET "gallery" = COALESCE(
  (
    SELECT jsonb_agg(
      jsonb_build_object('url', item.url, 'private', false)
      ORDER BY item.ordinality
    )
    FROM unnest("galleryImageUrls") WITH ORDINALITY AS item(url, ordinality)
  ),
  '[]'::jsonb
);

ALTER TABLE "profiles" DROP COLUMN "galleryImageUrls";
