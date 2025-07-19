import jsPDF from 'jspdf';
import { Video, Feedback } from '@shared/schema';

interface PDFExportData {
  video: Video;
  feedback: any;
  userInfo?: {
    name?: string;
    username: string;
  };
}

export function exportFeedbackToPDF(data: PDFExportData) {
  const { video, feedback, userInfo } = data;
  const doc = new jsPDF();
  
  // Modern color palette
  const colors = {
    primary: [16, 185, 129], // Emerald
    secondary: [59, 130, 246], // Blue
    accent: [139, 92, 246], // Purple
    dark: [17, 24, 39], // Gray-900
    medium: [75, 85, 99], // Gray-600
    light: [156, 163, 175], // Gray-400
    background: [249, 250, 251], // Gray-50
    white: [255, 255, 255]
  };
  
  let yPosition = 30;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  // Helper functions
  function checkPageBreak(requiredSpace = 30) {
    if (yPosition + requiredSpace > pageHeight - 30) {
      addPageFooter();
      doc.addPage();
      addPageHeader();
      yPosition = 50;
      return true;
    }
    return false;
  }
  
  function addPageHeader() {
    // Modern header with gradient
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // Brand logo area
    doc.setFillColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.circle(25, 17.5, 8, 'F');
    doc.setFontSize(14);
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text('AI', 23, 21);
    
    // Header title
    doc.setFontSize(18);
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.text('CoachAI Performance Analysis Report', 40, 22);
  }
  
  function addPageFooter() {
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.text(`Generated on ${new Date().toLocaleDateString()} • CoachAI Platform`, margin, footerY);
    doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pageWidth - 30, footerY);
  }
  
  function addSectionHeader(title: string, color = colors.primary) {
    checkPageBreak(25);
    
    // Modern section header with colored background
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(margin - 5, yPosition - 5, contentWidth + 10, 18, 'F');
    
    doc.setFontSize(12);
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.text(title, margin, yPosition + 6);
    yPosition += 23;
  }
  
  function addContent(title: string, content: string) {
    if (!content) return;
    
    checkPageBreak(20);
    
    // Content title
    doc.setFontSize(10);
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.text(title, margin, yPosition);
    yPosition += 6;
    
    // Content text
    doc.setFontSize(9);
    doc.setTextColor(colors.medium[0], colors.medium[1], colors.medium[2]);
    const lines = doc.splitTextToSize(content, contentWidth - 10);
    doc.text(lines, margin + 5, yPosition);
    yPosition += lines.length * 3.5 + 8;
  }
  
  function addScoreBar(label: string, score: number, maxScore = 10) {
    checkPageBreak(12);
    
    const barWidth = 80;
    const barHeight = 6;
    const scorePercent = Math.min(score / maxScore, 1);
    
    // Label and score
    doc.setFontSize(9);
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.text(label, margin, yPosition);
    doc.text(`${score}/${maxScore}`, margin + 110, yPosition);
    
    // Background bar
    doc.setFillColor(230, 230, 230);
    doc.rect(margin, yPosition + 2, barWidth, barHeight, 'F');
    
    // Score bar with color coding
    const barColor = scorePercent >= 0.8 ? colors.primary : scorePercent >= 0.6 ? [251, 191, 36] : [239, 68, 68];
    doc.setFillColor(barColor[0], barColor[1], barColor[2]);
    doc.rect(margin, yPosition + 2, barWidth * scorePercent, barHeight, 'F');
    
    yPosition += 14;
  }

  // Start document
  addPageHeader();
  
  // Session overview card
  checkPageBreak(35);
  doc.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
  doc.rect(margin, yPosition, contentWidth, 30, 'F');
  
  // Session title
  doc.setFontSize(14);
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.text(video.title, margin + 8, yPosition + 10);
  
  // Session details
  doc.setFontSize(8);
  doc.setTextColor(colors.medium[0], colors.medium[1], colors.medium[2]);
  doc.text(`Coach: ${userInfo?.name || userInfo?.username || 'Unknown'}`, margin + 8, yPosition + 17);
  doc.text(`Duration: ${Math.floor((video.duration || 0) / 60)}:${Math.floor((video.duration || 0) % 60).toString().padStart(2, '0')}`, margin + 8, yPosition + 22);
  doc.text(`Upload Date: ${video.createdAt ? new Date(video.createdAt).toLocaleDateString() : 'N/A'}`, margin + 8, yPosition + 27);
  
  // Overall score badge
  const scoreX = pageWidth - 50;
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.circle(scoreX, yPosition + 15, 12, 'F');
  doc.setFontSize(12);
  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.text(String(feedback.overallScore || 'N/A'), scoreX - 4, yPosition + 18);
  doc.setFontSize(6);
  doc.text('Overall Score', scoreX - 10, yPosition + 25);
  
  yPosition += 40;

  // Performance metrics
  addSectionHeader('Performance Metrics', colors.secondary);
  
  if (feedback.communicationScore) addScoreBar('Communication Effectiveness', feedback.communicationScore);
  if (feedback.questioningScore) addScoreBar('Questioning Techniques', feedback.questioningScore);
  if (feedback.engagementScore) addScoreBar('Player Engagement', feedback.engagementScore);
  if (feedback.coachBehaviourScore) addScoreBar('Coach Behaviour', feedback.coachBehaviourScore);
  if (feedback.languageScore) addScoreBar('Language & Communication', feedback.languageScore);
  if (feedback.intendedOutcomesScore) addScoreBar('Intended Outcomes', feedback.intendedOutcomesScore);
  if (feedback.neuroscienceScore) addScoreBar('Neuroscience Application', feedback.neuroscienceScore);

  // Analysis sections
  addSectionHeader('Session Analysis', colors.primary);
  addContent('Key Information', feedback.keyInfo);
  addContent('Session Summary', feedback.summary);

  addSectionHeader('Questioning Techniques', colors.accent);
  addContent('Questioning Analysis', feedback.questioningAnalysis);
  addContent('Questioning Feedback', feedback.questioningFeedback);

  addSectionHeader('Language & Communication', colors.secondary);
  addContent('Communication Analysis', feedback.languageAnalysis);
  addContent('Communication Style', feedback.communicationStyle);

  addSectionHeader('Coach Behaviours', colors.primary);
  addContent('Behavioural Analysis', feedback.coachBehaviours);
  addContent('Interpersonal Skills', feedback.interpersonalSkills);

  addSectionHeader('Player Engagement', colors.accent);
  addContent('Engagement Analysis', feedback.playerEngagement);
  addContent('Engagement Strategies', feedback.engagementStrategies);

  addSectionHeader('Intended Outcomes', colors.secondary);
  addContent('Outcomes Analysis', feedback.intendedOutcomes);
  addContent('Alignment Assessment', feedback.outcomesAlignment);

  addSectionHeader('Neuroscience Research', colors.primary);
  addContent('Neuroscience Insights', feedback.neuroscienceInsights);
  addContent('Motor Learning Principles', feedback.motorLearning);
  addContent('Cognitive Load Assessment', feedback.cognitiveLoad);

  // Strengths and improvements
  addSectionHeader('Strengths & Development Areas', colors.accent);
  
  let strengths = [];
  let improvements = [];
  
  try {
    strengths = typeof feedback.strengths === 'string' && feedback.strengths
      ? JSON.parse(feedback.strengths) 
      : (feedback.strengths || []);
  } catch (error) {
    strengths = [];
  }
  
  try {
    improvements = typeof feedback.improvements === 'string' && feedback.improvements
      ? JSON.parse(feedback.improvements) 
      : (feedback.improvements || []);
  } catch (error) {
    improvements = [];
  }
  
  if (strengths.length > 0) {
    checkPageBreak(15);
    doc.setFontSize(10);
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text('Key Strengths:', margin, yPosition);
    yPosition += 8;
    
    strengths.forEach((strength: string) => {
      checkPageBreak(6);
      doc.setFontSize(8);
      doc.setTextColor(colors.medium[0], colors.medium[1], colors.medium[2]);
      const lines = doc.splitTextToSize(`• ${strength}`, contentWidth - 10);
      doc.text(lines, margin + 5, yPosition);
      yPosition += lines.length * 3 + 2;
    });
    yPosition += 5;
  }
  
  if (improvements.length > 0) {
    checkPageBreak(15);
    doc.setFontSize(10);
    doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
    doc.text('Areas for Development:', margin, yPosition);
    yPosition += 8;
    
    improvements.forEach((improvement: string) => {
      checkPageBreak(6);
      doc.setFontSize(8);
      doc.setTextColor(colors.medium[0], colors.medium[1], colors.medium[2]);
      const lines = doc.splitTextToSize(`• ${improvement}`, contentWidth - 10);
      doc.text(lines, margin + 5, yPosition);
      yPosition += lines.length * 3 + 2;
    });
    yPosition += 5;
  }

  // Recommendations
  addSectionHeader('Development Recommendations', colors.primary);
  addContent('Personalized Recommendations', feedback.recommendations);
  addContent('Action Plan', feedback.actionPlan);

  // Academic citations
  addSectionHeader('Academic Research Framework', colors.secondary);
  
  const academicContent = feedback.academicCitations || `This analysis incorporates established coaching research frameworks:

• Vygotsky's Zone of Proximal Development (1978) - skill progression analysis
• Bandura's Social Learning Theory (1977) - observational learning assessment
• Schön's Reflective Practice (1983) - coaching reflection evaluation
• Ericsson's Deliberate Practice (2008) - skill development pathways
• Self-Determination Theory (Deci & Ryan, 2000) - motivation analysis
• Achievement Goal Theory (Nicholls, 1984) - goal orientation assessment
• Motor Learning Principles (Schmidt & Lee, 2019) - skill acquisition
• Cognitive Load Theory (Sweller, 1988) - information processing
• Transformational Leadership (Bass & Riggio, 2006) - leadership assessment`;
  
  addContent('Research Foundation', academicContent);

  // Footer
  addPageFooter();
  
  // Generate and download
  const date = new Date().toISOString().split('T')[0];
  const reportFilename = `CoachAI_Report_${video.title.replace(/[^a-zA-Z0-9]/g, '_')}_${date}.pdf`;
  doc.save(reportFilename);
}