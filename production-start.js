#!/usr/bin/env node

// Emergency production start script
// Bypasses all deployment issues

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🚀 CoachAI Emergency Production Start');
console.log('=====================================');

// Check if production build exists
const serverPath = path.join(__dirname, 'dist', 'index.js');
if (!fs.existsSync(serverPath)) {
    console.log('⚠️  Building production server...');
    
    // Run the working build script
    const build = spawn('./simple-build.sh', [], { 
        stdio: 'inherit',
        shell: true 
    });
    
    build.on('close', (code) => {
        if (code === 0) {
            console.log('✅ Build complete, starting server...');
            startServer();
        } else {
            console.error('❌ Build failed');
            process.exit(1);
        }
    });
} else {
    console.log('✅ Production build found, starting server...');
    startServer();
}

function startServer() {
    console.log('🌟 Starting CoachAI Production Server...');
    
    // Set production environment
    process.env.NODE_ENV = 'production';
    process.env.PORT = process.env.PORT || '5000';
    
    // Start the server
    const server = spawn('node', [serverPath], {
        stdio: 'inherit',
        env: process.env
    });
    
    server.on('close', (code) => {
        console.log(`Server exited with code ${code}`);
        process.exit(code);
    });
    
    // Handle shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down server...');
        server.kill();
    });
}