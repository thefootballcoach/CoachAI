import { pgTable, text, serial, integer, boolean, timestamp, json, doublePrecision, bigint, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name"),
  role: text("role").default("coach"), // coach, admin, club_admin, academy_director
  clubId: integer("club_id").references(() => clubs.id, { onDelete: "set null" }),
  position: text("position"), // head_coach, assistant_coach, academy_director, technical_director
  licenseLevel: text("license_level"), // FA Level 1-5, UEFA A/B/C, etc.
  specialization: text("specialization"), // youth_development, goalkeeping, fitness, tactics
  ageGroup: text("age_group"), // U8, U10, U12, U14, U16, U18, U21, Senior, All Ages
  coachingBadges: json("coaching_badges").$type<string[]>().default([]), // Array of coaching qualifications
  yearsExperience: integer("years_experience"),
  bio: text("bio"), // Coach biography/description
  achievements: json("achievements").$type<string[]>().default([]), // Array of achievements
  profilePicture: text("profile_picture"),
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  invitationToken: text("invitation_token"),
  invitationExpires: timestamp("invitation_expires"),
  isInvited: boolean("is_invited").default(false),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status"),
  subscriptionTier: text("subscription_tier").default("starter"),
  credits: integer("credits").default(10),
  totalCreditsUsed: integer("total_credits_used").default(0),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Club/Academy Management Tables
export const clubs = pgTable("clubs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // academy, professional_club, youth_club, school
  address: text("address"),
  city: text("city"),
  country: text("country"),
  establishedYear: integer("established_year"),
  licenseLevel: text("license_level"), // FA Level 1-5, UEFA A/B/C, etc.
  maxCoaches: integer("max_coaches").default(10),
  subscriptionTier: text("subscription_tier").default("basic"), // basic, premium, enterprise
  contactEmail: text("contact_email"),
  phoneNumber: text("phone_number"),
  website: text("website"),
  logo: text("logo"),
  primaryColor: text("primary_color").default("#8A4FFF"), // Default purple
  secondaryColor: text("secondary_color").default("#7C3AED"), // Default purple accent
  accentColor: text("accent_color").default("#B794F6"), // Default light purple
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const clubsRelations = relations(clubs, ({ many }) => ({
  coaches: many(users),
  teams: many(teams),
  players: many(players),
  seasons: many(seasons),
}));

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").notNull().references(() => clubs.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  ageGroup: text("age_group").notNull(), // U8, U10, U12, U14, U16, U18, U21, Senior
  gender: text("gender").notNull(), // male, female, mixed
  level: text("level"), // recreational, competitive, elite
  season: text("season"), // 2023-24, 2024-25
  maxPlayers: integer("max_players").default(25),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const teamsRelations = relations(teams, ({ one, many }) => ({
  club: one(clubs, {
    fields: [teams.clubId],
    references: [clubs.id],
  }),
  players: many(players),
  coachAssignments: many(coachTeamAssignments),
  trainingSessions: many(trainingSessions),
}));

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").notNull().references(() => clubs.id, { onDelete: "cascade" }),
  teamId: integer("team_id").references(() => teams.id, { onDelete: "set null" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  position: text("position"), // goalkeeper, defender, midfielder, forward
  skillLevel: integer("skill_level"), // 1-10 rating
  parentEmail: text("parent_email"),
  parentPhone: text("parent_phone"),
  medicalNotes: text("medical_notes"),
  emergencyContact: text("emergency_contact"),
  isActive: boolean("is_active").default(true),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const playersRelations = relations(players, ({ one, many }) => ({
  club: one(clubs, {
    fields: [players.clubId],
    references: [clubs.id],
  }),
  team: one(teams, {
    fields: [players.teamId],
    references: [teams.id],
  }),
  assessments: many(playerAssessments),
  attendances: many(sessionAttendances),
}));

export const coachTeamAssignments = pgTable("coach_team_assignments", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // head_coach, assistant_coach, goalkeeper_coach, fitness_coach
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
});

export const coachTeamAssignmentsRelations = relations(coachTeamAssignments, ({ one }) => ({
  coach: one(users, {
    fields: [coachTeamAssignments.coachId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [coachTeamAssignments.teamId],
    references: [teams.id],
  }),
}));

export const trainingSessions = pgTable("training_sessions", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  coachId: integer("coach_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  videoId: integer("video_id").references(() => videos.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
  duration: integer("duration"), // minutes
  focus: text("focus"), // technical, tactical, physical, psychological
  objectives: text("objectives"),
  location: text("location"),
  weather: text("weather"),
  attendance: integer("attendance"),
  sessionRating: integer("session_rating"), // 1-10
  coachNotes: text("coach_notes"),
  playerFeedback: text("player_feedback"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const trainingSessionsRelations = relations(trainingSessions, ({ one, many }) => ({
  team: one(teams, {
    fields: [trainingSessions.teamId],
    references: [teams.id],
  }),
  coach: one(users, {
    fields: [trainingSessions.coachId],
    references: [users.id],
  }),
  video: one(videos, {
    fields: [trainingSessions.videoId],
    references: [videos.id],
  }),
  attendances: many(sessionAttendances),
}));

export const sessionAttendances = pgTable("session_attendances", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => trainingSessions.id, { onDelete: "cascade" }),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  status: text("status").notNull(), // present, absent, late, injured
  arrivalTime: timestamp("arrival_time"),
  departureTime: timestamp("departure_time"),
  notes: text("notes"),
});

export const sessionAttendancesRelations = relations(sessionAttendances, ({ one }) => ({
  session: one(trainingSessions, {
    fields: [sessionAttendances.sessionId],
    references: [trainingSessions.id],
  }),
  player: one(players, {
    fields: [sessionAttendances.playerId],
    references: [players.id],
  }),
}));

export const playerAssessments = pgTable("player_assessments", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  coachId: integer("coach_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionId: integer("session_id").references(() => trainingSessions.id, { onDelete: "set null" }),
  assessmentDate: timestamp("assessment_date").defaultNow(),
  category: text("category").notNull(), // technical, tactical, physical, psychological
  skillArea: text("skill_area"), // passing, shooting, defending, etc.
  currentLevel: integer("current_level"), // 1-10
  targetLevel: integer("target_level"), // 1-10
  notes: text("notes"),
  improvementPlan: text("improvement_plan"),
  nextReviewDate: timestamp("next_review_date"),
});

export const playerAssessmentsRelations = relations(playerAssessments, ({ one }) => ({
  player: one(players, {
    fields: [playerAssessments.playerId],
    references: [players.id],
  }),
  coach: one(users, {
    fields: [playerAssessments.coachId],
    references: [users.id],
  }),
  session: one(trainingSessions, {
    fields: [playerAssessments.sessionId],
    references: [trainingSessions.id],
  }),
}));

export const seasons = pgTable("seasons", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").notNull().references(() => clubs.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // "2023-24 Season"
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(false),
  goals: text("goals"),
  budget: integer("budget"),
  achievements: json("achievements"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const seasonsRelations = relations(seasons, ({ one }) => ({
  club: one(clubs, {
    fields: [seasons.clubId],
    references: [clubs.id],
  }),
}));

// Coach Diary System
export const coachDiaryEntries = pgTable("coach_diary_entries", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  videoId: integer("video_id").references(() => videos.id, { onDelete: "cascade" }),
  entryType: text("entry_type").notNull(), // "session_review", "reflection", "goal_setting", "note"
  title: text("title").notNull(),
  content: text("content"),
  scheduledDate: timestamp("scheduled_date"),
  completedDate: timestamp("completed_date"),
  priority: text("priority").default("medium"), // "low", "medium", "high"
  status: text("status").default("pending"), // "pending", "completed", "cancelled"
  tags: json("tags").$type<string[]>().default([]),
  reminders: json("reminders").$type<{ date: string; sent: boolean }[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const coachDiaryEntriesRelations = relations(coachDiaryEntries, ({ one }) => ({
  coach: one(users, {
    fields: [coachDiaryEntries.coachId],
    references: [users.id],
  }),
  video: one(videos, {
    fields: [coachDiaryEntries.videoId],
    references: [videos.id],
  }),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  videos: many(videos),
  feedbacks: many(feedbacks),
  payments: many(payments),
  progress: many(progress),
  creditTransactions: many(creditTransactions),
  authoredCustomReports: many(customFeedbackReports, { relationName: "authoredReports" }),
  receivedCustomReports: many(customFeedbackReports, { relationName: "receivedReports" }),
  notifications: many(notifications),
  club: one(clubs, {
    fields: [users.clubId],
    references: [clubs.id],
  }),
  coachAssignments: many(coachTeamAssignments),
  trainingSessions: many(trainingSessions),
  playerAssessments: many(playerAssessments),
  diaryEntries: many(coachDiaryEntries),
}));

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  filename: text("filename").notNull(),
  filesize: bigint("filesize", { mode: "number" }).notNull(),
  duration: doublePrecision("duration"),
  status: text("status").notNull().default("uploaded"), // uploaded, processing, completed, failed, file_missing
  processingProgress: integer("processing_progress").default(0),
  s3Key: text("s3_key"),         // S3 object key for videos stored in S3
  s3Url: text("s3_url"),         // S3 URL for videos stored in S3
  // Self-reflection fields
  coachName: text("coach_name"),
  ageGroup: text("age_group"),
  intendedOutcomes: text("intended_outcomes"),
  sessionStrengths: text("session_strengths"),
  areasForDevelopment: text("areas_for_development"),
  reflectionNotes: text("reflection_notes"),
  sessionDate: timestamp("session_date"),
  generateCalendarEvent: boolean("generate_calendar_event").default(false),
  analysisType: text("analysis_type").default("training_session"), // "training_session" or "team_talk"
  createdAt: timestamp("created_at").defaultNow(),
});

export const videosRelations = relations(videos, ({ one, many }) => ({
  user: one(users, {
    fields: [videos.userId],
    references: [users.id],
  }),
  feedbacks: many(feedbacks),
}));

export const feedbacks = pgTable("feedbacks", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull().references(() => videos.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  overallScore: integer("overall_score"),
  communicationScore: integer("communication_score"),
  engagementScore: integer("engagement_score"),
  instructionScore: integer("instruction_score"),
  feedback: text("feedback").notNull(),
  summary: text("summary"),
  strengths: json("strengths"),
  improvements: json("improvements"),
  transcription: text("transcription"),
  
  // Comprehensive new analysis structure
  keyInfo: json("key_info"), // Words count, WPM, talking ratio, player mentions
  questioning: json("questioning"), // Questions analysis, types, research insights
  language: json("language"), // Clarity, specificity, age-appropriate analysis
  coachBehaviours: json("coach_behaviours"), // Interpersonal, professional, technical skills
  playerEngagement: json("player_engagement"), // Player interactions, coaching styles, tone analysis
  intendedOutcomes: json("intended_outcomes"), // Outcomes assessment and effectiveness
  neuroscience: json("neuroscience"), // Neuroscience research comparison and literature analysis
  coachingFramework: json("coaching_framework"), // Why, What, How, Who analysis
  visualAnalysis: json("visual_analysis"), // Video frame analysis results
  multiAiAnalysis: json("multi_ai_analysis"), // Comprehensive multi-AI analysis from Claude, Perplexity, and computer vision
  
  // Legacy fields for compatibility
  transcript: text("transcript"), // Audio transcript
  duration: doublePrecision("duration"), // Session duration in minutes
  updatedAt: timestamp("updated_at").defaultNow(),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const feedbacksRelations = relations(feedbacks, ({ one, many }) => ({
  user: one(users, {
    fields: [feedbacks.userId],
    references: [users.id],
  }),
  video: one(videos, {
    fields: [feedbacks.videoId],
    references: [videos.id],
  }),
  comments: many(feedbackComments),
}));

export const feedbackComments = pgTable("feedback_comments", {
  id: serial("id").primaryKey(),
  feedbackId: integer("feedback_id").notNull().references(() => feedbacks.id, { onDelete: "cascade" }),
  authorId: integer("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  parentCommentId: integer("parent_comment_id"),
  content: text("content").notNull(),
  isHeadCoachComment: boolean("is_head_coach_comment").default(false),
  mentionedUsers: json("mentioned_users").$type<number[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // mention, comment_reply, custom_report, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedEntityType: text("related_entity_type"), // feedback_comment, custom_report, etc.
  relatedEntityId: integer("related_entity_id"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const feedbackCommentsRelations = relations(feedbackComments, ({ one, many }) => ({
  feedback: one(feedbacks, {
    fields: [feedbackComments.feedbackId],
    references: [feedbacks.id],
  }),
  author: one(users, {
    fields: [feedbackComments.authorId],
    references: [users.id],
  }),
  parentComment: one(feedbackComments, {
    fields: [feedbackComments.parentCommentId],
    references: [feedbackComments.id],
  }),
  replies: many(feedbackComments),
}));



export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Club Communication Schema
export const clubMessages = pgTable("club_messages", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").notNull().references(() => clubs.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  messageType: text("message_type").default("text"), // 'text', 'file'
  attachmentUrl: text("attachment_url"),
  attachmentName: text("attachment_name"),
  attachmentSize: integer("attachment_size"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messageReadStatus = pgTable("message_read_status", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  messageId: integer("message_id").notNull(),
  messageType: text("message_type").notNull().default("club"), // "club" or "direct"
  readAt: timestamp("read_at").defaultNow().notNull(),
});

export const clubMessagesRelations = relations(clubMessages, ({ one }) => ({
  club: one(clubs, {
    fields: [clubMessages.clubId],
    references: [clubs.id],
  }),
  sender: one(users, {
    fields: [clubMessages.senderId],
    references: [users.id],
  }),
}));



// Custom feedback reports for heads of coaching and admins
export const customFeedbackReports = pgTable("custom_feedback_reports", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  coachId: integer("coach_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  reportType: text("report_type").notNull(), // individual_feedback, performance_review, development_plan, observation_report
  priority: text("priority").default("medium"), // low, medium, high, urgent
  status: text("status").default("draft"), // draft, published, reviewed, archived
  
  // Report content
  keyObservations: json("key_observations").$type<string[]>().default([]),
  strengths: json("strengths").$type<string[]>().default([]),
  areasForImprovement: json("areas_for_improvement").$type<string[]>().default([]),
  recommendations: json("recommendations").$type<string[]>().default([]),
  actionItems: json("action_items").$type<{
    item: string;
    deadline: string;
    priority: string;
    status: string;
  }[]>().default([]),
  
  // Performance metrics
  overallRating: integer("overall_rating"), // 1-10 scale
  communicationRating: integer("communication_rating"), // 1-10 scale
  technicalRating: integer("technical_rating"), // 1-10 scale
  leadershipRating: integer("leadership_rating"), // 1-10 scale
  developmentRating: integer("development_rating"), // 1-10 scale
  
  // Contextual information
  observationPeriod: text("observation_period"), // "January 2024", "Q4 2023", etc.
  sessionTypes: json("session_types").$type<string[]>().default([]), // training, match, meeting
  playerAgeGroups: json("player_age_groups").$type<string[]>().default([]),
  
  // Follow-up and review
  nextReviewDate: timestamp("next_review_date"),
  followUpRequired: boolean("follow_up_required").default(false),
  privateNotes: text("private_notes"), // Only visible to author and admins
  coachResponse: text("coach_response"), // Coach's response to the feedback
  coachResponseDate: timestamp("coach_response_date"),
  
  isConfidential: boolean("is_confidential").default(false),
  tags: json("tags").$type<string[]>().default([]),
  attachments: json("attachments").$type<string[]>().default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customFeedbackReportsRelations = relations(customFeedbackReports, ({ one }) => ({
  author: one(users, {
    fields: [customFeedbackReports.authorId],
    references: [users.id],
    relationName: "authoredReports"
  }),
  coach: one(users, {
    fields: [customFeedbackReports.coachId],
    references: [users.id],
    relationName: "receivedReports"
  }),
}));

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("usd"),
  status: text("status").notNull(),
  stripePaymentId: text("stripe_payment_id"),
  stripeSessionId: text("stripe_session_id"),
  paymentType: text("payment_type").notNull(), // one-time, subscription
  createdAt: timestamp("created_at").defaultNow(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));

export const progress = pgTable("progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  communicationScoreAvg: doublePrecision("communication_score_avg"),
  engagementScoreAvg: doublePrecision("engagement_score_avg"),
  instructionScoreAvg: doublePrecision("instruction_score_avg"),
  overallScoreAvg: doublePrecision("overall_score_avg"),
  sessionsCount: integer("sessions_count").default(0),
  weeklyImprovement: doublePrecision("weekly_improvement"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const progressRelations = relations(progress, ({ one }) => ({
  user: one(users, {
    fields: [progress.userId],
    references: [users.id],
  }),
}));

// Credit transactions
export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  type: text("type").notNull(), // added, used, expired
  description: text("description"),
  videoId: integer("video_id").references(() => videos.id, { onDelete: "set null" }),
  paymentId: integer("payment_id").references(() => payments.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, {
    fields: [creditTransactions.userId],
    references: [users.id],
  }),
  video: one(videos, {
    fields: [creditTransactions.videoId],
    references: [videos.id],
  }),
  payment: one(payments, {
    fields: [creditTransactions.paymentId],
    references: [payments.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  subscriptionStatus: true,
  subscriptionTier: true
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  createdAt: true,
  status: true,
  processingProgress: true,
  duration: true,
  s3Key: true,
  s3Url: true
});

export const insertFeedbackSchema = createInsertSchema(feedbacks).omit({
  id: true,
  createdAt: true
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true
});

export const insertProgressSchema = createInsertSchema(progress).omit({
  id: true,
  updatedAt: true
});

export const insertCreditTransactionSchema = createInsertSchema(creditTransactions).omit({
  id: true
});

export const insertCustomFeedbackReportSchema = createInsertSchema(customFeedbackReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videos.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedbacks.$inferSelect;

export const insertFeedbackCommentSchema = createInsertSchema(feedbackComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertFeedbackComment = z.infer<typeof insertFeedbackCommentSchema>;
export type FeedbackComment = typeof feedbackComments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertProgress = z.infer<typeof insertProgressSchema>;
export type Progress = typeof progress.$inferSelect;
export type InsertCreditTransaction = z.infer<typeof insertCreditTransactionSchema>;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCustomFeedbackReport = z.infer<typeof insertCustomFeedbackReportSchema>;
export type CustomFeedbackReport = typeof customFeedbackReports.$inferSelect;

export type ClubMessage = typeof clubMessages.$inferSelect;
export type InsertClubMessage = typeof clubMessages.$inferInsert;

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  participant1Id: integer("participant1_id").notNull().references(() => users.id),
  participant2Id: integer("participant2_id").notNull().references(() => users.id),
  clubId: integer("club_id").notNull().references(() => clubs.id), // Ensure conversations are within same club
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const directMessages = pgTable("direct_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  messageType: text("message_type").notNull().default("text"), // "text" or "file"
  attachmentUrl: text("attachment_url"),
  attachmentName: text("attachment_name"),
  attachmentSize: integer("attachment_size"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  participant1: one(users, {
    fields: [conversations.participant1Id],
    references: [users.id],
    relationName: "conversation_participant1",
  }),
  participant2: one(users, {
    fields: [conversations.participant2Id],
    references: [users.id],
    relationName: "conversation_participant2",
  }),
  club: one(clubs, {
    fields: [conversations.clubId],
    references: [clubs.id],
  }),
  messages: many(directMessages),
}));

export const directMessagesRelations = relations(directMessages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [directMessages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [directMessages.senderId],
    references: [users.id],
  }),
}));

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;
export type DirectMessage = typeof directMessages.$inferSelect;
export type InsertDirectMessage = typeof directMessages.$inferInsert;



// Club Management Schema Exports
export const insertClubSchema = createInsertSchema(clubs).omit({
  id: true,
  createdAt: true
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  joinedAt: true
});



export const insertTrainingSessionSchema = createInsertSchema(trainingSessions).omit({
  id: true,
  createdAt: true
});

export const insertPlayerAssessmentSchema = createInsertSchema(playerAssessments).omit({
  id: true,
  assessmentDate: true
});

export const insertSeasonSchema = createInsertSchema(seasons).omit({
  id: true,
  createdAt: true
});

// Club Management Types
export type InsertClub = z.infer<typeof insertClubSchema>;
export type Club = typeof clubs.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;
export type InsertTrainingSession = z.infer<typeof insertTrainingSessionSchema>;
export type TrainingSession = typeof trainingSessions.$inferSelect;
export type InsertPlayerAssessment = z.infer<typeof insertPlayerAssessmentSchema>;
export type PlayerAssessment = typeof playerAssessments.$inferSelect;
export type InsertSeason = z.infer<typeof insertSeasonSchema>;
export type Season = typeof seasons.$inferSelect;

// Content management
export const contentPages = pgTable("content_pages", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  isPublished: boolean("is_published").notNull().default(false),
  lastModified: timestamp("last_modified").notNull().defaultNow(),
});

export const insertContentPageSchema = createInsertSchema(contentPages).omit({
  id: true,
});

export type InsertContentPage = z.infer<typeof insertContentPageSchema>;
export type ContentPage = typeof contentPages.$inferSelect;

// Site settings
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSiteSettingSchema = createInsertSchema(siteSettings).omit({
  id: true,
});

export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;
export type SiteSetting = typeof siteSettings.$inferSelect;

export const LoginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginData = z.infer<typeof LoginSchema>;

export const RegisterSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Please enter a valid email"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).omit({ role: true }).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type RegisterData = z.infer<typeof RegisterSchema>;

// Individual Development Plans for Coaches
export const developmentPlans = pgTable("development_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  targetDate: timestamp("target_date"),
  status: text("status").notNull().default("active"), // active, completed, paused
  
  // Areas of Strength (3 areas with How, Where, Why)
  strengthArea1: text("strength_area_1"),
  strengthHow1: text("strength_how_1"),
  strengthWhere1: text("strength_where_1"),
  strengthWhy1: text("strength_why_1"),
  
  strengthArea2: text("strength_area_2"),
  strengthHow2: text("strength_how_2"),
  strengthWhere2: text("strength_where_2"),
  strengthWhy2: text("strength_why_2"),
  
  strengthArea3: text("strength_area_3"),
  strengthHow3: text("strength_how_3"),
  strengthWhere3: text("strength_where_3"),
  strengthWhy3: text("strength_why_3"),
  
  // Areas of Development (3 areas with How, Where, Why)
  developmentArea1: text("development_area_1"),
  developmentHow1: text("development_how_1"),
  developmentWhere1: text("development_where_1"),
  developmentWhy1: text("development_why_1"),
  
  developmentArea2: text("development_area_2"),
  developmentHow2: text("development_how_2"),
  developmentWhere2: text("development_where_2"),
  developmentWhy2: text("development_why_2"),
  
  developmentArea3: text("development_area_3"),
  developmentHow3: text("development_how_3"),
  developmentWhere3: text("development_where_3"),
  developmentWhy3: text("development_why_3"),
  
  // 12-week focus area
  focusArea: text("focus_area"),
  focusHow: text("focus_how"),
  focusWhere: text("focus_where"),
  focusWhy: text("focus_why"),
  
  // Personal Development Section
  currentQualification: text("current_qualification"),
  desiredQualification: text("desired_qualification"),
  currentRole: text("current_role"),
  desiredRole: text("desired_role"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const developmentGoals = pgTable("development_goals", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull().references(() => developmentPlans.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // communication, technical, leadership, player_management
  targetDate: timestamp("target_date"),
  status: text("status").notNull().default("not_started"), // not_started, in_progress, completed
  progress: integer("progress").default(0), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const developmentActions = pgTable("development_actions", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").notNull().references(() => developmentGoals.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Error logging system
export const errorLogs = pgTable("error_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  errorType: text("error_type").notNull(), // upload_error, auth_error, api_error, system_error
  severity: text("severity").notNull(), // low, medium, high, critical
  message: text("message").notNull(),
  stackTrace: text("stack_trace"),
  requestPath: text("request_path"),
  requestMethod: text("request_method"),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  sessionId: text("session_id"),
  additionalData: text("additional_data"), // JSON string for extra context
  resolved: boolean("resolved").default(false).notNull(),
  resolvedBy: integer("resolved_by").references(() => users.id, { onDelete: "set null" }),
  resolvedAt: timestamp("resolved_at"),
  resolutionNotes: text("resolution_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Development Plans Types
export const insertDevelopmentPlanSchema = createInsertSchema(developmentPlans).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDevelopmentGoalSchema = createInsertSchema(developmentGoals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDevelopmentActionSchema = createInsertSchema(developmentActions).omit({ id: true, createdAt: true, updatedAt: true });

// Coach Diary Types
export const insertCoachDiaryEntrySchema = createInsertSchema(coachDiaryEntries).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCoachDiaryEntry = z.infer<typeof insertCoachDiaryEntrySchema>;
export type CoachDiaryEntry = typeof coachDiaryEntries.$inferSelect;

export const insertErrorLogSchema = createInsertSchema(errorLogs).omit({
  id: true,
  createdAt: true,
});

export type SelectDevelopmentPlan = typeof developmentPlans.$inferSelect;
export type InsertDevelopmentPlan = z.infer<typeof insertDevelopmentPlanSchema>;
export type SelectDevelopmentGoal = typeof developmentGoals.$inferSelect;
export type InsertDevelopmentGoal = z.infer<typeof insertDevelopmentGoalSchema>;
export type SelectDevelopmentAction = typeof developmentActions.$inferSelect;
export type InsertDevelopmentAction = z.infer<typeof insertDevelopmentActionSchema>;

export type SelectErrorLog = typeof errorLogs.$inferSelect;
export type InsertErrorLog = typeof errorLogs.$inferInsert;
