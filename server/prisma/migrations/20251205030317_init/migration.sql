-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "username" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "access_codes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" DATETIME,
    "usedByIp" TEXT,
    "batchId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "accessCodeId" TEXT NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "attachmentStyle" TEXT NOT NULL,
    "dimensions" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "assessments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "assessments_accessCodeId_fkey" FOREIGN KEY ("accessCodeId") REFERENCES "access_codes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "access_codes_code_key" ON "access_codes"("code");

-- CreateIndex
CREATE INDEX "access_codes_code_isUsed_idx" ON "access_codes"("code", "isUsed");

-- CreateIndex
CREATE UNIQUE INDEX "assessments_accessCodeId_key" ON "assessments"("accessCodeId");

-- CreateIndex
CREATE INDEX "assessments_userId_idx" ON "assessments"("userId");

-- CreateIndex
CREATE INDEX "assessments_createdAt_idx" ON "assessments"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");
