#!/usr/bin/env node

/**
 * Emergency deployment size fix
 * Applies the most critical optimizations to resolve HTTP 413 error
 */

import { promises as fs } from 'fs';

async function emergencyDeploymentFix() {
  console.log('🚨 Applying emergency deployment size fix...');
  
  try {
    // 1. Update .dockerignore with most critical exclusions
    await updateDockerignore();
    
    // 2. Create a minimal build approach
    await createMinimalBuild();
    
    // 3. Provide deployment instructions
    await createDeploymentInstructions();
    
    console.log('✅ Emergency fixes applied!');
    console.log('\n🎯 The key issue was the large number of files being uploaded.');
    console.log('📦 Your optimizations will:');
    console.log('  • Exclude 94 script files (~0.27MB but many files)');
    console.log('  • Exclude all development and test files');
    console.log('  • Exclude documentation and config files');
    console.log('  • Enable minification and compression');
    console.log('\n🚀 Try deploying again with these optimizations.');
    
  } catch (error) {
    console.error('❌ Emergency fix failed:', error);
    throw error;
  }
}

async function updateDockerignore() {
  console.log('📝 Updating .dockerignore with critical exclusions...');
  
  // The most critical exclusions to reduce file count and size
  const criticalExclusions = `
# CRITICAL DEPLOYMENT SIZE OPTIMIZATIONS
# These exclusions significantly reduce deployment size

# Development scripts (94 files)
scripts/
*.ts
!server/index.ts
!shared/**/*.ts

# Test and development files
**/*.test.*
**/*.spec.*
**/*.stories.*
test/
tests/
__tests__/
coverage/
.nyc_output/

# Documentation and config
*.md
!README.md
docs/
documentation/
examples/
demo/

# Development tools and cache
.vscode/
.idea/
.cache/
.vite/
.next/
node_modules/.cache/
npm-debug.log*
yarn-debug.log*

# Source maps (large files)
**/*.map

# Environment files
.env.local
.env.development
.env.test
.env*.local

# Git and version control
.git/
.gitignore
.gitattributes

# OS files
.DS_Store
Thumbs.db
*.swp
*.swo

# Build artifacts
dist/
build/
out/

# Package manager files (keep only one)
yarn.lock
pnpm-lock.yaml

# Replit specific
.replit
.upm/
.config/
attached_assets/

# Large media samples (if any)
*.mp4
*.avi
*.mov
*.mp3
*.wav
*.psd
*.ai

# Backup files
*.backup
*.bak
*.tmp
temp/
tmp/

# Analysis reports
*-report.*
*-analysis.*
optimization-*.json
bundle-*.json
`;

  try {
    const currentContent = await fs.readFile('.dockerignore', 'utf8');
    
    // Only update if our critical exclusions aren't already there
    if (!currentContent.includes('CRITICAL DEPLOYMENT SIZE OPTIMIZATIONS')) {
      await fs.writeFile('.dockerignore', currentContent + criticalExclusions);
      console.log('  ✓ Added critical exclusions to .dockerignore');
    } else {
      console.log('  ✓ Critical exclusions already present');
    }
  } catch (error) {
    // Create new .dockerignore if it doesn't exist
    await fs.writeFile('.dockerignore', criticalExclusions);
    console.log('  ✓ Created .dockerignore with critical exclusions');
  }
}

async function createMinimalBuild() {
  console.log('🔨 Creating minimal build configuration...');
  
  const minimalBuildScript = `#!/bin/bash

# Minimal build for deployment size optimization
set -e

echo "🔨 Starting minimal production build..."

# Clean previous builds
rm -rf dist/

# Set strict production environment
export NODE_ENV=production
export GENERATE_SOURCEMAP=false

# Build frontend with maximum compression
echo "📦 Building optimized frontend..."
npx vite build --minify terser --sourcemap false

# Build backend with aggressive optimization
echo "🔧 Building optimized backend..."
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
  --sourcemap=false \\
  --analyze=false

# Report size
echo "📏 Build size:"
du -sh dist/

echo "✅ Minimal build completed!"
`;

  await fs.writeFile('build-minimal.sh', minimalBuildScript);
  await fs.chmod('build-minimal.sh', 0o755);
  console.log('  ✓ Created minimal build script');
}

async function createDeploymentInstructions() {
  console.log('📋 Creating deployment instructions...');
  
  const instructions = `# Emergency Deployment Fix - Instructions

## What was fixed:

1. **File Count Reduction**: Excluded 94 TypeScript files from scripts/ directory
2. **Development File Exclusion**: Removed all test, spec, and development files
3. **Documentation Exclusion**: Removed markdown files and documentation
4. **Source Map Removal**: Eliminated .map files from production builds
5. **Cache Exclusion**: Removed all cache directories and temporary files

## Deployment Steps:

1. **Build with optimizations**:
   \`\`\`bash
   ./build-minimal.sh
   \`\`\`

2. **Verify build size**:
   \`\`\`bash
   du -sh dist/
   \`\`\`

3. **Deploy using your platform's deployment command**

## Expected Results:

- Significantly reduced file count in deployment
- Smaller upload size due to exclusions
- Faster deployment process
- Reduced chance of HTTP 413 errors

## If still getting errors:

1. Check that .dockerignore is being used by your deployment platform
2. Verify the build creates only essential files
3. Consider using deployment platform's build optimization features

## File exclusions summary:
- Scripts directory: 94 files excluded
- Test files: All *.test.*, *.spec.* excluded  
- Documentation: All *.md files excluded
- Development tools: .vscode, .idea, caches excluded
- Source maps: All *.map files excluded
- Environment files: Development .env files excluded

The key insight is that the HTTP 413 error is often caused by the total request size (number of files × average file size), not just the total data size.
`;

  await fs.writeFile('DEPLOYMENT-FIX-README.md', instructions);
  console.log('  ✓ Created deployment instructions');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  emergencyDeploymentFix();
}

export { emergencyDeploymentFix };