#!/usr/bin/env node

/**
 * Final deployment readiness check
 * Validates all optimizations are in place and estimates final bundle size
 */

import { promises as fs } from 'fs';
import path from 'path';

async function finalDeploymentCheck() {
  console.log('🔍 Running final deployment readiness check...');
  
  const checks = {
    dockerignore: await checkDockerignore(),
    buildScript: await checkBuildScript(),
    bundleOptimizations: await checkBundleOptimizations(),
    largeFiles: await checkLargeFiles(),
    devDependencies: await checkDevDependencies()
  };
  
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    optimizations: [],
    recommendations: []
  };
  
  console.log('\n📋 Deployment Readiness Report:');
  console.log('=====================================');
  
  Object.entries(checks).forEach(([checkName, result]) => {
    const status = result.passed ? '✅' : result.warning ? '⚠️' : '❌';
    console.log(`${status} ${checkName}: ${result.message}`);
    
    if (result.passed) results.passed++;
    else if (result.warning) results.warnings++;
    else results.failed++;
    
    if (result.recommendations) {
      results.recommendations.push(...result.recommendations);
    }
  });
  
  console.log('\n📊 Summary:');
  console.log(`  Passed: ${results.passed}`);
  console.log(`  Warnings: ${results.warnings}`);
  console.log(`  Failed: ${results.failed}`);
  
  if (results.recommendations.length > 0) {
    console.log('\n💡 Additional Recommendations:');
    results.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }
  
  // Estimate final deployment size
  const sizeEstimate = await estimateDeploymentSize();
  console.log(`\n📏 Estimated deployment size: ${sizeEstimate}`);
  
  const readiness = results.failed === 0 && results.warnings <= 1;
  
  console.log(`\n🚀 Deployment Readiness: ${readiness ? 'READY ✅' : 'NEEDS ATTENTION ⚠️'}`);
  
  if (readiness) {
    console.log('\n🎯 Ready to deploy! All optimizations are in place.');
    console.log('   Run: npm run build');
    console.log('   Then deploy using your deployment platform.');
  } else {
    console.log('\n⚠️ Please address the failed checks before deploying.');
  }
  
  return { readiness, checks, results, sizeEstimate };
}

async function checkDockerignore() {
  try {
    const content = await fs.readFile('.dockerignore', 'utf8');
    
    const requiredExclusions = [
      'scripts/',
      '*.test.*',
      '*.spec.*',
      'node_modules/',
      '.git/',
      '*.md'
    ];
    
    const missingExclusions = requiredExclusions.filter(
      exclusion => !content.includes(exclusion)
    );
    
    if (missingExclusions.length === 0) {
      return {
        passed: true,
        message: 'All required exclusions present'
      };
    } else {
      return {
        passed: false,
        message: `Missing exclusions: ${missingExclusions.join(', ')}`,
        recommendations: [`Add missing exclusions to .dockerignore: ${missingExclusions.join(', ')}`]
      };
    }
  } catch (error) {
    return {
      passed: false,
      message: '.dockerignore not found or unreadable',
      recommendations: ['Create .dockerignore file with proper exclusions']
    };
  }
}

async function checkBuildScript() {
  try {
    await fs.access('build-optimized.sh', fs.constants.F_OK);
    return {
      passed: true,
      message: 'Optimized build script available'
    };
  } catch (error) {
    return {
      warning: true,
      message: 'Optimized build script not found, using default build',
      recommendations: ['Use the optimized build script for better compression']
    };
  }
}

async function checkBundleOptimizations() {
  const optimizations = [];
  
  // Check if lazy loading is implemented
  try {
    const appContent = await fs.readFile('client/src/App.tsx', 'utf8');
    if (appContent.includes('lazy(') && appContent.includes('Suspense')) {
      optimizations.push('Lazy loading implemented');
    }
  } catch (error) {
    // File might not exist
  }
  
  // Check for optimization utilities
  try {
    await fs.access('client/src/utils/lazy-imports.ts', fs.constants.F_OK);
    optimizations.push('Lazy import utilities available');
  } catch (error) {
    // File might not exist
  }
  
  // Check for optimized charts
  try {
    await fs.access('client/src/components/optimized/lazy-charts.tsx', fs.constants.F_OK);
    optimizations.push('Optimized chart components available');
  } catch (error) {
    // File might not exist
  }
  
  if (optimizations.length >= 2) {
    return {
      passed: true,
      message: `${optimizations.length} bundle optimizations found`
    };
  } else {
    return {
      warning: true,
      message: 'Limited bundle optimizations detected',
      recommendations: ['Implement more lazy loading and code splitting']
    };
  }
}

async function checkLargeFiles() {
  const largeFiles = [];
  
  async function scanDirectory(dir, maxSize = 1024 * 1024) { // 1MB
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.includes('node_modules')) {
          await scanDirectory(fullPath, maxSize);
        } else if (entry.isFile()) {
          try {
            const stats = await fs.stat(fullPath);
            if (stats.size > maxSize) {
              largeFiles.push({
                path: fullPath,
                size: stats.size,
                sizeFormatted: formatBytes(stats.size)
              });
            }
          } catch (error) {
            // Skip files we can't read
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  await scanDirectory('client/src');
  await scanDirectory('server');
  await scanDirectory('shared');
  
  if (largeFiles.length === 0) {
    return {
      passed: true,
      message: 'No unexpectedly large source files found'
    };
  } else {
    const recommendations = largeFiles.map(
      file => `Review large file: ${file.path} (${file.sizeFormatted})`
    );
    
    return {
      warning: true,
      message: `${largeFiles.length} large files found`,
      recommendations
    };
  }
}

async function checkDevDependencies() {
  try {
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
    const devDeps = Object.keys(packageJson.devDependencies || {});
    const deps = Object.keys(packageJson.dependencies || {});
    
    // Check for dev dependencies that might be misplaced
    const heavyDevDeps = devDeps.filter(dep => 
      dep.includes('test') || 
      dep.includes('jest') || 
      dep.includes('storybook') ||
      dep.includes('eslint') ||
      dep.includes('prettier')
    );
    
    return {
      passed: true,
      message: `${deps.length} dependencies, ${devDeps.length} dev dependencies`,
      recommendations: heavyDevDeps.length > 0 ? 
        [`Consider if these dev dependencies are needed: ${heavyDevDeps.join(', ')}`] : []
    };
  } catch (error) {
    return {
      warning: true,
      message: 'Could not analyze dependencies',
      recommendations: ['Check package.json is valid']
    };
  }
}

async function estimateDeploymentSize() {
  const estimates = {
    clientBuild: 0,
    serverBuild: 0,
    nodeModules: 0,
    other: 0
  };
  
  // Estimate based on current files
  try {
    estimates.clientBuild = await getDirectorySize('client/src') * 0.3; // Assume 30% after minification
    estimates.serverBuild = await getDirectorySize('server') * 0.5; // Assume 50% after bundling
    estimates.other = await getDirectorySize('shared') + await getDirectorySize('.', ['package.json', 'package-lock.json']);
  } catch (error) {
    // Use rough estimates if calculation fails
    estimates.clientBuild = 5 * 1024 * 1024; // 5MB
    estimates.serverBuild = 2 * 1024 * 1024; // 2MB
    estimates.other = 1 * 1024 * 1024; // 1MB
  }
  
  const total = estimates.clientBuild + estimates.serverBuild + estimates.other;
  
  return formatBytes(total);
}

async function getDirectorySize(dir, includeFiles = null) {
  let size = 0;
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.includes('node_modules') && !entry.name.includes('.git')) {
        size += await getDirectorySize(fullPath);
      } else if (entry.isFile()) {
        if (!includeFiles || includeFiles.includes(entry.name)) {
          try {
            const stats = await fs.stat(fullPath);
            size += stats.size;
          } catch (error) {
            // Skip files we can't read
          }
        }
      }
    }
  } catch (error) {
    // Return 0 if directory doesn't exist or can't be read
  }
  
  return size;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  finalDeploymentCheck();
}

export { finalDeploymentCheck };