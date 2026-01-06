-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp(3) NOT NULL,
	"createdAt" timestamp(3),
	"updatedAt" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"plan" text NOT NULL,
	"referenceId" text NOT NULL,
	"stripeCustomerId" text,
	"stripeSubscriptionId" text,
	"status" text,
	"periodStart" timestamp(3),
	"periodEnd" timestamp(3),
	"cancelAtPeriodEnd" boolean,
	"seats" integer
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp(3),
	"refreshTokenExpiresAt" timestamp(3),
	"scope" text,
	"password" text,
	"createdAt" timestamp(3) NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp(3) NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp(3) NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	"activeOrganizationId" text,
	"impersonatedBy" text
);
--> statement-breakpoint
CREATE TABLE "pending_charge" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"amount" numeric(10, 2) NOT NULL,
	"reason" text NOT NULL,
	"stripePaymentIntentId" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"retryCount" integer DEFAULT 0 NOT NULL,
	"lastRetryAt" timestamp(3),
	"metadata" jsonb,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"resolvedAt" timestamp(3),
	"organizationId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean NOT NULL,
	"image" text,
	"createdAt" timestamp(3) NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"stripeCustomerId" text,
	"banExpires" timestamp(3),
	"banReason" text,
	"banned" boolean,
	"role" text,
	"twoFactorEnabled" boolean,
	"creditAccountId" text
);
--> statement-breakpoint
CREATE TABLE "model_type" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"paramsDisplay" text NOT NULL,
	"family" text,
	"jumpstartModelId" text,
	"trainingImage" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dataset_type" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"description" text NOT NULL,
	"exampleFormat" text NOT NULL,
	"supportsSynthesis" boolean DEFAULT false NOT NULL,
	"synthesisCostPer1k" numeric(10, 4),
	"requiredFields" jsonb NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_stage_log" (
	"id" text PRIMARY KEY NOT NULL,
	"jobId" text NOT NULL,
	"stage" text NOT NULL,
	"status" text NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"message" text,
	"metadata" jsonb,
	"startedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"completedAt" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "credit_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"balanceBefore" numeric(10, 2) NOT NULL,
	"balanceAfter" numeric(10, 2) NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"description" text NOT NULL,
	"jobId" text,
	"stripePaymentIntentId" text,
	"stripeChargeId" text,
	"metadata" jsonb,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"initiatedBy" text,
	"organizationId" text NOT NULL,
	"datasetId" text
);
--> statement-breakpoint
CREATE TABLE "training_job" (
	"id" text PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'created' NOT NULL,
	"sagemakerJobName" text,
	"instanceType" text NOT NULL,
	"estimatedCost" numeric(10, 2) NOT NULL,
	"reservedAmount" numeric(10, 2),
	"actualCost" numeric(10, 2),
	"costFinalized" boolean DEFAULT false NOT NULL,
	"balanceAtStart" numeric(10, 2),
	"wentNegative" boolean DEFAULT false NOT NULL,
	"reserveTransactionId" text,
	"finalTransactionId" text,
	"config" jsonb NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"startedAt" timestamp(3),
	"completedAt" timestamp(3),
	"createdBy" text NOT NULL,
	"organizationId" text NOT NULL,
	"awsAccessKeyId" text NOT NULL,
	"awsRegion" text DEFAULT 'us-east-1' NOT NULL,
	"awsSecretKey" text NOT NULL,
	"currentStage" text DEFAULT 'created' NOT NULL,
	"errorDetails" jsonb,
	"errorMessage" text,
	"instanceCount" integer DEFAULT 1 NOT NULL,
	"outputModelS3Uri" text NOT NULL,
	"queuedAt" timestamp(3),
	"stageMessage" text,
	"stageProgress" integer DEFAULT 0 NOT NULL,
	"validatedAt" timestamp(3),
	"datasetId" text
);
--> statement-breakpoint
CREATE TABLE "dataset_stage_log" (
	"id" text PRIMARY KEY NOT NULL,
	"datasetId" text NOT NULL,
	"stage" text NOT NULL,
	"status" text NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"message" text,
	"metadata" jsonb,
	"startedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"completedAt" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "instance_type" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"description" text NOT NULL,
	"vram" text NOT NULL,
	"costPerHour" numeric(10, 2) NOT NULL,
	"isDefault" boolean DEFAULT false NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "twoFactor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backupCodes" text NOT NULL,
	"userId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "passkey" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"publicKey" text NOT NULL,
	"userId" text NOT NULL,
	"credentialID" text NOT NULL,
	"counter" integer NOT NULL,
	"deviceType" text NOT NULL,
	"backedUp" boolean NOT NULL,
	"transports" text,
	"createdAt" timestamp(3),
	"aaguid" text
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"logo" text,
	"createdAt" timestamp(3) NOT NULL,
	"metadata" text,
	"isVerified" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"userId" text NOT NULL,
	"role" text NOT NULL,
	"createdAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text NOT NULL,
	"expiresAt" timestamp(3) NOT NULL,
	"inviterId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_account" (
	"id" text PRIMARY KEY NOT NULL,
	"balance" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"autoReloadEnabled" boolean DEFAULT false NOT NULL,
	"autoReloadThreshold" numeric(10, 2) DEFAULT '10.00' NOT NULL,
	"autoReloadAmount" numeric(10, 2) DEFAULT '50.00' NOT NULL,
	"maxNegativeBalance" numeric(10, 2) DEFAULT '-20.00' NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"organizationId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "llm_pricing" (
	"id" text PRIMARY KEY NOT NULL,
	"modelName" text NOT NULL,
	"provider" text NOT NULL,
	"inputCostPer1M" numeric(10, 6) NOT NULL,
	"outputCostPer1M" numeric(10, 6) NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dataset" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"createdBy" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"datasetType" text NOT NULL,
	"status" text DEFAULT 'created' NOT NULL,
	"currentStage" text DEFAULT 'created' NOT NULL,
	"stageProgress" integer DEFAULT 0 NOT NULL,
	"stageMessage" text,
	"processingConfig" jsonb,
	"processedDataS3Uri" text,
	"rawExampleCount" integer,
	"processedExampleCount" integer,
	"avgTokensPerExample" double precision,
	"totalTokens" bigint,
	"validationReport" jsonb,
	"qualityScore" double precision,
	"synthesisCost" numeric(10, 2),
	"synthesisTokens" bigint,
	"costReserved" boolean DEFAULT false NOT NULL,
	"costFinalized" boolean DEFAULT false NOT NULL,
	"reserveTransactionId" text,
	"finalTransactionId" text,
	"errorMessage" text,
	"errorDetails" jsonb,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"processedAt" timestamp(3),
	"uploadedFileKey" text,
	"uploadedFileMimeType" text,
	"uploadedFileName" text,
	"uploadedFileSize" bigint
);
--> statement-breakpoint
CREATE TABLE "dataset_model_compatibility" (
	"datasetTypeId" text NOT NULL,
	"modelTypeId" text NOT NULL,
	CONSTRAINT "dataset_model_compatibility_pkey" PRIMARY KEY("datasetTypeId","modelTypeId")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "pending_charge" ADD CONSTRAINT "pending_charge_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "pending_charge" ADD CONSTRAINT "pending_charge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_creditAccountId_fkey" FOREIGN KEY ("creditAccountId") REFERENCES "public"."credit_account"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "job_stage_log" ADD CONSTRAINT "job_stage_log_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."training_job"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."training_job"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_initiatedBy_fkey" FOREIGN KEY ("initiatedBy") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "public"."dataset"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "training_job" ADD CONSTRAINT "training_job_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "training_job" ADD CONSTRAINT "training_job_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "training_job" ADD CONSTRAINT "training_job_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "public"."dataset"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "dataset_stage_log" ADD CONSTRAINT "dataset_stage_log_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "public"."dataset"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "twoFactor" ADD CONSTRAINT "twoFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "credit_account" ADD CONSTRAINT "credit_account_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "dataset" ADD CONSTRAINT "dataset_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "dataset" ADD CONSTRAINT "dataset_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "dataset_model_compatibility" ADD CONSTRAINT "dataset_model_compatibility_datasetTypeId_fkey" FOREIGN KEY ("datasetTypeId") REFERENCES "public"."dataset_type"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "dataset_model_compatibility" ADD CONSTRAINT "dataset_model_compatibility_modelTypeId_fkey" FOREIGN KEY ("modelTypeId") REFERENCES "public"."model_type"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_key" ON "session" USING btree ("token" text_ops);--> statement-breakpoint
CREATE INDEX "pending_charge_organizationId_status_idx" ON "pending_charge" USING btree ("organizationId" text_ops,"status" text_ops);--> statement-breakpoint
CREATE INDEX "pending_charge_status_idx" ON "pending_charge" USING btree ("status" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "pending_charge_stripePaymentIntentId_key" ON "pending_charge" USING btree ("stripePaymentIntentId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_key" ON "user" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "job_stage_log_jobId_stage_idx" ON "job_stage_log" USING btree ("jobId" text_ops,"stage" text_ops);--> statement-breakpoint
CREATE INDEX "credit_transaction_datasetId_idx" ON "credit_transaction" USING btree ("datasetId" text_ops);--> statement-breakpoint
CREATE INDEX "credit_transaction_jobId_idx" ON "credit_transaction" USING btree ("jobId" text_ops);--> statement-breakpoint
CREATE INDEX "credit_transaction_organizationId_createdAt_idx" ON "credit_transaction" USING btree ("organizationId" timestamp_ops,"createdAt" text_ops);--> statement-breakpoint
CREATE INDEX "credit_transaction_stripePaymentIntentId_idx" ON "credit_transaction" USING btree ("stripePaymentIntentId" text_ops);--> statement-breakpoint
CREATE INDEX "training_job_createdBy_idx" ON "training_job" USING btree ("createdBy" text_ops);--> statement-breakpoint
CREATE INDEX "training_job_datasetId_idx" ON "training_job" USING btree ("datasetId" text_ops);--> statement-breakpoint
CREATE INDEX "training_job_organizationId_createdAt_idx" ON "training_job" USING btree ("organizationId" text_ops,"createdAt" text_ops);--> statement-breakpoint
CREATE INDEX "training_job_sagemakerJobName_idx" ON "training_job" USING btree ("sagemakerJobName" text_ops);--> statement-breakpoint
CREATE INDEX "training_job_status_idx" ON "training_job" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "dataset_stage_log_datasetId_stage_idx" ON "dataset_stage_log" USING btree ("datasetId" text_ops,"stage" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "organization_slug_key" ON "organization" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "credit_account_organizationId_key" ON "credit_account" USING btree ("organizationId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "llm_pricing_modelName_key" ON "llm_pricing" USING btree ("modelName" text_ops);--> statement-breakpoint
CREATE INDEX "dataset_createdBy_idx" ON "dataset" USING btree ("createdBy" text_ops);--> statement-breakpoint
CREATE INDEX "dataset_datasetType_idx" ON "dataset" USING btree ("datasetType" text_ops);--> statement-breakpoint
CREATE INDEX "dataset_organizationId_createdAt_idx" ON "dataset" USING btree ("organizationId" timestamp_ops,"createdAt" timestamp_ops);--> statement-breakpoint
CREATE INDEX "dataset_status_idx" ON "dataset" USING btree ("status" text_ops);
*/