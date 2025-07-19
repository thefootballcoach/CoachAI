import { 
  users, videos, feedbacks, feedbackComments, progress, payments, contentPages, siteSettings, creditTransactions, clubs, teams, players, trainingSessions, customFeedbackReports, notifications, clubMessages, conversations, directMessages, messageReadStatus,
  developmentPlans, developmentGoals, developmentActions, errorLogs,
  type User, type InsertUser, type Video, type InsertVideo, 
  type Feedback, type InsertFeedback, type FeedbackComment, type InsertFeedbackComment,
  type Progress, type InsertProgress, 
  type Payment, type InsertPayment, type ContentPage, type InsertContentPage, 
  type SiteSetting, type InsertSiteSetting, type CreditTransaction, type InsertCreditTransaction,
  type CustomFeedbackReport, type InsertCustomFeedbackReport, type Club,
  type ClubMessage, type InsertClubMessage, type Conversation, type InsertConversation,
  type DirectMessage, type InsertDirectMessage,
  type SelectDevelopmentPlan, type InsertDevelopmentPlan,
  type SelectDevelopmentGoal, type InsertDevelopmentGoal,
  type SelectDevelopmentAction, type InsertDevelopmentAction,
  type SelectErrorLog, type InsertErrorLog
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import bcryptjs from "bcryptjs";
import { db, pool } from "./db";
import { eq, desc, and, asc, count, avg, sql, isNotNull, inArray, or, ne, isNull, gte, lte, lt, gt } from "drizzle-orm";


const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  updateUserPassword(id: number, hashedPassword: string): Promise<User>;
  updateUserStripeInfo(id: number, data: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User>;
  updateStripeCustomerId(id: number, stripeCustomerId: string): Promise<User>;
  updateSubscriptionStatus(id: number, status: string, tier: string): Promise<User>;
  addUserCredits(id: number, amount: number, reason: string, paymentId?: number): Promise<User>;
  useUserCredits(id: number, amount: number, reason: string, videoId?: number): Promise<User>;
  
  // Email verification and password reset
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  getUserByPasswordResetToken(token: string): Promise<User | undefined>;
  verifyUserEmail(id: number): Promise<User>;
  updateEmailVerificationToken(id: number, token: string): Promise<User>;
  setPasswordResetToken(id: number, token: string, expiresAt: Date): Promise<User>;
  resetUserPassword(id: number, hashedPassword: string): Promise<User>;
  
  // Videos
  getVideo(id: number): Promise<Video | undefined>;
  getVideosByUserId(userId: number): Promise<Video[]>;
  getAllVideos(): Promise<Video[]>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: number, data: Partial<Video>): Promise<Video>;
  updateVideoStatus(id: number, status: string, processingProgress?: number): Promise<Video>;
  updateVideoProgress(id: number, progress: number, status?: string): Promise<Video>;
  updateVideoS3Info(id: number, data: { s3Key: string, s3Url: string }): Promise<Video>;
  deleteVideo(id: number): Promise<void>;
  
  // Feedbacks
  getFeedback(id: number): Promise<Feedback | undefined>;
  getFeedbacksByUserId(userId: number): Promise<Feedback[]>;
  getFeedbackByVideoId(videoId: number): Promise<Feedback | undefined>;
  getAllFeedbacks(): Promise<Feedback[]>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  updateFeedback(id: number, data: Partial<Feedback>): Promise<Feedback>;
  updateFeedbackByVideoId(videoId: number, data: Partial<Feedback>): Promise<Feedback>;
  deleteFeedback(id: number): Promise<void>;
  
  // Feedback Comments
  getFeedbackComments(feedbackId: number): Promise<FeedbackComment[]>;
  createFeedbackComment(comment: InsertFeedbackComment): Promise<FeedbackComment>;
  updateFeedbackComment(id: number, data: Partial<FeedbackComment>): Promise<FeedbackComment>;
  deleteFeedbackComment(id: number): Promise<void>;
  
  // Progress
  getProgress(id: number): Promise<Progress | undefined>;
  getProgressByUserId(userId: number): Promise<Progress | undefined>;
  createProgress(progressData: InsertProgress): Promise<Progress>;
  updateProgress(id: number, data: Partial<Progress>): Promise<Progress>;
  
  // Credits
  getCreditTransactions(id: number): Promise<CreditTransaction | undefined>;
  getCreditTransactionsByUserId(userId: number): Promise<CreditTransaction[]>;
  getAllCreditTransactions(): Promise<CreditTransaction[]>;
  createCreditTransaction(transaction: InsertCreditTransaction): Promise<CreditTransaction>;
  
  // Payments
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentsByUserId(userId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  
  // Content Management
  getContentPage(id: number): Promise<ContentPage | undefined>;
  getContentPageBySlug(slug: string): Promise<ContentPage | undefined>;
  getAllContentPages(): Promise<ContentPage[]>;
  createContentPage(page: InsertContentPage): Promise<ContentPage>;
  updateContentPage(id: number, data: Partial<ContentPage>): Promise<ContentPage>;
  deleteContentPage(id: number): Promise<void>;
  
  // Settings
  getSetting(key: string): Promise<string | null>;
  getAllSettings(): Promise<SiteSetting[]>;
  updateSetting(key: string, value: string): Promise<SiteSetting>;
  
  // Club Management
  getClub(id: number): Promise<Club | undefined>;
  getClubCoachCount(clubId: number): Promise<number>;
  getClubTeamCount(clubId: number): Promise<number>;
  getClubPlayerCount(clubId: number): Promise<number>;
  getClubSessionCount(clubId: number): Promise<number>;
  getClubAvgCoachingScore(clubId: number): Promise<number>;
  getClubCoachesPerformance(clubId: number): Promise<any[]>;
  getClubPerformanceAverages(clubId: number): Promise<any>;
  getClubTeamsOverview(clubId: number): Promise<any[]>;
  getClubInfo(clubId: number): Promise<any>;
  updateClubInfo(clubId: number, data: Partial<any>): Promise<any>;
  getRecentClubActivity(): Promise<any[]>;
  updateClubLogo(clubId: number, logoUrl: string): Promise<void>;
  updateUserProfilePicture(userId: number, profilePictureUrl: string): Promise<void>;
  
  // Custom Feedback Reports (for Heads of Coaching and Admins)
  getCustomFeedbackReport(id: number): Promise<CustomFeedbackReport | undefined>;
  getCustomFeedbackReportsByAuthor(authorId: number): Promise<CustomFeedbackReport[]>;
  getCustomFeedbackReportsByCoach(coachId: number): Promise<CustomFeedbackReport[]>;
  getCustomFeedbackReportsByClub(clubId: number): Promise<CustomFeedbackReport[]>;
  createCustomFeedbackReport(report: InsertCustomFeedbackReport): Promise<CustomFeedbackReport>;
  updateCustomFeedbackReport(id: number, data: Partial<CustomFeedbackReport>): Promise<CustomFeedbackReport>;
  deleteCustomFeedbackReport(id: number): Promise<void>;
  getCoachesForCustomReports(authorId: number): Promise<User[]>;
  
  // User Invitation System
  createUserInvitation(userData: {
    name: string;
    email: string;
    role: string;
    position?: string | null;
    ageGroup?: string | null;
    licenseLevel?: string | null;
    clubId?: number | null;
    invitationToken: string;
    invitationExpires: Date;
  }): Promise<User>;
  getUserByInvitationToken(token: string): Promise<User | undefined>;
  completeUserInvitation(token: string, password: string): Promise<User>;
  getPendingInvitations(clubId?: number | null): Promise<User[]>;
  
  // Notifications
  createNotification(notification: {
    userId: number;
    type: string;
    title: string;
    message: string;
    relatedEntityType?: string;
    relatedEntityId?: number;
  }): Promise<any>;
  getUserNotifications(userId: number): Promise<any[]>;
  markNotificationAsRead(notificationId: number, userId: number): Promise<void>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  
  // User Management Helpers
  getUsersByClubId(clubId: number): Promise<User[]>;
  deleteUser(id: number): Promise<void>;

  // Club Communication Methods
  getClubMessages(clubId: number): Promise<any[]>;
  createClubMessage(message: InsertClubMessage): Promise<ClubMessage>;
  getClubMembers(clubId: number): Promise<User[]>;
  getUnreadClubMessagesCount(userId: number, clubId: number): Promise<number>;
  markClubMessageAsRead(userId: number, messageId: number): Promise<void>;

  // Conversation Methods
  createConversation(data: {
    title?: string;
    type: string;
    clubId?: number;
    createdBy: number;
    participantIds: number[];
  }): Promise<any>;
  getConversationsByUser(userId: number): Promise<any[]>;
  getConversationById(conversationId: number, userId: number): Promise<Conversation | null>;
  createDirectMessage(data: InsertDirectMessage): Promise<DirectMessage>;
  getDirectMessages(conversationId: number, userId: number): Promise<any[]>;
  markMessagesAsRead(conversationId: number, userId: number): Promise<void>;
  getUnreadDirectMessagesCount(userId: number): Promise<number>;
  getUserConversations(userId: number): Promise<any[]>;
  getConversationMessages(conversationId: number, userId: number): Promise<any[]>;
  createMessage(data: any & { mentionedUsers?: number[] }): Promise<any>;
  getOrCreateDirectConversation(userId1: number, userId2: number, clubId?: number): Promise<any>;

  // Development Plans
  getDevelopmentPlansByUserId(userId: number): Promise<SelectDevelopmentPlan[]>;
  createDevelopmentPlan(data: InsertDevelopmentPlan): Promise<SelectDevelopmentPlan>;
  updateDevelopmentPlan(id: number, data: Partial<SelectDevelopmentPlan>): Promise<SelectDevelopmentPlan>;
  deleteDevelopmentPlan(id: number): Promise<void>;
  getDevelopmentPlanWithDetails(planId: number): Promise<SelectDevelopmentPlan | null>;
  
  // Development Goals
  getDevelopmentGoalsByPlanId(planId: number): Promise<SelectDevelopmentGoal[]>;
  createDevelopmentGoal(data: InsertDevelopmentGoal): Promise<SelectDevelopmentGoal>;
  updateDevelopmentGoal(id: number, data: Partial<SelectDevelopmentGoal>): Promise<SelectDevelopmentGoal>;
  deleteDevelopmentGoal(id: number): Promise<void>;
  
  // Development Actions
  getDevelopmentActionsByGoalId(goalId: number): Promise<SelectDevelopmentAction[]>;
  createDevelopmentAction(data: InsertDevelopmentAction): Promise<SelectDevelopmentAction>;
  updateDevelopmentAction(id: number, data: Partial<SelectDevelopmentAction>): Promise<SelectDevelopmentAction>;
  deleteDevelopmentAction(id: number): Promise<void>;

  // Error Logs
  createErrorLog(errorLog: InsertErrorLog): Promise<SelectErrorLog>;
  getErrorLogs(limit?: number, offset?: number): Promise<SelectErrorLog[]>;
  getErrorLogsByUserId(userId: number): Promise<SelectErrorLog[]>;
  getUnresolvedErrorLogs(): Promise<SelectErrorLog[]>;
  resolveErrorLog(id: number, resolvedBy: number, resolutionNotes?: string): Promise<SelectErrorLog>;
  getErrorLogStats(): Promise<{
    total: number;
    unresolved: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  }>;
  
  // Super Admin Methods
  getTotalUserCount(): Promise<number>;
  getTotalClubCount(): Promise<number>;
  getTotalVideoCount(): Promise<number>;
  getTotalFeedbackCount(): Promise<number>;
  getTotalTransactionCount(): Promise<number>;
  getRecentSystemActivity(): Promise<any[]>;
  getAllUsersForSuperAdmin(): Promise<any[]>;
  getAllClubsForSuperAdmin(): Promise<any[]>;
  updateUserStatus(userId: number, isActive: boolean): Promise<void>;
  updateUserCredits(userId: number, credits: number, operation: 'add' | 'set'): Promise<void>;
  deleteUser(userId: number): Promise<void>;
  assignUserToClub(userId: number, clubId: number | null): Promise<void>;
  updateUserRole(userId: number, role: string): Promise<void>;
  updateClubStatus(clubId: number, isActive: boolean): Promise<void>;
  deleteClub(clubId: number): Promise<void>;
  getAllSystemSettings(): Promise<any[]>;
  updateSystemSetting(key: string, value: string): Promise<void>;
  
  // Session
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private videos: Map<number, Video>;
  private feedbacks: Map<number, Feedback>;
  private progresses: Map<number, Progress>;
  private payments: Map<number, Payment>;
  private contentPages: Map<number, ContentPage>;
  private settings: Map<string, string>;
  private creditTransactions: Map<number, CreditTransaction>;
  private userIdCounter: number;
  private videoIdCounter: number;
  private feedbackIdCounter: number;
  private progressIdCounter: number;
  private paymentIdCounter: number;
  private contentPageIdCounter: number;
  private creditTransactionIdCounter: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.videos = new Map();
    this.feedbacks = new Map();
    this.progresses = new Map();
    this.payments = new Map();
    this.contentPages = new Map();
    this.settings = new Map();
    this.creditTransactions = new Map();
    this.userIdCounter = 1;
    this.videoIdCounter = 1;
    this.feedbackIdCounter = 1;
    this.progressIdCounter = 1;
    this.paymentIdCounter = 1;
    this.contentPageIdCounter = 1;
    this.creditTransactionIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Initialize default content pages
    this.createContentPage({
      title: "Home",
      slug: "home",
      content: "Welcome to CoachAI - AI-powered coaching feedback platform",
      isPublished: true,
      lastModified: new Date()
    });
    
    this.createContentPage({
      title: "About",
      slug: "about",
      content: "CoachAI helps football coaches improve their training sessions through AI analysis",
      isPublished: true,
      lastModified: new Date()
    });
    
    // Initialize default settings
    this.updateSetting("siteName", "CoachAI");
    this.updateSetting("tagline", "AI-powered coaching feedback");
    this.updateSetting("description", "CoachAI helps football coaches improve their training sessions through AI analysis of their coaching sessions");
    this.updateSetting("contactEmail", "support@coachai.example.com");
    this.updateSetting("enableRegistration", "true");
    this.updateSetting("maintenanceMode", "false");
    this.updateSetting("maxUploadSize", "500");
    this.updateSetting("aiProvider", "OpenAI");
    this.updateSetting("defaultPricingTier", "Professional");
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => a.id - b.id);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = {
      ...userData,
      id,
      createdAt: now,
      name: userData.name ?? null,
      licenseLevel: userData.licenseLevel ?? null,
      role: userData.role ?? "coach",
      clubId: userData.clubId ?? null,
      credits: userData.credits ?? null,
      totalCreditsUsed: userData.totalCreditsUsed ?? null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: null,
      subscriptionTier: null,
      lastLoginAt: null,
      isActive: true,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    const updatedUser: User = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<User> {
    return this.updateUser(id, { password: hashedPassword });
  }

  async updateUserStripeInfo(
    id: number, 
    data: { stripeCustomerId: string, stripeSubscriptionId: string }
  ): Promise<User> {
    return this.updateUser(id, {
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
    });
  }

  async updateStripeCustomerId(id: number, stripeCustomerId: string): Promise<User> {
    return this.updateUser(id, { stripeCustomerId });
  }

  async updateSubscriptionStatus(id: number, status: string, tier: string): Promise<User> {
    return this.updateUser(id, {
      subscriptionStatus: status,
      subscriptionTier: tier,
    });
  }

  // Video methods
  async getVideo(id: number): Promise<Video | undefined> {
    return this.videos.get(id);
  }

  async getVideosByUserId(userId: number): Promise<Video[]> {
    const userVideos = Array.from(this.videos.values()).filter(
      (video) => video.userId === userId
    );
    return userVideos.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }
  
  async getAllVideos(): Promise<Video[]> {
    return Array.from(this.videos.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createVideo(videoData: InsertVideo): Promise<Video> {
    const id = this.videoIdCounter++;
    const now = new Date();
    const video: Video = {
      ...videoData,
      id,
      status: "uploaded",
      processingProgress: 0,
      duration: null,
      createdAt: now,
      s3Key: null,
      s3Url: null,
    };
    this.videos.set(id, video);
    return video;
  }

  async updateVideo(id: number, data: Partial<Video>): Promise<Video> {
    const video = await this.getVideo(id);
    if (!video) {
      throw new Error(`Video with ID ${id} not found`);
    }
    const updatedVideo: Video = { ...video, ...data };
    this.videos.set(id, updatedVideo);
    return updatedVideo;
  }

  async updateVideoStatus(id: number, status: string, processingProgress: number = 0): Promise<Video> {
    return this.updateVideo(id, { status, processingProgress });
  }
  
  async updateVideoProgress(id: number, progress: number, status?: string): Promise<Video> {
    const data: Partial<Video> = { processingProgress: progress };
    if (status) {
      data.status = status;
    }
    return this.updateVideo(id, data);
  }
  
  async updateVideoS3Info(id: number, data: { s3Key: string, s3Url: string }): Promise<Video> {
    return this.updateVideo(id, { s3Key: data.s3Key, s3Url: data.s3Url });
  }

  async deleteVideo(id: number): Promise<void> {
    // Delete associated feedback first
    const feedback = await this.getFeedbackByVideoId(id);
    if (feedback) {
      await this.deleteFeedback(feedback.id);
    }
    
    // Delete video
    this.videos.delete(id);
  }

  // Feedback methods
  async getFeedback(id: number): Promise<Feedback | undefined> {
    return this.feedbacks.get(id);
  }

  async getFeedbacksByUserId(userId: number): Promise<Feedback[]> {
    const userFeedbacks = Array.from(this.feedbacks.values()).filter(
      (feedback) => feedback.userId === userId
    );
    return userFeedbacks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getFeedbackByVideoId(videoId: number): Promise<Feedback | undefined> {
    return Array.from(this.feedbacks.values()).find(
      (feedback) => feedback.videoId === videoId
    );
  }
  
  async getAllFeedbacks(): Promise<Feedback[]> {
    return Array.from(this.feedbacks.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const id = this.feedbackIdCounter++;
    const now = new Date();
    
    // Ensure strengths and improvements are JSON objects
    const strengths = typeof feedbackData.strengths === 'string' 
      ? JSON.parse(feedbackData.strengths as string) 
      : feedbackData.strengths;
      
    const improvements = typeof feedbackData.improvements === 'string' 
      ? JSON.parse(feedbackData.improvements as string) 
      : feedbackData.improvements;
    
    const feedback: Feedback = {
      ...feedbackData,
      id,
      strengths,
      improvements,
      createdAt: now,
    };
    this.feedbacks.set(id, feedback);
    return feedback;
  }

  async updateFeedback(id: number, data: Partial<Feedback>): Promise<Feedback> {
    const feedback = await this.getFeedback(id);
    if (!feedback) {
      throw new Error(`Feedback with ID ${id} not found`);
    }
    
    const updatedFeedback: Feedback = {
      ...feedback,
      ...data,
    };
    
    this.feedbacks.set(id, updatedFeedback);
    return updatedFeedback;
  }

  async updateFeedbackByVideoId(videoId: number, data: Partial<Feedback>): Promise<Feedback> {
    console.log(`📝 Updating feedback for video ${videoId} with ultra-thorough analysis data...`);
    
    const existingFeedback = await this.getFeedbackByVideoId(videoId);
    if (!existingFeedback) {
      throw new Error(`Feedback for video ID ${videoId} not found`);
    }

    // Process any JSON string data for complex objects
    const processedData: any = {};
    Object.keys(data).forEach(key => {
      if (typeof data[key as keyof Feedback] === 'string' && key !== 'overallScore' && key !== 'communicationScore' && key !== 'engagementScore' && key !== 'instructionScore') {
        try {
          processedData[key] = JSON.parse(data[key as keyof Feedback] as string);
        } catch {
          processedData[key] = data[key as keyof Feedback];
        }
      } else {
        processedData[key] = data[key as keyof Feedback];
      }
    });

    console.log(`💾 Storing complete feedback sections: ${Object.keys(processedData).join(', ')}`);
    
    const updatedFeedback: Feedback = {
      ...existingFeedback,
      ...processedData,
    };
    
    this.feedbacks.set(existingFeedback.id, updatedFeedback);
    console.log(`✅ Ultra-thorough feedback successfully stored for video ${videoId}`);
    return updatedFeedback;
  }

  async deleteFeedback(id: number): Promise<void> {
    this.feedbacks.delete(id);
  }

  // Progress methods
  async getProgress(id: number): Promise<Progress | undefined> {
    return this.progresses.get(id);
  }

  async getProgressByUserId(userId: number): Promise<Progress | undefined> {
    return Array.from(this.progresses.values()).find(
      (progress) => progress.userId === userId
    );
  }

  async createProgress(progressData: InsertProgress): Promise<Progress> {
    const id = this.progressIdCounter++;
    const now = new Date();
    const progress: Progress = {
      ...progressData,
      id,
      updatedAt: now,
    };
    this.progresses.set(id, progress);
    return progress;
  }

  async updateProgress(id: number, data: Partial<Progress>): Promise<Progress> {
    const progress = await this.getProgress(id);
    if (!progress) {
      throw new Error(`Progress with ID ${id} not found`);
    }
    const updatedProgress: Progress = { 
      ...progress, 
      ...data, 
      updatedAt: new Date() 
    };
    this.progresses.set(id, updatedProgress);
    return updatedProgress;
  }

  // Payment methods
  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async getPaymentsByUserId(userId: number): Promise<Payment[]> {
    const userPayments = Array.from(this.payments.values()).filter(
      (payment) => payment.userId === userId
    );
    return userPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const id = this.paymentIdCounter++;
    const now = new Date();
    const payment: Payment = {
      ...paymentData,
      id,
      createdAt: now,
    };
    this.payments.set(id, payment);
    return payment;
  }
  
  // Content Management methods
  async getContentPage(id: number): Promise<ContentPage | undefined> {
    return this.contentPages.get(id);
  }

  async getContentPageBySlug(slug: string): Promise<ContentPage | undefined> {
    return Array.from(this.contentPages.values()).find(
      (page) => page.slug === slug
    );
  }

  async getAllContentPages(): Promise<ContentPage[]> {
    return Array.from(this.contentPages.values()).sort((a, b) => a.id - b.id);
  }

  async createContentPage(pageData: InsertContentPage): Promise<ContentPage> {
    const id = this.contentPageIdCounter++;
    const page: ContentPage = {
      ...pageData,
      id,
      lastModified: pageData.lastModified || new Date(),
      isPublished: pageData.isPublished || false,
    };
    this.contentPages.set(id, page);
    return page;
  }

  async updateContentPage(id: number, data: Partial<ContentPage>): Promise<ContentPage> {
    const page = await this.getContentPage(id);
    if (!page) {
      throw new Error(`Content page with ID ${id} not found`);
    }
    const updatedPage: ContentPage = { 
      ...page, 
      ...data,
      lastModified: new Date() 
    };
    this.contentPages.set(id, updatedPage);
    return updatedPage;
  }

  async deleteContentPage(id: number): Promise<void> {
    this.contentPages.delete(id);
  }
  
  // Settings methods
  async getSetting(key: string): Promise<string | null> {
    return this.settings.get(key) || null;
  }

  async getAllSettings(): Promise<SiteSetting[]> {
    const settingsList: SiteSetting[] = [];
    let id = 1;
    
    // Convert map entries to array to avoid TypeScript iterator warning
    const entriesArray = Array.from(this.settings.entries());
    
    for (const [key, value] of entriesArray) {
      settingsList.push({
        id: id++,
        key,
        value,
        updatedAt: new Date(),
      });
    }
    
    return settingsList;
  }

  async updateSetting(key: string, value: string): Promise<SiteSetting> {
    this.settings.set(key, value);
    return {
      id: 0, // Just a placeholder ID
      key,
      value,
      updatedAt: new Date(),
    };
  }

  // Credit methods
  async getCreditTransactions(id: number): Promise<CreditTransaction | undefined> {
    return this.creditTransactions.get(id);
  }

  async getCreditTransactionsByUserId(userId: number): Promise<CreditTransaction[]> {
    const userTransactions = Array.from(this.creditTransactions.values()).filter(
      (transaction) => transaction.userId === userId
    );
    return userTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAllCreditTransactions(): Promise<CreditTransaction[]> {
    return Array.from(this.creditTransactions.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createCreditTransaction(transactionData: InsertCreditTransaction): Promise<CreditTransaction> {
    const id = this.creditTransactionIdCounter++;
    const now = new Date();
    const transaction: CreditTransaction = {
      ...transactionData,
      id,
      createdAt: transactionData.createdAt || now,
    };
    this.creditTransactions.set(id, transaction);
    return transaction;
  }
  
  async addUserCredits(id: number, amount: number, reason: string, paymentId?: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    // Update user credits
    const currentCredits = user.credits || 0;
    const updatedUser = await this.updateUser(id, {
      credits: currentCredits + amount
    });
    
    // Record the transaction
    await this.createCreditTransaction({
      userId: id, 
      amount, 
      type: 'added',
      description: reason,
      paymentId: paymentId || null,
      videoId: null,
      createdAt: new Date()
    });
    
    return updatedUser;
  }
  
  async useUserCredits(id: number, amount: number, reason: string, videoId?: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const currentCredits = user.credits || 0;
    if (currentCredits < amount) {
      throw new Error('Insufficient credits');
    }
    
    // Update user credits and total used
    const currentTotalUsed = user.totalCreditsUsed || 0;
    const updatedUser = await this.updateUser(id, {
      credits: currentCredits - amount,
      totalCreditsUsed: currentTotalUsed + amount
    });
    
    // Record the transaction
    await this.createCreditTransaction({
      userId: id, 
      amount: -amount, // Negative amount for usage
      type: 'used',
      description: reason,
      paymentId: null,
      videoId: videoId || null,
      createdAt: new Date()
    });
    
    return updatedUser;
  }

  // Email verification and password reset methods for MemStorage
  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.emailVerificationToken === token);
  }

  async getUserByPasswordResetToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.passwordResetToken === token);
  }

  async verifyUserEmail(id: number): Promise<User> {
    return this.updateUser(id, {
      emailVerified: true,
      emailVerificationToken: null,
    });
  }

  async updateEmailVerificationToken(id: number, token: string): Promise<User> {
    return this.updateUser(id, { emailVerificationToken: token });
  }

  async setPasswordResetToken(id: number, token: string, expiresAt: Date): Promise<User> {
    return this.updateUser(id, {
      passwordResetToken: token,
      passwordResetExpires: expiresAt,
    });
  }

  async resetUserPassword(id: number, hashedPassword: string): Promise<User> {
    return this.updateUser(id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    });
  }

  // Club Management methods - return empty data for MemStorage
  async getClubCoachCount(clubId: number): Promise<number> {
    return 0;
  }

  async getClubTeamCount(clubId: number): Promise<number> {
    return 0;
  }

  async getClubPlayerCount(clubId: number): Promise<number> {
    return 0;
  }

  async getClubSessionCount(clubId: number): Promise<number> {
    return 0;
  }

  async getClubAvgCoachingScore(clubId: number): Promise<number> {
    return 0;
  }

  async getClubCoachesPerformance(clubId: number): Promise<any[]> {
    return [];
  }

  async getClubTeamsOverview(clubId: number): Promise<any[]> {
    return [];
  }

  async getClubInfo(clubId: number): Promise<any> {
    // Delegate to database implementation
    throw new Error("MemStorage does not support club operations - use DatabaseStorage");
  }

  async updateClubInfo(clubId: number, data: Partial<any>): Promise<any> {
    // Delegate to database implementation  
    throw new Error("MemStorage does not support club operations - use DatabaseStorage");
  }

  async getUserVideos(userId: number): Promise<Video[]> {
    return Array.from(this.videos.values()).filter(video => video.userId === userId);
  }

  async getUserFeedbacks(userId: number): Promise<Feedback[]> {
    return Array.from(this.feedbacks.values()).filter(feedback => feedback.userId === userId);
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Use memory store for sessions to avoid PostgreSQL connection issues
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user || undefined;
  }
  
  async getAllUsers(): Promise<User[]> {
    return db
      .select()
      .from(users)
      .orderBy(users.id);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        name: userData.name || null,
        role: userData.role || "coach",
        // Explicitly set nullable fields to ensure type compatibility
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: null,
        subscriptionTier: null,
      })
      .returning();
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    return updatedUser;
  }


  async updateUserStripeInfo(
    id: number, 
    data: { stripeCustomerId: string, stripeSubscriptionId: string }
  ): Promise<User> {
    return this.updateUser(id, {
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
    });
  }

  async updateStripeCustomerId(id: number, stripeCustomerId: string): Promise<User> {
    return this.updateUser(id, { stripeCustomerId });
  }

  async updateSubscriptionStatus(id: number, status: string, tier: string): Promise<User> {
    return this.updateUser(id, {
      subscriptionStatus: status,
      subscriptionTier: tier,
    });
  }

  // Email verification and password reset methods
  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.emailVerificationToken, token));
    return user || undefined;
  }

  async getUserByPasswordResetToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.passwordResetToken, token));
    return user || undefined;
  }

  async verifyUserEmail(id: number): Promise<User> {
    return this.updateUser(id, {
      emailVerified: true,
      emailVerificationToken: null,
    });
  }

  async updateEmailVerificationToken(id: number, token: string): Promise<User> {
    return this.updateUser(id, { emailVerificationToken: token });
  }

  async setPasswordResetToken(id: number, token: string, expiresAt: Date): Promise<User> {
    return this.updateUser(id, {
      passwordResetToken: token,
      passwordResetExpires: expiresAt,
    });
  }

  async resetUserPassword(id: number, hashedPassword: string): Promise<User> {
    return this.updateUser(id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    });
  }

  // Video methods
  async getVideo(id: number): Promise<Video | undefined> {
    const [video] = await db
      .select()
      .from(videos)
      .where(eq(videos.id, id));
    return video || undefined;
  }

  async getVideosByUserId(userId: number): Promise<Video[]> {
    return db
      .select()
      .from(videos)
      .where(eq(videos.userId, userId))
      .orderBy(desc(videos.createdAt));
  }
  
  async getAllVideos(): Promise<Video[]> {
    return db
      .select()
      .from(videos)
      .orderBy(desc(videos.createdAt));
  }

  async createVideo(videoData: InsertVideo): Promise<Video> {
    const [video] = await db
      .insert(videos)
      .values({
        ...videoData,
        description: videoData.description || null,
        status: "uploaded",
        processingProgress: 0,
        duration: null,
        createdAt: new Date(),
      })
      .returning();
    return video;
  }

  async updateVideo(id: number, data: Partial<Video>): Promise<Video> {
    const [updatedVideo] = await db
      .update(videos)
      .set(data)
      .where(eq(videos.id, id))
      .returning();

    if (!updatedVideo) {
      throw new Error(`Video with ID ${id} not found`);
    }
    
    return updatedVideo;
  }

  async updateVideoStatus(id: number, status: string, processingProgress: number = 0): Promise<Video> {
    return this.updateVideo(id, { status, processingProgress });
  }
  
  async updateVideoProgress(id: number, progress: number, status?: string): Promise<Video> {
    const data: Partial<Video> = { processingProgress: progress };
    if (status) {
      data.status = status;
    }
    return this.updateVideo(id, data);
  }
  
  async updateVideoS3Info(id: number, data: { s3Key: string, s3Url: string }): Promise<Video> {
    return this.updateVideo(id, { s3Key: data.s3Key, s3Url: data.s3Url });
  }

  async deleteVideo(id: number): Promise<void> {
    // With cascade delete in our schema, this will also delete associated feedbacks
    await db.delete(videos).where(eq(videos.id, id));
  }

  // Feedback methods
  async getFeedback(id: number): Promise<Feedback | undefined> {
    const [feedback] = await db
      .select()
      .from(feedbacks)
      .where(eq(feedbacks.id, id));
    return feedback || undefined;
  }

  async getFeedbacksByUserId(userId: number): Promise<Feedback[]> {
    return db
      .select()
      .from(feedbacks)
      .where(eq(feedbacks.userId, userId))
      .orderBy(desc(feedbacks.createdAt));
  }

  async getUserFeedbacks(userId: number): Promise<Feedback[]> {
    return this.getFeedbacksByUserId(userId);
  }

  async getUserVideos(userId: number): Promise<Video[]> {
    return this.getVideosByUserId(userId);
  }

  async getFeedbackByVideoId(videoId: number): Promise<Feedback | undefined> {
    const [feedback] = await db
      .select()
      .from(feedbacks)
      .where(eq(feedbacks.videoId, videoId));
    return feedback || undefined;
  }
  
  async getAllFeedbacks(): Promise<Feedback[]> {
    return db
      .select()
      .from(feedbacks)
      .orderBy(desc(feedbacks.createdAt));
  }

  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    // Ensure strengths and improvements are proper JSON objects if they're strings
    const processedData = { ...feedbackData };
    
    if (typeof processedData.strengths === 'string') {
      processedData.strengths = JSON.parse(processedData.strengths as string);
    }
    
    if (typeof processedData.improvements === 'string') {
      processedData.improvements = JSON.parse(processedData.improvements as string);
    }
    
    const [feedback] = await db
      .insert(feedbacks)
      .values({
        feedback: processedData.feedback,
        userId: processedData.userId,
        videoId: processedData.videoId,
        strengths: processedData.strengths,
        improvements: processedData.improvements,
        summary: processedData.summary || null,
        overallScore: processedData.overallScore || null,
        communicationScore: processedData.communicationScore || null,
        engagementScore: processedData.engagementScore || null,
        instructionScore: processedData.instructionScore || null,
        transcription: processedData.transcription || null,
        transcript: processedData.transcript || null,
        duration: processedData.duration || null,
        keyInfo: processedData.keyInfo || null,
        questioning: processedData.questioning || null,
        language: processedData.language || null,
        coachBehaviours: processedData.coachBehaviours || null,
        playerEngagement: processedData.playerEngagement || null,
        intendedOutcomes: processedData.intendedOutcomes || null,
        neuroscience: processedData.neuroscience || null,
        coachingFramework: processedData.coachingFramework || null,
        visualAnalysis: processedData.visualAnalysis || null,
        multiAiAnalysis: processedData.multiAiAnalysis || null,
        createdAt: new Date(),
      })
      .returning();
    return feedback;
  }

  async updateFeedback(id: number, data: Partial<Feedback>): Promise<Feedback> {
    const [updatedFeedback] = await db
      .update(feedbacks)
      .set(data)
      .where(eq(feedbacks.id, id))
      .returning();

    if (!updatedFeedback) {
      throw new Error(`Feedback with ID ${id} not found`);
    }
    
    return updatedFeedback;
  }

  async updateFeedbackByVideoId(videoId: number, data: Partial<Feedback>): Promise<Feedback> {
    console.log(`📝 Updating feedback for video ${videoId} with ultra-thorough analysis data...`);
    
    // Find the feedback by videoId first
    const existingFeedback = await this.getFeedbackByVideoId(videoId);
    if (!existingFeedback) {
      throw new Error(`Feedback for video ID ${videoId} not found`);
    }

    // Process any JSON string data for complex objects
    const processedData: any = {};
    Object.keys(data).forEach(key => {
      if (typeof data[key as keyof Feedback] === 'string' && key !== 'overallScore' && key !== 'communicationScore' && key !== 'engagementScore' && key !== 'instructionScore') {
        try {
          processedData[key] = JSON.parse(data[key as keyof Feedback] as string);
        } catch {
          processedData[key] = data[key as keyof Feedback];
        }
      } else {
        processedData[key] = data[key as keyof Feedback];
      }
    });

    console.log(`💾 Storing complete feedback sections: ${Object.keys(processedData).join(', ')}`);
    
    // Update using the feedback ID
    const [updatedFeedback] = await db
      .update(feedbacks)
      .set(processedData)
      .where(eq(feedbacks.id, existingFeedback.id))
      .returning();

    if (!updatedFeedback) {
      throw new Error(`Failed to update feedback for video ID ${videoId}`);
    }
    
    console.log(`✅ Ultra-thorough feedback successfully stored for video ${videoId}`);
    return updatedFeedback;
  }

  async deleteFeedback(id: number): Promise<void> {
    await db.delete(feedbacks).where(eq(feedbacks.id, id));
  }

  // Feedback Comments methods
  async getFeedbackComments(feedbackId: number): Promise<FeedbackComment[]> {
    return db
      .select({
        id: feedbackComments.id,
        feedbackId: feedbackComments.feedbackId,
        authorId: feedbackComments.authorId,
        parentCommentId: feedbackComments.parentCommentId,
        content: feedbackComments.content,
        isHeadCoachComment: feedbackComments.isHeadCoachComment,
        createdAt: feedbackComments.createdAt,
        updatedAt: feedbackComments.updatedAt,
        authorName: users.name,
        authorUsername: users.username,
        authorRole: users.role
      })
      .from(feedbackComments)
      .leftJoin(users, eq(feedbackComments.authorId, users.id))
      .where(eq(feedbackComments.feedbackId, feedbackId))
      .orderBy(asc(feedbackComments.createdAt));
  }

  async createFeedbackComment(comment: InsertFeedbackComment & { mentionedUsers?: number[] }): Promise<FeedbackComment> {
    const [newComment] = await db
      .insert(feedbackComments)
      .values({
        feedbackId: comment.feedbackId,
        authorId: comment.authorId,
        parentCommentId: comment.parentCommentId,
        content: comment.content,
        isHeadCoachComment: comment.isHeadCoachComment,
        mentionedUsers: comment.mentionedUsers || [],
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    // Get the comment with author details
    const [commentWithAuthor] = await db
      .select({
        id: feedbackComments.id,
        feedbackId: feedbackComments.feedbackId,
        authorId: feedbackComments.authorId,
        parentCommentId: feedbackComments.parentCommentId,
        content: feedbackComments.content,
        isHeadCoachComment: feedbackComments.isHeadCoachComment,
        mentionedUsers: feedbackComments.mentionedUsers,
        createdAt: feedbackComments.createdAt,
        updatedAt: feedbackComments.updatedAt,
        authorName: users.name,
        authorUsername: users.username,
        authorRole: users.role
      })
      .from(feedbackComments)
      .leftJoin(users, eq(feedbackComments.authorId, users.id))
      .where(eq(feedbackComments.id, newComment.id));

    return commentWithAuthor;
  }

  async updateFeedbackComment(id: number, data: Partial<FeedbackComment>): Promise<FeedbackComment> {
    const [updatedComment] = await db
      .update(feedbackComments)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(feedbackComments.id, id))
      .returning();

    if (!updatedComment) {
      throw new Error(`Feedback comment with ID ${id} not found`);
    }

    return updatedComment;
  }

  async deleteFeedbackComment(id: number): Promise<void> {
    await db.delete(feedbackComments).where(eq(feedbackComments.id, id));
  }

  // Progress methods
  async getProgress(id: number): Promise<Progress | undefined> {
    const [progressEntry] = await db
      .select()
      .from(progress)
      .where(eq(progress.id, id));
    return progressEntry || undefined;
  }

  async getProgressByUserId(userId: number): Promise<Progress | undefined> {
    const [progressEntry] = await db
      .select()
      .from(progress)
      .where(eq(progress.userId, userId));
    return progressEntry || undefined;
  }

  async createProgress(progressData: InsertProgress): Promise<Progress> {
    const [progressEntry] = await db
      .insert(progress)
      .values({
        userId: progressData.userId,
        communicationScoreAvg: progressData.communicationScoreAvg || null,
        engagementScoreAvg: progressData.engagementScoreAvg || null,
        instructionScoreAvg: progressData.instructionScoreAvg || null,
        overallScoreAvg: progressData.overallScoreAvg || null,
        sessionsCount: progressData.sessionsCount || 0,
        weeklyImprovement: progressData.weeklyImprovement || null,
        updatedAt: new Date()
      })
      .returning();
    return progressEntry;
  }

  async updateProgress(id: number, data: Partial<Progress>): Promise<Progress> {
    // Set the updatedAt field to the current time
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };
    
    const [updatedProgress] = await db
      .update(progress)
      .set(updateData)
      .where(eq(progress.id, id))
      .returning();

    if (!updatedProgress) {
      throw new Error(`Progress with ID ${id} not found`);
    }
    
    return updatedProgress;
  }

  // Credit methods
  async getCreditTransactions(id: number): Promise<CreditTransaction | undefined> {
    const [transaction] = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.id, id));
    return transaction || undefined;
  }

  async getCreditTransactionsByUserId(userId: number): Promise<CreditTransaction[]> {
    return db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(desc(creditTransactions.createdAt));
  }

  async getAllCreditTransactions(): Promise<CreditTransaction[]> {
    return db
      .select()
      .from(creditTransactions)
      .orderBy(desc(creditTransactions.createdAt));
  }

  async createCreditTransaction(transactionData: InsertCreditTransaction): Promise<CreditTransaction> {
    const [transaction] = await db
      .insert(creditTransactions)
      .values({
        ...transactionData,
        paymentId: transactionData.paymentId || null,
        videoId: transactionData.videoId || null,
        createdAt: transactionData.createdAt || new Date()
      })
      .returning();
    return transaction;
  }

  async addUserCredits(id: number, amount: number, reason: string, paymentId?: number): Promise<User> {
    // Get current user data
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    // Update user credits in a transaction
    const [updatedUser] = await db.transaction(async (tx) => {
      // Update user
      const [updatedUser] = await tx
        .update(users)
        .set({
          credits: (user.credits || 0) + amount
        })
        .where(eq(users.id, id))
        .returning();
      
      // Create transaction record
      await tx
        .insert(creditTransactions)
        .values({
          userId: id,
          amount,
          type: 'added',
          description: reason,
          paymentId: paymentId || null,
          videoId: null,
          createdAt: new Date()
        });
      
      return [updatedUser];
    });
    
    return updatedUser;
  }
  
  async useUserCredits(id: number, amount: number, reason: string, videoId?: number): Promise<User> {
    // Get current user data
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const currentCredits = user.credits || 0;
    if (currentCredits < amount) {
      throw new Error('Insufficient credits');
    }
    
    // Update user credits in a transaction
    const [updatedUser] = await db.transaction(async (tx) => {
      // Update user
      const [updatedUser] = await tx
        .update(users)
        .set({
          credits: currentCredits - amount,
          totalCreditsUsed: (user.totalCreditsUsed || 0) + amount
        })
        .where(eq(users.id, id))
        .returning();
      
      // Create transaction record
      await tx
        .insert(creditTransactions)
        .values({
          userId: id,
          amount: -amount, // Negative amount for usage
          type: 'used',
          description: reason,
          paymentId: null,
          videoId: videoId || null,
          createdAt: new Date()
        });
      
      return [updatedUser];
    });
    
    return updatedUser;
  }

  // Payment methods
  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id));
    return payment || undefined;
  }

  async getPaymentsByUserId(userId: number): Promise<Payment[]> {
    return db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values({
        userId: paymentData.userId,
        status: paymentData.status,
        amount: paymentData.amount,
        paymentType: paymentData.paymentType,
        currency: paymentData.currency || "usd",
        stripePaymentId: paymentData.stripePaymentId || null,
        stripeSessionId: paymentData.stripeSessionId || null,
        createdAt: new Date()
      })
      .returning();
    return payment;
  }
  
  // Content Management methods
  async getContentPage(id: number): Promise<ContentPage | undefined> {
    const [page] = await db
      .select()
      .from(contentPages)
      .where(eq(contentPages.id, id));
    return page || undefined;
  }

  async getContentPageBySlug(slug: string): Promise<ContentPage | undefined> {
    const [page] = await db
      .select()
      .from(contentPages)
      .where(eq(contentPages.slug, slug));
    return page || undefined;
  }

  async getAllContentPages(): Promise<ContentPage[]> {
    return db
      .select()
      .from(contentPages)
      .orderBy(contentPages.id);
  }

  async createContentPage(pageData: InsertContentPage): Promise<ContentPage> {
    const [page] = await db
      .insert(contentPages)
      .values({
        title: pageData.title,
        slug: pageData.slug,
        content: pageData.content,
        isPublished: pageData.isPublished !== undefined ? pageData.isPublished : false,
        lastModified: pageData.lastModified || new Date()
      })
      .returning();
    return page;
  }

  async updateContentPage(id: number, data: Partial<ContentPage>): Promise<ContentPage> {
    // Always update the lastModified field
    const updateData = {
      ...data,
      lastModified: new Date(),
    };
    
    const [updatedPage] = await db
      .update(contentPages)
      .set(updateData)
      .where(eq(contentPages.id, id))
      .returning();

    if (!updatedPage) {
      throw new Error(`Content page with ID ${id} not found`);
    }
    
    return updatedPage;
  }

  async deleteContentPage(id: number): Promise<void> {
    await db.delete(contentPages).where(eq(contentPages.id, id));
  }
  
  // Settings methods
  async getSetting(key: string): Promise<string | null> {
    const [setting] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, key));
    return setting?.value || null;
  }

  async getAllSettings(): Promise<SiteSetting[]> {
    return db
      .select()
      .from(siteSettings)
      .orderBy(siteSettings.key);
  }

  async updateSetting(key: string, value: string): Promise<SiteSetting> {
    // Check if the setting exists
    const existingSetting = await this.getSetting(key);
    
    if (existingSetting === null) {
      // Create new setting
      const [setting] = await db
        .insert(siteSettings)
        .values({
          key,
          value,
          updatedAt: new Date()
        })
        .returning();
      return setting;
    } else {
      // Update existing setting
      const [setting] = await db
        .update(siteSettings)
        .set({ 
          value, 
          updatedAt: new Date() 
        })
        .where(eq(siteSettings.key, key))
        .returning();
      return setting;
    }
  }

  // Club Management methods
  async getClub(id: number): Promise<Club | undefined> {
    const [club] = await db
      .select()
      .from(clubs)
      .where(eq(clubs.id, id));
    return club || undefined;
  }

  async getClubCoachCount(clubId: number): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.clubId, clubId));
    return Number(result[0]?.count) || 0;
  }

  async getClubTeamCount(clubId: number): Promise<number> {
    const result = await db.execute(
      `SELECT COUNT(*) as count FROM teams WHERE club_id = ${clubId}`
    );
    return Number(result.rows[0]?.count) || 0;
  }

  async getClubPlayerCount(clubId: number): Promise<number> {
    const result = await db.execute(
      `SELECT COUNT(p.*) as count 
       FROM players p 
       INNER JOIN teams t ON p.team_id = t.id 
       WHERE t.club_id = ${clubId}`
    );
    return Number(result.rows[0]?.count) || 0;
  }

  async getClubSessionCount(clubId: number): Promise<number> {
    const result = await db.execute(
      `SELECT COUNT(ts.*) as count 
       FROM training_sessions ts 
       INNER JOIN teams t ON ts.team_id = t.id 
       WHERE t.club_id = ${clubId}`
    );
    return Number(result.rows[0]?.count) || 0;
  }

  async getClubAvgCoachingScore(clubId: number): Promise<number> {
    const result = await db
      .select({ avg: avg(feedbacks.overallScore) })
      .from(feedbacks)
      .innerJoin(videos, eq(feedbacks.videoId, videos.id))
      .innerJoin(users, eq(videos.userId, users.id))
      .where(eq(users.clubId, clubId));
    // Convert from /100 scale to /10 scale
    return Math.round(((Number(result[0]?.avg) || 0) / 10) * 10) / 10;
  }

  async getClubCoachesPerformance(clubId: number): Promise<any[]> {
    const coaches = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        position: users.position,
        licenseLevel: users.licenseLevel,
        specialization: users.specialization
      })
      .from(users)
      .where(eq(users.clubId, clubId));

    // Calculate real performance data for each coach
    const coachPerformance = await Promise.all(
      coaches.map(async (coach) => {
        // Get coach's sessions (videos)
        const sessions = await db
          .select()
          .from(videos)
          .where(eq(videos.userId, coach.id));

        // Get coach's feedback scores
        const feedbackScores = await db
          .select({
            overallScore: feedbacks.overallScore
          })
          .from(feedbacks)
          .innerJoin(videos, eq(feedbacks.videoId, videos.id))
          .where(eq(videos.userId, coach.id));

        // Calculate average score with proper decimal rounding
        let avgScore = 0;
        if (feedbackScores.length > 0) {
          const totalScore = feedbackScores.reduce((sum, feedback) => 
            sum + (feedback.overallScore || 0), 0);
          // Convert from /100 scale to /10 scale and round to 1 decimal place
          avgScore = Math.round(((totalScore / feedbackScores.length) / 10) * 10) / 10;
        }

        // Calculate improvement (compare recent vs older sessions)
        let improvement = 0;
        if (feedbackScores.length >= 2) {
          const sortedScores = feedbackScores
            .filter(f => f.overallScore !== null)
            .map(f => f.overallScore || 0);
          
          if (sortedScores.length >= 2) {
            const recentAvg = sortedScores.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, sortedScores.length);
            const olderAvg = sortedScores.slice(0, -3).length > 0 
              ? sortedScores.slice(0, -3).reduce((a, b) => a + b, 0) / sortedScores.slice(0, -3).length
              : recentAvg;
            improvement = Math.round((recentAvg - olderAvg) * 10) / 10;
          }
        }

        return {
          id: coach.id,
          name: coach.name || coach.username,
          teams: 0, // Will be calculated when team assignments are implemented
          sessions: sessions.length,
          avgScore: avgScore,
          improvement: improvement,
          specialty: coach.specialization || 'General',
          licenseLevel: coach.licenseLevel || 'Not specified'
        };
      })
    );

    return coachPerformance;
  }

  async getClubPerformanceAverages(clubId: number): Promise<any> {
    // Get all feedbacks for club coaches
    const avgResults = await db
      .select({
        communicationScore: avg(feedbacks.communicationScore),
        engagementScore: avg(feedbacks.engagementScore),
        instructionScore: avg(feedbacks.instructionScore),
        overallScore: avg(feedbacks.overallScore)
      })
      .from(feedbacks)
      .innerJoin(videos, eq(feedbacks.videoId, videos.id))
      .innerJoin(users, eq(videos.userId, users.id))
      .where(eq(users.clubId, clubId));

    const result = avgResults[0];
    
    return {
      communication: Math.round((Number(result?.communicationScore) || 0) / 10) / 10,
      engagement: Math.round((Number(result?.engagementScore) || 0) / 10) / 10,
      instruction: Math.round((Number(result?.instructionScore) || 0) / 10) / 10,
      overall: Math.round((Number(result?.overallScore) || 0) / 10) / 10
    };
  }



  async getClubInfo(clubId: number): Promise<any> {
    const [club] = await db
      .select({
        id: clubs.id,
        name: clubs.name,
        type: clubs.type,
        city: clubs.city,
        country: clubs.country,
        licenseLevel: clubs.licenseLevel,
        contactEmail: clubs.contactEmail,
        phoneNumber: clubs.phoneNumber,
        website: clubs.website,
        logo: clubs.logo,
        primaryColor: clubs.primaryColor,
        secondaryColor: clubs.secondaryColor,
        accentColor: clubs.accentColor,
        createdAt: clubs.createdAt
      })
      .from(clubs)
      .where(eq(clubs.id, clubId));
    return club || null;
  }

  async updateClubInfo(clubId: number, data: Partial<any>): Promise<any> {
    // Only include fields that are actually provided and not empty
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.licenseLevel !== undefined) updateData.licenseLevel = data.licenseLevel;
    if (data.contactEmail !== undefined) updateData.contactEmail = data.contactEmail;
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.primaryColor !== undefined) updateData.primaryColor = data.primaryColor;
    if (data.secondaryColor !== undefined) updateData.secondaryColor = data.secondaryColor;
    if (data.accentColor !== undefined) updateData.accentColor = data.accentColor;

    const [updatedClub] = await db
      .update(clubs)
      .set(updateData)
      .where(eq(clubs.id, clubId))
      .returning();
    return updatedClub;
  }

  async getRecentClubActivity(): Promise<any[]> {
    // Get recent coaching sessions with feedback
    const recentFeedbacks = await db
      .select({
        id: feedbacks.id,
        videoId: feedbacks.videoId,
        userId: feedbacks.userId,
        overallScore: feedbacks.overallScore,
        createdAt: feedbacks.createdAt,
        title: videos.title,
        username: users.username,
        name: users.name
      })
      .from(feedbacks)
      .leftJoin(videos, eq(feedbacks.videoId, videos.id))
      .leftJoin(users, eq(feedbacks.userId, users.id))
      .orderBy(desc(feedbacks.createdAt))
      .limit(10);

    // Get recent user registrations
    const recentUsers = await db
      .select({
        id: users.id,
        username: users.username,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.role, 'coach'))
      .orderBy(desc(users.createdAt))
      .limit(5);

    // Get recent video uploads
    const recentVideos = await db
      .select({
        id: videos.id,
        title: videos.title,
        userId: videos.userId,
        status: videos.status,
        createdAt: videos.createdAt,
        username: users.username,
        name: users.name
      })
      .from(videos)
      .leftJoin(users, eq(videos.userId, users.id))
      .orderBy(desc(videos.createdAt))
      .limit(10);

    // Combine and format activities
    const activities: any[] = [];

    // Add feedback activities
    recentFeedbacks.forEach(feedback => {
      if (feedback.overallScore && feedback.createdAt) {
        activities.push({
          id: `feedback-${feedback.id}`,
          type: 'analysis_complete',
          title: 'Coaching Analysis Complete',
          description: `${feedback.name || feedback.username} achieved ${feedback.overallScore}/10 coaching score`,
          user: feedback.name || feedback.username,
          createdAt: feedback.createdAt,
          icon: 'trophy',
          color: 'blue'
        });
      }
    });

    // Add new coach activities
    recentUsers.forEach(user => {
      if (user.createdAt) {
        activities.push({
          id: `user-${user.id}`,
          type: 'coach_onboarded',
          title: 'New Coach Onboarded',
          description: `${user.name || user.username} joined the coaching staff`,
          user: user.name || user.username,
          createdAt: user.createdAt,
          icon: 'user-plus',
          color: 'green'
        });
      }
    });

    // Add video upload activities
    recentVideos.forEach(video => {
      if (video.status === 'completed' && video.createdAt) {
        activities.push({
          id: `video-${video.id}`,
          type: 'session_uploaded',
          title: 'New Session Uploaded',
          description: `${video.name || video.username} uploaded "${video.title}"`,
          user: video.name || video.username,
          createdAt: video.createdAt,
          icon: 'upload',
          color: 'purple'
        });
      }
    });

    // Sort by creation date and return latest 8 activities
    return activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
  }

  async updateClubLogo(clubId: number, logoUrl: string): Promise<void> {
    await db
      .update(clubs)
      .set({ logo: logoUrl })
      .where(eq(clubs.id, clubId));
  }

  async updateUserProfilePicture(userId: number, profilePictureUrl: string): Promise<void> {
    await db
      .update(users)
      .set({ profilePicture: profilePictureUrl })
      .where(eq(users.id, userId));
  }

  // Super Admin Methods Implementation
  async getTotalUserCount(): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(users);
    return Number(result[0]?.count) || 0;
  }

  async getTotalClubCount(): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(clubs);
    return Number(result[0]?.count) || 0;
  }

  async getTotalVideoCount(): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(videos);
    return Number(result[0]?.count) || 0;
  }

  async getTotalFeedbackCount(): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(feedbacks);
    return Number(result[0]?.count) || 0;
  }

  async getTotalTransactionCount(): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(creditTransactions);
    return Number(result[0]?.count) || 0;
  }

  async getRecentSystemActivity(): Promise<any[]> {
    try {
      // Get recent user activities
      const recentUsers = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          createdAt: users.createdAt,
          role: users.role
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(10);

      // Get recent video uploads
      const recentVideos = await db
        .select({
          id: videos.id,
          title: videos.title,
          userId: videos.userId,
          createdAt: videos.createdAt,
          status: videos.status,
          username: users.username,
          name: users.name
        })
        .from(videos)
        .leftJoin(users, eq(videos.userId, users.id))
        .orderBy(desc(videos.createdAt))
        .limit(10);

      // Get recent analysis completions
      const recentAnalyses = await db
        .select({
          id: feedbacks.id,
          videoId: feedbacks.videoId,
          userId: feedbacks.userId,
          createdAt: feedbacks.createdAt,
          overallScore: feedbacks.overallScore,
          username: users.username,
          name: users.name,
          videoTitle: videos.title
        })
        .from(feedbacks)
        .leftJoin(users, eq(feedbacks.userId, users.id))
        .leftJoin(videos, eq(feedbacks.videoId, videos.id))
        .orderBy(desc(feedbacks.createdAt))
        .limit(10);

      // Combine and format activities
      const activities: any[] = [];

      // Add user registration activities
      recentUsers.forEach(user => {
        activities.push({
          id: `user-${user.id}`,
          type: 'user_registration',
          description: `New ${user.role} registered: ${user.name || user.username}`,
          timestamp: user.createdAt,
          severity: 'info' as const
        });
      });

      // Add video upload activities
      recentVideos.forEach(video => {
        activities.push({
          id: `video-${video.id}`,
          type: 'video_upload',
          description: `${video.name || video.username} uploaded "${video.title}" (${video.status})`,
          timestamp: video.createdAt,
          severity: video.status === 'failed' ? 'error' as const : 'info' as const
        });
      });

      // Add analysis completion activities
      recentAnalyses.forEach(analysis => {
        activities.push({
          id: `analysis-${analysis.id}`,
          type: 'analysis_complete',
          description: `AI analysis completed for "${analysis.videoTitle}" - Score: ${analysis.overallScore}/10`,
          timestamp: analysis.createdAt,
          severity: 'info' as const
        });
      });

      // Sort by timestamp and return latest 15
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 15);
    } catch (error) {
      console.error('Error fetching recent system activity:', error);
      return [];
    }
  }

  async getAllUsersForSuperAdmin(): Promise<any[]> {
    try {
      const allUsers = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          name: users.name,
          role: users.role,
          clubId: users.clubId,
          credits: users.credits,
          totalCreditsUsed: users.totalCreditsUsed,
          subscriptionStatus: users.subscriptionStatus,
          subscriptionTier: users.subscriptionTier,
          isEmailVerified: users.emailVerified,
          createdAt: users.createdAt,
          clubName: clubs.name
        })
        .from(users)
        .leftJoin(clubs, eq(users.clubId, clubs.id))
        .orderBy(desc(users.createdAt));

      // Get video counts for each user
      const userVideoCounts = await db
        .select({
          userId: videos.userId,
          count: sql<number>`count(*)`
        })
        .from(videos)
        .groupBy(videos.userId);

      const videoCountMap = new Map(
        userVideoCounts.map(item => [item.userId, item.count])
      );

      return allUsers.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name || '',
        role: user.role || 'coach',
        clubId: user.clubId || 0,
        clubName: user.clubName || 'No Club',
        isActive: user.isActive || true,
        lastLogin: user.lastLoginAt ? user.lastLoginAt.toISOString() : '',
        totalVideos: videoCountMap.get(user.id) || 0,
        totalCredits: user.credits || 0,
        subscriptionStatus: user.subscriptionStatus || 'free',
        createdAt: user.createdAt ? user.createdAt.toISOString() : ''
      }));
    } catch (error) {
      console.error('Error fetching all users for super admin:', error);
      return [];
    }
  }

  async getAllClubsForSuperAdmin(): Promise<any[]> {
    try {
      const allClubs = await db
        .select({
          id: clubs.id,
          name: clubs.name,
          type: clubs.type,
          country: clubs.country,
          logoUrl: clubs.logo,
          isActive: clubs.isActive,
          createdAt: clubs.createdAt
        })
        .from(clubs)
        .orderBy(desc(clubs.createdAt));

      // Get coach counts for each club
      const clubCoachCounts = await db
        .select({
          clubId: users.clubId,
          count: sql<number>`count(*)`
        })
        .from(users)
        .where(and(
          isNotNull(users.clubId),
          inArray(users.role, ['coach', 'head_coach', 'admin'])
        ))
        .groupBy(users.clubId);

      const coachCountMap = new Map(
        clubCoachCounts.map(item => [item.clubId, item.count])
      );

      // Get video counts for each club
      const clubVideoCounts = await db
        .select({
          clubId: users.clubId,
          count: sql<number>`count(*)`
        })
        .from(videos)
        .leftJoin(users, eq(videos.userId, users.id))
        .where(isNotNull(users.clubId))
        .groupBy(users.clubId);

      const videoCountMap = new Map(
        clubVideoCounts.map(item => [item.clubId, item.count])
      );

      return allClubs.map(club => ({
        id: club.id,
        name: club.name,
        type: club.type || 'Football Club',
        country: club.country || 'Unknown',
        totalCoaches: coachCountMap.get(club.id) || 0,
        totalVideos: videoCountMap.get(club.id) || 0,
        isActive: club.isActive !== false,
        createdAt: club.createdAt ? club.createdAt.toISOString() : '',
        logoUrl: club.logoUrl || club.logo || ''
      }));
    } catch (error) {
      console.error('Error fetching all clubs for super admin:', error);
      return [];
    }
  }

  async updateUserStatus(userId: number, isActive: boolean): Promise<void> {
    await db
      .update(users)
      .set({ isActive })
      .where(eq(users.id, userId));
  }

  async updateUserCredits(userId: number, credits: number, operation: 'add' | 'set'): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    const newCredits = operation === 'add' 
      ? (user.credits || 0) + credits 
      : credits;

    await db
      .update(users)
      .set({ credits: newCredits })
      .where(eq(users.id, userId));

    // Record the transaction
    await this.createCreditTransaction({
      userId,
      amount: operation === 'add' ? credits : credits - (user.credits || 0),
      type: 'admin_adjustment',
      description: `Super admin ${operation === 'add' ? 'added' : 'set'} credits: ${credits}`,
      paymentId: null,
      videoId: null,
      createdAt: new Date()
    });
  }

  // Removed duplicate deleteUser method - kept the more robust implementation below

  // User invitation methods (removed duplicate - kept the more robust implementation below)

  // Removed duplicate getUserByInvitationToken and completeUserInvitation methods
  // Kept the more robust implementations below

  async assignUserToClub(userId: number, clubId: number | null): Promise<void> {
    await db
      .update(users)
      .set({ clubId })
      .where(eq(users.id, userId));
  }

  async updateUserRole(userId: number, role: string): Promise<void> {
    await db
      .update(users)
      .set({ role })
      .where(eq(users.id, userId));
  }





  async updateClubStatus(clubId: number, isActive: boolean): Promise<void> {
    await db
      .update(clubs)
      .set({ isActive })
      .where(eq(clubs.id, clubId));
  }

  async deleteClub(clubId: number): Promise<void> {
    // Delete club and update users to remove club association
    await db.transaction(async (tx) => {
      // Remove club association from users
      await tx
        .update(users)
        .set({ clubId: null })
        .where(eq(users.clubId, clubId));
      
      // Delete the club
      await tx.delete(clubs).where(eq(clubs.id, clubId));
    });
  }

  async getAllSystemSettings(): Promise<any[]> {
    const settings = await this.getAllSettings();
    return settings.map(setting => ({
      key: setting.key,
      value: setting.value,
      description: `System setting: ${setting.key}`,
      category: 'system',
      updatedAt: new Date().toISOString()
    }));
  }

  async updateSystemSetting(key: string, value: string): Promise<void> {
    await this.updateSetting(key, value);
  }

  // Custom Feedback Reports Implementation
  async getCustomFeedbackReport(id: number): Promise<CustomFeedbackReport | undefined> {
    const [report] = await db
      .select()
      .from(customFeedbackReports)
      .where(eq(customFeedbackReports.id, id));
    
    return report;
  }

  async getCustomFeedbackReportsByAuthor(authorId: number): Promise<CustomFeedbackReport[]> {
    return await db
      .select()
      .from(customFeedbackReports)
      .where(eq(customFeedbackReports.authorId, authorId))
      .orderBy(desc(customFeedbackReports.createdAt));
  }

  async getCustomFeedbackReportsByCoach(coachId: number): Promise<CustomFeedbackReport[]> {
    return await db
      .select()
      .from(customFeedbackReports)
      .where(eq(customFeedbackReports.coachId, coachId))
      .orderBy(desc(customFeedbackReports.createdAt));
  }

  async getCustomFeedbackReportsByClub(clubId: number): Promise<CustomFeedbackReport[]> {
    return await db
      .select({
        ...customFeedbackReports,
        authorName: users.name,
      })
      .from(customFeedbackReports)
      .leftJoin(users, eq(customFeedbackReports.authorId, users.id))
      .where(eq(users.clubId, clubId))
      .orderBy(desc(customFeedbackReports.createdAt));
  }

  async createCustomFeedbackReport(report: InsertCustomFeedbackReport): Promise<CustomFeedbackReport> {
    const [newReport] = await db
      .insert(customFeedbackReports)
      .values({
        ...report,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return newReport;
  }

  async updateCustomFeedbackReport(id: number, data: Partial<CustomFeedbackReport>): Promise<CustomFeedbackReport> {
    const [updatedReport] = await db
      .update(customFeedbackReports)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(customFeedbackReports.id, id))
      .returning();
    
    return updatedReport;
  }

  async deleteCustomFeedbackReport(id: number): Promise<void> {
    await db
      .delete(customFeedbackReports)
      .where(eq(customFeedbackReports.id, id));
  }

  async getCoachesForCustomReports(authorId: number): Promise<User[]> {
    // Get the author's club ID and role
    const [author] = await db
      .select({ clubId: users.clubId, role: users.role })
      .from(users)
      .where(eq(users.id, authorId));

    if (!author) {
      return [];
    }

    // If super admin, can see all coaches
    if (author.role === 'admin') {
      return await db
        .select()
        .from(users)
        .where(eq(users.role, 'coach'))
        .orderBy(users.name);
    }

    // If club admin or head of coaching, can see coaches in their club
    if ((author.role === 'club_admin' || author.role === 'head_of_coaching') && author.clubId) {
      return await db
        .select()
        .from(users)
        .where(and(
          eq(users.role, 'coach'),
          eq(users.clubId, author.clubId)
        ))
        .orderBy(users.name);
    }

    return [];
  }

  // User Invitation System methods
  async createUserInvitation(userData: {
    name: string;
    email: string;
    role: string;
    position?: string | null;
    ageGroup?: string | null;
    licenseLevel?: string | null;
    clubId?: number | null;
    invitationToken: string;
    invitationExpires: Date;
  }): Promise<User> {
    try {
      const hashedPassword = await bcryptjs.hash('temp_password_' + Date.now(), 10);
      
      const [newUser] = await db
        .insert(users)
        .values({
          username: userData.email, // Use email as username for invitations
          password: hashedPassword,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          position: userData.position || null,
          ageGroup: userData.ageGroup || null,
          licenseLevel: userData.licenseLevel || null,
          clubId: userData.clubId || null,
          emailVerified: false,
          isActive: false, // Inactive until invitation is completed
          invitationToken: userData.invitationToken,
          invitationExpires: userData.invitationExpires,
          createdAt: new Date(),
          credits: 10, // Default credits
          totalCreditsUsed: 0
        })
        .returning();

      return newUser;
    } catch (error: any) {
      console.error('Error creating user invitation:', error);
      if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        throw new Error('User with this email already exists');
      }
      throw error;
    }
  }

  async getUserByInvitationToken(token: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.invitationToken, token));

      return user;
    } catch (error) {
      console.error('Error fetching user by invitation token:', error);
      return undefined;
    }
  }

  async completeUserInvitation(token: string, password: string): Promise<User> {
    const user = await this.getUserByInvitationToken(token);
    if (!user) {
      throw new Error('Invalid or expired invitation token');
    }

    // Use the same password hashing as auth system
    const { hashPassword } = await import('./auth-utils');
    const hashedPassword = await hashPassword(password);

    const [updatedUser] = await db
      .update(users)
      .set({
        password: hashedPassword,
        isActive: true,
        emailVerified: true,
        invitationToken: null,
        invitationExpires: null
      })
      .where(eq(users.id, user.id))
      .returning();

    return updatedUser;
  }

  async getPendingInvitations(clubId?: number | null): Promise<User[]> {
    let query = db
      .select()
      .from(users)
      .where(and(
        eq(users.isActive, false),
        isNotNull(users.invitationToken)
      ));

    // If clubId is provided, filter by club; if null, show all for super admin
    if (clubId !== null && clubId !== undefined) {
      query = query.where(eq(users.clubId, clubId));
    }

    return await query.orderBy(users.createdAt);
  }

  // Notification methods
  async createNotification(notification: {
    userId: number;
    type: string;
    title: string;
    message: string;
    relatedEntityType?: string;
    relatedEntityId?: number;
  }): Promise<any> {
    const [newNotification] = await db
      .insert(notifications)
      .values({
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        relatedEntityType: notification.relatedEntityType,
        relatedEntityId: notification.relatedEntityId,
        isRead: false
      })
      .returning();
    
    return newNotification;
  }

  async getUserNotifications(userId: number): Promise<any[]> {
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
    
    return userNotifications;
  }

  async markNotificationAsRead(notificationId: number, userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ));
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async getUsersByClubId(clubId: number): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.clubId, clubId));
  }

  async deleteUser(id: number): Promise<void> {
    try {
      // Check if user has associated data that would prevent deletion
      const userVideos = await db
        .select({ count: sql<number>`count(*)` })
        .from(videos)
        .where(eq(videos.userId, id));
      
      const userFeedbacks = await db
        .select({ count: sql<number>`count(*)` })
        .from(feedbacks)
        .where(eq(feedbacks.userId, id));
      
      const videoCount = userVideos[0]?.count || 0;
      const feedbackCount = userFeedbacks[0]?.count || 0;
      
      if (videoCount > 0 || feedbackCount > 0) {
        throw new Error(`Cannot delete user: has ${videoCount} videos and ${feedbackCount} feedback records`);
      }
      
      // Safe to delete user
      await db
        .delete(users)
        .where(eq(users.id, id));
    } catch (error: any) {
      console.error("Error in deleteUser:", error);
      throw error;
    }
  }

  // Club Communication Methods
  async getClubMessages(clubId: number): Promise<any[]> {
    return await db
      .select({
        id: clubMessages.id,
        content: clubMessages.content,
        messageType: clubMessages.messageType,
        attachmentUrl: clubMessages.attachmentUrl,
        attachmentName: clubMessages.attachmentName,
        attachmentSize: clubMessages.attachmentSize,
        createdAt: clubMessages.createdAt,
        senderName: users.name,
        senderUsername: users.username,
        senderRole: users.role,
        senderId: clubMessages.senderId
      })
      .from(clubMessages)
      .innerJoin(users, eq(clubMessages.senderId, users.id))
      .where(eq(clubMessages.clubId, clubId))
      .orderBy(desc(clubMessages.createdAt))
      .limit(50);
  }

  async getUnreadClubMessagesCount(userId: number, clubId: number): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(clubMessages)
      .leftJoin(
        messageReadStatus,
        and(
          eq(messageReadStatus.messageId, clubMessages.id),
          eq(messageReadStatus.userId, userId),
          eq(messageReadStatus.messageType, "club")
        )
      )
      .where(
        and(
          eq(clubMessages.clubId, clubId),
          ne(clubMessages.senderId, userId), // Don't count own messages
          isNull(messageReadStatus.id) // Messages not marked as read
        )
      );

    return result[0]?.count || 0;
  }

  async markClubMessageAsRead(userId: number, messageId: number): Promise<void> {
    await db
      .insert(messageReadStatus)
      .values({
        userId,
        messageId,
        messageType: "club",
      })
      .onConflictDoNothing()
      .execute();
  }

  async createClubMessage(message: InsertClubMessage): Promise<ClubMessage> {
    const [newMessage] = await db
      .insert(clubMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getClubMembers(clubId: number): Promise<User[]> {
    return await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        role: users.role,
        position: users.position,
        profilePicture: users.profilePicture
      })
      .from(users)
      .where(eq(users.clubId, clubId));
  }



  async getConversationsByUser(userId: number): Promise<any[]> {
    const result = await db
      .select({
        conversation: conversations,
        otherUser: users,
      })
      .from(conversations)
      .innerJoin(
        users,
        or(
          and(eq(conversations.participant1Id, userId), eq(users.id, conversations.participant2Id)),
          and(eq(conversations.participant2Id, userId), eq(users.id, conversations.participant1Id))
        )
      )
      .where(
        or(
          eq(conversations.participant1Id, userId),
          eq(conversations.participant2Id, userId)
        )
      )
      .orderBy(desc(conversations.lastMessageAt));

    return result.map(row => ({
      ...row.conversation,
      otherParticipant: row.otherUser,
    }));
  }

  async getConversationById(conversationId: number, userId: number): Promise<Conversation | null> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          or(
            eq(conversations.participant1Id, userId),
            eq(conversations.participant2Id, userId)
          )
        )
      )
      .limit(1);

    return conversation || null;
  }

  async createDirectMessage(data: InsertDirectMessage): Promise<DirectMessage> {
    const [message] = await db.insert(directMessages).values(data).returning();
    
    // Update last message timestamp on conversation
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, data.conversationId));

    return message;
  }

  async getDirectMessages(conversationId: number, userId: number): Promise<any[]> {
    // Verify user has access to this conversation
    const conversation = await this.getConversationById(conversationId, userId);
    if (!conversation) {
      return [];
    }

    const result = await db
      .select({
        message: directMessages,
        sender: users,
      })
      .from(directMessages)
      .innerJoin(users, eq(directMessages.senderId, users.id))
      .where(eq(directMessages.conversationId, conversationId))
      .orderBy(asc(directMessages.createdAt));

    return result.map(row => ({
      ...row.message,
      sender: row.sender,
    }));
  }

  async markMessagesAsRead(conversationId: number, userId: number): Promise<void> {
    await db
      .update(directMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(directMessages.conversationId, conversationId),
          ne(directMessages.senderId, userId), // Don't mark own messages as read
          eq(directMessages.isRead, false)
        )
      );
  }

  async getUnreadDirectMessagesCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(directMessages)
      .innerJoin(conversations, eq(directMessages.conversationId, conversations.id))
      .where(
        and(
          or(
            eq(conversations.participant1Id, userId),
            eq(conversations.participant2Id, userId)
          ),
          ne(directMessages.senderId, userId), // Don't count own messages
          eq(directMessages.isRead, false)
        )
      );

    return result[0]?.count || 0;
  }

  // Conversation methods
  async createConversation(data: {
    title?: string;
    type: string;
    clubId?: number;
    createdBy: number;
    participantIds: number[];
  }): Promise<any> {
    // For now, only support direct conversations between 2 participants
    if (data.participantIds.length !== 2) {
      throw new Error("Only direct conversations between 2 participants are supported");
    }
    
    const conversationData = {
      participant1Id: data.participantIds[0],
      participant2Id: data.participantIds[1],
      clubId: data.clubId || 1, // Default to club 1 if not provided
    };

    const [conversation] = await db
      .insert(conversations)
      .values(conversationData)
      .returning();

    return conversation;
  }

  async getUserConversations(userId: number): Promise<any[]> {
    return await db
      .select()
      .from(conversations)
      .where(
        or(
          eq(conversations.participant1Id, userId),
          eq(conversations.participant2Id, userId)
        )
      )
      .orderBy(desc(conversations.lastMessageAt));
  }

  async getConversationMessages(conversationId: number, userId: number): Promise<any[]> {
    // Verify user is participant
    const conversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          or(
            eq(conversations.participant1Id, userId),
            eq(conversations.participant2Id, userId)
          )
        )
      )
      .limit(1);

    if (conversation.length === 0) {
      throw new Error("User is not a participant in this conversation");
    }

    return await db
      .select({
        id: directMessages.id,
        conversationId: directMessages.conversationId,
        senderId: directMessages.senderId,
        content: directMessages.content,
        messageType: directMessages.messageType,
        attachmentUrl: directMessages.attachmentUrl,
        isRead: directMessages.isRead,
        createdAt: directMessages.createdAt,
        senderName: users.name,
        senderUsername: users.username,
        senderRole: users.role
      })
      .from(directMessages)
      .innerJoin(users, eq(directMessages.senderId, users.id))
      .where(eq(directMessages.conversationId, conversationId))
      .orderBy(asc(directMessages.createdAt));
  }

  async createMessage(data: any & { mentionedUsers?: number[] }): Promise<any> {
    const [message] = await db
      .insert(directMessages)
      .values({
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content,
        messageType: data.messageType || 'text',
        attachmentUrl: data.attachmentUrl,
        isRead: false
      })
      .returning();

    // Update conversation lastMessageAt
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, data.conversationId));

    // Get message with sender details
    const [messageWithSender] = await db
      .select({
        id: directMessages.id,
        conversationId: directMessages.conversationId,
        senderId: directMessages.senderId,
        content: directMessages.content,
        messageType: directMessages.messageType,
        attachmentUrl: directMessages.attachmentUrl,
        isRead: directMessages.isRead,
        createdAt: directMessages.createdAt,
        senderName: users.name,
        senderUsername: users.username,
        senderRole: users.role
      })
      .from(directMessages)
      .innerJoin(users, eq(directMessages.senderId, users.id))
      .where(eq(directMessages.id, message.id));

    return messageWithSender;
  }

  async getOrCreateDirectConversation(userId1: number, userId2: number, clubId?: number): Promise<any> {
    try {
      // Check if conversation already exists between these users
      const existingConv = await db
        .select()
        .from(conversations)
        .where(
          or(
            and(
              eq(conversations.participant1Id, userId1),
              eq(conversations.participant2Id, userId2)
            ),
            and(
              eq(conversations.participant1Id, userId2),
              eq(conversations.participant2Id, userId1)
            )
          )
        )
        .limit(1);

      if (existingConv.length > 0) {
        return existingConv[0];
      }

      // Create new conversation
      return await this.createConversation({
        type: 'direct',
        createdBy: userId1,
        participantIds: [userId1, userId2],
        clubId: clubId || 1
      });
    } catch (error) {
      console.error("Error in getOrCreateDirectConversation:", error);
      throw error;
    }
  }

  async getClubManagementUsers(clubId: number, excludeUserId: number): Promise<any[]> {
    try {
      // Get the current user to determine their role
      const currentUser = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, excludeUserId))
        .limit(1);

      if (currentUser.length === 0) return [];

      const userRole = currentUser[0].role;

      // For coaches: show head coaches and admins
      if (userRole === 'coach') {
        return await db
          .select({
            id: users.id,
            name: users.name,
            username: users.username,
            role: users.role
          })
          .from(users)
          .where(and(
            eq(users.clubId, clubId),
            or(
              eq(users.role, 'head_coach'),
              eq(users.role, 'super_admin'),
              eq(users.role, 'admin')
            ),
            ne(users.id, excludeUserId)
          ));
      }

      // For head coaches and admins: show coaches in their club
      if (userRole === 'head_coach' || userRole === 'admin' || userRole === 'super_admin') {
        return await db
          .select({
            id: users.id,
            name: users.name,
            username: users.username,
            role: users.role
          })
          .from(users)
          .where(and(
            eq(users.clubId, clubId),
            eq(users.role, 'coach'),
            ne(users.id, excludeUserId)
          ));
      }

      return [];
    } catch (error) {
      console.error("Error getting club management users:", error);
      return [];
    }
  }

  // Development Plans Methods
  async getDevelopmentPlansByUserId(userId: number): Promise<SelectDevelopmentPlan[]> {
    try {
      const plans = await db
        .select()
        .from(developmentPlans)
        .where(eq(developmentPlans.userId, userId))
        .orderBy(desc(developmentPlans.createdAt));
      
      return plans;
    } catch (error) {
      console.error('Error fetching development plans:', error);
      return [];
    }
  }

  async createDevelopmentPlan(data: InsertDevelopmentPlan): Promise<SelectDevelopmentPlan> {
    const [plan] = await db
      .insert(developmentPlans)
      .values({
        ...data,
        updatedAt: new Date()
      })
      .returning();
    
    return plan;
  }

  async updateDevelopmentPlan(id: number, data: Partial<SelectDevelopmentPlan>): Promise<SelectDevelopmentPlan> {
    const [plan] = await db
      .update(developmentPlans)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(developmentPlans.id, id))
      .returning();
    
    return plan;
  }

  async deleteDevelopmentPlan(id: number): Promise<void> {
    await db
      .delete(developmentPlans)
      .where(eq(developmentPlans.id, id));
  }

  async getDevelopmentPlanWithDetails(planId: number): Promise<SelectDevelopmentPlan | null> {
    try {
      const [plan] = await db
        .select()
        .from(developmentPlans)
        .where(eq(developmentPlans.id, planId))
        .limit(1);
      
      if (!plan) return null;

      // Get goals for this plan
      const goals = await db
        .select()
        .from(developmentGoals)
        .where(eq(developmentGoals.planId, planId))
        .orderBy(asc(developmentGoals.createdAt));

      // Get actions for each goal
      const planWithDetails = {
        ...plan,
        goals: await Promise.all(
          goals.map(async (goal) => {
            const actions = await db
              .select()
              .from(developmentActions)
              .where(eq(developmentActions.goalId, goal.id))
              .orderBy(asc(developmentActions.createdAt));
            
            return {
              ...goal,
              actions
            };
          })
        )
      };

      return planWithDetails as any;
    } catch (error) {
      console.error('Error fetching development plan with details:', error);
      return null;
    }
  }

  // Development Goals Methods
  async getDevelopmentGoalsByPlanId(planId: number): Promise<SelectDevelopmentGoal[]> {
    try {
      const goals = await db
        .select()
        .from(developmentGoals)
        .where(eq(developmentGoals.planId, planId))
        .orderBy(asc(developmentGoals.createdAt));
      
      return goals;
    } catch (error) {
      console.error('Error fetching development goals:', error);
      return [];
    }
  }

  async createDevelopmentGoal(data: InsertDevelopmentGoal): Promise<SelectDevelopmentGoal> {
    const [goal] = await db
      .insert(developmentGoals)
      .values({
        ...data,
        updatedAt: new Date()
      })
      .returning();
    
    return goal;
  }

  async updateDevelopmentGoal(id: number, data: Partial<SelectDevelopmentGoal>): Promise<SelectDevelopmentGoal> {
    const [goal] = await db
      .update(developmentGoals)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(developmentGoals.id, id))
      .returning();
    
    return goal;
  }

  async deleteDevelopmentGoal(id: number): Promise<void> {
    await db
      .delete(developmentGoals)
      .where(eq(developmentGoals.id, id));
  }

  // Development Actions Methods
  async getDevelopmentActionsByGoalId(goalId: number): Promise<SelectDevelopmentAction[]> {
    try {
      const actions = await db
        .select()
        .from(developmentActions)
        .where(eq(developmentActions.goalId, goalId))
        .orderBy(asc(developmentActions.createdAt));
      
      return actions;
    } catch (error) {
      console.error('Error fetching development actions:', error);
      return [];
    }
  }

  async createDevelopmentAction(data: InsertDevelopmentAction): Promise<SelectDevelopmentAction> {
    const [action] = await db
      .insert(developmentActions)
      .values({
        ...data,
        updatedAt: new Date()
      })
      .returning();
    
    return action;
  }

  async updateDevelopmentAction(id: number, data: Partial<SelectDevelopmentAction>): Promise<SelectDevelopmentAction> {
    const [action] = await db
      .update(developmentActions)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(developmentActions.id, id))
      .returning();
    
    return action;
  }

  async deleteDevelopmentAction(id: number): Promise<void> {
    await db
      .delete(developmentActions)
      .where(eq(developmentActions.id, id));
  }

  // Error Logs methods
  async createErrorLog(errorLog: InsertErrorLog): Promise<SelectErrorLog> {
    const result = await db.insert(errorLogs).values(errorLog).returning();
    return result[0];
  }

  async getErrorLogs(limit: number = 100, offset: number = 0): Promise<SelectErrorLog[]> {
    return await db
      .select()
      .from(errorLogs)
      .orderBy(desc(errorLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getErrorLogsByUserId(userId: number): Promise<SelectErrorLog[]> {
    return await db
      .select()
      .from(errorLogs)
      .where(eq(errorLogs.userId, userId))
      .orderBy(desc(errorLogs.createdAt));
  }

  async getUnresolvedErrorLogs(): Promise<SelectErrorLog[]> {
    return await db
      .select()
      .from(errorLogs)
      .where(eq(errorLogs.resolved, false))
      .orderBy(desc(errorLogs.createdAt));
  }

  async resolveErrorLog(id: number, resolvedBy: number, resolutionNotes?: string): Promise<SelectErrorLog> {
    const result = await db
      .update(errorLogs)
      .set({
        resolved: true,
        resolvedBy,
        resolvedAt: new Date(),
        resolutionNotes,
      })
      .where(eq(errorLogs.id, id))
      .returning();
    return result[0];
  }

  async getErrorLogStats(): Promise<{
    total: number;
    unresolved: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  }> {
    const [totalResult, unresolvedResult, typeStats, severityStats] = await Promise.all([
      db.select({ count: count() }).from(errorLogs),
      db.select({ count: count() }).from(errorLogs).where(eq(errorLogs.resolved, false)),
      db
        .select({
          errorType: errorLogs.errorType,
          count: count(),
        })
        .from(errorLogs)
        .groupBy(errorLogs.errorType),
      db
        .select({
          severity: errorLogs.severity,
          count: count(),
        })
        .from(errorLogs)
        .groupBy(errorLogs.severity),
    ]);

    const byType: Record<string, number> = {};
    typeStats.forEach((stat) => {
      byType[stat.errorType] = Number(stat.count);
    });

    const bySeverity: Record<string, number> = {};
    severityStats.forEach((stat) => {
      bySeverity[stat.severity] = Number(stat.count);
    });

    return {
      total: Number(totalResult[0]?.count || 0),
      unresolved: Number(unresolvedResult[0]?.count || 0),
      byType,
      bySeverity,
    };
  }

  // Removed duplicate getUserVideos and getUserFeedbacks methods
  // Implementations exist earlier in the class
}

// Switch from MemStorage to DatabaseStorage
export const storage = new DatabaseStorage();
