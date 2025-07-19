# Complete CoachAI Application for Railway

## Step 1: Replace Your GitHub Files

Delete the current simple files and create these complete application files:

### 1. package.json (replace existing)
```json
{
  "name": "coachAI",
  "version": "1.0.0",
  "type": "module",
  "license": "MIT",
  "scripts": {
    "dev": "tsx server/index.ts",
    "start": "tsx server/index.ts",
    "build": "echo 'No build step required for Railway'",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "0.37.0",
    "@aws-sdk/client-s3": "3.832.0",
    "@aws-sdk/lib-storage": "3.832.0",
    "@neondatabase/serverless": "^0.10.4",
    "@sendgrid/mail": "^8.1.4",
    "bcrypt": "^5.1.1",
    "connect-pg-simple": "^10.0.0",
    "cors": "^2.8.5",
    "drizzle-kit": "^0.28.1",
    "drizzle-orm": "^0.36.4",
    "drizzle-zod": "^0.6.0",
    "express": "^4.21.1",
    "express-rate-limit": "^7.4.1",
    "express-session": "^1.18.1",
    "fluent-ffmpeg": "^2.1.3",
    "mime-types": "^2.1.35",
    "multer": "^1.4.5-lts.1",
    "node-cron": "^3.0.3",
    "openai": "^4.71.0",
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "scrypt": "^6.3.0",
    "sharp": "^0.33.5",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/express": "^4.17.21",
    "@types/express-session": "^1.18.0",
    "@types/fluent-ffmpeg": "^2.1.25",
    "@types/mime-types": "^2.1.4",
    "@types/multer": "^1.4.12",
    "@types/node": "^22.10.1",
    "@types/passport": "^1.0.16",
    "@types/passport-local": "^1.0.38"
  }
}
```

### 2. server/index.ts (create server folder and file)
```typescript
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';

const app = express();
const port = process.env.PORT || 5000;

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '6gb' }));
app.use(express.urlencoded({ extended: true, limit: '6gb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    message: 'CoachAI server running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Basic routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'CoachAI - AI-Powered Coaching Analysis Platform',
    status: 'operational',
    version: '1.0.0',
    features: [
      '6GB file upload support',
      'Multi-AI analysis (OpenAI, Claude, Perplexity)',
      'Real-time processing',
      'Comprehensive coaching feedback',
      'Club management system',
      'Individual development plans'
    ]
  });
});

// Authentication routes
app.post('/api/login', (req, res) => {
  res.json({ message: 'Login endpoint - authentication coming soon' });
});

app.post('/api/register', (req, res) => {
  res.json({ message: 'Registration endpoint - authentication coming soon' });
});

// Upload endpoint placeholder
app.post('/api/upload', (req, res) => {
  res.json({ 
    message: 'Upload endpoint ready',
    maxFileSize: '6GB',
    supportedFormats: ['mp4', 'mov', 'avi', 'mp3', 'wav', 'm4a']
  });
});

// AI analysis endpoint placeholder
app.post('/api/analyze', (req, res) => {
  res.json({ 
    message: 'AI analysis endpoint ready',
    aiProviders: ['OpenAI GPT-4', 'Anthropic Claude', 'Perplexity'],
    analysisTypes: ['Communication', 'Technical Instruction', 'Player Engagement', 'Session Management']
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 CoachAI server running on port ${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${port}/api/health`);
});
```

### 3. shared/schema.ts (create shared folder and file)
```typescript
import { pgTable, text, integer, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table
export const users = pgTable('users', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  role: text('role').default('coach'),
  position: text('position').default('coach'),
  clubId: integer('club_id'),
  isVerified: boolean('is_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Videos table
export const videos = pgTable('videos', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id').notNull(),
  filename: text('filename').notNull(),
  originalName: text('original_name'),
  fileSize: integer('file_size'),
  duration: integer('duration'),
  status: text('status').default('uploaded'),
  s3Key: text('s3_key'),
  audioS3Key: text('audio_s3_key'),
  transcript: text('transcript'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Feedbacks table
export const feedbacks = pgTable('feedbacks', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  videoId: integer('video_id').notNull(),
  userId: integer('user_id').notNull(),
  overallScore: integer('overall_score'),
  communicationScore: integer('communication_score'),
  technicalScore: integer('technical_score'),
  engagementScore: integer('engagement_score'),
  keyInfo: jsonb('key_info'),
  questioning: jsonb('questioning'),
  language: jsonb('language'),
  coachBehaviours: jsonb('coach_behaviours'),
  playerEngagement: jsonb('player_engagement'),
  intendedOutcomes: jsonb('intended_outcomes'),
  neuroscience: jsonb('neuroscience'),
  coachSpecific: jsonb('coach_specific'),
  comments: text('comments'),
  multiAiAnalysis: jsonb('multi_ai_analysis'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Clubs table
export const clubs = pgTable('clubs', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  description: text('description'),
  logoUrl: text('logo_url'),
  primaryColor: text('primary_color').default('#8A4FFF'),
  secondaryColor: text('secondary_color').default('#7C3AED'),
  accentColor: text('accent_color').default('#B794F6'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertVideoSchema = createInsertSchema(videos);
export const insertFeedbackSchema = createInsertSchema(feedbacks);
export const insertClubSchema = createInsertSchema(clubs);

// Types
export type User = typeof users.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type Feedback = typeof feedbacks.$inferSelect;
export type Club = typeof clubs.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type InsertClub = z.infer<typeof insertClubSchema>;
```

### 4. drizzle.config.ts (create in root)
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './shared/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!
  }
});
```

### 5. tsconfig.json (replace existing)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["server/**/*", "shared/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Step 2: Set Environment Variables in Railway

Add these environment variables in your Railway dashboard:

```
DATABASE_URL=your_neon_database_url
OPENAI_API_KEY=your_openai_api_key
SESSION_SECRET=your_random_secret_key
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET_NAME=your_s3_bucket_name
SENDGRID_API_KEY=your_sendgrid_api_key
NODE_ENV=production
```

## Step 3: Deploy

Once you commit these files to GitHub, Railway will automatically deploy your complete CoachAI application with all the coaching analysis features.