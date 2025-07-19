import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface ComprehensiveReport {
  executiveSummary: string;
  detailedAnalysis: {
    communicationExcellence: AnalysisSection;
    technicalInstruction: AnalysisSection;
    playerEngagement: AnalysisSection;
    sessionManagement: AnalysisSection;
  };
  professionalDevelopmentPlan: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    researchResources: string[];
  };
  benchmarkComparison: {
    industryStandards: string;
    professionalGrade: string;
    improvementPotential: string;
  };
}

interface AnalysisSection {
  strengths: string[];
  developmentAreas: string[];
  claudeInsights: string[];
  researchEvidence: string[];
  practicalRecommendations: string[];
}

interface SessionData {
  title: string;
  date: string;
  duration: number;
  overallScore: number;
  communicationScore: number;
  engagementScore: number;
  instructionScore: number;
  coachName: string;
  comprehensiveReport: ComprehensiveReport;
}

export class PDFReportGenerator {
  private doc: PDFDocument;
  private currentY: number = 0;
  private pageMargin = 50;
  private pageWidth = 595.28 - (2 * this.pageMargin); // A4 width minus margins

  constructor() {
    this.doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: this.pageMargin,
        bottom: this.pageMargin,
        left: this.pageMargin,
        right: this.pageMargin
      }
    });
    this.currentY = this.pageMargin;
  }

  async generateCoachingReport(sessionData: SessionData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      this.doc.on('data', (chunk) => chunks.push(chunk));
      this.doc.on('end', () => resolve(Buffer.concat(chunks)));
      this.doc.on('error', reject);

      try {
        this.generateReportContent(sessionData);
        this.doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private generateReportContent(sessionData: SessionData) {
    this.addHeader(sessionData);
    this.addExecutiveSummary(sessionData);
    this.addScoresSummary(sessionData);
    this.addDetailedAnalysis(sessionData);
    this.addProfessionalDevelopmentPlan(sessionData);
    this.addBenchmarkComparison(sessionData);
    this.addFooter();
  }

  private addHeader(sessionData: SessionData) {
    // Main title
    this.doc.fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#1e40af')
      .text('COMPREHENSIVE COACHING ANALYSIS REPORT', this.pageMargin, this.currentY);
    
    this.currentY += 35;
    
    // Session information
    this.doc.fontSize(12)
      .font('Helvetica')
      .fillColor('#374151');
    
    const sessionInfo = [
      `Session: ${sessionData.title}`,
      `Coach: ${sessionData.coachName}`,
      `Date: ${sessionData.date}`,
      `Duration: ${Math.round(sessionData.duration)} minutes`,
      `Overall Score: ${sessionData.overallScore}/100`
    ];
    
    sessionInfo.forEach((info, index) => {
      this.doc.text(info, this.pageMargin, this.currentY + (index * 15));
    });
    
    this.currentY += 100;
    
    // Divider line
    this.doc.strokeColor('#e5e7eb')
      .lineWidth(1)
      .moveTo(this.pageMargin, this.currentY)
      .lineTo(this.pageMargin + this.pageWidth, this.currentY)
      .stroke();
    
    this.currentY += 20;
  }

  private addExecutiveSummary(sessionData: SessionData) {
    this.addSectionHeader('Executive Summary', '#059669');
    
    this.doc.fontSize(10)
      .font('Helvetica')
      .fillColor('#374151')
      .text(sessionData.comprehensiveReport.executiveSummary, this.pageMargin, this.currentY, {
        width: this.pageWidth,
        align: 'justify'
      });
    
    this.currentY += 80;
  }

  private addScoresSummary(sessionData: SessionData) {
    this.addSectionHeader('Performance Metrics', '#dc2626');
    
    const scores = [
      { label: 'Overall Performance', score: sessionData.overallScore },
      { label: 'Communication Excellence', score: sessionData.communicationScore },
      { label: 'Player Engagement', score: sessionData.engagementScore },
      { label: 'Technical Instruction', score: sessionData.instructionScore }
    ];
    
    scores.forEach((metric, index) => {
      const yPos = this.currentY + (index * 20);
      
      // Score bar background
      this.doc.rect(this.pageMargin, yPos + 5, 200, 8)
        .fillColor('#e5e7eb')
        .fill();
      
      // Score bar fill
      const fillWidth = (metric.score / 100) * 200;
      const color = metric.score >= 80 ? '#059669' : metric.score >= 60 ? '#d97706' : '#dc2626';
      this.doc.rect(this.pageMargin, yPos + 5, fillWidth, 8)
        .fillColor(color)
        .fill();
      
      // Score text
      this.doc.fontSize(9)
        .font('Helvetica')
        .fillColor('#374151')
        .text(`${metric.label}: ${metric.score}/100`, this.pageMargin + 210, yPos + 2);
    });
    
    this.currentY += 100;
  }

  private addDetailedAnalysis(sessionData: SessionData) {
    this.addSectionHeader('Detailed Multi-AI Analysis', '#7c3aed');
    
    const sections = [
      { title: 'Communication Excellence', data: sessionData.comprehensiveReport.detailedAnalysis.communicationExcellence },
      { title: 'Technical Instruction', data: sessionData.comprehensiveReport.detailedAnalysis.technicalInstruction },
      { title: 'Player Engagement', data: sessionData.comprehensiveReport.detailedAnalysis.playerEngagement },
      { title: 'Session Management', data: sessionData.comprehensiveReport.detailedAnalysis.sessionManagement }
    ];
    
    sections.forEach((section) => {
      this.checkPageBreak(150);
      this.addSubSectionHeader(section.title);
      
      this.addAnalysisSubSection('Key Strengths', section.data.strengths, '#059669');
      this.addAnalysisSubSection('Development Areas', section.data.developmentAreas, '#dc2626');
      this.addAnalysisSubSection('Pedagogical Insights (Claude AI)', section.data.claudeInsights, '#7c3aed');
      this.addAnalysisSubSection('Research Evidence (Perplexity)', section.data.researchEvidence, '#0891b2');
      this.addAnalysisSubSection('Practical Recommendations', section.data.practicalRecommendations, '#059669');
      
      this.currentY += 15;
    });
  }

  private addProfessionalDevelopmentPlan(sessionData: SessionData) {
    this.checkPageBreak(200);
    this.addSectionHeader('Professional Development Plan', '#ea580c');
    
    const plan = sessionData.comprehensiveReport.professionalDevelopmentPlan;
    
    this.addAnalysisSubSection('Immediate Actions (Next 2 weeks)', plan.immediate, '#dc2626');
    this.addAnalysisSubSection('Short-term Goals (Next 3 months)', plan.shortTerm, '#d97706');
    this.addAnalysisSubSection('Long-term Development (Next 12 months)', plan.longTerm, '#059669');
    this.addAnalysisSubSection('Research Resources', plan.researchResources, '#7c3aed');
  }

  private addBenchmarkComparison(sessionData: SessionData) {
    this.checkPageBreak(100);
    this.addSectionHeader('Professional Benchmarking', '#1e40af');
    
    const benchmark = sessionData.comprehensiveReport.benchmarkComparison;
    
    this.doc.fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#374151')
      .text('Industry Standards:', this.pageMargin, this.currentY);
    
    this.currentY += 15;
    
    this.doc.fontSize(9)
      .font('Helvetica')
      .text(benchmark.industryStandards, this.pageMargin, this.currentY, {
        width: this.pageWidth,
        align: 'justify'
      });
    
    this.currentY += 30;
    
    this.doc.fontSize(9)
      .font('Helvetica-Bold')
      .text(`Professional Grade: ${benchmark.professionalGrade}`, this.pageMargin, this.currentY);
    
    this.currentY += 20;
    
    this.doc.fontSize(9)
      .font('Helvetica')
      .text(benchmark.improvementPotential, this.pageMargin, this.currentY, {
        width: this.pageWidth,
        align: 'justify'
      });
    
    this.currentY += 30;
  }

  private addFooter() {
    const footerY = 770; // Near bottom of A4 page
    
    this.doc.fontSize(8)
      .font('Helvetica')
      .fillColor('#9ca3af')
      .text('Generated by CoachAI - Multi-AI Coaching Analysis Platform', this.pageMargin, footerY)
      .text(`Report generated on ${new Date().toLocaleDateString()}`, this.pageMargin, footerY + 12);
    
    // Add AI sources
    this.doc.text('Analysis powered by: OpenAI GPT-4 • Anthropic Claude • Perplexity Research AI', this.pageMargin, footerY + 24);
  }

  private addSectionHeader(title: string, color: string) {
    this.checkPageBreak(60);
    
    this.doc.fontSize(14)
      .font('Helvetica-Bold')
      .fillColor(color)
      .text(title, this.pageMargin, this.currentY);
    
    this.currentY += 25;
  }

  private addSubSectionHeader(title: string) {
    this.doc.fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#374151')
      .text(title, this.pageMargin, this.currentY);
    
    this.currentY += 20;
  }

  private addAnalysisSubSection(title: string, items: string[], color: string) {
    if (!items || items.length === 0) return;
    
    this.checkPageBreak(60);
    
    this.doc.fontSize(9)
      .font('Helvetica-Bold')
      .fillColor(color)
      .text(`${title}:`, this.pageMargin, this.currentY);
    
    this.currentY += 15;
    
    items.forEach((item, index) => {
      this.checkPageBreak(20);
      
      this.doc.fontSize(9)
        .font('Helvetica')
        .fillColor('#374151')
        .text(`• ${item}`, this.pageMargin + 15, this.currentY, {
          width: this.pageWidth - 15,
          align: 'left'
        });
      
      this.currentY += 15;
    });
    
    this.currentY += 5;
  }

  private checkPageBreak(requiredSpace: number) {
    if (this.currentY + requiredSpace > 750) { // Near bottom of page
      this.doc.addPage();
      this.currentY = this.pageMargin;
    }
  }
}

export async function generatePDFReport(sessionData: SessionData): Promise<Buffer> {
  const generator = new PDFReportGenerator();
  return await generator.generateCoachingReport(sessionData);
}