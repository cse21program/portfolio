ALTER TABLE "newsletter_subscribers" ADD COLUMN "unsubscribeToken" TEXT;

UPDATE "newsletter_subscribers"
SET "unsubscribeToken" = md5(random()::text || "id")
WHERE "unsubscribeToken" IS NULL;

ALTER TABLE "newsletter_subscribers" ALTER COLUMN "unsubscribeToken" SET NOT NULL;

CREATE UNIQUE INDEX "newsletter_subscribers_unsubscribeToken_key" ON "newsletter_subscribers"("unsubscribeToken");
