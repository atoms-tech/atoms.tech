#!/usr/bin/env node
/*
  Centralized data access guard
  - Fails if UI code imports supabaseBrowser/server directly
  - Fails if UI code references `.supabase` usage outside atoms-api or supabase adapters
*/
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const SRC = path.join(root, 'src');
const ALLOW_DIRS = [
    path.join(SRC, 'lib', 'atoms-api'),
    path.join(SRC, 'lib', 'supabase'),
];

const bannedImports = ['@/lib/supabase/supabaseBrowser', '@/lib/supabase/supabaseServer'];

const bannedPatterns = [
    /\.supabase\b/, // any `.supabase` field usage (e.g., (api as any).supabase)
];

/** Return true if file path is under allowed dirs */
function isAllowed(file) {
    const p = path.resolve(file);
    return ALLOW_DIRS.some((dir) => p.startsWith(dir + path.sep));
}

function walk(dir) {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.next') || entry.name === 'node_modules') continue;
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            out.push(...walk(p));
        } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
            out.push(p);
        }
    }
    return out;
}

const files = walk(SRC);
const errors = [];

for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    if (!isAllowed(file)) {
        // Check banned imports in UI code
        for (const imp of bannedImports) {
            if (src.includes(`from '${imp}'`) || src.includes(`from \"${imp}\"`)) {
                errors.push(
                    `${file}: direct import of ${imp} is not allowed. Use atomsApiClient/server.`,
                );
            }
        }
        // Check banned patterns like `.supabase`
        for (const rx of bannedPatterns) {
            if (rx.test(src)) {
                errors.push(
                    `${file}: found usage matching ${rx}. Use atoms-api domain methods instead.`,
                );
            }
        }
    }
}

if (errors.length) {
    console.error('\nCentralized data access violations:\n');
    for (const e of errors) console.error(' - ' + e);
    process.exit(1);
} else {
    console.log('Centralized usage check: OK');
}
