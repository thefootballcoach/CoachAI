import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { randomBytes } from "crypto";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import createMemoryStore from "memorystore";
import { hashPassword, comparePasswords } from "./auth-utils";
import { emailService } from "./email-service";

const MemoryStore = createMemoryStore(session);

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// Middleware to require authentication
function requireAuthenticated(req: any, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export function setupAuth(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET || randomBytes(32).toString('hex');
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true, // Changed to true to ensure session creation
    store: storage.sessionStore,
    name: 'coachAI.sid', // Explicit session name
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: false, // Set to false for development
      sameSite: 'lax',
      path: '/',
      // Force save session even without changes
      rolling: true // Reset cookie expiry on each request
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Login attempt for username: ${username}`);
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.log(`User not found: ${username}`);
          return done(null, false, { message: "Invalid username or password" });
        }
        
        console.log(`User found: ${user.username}, checking password...`);
        const passwordMatch = await comparePasswords(password, user.password);
        console.log(`Password match result: ${passwordMatch}`);
        
        if (!passwordMatch) {
          console.log(`Password mismatch for user: ${username}`);
          return done(null, false, { message: "Invalid username or password" });
        }
        
        console.log(`Authentication successful for user: ${username}`);
        return done(null, user);
      } catch (error) {
        console.error(`Authentication error for user ${username}:`, error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
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

      // Check if this is an admin creating a coach account
      const isAdminCreatingCoach = req.user && (req.user.role === 'admin' || req.user.role === 'head_coach');
      
      let verificationToken = null;
      let tempPassword = null;
      let hashedPassword = null;
      
      if (isAdminCreatingCoach) {
        // Generate temporary password for coach invitation
        tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        hashedPassword = await hashPassword(tempPassword);
      } else {
        // Generate verification token for self-registration
        verificationToken = emailService.generateToken();
        hashedPassword = await hashPassword(userData.password);
      }
      
      // If the registering user is an admin, assign new coaches to their club
      let clubId = null;
      if (req.user && req.user.role === 'admin' && req.user.clubId) {
        clubId = req.user.clubId;
      }
      
      const user = await storage.createUser({
        ...userData,
        role: 'coach', // Force coach role for all new registrations
        position: 'coach', // Force coach position for all new registrations
        password: hashedPassword,
        emailVerificationToken: verificationToken,
        clubId: clubId,
        isEmailVerified: isAdminCreatingCoach, // Auto-verify admin-created accounts
      });

      let emailSent = false;
      
      if (isAdminCreatingCoach) {
        // Send coach invitation email
        console.log(`Sending coach invitation email to: ${user.email}`);
        const inviterName = req.user!.name || req.user!.username;
        const clubInfo = req.user!.clubId ? await storage.getClubInfo(req.user!.clubId) : null;
        const clubName = clubInfo?.name || 'Your Club';
        
        emailSent = await emailService.sendCoachInvitationEmail(
          user.email, 
          user.username, 
          tempPassword!, 
          inviterName, 
          clubName
        );
        console.log(`Coach invitation email send result: ${emailSent}`);
      } else {
        // Send verification email for self-registration
        console.log(`Attempting to send verification email to: ${user.email}`);
        emailSent = await emailService.sendVerificationEmail(user.email, user.username, verificationToken!);
        console.log(`Verification email send result: ${emailSent}`);
      }

      // Handle login and response based on registration type
      if (isAdminCreatingCoach) {
        // For admin-created accounts, don't log them in automatically
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
      } else {
        // For self-registration, log user in
        req.login(user, (err) => {
          if (err) return next(err);
          
          let message = "Registration successful!";
          let verificationUrl = null;
          
          if (emailSent) {
            message = "Registration successful. Please check your email to verify your account.";
          } else {
            // Provide manual verification URL when email fails
            verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5000'}/verify-email?token=${verificationToken}`;
            message = "Registration successful. Email delivery failed - you can verify your account using the provided link.";
          }
          
          return res.status(201).json({
            ...user,
            message,
            verificationUrl: emailSent ? null : verificationUrl
          });
        });
      }
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Invalid credentials" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const user = req.user as any;
    const { cacheManager } = await import("./cache-manager");
    const cacheKey = `user-${user.id}`;
    
    const userData = await cacheManager.withCache(
      cacheKey,
      async () => user,
      'users',
      2 * 60 * 1000 // 2 minutes cache for user data
    );
    
    res.json(userData);
  });

  app.patch("/api/user/profile", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const { name, email, username } = req.body;
      const userId = req.user!.id;
      
      // Check if username is taken (by someone else)
      if (username !== req.user!.username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Username already taken" });
        }
      }
      
      // Check if email is taken (by someone else)
      if (email !== req.user!.email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }
      
      const updatedUser = await storage.updateUser(userId, { name, email, username });
      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/user/password", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      
      // Check if passwords match
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "New passwords don't match" });
      }
      
      // Check if current password is correct
      const user = await storage.getUser(req.user!.id);
      if (!user || !(await comparePasswords(currentPassword, user.password))) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Update password
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashedPassword);
      
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      next(error);
    }
  });

  // Email verification endpoint
  app.get("/api/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Invalid verification token" });
      }

      const user = await storage.getUserByVerificationToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }

      await storage.verifyUserEmail(user.id);
      res.json({ message: "Email verified successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error verifying email" });
    }
  });

  // Request password reset
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({ message: "If an account with that email exists, a password reset link has been sent." });
      }

      const resetToken = emailService.generateToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await storage.setPasswordResetToken(user.id, resetToken, expiresAt);
      await emailService.sendPasswordResetEmail(user.email, user.username, resetToken);

      res.json({ message: "If an account with that email exists, a password reset link has been sent." });
    } catch (error) {
      res.status(500).json({ message: "Error processing password reset request" });
    }
  });

  // Reset password
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, newPassword, confirmPassword } = req.body;
      
      if (!token || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "Passwords don't match" });
      }

      const user = await storage.getUserByPasswordResetToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
        return res.status(400).json({ message: "Reset token has expired" });
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.resetUserPassword(user.id, hashedPassword);

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error resetting password" });
    }
  });

  // Resend verification email
  app.post("/api/resend-verification", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const user = req.user!;
      
      if (user.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      const verificationToken = emailService.generateToken();
      await storage.updateEmailVerificationToken(user.id, verificationToken);
      await emailService.sendVerificationEmail(user.email, user.username, verificationToken);

      res.json({ message: "Verification email sent" });
    } catch (error) {
      res.status(500).json({ message: "Error sending verification email" });
    }
  });
}
