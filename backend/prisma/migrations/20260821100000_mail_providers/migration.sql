CREATE TABLE "mail_settings" (
    "id" TEXT NOT NULL,
    "active" TEXT NOT NULL DEFAULT 'log',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mail_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mail_provider_settings" (
    "provider" TEXT NOT NULL,
    "credentials" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mail_provider_settings_pkey" PRIMARY KEY ("provider")
);
