/**
 * Calendar Event Generation Service
 * Creates calendar events for session reviews when requested
 */

export interface CalendarEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
}

export class CalendarService {
  /**
   * Generate a calendar event for session review
   * This creates an event scheduled 3 days after the session date
   */
  static generateSessionReviewEvent(sessionData: {
    sessionTitle: string;
    sessionDate: string;
    coachName: string;
    videoId: number;
  }): CalendarEvent {
    const sessionDate = new Date(sessionData.sessionDate);
    
    // Schedule review 3 days after the session
    const reviewDate = new Date(sessionDate);
    reviewDate.setDate(reviewDate.getDate() + 3);
    
    // Set review time to 9:00 AM
    reviewDate.setHours(9, 0, 0, 0);
    
    // 30-minute duration
    const endDate = new Date(reviewDate);
    endDate.setMinutes(endDate.getMinutes() + 30);
    
    return {
      title: `Session Review: ${sessionData.sessionTitle}`,
      description: `Review AI feedback and plan improvements for "${sessionData.sessionTitle}" session.
      
Coach: ${sessionData.coachName}
Session Date: ${sessionDate.toLocaleDateString()}
Video ID: ${sessionData.videoId}

Action Items:
- Review AI analysis feedback
- Identify key improvement areas
- Plan next session adjustments
- Update development goals`,
      startDate: reviewDate,
      endDate,
      location: "Coaching Development Review"
    };
  }

  /**
   * Generate iCal format for calendar import
   */
  static generateICalEvent(event: CalendarEvent): string {
    const formatDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const uid = `session-review-${Date.now()}@coachai.app`;
    const dtstamp = formatDate(new Date());

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CoachAI//Session Review//EN
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART:${formatDate(event.startDate)}
DTEND:${formatDate(event.endDate)}
SUMMARY:${event.title}
DESCRIPTION:${event.description.replace(/\n/g, '\\n')}
LOCATION:${event.location || ''}
BEGIN:VALARM
TRIGGER:-PT1H
DESCRIPTION:Session Review Reminder
ACTION:DISPLAY
END:VALARM
END:VEVENT
END:VCALENDAR`;
  }

  /**
   * Generate Google Calendar URL
   */
  static generateGoogleCalendarUrl(event: CalendarEvent): string {
    const formatGoogleDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${formatGoogleDate(event.startDate)}/${formatGoogleDate(event.endDate)}`,
      details: event.description,
      location: event.location || ''
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  /**
   * Generate Outlook Calendar URL
   */
  static generateOutlookCalendarUrl(event: CalendarEvent): string {
    const params = new URLSearchParams({
      subject: event.title,
      startdt: event.startDate.toISOString(),
      enddt: event.endDate.toISOString(),
      body: event.description,
      location: event.location || ''
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  }
}

export default CalendarService;