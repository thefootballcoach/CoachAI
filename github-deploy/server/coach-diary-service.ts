/**
 * Coach Diary Service - Internal diary system to replace Google Calendar
 * Creates session review entries in the coach's personal diary
 */

import { storage } from './storage';
import { CoachDiaryEntry, InsertCoachDiaryEntry } from '@shared/schema';

export interface DiarySessionEntry {
  sessionTitle: string;
  videoId: number;
  coachId: number;
  reviewDate: Date;
  sessionDate: Date;
  feedback?: string;
}

export class CoachDiaryService {
  /**
   * Create a session review entry in the coach's diary
   */
  static async createSessionReviewEntry(data: DiarySessionEntry): Promise<CoachDiaryEntry> {
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() + 3); // Schedule review 3 days from now

    const diaryEntry: InsertCoachDiaryEntry = {
      coachId: data.coachId,
      videoId: data.videoId,
      entryType: 'session_review',
      title: `Review Session: ${data.sessionTitle}`,
      content: `Session Review scheduled for ${data.sessionTitle}.
      
Session Date: ${data.sessionDate.toLocaleDateString()}
Review Focus: Analyze coaching feedback and identify areas for improvement.

Review Tasks:
- Review AI analysis feedback
- Identify 3 key strengths from the session
- Identify 2 areas for development
- Plan specific actions for next session
- Update development goals if needed

${data.feedback ? `Session Notes: ${data.feedback}` : ''}`,
      scheduledDate: reviewDate,
      priority: 'medium',
      status: 'pending',
      tags: ['session_review', 'coaching_development'],
      reminders: [
        { date: reviewDate.toISOString(), sent: false }
      ]
    };

    return await storage.createCoachDiaryEntry(diaryEntry);
  }

  /**
   * Create a reflection entry in the coach's diary
   */
  static async createReflectionEntry(
    coachId: number,
    title: string,
    content: string,
    videoId?: number
  ): Promise<CoachDiaryEntry> {
    const diaryEntry: InsertCoachDiaryEntry = {
      coachId,
      videoId,
      entryType: 'reflection',
      title: `Reflection: ${title}`,
      content,
      scheduledDate: new Date(),
      priority: 'medium',
      status: 'completed',
      tags: ['reflection', 'self_assessment'],
      reminders: []
    };

    return await storage.createCoachDiaryEntry(diaryEntry);
  }

  /**
   * Create a goal setting entry in the coach's diary
   */
  static async createGoalEntry(
    coachId: number,
    title: string,
    goals: string,
    targetDate: Date
  ): Promise<CoachDiaryEntry> {
    const diaryEntry: InsertCoachDiaryEntry = {
      coachId,
      entryType: 'goal_setting',
      title: `Goals: ${title}`,
      content: goals,
      scheduledDate: targetDate,
      priority: 'high',
      status: 'pending',
      tags: ['goals', 'development_planning'],
      reminders: [
        { date: targetDate.toISOString(), sent: false }
      ]
    };

    return await storage.createCoachDiaryEntry(diaryEntry);
  }

  /**
   * Get upcoming diary entries for a coach
   */
  static async getUpcomingEntries(coachId: number): Promise<CoachDiaryEntry[]> {
    return await storage.getUpcomingDiaryEntries(coachId);
  }

  /**
   * Mark a diary entry as completed
   */
  static async markCompleted(entryId: number): Promise<CoachDiaryEntry> {
    return await storage.markDiaryEntryCompleted(entryId);
  }

  /**
   * Get all diary entries for a coach
   */
  static async getCoachDiary(coachId: number): Promise<CoachDiaryEntry[]> {
    return await storage.getCoachDiaryEntries(coachId);
  }
}

export default CoachDiaryService;