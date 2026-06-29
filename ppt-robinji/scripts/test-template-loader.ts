/**
 * Phase 1 — Loader unit tests
 * Run: tsx scripts/test-template-loader.ts
 */
import { ALL_TEMPLATES, TEMPLATE_MAP, getTemplate, getTemplatesByCategory, getCategories } from '../src/pptx/templates/index.js';

let pass = 0, fail = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { console.log(`\x1b[32m✓\x1b[0m ${msg}`); pass++; }
  else { console.log(`\x1b[31m✗\x1b[0m ${msg}`); fail++; }
}

// Counts
assert(ALL_TEMPLATES.length === 16, `ALL_TEMPLATES.length === 16 (got ${ALL_TEMPLATES.length})`);
assert(Object.keys(TEMPLATE_MAP).length === 16, `TEMPLATE_MAP has 16 entries`);

// Get by id
const t = getTemplate('business-classic');
assert(t.id === 'business-classic', `getTemplate('business-classic').id === 'business-classic'`);

// Fallback
const fallback = getTemplate('nonexistent');
assert(fallback.id === 'business-classic', `getTemplate('nonexistent') falls back to business-classic`);

// Strict mode throws
let threw = false;
try { getTemplate('nonexistent', { strict: true }); } catch { threw = true; }
assert(threw, `getTemplate('nonexistent', { strict: true }) throws`);

// Category queries
const techTemplates = getTemplatesByCategory('tech');
assert(techTemplates.length === 2, `getTemplatesByCategory('tech').length === 2 (got ${techTemplates.length})`);

const categories = getCategories();
assert(categories.length === 10, `getCategories().length === 10 (got ${categories.length})`);
assert(categories.includes('gradient'), `getCategories() includes 'gradient'`);

console.log(`\n\x1b[${fail === 0 ? 32 : 31}mTotal: ${pass} pass, ${fail} fail\x1b[0m`);
process.exit(fail > 0 ? 1 : 0);
