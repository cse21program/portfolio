-- CreateTable
CREATE TABLE "site_access" (
    "id" TEXT NOT NULL,
    "catalogs" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_access_pkey" PRIMARY KEY ("id")
);
