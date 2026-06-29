/**
 * Image LRU cache (Phase 5)
 * - SHA1 hash key (16 chars)
 * - LRU eviction (oldest mtime)
 * - max-size 500MB
 * - Cached at ./output/.cache/{hash}.bin
 */
import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync,
         statSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';

const CACHE_DIR = join(process.cwd(), 'output', '.cache');
const MAX_SIZE_MB = 500;

export function hashKey(s: string): string {
  return createHash('sha1').update(s).digest('hex').slice(0, 16);
}

export function cachePath(key: string): string {
  return join(CACHE_DIR, `${key}.bin`);
}

export function readCache(key: string): Buffer | null {
  const p = cachePath(key);
  return existsSync(p) ? readFileSync(p) : null;
}

export function writeCache(key: string, data: Buffer): void {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cachePath(key), data);
  enforceMaxSize();
}

export function dirSize(): number {
  if (!existsSync(CACHE_DIR)) return 0;
  return readdirSync(CACHE_DIR).reduce((sum, f) =>
    sum + statSync(join(CACHE_DIR, f)).size, 0) / (1024 * 1024);
}

export function enforceMaxSize(): void {
  if (!existsSync(CACHE_DIR)) return;
  while (dirSize() > MAX_SIZE_MB) {
    const files = readdirSync(CACHE_DIR).map(f => ({
      p: join(CACHE_DIR, f),
      mtime: statSync(join(CACHE_DIR, f)).mtimeMs
    })).sort((a, b) => a.mtime - b.mtime);
    if (files.length === 0) break;
    unlinkSync(files[0].p);
  }
}

export const __TESTING__ = { CACHE_DIR, MAX_SIZE_MB };
