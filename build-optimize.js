#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { gzip, brotliCompress } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const brotliAsync = promisify(brotliCompress);

/**
 * Build optimization script to reduce deployment size
 * This script runs additional optimizations after the main build
 */

async function optimizeBuild() {
  console.log('🔧 Starting build optimization...');
  
  const distPath = './dist';
  const publicPath = path.join(distPath, 'public');
  
  try {
    // 1. Compress static assets
    await compressAssets(publicPath);
    
    // 2. Remove source maps in production
    await removeSourceMaps(publicPath);
    
    // 3. Clean up unnecessary files
    await cleanupFiles(distPath);
    
    // 4. Generate file size report
    await generateSizeReport(distPath);
    
    console.log('✅ Build optimization completed successfully!');
    
  } catch (error) {
    console.error('❌ Build optimization failed:', error);
    process.exit(1);
  }
}

/**
 * Compress static assets with gzip and brotli
 */
async function compressAssets(publicPath) {
  console.log('📦 Compressing static assets...');
  
  try {
    const files = await findFiles(publicPath, ['.js', '.css', '.html', '.svg']);
    
    for (const file of files) {
      const content = await fs.readFile(file);
      
      // Skip if file is too small to benefit from compression
      if (content.length < 1024) continue;
      
      // Create gzip version
      const gzipContent = await gzipAsync(content, { level: 9 });
      await fs.writeFile(file + '.gz', gzipContent);
      
      // Create brotli version (better compression)
      const brotliContent = await brotliAsync(content, {
        params: {
          [require('zlib').constants.BROTLI_PARAM_QUALITY]: 11,
          [require('zlib').constants.BROTLI_PARAM_SIZE_HINT]: content.length
        }
      });
      await fs.writeFile(file + '.br', brotliContent);
      
      const originalSize = content.length;
      const gzipSize = gzipContent.length;
      const brotliSize = brotliContent.length;
      
      console.log(`  ${path.basename(file)}: ${formatBytes(originalSize)} → gz:${formatBytes(gzipSize)} br:${formatBytes(brotliSize)}`);
    }
  } catch (error) {
    console.warn('⚠️  Asset compression failed:', error.message);
  }
}

/**
 * Remove source maps in production builds
 */
async function removeSourceMaps(publicPath) {
  console.log('🗑️  Removing source maps...');
  
  try {
    const sourceMapFiles = await findFiles(publicPath, ['.map']);
    
    for (const file of sourceMapFiles) {
      await fs.unlink(file);
      console.log(`  Removed: ${path.basename(file)}`);
    }
  } catch (error) {
    console.warn('⚠️  Source map removal failed:', error.message);
  }
}

/**
 * Clean up unnecessary files
 */
async function cleanupFiles(distPath) {
  console.log('🧹 Cleaning up unnecessary files...');
  
  const filesToRemove = [
    '**/*.test.js',
    '**/*.spec.js',
    '**/*.test.ts',
    '**/*.spec.ts',
    '**/README.md',
    '**/.DS_Store',
    '**/Thumbs.db'
  ];
  
  // This is a simplified cleanup - in a real scenario you'd use a glob library
  try {
    // Remove any remaining test files or documentation
    const allFiles = await findFiles(distPath, ['.js', '.ts', '.md']);
    
    for (const file of allFiles) {
      const basename = path.basename(file);
      if (basename.includes('.test.') || basename.includes('.spec.') || basename === 'README.md') {
        await fs.unlink(file);
        console.log(`  Removed: ${basename}`);
      }
    }
  } catch (error) {
    console.warn('⚠️  File cleanup failed:', error.message);
  }
}

/**
 * Generate a size report
 */
async function generateSizeReport(distPath) {
  console.log('📊 Generating size report...');
  
  try {
    const report = await analyzeDirectory(distPath);
    console.log('\n📋 Build Size Report:');
    console.log(`Total size: ${formatBytes(report.totalSize)}`);
    console.log(`Number of files: ${report.fileCount}`);
    console.log(`Largest files:`);
    
    report.largestFiles
      .slice(0, 10)
      .forEach(file => {
        console.log(`  ${file.name}: ${formatBytes(file.size)}`);
      });
      
    // Write report to file
    await fs.writeFile(
      path.join(distPath, 'build-report.json'),
      JSON.stringify(report, null, 2)
    );
    
  } catch (error) {
    console.warn('⚠️  Size report generation failed:', error.message);
  }
}

/**
 * Recursively find files with specific extensions
 */
async function findFiles(dir, extensions) {
  const files = [];
  
  async function scan(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  await scan(dir);
  return files;
}

/**
 * Analyze directory size and contents
 */
async function analyzeDirectory(dir) {
  const files = [];
  let totalSize = 0;
  
  async function scan(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        files.push({
          name: path.relative(dir, fullPath),
          size: stats.size
        });
        totalSize += stats.size;
      }
    }
  }
  
  await scan(dir);
  
  // Sort by size descending
  files.sort((a, b) => b.size - a.size);
  
  return {
    totalSize,
    fileCount: files.length,
    largestFiles: files,
    averageSize: files.length > 0 ? totalSize / files.length : 0
  };
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run optimization if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  optimizeBuild();
}

export { optimizeBuild };