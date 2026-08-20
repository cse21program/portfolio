-- CreateTable
CREATE TABLE "payment_provider_settings" (
    "provider" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "mode" TEXT NOT NULL DEFAULT 'demo',
    "credentials" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_provider_settings_pkey" PRIMARY KEY ("provider")
);
