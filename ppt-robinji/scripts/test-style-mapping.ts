/**
 * Style mapping unit tests (Phase 3)
 * Verifies 5 high-level styles each map to a valid template.
 */
import { pickTemplateByStyle, resolveTemplateId, buildStyleContext, STYLE_FAMILY_MAP } from '../src/pptx/style-mapping.js';
import { getTemplate } from '../src/pptx/templates/index.js';

let pass = 0, fail = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { console.log(`✓ ${msg}`); pass++; }
  else { console.log(`✗ ${msg}`); fail++; }
}

// Test 1: STYLE_FAMILY_MAP has 5 entries
const styles = Object.keys(STYLE_FAMILY_MAP);
assert(styles.length === 5, `STYLE_FAMILY_MAP has 5 styles (got ${styles.length})`);
assert(styles.includes('professional'), 'includes professional');
assert(styles.includes('creative'), 'includes creative');
assert(styles.includes('minimal'), 'includes minimal');
assert(styles.includes('persuasive'), 'includes persuasive');
assert(styles.includes('academic'), 'includes academic');

// Test 2: Each style maps to ≥1 template
for (const style of styles) {
  const tid = pickTemplateByStyle(style);
  const t = getTemplate(tid);
  assert(t !== undefined && t.id !== 'business-classic' || tid === 'business-classic',
    `pickTemplateByStyle('${style}') returns valid template (got ${tid})`);
}

// Test 3: Different seeds → different templates (or same fallback)
const tid0 = pickTemplateByStyle('creative', 0);
const tid1 = pickTemplateByStyle('creative', 1);
console.log(`  info: creative@0=${tid0}, creative@1=${tid1}`);

// Test 4: Unknown style falls back
assert(pickTemplateByStyle('nonexistent-style') === 'business-classic',
  'unknown style falls back to business-classic');

// Test 5: resolveTemplateId priority
assert(resolveTemplateId({ template: 'tech-neon' }) === 'tech-neon', 'template wins over style');
assert(resolveTemplateId({ style: 'creative' }) !== 'business-classic', 'style resolves to non-default');
assert(resolveTemplateId({}) === 'business-classic', 'empty options → business-classic');

// Test 6: buildStyleContext returns non-empty for valid templates
const ctx = buildStyleContext('tech-neon');
assert(ctx.includes('tech-neon'), 'style context includes template id');
assert(ctx.length > 20, `style context has substance (got ${ctx.length} chars)`);

// Test 7: buildStyleContext empty for unknown
assert(buildStyleContext('unknown').includes('business-classic'), 'unknown template falls back to business-classic context');

console.log(`\nTotal: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
