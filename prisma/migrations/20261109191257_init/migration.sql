-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'RESTRICTED', 'SUSPENDED', 'GHOST');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('ARTICLE', 'STORY', 'LANGUAGE_EXPLANATION', 'ORAL_TRADITION', 'PERSONAL_EXPERIENCE', 'INTERVIEW', 'EVENT_NOTICE', 'RESEARCH_PIECE', 'OPINION_INTERPRETATION');

-- CreateEnum
CREATE TYPE "KnowledgeSourceType" AS ENUM ('PERSONAL_EXPERIENCE', 'FAMILY_ORAL_TRADITION', 'COMMUNITY_PRACTICE', 'DOCUMENTED_HISTORY', 'RESEARCH_BASED', 'INTERVIEW_BASED', 'INTERPRETATION_OPINION');

-- CreateEnum
CREATE TYPE "ContentLanguage" AS ENUM ('KINYARWANDA', 'ENGLISH', 'FRENCH', 'MIXED');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'UNPUBLISHED', 'REMOVED', 'AUTO_HIDDEN');

-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('VISIBLE', 'REMOVED_PLACEHOLDER');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('THREATS_VIOLENCE', 'HATE_SPEECH', 'PRIVACY_VIOLATION', 'SPAM_MANIPULATION', 'IMPERSONATION', 'PLAGIARISM_IP', 'HARASSMENT', 'FABRICATED_INFO', 'OFF_TOPIC', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'REVIEWED', 'ACTIONED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ModerationActionType" AS ENUM ('DISMISS_AND_RESTORE', 'WARN_AUTHOR', 'REMOVE_CONTENT', 'RESTRICT_ACCOUNT', 'SUSPEND_ACCOUNT');

-- CreateEnum
CREATE TYPE "RemovalRequestStatus" AS ENUM ('PENDING', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('COMMENT', 'REPLY', 'FOLLOW', 'NEW_PUBLICATION', 'MODERATION_ACTION', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT,
    "emailOrPhone" TEXT,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isModerator" BOOLEAN NOT NULL DEFAULT false,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'rw',
    "isFoundingContributor" BOOLEAN NOT NULL DEFAULT false,
    "foundingJoinDate" TIMESTAMP(3),
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "statedAgeBand" TEXT NOT NULL DEFAULT '18+',
    "profilePhotoUrl" TEXT,
    "areasOfInterest" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "researchUseConsent" BOOLEAN NOT NULL DEFAULT false,
    "communityRulesAccepted" BOOLEAN NOT NULL DEFAULT false,
    "communityRulesAcceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemovalRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "requesterIdentifier" TEXT NOT NULL,
    "status" "RemovalRequestStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,

    CONSTRAINT "RemovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameRw" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "description" TEXT,
    "isHealthOrMedicine" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopicCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Publication" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "summary" TEXT,
    "authorId" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "knowledgeSources" "KnowledgeSourceType"[],
    "contentLanguage" "ContentLanguage" NOT NULL DEFAULT 'KINYARWANDA',
    "sourceCitation" TEXT,
    "hostingLicenseGranted" BOOLEAN NOT NULL DEFAULT true,
    "researchUseConsent" BOOLEAN NOT NULL DEFAULT false,
    "status" "PublicationStatus" NOT NULL DEFAULT 'PUBLISHED',
    "autoHideReason" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relatedVersionsNote" TEXT,
    "publishedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "lastEditedAt" TIMESTAMP(3),
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "featuredAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationTopic" (
    "publicationId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "PublicationTopic_pkey" PRIMARY KEY ("publicationId","categoryId")
);

-- CreateTable
CREATE TABLE "PublicationTranslation" (
    "id" TEXT NOT NULL,
    "originalPublicationId" TEXT NOT NULL,
    "translatedPublicationId" TEXT NOT NULL,
    "language" "ContentLanguage" NOT NULL,
    "translatorNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicationTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "body" TEXT NOT NULL,
    "isAlternativeVersion" BOOLEAN NOT NULL DEFAULT false,
    "status" "CommentStatus" NOT NULL DEFAULT 'VISIBLE',
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "lastEditedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "publicationId" TEXT,
    "commentId" TEXT,
    "reason" "ReportReason" NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "autoHidden" BOOLEAN NOT NULL DEFAULT false,
    "resolutionNotes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationActionLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "actionTaken" "ModerationActionType" NOT NULL,
    "ruleCited" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordOfTheWeek" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "pronunciation" TEXT,
    "explanationRw" TEXT NOT NULL,
    "explanationEn" TEXT NOT NULL,
    "explanationFr" TEXT,
    "culturalContext" TEXT,
    "exampleSentenceRw" TEXT,
    "exampleSentenceTranslation" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WordOfTheWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeaturedItem" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeaturedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "CommunityRule" (
    "ruleCode" TEXT NOT NULL,
    "titleRw" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleFr" TEXT NOT NULL,
    "descriptionRw" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "descriptionFr" TEXT NOT NULL,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityRule_pkey" PRIMARY KEY ("ruleCode")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailOrPhone_key" ON "User"("emailOrPhone");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_accountStatus_idx" ON "User"("accountStatus");

-- CreateIndex
CREATE INDEX "RemovalRequest_status_idx" ON "RemovalRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TopicCategory_slug_key" ON "TopicCategory"("slug");

-- CreateIndex
CREATE INDEX "TopicCategory_slug_idx" ON "TopicCategory"("slug");

-- CreateIndex
CREATE INDEX "TopicCategory_isArchived_idx" ON "TopicCategory"("isArchived");

-- CreateIndex
CREATE UNIQUE INDEX "Publication_slug_key" ON "Publication"("slug");

-- CreateIndex
CREATE INDEX "Publication_status_publishedAt_idx" ON "Publication"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Publication_authorId_idx" ON "Publication"("authorId");

-- CreateIndex
CREATE INDEX "Publication_contentLanguage_idx" ON "Publication"("contentLanguage");

-- CreateIndex
CREATE INDEX "Publication_contentType_idx" ON "Publication"("contentType");

-- CreateIndex
CREATE INDEX "Publication_isFeatured_idx" ON "Publication"("isFeatured");

-- CreateIndex
CREATE INDEX "PublicationTopic_categoryId_idx" ON "PublicationTopic"("categoryId");

-- CreateIndex
CREATE INDEX "PublicationTopic_publicationId_idx" ON "PublicationTopic"("publicationId");

-- CreateIndex
CREATE UNIQUE INDEX "PublicationTranslation_originalPublicationId_translatedPubl_key" ON "PublicationTranslation"("originalPublicationId", "translatedPublicationId");

-- CreateIndex
CREATE INDEX "Comment_publicationId_createdAt_idx" ON "Comment"("publicationId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

-- CreateIndex
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");

-- CreateIndex
CREATE INDEX "Follow_followerId_idx" ON "Follow"("followerId");

-- CreateIndex
CREATE INDEX "Follow_followingId_idx" ON "Follow"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerId_followingId_key" ON "Follow"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "Bookmark_userId_idx" ON "Bookmark"("userId");

-- CreateIndex
CREATE INDEX "Bookmark_publicationId_idx" ON "Bookmark"("publicationId");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_publicationId_key" ON "Bookmark"("userId", "publicationId");

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Report_publicationId_idx" ON "Report"("publicationId");

-- CreateIndex
CREATE INDEX "Report_commentId_idx" ON "Report"("commentId");

-- CreateIndex
CREATE INDEX "Report_reason_idx" ON "Report"("reason");

-- CreateIndex
CREATE UNIQUE INDEX "Report_reporterId_publicationId_reason_key" ON "Report"("reporterId", "publicationId", "reason");

-- CreateIndex
CREATE UNIQUE INDEX "Report_reporterId_commentId_reason_key" ON "Report"("reporterId", "commentId", "reason");

-- CreateIndex
CREATE INDEX "ModerationActionLog_targetType_targetId_idx" ON "ModerationActionLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "ModerationActionLog_actorId_idx" ON "ModerationActionLog"("actorId");

-- CreateIndex
CREATE INDEX "ModerationActionLog_createdAt_idx" ON "ModerationActionLog"("createdAt");

-- CreateIndex
CREATE INDEX "WordOfTheWeek_isActive_startDate_endDate_idx" ON "WordOfTheWeek"("isActive", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "FeaturedItem_isActive_type_idx" ON "FeaturedItem"("isActive", "type");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

-- AddForeignKey
ALTER TABLE "RemovalRequest" ADD CONSTRAINT "RemovalRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationTopic" ADD CONSTRAINT "PublicationTopic_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationTopic" ADD CONSTRAINT "PublicationTopic_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TopicCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationTranslation" ADD CONSTRAINT "PublicationTranslation_originalPublicationId_fkey" FOREIGN KEY ("originalPublicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationTranslation" ADD CONSTRAINT "PublicationTranslation_translatedPublicationId_fkey" FOREIGN KEY ("translatedPublicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationActionLog" ADD CONSTRAINT "ModerationActionLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
