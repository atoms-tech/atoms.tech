#!/usr/bin/env node

/**
 * Type File Optimization Script
 * This script splits large TypeScript type files into smaller chunks
 * to prevent PackFileCacheStrategy warnings about large string serialization
 */

const fs = require('fs');
const path = require('path');

const LARGE_FILE_THRESHOLD = 50 * 1024; // 50KB
const CHUNK_SIZE = 20 * 1024; // 20KB per chunk

function optimizeTypeFile(filePath) {
    console.log(`Analyzing ${filePath}...`);

    const content = fs.readFileSync(filePath, 'utf8');

    if (content.length < LARGE_FILE_THRESHOLD) {
        console.log(`File is small enough (${content.length} bytes), skipping.`);
        return;
    }

    console.log(`File is large (${content.length} bytes), optimizing...`);

    // Split into logical chunks
    const chunks = splitTypeDefinitions(content);

    if (chunks.length <= 1) {
        console.log('Could not split file effectively, skipping.');
        return;
    }

    // Create chunk files
    const baseDir = path.dirname(filePath);
    const baseName = path.basename(filePath, '.ts');

    chunks.forEach((chunk, index) => {
        const chunkPath = path.join(baseDir, `${baseName}.part${index}.ts`);
        fs.writeFileSync(chunkPath, chunk);
        console.log(`Created chunk: ${chunkPath} (${chunk.length} bytes)`);
    });

    // Create index file that exports all chunks
    const indexContent = generateIndexFile(baseName, chunks.length);
    const indexPath = path.join(baseDir, `${baseName}.index.ts`);
    fs.writeFileSync(indexPath, indexContent);
    console.log(`Created index file: ${indexPath}`);

    // Backup original file
    const backupPath = `${filePath}.backup`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`Backed up original to: ${backupPath}`);

    // Replace original with index
    fs.writeFileSync(filePath, `export * from './${baseName}.index';\n`);
    console.log(`Updated original file to re-export from index`);
}

function splitTypeDefinitions(content) {
    const lines = content.split('\n');
    const chunks = [];
    let currentChunk = [];
    let currentSize = 0;
    let inInterface = false;
    let braceCount = 0;

    // Keep imports and exports together
    const imports = lines.filter(
        (line) =>
            line.trim().startsWith('import') ||
            line.trim().startsWith('export type Json'),
    );
    const exports = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineSize = line.length + 1; // +1 for newline

        // Track interface/type boundaries
        if (line.includes('export type') || line.includes('export interface')) {
            // If we're starting a new definition and current chunk is getting large
            if (currentSize > CHUNK_SIZE && currentChunk.length > 0) {
                chunks.push([...imports, ...currentChunk].join('\n'));
                currentChunk = [];
                currentSize = 0;
            }
            inInterface = true;
            braceCount = 0;
        }

        // Count braces to track end of interface
        if (inInterface) {
            const openBraces = (line.match(/{/g) || []).length;
            const closeBraces = (line.match(/}/g) || []).length;
            braceCount += openBraces - closeBraces;

            if (braceCount <= 0 && line.includes('}')) {
                inInterface = false;
            }
        }

        currentChunk.push(line);
        currentSize += lineSize;

        // Split at end of interface/type definition if chunk is large enough
        if (!inInterface && currentSize > CHUNK_SIZE && currentChunk.length > 10) {
            chunks.push([...imports, ...currentChunk].join('\n'));
            currentChunk = [];
            currentSize = 0;
        }
    }

    // Add remaining lines to last chunk
    if (currentChunk.length > 0) {
        chunks.push([...imports, ...currentChunk].join('\n'));
    }

    return chunks;
}

function generateIndexFile(baseName, chunkCount) {
    const exports = [];

    for (let i = 0; i < chunkCount; i++) {
        exports.push(`export * from './${baseName}.part${i}';`);
    }

    return exports.join('\n') + '\n';
}

// Main execution
const typeFiles = [
    './src/types/base/database.types.ts',
    // Add other large type files here
];

console.log('Starting type file optimization...');

typeFiles.forEach((filePath) => {
    if (fs.existsSync(filePath)) {
        try {
            optimizeTypeFile(filePath);
        } catch (error) {
            console.error(`Error optimizing ${filePath}:`, error.message);
        }
    } else {
        console.log(`File not found: ${filePath}`);
    }
});

console.log('Type file optimization complete!');
