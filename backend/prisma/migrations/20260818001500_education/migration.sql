CREATE TABLE "education" (
    "id" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL DEFAULT '',
    "current" BOOLEAN NOT NULL DEFAULT false,
    "grade" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "achievements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "logoUrl" TEXT,
    "documentUrl" TEXT,
    "documentName" TEXT,
    "website" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "education_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "education_sortOrder_idx" ON "education"("sortOrder");

INSERT INTO "education" (
    "id",
    "institution",
    "degree",
    "field",
    "startDate",
    "endDate",
    "current",
    "grade",
    "location",
    "description",
    "achievements",
    "logoUrl",
    "documentUrl",
    "documentName",
    "website",
    "sortOrder",
    "createdAt",
    "updatedAt"
) VALUES (
    'b2e2d9f1-0000-4000-8000-000000000001',
    'Leading University',
    'B.Sc.',
    'Computer Science & Engineering',
    'Ongoing',
    '',
    TRUE,
    '',
    'Sylhet, Bangladesh',
    'Core computer science with an emphasis on software construction, databases, and systems thinking.',
    ARRAY[
        'Build software alongside academic work',
        'Use real projects as the lab for backend and DevOps skills'
    ]::TEXT[],
    NULL,
    NULL,
    NULL,
    'https://www.lus.ac.bd/',
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
