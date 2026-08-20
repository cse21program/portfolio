-- CreateTable
CREATE TABLE IF NOT EXISTS "site_visits" (
    "id" TEXT NOT NULL,
    "visitorKey" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "site_visits_visitorKey_createdAt_idx" ON "site_visits"("visitorKey", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "site_visits_path_createdAt_idx" ON "site_visits"("path", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "site_visits_createdAt_idx" ON "site_visits"("createdAt");
