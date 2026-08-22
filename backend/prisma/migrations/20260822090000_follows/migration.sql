-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'FOLLOW_UPDATE';

-- CreateEnum
CREATE TYPE "FollowTargetType" AS ENUM ('SITE', 'SKILL', 'TOPIC', 'COURSE');

-- CreateTable
CREATE TABLE "follows" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" "FollowTargetType" NOT NULL,
    "targetKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "follows_userId_targetType_targetKey_key" ON "follows"("userId", "targetType", "targetKey");

-- CreateIndex
CREATE INDEX "follows_targetType_targetKey_createdAt_idx" ON "follows"("targetType", "targetKey", "createdAt");

-- CreateIndex
CREATE INDEX "follows_userId_createdAt_idx" ON "follows"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
