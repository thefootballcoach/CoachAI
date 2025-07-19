#!/usr/bin/env node

/**
 * Import optimization script to analyze and optimize import statements
 * This helps identify and fix issues causing large bundle sizes
 */

import { promises as fs } from 'fs';
import path from 'path';

// Common problematic imports that should be tree-shakeable
const OPTIMIZATION_PATTERNS = {
  // Lodash - often imported incorrectly
  lodash: {
    problematic: ['import _ from "lodash"', 'import * as _ from "lodash"'],
    optimized: 'import { specific } from "lodash/specific"'
  },
  
  // Date libraries
  moment: {
    problematic: ['import moment from "moment"'],
    optimized: 'import { format } from "date-fns" // Consider date-fns instead'
  },
  
  // Icon libraries
  icons: {
    problematic: ['import * as Icons from "lucide-react"', 'import { * } from "react-icons/all"'],
    optimized: 'import { SpecificIcon } from "lucide-react"'
  },
  
  // React components
  react: {
    problematic: ['import * as React from "react"'],
    optimized: 'import { useState, useEffect } from "react"'
  }
};

// Libraries that are known to be large and might need alternatives
const LARGE_LIBRARIES = [
  'moment',
  'lodash',
  'antd',
  'material-ui',
  '@mui/material',
  'react-bootstrap',
  'semantic-ui-react',
  'chart.js',
  'plotly.js'
];

async function analyzeImports() {
  console.log('🔍 Analyzing import statements for optimization opportunities...');
  
  const srcPath = './client/src';
  const issues = [];
  const suggestions = [];
  
  try {
    const files = await findTSXFiles(srcPath);
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf8');
      const fileIssues = analyzeFileImports(file, content);
      issues.push(...fileIssues);
    }
    
    // Generate optimization report
    const report = generateOptimizationReport(issues);
    
    console.log('\n📊 Import Analysis Report:');
    console.log(`Files analyzed: ${files.length}`);
    console.log(`Potential issues found: ${issues.length}`);
    
    if (issues.length > 0) {
      console.log('\n⚠️  Optimization Opportunities:');
      issues.forEach(issue => {
        console.log(`  ${issue.file}:${issue.line}`);
        console.log(`    Issue: ${issue.description}`);
        console.log(`    Current: ${issue.code}`);
        if (issue.suggestion) {
          console.log(`    Suggest: ${issue.suggestion}`);
        }
        console.log('');
      });
    }
    
    // Write detailed report
    await fs.writeFile('./optimization-report.json', JSON.stringify(report, null, 2));
    console.log('📋 Detailed report saved to optimization-report.json');
    
    return report;
    
  } catch (error) {
    console.error('❌ Import analysis failed:', error);
    throw error;
  }
}

/**
 * Analyze imports in a single file
 */
function analyzeFileImports(filePath, content) {
  const issues = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Skip comments and empty lines
    if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) {
      return;
    }
    
    // Check for import statements
    if (trimmedLine.startsWith('import')) {
      
      // Check for problematic patterns
      for (const [library, patterns] of Object.entries(OPTIMIZATION_PATTERNS)) {
        patterns.problematic.forEach(problematic => {
          if (trimmedLine.includes(problematic.split('"')[1])) {
            issues.push({
              file: path.relative('.', filePath),
              line: index + 1,
              code: trimmedLine,
              type: 'inefficient-import',
              library,
              description: `Inefficient import from ${library}`,
              suggestion: patterns.optimized
            });
          }
        });
      }
      
      // Check for large library imports
      LARGE_LIBRARIES.forEach(lib => {
        if (trimmedLine.includes(`"${lib}"`) || trimmedLine.includes(`'${lib}'`)) {
          // Check if it's a wildcard import
          if (trimmedLine.includes('import *') || trimmedLine.includes('import ')) {
            issues.push({
              file: path.relative('.', filePath),
              line: index + 1,
              code: trimmedLine,
              type: 'large-library',
              library: lib,
              description: `Importing from large library ${lib}`,
              suggestion: `Consider importing only specific functions from ${lib}`
            });
          }
        }
      });
      
      // Check for default imports that could be specific
      if (trimmedLine.match(/import\s+\w+\s+from\s+["'][@\w\/-]+["']/)) {
        const match = trimmedLine.match(/from\s+["']([@\w\/-]+)["']/);
        if (match) {
          const importPath = match[1];
          
          // Flag UI library default imports
          if (importPath.includes('@radix-ui') || 
              importPath.includes('@chakra-ui') ||
              importPath.includes('antd')) {
            issues.push({
              file: path.relative('.', filePath),
              line: index + 1,
              code: trimmedLine,
              type: 'ui-library-import',
              library: importPath,
              description: 'UI library import - ensure tree shaking works',
              suggestion: 'Verify this import supports tree shaking'
            });
          }
        }
      }
    }
  });
  
  return issues;
}

/**
 * Find all TypeScript/TSX files
 */
async function findTSXFiles(dir) {
  const files = [];
  
  async function scan(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory() && !entry.name.includes('node_modules')) {
        await scan(fullPath);
      } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  }
  
  await scan(dir);
  return files;
}

/**
 * Generate comprehensive optimization report
 */
function generateOptimizationReport(issues) {
  const byType = {};
  const byLibrary = {};
  const byFile = {};
  
  issues.forEach(issue => {
    // Group by type
    if (!byType[issue.type]) byType[issue.type] = [];
    byType[issue.type].push(issue);
    
    // Group by library
    if (issue.library) {
      if (!byLibrary[issue.library]) byLibrary[issue.library] = [];
      byLibrary[issue.library].push(issue);
    }
    
    // Group by file
    if (!byFile[issue.file]) byFile[issue.file] = [];
    byFile[issue.file].push(issue);
  });
  
  return {
    summary: {
      totalIssues: issues.length,
      issueTypes: Object.keys(byType).length,
      affectedLibraries: Object.keys(byLibrary).length,
      affectedFiles: Object.keys(byFile).length
    },
    byType,
    byLibrary,
    byFile,
    recommendations: generateRecommendations(byType, byLibrary)
  };
}

/**
 * Generate specific recommendations based on analysis
 */
function generateRecommendations(byType, byLibrary) {
  const recommendations = [];
  
  // Recommendations by issue type
  if (byType['inefficient-import']) {
    recommendations.push({
      priority: 'high',
      category: 'import-optimization',
      title: 'Replace inefficient imports with specific imports',
      description: 'Found imports that could benefit from tree shaking',
      count: byType['inefficient-import'].length
    });
  }
  
  if (byType['large-library']) {
    recommendations.push({
      priority: 'medium',
      category: 'bundle-size',
      title: 'Optimize large library imports',
      description: 'Consider alternatives or more specific imports for large libraries',
      count: byType['large-library'].length
    });
  }
  
  // Recommendations by library
  Object.entries(byLibrary).forEach(([library, issues]) => {
    if (issues.length > 3) {
      recommendations.push({
        priority: 'medium',
        category: 'library-usage',
        title: `Review ${library} usage`,
        description: `Multiple potential issues with ${library} imports`,
        count: issues.length
      });
    }
  });
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

// Run analysis if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeImports();
}

export { analyzeImports };