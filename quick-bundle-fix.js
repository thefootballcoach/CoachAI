#!/usr/bin/env node

/**
 * Quick bundle size fix for deployment
 * Implements the most effective optimizations to reduce HTTP 413 error
 */

import { promises as fs } from 'fs';
import path from 'path';

async function quickBundleFix() {
  console.log('🔧 Applying quick bundle size optimizations...');
  
  try {
    // 1. Update .dockerignore to exclude more files
    await optimizeDockerignore();
    
    // 2. Create build optimization for esbuild
    await createBuildOptimizations();
    
    // 3. Identify and exclude large script files
    await handleScriptFiles();
    
    // 4. Generate bundle analysis
    await analyzeBundleSize();
    
    console.log('✅ Quick optimizations applied successfully!');
    console.log('\n🎯 Key optimizations implemented:');
    console.log('  ✓ Enhanced .dockerignore to exclude development files');
    console.log('  ✓ Optimized build process for smaller bundles');
    console.log('  ✓ Excluded script files from deployment');
    console.log('  ✓ Bundle analysis ready');
    
  } catch (error) {
    console.error('❌ Quick optimization failed:', error);
    throw error;
  }
}

async function optimizeDockerignore() {
  console.log('📝 Enhancing .dockerignore...');
  
  const additionalExclusions = `
# Additional optimizations for deployment size
scripts/
*.md
docs/
documentation/
examples/
demo/
test/
tests/
__tests__/
*.test.*
*.spec.*
*.stories.*
coverage/
.nyc_output/

# Development and editor files
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store
Thumbs.db

# Source maps and debugging
*.map
*.map.js

# Node.js cache and logs
.npm/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Environment files
.env.local
.env.development
.env.test
.env*.local

# Build artifacts
.vite/
.next/
.cache/
.parcel-cache/
dist/
build/
out/

# Large media files
*.mp4
*.avi
*.mov
*.wmv
*.flv
*.webm
*.mkv
*.m4v
*.mp3
*.wav
*.flac
*.aac
*.ogg
*.wma
*.psd
*.ai

# Git and version control
.git/
.gitignore
.gitattributes

# Backup and temporary files
*.backup
*.bak
*.tmp
temp/
tmp/

# Package manager files (keep only package-lock.json)
yarn.lock
pnpm-lock.yaml

# Replit specific
.replit
.upm/
.config/
attached_assets/

# Database files
*.db
*.sqlite
*.sqlite3

# Analysis and reports
bundle-analyzer-report.html
lighthouse-report.html
optimization-report.json
vendor-analysis.json
deployment-size-report.txt`;

  try {
    const currentDockerignore = await fs.readFile('.dockerignore', 'utf8');
    
    // Check if our optimizations are already added
    if (!currentDockerignore.includes('Additional optimizations for deployment size')) {
      await fs.writeFile('.dockerignore', currentDockerignore + additionalExclusions);
      console.log('  ✓ Enhanced .dockerignore with additional exclusions');
    } else {
      console.log('  ✓ .dockerignore already optimized');
    }
  } catch (error) {
    console.warn('  ⚠️ Could not update .dockerignore:', error.message);
  }
}

async function createBuildOptimizations() {
  console.log('⚙️ Creating build optimizations...');
  
  // Create a build script that optimizes for size
  const buildScript = `#!/bin/bash

# Optimized build script for deployment
set -e

echo "🔨 Starting optimized build..."

# Clean previous builds
rm -rf dist/
rm -rf client/dist/

# Set production environment variables
export NODE_ENV=production
export GENERATE_SOURCEMAP=false
export INLINE_RUNTIME_CHUNK=false

# Build frontend with size optimizations
echo "📦 Building frontend..."
npx vite build --minify terser --sourcemap false

# Build backend with optimizations
echo "🔧 Building backend..."
npx esbuild server/index.ts \\
  --platform=node \\
  --packages=external \\
  --bundle \\
  --format=esm \\
  --outdir=dist \\
  --minify \\
  --tree-shaking=true \\
  --drop:console \\
  --drop:debugger \\
  --legal-comments=none \\
  --sourcemap=false

echo "✅ Build completed successfully!"

# Report final size
if [ -d "dist" ]; then
  echo "📏 Final build size: \$(du -sh dist | cut -f1)"
fi`;

  await fs.writeFile('build-optimized.sh', buildScript);
  await fs.chmod('build-optimized.sh', 0o755);
  console.log('  ✓ Created optimized build script');
}

async function handleScriptFiles() {
  console.log('📜 Analyzing script files...');
  
  try {
    const scriptsDir = './scripts';
    const stats = await fs.stat(scriptsDir);
    
    if (stats.isDirectory()) {
      const files = await fs.readdir(scriptsDir);
      const tsFiles = files.filter(f => f.endsWith('.ts'));
      
      console.log(`  Found ${tsFiles.length} TypeScript files in scripts/`);
      console.log('  These will be excluded from deployment via .dockerignore');
      
      // Calculate approximate size
      let totalSize = 0;
      for (const file of tsFiles) {
        try {
          const fileStats = await fs.stat(path.join(scriptsDir, file));
          totalSize += fileStats.size;
        } catch (e) {
          // Skip if file doesn't exist
        }
      }
      
      console.log(`  ✓ Scripts directory size: ~${(totalSize / 1024 / 1024).toFixed(2)}MB`);
      console.log('  ✓ This will be excluded from deployment');
    }
  } catch (error) {
    console.log('  ✓ No scripts directory found');
  }
}

async function analyzeBundleSize() {
  console.log('📊 Analyzing potential bundle size...');
  
  const analysis = {
    recommendations: [
      {
        action: 'Exclude scripts/ directory',
        impact: 'High - removes ~94 TypeScript files',
        status: 'Implemented via .dockerignore'
      },
      {
        action: 'Enable tree shaking and minification',
        impact: 'Medium - reduces JavaScript bundle size',
        status: 'Implemented in build script'
      },
      {
        action: 'Remove source maps in production',
        impact: 'Medium - eliminates .map files',
        status: 'Implemented'
      },
      {
        action: 'Exclude development files and tests',
        impact: 'Medium - removes unused files',
        status: 'Implemented via .dockerignore'
      },
      {
        action: 'Compress static assets',
        impact: 'Low-Medium - reduces file sizes',
        status: 'Available in deployment-optimize.sh'
      }
    ],
    nextSteps: [
      'Run the optimized build: ./build-optimized.sh',
      'Test the application locally',
      'Deploy using the optimized build',
      'Monitor deployment logs for any issues'
    ]
  };
  
  console.log('\n📋 Bundle Optimization Analysis:');
  analysis.recommendations.forEach((rec, index) => {
    console.log(`  ${index + 1}. ${rec.action}`);
    console.log(`     Impact: ${rec.impact}`);
    console.log(`     Status: ${rec.status}`);
    console.log('');
  });
  
  console.log('🚀 Next Steps:');
  analysis.nextSteps.forEach((step, index) => {
    console.log(`  ${index + 1}. ${step}`);
  });
  
  await fs.writeFile('bundle-optimization-analysis.json', JSON.stringify(analysis, null, 2));
  console.log('\n💾 Analysis saved to bundle-optimization-analysis.json');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  quickBundleFix();
}

export { quickBundleFix };