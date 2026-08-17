-- CreateTable
CREATE TABLE "resumes" (
    "id" TEXT NOT NULL,
    "headline" TEXT,
    "summary" TEXT,
    "awards" JSONB NOT NULL DEFAULT '[]',
    "publications" JSONB NOT NULL DEFAULT '[]',
    "pdfUrl" TEXT,
    "pdfFileName" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

INSERT INTO "resumes" ("id", "awards", "publications", "version", "createdAt", "updatedAt")
VALUES ('default', '[]'::jsonb, '[]'::jsonb, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
