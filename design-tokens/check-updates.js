#!/usr/bin/env node
/**
 * Design Token Update Checker
 * 
 * Compares local design tokens with source tokens to detect changes
 * and alert when tokens need to be updated.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOKEN_FILES = ['Desktop.tokens.json', 'Tablet.tokens.json', 'Mobile.tokens.json'];
const SOURCE_DIR = '/Users/whittenb/Downloads/C1 _ Breakpoint 2';
const LOCAL_DIR = __dirname;
const CHECKSUMS_FILE = path.join(__dirname, '.token-checksums.json');

/**
 * Calculate MD5 checksum of a file
 */
function calculateChecksum(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return crypto.createHash('md5').update(content).digest('hex');
  } catch (error) {
    return null;
  }
}

/**
 * Load saved checksums from file
 */
function loadSavedChecksums() {
  try {
    const content = fs.readFileSync(CHECKSUMS_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return {};
  }
}

/**
 * Save checksums to file
 */
function saveChecksums(checksums) {
  fs.writeFileSync(CHECKSUMS_FILE, JSON.stringify(checksums, null, 2), 'utf8');
}

/**
 * Compare token counts between files
 */
function compareTokenCounts(file1, file2) {
  try {
    const content1 = JSON.parse(fs.readFileSync(file1, 'utf8'));
    const content2 = JSON.parse(fs.readFileSync(file2, 'utf8'));
    
    const count1 = countTokens(content1);
    const count2 = countTokens(content2);
    
    return { local: count1, source: count2, diff: count2 - count1 };
  } catch (error) {
    return null;
  }
}

/**
 * Recursively count tokens in an object
 */
function countTokens(obj) {
  let count = 0;
  for (const key in obj) {
    const value = obj[key];
    if (value && typeof value === 'object') {
      if (value.$value !== undefined) {
        count++;
      } else {
        count += countTokens(value);
      }
    }
  }
  return count;
}

/**
 * Get file modification time
 */
function getModifiedTime(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.mtime;
  } catch (error) {
    return null;
  }
}

/**
 * Format date for display
 */
function formatDate(date) {
  if (!date) return 'Unknown';
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Main check function
 */
function checkForUpdates() {
  console.log('🔍 Checking for design token updates...\n');
  
  const savedChecksums = loadSavedChecksums();
  const currentChecksums = {};
  const results = [];
  let hasChanges = false;
  
  for (const file of TOKEN_FILES) {
    const localPath = path.join(LOCAL_DIR, file);
    const sourcePath = path.join(SOURCE_DIR, file);
    
    const localExists = fs.existsSync(localPath);
    const sourceExists = fs.existsSync(sourcePath);
    
    if (!localExists) {
      results.push({
        file,
        status: 'missing',
        message: '❌ Local file missing'
      });
      hasChanges = true;
      continue;
    }
    
    if (!sourceExists) {
      results.push({
        file,
        status: 'warning',
        message: '⚠️  Source file not found'
      });
      continue;
    }
    
    const localChecksum = calculateChecksum(localPath);
    const sourceChecksum = calculateChecksum(sourcePath);
    currentChecksums[file] = localChecksum;
    
    if (localChecksum !== sourceChecksum) {
      const localTime = getModifiedTime(localPath);
      const sourceTime = getModifiedTime(sourcePath);
      const counts = compareTokenCounts(localPath, sourcePath);
      
      results.push({
        file,
        status: 'outdated',
        message: '🔄 Updates available',
        localTime: formatDate(localTime),
        sourceTime: formatDate(sourceTime),
        counts
      });
      hasChanges = true;
    } else {
      results.push({
        file,
        status: 'current',
        message: '✅ Up to date'
      });
    }
  }
  
  // Display results
  console.log('Status Report:\n');
  for (const result of results) {
    console.log(`${result.file}`);
    console.log(`  ${result.message}`);
    
    if (result.status === 'outdated') {
      console.log(`  Local:  ${result.localTime}`);
      console.log(`  Source: ${result.sourceTime}`);
      if (result.counts) {
        console.log(`  Tokens: ${result.counts.local} local, ${result.counts.source} source (${result.counts.diff > 0 ? '+' : ''}${result.counts.diff})`);
      }
    }
    console.log('');
  }
  
  // Summary
  if (hasChanges) {
    console.log('⚠️  ACTION REQUIRED: Run the following command to update tokens:');
    console.log('   npm run tokens:update\n');
    process.exit(1);
  } else {
    console.log('✨ All design tokens are up to date!\n');
    saveChecksums(currentChecksums);
    process.exit(0);
  }
}

// Run the check
try {
  checkForUpdates();
} catch (error) {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
}
