-- CreateTable
CREATE TABLE "contributors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "totalCommits" INTEGER NOT NULL,
    "firstCommitDate" TIMESTAMP(3) NOT NULL,
    "lastCommitDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contributors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contributors_repositoryId_idx" ON "contributors"("repositoryId");

-- CreateIndex
CREATE INDEX "contributors_email_idx" ON "contributors"("email");

-- CreateIndex
CREATE UNIQUE INDEX "contributors_repositoryId_email_key" ON "contributors"("repositoryId", "email");

-- CreateIndex
CREATE INDEX "commits_repositoryId_email_idx" ON "commits"("repositoryId", "email");

-- AddForeignKey
ALTER TABLE "contributors" ADD CONSTRAINT "contributors_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
