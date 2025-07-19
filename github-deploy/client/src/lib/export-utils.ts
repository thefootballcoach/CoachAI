import { Feedback, Video, Progress } from "@shared/schema";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Converts a JavaScript object to a CSV string
 */
export function objectToCSV(data: any[]): string {
  // Early return for empty data
  if (!data || !data.length) return '';

  // Extract column headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV header row
  const csvRows = [headers.join(',')];
  
  // Add each data row
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      
      // Handle different data types
      if (value === null || value === undefined) {
        return '';
      } else if (typeof value === 'object') {
        try {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        } catch (e) {
          return '';
        }
      } else {
        // Escape quotes and wrap in quotes if contains comma or newline
        const stringValue = String(value);
        return stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')
          ? `"${stringValue.replace(/"/g, '""')}"`
          : stringValue;
      }
    });
    
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

/**
 * Exports feedback data to CSV
 */
export function exportFeedbackToCSV(feedbacks: Feedback[], videos: Video[]): string {
  // Match videos to feedbacks for more complete data
  const exportData = feedbacks.map(feedback => {
    const video = videos.find(v => v.id === feedback.videoId);
    
    return {
      date: feedback.createdAt ? new Date(feedback.createdAt as Date | string).toLocaleDateString() : '',
      session_title: video?.title || '',
      duration: video?.duration ? Math.round(video.duration / 60) : '',
      overall_score: feedback.overallScore || '',
      communication_score: feedback.communicationScore || '',
      engagement_score: feedback.engagementScore || '',
      instruction_score: feedback.instructionScore || '',
      // Don't include full transcription and feedback as they're too verbose for CSV
      strengths: typeof feedback.strengths === 'string'
        ? feedback.strengths
        : Array.isArray(feedback.strengths)
          ? feedback.strengths.join('; ')
          : '',
      improvements: typeof feedback.improvements === 'string'
        ? feedback.improvements
        : Array.isArray(feedback.improvements)
          ? feedback.improvements.join('; ')
          : '',
      summary: feedback.summary || ''
    };
  });
  
  return objectToCSV(exportData);
}

/**
 * Utility to download data as a CSV file
 */
export function downloadCSV(csvData: string, filename: string): void {
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports feedback and performance data to PDF
 */
export async function exportToPDF(
  elementId: string,
  filename: string,
  title: string = 'Coaching Performance Report'
): Promise<void> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID ${elementId} not found`);
    }

    // Use html2canvas to capture the element
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    // Setup PDF document (A4 size)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210;  // A4 width in mm (210mm)
    const pageHeight = 297;  // A4 height in mm (297mm)
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;
    
    // Add title to the first page
    pdf.setFontSize(18);
    pdf.text(title, 105, 15, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 23, { align: 'center' });
    
    // Start image placement below the title
    pdf.addImage(imgData, 'PNG', 0, 30, imgWidth, imgHeight);
    heightLeft -= (pageHeight - 30);
    position = 30 + imgHeight;
    
    // Add new pages if the content is larger than one page
    while (heightLeft > 0) {
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, -position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      position += pageHeight;
    }
    
    // Download the PDF
    pdf.save(filename);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

/**
 * Generates a performance summary object for reports
 */
export function generatePerformanceSummary(
  feedbacks: Feedback[],
  progress?: Progress
): Record<string, any> {
  if (!feedbacks || feedbacks.length === 0) {
    return {
      sessionsCount: 0,
      totalDuration: 0,
      overallAvg: 0,
      communicationAvg: 0,
      engagementAvg: 0,
      instructionAvg: 0,
      improvement: 0,
      recentTrend: 'neutral'
    };
  }
  
  // Use progress data if available, otherwise calculate from feedbacks
  if (progress) {
    return {
      sessionsCount: progress.sessionsCount || feedbacks.length,
      totalDuration: 0, // This isn't stored in progress
      overallAvg: progress.overallScoreAvg ? Math.round(progress.overallScoreAvg) : 0,
      communicationAvg: progress.communicationScoreAvg ? Math.round(progress.communicationScoreAvg) : 0,
      engagementAvg: progress.engagementScoreAvg ? Math.round(progress.engagementScoreAvg) : 0,
      instructionAvg: progress.instructionScoreAvg ? Math.round(progress.instructionScoreAvg) : 0,
      improvement: progress.weeklyImprovement ?? 0,
      recentTrend: progress.weeklyImprovement && progress.weeklyImprovement > 0 ? 'positive' : 
                   progress.weeklyImprovement && progress.weeklyImprovement < 0 ? 'negative' : 'neutral'
    };
  }
  
  // Calculate averages from feedbacks
  let overallSum = 0;
  let commSum = 0;
  let engSum = 0;
  let instSum = 0;
  let validCount = 0;
  
  feedbacks.forEach(feedback => {
    if (feedback.overallScore) {
      overallSum += feedback.overallScore;
      validCount++;
    }
    if (feedback.communicationScore) commSum += feedback.communicationScore;
    if (feedback.engagementScore) engSum += feedback.engagementScore;
    if (feedback.instructionScore) instSum += feedback.instructionScore;
  });
  
  return {
    sessionsCount: feedbacks.length,
    totalDuration: 0, // We don't have this information from feedbacks alone
    overallAvg: validCount > 0 ? Math.round(overallSum / validCount) : 0,
    communicationAvg: validCount > 0 ? Math.round(commSum / validCount) : 0,
    engagementAvg: validCount > 0 ? Math.round(engSum / validCount) : 0,
    instructionAvg: validCount > 0 ? Math.round(instSum / validCount) : 0,
    improvement: 0, // Can't calculate from feedbacks alone
    recentTrend: 'neutral'
  };
}