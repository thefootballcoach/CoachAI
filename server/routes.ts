import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { setupStripeRoutes } from "./stripe";
import { insertVideoSchema, insertCustomFeedbackReportSchema, type User } from "@shared/schema";
import { cacheManager, userCache, videoCache, feedbackCache, clubCache } from "./cache-manager";

// Extend Express Request interface for TypeScript
declare module "express-serve-static-core" {
  interface Request {
    user?: User;
  }
}
import { processAudio } from "./video-processor";
import { uploadFileToS3, uploadBufferToS3, deleteFileFromS3, generateVideoKey, downloadFromS3 } from "./s3-service";
import { generateCoachingRecommendations, generatePracticeExercises } from "./coaching-recommendations";
import { emailService } from "./email-service";
import { hashPassword } from "./auth-utils";

const scryptAsync = promisify(scrypt);

// Configure directories for temporary file storage
const uploadsDir = path.join(process.cwd(), "uploads");
const audiosDir = path.join(uploadsDir, "audios");
const tempDir = path.join(uploadsDir, "temp");

// Ensure directories exist
[uploadsDir, audiosDir, tempDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure if we should use S3 storage
const useS3Storage = process.env.AWS_S3_BUCKET_NAME && 
                     process.env.AWS_ACCESS_KEY_ID && 
                     process.env.AWS_SECRET_ACCESS_KEY;

// Log storage configuration
console.log(`Audio storage configuration: ${useS3Storage ? 'Using AWS S3' : 'Using local storage'}`);

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // If using S3, we'll store files in temp directory first
    cb(null, useS3Storage ? tempDir : audiosDir);
  },
  filename: (req, file, cb) => {
    // Create a more organized filename with userId for added security
    const userId = req.user?.id || 'anonymous';
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1e9);
    const cleanOriginalName = path.basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9]/g, '_'); // Replace non-alphanumeric with underscore
    const ext = path.extname(file.originalname);
    
    // Format: userId_timestamp_randomSuffix_cleanOriginalName.ext
    const filename = `${userId}_${timestamp}_${randomSuffix}_${cleanOriginalName}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 6 * 1024 * 1024 * 1024, // 6GB max size for coaching videos
    fieldSize: 50 * 1024 * 1024, // 50MB field size - maximum for form data
    fieldNameSize: 10000, // 10KB field names
    fields: 100, // Maximum form fields supported
    files: 1, // Single file upload
    parts: 1000, // Support very complex forms
    headerPairs: 1000 // Support maximum headers
  },
  fileFilter: (req, file, cb) => {
    console.log("File filter check:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      fieldname: file.fieldname
    });
    
    const allowedTypes = [
      // Audio formats - comprehensive WAV support
      "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/wave", 
      "audio/vnd.wave", "audio/ogg", "audio/m4a", "audio/x-m4a", "audio/aac", 
      "audio/flac", "audio/webm",
      // Video formats
      "video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo", 
      "video/webm", "video/x-ms-wmv", "video/3gpp", "video/x-flv",
      // Additional MIME types that might be detected
      "application/octet-stream" // Allow binary files and check extension instead
    ];
    
    const fileExtension = file.originalname.toLowerCase().split('.').pop();
    const allowedExtensions = [
      'mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 
      'mp4', 'mov', 'avi', 'webm', 'wmv', '3gp', 'flv'
    ];
    
    console.log("File extension check:", fileExtension, "allowed:", allowedExtensions.includes(fileExtension || ''));
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension || '')) {
      console.log("File type validation passed");
      cb(null, true);
    } else {
      console.log("File type validation failed", { mimetype: file.mimetype, extension: fileExtension });
      cb(new Error("Invalid file type. Please upload audio (MP3, WAV, M4A, AAC, OGG, FLAC) or video (MP4, MOV, AVI, WebM, WMV) files.") as any);
    }
  },
});

// Separate multer configuration for image uploads
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for large images
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/tiff"
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Please upload JPEG, PNG, WebP, GIF, or TIFF images.") as any);
    }
  },
});

// Separate multer configuration for club chat attachments
const clubAttachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for club attachments
  },
  fileFilter: (req, file, cb) => {
    // Allow most common file types for club communication
    const allowedTypes = [
      // Images
      "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
      // Videos
      "video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo", 
      "video/webm", "video/x-ms-wmv", "video/3gpp", "video/x-flv",
      // Documents
      "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain", "text/csv",
      // Audio
      "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg", "audio/m4a"
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not supported for club attachments") as any);
    }
  }
});

// Middleware function to ensure user is authenticated
function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  console.log(`Auth check - isAuthenticated: ${req.isAuthenticated()}, path: ${req.path}`);
  if (req.isAuthenticated()) {
    console.log(`User authenticated: ${req.user?.username}, role: ${req.user?.role}`);
    return next();
  }
  
  // Log authentication failure for analysis
  import("./error-logger").then(({ errorLogger }) => {
    errorLogger.logAuthError(req, "Authentication required", {
      attemptedPath: req.path,
      userAgent: req.get('User-Agent'),
    });
  });
  
  res.status(401).json({ message: "Unauthorized" });
}

// Middleware to ensure admin has access to their club only
function ensureClubAccess(req: any, res: Response, next: NextFunction) {
  // Super admins can access any club data
  if (req.user?.role === 'super_admin') {
    return next();
  }
  
  // Regular admins must be associated with a club
  if (!req.user?.clubId) {
    return res.status(403).json({ error: "User not associated with a club" });
  }
  
  next();
}

// Middleware to ensure coach belongs to same club as admin
function ensureCoachInSameClub(req: any, res: Response, next: NextFunction) {
  // Super admins can access any coach data
  if (req.user?.role === 'super_admin') {
    return next();
  }
  
  // For admins, we'll validate coach club membership in the route handler
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for Railway deployment
  app.get('/api/health', (req, res) => {
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    });
  });

  // Setup authentication routes
  setupAuth(app);
  
  // Setup Stripe payment routes
  setupStripeRoutes(app);

  // User management routes (admin only)
  app.put("/api/users/:id", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { name, email, role, licenseLevel, position, ageGroup } = req.body;
      
      // Only admins can edit user details
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can edit user details" });
      }
      
      const updatedUser = await storage.updateUser(userId, {
        name,
        email,
        role,
        licenseLevel,
        position,
        ageGroup
      });
      
      res.json(updatedUser);
    } catch (error: any) {
      console.error("Error updating user:", error);
      
      // Log API error for super user review
      const { errorLogger } = await import("./error-logger");
      await errorLogger.logApiError(req, error, { userId: req.user?.id });
      
      res.status(500).json({ message: error.message });
    }
  });

  // Error Logs API routes (Super Admin only)
  app.get("/api/error-logs", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log(`Error logs access attempt - User role: ${req.user!.role}, Username: ${req.user!.username}`);
      
      // Allow access for super_admin role
      if (req.user!.role !== 'super_admin') {
        console.log(`Access denied for role: ${req.user!.role}`);
        return res.status(403).json({ message: "Access denied" });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const unresolved = req.query.unresolved === 'true';

      let errorLogs;
      if (unresolved) {
        errorLogs = await storage.getUnresolvedErrorLogs();
      } else {
        errorLogs = await storage.getErrorLogs(limit, offset);
      }

      console.log(`Returning ${errorLogs.length} error logs`);
      res.json(errorLogs);
    } catch (error: any) {
      console.error("Error fetching error logs:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/error-logs/stats", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      // Only super admins can view error stats
      if (req.user!.role !== 'super_admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const stats = await storage.getErrorLogStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching error log stats:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/error-logs/:id/resolve", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      // Only super admins can resolve errors
      if (req.user!.role !== 'super_admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const errorId = parseInt(req.params.id);
      const { resolutionNotes } = req.body;

      const resolvedError = await storage.resolveErrorLog(errorId, req.user!.id, resolutionNotes);
      res.json(resolvedError);
    } catch (error: any) {
      console.error("Error resolving error log:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Health check endpoint for deployment monitoring
  app.get("/api/health", (req: Request, res: Response) => {
    res.status(200).json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development"
    });
  });

  // Special middleware to detect 413 errors at Express level
  app.use('/api/audios/upload', (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    console.log(`[UPLOAD START] Content-Length: ${(contentLength / 1024 / 1024).toFixed(1)}MB, Content-Type: ${req.headers['content-type']?.substring(0, 50)}...`);
    
    let dataReceived = 0;
    let lastLogTime = Date.now();
    const startTime = Date.now();
    let lastProgressPercentage = 0;
    let has30PercentLogged = false;
    
    req.on('data', (chunk) => {
      dataReceived += chunk.length;
      const currentTime = Date.now();
      const progressPercentage = contentLength > 0 ? Math.round((dataReceived / contentLength) * 100) : 0;
      
      // Special logging at exactly 30%
      if (progressPercentage >= 30 && !has30PercentLogged) {
        has30PercentLogged = true;
        console.log(`[UPLOAD 30% DEBUG] === Hit 30% mark ===`);
        console.log(`[UPLOAD 30% DEBUG] Data received: ${(dataReceived / 1024 / 1024).toFixed(2)}MB of ${(contentLength / 1024 / 1024).toFixed(2)}MB`);
        console.log(`[UPLOAD 30% DEBUG] Time elapsed: ${((currentTime - startTime) / 1000).toFixed(1)}s`);
        console.log(`[UPLOAD 30% DEBUG] Current speed: ${((dataReceived / 1024 / 1024) / ((currentTime - startTime) / 1000)).toFixed(1)} MB/s`);
        console.log(`[UPLOAD 30% DEBUG] Socket state: ${req.socket?.readyState}, Headers sent: ${res.headersSent}`);
      }
      
      // Log every 10MB or every 5 seconds, whichever comes first
      if (dataReceived % (10 * 1024 * 1024) < chunk.length || currentTime - lastLogTime > 5000 || progressPercentage >= lastProgressPercentage + 10) {
        const elapsed = ((currentTime - startTime) / 1000).toFixed(1);
        const speed = ((dataReceived / 1024 / 1024) / (elapsed || 1)).toFixed(1);
        console.log(`[UPLOAD PROGRESS] ${progressPercentage}% - ${(dataReceived / 1024 / 1024).toFixed(1)}MB in ${elapsed}s (${speed} MB/s)`);
        lastLogTime = currentTime;
        lastProgressPercentage = Math.floor(progressPercentage / 10) * 10;
      }
    });
    
    req.on('end', () => {
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[UPLOAD COMPLETE] Request fully received: ${(dataReceived / 1024 / 1024).toFixed(1)}MB in ${totalTime}s`);
    });
    
    req.on('error', (err: any) => {
      console.error('[UPLOAD ERROR] Request error:', err);
      console.error(`[UPLOAD ERROR] Progress at error: ${(dataReceived / contentLength * 100).toFixed(1)}%`);
      if (err.code === 'LIMIT_FILE_SIZE' || err.message.includes('too large')) {
        return res.status(413).json({ 
          error: 'File too large',
          maxSize: '6GB',
          received: req.headers['content-length']
        });
      }
    });
    
    req.on('aborted', () => {
      const progressAtAbort = contentLength > 0 ? (dataReceived / contentLength * 100).toFixed(1) : 0;
      console.error(`[UPLOAD ABORTED] Request aborted by client at ${progressAtAbort}% (${(dataReceived / 1024 / 1024).toFixed(1)}MB)`);
    });
    
    // Add timeout handler for stalled uploads
    let lastDataTime = Date.now();
    const stalledCheckInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastData = now - lastDataTime;
      if (timeSinceLastData > 30000) {
        console.error(`[UPLOAD STALLED] No data for ${(timeSinceLastData / 1000).toFixed(0)}s at ${(dataReceived / contentLength * 100).toFixed(1)}%`);
        clearInterval(stalledCheckInterval);
        if (!res.headersSent) {
          res.status(408).json({ 
            error: 'Upload stalled',
            message: 'Data transfer stopped. Please check your connection.',
            progressAtStall: `${(dataReceived / contentLength * 100).toFixed(1)}%`,
            receivedMB: (dataReceived / 1024 / 1024).toFixed(1)
          });
        }
      }
    }, 5000);
    
    // Update last data time on each chunk
    req.on('data', () => {
      lastDataTime = Date.now();
    });
    
    // Cleanup interval on completion
    req.on('end', () => clearInterval(stalledCheckInterval));
    req.on('close', () => clearInterval(stalledCheckInterval));
    req.on('error', () => clearInterval(stalledCheckInterval));
    
    next();
  });

  // API routes
  // PDF Report generation route
  app.get("/api/audios/:id/report/pdf", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Get video and feedback data
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      // Check authorization (user owns video or is admin/super_admin)
      const isOwner = video.userId === userId;
      const isAdmin = req.user!.role === 'admin' || req.user!.role === 'super_admin';
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const feedback = await storage.getFeedbackByVideoId(videoId);
      if (!feedback || !feedback.multiAiAnalysis) {
        return res.status(404).json({ message: "Multi-AI analysis not found. Please run AI analysis first." });
      }
      
      // Prepare session data for PDF generation
      const { generatePDFReport } = await import('./pdf-report-generator');
      
      const sessionData = {
        title: video.title,
        date: new Date(video.createdAt).toLocaleDateString(),
        duration: video.duration || 0,
        overallScore: feedback.overallScore || 0,
        communicationScore: feedback.communicationScore || 0,
        engagementScore: feedback.engagementScore || 0,
        instructionScore: feedback.instructionScore || 0,
        coachName: video.coachName || req.user!.name || 'Coach',
        comprehensiveReport: (feedback.multiAiAnalysis as any).comprehensiveReport || {
          executiveSummary: "Multi-AI analysis completed successfully. Detailed insights available in the web interface.",
          detailedAnalysis: {
            communicationExcellence: { strengths: [], developmentAreas: [], claudeInsights: [], researchEvidence: [], practicalRecommendations: [] },
            technicalInstruction: { strengths: [], developmentAreas: [], claudeInsights: [], researchEvidence: [], practicalRecommendations: [] },
            playerEngagement: { strengths: [], developmentAreas: [], claudeInsights: [], researchEvidence: [], practicalRecommendations: [] },
            sessionManagement: { strengths: [], developmentAreas: [], claudeInsights: [], researchEvidence: [], practicalRecommendations: [] }
          },
          professionalDevelopmentPlan: { immediate: [], shortTerm: [], longTerm: [], researchResources: [] },
          benchmarkComparison: { industryStandards: "Professional coaching standards", professionalGrade: "Competent Level", improvementPotential: "Opportunities for targeted development" }
        }
      };
      
      // Generate PDF
      const pdfBuffer = await generatePDFReport(sessionData);
      
      // Set response headers for PDF download
      const filename = `coaching-report-${video.title.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);
      
    } catch (error) {
      console.error('PDF generation error:', error);
      res.status(500).json({ message: "Failed to generate PDF report", error: error.message });
    }
  });

  // Audio routes with bulletproof upload that ALWAYS saves to sessions
  app.post("/api/audios/upload", 
    ensureAuthenticated, 
    (req, res, next) => {
      console.log(`[UPLOAD] Starting upload for user ${req.user?.username}`);
      next();
    },
    (req, res, next) => {
      console.log("[UPLOAD] Pre-multer check - headers:", {
        contentLength: req.headers['content-length'],
        contentType: req.headers['content-type']
      });
      next();
    },
    upload.single("audio"), 
    (err: any, req: Request, res: Response, next: NextFunction) => {
      // Handle multer errors
      if (err) {
        console.error("[UPLOAD ERROR] Multer error:", err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ 
            message: 'File too large. Maximum size is 6GB.',
            error: err.message 
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({ 
            message: 'Unexpected field. Please use "audio" field name.',
            error: err.message 
          });
        }
        return res.status(500).json({ 
          message: 'Upload failed',
          error: err.message 
        });
      }
      next();
    },
    async (req: Request, res: Response) => {
    let video: any = null;
    
    try {
      const file = req.file;
      console.log("[UPLOAD] Checking file presence...", { hasFile: !!file, body: Object.keys(req.body) });
      
      if (!file) {
        console.error("[UPLOAD] No file in upload request - multer may have rejected it");
        console.error("[UPLOAD] Request details:", {
          headers: req.headers,
          body: req.body,
          files: req.files
        });
        return res.status(400).json({ message: "No audio or video file provided" });
      }

      console.log("File uploaded successfully:", {
        originalname: file.originalname,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path
      });

      // Extract minimal form data to reduce header size - support both short and long field names
      const sessionTitle = req.body.sessionTitle || req.body.t || "";
      const sessionDate = req.body.sessionDate || req.body.dt || "";
      const title = sessionTitle || req.body.title || file.originalname;
      const coachName = req.body.coachName || req.body.coach || req.body.c || "";
      const ageGroup = req.body.ageGroup || req.body.age || req.body.a || "";
      const intendedOutcomes = req.body.intendedOutcomes || req.body.outcomes || req.body.o || "";
      const sessionStrengths = req.body.sessionStrengths || req.body.strengths || req.body.s || "";
      const areasForDevelopment = req.body.areasForDevelopment || req.body.develop || req.body.d || "";
      const reflectionNotes = req.body.reflectionNotes || req.body.notes || req.body.n || "";
      const generateCalendarEvent = req.body.generateCalendarEvent === 'true' || req.body.cal === 'true' || false;
      const analysisType = req.body.analysisType || "training_session";
      
      console.log("Request body:", { 
        sessionTitle,
        sessionDate,
        title, 
        coachName,
        ageGroup,
        intendedOutcomes,
        sessionStrengths,
        areasForDevelopment,
        reflectionNotes,
        generateCalendarEvent,
        analysisType
      });
      
      // Validate data
      const audioData = insertVideoSchema.parse({
        userId: req.user!.id,
        title,
        description: "",
        filename: file.filename,
        filesize: file.size,
        coachName,
        ageGroup,
        intendedOutcomes,
        sessionStrengths,
        areasForDevelopment,
        reflectionNotes,
        sessionDate: sessionDate ? new Date(sessionDate) : null,
        generateCalendarEvent,
        analysisType
      });

      console.log("Audio data to be saved:", audioData);

      // CRITICAL: Save audio to database FIRST - this must always succeed
      video = await storage.createVideo(audioData);
      console.log("Audio saved to database with ID:", video.id);
      
      // Handle S3 upload if configured - non-blocking for session save
      if (useS3Storage) {
        try {
          console.log(`Uploading audio ${video.id} to S3 immediately...`);
          
          // For large files (>1GB), upload directly to S3 without temp storage
          const s3Key = `videos/user-${req.user!.id}/${file.filename}`;
          
          // Upload the file to S3 immediately
          const s3Url = await uploadFileToS3(
            file.path, 
            s3Key,
            (progress) => {
              console.log(`S3 upload progress for video ${video.id}: ${Math.round(progress)}%`);
            }
          );
          
          console.log(`Audio ${video.id} uploaded to S3 at ${s3Url}`);
          
          // Update the audio record with S3 information
          await storage.updateVideoS3Info(video.id, {
            s3Key,
            s3Url,
          });
          
          // Update status to uploaded after successful S3 transfer
          await storage.updateVideoStatus(video.id, "uploaded", 100);
          
          // Remove the local temp file after successful S3 upload
          fs.unlink(file.path, (err) => {
            if (err) {
              console.error(`Error removing temp file ${file.path}:`, err);
            } else {
              console.log(`Removed temp file ${file.path} after S3 upload`);
            }
          });
        } catch (s3Error: any) {
          console.error(`Error uploading audio ${video.id} to S3:`, s3Error);
          // Mark as uploaded but with S3 failure - file still exists locally
          await storage.updateVideoStatus(video.id, "uploaded", 100);
          console.log(`Video ${video.id} saved locally, S3 upload can be retried later`);
        }
      } else {
        // Local storage - mark as uploaded immediately
        await storage.updateVideoStatus(video.id, "uploaded", 100);
      }
      
      // Generate calendar event if requested
      let calendarEventData = null;
      if (generateCalendarEvent && sessionTitle && sessionDate) {
        try {
          const { CalendarService } = await import("./calendar-service");
          const calendarEvent = CalendarService.generateSessionReviewEvent({
            sessionTitle,
            sessionDate,
            coachName: coachName || req.user!.name || 'Coach',
            videoId: video.id
          });
          
          calendarEventData = {
            ...calendarEvent,
            googleCalendarUrl: CalendarService.generateGoogleCalendarUrl(calendarEvent),
            outlookCalendarUrl: CalendarService.generateOutlookCalendarUrl(calendarEvent),
            icalData: CalendarService.generateICalEvent(calendarEvent)
          };
          
          console.log(`Calendar event generated for video ${video.id}: ${calendarEvent.title}`);
        } catch (calendarError: any) {
          console.error(`Error generating calendar event for video ${video.id}:`, calendarError);
          // Don't fail upload if calendar generation fails
        }
      }

      // Add to processing queue for AI analysis (non-blocking)
      try {
        const { processingQueue } = await import("./processing-queue");
        processingQueue.add(video.id, 1);
        console.log(`Video ${video.id} added to AI processing queue`);
      } catch (queueError: any) {
        console.error(`Failed to add video ${video.id} to processing queue:`, queueError);
        // Don't fail the upload if queue addition fails - video is already saved
        // User can manually retry AI processing using "Run AI" button
        await storage.updateVideoStatus(video.id, "uploaded", 100);
        console.log(`Video ${video.id} saved successfully, AI processing can be retried manually`);
      }

      // ALWAYS return success if video was saved to database
      res.status(201).json({
        ...video,
        calendarEvent: calendarEventData
      });
      
    } catch (error: any) {
      console.error("Upload error:", error);
      
      // Log the error for super user review
      try {
        const { errorLogger } = await import("./error-logger");
        await errorLogger.logUploadError(req, error, {
          fileSize: req.headers['content-length'],
          fileName: req.file?.originalname,
          mimeType: req.file?.mimetype,
        });
      } catch (logError) {
        console.error("Error logging upload error:", logError);
      }
      
      // If video was successfully saved to database, still return success
      if (video && video.id) {
        console.log(`Video ${video.id} was saved despite error: ${error.message}`);
        
        // Ensure video is marked as uploaded
        try {
          await storage.updateVideoStatus(video.id, "uploaded", 100);
        } catch (statusError) {
          console.error("Error updating video status:", statusError);
        }
        
        // Return success response since video is saved
        return res.status(201).json({
          ...video,
          message: "Session saved successfully. Some additional processing may have failed but can be retried."
        });
      }
      
      // Only clean up uploaded file if video wasn't successfully saved to database
      if (req.file?.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error cleaning up file:", err);
        });
      }
      
      // Return error only if video couldn't be saved to database
      return res.status(500).json({ 
        error: "Upload failed", 
        message: error.message || "An error occurred during upload"
      });
    }
  });

  app.get("/api/audios", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log("Getting videos for user ID:", req.user!.id);
      const videos = await storage.getVideosByUserId(req.user!.id);
      console.log("Found videos:", videos.length);
      
      // Force no cache to ensure fresh data
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0',
        'ETag': `"${Date.now()}"`, // Unique ETag each time
      });
      
      res.json(videos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/audios/:id", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const video = await storage.getVideo(videoId);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      // Allow access if user owns the video OR if user is Head of Coaching/Admin in same club
      const isOwner = video.userId === req.user!.id;
      const isHeadCoachOrAdmin = req.user!.role === 'admin' || req.user!.role === 'head_coach';
      
      if (!isOwner && !isHeadCoachOrAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      res.json(video);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Stream audio/video files for playback
  app.get("/api/audios/:id/stream", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const video = await storage.getVideo(videoId);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      // Allow access if user owns the video OR if user is Head of Coaching/Admin in same club
      const isOwner = video.userId === req.user!.id;
      const isHeadCoachOrAdmin = req.user!.role === 'admin' || req.user!.role === 'head_coach';
      
      if (!isOwner && !isHeadCoachOrAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // If file is stored in S3, download and stream it
      if (video.s3Key && video.s3Url) {
        try {
          // Download file from S3 to local temp directory
          const tempDir = path.join(process.cwd(), 'uploads', 'temp');
          const tempFilePath = path.join(tempDir, `stream_${video.id}_${video.filename}`);
          
          // Check if temp file already exists
          if (!fs.existsSync(tempFilePath)) {
            console.log(`Downloading S3 file for streaming: ${video.s3Key}`);
            const downloadResult = await downloadFromS3(video.s3Key, tempFilePath);
            if (!downloadResult) {
              throw new Error("Failed to download from S3");
            }
          }
          
          // Stream the local temp file
          const stat = fs.statSync(tempFilePath);
          const fileSize = stat.size;
          const range = req.headers.range;

          if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 1024 * 1024, fileSize - 1); // 1MB chunks max
            const chunkSize = (end - start) + 1;
            
            const file = fs.createReadStream(tempFilePath, { start, end });
            const isVideoFile = video.filename.match(/\.(mp4|mov|avi|webm|wmv)$/i);
            const contentType = isVideoFile ? 'video/mp4' : 'audio/mpeg';
            
            console.log(`Streaming ${isVideoFile ? 'video' : 'audio'} file:`, {
              filename: video.filename,
              contentType,
              range: `${start}-${end}/${fileSize}`,
              chunkSize
            });
            
            const head = {
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': chunkSize,
              'Content-Type': contentType,
              'Cache-Control': 'no-cache',
              'Access-Control-Allow-Origin': req.headers.origin || 'http://localhost:5000',
              'Access-Control-Allow-Credentials': 'true',
              'Access-Control-Allow-Headers': 'Range',
            };
            
            res.writeHead(206, head);
            file.pipe(res);
          } else {
            const isVideoFile = video.filename.match(/\.(mp4|mov|avi|webm|wmv)$/i);
            const contentType = isVideoFile ? 'video/mp4' : 'audio/mpeg';
            
            const head = {
              'Content-Length': fileSize,
              'Content-Type': contentType,
              'Cache-Control': 'no-cache',
              'Access-Control-Allow-Origin': req.headers.origin || 'http://localhost:5000',
              'Access-Control-Allow-Credentials': 'true',
              'Access-Control-Allow-Headers': 'Range',
              'Accept-Ranges': 'bytes',
            };
            
            res.writeHead(200, head);
            fs.createReadStream(tempFilePath).pipe(res);
          }
          return;
        } catch (s3Error) {
          console.error("Error downloading from S3 for streaming:", s3Error);
          // Fall through to local file handling
        }
      }
      
      // For local files, stream the file
      const filePath = path.join(audiosDir, video.filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }

      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      // Support range requests for video streaming
      const isVideoFile = video.filename.match(/\.(mp4|mov|avi|webm|wmv)$/i);
      let contentType = 'video/mp4';
      
      if (!isVideoFile) {
        // Determine audio content type based on file extension
        if (video.filename.match(/\.mp3$/i)) {
          contentType = 'audio/mpeg';
        } else if (video.filename.match(/\.wav$/i)) {
          contentType = 'audio/wav';
        } else if (video.filename.match(/\.m4a$/i)) {
          contentType = 'audio/mp4';
        } else if (video.filename.match(/\.aac$/i)) {
          contentType = 'audio/aac';
        } else {
          contentType = 'audio/mpeg'; // default
        }
      }

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 1024 * 1024, fileSize - 1); // 1MB chunks max
        const chunkSize = (end - start) + 1;
        
        const file = fs.createReadStream(filePath, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': contentType,
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': req.headers.origin || 'http://localhost:5000',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Headers': 'Range',
        };
        
        console.log(`Streaming ${isVideoFile ? 'video' : 'audio'} file:`, {
          filename: video.filename,
          contentType,
          range: `${start}-${end}/${fileSize}`,
          chunkSize
        });
        
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': contentType,
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': req.headers.origin || 'http://localhost:5000',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Headers': 'Range',
          'Accept-Ranges': 'bytes',
        };
        
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
      }
    } catch (error: any) {
      console.error("Error streaming file:", error);
      res.status(500).json({ message: "Error streaming file" });
    }
  });

  app.delete("/api/audios/:id", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const video = await storage.getVideo(videoId);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      if (video.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Delete the file
      try {
        // Check if video is stored in S3
        if (video.s3Key && video.s3Url) {
          // Delete from S3
          console.log(`Deleting video from S3: ${video.s3Key}`);
          const deleted = await deleteFileFromS3(video.s3Key);
          if (deleted) {
            console.log(`Successfully deleted video from S3: ${video.s3Key}`);
          } else {
            console.error(`Failed to delete video from S3: ${video.s3Key}`);
          }
        } else {
          // Delete from local storage
          const filePath = path.join(audiosDir, video.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted local audio file: ${filePath}`);
          }
        }
      } catch (err) {
        console.error("Error deleting file:", err);
      }
      
      // Delete the video and its feedback from db
      await storage.deleteVideo(videoId);
      
      res.status(200).json({ message: "Video deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/audios/:id/status", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const video = await storage.getVideo(videoId);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      if (video.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Get queue status for this video
      const { processingQueue } = await import("./processing-queue");
      const queueStatus = processingQueue.getQueueStatus();
      const isInQueue = queueStatus.processingIds.includes(videoId);
      
      res.json({
        status: video.status,
        progress: video.processingProgress || 0,
        isInQueue,
        queuePosition: isInQueue ? -1 : queueStatus.queue
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Feedback routes
  // Queue status endpoint - Public endpoint for system monitoring
  app.get("/api/queue/status", async (req: Request, res: Response) => {
    try {
      const { processingQueue } = await import("./processing-queue");
      const queueStatus = processingQueue.getQueueStatus();
      
      res.json(queueStatus);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // API health monitoring endpoint
  app.get("/api/health/openai", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const { apiHealthMonitor } = await import("./api-health-monitor");
      res.json({
        status: apiHealthMonitor.getStatus(),
        summary: apiHealthMonitor.getHealthSummary(),
        canMakeRequest: apiHealthMonitor.canMakeRequest()
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Process video with research-based analysis when OpenAI quota exceeded
  app.post("/api/audios/:id/process-fallback", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const video = await storage.getVideo(videoId);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      if (video.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const { processVideoWithResearchAnalysis } = await import("./direct-fallback-analysis");
      await processVideoWithResearchAnalysis(videoId);
      
      res.json({ message: "Research-based analysis completed successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/feedbacks", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const cacheKey = `user-feedbacks-${req.user!.id}`;
      const feedbacks = await cacheManager.withCache(
        cacheKey,
        () => storage.getFeedbacksByUserId(req.user!.id),
        'feedback',
        3 * 60 * 1000 // 3 minutes cache
      );
      res.json(feedbacks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Admin-only database backend management routes
  app.get("/api/admin/database/videos", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      const videos = await storage.getAllVideos();
      res.json(videos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/database/users", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/database/feedbacks", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      const feedbacks = await storage.getAllFeedbacks();
      res.json(feedbacks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/database/transactions", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      const transactions = await storage.getAllCreditTransactions();
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/database/stats", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      const [users, videos, feedbacks, transactions] = await Promise.all([
        storage.getAllUsers(),
        storage.getAllVideos(),
        storage.getAllFeedbacks(),
        storage.getAllCreditTransactions()
      ]);

      const stats = {
        users: users.length,
        videos: videos.length,
        feedbacks: feedbacks.length,
        transactions: transactions.length,
        processing: videos.filter(v => v.status === 'processing').length,
        completed: videos.filter(v => v.status === 'completed').length,
        failed: videos.filter(v => v.status === 'failed').length,
        totalCreditsUsed: users.reduce((sum, u) => sum + (u.totalCreditsUsed || 0), 0),
        totalCreditsAvailable: users.reduce((sum, u) => sum + (u.credits || 0), 0)
      };

      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/database/user/:id/credits", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { amount, reason } = req.body;
      
      if (!amount || !reason) {
        return res.status(400).json({ message: "Amount and reason are required" });
      }

      const user = await storage.addUserCredits(userId, amount, reason);
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/database/video/:id", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      await storage.deleteVideo(videoId);
      res.json({ message: "Video deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/admin/database/feedback/:id", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      const feedbackId = parseInt(req.params.id);
      const updateData = req.body;
      const feedback = await storage.updateFeedback(feedbackId, updateData);
      res.json(feedback);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Multi-AI Analysis endpoint
  app.get("/api/feedback/:id/multi-ai", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const feedbackId = parseInt(req.params.id);
      const user = req.user as any;
      
      // Get feedback record
      const userFeedbacks = await storage.getUserFeedbacks(user.id);
      const feedback = userFeedbacks.find(f => f.id === feedbackId);
      
      if (!feedback) {
        return res.status(404).json({ message: "Feedback not found" });
      }

      // Check if multi-AI analysis exists
      if (feedback.multiAiAnalysis) {
        const multiAIData = JSON.parse(feedback.multiAiAnalysis as string);
        return res.json(multiAIData);
      }

      // If no multi-AI analysis, try to generate it for existing feedback
      if (feedback.transcript && feedback.videoId) {
        console.log(`Generating multi-AI analysis for feedback ${feedbackId}`);
        
        const { triggerMultiAIAnalysisForVideo } = await import('./multi-ai-processor');
        const multiAIResult = await triggerMultiAIAnalysisForVideo(feedback.videoId);
        
        return res.json(multiAIResult);
      }

      return res.status(404).json({ message: "Multi-AI analysis not available" });
      
    } catch (error: any) {
      console.error('Multi-AI analysis endpoint error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Trigger multi-AI analysis for existing video
  app.post("/api/videos/:id/multi-ai-analysis", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const user = req.user as any;
      
      // Check if user owns this video or is admin
      const video = await storage.getVideo(videoId);
      if (!video || (video.userId !== user.id && user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: "Access denied" });
      }

      console.log(`Triggering multi-AI analysis for video ${videoId}`);
      
      const { triggerMultiAIAnalysisForVideo } = await import('./multi-ai-processor');
      const multiAIResult = await triggerMultiAIAnalysisForVideo(videoId);
      
      res.json(multiAIResult);
      
    } catch (error: any) {
      console.error('Trigger multi-AI analysis error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/database/feedback/:id", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      const feedbackId = parseInt(req.params.id);
      
      // Get the feedback to find associated video
      const feedback = await storage.getFeedback(feedbackId);
      if (feedback) {
        // Delete the entire session (video and its feedback)
        await storage.deleteVideo(feedback.videoId);
      }
      
      res.json({ message: "Session deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin routes for getting all videos, feedbacks, and users (legacy compatibility)

  app.get("/api/audios/all", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      const videos = await storage.getAllVideos();
      res.json(videos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/feedbacks/all", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      const feedbacks = await storage.getAllFeedbacks();
      res.json(feedbacks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/users/all", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/users/:id/videos", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = req.user!;
      
      // Allow if viewing own data, or if admin/head of coaching/super admin
      if (user.id !== userId && 
          user.role !== 'admin' && 
          user.role !== 'super_admin' && 
          user.role !== 'head_of_coaching') {
        return res.status(403).json({ message: "Unauthorized to view this coach's data" });
      }
      
      const videos = await storage.getVideosByUserId(userId);
      res.json(videos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/users/:id/feedbacks", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = req.user!;
      
      // Allow if viewing own data, or if admin/head of coaching/super admin
      if (user.id !== userId && 
          user.role !== 'admin' && 
          user.role !== 'super_admin' && 
          user.role !== 'head_of_coaching') {
        return res.status(403).json({ message: "Unauthorized to view this coach's data" });
      }
      
      const feedbacks = await storage.getFeedbacksByUserId(userId);
      res.json(feedbacks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Coach invitation route - separate from registration to avoid session conflicts
  app.post("/api/club/invite-coach", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      // Only admins and head coaches can invite coaches
      if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'head_coach')) {
        return res.status(403).json({ error: "Only administrators and head coaches can invite coaches" });
      }

      const { confirmPassword, ...userData } = req.body;
      
      // Check if passwords match
      if (userData.password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords don't match" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Generate temporary password for coach invitation
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const hashedPassword = await hashPassword(tempPassword);
      
      // Assign new coaches to the admin's club
      let clubId = null;
      if (req.user.clubId) {
        clubId = req.user.clubId;
      }
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        emailVerificationToken: null,
        clubId: clubId,
        isEmailVerified: true, // Auto-verify admin-created accounts
      });

      // Send coach invitation email
      const inviterName = req.user.name || req.user.username;
      const clubInfo = req.user.clubId ? await storage.getClubInfo(req.user.clubId) : null;
      const clubName = clubInfo?.name || 'Your Club';
      
      const emailSent = await emailService.sendCoachInvitationEmail(
        user.email, 
        user.username, 
        tempPassword, 
        inviterName, 
        clubName
      );

      // Prepare response
      let message = "Coach account created successfully!";
      let invitationDetails = null;
      
      if (emailSent) {
        message = "Coach account created and invitation email sent successfully.";
      } else {
        // Provide temporary credentials when email fails
        invitationDetails = {
          username: user.username,
          tempPassword: tempPassword,
          loginUrl: `${process.env.CLIENT_URL || 'http://localhost:5000'}/auth`
        };
        message = "Coach account created successfully. Email delivery failed - please provide the coach with their login credentials manually.";
      }
      
      return res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        message,
        invitationDetails: emailSent ? null : invitationDetails
      });
      
    } catch (error: any) {
      console.error("Error inviting coach:", error);
      res.status(500).json({ error: "Failed to invite coach" });
    }
  });

  // Club management routes for coach sessions and feedback
  app.get("/api/club/coach-sessions/:coachId", ensureAuthenticated, ensureAdmin, ensureClubAccess, async (req: Request, res: Response) => {
    try {
      const coachId = parseInt(req.params.coachId);
      
      // For non-super-admin users, verify the coach belongs to their club
      if (req.user!.role !== 'super_admin') {
        const coach = await storage.getUser(coachId);
        if (!coach || coach.clubId !== req.user!.clubId) {
          return res.status(403).json({ error: "Access denied: Coach not in your club" });
        }
      }
      
      const sessions = await storage.getVideosByUserId(coachId);
      
      // Format sessions data for club dashboard
      const formattedSessions = sessions.map(session => ({
        id: session.id,
        title: session.title,
        createdAt: session.createdAt,
        duration: session.duration || "Unknown",
        status: session.status || "pending",
        overallScore: null // Score comes from feedback, not session
      }));
      
      res.json(formattedSessions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/club/coach-feedbacks/:coachId", ensureAuthenticated, ensureAdmin, ensureClubAccess, async (req: Request, res: Response) => {
    try {
      const coachId = parseInt(req.params.coachId);
      
      // For non-super-admin users, verify the coach belongs to their club
      if (req.user!.role !== 'super_admin') {
        const coach = await storage.getUser(coachId);
        if (!coach || coach.clubId !== req.user!.clubId) {
          return res.status(403).json({ error: "Access denied: Coach not in your club" });
        }
      }
      
      const feedbacks = await storage.getFeedbacksByUserId(coachId);
      const sessions = await storage.getVideosByUserId(coachId);
      
      // Format feedback data with session titles for club dashboard
      const formattedFeedbacks = feedbacks.map((feedback: any) => {
        const session = sessions.find(s => s.id === feedback.videoId);
        return {
          id: feedback.id,
          sessionTitle: session?.title || "Unknown Session",
          overallScore: feedback.overallScore,
          communicationScore: feedback.communicationScore,
          technicalScore: feedback.engagementScore || feedback.communicationScore,
          tacticalScore: feedback.instructionScore || feedback.communicationScore,
          leadershipScore: feedback.communicationScore,
          adaptabilityScore: feedback.engagementScore || feedback.communicationScore,
          motivationScore: feedback.instructionScore || feedback.communicationScore,
          sessionManagementScore: feedback.overallScore,
          keyInsights: feedback.summary || "No insights available",
          recommendations: feedback.feedback || "No recommendations available",
          createdAt: feedback.createdAt
        };
      });
      
      res.json(formattedFeedbacks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Club Statistics API Route
  app.get("/api/club/statistics", ensureAuthenticated, ensureAdmin, ensureClubAccess, async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const clubId = user.clubId;

      if (!clubId) {
        return res.status(400).json({ error: "User not associated with a club" });
      }

      // Get all club coaches
      const clubCoaches = await storage.getUsersByClubId(clubId);
      
      // Get all sessions and feedbacks for the club
      let allSessions: any[] = [];
      let allFeedbacks: any[] = [];
      
      for (const coach of clubCoaches) {
        const coachSessions = await storage.getVideosByUserId(coach.id);
        const coachFeedbacks = await storage.getFeedbacksByUserId(coach.id);
        
        allSessions.push(...coachSessions.map(s => ({ ...s, coachId: coach.id, coachName: coach.name || coach.username })));
        allFeedbacks.push(...coachFeedbacks.map((f: any) => ({ ...f, coachId: coach.id, coachName: coach.name || coach.username })));
      }

      // Calculate statistics
      const totalSessionsAnalysed = allFeedbacks.length;
      
      // Sessions in last 4 weeks
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      const sessionsLast4Weeks = allSessions.filter(s => 
        new Date(s.createdAt) >= fourWeeksAgo
      ).length;

      // Calculate average overall score
      const scoresWithValues = allFeedbacks.filter((f: any) => f.overallScore && f.overallScore > 0);
      const averageOverallScore = scoresWithValues.length > 0 
        ? Math.round(scoresWithValues.reduce((sum: number, f: any) => sum + f.overallScore, 0) / scoresWithValues.length)
        : 0;

      // Calculate trend (current month vs previous month)
      const currentMonth = new Date();
      const previousMonth = new Date();
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      
      const currentMonthFeedbacks = allFeedbacks.filter((f: any) => 
        new Date(f.createdAt).getMonth() === currentMonth.getMonth() &&
        new Date(f.createdAt).getFullYear() === currentMonth.getFullYear()
      );
      
      const previousMonthFeedbacks = allFeedbacks.filter((f: any) => 
        new Date(f.createdAt).getMonth() === previousMonth.getMonth() &&
        new Date(f.createdAt).getFullYear() === previousMonth.getFullYear()
      );

      const currentMonthAvg = currentMonthFeedbacks.length > 0 
        ? currentMonthFeedbacks.reduce((sum: number, f: any) => sum + (f.overallScore || 0), 0) / currentMonthFeedbacks.length
        : 0;
      
      const previousMonthAvg = previousMonthFeedbacks.length > 0 
        ? previousMonthFeedbacks.reduce((sum: number, f: any) => sum + (f.overallScore || 0), 0) / previousMonthFeedbacks.length
        : 0;

      const change = previousMonthAvg > 0 ? Math.round(((currentMonthAvg - previousMonthAvg) / previousMonthAvg) * 100) : 0;
      const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

      // Analyze common weaknesses
      const weaknessAreas = [
        'Communication Skills',
        'Technical Instruction', 
        'Player Engagement',
        'Session Management',
        'Questioning Technique',
        'Tactical Knowledge'
      ];

      const commonWeaknesses = weaknessAreas.map(area => {
        let count = 0;
        
        // Count coaches who score below 70 in related areas
        for (const coach of clubCoaches) {
          const coachFeedbacks = allFeedbacks.filter((f: any) => f.coachId === coach.id);
          if (coachFeedbacks.length > 0) {
            const avgScore = coachFeedbacks.reduce((sum: number, f: any) => {
              // Map areas to feedback scores
              let score = 0;
              switch (area) {
                case 'Communication Skills':
                  score = f.communicationScore || 0;
                  break;
                case 'Technical Instruction':
                  score = f.instructionScore || 0;
                  break;
                case 'Player Engagement':
                  score = f.engagementScore || 0;
                  break;
                case 'Session Management':
                case 'Questioning Technique':
                case 'Tactical Knowledge':
                  score = f.overallScore || 0;
                  break;
              }
              return sum + score;
            }, 0) / coachFeedbacks.length;
            
            if (avgScore < 70 && avgScore > 0) {
              count++;
            }
          }
        }
        
        const percentage = clubCoaches.length > 0 ? Math.round((count / clubCoaches.length) * 100) : 0;
        return { area, count, percentage };
      }).filter(w => w.count > 0).sort((a, b) => b.count - a.count);

      // Coach performance analysis
      const coachPerformance = clubCoaches.map(coach => {
        const coachFeedbacks = allFeedbacks.filter((f: any) => f.coachId === coach.id);
        const coachSessions = allSessions.filter(s => s.coachId === coach.id);
        
        if (coachFeedbacks.length === 0) {
          return {
            id: coach.id,
            name: coach.name || coach.username,
            averageScore: 0,
            sessionsAnalysed: 0,
            strengthArea: "No data available",
            weaknessArea: "No data available",
            recentTrend: 'stable' as const
          };
        }

        const avgScore = Math.round(
          coachFeedbacks.reduce((sum: number, f: any) => sum + (f.overallScore || 0), 0) / coachFeedbacks.length
        );

        // Determine strength and weakness areas
        const avgCommunication = coachFeedbacks.reduce((sum: number, f: any) => sum + (f.communicationScore || 0), 0) / coachFeedbacks.length;
        const avgInstruction = coachFeedbacks.reduce((sum: number, f: any) => sum + (f.instructionScore || 0), 0) / coachFeedbacks.length;
        const avgEngagement = coachFeedbacks.reduce((sum: number, f: any) => sum + (f.engagementScore || 0), 0) / coachFeedbacks.length;

        const scores = [
          { area: 'Communication Skills', score: avgCommunication },
          { area: 'Technical Instruction', score: avgInstruction },
          { area: 'Player Engagement', score: avgEngagement }
        ].filter(s => s.score > 0);

        const strengthArea = scores.length > 0 
          ? scores.reduce((prev, curr) => prev.score > curr.score ? prev : curr).area 
          : "Communication Skills";
        
        const weaknessArea = scores.length > 0 
          ? scores.reduce((prev, curr) => prev.score < curr.score ? prev : curr).area 
          : "Technical Instruction";

        // Calculate recent trend (last 3 sessions vs previous 3)
        const sortedFeedbacks = coachFeedbacks.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        let recentTrend: 'improving' | 'declining' | 'stable' = 'stable';
        if (sortedFeedbacks.length >= 6) {
          const recent3 = sortedFeedbacks.slice(0, 3);
          const previous3 = sortedFeedbacks.slice(3, 6);
          
          const recentAvg = recent3.reduce((sum: number, f: any) => sum + (f.overallScore || 0), 0) / 3;
          const previousAvg = previous3.reduce((sum: number, f: any) => sum + (f.overallScore || 0), 0) / 3;
          
          if (recentAvg > previousAvg + 2) recentTrend = 'improving';
          else if (recentAvg < previousAvg - 2) recentTrend = 'declining';
        }

        return {
          id: coach.id,
          name: coach.name || coach.username,
          averageScore: avgScore,
          sessionsAnalysed: coachFeedbacks.length,
          strengthArea,
          weaknessArea,
          recentTrend
        };
      }).filter(coach => coach.sessionsAnalysed > 0);

      // Monthly trends (last 6 months)
      const monthlyTrends = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        
        const monthFeedbacks = allFeedbacks.filter((f: any) => {
          const feedbackDate = new Date(f.createdAt);
          return feedbackDate.getMonth() === date.getMonth() && 
                 feedbackDate.getFullYear() === date.getFullYear();
        });

        const avgScore = monthFeedbacks.length > 0 
          ? Math.round(monthFeedbacks.reduce((sum: number, f: any) => sum + (f.overallScore || 0), 0) / monthFeedbacks.length)
          : 0;

        monthlyTrends.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          averageScore: avgScore,
          sessionCount: monthFeedbacks.length
        });
      }

      const statistics = {
        totalSessionsAnalysed,
        sessionsLast4Weeks,
        averageOverallScore,
        trendData: {
          currentMonth: Math.round(currentMonthAvg),
          previousMonth: Math.round(previousMonthAvg),
          change,
          direction
        },
        commonWeaknesses,
        coachPerformance,
        monthlyTrends
      };

      res.json(statistics);
    } catch (error: any) {
      console.error("Error fetching club statistics:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put("/api/user/profile", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const updates = req.body;
      // Convert string arrays to proper arrays for coaching badges and achievements
      if (updates.coachingBadges && typeof updates.coachingBadges === 'string') {
        updates.coachingBadges = updates.coachingBadges.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      if (updates.achievements && typeof updates.achievements === 'string') {
        updates.achievements = updates.achievements.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      const user = await storage.updateUser(req.user!.id, updates);
      res.json(user);
    } catch (error: any) {
      console.error("Profile update error:", error);
      res.status(400).json({ message: error.message });
    }
  });



  app.get("/api/users/:id/progress", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = req.user!;
      
      // Allow if viewing own data, or if admin/head of coaching/super admin
      if (user.id !== userId && 
          user.role !== 'admin' && 
          user.role !== 'super_admin' && 
          user.role !== 'head_of_coaching') {
        return res.status(403).json({ message: "Unauthorized to view this coach's data" });
      }
      
      const progress = await storage.getProgressByUserId(userId);
      if (!progress) {
        return res.status(404).json({ message: "Progress not found for this user" });
      }
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  


  app.get("/api/audios/:id/feedback", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const video = await storage.getVideo(videoId);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      // Allow access if user owns the video OR if user is Head of Coaching/Admin in same club
      const isOwner = video.userId === req.user!.id;
      const isHeadCoachOrAdmin = req.user!.role === 'admin' || req.user!.role === 'head_coach';
      
      if (!isOwner && !isHeadCoachOrAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const feedback = await storage.getFeedbackByVideoId(videoId);
      
      if (!feedback) {
        return res.status(404).json({ message: "Feedback not found" });
      }
      
      // Parse JSON string fields back to objects for frontend consumption
      const safeJsonParse = (field: any) => {
        if (!field) return null;
        if (typeof field === 'string') {
          try {
            return JSON.parse(field);
          } catch (e) {
            console.error('JSON parse error for field:', e);
            return null;
          }
        }
        return field;
      };
      
      const parsedFeedback = {
        ...feedback,
        keyInfo: safeJsonParse(feedback.keyInfo),
        questioning: safeJsonParse(feedback.questioning),
        language: safeJsonParse(feedback.language),
        coachBehaviours: safeJsonParse(feedback.coachBehaviours),
        playerEngagement: safeJsonParse(feedback.playerEngagement),
        intendedOutcomes: safeJsonParse(feedback.intendedOutcomes),
        visualAnalysis: safeJsonParse(feedback.visualAnalysis)
      };
      
      res.json(parsedFeedback);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/audios/:id/analyze", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const video = await storage.getVideo(videoId);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      // Allow admins and super_admins to analyze any video, but regular users can only analyze their own
      if (video.userId !== req.user!.id && req.user!.role !== 'admin' && req.user!.role !== 'super_admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Allow admins and super_admins to re-analyze any video (including completed ones), regular users can only analyze uploaded/failed videos
      if (req.user!.role !== 'admin' && req.user!.role !== 'super_admin' && video.status !== "uploaded" && video.status !== "failed") {
        return res.status(400).json({ message: `Video is already ${video.status}` });
      }
      
      // AI analysis is free for coaching development - no credit checking required
      
      // Start processing the audio
      await storage.updateVideoStatus(videoId, "processing", 0);
      
      // Add to processing queue with high priority for manual analysis requests
      const { processingQueue } = await import("./processing-queue");
      processingQueue.add(videoId, 2);
      
      res.status(202).json({ success: true, message: "Processing started" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/audios/:id/stop-analysis", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const video = await storage.getVideo(videoId);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      // Allow users to stop analysis for their own videos, admins can stop any
      if (video.userId !== req.user!.id && req.user!.role !== 'admin' && req.user!.role !== 'super_admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Only allow stopping if video is currently processing
      if (video.status !== "processing") {
        return res.status(400).json({ message: "Video is not currently being processed" });
      }
      
      // Remove from processing queue
      const { processingQueue } = await import("./processing-queue");
      processingQueue.remove(videoId);
      
      // Update video status to uploaded so it can be restarted later
      await storage.updateVideoStatus(videoId, "uploaded", 0);
      
      res.json({ success: true, message: "Analysis stopped successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Progress routes
  // Add self-reflection to a coaching session
  app.post("/api/audios/:id/reflection", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // Retrieve the video to confirm it exists and belongs to the user
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ error: "Audio not found" });
      }
      
      if (video.userId !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Validate the reflection data
      const { 
        sessionTitle,
        sessionDate,
        coachName, 
        ageGroup, 
        intendedOutcomes, 
        sessionStrengths, 
        areasForDevelopment, 
        notes,
        generateCalendarEvent
      } = req.body;
      
      if (!sessionTitle || !sessionDate || !coachName || !ageGroup || !intendedOutcomes || !sessionStrengths || !areasForDevelopment) {
        return res.status(400).json({ error: "Missing required reflection fields" });
      }
      
      // Update the video with reflection data
      const updatedVideo = await storage.updateVideo(videoId, {
        title: sessionTitle, // Update video title with session title
        coachName,
        ageGroup,
        intendedOutcomes,
        sessionStrengths,
        areasForDevelopment,
        reflectionNotes: notes || "",
        sessionDate: new Date(sessionDate),
        generateCalendarEvent: generateCalendarEvent || false
      });
      
      res.status(200).json(updatedVideo);
    } catch (error) {
      console.error("Error saving reflection:", error);
      res.status(500).json({ error: "An error occurred while saving the reflection" });
    }
  });

  // AI Coaching Recommendations API endpoints
  app.get("/api/audios/:id/recommendations", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const video = await storage.getVideo(videoId);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      // Check user permissions
      if (video.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Get feedback data for recommendations
      const feedback = await storage.getFeedbackByVideoId(videoId);
      
      if (!feedback) {
        return res.status(404).json({ message: "No feedback available for this session" });
      }
      
      // Determine if this was a video analysis (multimodal)
      const isVideoFile = video.filename && ['.mp4', '.mov', '.avi', '.webm', '.wmv', '.mpeg', '.3gp', '.flv'].some(ext => 
        video.filename.toLowerCase().endsWith(ext)
      );
      
      // Generate personalized coaching recommendations
      const recommendations = await generateCoachingRecommendations(feedback, !!isVideoFile);
      
      res.json({
        videoId,
        analysisType: isVideoFile ? 'multimodal' : 'audio-only',
        recommendations,
        generatedAt: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ message: "Error generating coaching recommendations" });
    }
  });

  app.post("/api/coaching/practice-exercises", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const { weakAreas, isVideoAnalysis = false } = req.body;
      
      if (!Array.isArray(weakAreas) || weakAreas.length === 0) {
        return res.status(400).json({ message: "Please provide areas for improvement" });
      }
      
      const exercises = generatePracticeExercises(weakAreas, isVideoAnalysis);
      
      res.json({
        exercises,
        analysisType: isVideoAnalysis ? 'multimodal' : 'audio-only',
        focusAreas: weakAreas,
        generatedAt: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error("Error generating practice exercises:", error);
      res.status(500).json({ message: "Error generating practice exercises" });
    }
  });

  app.get("/api/progress", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      let progress = await storage.getProgressByUserId(req.user!.id);
      
      if (!progress) {
        // Create default progress if not exists
        progress = await storage.createProgress({
          userId: req.user!.id,
          communicationScoreAvg: 0,
          engagementScoreAvg: 0,
          instructionScoreAvg: 0,
          overallScoreAvg: 0,
          sessionsCount: 0,
          weeklyImprovement: 0,
        });
      }
      
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Custom Feedback Reports API (for Heads of Coaching and Admins)
  
  // Check role permissions for creating custom reports
  function canCreateCustomReports(user: User): boolean {
    return user.role === 'admin' || user.role === 'club_admin' || user.position === 'head_coach';
  }
  
  // Get all custom feedback reports authored by the current user
  app.get("/api/custom-feedback-reports", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!canCreateCustomReports(req.user!)) {
        return res.status(403).json({ error: "Insufficient permissions to access custom feedback reports" });
      }

      const reports = await storage.getCustomFeedbackReportsByAuthor(req.user!.id);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching custom feedback reports:", error);
      res.status(500).json({ error: "Failed to fetch custom feedback reports" });
    }
  });

  // Get custom feedback reports for a specific coach
  app.get("/api/custom-feedback-reports/coach/:coachId", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!canCreateCustomReports(req.user!)) {
        return res.status(403).json({ error: "Insufficient permissions to access custom feedback reports" });
      }

      const coachId = parseInt(req.params.coachId);
      const reports = await storage.getCustomFeedbackReportsByCoach(coachId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching coach feedback reports:", error);
      res.status(500).json({ error: "Failed to fetch coach feedback reports" });
    }
  });

  // Get a specific custom feedback report
  app.get("/api/custom-feedback-reports/:id", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const reportId = parseInt(req.params.id);
      const report = await storage.getCustomFeedbackReport(reportId);
      
      if (!report) {
        return res.status(404).json({ error: "Feedback report not found" });
      }

      // Check permissions: report author, the coach being reviewed, or admin
      if (report.authorId !== req.user!.id && 
          report.coachId !== req.user!.id && 
          req.user!.role !== 'admin') {
        return res.status(403).json({ error: "Insufficient permissions to view this report" });
      }

      res.json(report);
    } catch (error) {
      console.error("Error fetching custom feedback report:", error);
      res.status(500).json({ error: "Failed to fetch feedback report" });
    }
  });

  // Create a new custom feedback report
  app.post("/api/custom-feedback-reports", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!canCreateCustomReports(req.user!)) {
        return res.status(403).json({ error: "Insufficient permissions to create custom feedback reports" });
      }

      const validatedData = insertCustomFeedbackReportSchema.parse({
        ...req.body,
        authorId: req.user!.id
      });

      const newReport = await storage.createCustomFeedbackReport(validatedData);
      res.status(201).json(newReport);
    } catch (error) {
      console.error("Error creating custom feedback report:", error);
      res.status(500).json({ error: "Failed to create custom feedback report" });
    }
  });

  // Update a custom feedback report
  app.put("/api/custom-feedback-reports/:id", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const reportId = parseInt(req.params.id);
      const report = await storage.getCustomFeedbackReport(reportId);
      
      if (!report) {
        return res.status(404).json({ error: "Feedback report not found" });
      }

      // Only the author or admin can update the report
      if (report.authorId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ error: "Insufficient permissions to update this report" });
      }

      const updatedReport = await storage.updateCustomFeedbackReport(reportId, req.body);
      res.json(updatedReport);
    } catch (error) {
      console.error("Error updating custom feedback report:", error);
      res.status(500).json({ error: "Failed to update feedback report" });
    }
  });

  // Add coach response to a feedback report
  app.put("/api/custom-feedback-reports/:id/response", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const reportId = parseInt(req.params.id);
      const { response } = req.body;
      
      if (!response || typeof response !== 'string') {
        return res.status(400).json({ error: "Response text is required" });
      }

      const report = await storage.getCustomFeedbackReport(reportId);
      
      if (!report) {
        return res.status(404).json({ error: "Feedback report not found" });
      }

      // Only the coach being reviewed can add a response
      if (report.coachId !== req.user!.id) {
        return res.status(403).json({ error: "Only the coach being reviewed can respond to this report" });
      }

      const updatedReport = await storage.updateCustomFeedbackReport(reportId, {
        coachResponse: response,
        coachResponseDate: new Date()
      });
      
      res.json(updatedReport);
    } catch (error) {
      console.error("Error adding coach response:", error);
      res.status(500).json({ error: "Failed to add coach response" });
    }
  });

  // Delete a custom feedback report
  app.delete("/api/custom-feedback-reports/:id", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const reportId = parseInt(req.params.id);
      const report = await storage.getCustomFeedbackReport(reportId);
      
      if (!report) {
        return res.status(404).json({ error: "Feedback report not found" });
      }

      // Only the author or admin can delete the report
      if (report.authorId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ error: "Insufficient permissions to delete this report" });
      }

      await storage.deleteCustomFeedbackReport(reportId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting custom feedback report:", error);
      res.status(500).json({ error: "Failed to delete feedback report" });
    }
  });

  // Get available coaches for creating custom reports
  app.get("/api/custom-feedback-reports/coaches/available", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!canCreateCustomReports(req.user!)) {
        return res.status(403).json({ error: "Insufficient permissions to access coach list" });
      }

      const coaches = await storage.getCoachesForCustomReports(req.user!.id);
      res.json(coaches);
    } catch (error) {
      console.error("Error fetching available coaches:", error);
      res.status(500).json({ error: "Failed to fetch available coaches" });
    }
  });

  // User Invitation System (for Admins and Heads of Coaching)
  app.post("/api/users/invite", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      // Check permissions - admins, club_admins, and super_admins can invite users
      console.log("User role for invitation check:", req.user!.role);
      if (req.user!.role !== 'admin' && req.user!.role !== 'club_admin' && req.user!.role !== 'super_admin') {
        return res.status(403).json({ error: "Insufficient permissions to invite users" });
      }

      const { name, email, role, position, ageGroup, licenseLevel } = req.body;

      if (!name || !email || !role) {
        return res.status(400).json({ error: "Name, email, and role are required" });
      }

      // Check if user already exists (with retry logic for rate limiting)
      let existingUser;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          existingUser = await storage.getUserByEmail(email);
          break;
        } catch (error: any) {
          retryCount++;
          if (error.message?.includes('rate limit') && retryCount < maxRetries) {
            console.log(`Rate limit hit, retrying in ${retryCount * 2} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryCount * 2000));
            continue;
          }
          throw error;
        }
      }
      
      if (existingUser && existingUser.isActive) {
        return res.status(400).json({ error: "User with this email already exists" });
      }
      
      // If user exists but is inactive (pending invitation), delete the old invitation
      if (existingUser && !existingUser.isActive) {
        await storage.deleteUser(existingUser.id);
      }

      // Generate invitation token
      const invitationToken = emailService.generateToken();
      const invitationExpires = new Date();
      invitationExpires.setDate(invitationExpires.getDate() + 7); // 7 days from now

      // Get inviter's club information with retry logic
      let inviter, club;
      retryCount = 0;
      
      while (retryCount < maxRetries) {
        try {
          inviter = await storage.getUser(req.user!.id);
          club = inviter?.clubId ? await storage.getClub(inviter.clubId) : null;
          break;
        } catch (error: any) {
          retryCount++;
          if (error.message?.includes('rate limit') && retryCount < maxRetries) {
            console.log(`Rate limit hit during inviter lookup, retrying in ${retryCount * 2} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryCount * 2000));
            continue;
          }
          throw error;
        }
      }

      // Create user invitation with retry logic
      let invitedUser;
      retryCount = 0;
      
      while (retryCount < maxRetries) {
        try {
          invitedUser = await storage.createUserInvitation({
            name,
            email,
            role,
            position: position || null,
            ageGroup: ageGroup || null,
            licenseLevel: licenseLevel || null,
            clubId: inviter?.clubId || null,
            invitationToken,
            invitationExpires
          });
          break;
        } catch (error: any) {
          retryCount++;
          if (error.message?.includes('rate limit') && retryCount < maxRetries) {
            console.log(`Rate limit hit during user creation, retrying in ${retryCount * 2} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryCount * 2000));
            continue;
          }
          throw error;
        }
      }

      // Send invitation email
      const emailSent = await emailService.sendUserInvitationEmail(
        email,
        invitationToken,
        inviter?.name || req.user!.username,
        club?.name || "Your Organization",
        role
      );

      res.status(201).json({
        message: "User invitation sent successfully",
        user: {
          id: invitedUser.id,
          name: invitedUser.name,
          email: invitedUser.email,
          role: invitedUser.role,
          emailSent
        }
      });

    } catch (error: any) {
      console.error("Error creating user invitation:", error);
      
      if (error.message?.includes('rate limit')) {
        return res.status(429).json({ 
          error: "Database rate limit exceeded. Please wait a moment and try again.",
          message: "You've exceeded the rate limit. Please wait a moment and try again."
        });
      }
      
      if (error.message?.includes('already exists')) {
        return res.status(400).json({ error: "User with this email already exists" });
      }
      
      res.status(500).json({ error: "Failed to create user invitation" });
    }
  });

  // Resend invitation to pending user
  app.post("/api/users/resend-invite", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      // Check permissions
      if (req.user!.role !== 'admin' && req.user!.role !== 'club_admin' && req.user!.role !== 'super_admin') {
        return res.status(403).json({ error: "Insufficient permissions to resend invitations" });
      }

      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Find the pending user
      const pendingUser = await storage.getUserByEmail(email);
      if (!pendingUser) {
        return res.status(404).json({ error: "No invitation found for this email address" });
      }

      if (pendingUser.isActive) {
        return res.status(400).json({ error: "User is already active" });
      }

      if (!pendingUser.invitationToken || !pendingUser.invitationExpires) {
        return res.status(400).json({ error: "Invalid invitation data" });
      }

      // Generate new invitation token and extend expiry
      const newInvitationToken = emailService.generateToken();
      const newInvitationExpires = new Date();
      newInvitationExpires.setDate(newInvitationExpires.getDate() + 7); // 7 days from now

      // Update the user with new token and expiry
      await storage.updateUser(pendingUser.id, {
        invitationToken: newInvitationToken,
        invitationExpires: newInvitationExpires
      });

      // Get inviter's club information
      const inviter = await storage.getUser(req.user!.id);
      const club = inviter?.clubId ? await storage.getClub(inviter.clubId) : null;

      // Resend invitation email
      const emailSent = await emailService.sendUserInvitationEmail(
        email,
        newInvitationToken,
        inviter?.name || req.user!.username,
        club?.name || "Your Organization",
        pendingUser.role
      );

      res.json({
        message: "Invitation resent successfully",
        emailSent,
        expiresAt: newInvitationExpires
      });

    } catch (error: any) {
      console.error("Error resending invitation:", error);
      res.status(500).json({ error: "Failed to resend invitation" });
    }
  });

  // Get pending invitations for admin
  app.get("/api/users/pending-invitations", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      // Check permissions
      if (req.user!.role !== 'admin' && req.user!.role !== 'club_admin' && req.user!.role !== 'super_admin') {
        return res.status(403).json({ error: "Insufficient permissions to view pending invitations" });
      }

      const pendingUsers = await storage.getPendingInvitations(req.user!.clubId);
      
      // Remove sensitive data
      const sanitizedUsers = pendingUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        position: user.position,
        ageGroup: user.ageGroup,
        licenseLevel: user.licenseLevel,
        invitationExpires: user.invitationExpires,
        createdAt: user.createdAt
      }));

      res.json(sanitizedUsers);
    } catch (error: any) {
      console.error("Error fetching pending invitations:", error);
      res.status(500).json({ error: "Failed to fetch pending invitations" });
    }
  });

  // Get invitation details by token
  app.get("/api/invitation/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const user = await storage.getUserByInvitationToken(token);
      
      if (!user) {
        return res.status(404).json({ error: "Invalid or expired invitation token" });
      }

      res.json({
        name: user.name,
        email: user.email,
        role: user.role,
        valid: true
      });
    } catch (error) {
      console.error("Error fetching invitation:", error);
      res.status(500).json({ error: "Failed to fetch invitation details" });
    }
  });

  // Complete user invitation (set password and activate account)
  app.post("/api/complete-invitation", async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ error: "Token and password are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }

      const updatedUser = await storage.completeUserInvitation(token, password);

      res.json({
        message: "Account activated successfully",
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role
        }
      });
    } catch (error) {
      console.error("Error completing invitation:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to complete invitation" 
      });
    }
  });

  // Content Management Routes
  // Get all content pages (admin only)
  app.get("/api/content", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      const contentPages = await storage.getAllContentPages();
      res.json(contentPages);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get published content pages for public viewing
  app.get("/api/content/published", async (req: Request, res: Response) => {
    try {
      const allPages = await storage.getAllContentPages();
      const publishedPages = allPages.filter(page => page.isPublished);
      res.json(publishedPages);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get a specific content page by ID (admin only)
  app.get("/api/content/:id", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      const pageId = parseInt(req.params.id);
      const page = await storage.getContentPage(pageId);
      
      if (!page) {
        return res.status(404).json({ message: "Content page not found" });
      }
      
      res.json(page);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get a specific content page by slug (for public viewing if published)
  app.get("/api/content/slug/:slug", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const page = await storage.getContentPageBySlug(slug);
      
      if (!page) {
        return res.status(404).json({ message: "Content page not found" });
      }
      
      // If not published, only admins can view
      if (!page.isPublished && (!req.isAuthenticated() || req.user!.role !== 'admin')) {
        return res.status(403).json({ message: "This content is not published yet" });
      }
      
      res.json(page);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create a new content page (admin only)
  app.post("/api/content", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      const { title, slug, content, isPublished } = req.body;
      
      // Validate required fields
      if (!title || !slug || !content) {
        return res.status(400).json({ message: "Title, slug, and content are required" });
      }
      
      // Check if slug already exists
      const existingPage = await storage.getContentPageBySlug(slug);
      if (existingPage) {
        return res.status(400).json({ message: "A page with this slug already exists" });
      }
      
      const page = await storage.createContentPage({
        title,
        slug,
        content,
        isPublished: isPublished === true,
        lastModified: new Date()
      });
      
      res.status(201).json(page);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update a content page (admin only)
  app.patch("/api/content/:id", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      const pageId = parseInt(req.params.id);
      const { title, slug, content, isPublished } = req.body;
      
      // Check if page exists
      const page = await storage.getContentPage(pageId);
      if (!page) {
        return res.status(404).json({ message: "Content page not found" });
      }
      
      // If updating slug, check if new slug already exists on another page
      if (slug && slug !== page.slug) {
        const existingPage = await storage.getContentPageBySlug(slug);
        if (existingPage && existingPage.id !== pageId) {
          return res.status(400).json({ message: "A page with this slug already exists" });
        }
      }
      
      const updatedPage = await storage.updateContentPage(pageId, {
        ...(title && { title }),
        ...(slug && { slug }),
        ...(content && { content }),
        ...(isPublished !== undefined && { isPublished }),
        lastModified: new Date()
      });
      
      res.json(updatedPage);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Delete a content page (admin only)
  app.delete("/api/content/:id", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      const pageId = parseInt(req.params.id);
      
      // Check if page exists
      const page = await storage.getContentPage(pageId);
      if (!page) {
        return res.status(404).json({ message: "Content page not found" });
      }
      
      await storage.deleteContentPage(pageId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Credit Management Routes
  // Get all credit transactions (admin only)
  app.get("/api/credits/transactions", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      const transactions = await storage.getAllCreditTransactions();
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get credit transactions for a specific user (admin only)
  app.get("/api/users/:id/credits/transactions", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const transactions = await storage.getCreditTransactionsByUserId(userId);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get current user's own credit transactions
  app.get("/api/user/credits/transactions", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const transactions = await storage.getCreditTransactionsByUserId(req.user!.id);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Add credits to a user (admin only)
  app.post("/api/users/:id/credits/add", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { amount, reason } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Amount must be a positive number" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.addUserCredits(userId, amount, reason || "Admin credit adjustment");
      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Deduct credits from a user (admin only)
  app.post("/api/users/:id/credits/deduct", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { amount, reason } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Amount must be a positive number" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      try {
        const updatedUser = await storage.useUserCredits(userId, amount, reason || "Admin credit adjustment");
        res.json(updatedUser);
      } catch (error: any) {
        // Handle the case where user doesn't have enough credits
        if (error.message === 'Insufficient credits') {
          return res.status(400).json({ message: error.message });
        }
        throw error;
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Site Settings Routes
  // Get all settings (admin only)
  app.get("/api/settings", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      const settings = await storage.getAllSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get public settings for client display
  app.get("/api/settings/public", async (req: Request, res: Response) => {
    try {
      const allSettings = await storage.getAllSettings();
      
      // Filter to only include public settings (exclude sensitive settings)
      const publicSettings = allSettings.filter(setting => {
        const publicKeys = [
          'siteName', 'tagline', 'description', 'contactEmail',
          'enableRegistration', 'maintenanceMode', 'defaultPricingTier'
        ];
        return publicKeys.includes(setting.key);
      });
      
      res.json(publicSettings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get a specific setting by key
  app.get("/api/settings/:key", async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const value = await storage.getSetting(key);
      
      if (value === null) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      // Check if this is a sensitive setting that requires admin access
      const sensitiveKeys = ['apiKeys', 'secretKeys', 'adminEmail'];
      if (sensitiveKeys.includes(key) && (!req.isAuthenticated() || req.user!.role !== 'admin')) {
        return res.status(403).json({ message: "Access denied to this setting" });
      }
      
      res.json({ key, value });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update a setting (admin only)
  app.put("/api/settings/:key", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      
      if (value === undefined) {
        return res.status(400).json({ message: "Value is required" });
      }
      
      const setting = await storage.updateSetting(key, String(value));
      res.json(setting);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Club Management API Routes
  app.get("/api/club/stats", ensureAuthenticated, ensureAdmin, ensureClubAccess, async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user.clubId) {
        return res.status(400).json({ error: "User not associated with a club" });
      }

      const clubId = req.user.clubId;
      
      // Get real stats from database
      const totalCoaches = await storage.getClubCoachCount(clubId);
      const totalTeams = await storage.getClubTeamCount(clubId);
      const totalPlayers = await storage.getClubPlayerCount(clubId);
      const totalSessions = await storage.getClubSessionCount(clubId);
      const avgCoachingScore = await storage.getClubAvgCoachingScore(clubId);
      
      const stats = {
        totalCoaches,
        totalTeams,
        totalPlayers,
        totalSessions,
        avgCoachingScore,
        activeSeasonProgress: 0, // Will be calculated when seasons are implemented
        topPerformingTeam: null, // Will be calculated when performance metrics are implemented
        recentActivity: 0 // Will be calculated based on recent sessions
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching club stats:", error);
      res.status(500).json({ error: "Failed to fetch club statistics" });
    }
  });

  app.get("/api/club/coaches/performance", ensureAuthenticated, ensureAdmin, ensureClubAccess, async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user.clubId) {
        return res.status(400).json({ error: "User not associated with a club" });
      }

      const clubId = req.user.clubId;
      const coachPerformance = await storage.getClubCoachesPerformance(clubId);

      res.json(coachPerformance);
    } catch (error) {
      console.error("Error fetching coach performance:", error);
      res.status(500).json({ error: "Failed to fetch coach performance data" });
    }
  });

  // Delete coach (admin and heads of coaching only)
  app.delete("/api/club/coaches/:coachId", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      const coachId = parseInt(req.params.coachId);
      
      if (isNaN(coachId)) {
        return res.status(400).json({ error: "Invalid coach ID" });
      }

      if (!req.user || !req.user.clubId) {
        return res.status(400).json({ error: "User not associated with a club" });
      }

      // Check if user has proper permissions (admin, club_admin, or head_coach)
      const user = req.user as User;
      if (user.role !== 'admin' && user.role !== 'club_admin' && user.position !== 'head_coach' && user.role !== 'super_admin') {
        return res.status(403).json({ error: "Insufficient permissions to delete coaches" });
      }

      // Get the coach to verify they belong to the same club
      const coach = await storage.getUser(coachId);
      if (!coach) {
        return res.status(404).json({ error: "Coach not found" });
      }

      // Verify the coach belongs to the same club (unless super admin)
      if (user.role !== 'super_admin' && coach.clubId !== user.clubId) {
        return res.status(403).json({ error: "Cannot delete coaches from other clubs" });
      }

      // Prevent deleting yourself
      if (coach.id === user.id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }

      // Delete the coach
      try {
        await storage.deleteUser(coachId);
        res.json({ message: "Coach deleted successfully" });
      } catch (deleteError: any) {
        console.error("Database deletion error:", deleteError);
        
        // Check if it's a constraint violation or our custom check
        if (deleteError.message?.includes('Cannot delete user')) {
          return res.status(400).json({ 
            error: "Cannot delete coach: they have uploaded sessions or received feedback. Please archive the coach instead or contact support.",
            details: deleteError.message 
          });
        }
        
        // Database constraint errors
        if (deleteError.code === '23503') {
          return res.status(400).json({ 
            error: "Cannot delete coach: they have associated data. Please contact support.",
            details: "Foreign key constraint violation"
          });
        }
        
        throw deleteError; // Re-throw to be caught by outer catch
      }
      
    } catch (error: any) {
      console.error("Error deleting coach:", error);
      res.status(500).json({ 
        error: "Failed to delete coach", 
        details: error.message || "Unknown error occurred"
      });
    }
  });

  // Send coach invitation (admin and heads of coaching only)
  app.post("/api/club/invite-coach", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      const { email, name, role, position, licenseLevel, ageGroup } = req.body;
      
      if (!email || !name || !role) {
        return res.status(400).json({ error: "Email, name, and role are required" });
      }

      if (!req.user || !req.user.clubId) {
        return res.status(400).json({ error: "User not associated with a club" });
      }

      // Check if user has proper permissions
      const user = req.user as User;
      if (user.role !== 'admin' && user.role !== 'club_admin' && user.position !== 'head_coach' && user.role !== 'super_admin') {
        return res.status(403).json({ error: "Insufficient permissions to invite coaches" });
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "A user with this email already exists" });
      }

      // Generate invitation token
      const invitationToken = randomBytes(32).toString('hex');
      
      // Create user invitation
      const invitedUser = await storage.createUserInvitation({
        email,
        name,
        role,
        clubId: user.clubId,
        position,
        licenseLevel,
        ageGroup
      }, invitationToken);

      // Send invitation email using email service
      const emailSent = await emailService.sendUserInvitationEmail(
        email, 
        invitationToken, 
        user.name || 'Club Administrator',
        clubInfo?.name || 'Your Club',
        role
      );

      const invitationUrl = `${req.protocol}://${req.get('host')}/complete-invitation?token=${invitationToken}`;
      
      res.json({ 
        message: emailSent ? "Invitation sent successfully" : "User invitation created - email delivery failed",
        invitedUser: {
          id: invitedUser.id,
          name: invitedUser.name,
          email: invitedUser.email,
          role: invitedUser.role,
          emailSent: emailSent,
          manualInvitationUrl: emailSent ? null : invitationUrl
        }
      });
      
    } catch (error: any) {
      console.error("Error sending coach invitation:", error);
      res.status(500).json({ error: "Failed to send invitation" });
    }
  });



  // Get club performance averages across all coaching metrics (head of coaching only)
  app.get("/api/club/performance/averages", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user.clubId) {
        return res.status(400).json({ error: "User not associated with a club" });
      }

      const clubId = req.user.clubId;
      const averages = await storage.getClubPerformanceAverages(clubId);

      res.json(averages);
    } catch (error) {
      console.error("Error fetching club performance averages:", error);
      res.status(500).json({ error: "Failed to fetch club performance averages" });
    }
  });



  app.get("/api/club/info", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user.clubId) {
        return res.status(400).json({ error: "User not associated with a club" });
      }

      const clubId = req.user.clubId;
      const clubInfo = await storage.getClubInfo(clubId);

      if (!clubInfo) {
        return res.status(404).json({ error: "Club not found" });
      }

      res.json(clubInfo);
    } catch (error) {
      console.error("Error fetching club info:", error);
      res.status(500).json({ error: "Failed to fetch club information" });
    }
  });

  app.put("/api/club/info", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user.clubId) {
        return res.status(400).json({ error: "User not associated with a club" });
      }

      const clubId = req.user.clubId;
      const updateData = req.body;

      // Validate required fields exist
      if (!updateData || Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No update data provided" });
      }

      const updatedClub = await storage.updateClubInfo(clubId, updateData);

      if (!updatedClub) {
        return res.status(404).json({ error: "Club not found or update failed" });
      }

      res.json(updatedClub);
    } catch (error) {
      console.error("Error updating club info:", error);
      res.status(500).json({ error: "Failed to update club information" });
    }
  });

  // Super Admin Routes - Complete platform management
  app.get("/api/super-admin/stats", ensureAuthenticated, ensureSuperAdmin, async (req: Request, res: Response) => {
    try {
      const [
        totalUsers,
        totalClubs, 
        totalVideos,
        totalFeedbacks,
        totalTransactions
      ] = await Promise.all([
        storage.getTotalUserCount(),
        storage.getTotalClubCount(),
        storage.getTotalVideoCount(),
        storage.getTotalFeedbackCount(),
        storage.getTotalTransactionCount()
      ]);

      const systemHealth = {
        uptime: process.uptime(),
        memoryUsage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
        cpuUsage: 0, // Would be calculated with system monitoring
        diskUsage: 0, // Would be calculated with system monitoring
        activeConnections: 0 // Would be tracked
      };

      const recentActivity = await storage.getRecentSystemActivity();

      res.json({
        totalUsers,
        totalClubs,
        totalVideos,
        totalFeedbacks,
        totalTransactions,
        systemHealth,
        recentActivity
      });
    } catch (error) {
      console.error("Error fetching super admin stats:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  app.get("/api/super-admin/users", ensureAuthenticated, ensureSuperAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsersForSuperAdmin();
      res.json(users);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Get all users for admins to manage
  app.get("/api/users", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      
      // Only admins, super_admins, head_of_coaching, club_admin can see all users
      if (!['admin', 'super_admin', 'head_of_coaching', 'club_admin'].includes(user.role) && 
          !['head_coach', 'academy_director'].includes(user.position || '')) {
        return res.status(403).json({ error: "Access denied" });
      }

      let users;
      if (user.role === 'super_admin') {
        // Super admin sees all users
        users = await storage.getAllUsersForSuperAdmin();
      } else if (user.clubId) {
        // Club admins see only their club users
        users = await storage.getUsersByClubId(user.clubId);
      } else {
        // Fallback to all users for other admin roles
        users = await storage.getAllUsers();
      }
      
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Update user details endpoint for admin users
  app.put("/api/users/:id", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;
      
      console.log("PUT /api/users/:id - Update request:", {
        userId: req.user!.id,
        updates,
        updateKeys: Object.keys(updates),
        emailValue: updates.email,
        requestingUser: req.user!.id,
        requestingUserRole: req.user!.role
      });
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Get current user data before update
      const currentUser = await storage.getUser(userId);
      console.log("Current user data:", currentUser);

      // Only allow admins to update coaches in their club
      if (req.user!.role === 'head_coach') {
        if (!currentUser || currentUser.clubId !== req.user!.clubId) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const updatedUser = await storage.updateUser(userId, updates);
      console.log("User updated successfully:", {
        updatedUserEmail: updatedUser.email,
        originalUpdateEmail: updates.email,
        hasEmail: !!updatedUser.email
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.get("/api/super-admin/clubs", ensureAuthenticated, ensureSuperAdmin, async (req: Request, res: Response) => {
    try {
      const clubs = await storage.getAllClubsForSuperAdmin();
      res.json(clubs);
    } catch (error) {
      console.error("Error fetching all clubs:", error);
      res.status(500).json({ error: "Failed to fetch clubs" });
    }
  });

  // Users available for tagging API
  app.get("/api/users/available-for-tagging", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      
      // Get users from the same club for tagging
      let users;
      if (user.clubId) {
        users = await storage.getUsersByClubId(user.clubId);
      } else {
        // If no club, get all users (for admins/super admins)
        users = await storage.getAllUsers();
      }
      
      // Return only necessary fields for tagging
      const availableUsers = users
        .filter(u => u.id !== user.id) // Exclude current user
        .map(u => ({
          id: u.id,
          name: u.name || u.username,
          username: u.username
        }));
      
      res.json(availableUsers);
    } catch (error) {
      console.error("Error fetching available users:", error);
      res.status(500).json({ error: "Failed to fetch available users" });
    }
  });

  // Notifications API Routes
  app.get("/api/notifications", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const notifications = await storage.getUserNotifications(req.user!.id);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.put("/api/notifications/:id/read", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId, req.user!.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.put("/api/notifications/mark-all-read", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      await storage.markAllNotificationsAsRead(req.user!.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // Feedback Comments API Routes
  app.get("/api/feedback/:feedbackId/comments", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const feedbackId = parseInt(req.params.feedbackId);
      
      if (isNaN(feedbackId)) {
        return res.status(400).json({ error: "Invalid feedback ID" });
      }

      // Get the feedback to verify access
      const feedback = await storage.getFeedback(feedbackId);
      if (!feedback) {
        return res.status(404).json({ error: "Feedback not found" });
      }

      // Check if user has access to this feedback
      const user = req.user as User;
      if (feedback.userId !== user.id && user.role !== 'head_coach' && user.role !== 'super_admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      const comments = await storage.getFeedbackComments(feedbackId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching feedback comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/feedback/:feedbackId/comments", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const feedbackId = parseInt(req.params.feedbackId);
      const { content, parentCommentId, mentionedUsers } = req.body;
      const user = req.user as User;
      
      if (isNaN(feedbackId)) {
        return res.status(400).json({ error: "Invalid feedback ID" });
      }

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: "Comment content is required" });
      }

      // Get the feedback to verify access
      const feedback = await storage.getFeedback(feedbackId);
      if (!feedback) {
        return res.status(404).json({ error: "Feedback not found" });
      }

      // Check if user has permission to comment
      const isOwner = feedback.userId === user.id;
      const isHeadCoach = user.role === 'head_coach' || user.role === 'super_admin';
      
      if (!isOwner && !isHeadCoach) {
        return res.status(403).json({ error: "Not authorized to comment on this feedback" });
      }

      // Create the comment with mentioned users
      const newComment = await storage.createFeedbackComment({
        feedbackId,
        authorId: user.id,
        parentCommentId: parentCommentId || null,
        content: content.trim(),
        isHeadCoachComment: isHeadCoach,
        mentionedUsers: mentionedUsers || []
      });

      // Create notifications for mentioned users
      if (mentionedUsers && mentionedUsers.length > 0) {
        try {
          for (const mentionedUserId of mentionedUsers) {
            if (mentionedUserId !== user.id) { // Don't notify the author
              await storage.createNotification({
                userId: mentionedUserId,
                type: 'mention',
                title: 'You were mentioned in a comment',
                message: `${user.name || user.username} mentioned you in a comment on a coaching session feedback.`,
                relatedEntityType: 'feedback_comment',
                relatedEntityId: newComment.id
              });
            }
          }
        } catch (notificationError) {
          console.error("Error creating notifications:", notificationError);
          // Don't fail the comment creation if notifications fail
        }
      }

      res.status(201).json(newComment);
    } catch (error) {
      console.error("Error creating feedback comment:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  app.put("/api/feedback/comments/:commentId", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const commentId = parseInt(req.params.commentId);
      const { content } = req.body;
      
      if (isNaN(commentId)) {
        return res.status(400).json({ error: "Invalid comment ID" });
      }

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: "Comment content is required" });
      }

      // Get the comment to verify ownership
      const comments = await storage.getFeedbackComments(0); // This would need to be modified to get a single comment
      const comment = comments.find(c => c.id === commentId);
      
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      // Check if user owns this comment or is admin
      const user = req.user as User;
      if (comment.authorId !== user.id && user.role !== 'super_admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      const updatedComment = await storage.updateFeedbackComment(commentId, {
        content: content.trim()
      });

      res.json(updatedComment);
    } catch (error) {
      console.error("Error updating feedback comment:", error);
      res.status(500).json({ error: "Failed to update comment" });
    }
  });

  app.delete("/api/feedback/comments/:commentId", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const commentId = parseInt(req.params.commentId);
      
      if (isNaN(commentId)) {
        return res.status(400).json({ error: "Invalid comment ID" });
      }

      // Get the comment to verify ownership
      const comments = await storage.getFeedbackComments(0); // This would need to be modified to get a single comment
      const comment = comments.find(c => c.id === commentId);
      
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      // Check if user owns this comment or is admin
      const user = req.user as User;
      if (comment.authorId !== user.id && user.role !== 'super_admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteFeedbackComment(commentId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting feedback comment:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // Session Management Comments (for Heads of Coaching)
  app.post("/api/sessions/:sessionId/comment", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const { comment } = req.body;
      const user = req.user as User;
      
      if (isNaN(sessionId)) {
        return res.status(400).json({ error: "Invalid session ID" });
      }

      if (!comment || comment.trim().length === 0) {
        return res.status(400).json({ error: "Comment content is required" });
      }

      // Verify the session exists
      const session = await storage.getVideo(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Create management comment - we'll store this as a special feedback comment
      // Get or create feedback for this session if it doesn't exist
      let feedback = await storage.getFeedbackByVideoId(sessionId);
      
      if (!feedback) {
        // Create a basic feedback entry for management comments
        const newFeedback = await storage.createFeedback({
          videoId: sessionId,
          userId: session.userId,
          overallScore: 0,
          feedback: `Management Comment by ${user.name || user.username}: ${comment.trim()}`,
          communicationScore: 0,
          engagementScore: 0,

          instructionScore: 0
        });
        feedback = newFeedback;
      } else {
        // Append management comment to existing feedback
        const updatedFeedback = feedback.feedback + `\n\n--- Management Comment by ${user.name || user.username} ---\n${comment.trim()}`;
        await storage.updateFeedback(feedback.id, { feedback: updatedFeedback });
      }

      // Create the comment entry
      const newComment = await storage.createFeedbackComment({
        feedbackId: feedback.id,
        authorId: user.id,
        parentCommentId: null,
        content: comment.trim(),
        isHeadCoachComment: true
      });

      res.status(201).json({
        success: true,
        comment: newComment,
        message: "Management comment added successfully"
      });
    } catch (error) {
      console.error("Error adding session comment:", error);
      res.status(500).json({ error: "Failed to add comment" });
    }
  });

  app.put("/api/super-admin/users/:id/status", ensureAuthenticated, ensureSuperAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      await storage.updateUserStatus(userId, isActive);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ error: "Failed to update user status" });
    }
  });

  app.put("/api/super-admin/users/:id/credits", ensureAuthenticated, ensureSuperAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { credits, operation } = req.body;
      
      await storage.updateUserCredits(userId, credits, operation);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user credits:", error);
      res.status(500).json({ error: "Failed to update user credits" });
    }
  });

  app.delete("/api/super-admin/users/:id", ensureAuthenticated, ensureSuperAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      await storage.deleteUser(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.put("/api/super-admin/users/:id/club", ensureAuthenticated, ensureSuperAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { clubId } = req.body;
      
      await storage.assignUserToClub(userId, clubId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error assigning user to club:", error);
      res.status(500).json({ error: "Failed to assign user to club" });
    }
  });

  app.put("/api/super-admin/users/:id/role", ensureAuthenticated, ensureSuperAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;
      
      await storage.updateUserRole(userId, role);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  app.put("/api/super-admin/users/:id/password", ensureAuthenticated, ensureSuperAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      // Hash the new password using the same method as registration
      const salt = randomBytes(16).toString("hex");
      const hashedPassword = (await scryptAsync(newPassword, salt, 64)) as Buffer;
      const passwordHash = `${hashedPassword.toString("hex")}.${salt}`;

      await storage.updateUserPassword(userId, passwordHash);
      res.json({ success: true });
    } catch (error) {
      console.error("Error resetting user password:", error);
      res.status(500).json({ message: "Failed to reset user password" });
    }
  });

  app.put("/api/super-admin/clubs/:id/status", ensureAuthenticated, ensureSuperAdmin, async (req: Request, res: Response) => {
    try {
      const clubId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      await storage.updateClubStatus(clubId, isActive);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating club status:", error);
      res.status(500).json({ error: "Failed to update club status" });
    }
  });

  app.delete("/api/super-admin/clubs/:id", ensureAuthenticated, ensureSuperAdmin, async (req: Request, res: Response) => {
    try {
      const clubId = parseInt(req.params.id);
      await storage.deleteClub(clubId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting club:", error);
      res.status(500).json({ error: "Failed to delete club" });
    }
  });

  app.get("/api/super-admin/settings", ensureAuthenticated, ensureSuperAdmin, async (req: Request, res: Response) => {
    try {
      const settings = await storage.getAllSystemSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching system settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.put("/api/super-admin/settings/:key", ensureAuthenticated, ensureSuperAdmin, async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      
      await storage.updateSystemSetting(key, value);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating system setting:", error);
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  app.get("/api/club/recent-activity", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      const activities = await storage.getRecentClubActivity();
      res.json(activities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      res.status(500).json({ error: "Failed to fetch recent activity" });
    }
  });

  // Role-based endpoints for regular coaches - only their own sessions
  app.get("/api/coach/my-sessions", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const sessions = await storage.getVideosByUserId(userId);
      
      // Transform to match expected format
      const formattedSessions = sessions.map(session => ({
        id: session.id,
        title: session.title,
        duration: session.duration,
        createdAt: session.createdAt,
        status: session.status,
        ageGroup: session.ageGroup,
        coachName: session.coachName
      }));
      
      res.json(formattedSessions);
    } catch (error) {
      console.error("Error fetching coach sessions:", error);
      res.status(500).json({ error: "Failed to fetch your sessions" });
    }
  });

  app.get("/api/coach/my-feedbacks", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const feedbacks = await storage.getFeedbacksByUserId(userId);
      
      // Transform to match expected format
      const formattedFeedbacks = feedbacks.map(feedback => ({
        id: feedback.id,
        sessionTitle: 'Session Analysis',
        overallScore: feedback.overallScore ? Math.round(feedback.overallScore / 10) : 0,
        communicationScore: feedback.communicationScore ? Math.round(feedback.communicationScore / 10) : 0,
        engagementScore: feedback.engagementScore ? Math.round(feedback.engagementScore / 10) : 0,
        instructionScore: feedback.instructionScore ? Math.round(feedback.instructionScore / 10) : 0,
        createdAt: feedback.createdAt,
        summary: feedback.summary
      }));
      
      res.json(formattedFeedbacks);
    } catch (error) {
      console.error("Error fetching coach feedbacks:", error);
      res.status(500).json({ error: "Failed to fetch your feedback" });
    }
  });

  // Shared content access for all coaches (curriculum, CPD materials)
  app.get("/api/coach/shared-content", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      // Return sample shared content structure for coaches
      const sharedContent = [
        {
          id: 1,
          title: "Club Curriculum Guidelines",
          slug: "curriculum-guidelines",
          content: "Comprehensive coaching curriculum for all age groups",
          type: "curriculum",
          lastModified: new Date(),
          isPublished: true
        },
        {
          id: 2,
          title: "CPD Development Framework",
          slug: "cpd-framework",
          content: "Continuous professional development resources and requirements",
          type: "cpd",
          lastModified: new Date(),
          isPublished: true
        },
        {
          id: 3,
          title: "Training Session Templates",
          slug: "training-templates",
          content: "Standard training session structures and planning templates",
          type: "training",
          lastModified: new Date(),
          isPublished: true
        }
      ];
      
      res.json(sharedContent);
    } catch (error) {
      console.error("Error fetching shared content:", error);
      res.status(500).json({ error: "Failed to fetch shared content" });
    }
  });

  // Image upload endpoints
  app.post("/api/club/logo/upload", ensureAuthenticated, ensureAdmin, (req: Request, res: Response, next) => {
    imageUpload.single("logo")(req, res, next);
  }, async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const user = req.user!;
      const file = req.file;
      
      // Upload original image to S3 (skip Sharp processing for now)
      const s3Key = `club-logos/${user.id}-${Date.now()}-${file.originalname}`;
      const s3Url = await uploadBufferToS3(file.buffer, s3Key, file.mimetype);
      
      // Update club logo in database
      await storage.updateClubLogo(user.clubId!, s3Url);
      
      res.json({ logoUrl: s3Url });
    } catch (error) {
      console.error("Error uploading club logo:", error);
      res.status(500).json({ message: "Failed to upload logo" });
    }
  });

  // New endpoint for club logo with cropping support
  app.post("/api/club/logo", ensureAuthenticated, ensureAdmin, (req: Request, res: Response, next) => {
    imageUpload.single("logo")(req, res, next);
  }, async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const user = req.user!;
      const file = req.file;
      
      // Create proper filename with extension
      const fileExtension = file.originalname.split('.').pop() || 'jpg';
      const s3Key = `club-logos/${user.clubId}-${Date.now()}.${fileExtension}`;
      
      console.log("Uploading logo to S3 with key:", s3Key);
      // Correct parameter order: buffer, filename, key
      const s3Url = await uploadBufferToS3(file.buffer, file.originalname, s3Key);
      console.log("Logo uploaded to S3 URL:", s3Url);
      
      // Create proxy URL instead of direct S3 URL
      const proxyUrl = `/api/images/s3-proxy/${s3Key}`;
      console.log("Created proxy URL:", proxyUrl);
      
      // Update club logo in database with proxy URL
      await storage.updateClubLogo(user.clubId!, proxyUrl);
      
      res.json({ logoUrl: proxyUrl });
    } catch (error) {
      console.error("Error uploading club logo:", error);
      res.status(500).json({ message: "Failed to upload logo" });
    }
  });

  app.post("/api/user/profile-picture/upload", ensureAuthenticated, (req: Request, res: Response, next) => {
    imageUpload.single("profilePicture")(req, res, next);
  }, async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const user = req.user!;
      const file = req.file;
      
      // Upload to S3
      const s3Key = `profile-pictures/${user.id}-${Date.now()}-${file.originalname}`;
      const s3Url = await uploadBufferToS3(file.buffer, s3Key, file.mimetype);
      
      // Update user profile picture in database
      await storage.updateUserProfilePicture(user.id, s3Url);
      
      res.json({ profilePictureUrl: s3Url });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      res.status(500).json({ message: "Failed to upload profile picture" });
    }
  });

  // Serve S3 images through backend proxy (bypasses S3 public access restrictions)
  app.get("/api/images/s3-proxy/*", async (req: Request, res: Response) => {
    try {
      const s3Key = req.params[0]; // Everything after s3-proxy/
      console.log("Proxying S3 image:", s3Key);
      
      const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
      const bucketName = process.env.AWS_S3_BUCKET_NAME!;
      
      const s3Client = new S3Client({
        region: process.env.AWS_REGION?.match(/([a-z]{2}-[a-z]+-\d+)/)?.[1] || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
      });

      const response = await s3Client.send(command);
      
      if (response.Body) {
        // Set appropriate headers
        res.set({
          'Content-Type': response.ContentType || 'image/jpeg',
          'Content-Length': response.ContentLength?.toString(),
          'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
          'ETag': response.ETag,
        });

        // Stream the image data
        const stream = response.Body as any;
        stream.pipe(res);
      } else {
        res.status(404).json({ message: "Image not found" });
      }
    } catch (error) {
      console.error("Error proxying S3 image:", error);
      res.status(404).json({ message: "Image not found" });
    }
  });

  // Get coach profile by ID
  app.get("/api/users/:id/profile", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  // Get user's videos
  app.get("/api/users/:id/videos", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const videos = await storage.getUserVideos(userId);
      res.json(videos);
    } catch (error) {
      console.error("Error fetching user videos:", error);
      res.status(500).json({ error: "Failed to fetch user videos" });
    }
  });

  // Get user's feedbacks
  app.get("/api/users/:id/feedbacks", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const feedbacks = await storage.getUserFeedbacks(userId);
      res.json(feedbacks);
    } catch (error) {
      console.error("Error fetching user feedbacks:", error);
      res.status(500).json({ error: "Failed to fetch user feedbacks" });
    }
  });

  // Get user's progress
  app.get("/api/users/:id/progress", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const progress = await storage.getUserProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ error: "Failed to fetch user progress" });
    }
  });

  // Original get coach profile endpoint
  app.get("/api/users/:id/profile_old", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = req.user!;
      
      // Check if user has permission to view this profile
      const hasClubManagementAccess = user.role === 'admin' || user.role === 'super_admin' || user.role === 'head_of_coaching' || user.role === 'club_admin' || user.position === 'head_coach' || user.position === 'academy_director';
      if (!hasClubManagementAccess && user.id !== userId) {
        return res.status(403).json({ message: "Not authorized to view this profile" });
      }
      
      const coach = await storage.getUser(userId);
      if (!coach) {
        return res.status(404).json({ message: "Coach not found" });
      }
      
      res.json(coach);
    } catch (error) {
      console.error("Error fetching coach profile:", error);
      res.status(500).json({ message: "Failed to fetch coach profile" });
    }
  });

  // Get coach sessions by coach ID
  app.get("/api/club/coach-sessions/:coachId", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const coachId = parseInt(req.params.coachId);
      const user = req.user!;
      
      // Check if user has permission to view coach sessions
      if (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'head_of_coaching' && user.id !== coachId) {
        return res.status(403).json({ message: "Not authorized to view coach sessions" });
      }
      
      const sessions = await storage.getVideosByUserId(coachId);
      res.json(sessions || []);
    } catch (error) {
      console.error("Error fetching coach sessions:", error);
      res.status(500).json({ message: "Failed to fetch coach sessions" });
    }
  });

  // Get coach feedback/comments by coach ID
  app.get("/api/club/coach-feedbacks/:coachId", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const coachId = parseInt(req.params.coachId);
      const user = req.user!;
      
      // Check if user has permission to view coach feedback
      if (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'head_of_coaching' && user.id !== coachId) {
        return res.status(403).json({ message: "Not authorized to view coach feedback" });
      }
      
      const feedbacks = await storage.getFeedbacksByUserId(coachId);
      res.json(feedbacks || []);
    } catch (error) {
      console.error("Error fetching coach feedbacks:", error);
      res.status(500).json({ message: "Failed to fetch coach feedbacks" });
    }
  });

  // Add comment to session
  app.post("/api/sessions/:sessionId/comment", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const { comment } = req.body;
      const user = req.user!;
      
      // Check if user has permission to comment (only admins and heads of coaching)
      if (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'head_of_coaching') {
        return res.status(403).json({ message: "Not authorized to add comments" });
      }
      
      if (!comment || comment.trim().length === 0) {
        return res.status(400).json({ message: "Comment cannot be empty" });
      }
      
      // Get the session/video to verify it exists
      const video = await storage.getVideo(sessionId);
      if (!video) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Add the comment to the feedback record
      const feedback = await storage.getFeedbackByVideoId(sessionId);
      if (feedback) {
        // Update existing feedback with management comment
        await storage.createFeedbackComment({
          feedbackId: feedback.id,
          authorId: req.user!.id,
          content: comment.trim()
        });
      } else {
        // Create new feedback record with comment
        // Create basic feedback first, then add comment
        const newFeedback = await storage.createFeedback({
          videoId: sessionId,
          userId: video.userId,
          overallScore: 0,
          feedback: `Management comment by ${user.name || user.username}`,
          communicationScore: 0,
          engagementScore: 0,
          instructionScore: 0
        });
        
        await storage.createFeedbackComment({
          feedbackId: newFeedback.id,
          authorId: req.user!.id,
          content: comment.trim()
        });
      }
      
      res.json({ message: "Comment added successfully" });
    } catch (error) {
      console.error("Error adding session comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  // Club Communication Routes
  app.get("/api/club/messages", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      
      // Only allow users with a club to access messaging
      if (!user.clubId) {
        return res.status(403).json({ error: "Must be a club member to access messaging" });
      }

      const messages = await storage.getClubMessages(user.clubId);
      
      // Mark messages as read when user views them
      for (const message of messages) {
        if (message.senderId !== user.id) {
          await storage.markClubMessageAsRead(user.id, message.id);
        }
      }
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching club messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.get("/api/club/unread-count", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      
      if (!user.clubId) {
        return res.json({ count: 0 });
      }

      const count = await storage.getUnreadClubMessagesCount(user.id, user.clubId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread club messages count:", error);
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });

  app.get("/api/conversations/unread-count", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      
      if (!user.clubId) {
        return res.json({ count: 0 });
      }

      const count = await storage.getUnreadDirectMessagesCount(user.id);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread direct messages count:", error);
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });

  app.post("/api/club/messages", ensureAuthenticated, clubAttachmentUpload.single('attachment'), async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const { content } = req.body;
      const file = req.file;
      
      // Only allow users with a club to send messages
      if (!user.clubId) {
        return res.status(403).json({ error: "Must be a club member to send messages" });
      }

      if ((!content || content.trim().length === 0) && !file) {
        return res.status(400).json({ error: "Message content or attachment is required" });
      }

      let attachmentUrl = null;
      let attachmentName = null;
      let attachmentSize = null;
      let messageType = "text";

      if (file) {
        // Upload file to S3
        try {
          const key = `club-attachments/${user.clubId}/${Date.now()}-${file.originalname}`;
          await uploadBufferToS3(file.buffer, key, file.mimetype);
          attachmentUrl = key;
          attachmentName = file.originalname;
          attachmentSize = file.size;
          messageType = "file";
        } catch (uploadError) {
          console.error("Error uploading file to S3:", uploadError);
          return res.status(500).json({ error: "Failed to upload attachment" });
        }
      }

      const message = await storage.createClubMessage({
        clubId: user.clubId,
        senderId: user.id,
        content: content?.trim() || (file ? `Shared a file: ${file.originalname}` : ""),
        messageType,
        attachmentUrl,
        attachmentName,
        attachmentSize
      });

      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating club message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.get("/api/club/attachment/:key(*)", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const key = req.params.key;
      
      // Only allow users with a club to access attachments
      if (!user.clubId) {
        return res.status(403).json({ error: "Must be a club member to access attachments" });
      }

      // Verify the attachment belongs to the user's club
      if (!key.startsWith(`club-attachments/${user.clubId}/`)) {
        return res.status(403).json({ error: "Cannot access attachments from other clubs" });
      }

      try {
        const fileData = await downloadFromS3(key);
        
        // Set appropriate headers
        res.setHeader('Content-Type', fileData.ContentType || 'application/octet-stream');
        res.setHeader('Content-Length', fileData.ContentLength || 0);
        res.setHeader('Content-Disposition', `attachment; filename="${key.split('/').pop()}"`);
        
        res.send(fileData.Body);
      } catch (s3Error) {
        console.error("Error fetching file from S3:", s3Error);
        res.status(404).json({ error: "File not found" });
      }
    } catch (error) {
      console.error("Error serving attachment:", error);
      res.status(500).json({ error: "Failed to serve attachment" });
    }
  });

  app.get("/api/club/members", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      
      // Only allow users with a club to see members
      if (!user.clubId) {
        return res.status(403).json({ error: "Must be a club member to view members" });
      }

      const members = await storage.getClubMembers(user.clubId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching club members:", error);
      res.status(500).json({ error: "Failed to fetch club members" });
    }
  });

  // Development Plans Routes
  // Get development plans for a user
  app.get("/api/development-plans/:userId", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      // Check if user is requesting their own plans or has permission to view others
      if (req.user!.id !== userId && req.user!.role !== 'admin' && req.user!.role !== 'club_admin' && req.user!.position !== 'head_coach') {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const plans = await storage.getDevelopmentPlansByUserId(userId);
      res.json(plans);
    } catch (error: any) {
      console.error('Error fetching development plans:', error);
      res.status(500).json({ error: "Failed to fetch development plans" });
    }
  });

  // Create a new development plan
  app.post("/api/development-plans", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const { title, description, targetDate, userId } = req.body;
      
      // Check if user is creating for themselves or has permission
      const targetUserId = userId || req.user!.id;
      if (req.user!.id !== targetUserId && req.user!.role !== 'admin' && req.user!.role !== 'club_admin' && req.user!.position !== 'head_coach') {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const plan = await storage.createDevelopmentPlan({
        userId: targetUserId,
        title,
        description: description || null,
        targetDate: targetDate ? new Date(targetDate) : null,
        status: 'active'
      });
      
      res.status(201).json(plan);
    } catch (error: any) {
      console.error('Error creating development plan:', error);
      res.status(500).json({ error: "Failed to create development plan" });
    }
  });

  // Update a development plan
  app.put("/api/development-plans/:planId", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const planId = parseInt(req.params.planId);
      const { title, description, targetDate, status } = req.body;
      
      // Get the plan to check ownership
      const existingPlan = await storage.getDevelopmentPlanWithDetails(planId);
      if (!existingPlan) {
        return res.status(404).json({ error: "Development plan not found" });
      }
      
      // Check permissions
      if (req.user!.id !== existingPlan.userId && req.user!.role !== 'admin' && req.user!.role !== 'club_admin' && req.user!.position !== 'head_coach') {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const updatedPlan = await storage.updateDevelopmentPlan(planId, {
        title,
        description,
        targetDate: targetDate ? new Date(targetDate) : null,
        status,
        // Update all coaching development fields
        strengthArea1: req.body.strengthArea1 || null,
        strengthHow1: req.body.strengthHow1 || null,
        strengthWhere1: req.body.strengthWhere1 || null,
        strengthWhy1: req.body.strengthWhy1 || null,
        strengthArea2: req.body.strengthArea2 || null,
        strengthHow2: req.body.strengthHow2 || null,
        strengthWhere2: req.body.strengthWhere2 || null,
        strengthWhy2: req.body.strengthWhy2 || null,
        strengthArea3: req.body.strengthArea3 || null,
        strengthHow3: req.body.strengthHow3 || null,
        strengthWhere3: req.body.strengthWhere3 || null,
        strengthWhy3: req.body.strengthWhy3 || null,
        developmentArea1: req.body.developmentArea1 || null,
        developmentHow1: req.body.developmentHow1 || null,
        developmentWhere1: req.body.developmentWhere1 || null,
        developmentWhy1: req.body.developmentWhy1 || null,
        developmentArea2: req.body.developmentArea2 || null,
        developmentHow2: req.body.developmentHow2 || null,
        developmentWhere2: req.body.developmentWhere2 || null,
        developmentWhy2: req.body.developmentWhy2 || null,
        developmentArea3: req.body.developmentArea3 || null,
        developmentHow3: req.body.developmentHow3 || null,
        developmentWhere3: req.body.developmentWhere3 || null,
        developmentWhy3: req.body.developmentWhy3 || null,
        focusArea: req.body.focusArea || null,
        focusHow: req.body.focusHow || null,
        focusWhere: req.body.focusWhere || null,
        focusWhy: req.body.focusWhy || null,
        currentQualification: req.body.currentQualification || null,
        desiredQualification: req.body.desiredQualification || null,
        currentRole: req.body.currentRole || null,
        desiredRole: req.body.desiredRole || null
      });
      
      res.json(updatedPlan);
    } catch (error: any) {
      console.error('Error updating development plan:', error);
      res.status(500).json({ error: "Failed to update development plan" });
    }
  });

  // Delete a development plan
  app.delete("/api/development-plans/:planId", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const planId = parseInt(req.params.planId);
      
      // Get the plan to check ownership
      const existingPlan = await storage.getDevelopmentPlanWithDetails(planId);
      if (!existingPlan) {
        return res.status(404).json({ error: "Development plan not found" });
      }
      
      // Check permissions
      if (req.user!.id !== existingPlan.userId && req.user!.role !== 'admin' && req.user!.role !== 'club_admin' && req.user!.position !== 'head_coach') {
        return res.status(403).json({ error: "Access denied" });
      }
      
      await storage.deleteDevelopmentPlan(planId);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting development plan:', error);
      res.status(500).json({ error: "Failed to delete development plan" });
    }
  });

  // Get development plan details with goals and actions
  app.get("/api/development-plans/detail/:planId", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const planId = parseInt(req.params.planId);
      
      const plan = await storage.getDevelopmentPlanWithDetails(planId);
      if (!plan) {
        return res.status(404).json({ error: "Development plan not found" });
      }
      
      // Check access permissions
      if (req.user!.id !== plan.userId && req.user!.role !== 'admin' && req.user!.role !== 'club_admin' && req.user!.position !== 'head_coach') {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(plan);
    } catch (error: any) {
      console.error('Error fetching development plan details:', error);
      res.status(500).json({ error: "Failed to fetch development plan details" });
    }
  });

  // Download drill creation guide
  app.get("/api/download/drill-guide", (req: Request, res: Response) => {
    try {
      const filePath = path.join(process.cwd(), "client", "public", "drill-creation-guide.svg");
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Drill creation guide not found" });
      }

      res.setHeader('Content-Disposition', 'attachment; filename="CoachAI-Drill-Creation-Guide.svg"');
      res.setHeader('Content-Type', 'image/svg+xml');
      res.sendFile(filePath);
    } catch (error: any) {
      console.error("Error downloading drill guide:", error);
      res.status(500).json({ message: "Failed to download drill guide" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);


  return httpServer;
}

// Additional admin check function for backwards compatibility
function ensureAdminAccess(req: Request, res: Response, next: NextFunction) {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
    return next();
  }
  res.status(403).json({ message: "Access denied" });
}

// Middleware to ensure user is an admin or head of coaching
function ensureAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'head_of_coaching' || req.user.role === 'super_admin')) {
    return next();
  }
  res.status(403).json({ message: "Forbidden: Admin access required" });
}

// Middleware to ensure user is a super admin
function ensureSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user && req.user.role === 'admin' && req.user.username === 'admin') {
    return next();
  }
  res.status(403).json({ message: "Forbidden: Super admin access required" });
}

//Function definition moved to video-processor.ts

// Function to update user progress was moved to video-processor.ts

interface NextFunction {
  (err?: any): void;
}
