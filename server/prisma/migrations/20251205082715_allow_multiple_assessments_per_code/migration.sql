-- DropIndex
DROP INDEX "assessments_accessCodeId_key";

-- CreateIndex
CREATE INDEX "assessments_accessCodeId_idx" ON "assessments"("accessCodeId");
