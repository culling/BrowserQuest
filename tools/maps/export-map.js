#!/usr/bin/env node

/**
 * BrowserQuest Map Export Script
 * Exports map.tmx to both client and server JSON files
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const TMX_FILE = 'tmx/map.tmx';
const TEMP_FILE = 'tmx/map.tmx.json';
const CLIENT_DEST = '../../client/maps/world_client';
const SERVER_DEST = '../../server/maps/world_server.json';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
};

// Helper functions
function printStep(message) {
    console.log(`${colors.yellow}${message}${colors.reset}`);
}

function printSuccess(message) {
    console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function printError(message) {
    console.error(`${colors.red}✗ Error: ${message}${colors.reset}`);
}

function printInfo(message) {
    console.log(`${colors.cyan}${message}${colors.reset}`);
}

function printGray(message) {
    console.log(`${colors.gray}${message}${colors.reset}`);
}

// Execute command and return promise
function execCommand(command, args = []) {
    return new Promise((resolve, reject) => {
        const process = spawn(command, args, { 
            stdio: 'pipe',
            shell: true
        });
        
        let stdout = '';
        let stderr = '';
        
        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        process.on('close', (code) => {
            if (code === 0) {
                resolve({ stdout, stderr });
            } else {
                reject(new Error(`Command failed with code ${code}: ${stderr || stdout}`));
            }
        });
    });
}

// Cleanup function
function cleanup() {
    try {
        if (fs.existsSync(TEMP_FILE)) {
            fs.unlinkSync(TEMP_FILE);
        }
    } catch (error) {
        console.warn(`Warning: Could not remove temporary file: ${TEMP_FILE}`);
    }
}

// Main export function
async function exportMap() {
    try {
        // Change to script directory
        process.chdir(__dirname);
        
        printInfo('=== BrowserQuest Map Export ===');
        printGray(`TMX Source: ${TMX_FILE}`);
        
        // Check if TMX file exists
        if (!fs.existsSync(TMX_FILE)) {
            throw new Error(`TMX file not found: ${TMX_FILE}`);
        }
        
        // Parse command line arguments
        const args = process.argv.slice(2);
        const skipClient = args.includes('--skip-client');
        const skipServer = args.includes('--skip-server');
        
        if (args.includes('--help') || args.includes('-h')) {
            console.log('\nUsage: node export-map.js [OPTIONS]');
            console.log('\nExport BrowserQuest map from TMX to client and server JSON files');
            console.log('\nOptions:');
            console.log('  --skip-client    Skip client map export (export server only)');
            console.log('  --skip-server    Skip server map export (export client only)');
            console.log('  --help, -h       Show this help message');
            console.log('\nExamples:');
            console.log('  node export-map.js                    # Export both client and server maps');
            console.log('  node export-map.js --skip-client      # Export server map only');
            console.log('  node export-map.js --skip-server      # Export client map only');
            return;
        }
        
        // Step 1: Convert TMX to JSON
        printStep('\n[1/4] Converting TMX to JSON...');
        await execCommand('python', ['tmx2json.py', TMX_FILE, TEMP_FILE]);
        printSuccess('TMX converted to JSON');
        
        // Step 2: Export Client Map
        if (!skipClient) {
            printStep('\n[2/4] Exporting client map...');
            await execCommand('node', ['exportmap.js', TEMP_FILE, CLIENT_DEST, 'client']);
            printSuccess(`Client map exported: ${CLIENT_DEST}.json and ${CLIENT_DEST}.js`);
        } else {
            printGray('\n[2/4] Skipping client map export');
        }
        
        // Step 3: Export Server Map
        if (!skipServer) {
            printStep('\n[3/4] Exporting server map...');
            await execCommand('node', ['exportmap.js', TEMP_FILE, SERVER_DEST, 'server']);
            printSuccess(`Server map exported: ${SERVER_DEST}`);
        } else {
            printGray('\n[3/4] Skipping server map export');
        }
        
        // Step 4: Cleanup
        printStep('\n[4/4] Cleaning up...');
        cleanup();
        printSuccess('Temporary files cleaned up');
        
        // Summary
        printInfo('\n=== Export Complete ===');
        
        if (!skipClient && !skipServer) {
            printSuccess('Both client and server maps exported successfully!');
            console.log('\nNext steps:');
            printGray('1. Restart the game server to load updated map:');
            printInfo('   npm run stop && npm run dev');
        } else if (!skipServer) {
            printSuccess('Server map exported successfully!');
            console.log('\nNext steps:');
            printGray('1. Restart the game server to load updated map:');
            printInfo('   npm run stop && npm run start-server');
        } else {
            printSuccess('Client map exported successfully!');
            console.log('\nNext steps:');
            printGray('1. Refresh browser to load updated client map');
        }
        
    } catch (error) {
        printError(error.message);
        cleanup();
        process.exit(1);
    }
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\nExport interrupted by user');
    cleanup();
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    printError(`Uncaught exception: ${error.message}`);
    cleanup();
    process.exit(1);
});

// Run the export
exportMap();