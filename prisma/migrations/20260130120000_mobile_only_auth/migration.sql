-- CreateIndex: mobileNumber must be unique for mobile-only login
CREATE UNIQUE INDEX "users_mobileNumber_key" ON "users"("mobileNumber");
