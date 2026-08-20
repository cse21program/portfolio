-- CreateTable
CREATE TABLE "video_assets" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "embedUrl" TEXT,
    "posterUrl" TEXT,
    "caption" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "video_assets_url_key" ON "video_assets"("url");

-- CreateIndex
CREATE INDEX "video_assets_provider_createdAt_idx" ON "video_assets"("provider", "createdAt");

-- CreateIndex
CREATE INDEX "video_assets_createdAt_idx" ON "video_assets"("createdAt");
