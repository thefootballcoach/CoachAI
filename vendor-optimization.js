#!/usr/bin/env node

/**
 * Vendor optimization script to analyze and optimize third-party dependencies
 * Identifies opportunities to reduce bundle size through better import strategies
 */

import { promises as fs } from 'fs';
import path from 'path';

// Heavy libraries that commonly cause bundle bloat
const HEAVY_LIBRARIES = {
  'moment': {
    size: '67KB',
    alternative: 'date-fns (smaller, tree-shakeable)',
    imports: ['moment', 'moment/locale/*']
  },
  'lodash': {
    size: '69KB',
    alternative: 'Individual lodash functions or native JS',
    imports: ['lodash', 'lodash/*']
  },
  'recharts': {
    size: '400KB+',
    alternative: 'Chart.js or lightweight alternatives',
    imports: ['recharts']
  },
  'framer-motion': {
    size: '180KB',
    alternative: 'CSS animations or react-spring',
    imports: ['framer-motion']
  },
  '@radix-ui': {
    size: '200KB+',
    alternative: 'Individual component packages',
    imports: ['@radix-ui/*']
  }
};

// Optimization strategies
const OPTIMIZATION_STRATEGIES = {
  treeShaking: {
    description: 'Use named imports instead of default imports',
    examples: [
      'import { format } from "date-fns" instead of import dateFns from "date-fns"',
      'import { debounce } from "lodash" instead of import _ from "lodash"'
    ]
  },
  
  lazyLoading: {
    description: 'Load heavy components only when needed',
    examples: [
      'const Chart = lazy(() => import("./Chart"))',
      'Dynamic imports for route components'
    ]
  },
  
  codesplitting: {
    description: 'Split vendor code into separate chunks',
    examples: [
      'Manual chunks in build configuration',
      'Route-based splitting'
    ]
  },
  
  alternatives: {
    description: 'Replace heavy libraries with lighter alternatives',
    examples: [
      'date-fns instead of moment',
      'native JS instead of lodash utilities'
    ]
  }
};

async function analyzeVendorUsage() {
  console.log('🔍 Analyzing vendor library usage...');
  
  try {
    const packageJson = JSON.parse(await fs.readFile('./package.json', 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const analysis = {
      heavyLibraries: [],
      optimizationOpportunities: [],
      totalEstimatedSize: 0,
      recommendations: []
    };
    
    // Analyze each dependency
    for (const [name, version] of Object.entries(dependencies)) {
      if (HEAVY_LIBRARIES[name]) {
        const lib = HEAVY_LIBRARIES[name];
        analysis.heavyLibraries.push({
          name,
          version,
          estimatedSize: lib.size,
          alternative: lib.alternative
        });
        
        // Estimate size (rough calculation)
        const sizeNum = parseInt(lib.size.replace(/[^\d]/g, ''));
        analysis.totalEstimatedSize += sizeNum;
      }
      
      // Check for packages that could be optimized
      await analyzePackageUsage(name, analysis);
    }
    
    // Generate recommendations
    analysis.recommendations = generateVendorRecommendations(analysis);
    
    // Output results
    console.log('\n📊 Vendor Analysis Results:');
    console.log(`Total dependencies: ${Object.keys(dependencies).length}`);
    console.log(`Heavy libraries found: ${analysis.heavyLibraries.length}`);
    console.log(`Estimated total size of heavy libs: ~${analysis.totalEstimatedSize}KB`);
    
    if (analysis.heavyLibraries.length > 0) {
      console.log('\n🚨 Heavy Libraries Detected:');
      analysis.heavyLibraries.forEach(lib => {
        console.log(`  ${lib.name}@${lib.version}: ${lib.estimatedSize}`);
        console.log(`    Alternative: ${lib.alternative}`);
      });
    }
    
    if (analysis.recommendations.length > 0) {
      console.log('\n💡 Optimization Recommendations:');
      analysis.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec.title}`);
        console.log(`     Impact: ${rec.impact}`);
        console.log(`     Effort: ${rec.effort}`);
        console.log(`     Details: ${rec.description}`);
        console.log('');
      });
    }
    
    // Save detailed report
    await fs.writeFile('./vendor-analysis.json', JSON.stringify(analysis, null, 2));
    console.log('📋 Detailed vendor analysis saved to vendor-analysis.json');
    
    return analysis;
    
  } catch (error) {
    console.error('❌ Vendor analysis failed:', error);
    throw error;
  }
}

/**
 * Analyze how a specific package is used in the codebase
 */
async function analyzePackageUsage(packageName, analysis) {
  try {
    // Find all imports of this package
    const srcFiles = await findFiles('./client/src', ['.tsx', '.ts']);
    const serverFiles = await findFiles('./server', ['.ts']);
    const allFiles = [...srcFiles, ...serverFiles];
    
    let usageCount = 0;
    let importTypes = [];
    
    for (const file of allFiles) {
      const content = await fs.readFile(file, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach(line => {
        if (line.includes(`from "${packageName}"`) || line.includes(`from '${packageName}'`)) {
          usageCount++;
          
          // Analyze import type
          if (line.includes('import *')) {
            importTypes.push('namespace');
          } else if (line.includes('import {')) {
            importTypes.push('named');
          } else if (line.includes('import ')) {
            importTypes.push('default');
          }
        }
      });
    }
    
    if (usageCount > 0) {
      // Determine if this package could be optimized
      const hasNamespaceImports = importTypes.includes('namespace');
      const hasDefaultImports = importTypes.includes('default');
      
      if (hasNamespaceImports || (hasDefaultImports && HEAVY_LIBRARIES[packageName])) {
        analysis.optimizationOpportunities.push({
          package: packageName,
          usageCount,
          importTypes: [...new Set(importTypes)],
          reason: hasNamespaceImports ? 'namespace imports prevent tree shaking' : 'default imports from heavy library',
          suggestion: 'Use named imports for better tree shaking'
        });
      }
    }
    
  } catch (error) {
    // Silently continue if package analysis fails
  }
}

/**
 * Find files with specific extensions
 */
async function findFiles(dir, extensions) {
  const files = [];
  
  try {
    async function scan(currentDir) {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory() && !entry.name.includes('node_modules')) {
          await scan(fullPath);
        } else if (extensions.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    }
    
    await scan(dir);
  } catch (error) {
    // Directory might not exist, continue
  }
  
  return files;
}

/**
 * Generate specific vendor optimization recommendations
 */
function generateVendorRecommendations(analysis) {
  const recommendations = [];
  
  // Recommend alternatives for heavy libraries
  analysis.heavyLibraries.forEach(lib => {
    recommendations.push({
      title: `Consider replacing ${lib.name} with ${lib.alternative}`,
      impact: 'High',
      effort: 'Medium',
      description: `${lib.name} adds ${lib.estimatedSize} to your bundle. ${lib.alternative} could reduce this significantly.`,
      category: 'library-replacement'
    });
  });
  
  // Recommend import optimizations
  analysis.optimizationOpportunities.forEach(opp => {
    recommendations.push({
      title: `Optimize ${opp.package} imports`,
      impact: 'Medium',
      effort: 'Low',
      description: `${opp.reason}. Found ${opp.usageCount} imports that could be optimized.`,
      category: 'import-optimization'
    });
  });
  
  // General recommendations based on analysis
  if (analysis.totalEstimatedSize > 500) {
    recommendations.push({
      title: 'Implement aggressive code splitting',
      impact: 'High',
      effort: 'High',
      description: 'Your heavy libraries total over 500KB. Consider route-based code splitting and lazy loading.',
      category: 'code-splitting'
    });
  }
  
  if (analysis.heavyLibraries.length > 3) {
    recommendations.push({
      title: 'Audit library necessity',
      impact: 'High',
      effort: 'Medium',
      description: 'You have many heavy libraries. Review if all are necessary or if lighter alternatives exist.',
      category: 'library-audit'
    });
  }
  
  return recommendations.sort((a, b) => {
    const impactOrder = { High: 3, Medium: 2, Low: 1 };
    const effortOrder = { Low: 3, Medium: 2, High: 1 };
    
    const aScore = impactOrder[a.impact] + effortOrder[a.effort];
    const bScore = impactOrder[b.impact] + effortOrder[b.effort];
    
    return bScore - aScore;
  });
}

/**
 * Generate optimized import suggestions
 */
async function generateImportOptimizations() {
  console.log('🔧 Generating import optimization suggestions...');
  
  const suggestions = {
    'lodash': [
      'Replace: import _ from "lodash"',
      'With: import { debounce, throttle } from "lodash"',
      'Or better: Use native JS alternatives'
    ],
    'date-fns': [
      'Good: import { format, parseISO } from "date-fns"',
      'Avoid: import * as dateFns from "date-fns"'
    ],
    'recharts': [
      'Use lazy loading for chart components',
      'Load only needed chart types',
      'Consider chart.js for smaller bundles'
    ],
    '@radix-ui': [
      'Import individual component packages',
      'Avoid importing the entire UI library',
      'Use tree-shaking friendly imports'
    ]
  };
  
  console.log('\n🎯 Import Optimization Suggestions:');
  Object.entries(suggestions).forEach(([lib, tips]) => {
    console.log(`\n${lib}:`);
    tips.forEach(tip => console.log(`  • ${tip}`));
  });
  
  return suggestions;
}

// Run analysis if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeVendorUsage().then(() => {
    return generateImportOptimizations();
  });
}

export { analyzeVendorUsage, generateImportOptimizations };