-- Add employee and reporting fields needed by the Organization/RBAC adapter.
ALTER TABLE "users"
  ADD COLUMN "employeeCode" TEXT,
  ADD COLUMN "startDate" DATE,
  ADD COLUMN "managerId" UUID;

ALTER TABLE "departments"
  ADD COLUMN "managerId" UUID;

CREATE UNIQUE INDEX "users_employeeCode_key" ON "users"("employeeCode");
CREATE INDEX "users_managerId_idx" ON "users"("managerId");
CREATE INDEX "departments_managerId_idx" ON "departments"("managerId");

ALTER TABLE "users"
  ADD CONSTRAINT "users_managerId_fkey"
  FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "departments"
  ADD CONSTRAINT "departments_managerId_fkey"
  FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
