-- CreateTable
CREATE TABLE "experiences" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT '',
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL DEFAULT '',
    "current" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL DEFAULT '',
    "responsibilities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "achievements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "technologies" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "logoUrl" TEXT,
    "website" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "experiences_sortOrder_idx" ON "experiences"("sortOrder");

INSERT INTO "experiences" (
    "id",
    "company",
    "position",
    "employmentType",
    "location",
    "startDate",
    "endDate",
    "current",
    "description",
    "responsibilities",
    "achievements",
    "technologies",
    "logoUrl",
    "website",
    "sortOrder",
    "createdAt",
    "updatedAt"
) VALUES
(
    'a1e1c8e0-0000-4000-8000-000000000001',
    'Independent',
    'Software Engineer',
    'Freelance / contract',
    'Remote · Bangladesh',
    '2024',
    'Present',
    TRUE,
    'Backend APIs, DevOps, and production delivery for web products. Current focus is this portfolio, course, and services platform.',
    ARRAY[
        'Design modular APIs and data models',
        'Containerize local and production-shaped environments',
        'Turn requirements into shippable slices'
    ]::TEXT[],
    ARRAY[
        'Laid out a modular monolith that can host portfolio, LMS, and commerce without a rewrite',
        'Public site shipped as a static first version against the full product spec'
    ]::TEXT[],
    ARRAY['TypeScript', 'Express', 'PostgreSQL', 'Docker', 'React']::TEXT[],
    NULL,
    NULL,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'a1e1c8e0-0000-4000-8000-000000000002',
    'Leading University',
    'Computer Science',
    'Academic',
    'Sylhet, Bangladesh',
    'Ongoing',
    '',
    TRUE,
    'Academic grounding in computer science alongside shipping real software.',
    ARRAY[
        'Study systems, software design, and engineering practice',
        'Apply coursework to production-shaped side products'
    ]::TEXT[],
    ARRAY['Connect theory to backend, cloud, and delivery work']::TEXT[],
    ARRAY['Java', 'Data structures', 'Databases']::TEXT[],
    NULL,
    'https://www.lus.ac.bd/',
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
