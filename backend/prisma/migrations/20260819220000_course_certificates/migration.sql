CREATE TABLE "course_certificates" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseSlug" TEXT NOT NULL,
    "courseTitle" TEXT NOT NULL,
    "instructor" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_certificates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "course_certificates_publicId_key" ON "course_certificates"("publicId");
CREATE UNIQUE INDEX "course_certificates_enrollmentId_key" ON "course_certificates"("enrollmentId");
CREATE INDEX "course_certificates_userId_idx" ON "course_certificates"("userId");
CREATE INDEX "course_certificates_courseSlug_idx" ON "course_certificates"("courseSlug");

ALTER TABLE "course_certificates" ADD CONSTRAINT "course_certificates_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
