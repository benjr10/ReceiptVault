/**
 * Design Token Converter
 * =====================
 * Reads design-tokens.tokens.json (Figma export via Lukas Oppermann plugin)
 * and converts them into CSS custom properties.
 *
 * COLOR STRATEGY
 * - Primitive colors (key colors + palettes) are output as internal reference
 *   variables prefixed with --_primitive-* so they are available for aliasing
 *   but clearly marked as NOT for direct UI consumption.
 * - Color roles are the public-facing API for the UI. They resolve their
 *   Figma alias references (e.g. "{primitive color collection.color palletes.primary.primary90}")
 *   to the matching primitive CSS variable via var().
 *
 * TYPOGRAPHY STRATEGY
 * - Both the "font" (composite styles) and "typography" (broken-out properties)
 *   sections are converted. The "font" section produces composite shorthand
 *   variables; the "typography" section produces individual property variables.
 *
 * Usage:  node convert-tokens.js
 * Output: ../Src/design-tokens.css  (relative to this script)
 */

const fs   = require('fs');
const path = require('path');

// ──────────────────────────────────────────────
// Paths
// ──────────────────────────────────────────────
const INPUT_PATH  = path.resolve(__dirname, '..', 'docs', 'design-tokens.tokens.json');
const OUTPUT_PATH = path.resolve(__dirname, 'design-tokens.css');

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/**
 * Convert a human-readable token name to a kebab-case CSS variable fragment.
 * "primary key color" → "primary-key-color"
 * "primary90"         → "primary90"
 */
function toKebab(str) {
  return str
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

/**
 * Resolve a Figma alias string like
 *   "{primitive color collection.color palletes.primary.primary90}"
 * into a CSS var() reference pointing at the corresponding --_primitive-* variable.
 *
 * Returns the var() string, or null if the value is not an alias.
 */
function resolveAlias(value, primitiveVarMap) {
  if (typeof value !== 'string') return null;

  const aliasMatch = value.match(/^\{(.+)\}$/);
  if (!aliasMatch) return null;

  const aliasPath = aliasMatch[1]; // e.g. "primitive color collection.color palletes.primary.primary90"

  // Build the lookup key the same way we built primitive var names
  const segments = aliasPath.split('.').map(s => toKebab(s));
  const lookupKey = segments.join('.');

  if (primitiveVarMap[lookupKey]) {
    return `var(${primitiveVarMap[lookupKey]})`;
  }

  // If we can't resolve, return the raw value as a comment + fallback
  return null;
}

/**
 * Append a px unit to numeric dimension values.
 */
function dimValue(val) {
  if (typeof val === 'number') return `${val}px`;
  return val;
}

// ──────────────────────────────────────────────
// Main conversion logic
// ──────────────────────────────────────────────

function convert() {
  const raw = fs.readFileSync(INPUT_PATH, 'utf-8');
  const tokens = JSON.parse(raw);

  const lines = [];           // final CSS lines
  const primitiveVarMap = {}; // lookupKey → CSS var name  (for alias resolution)

  // ════════════════════════════════════════════
  //  1.  PRIMITIVE COLORS  (internal reference)
  // ════════════════════════════════════════════
  const primitives = tokens['primitive color collection'];
  if (primitives) {
    lines.push('  /* ═══════════════════════════════════════════════════════');
    lines.push('     PRIMITIVE COLORS (internal reference — do NOT use directly in UI)');
    lines.push('     ═══════════════════════════════════════════════════════ */');
    lines.push('');

    // --- Key colors ---
    const keyColors = primitives['key colors'];
    if (keyColors) {
      lines.push('  /* — Key Colors — */');
      for (const [name, token] of Object.entries(keyColors)) {
        const varName = `--_primitive-key-${toKebab(name)}`;
        lines.push(`  ${varName}: ${token.value};`);

        // Register for alias resolution
        const lookupKey = `primitive-color-collection.key-colors.${toKebab(name)}`;
        primitiveVarMap[lookupKey] = varName;
      }
      lines.push('');
    }

    // --- Palettes ---
    const palettes = primitives['color palletes'];
    if (palettes) {
      for (const [paletteName, shades] of Object.entries(palettes)) {
        lines.push(`  /* — ${paletteName.charAt(0).toUpperCase() + paletteName.slice(1)} Palette — */`);
        for (const [shadeName, token] of Object.entries(shades)) {
          const varName = `--_primitive-${toKebab(paletteName)}-${toKebab(shadeName)}`;
          lines.push(`  ${varName}: ${token.value};`);

          // Register for alias resolution  (match Figma alias path segments)
          const lookupKey = `primitive-color-collection.color-palletes.${toKebab(paletteName)}.${toKebab(shadeName)}`;
          primitiveVarMap[lookupKey] = varName;
        }
        lines.push('');
      }
    }
  }

  // ════════════════════════════════════════════
  //  2.  COLOR ROLES  (public UI API)
  // ════════════════════════════════════════════
  const colorRoles = tokens['color roles'];
  if (colorRoles) {
    lines.push('  /* ═══════════════════════════════════════════════════════');
    lines.push('     COLOR ROLES (use these in UI components)');
    lines.push('     ═══════════════════════════════════════════════════════ */');
    lines.push('');

    for (const [groupName, group] of Object.entries(colorRoles)) {
      lines.push(`  /* — ${groupName.charAt(0).toUpperCase() + groupName.slice(1)} — */`);

      for (const [roleName, token] of Object.entries(group)) {
        const varName = `--color-${toKebab(roleName)}`;
        const resolved = resolveAlias(token.value, primitiveVarMap);

        if (resolved) {
          // Alias reference → use var() pointing at the primitive
          lines.push(`  ${varName}: ${resolved};`);
        } else {
          // Direct hex value
          lines.push(`  ${varName}: ${token.value};`);
        }
      }
      lines.push('');
    }
  }

  // ════════════════════════════════════════════
  //  3.  TYPOGRAPHY — Composite Font Styles
  // ════════════════════════════════════════════
  const fontStyles = tokens['font'];
  if (fontStyles) {
    lines.push('  /* ═══════════════════════════════════════════════════════');
    lines.push('     TYPOGRAPHY — Composite Font Styles');
    lines.push('     ═══════════════════════════════════════════════════════ */');
    lines.push('');

    for (const [category, styles] of Object.entries(fontStyles)) {
      lines.push(`  /* — ${category.charAt(0).toUpperCase() + category.slice(1)} — */`);

      for (const [styleName, token] of Object.entries(styles)) {
        if (token.type !== 'custom-fontStyle' || !token.value) continue;

        const v    = token.value;
        const base = `--font-${toKebab(category)}-${toKebab(styleName)}`;

        lines.push(`  ${base}-font-family: '${v.fontFamily}', sans-serif;`);
        lines.push(`  ${base}-font-size: ${dimValue(v.fontSize)};`);
        lines.push(`  ${base}-font-weight: ${v.fontWeight};`);
        lines.push(`  ${base}-font-style: ${v.fontStyle};`);
        lines.push(`  ${base}-letter-spacing: ${dimValue(v.letterSpacing)};`);
        lines.push(`  ${base}-line-height: ${dimValue(v.lineHeight)};`);
        lines.push(`  ${base}-text-decoration: ${v.textDecoration};`);
        lines.push(`  ${base}-text-transform: ${v.textCase === 'none' ? 'none' : v.textCase};`);
        lines.push('');
      }
    }
  }

  // ════════════════════════════════════════════
  //  4.  TYPOGRAPHY — Broken-out Properties
  // ════════════════════════════════════════════
  const typography = tokens['typography'];
  if (typography) {
    lines.push('  /* ═══════════════════════════════════════════════════════');
    lines.push('     TYPOGRAPHY — Individual Properties');
    lines.push('     ═══════════════════════════════════════════════════════ */');
    lines.push('');

    for (const [category, styles] of Object.entries(typography)) {
      lines.push(`  /* — ${category.charAt(0).toUpperCase() + category.slice(1)} — */`);

      for (const [styleName, props] of Object.entries(styles)) {
        const base = `--typo-${toKebab(category)}-${toKebab(styleName)}`;

        for (const [propName, propToken] of Object.entries(props)) {
          const cssProperty = toKebab(propName);
          let val = propToken.value;

          // Add units for dimension tokens
          if (propToken.type === 'dimension' && typeof val === 'number') {
            val = `${val}px`;
          }

          // Wrap font family in quotes
          if (cssProperty === 'font-family') {
            val = `'${val}', sans-serif`;
          }

          lines.push(`  ${base}-${cssProperty}: ${val};`);
        }
        lines.push('');
      }
    }
  }

  // ════════════════════════════════════════════
  //  Assemble final file
  // ════════════════════════════════════════════
  const banner = [
    '/*',
    ' * ============================================',
    ' *  ReceiptVault Design Tokens',
    ' *  Auto-generated — do not edit by hand.',
    ` *  Source: docs/design-tokens.tokens.json`,
    ` *  Generated: ${new Date().toISOString()}`,
    ' * ============================================',
    ' *',
    ' *  COLOR USAGE GUIDE:',
    ' *  • --color-*  variables are COLOR ROLES — use these in your UI.',
    ' *  • --_primitive-* variables are internal palette values.',
    ' *    They exist only so color roles can reference them via var().',
    ' *    Never use --_primitive-* directly in component styles.',
    ' *',
    ' *  TYPOGRAPHY USAGE GUIDE:',
    ' *  • --font-*  variables come from composite font style tokens.',
    ' *  • --typo-*  variables come from broken-out typography tokens.',
    ' */',
    '',
  ].join('\n');

  const css = `${banner}:root {\n${lines.join('\n')}\n}\n`;

  fs.writeFileSync(OUTPUT_PATH, css, 'utf-8');
  console.log(`✅  Design tokens converted successfully!`);
  console.log(`    Output: ${OUTPUT_PATH}`);
  console.log(`    Total CSS variables: ~${lines.filter(l => l.includes(':')).length}`);
}

// Run
convert();
