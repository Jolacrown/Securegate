/**
 * generate-tokens.js
 *
 * Converts color-token.json and design-tokens.tokens.json
 * into a single CSS custom-properties file (design-tokens.css).
 *
 * Color roles are resolved to their actual HSL values.
 * Primitive palette values are NOT exposed as CSS variables —
 * only the role-based semantic tokens are output.
 *
 * Usage:  node generate-tokens.js
 */

const fs = require("fs");
const path = require("path");

// ── Paths ──────────────────────────────────────────────────────────
const COLOR_TOKEN_PATH = path.join(__dirname, "color-token.json");
const TYPO_TOKEN_PATH = path.join(__dirname, "design-tokens.tokens.json");
const OUTPUT_PATH = path.join(__dirname, "design-tokens.css");

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Convert a token name like "surfaceContainerHigh" to a CSS variable
 * name like "surface-container-high".
 * Handles camelCase → kebab-case conversion.
 */
function toKebab(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

/**
 * Resolve a reference string like "{color.palette.primary.80}"
 * against the full color token object.
 * Returns the resolved HSL string or null if not found.
 */
function resolveRef(ref, colorData) {
  // Strip the curly braces: "{color.palette.primary.80}" → "color.palette.primary.80"
  const refPath = ref.replace(/^\{|\}$/g, "");
  const parts = refPath.split(".");

  let current = colorData;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return null; // unresolvable
    }
  }

  return typeof current === "string" ? current : null;
}

/**
 * Build a flat lookup from the entire color JSON so references
 * like "{color.key.primary}" can also be resolved.
 */
function buildLookup(obj, prefix = "") {
  const map = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null) {
      Object.assign(map, buildLookup(value, path));
    } else {
      map[path] = value;
    }
  }
  return map;
}

// ── Main ───────────────────────────────────────────────────────────

function main() {
  // 1. Read source files
  const colorData = JSON.parse(fs.readFileSync(COLOR_TOKEN_PATH, "utf-8"));
  const typoData = JSON.parse(fs.readFileSync(TYPO_TOKEN_PATH, "utf-8"));

  // 2. Build a flat lookup of all color values for reference resolution
  const colorLookup = buildLookup(colorData);

  // 3. Collect warnings for unresolvable references
  const warnings = [];

  // ── Resolve color roles ──────────────────────────────────────────
  function resolveRoles(roles, themeName) {
    const lines = [];
    for (const [roleName, refValue] of Object.entries(roles)) {
      const varName = `--color-${toKebab(roleName)}`;

      if (typeof refValue === "string" && refValue.startsWith("{")) {
        const resolved = resolveRef(refValue, colorData);
        if (resolved) {
          lines.push(`  ${varName}: ${resolved};`);
        } else {
          warnings.push(
            `[${themeName}] Could not resolve "${roleName}": ${refValue}`
          );
          lines.push(`  /* ${varName}: unresolved → ${refValue} */`);
        }
      } else {
        // Direct value (not a reference)
        lines.push(`  ${varName}: ${refValue};`);
      }
    }
    return lines;
  }

  const lightRoles = colorData.color.role.light;
  const darkRoles = colorData.color.role.dark;

  const lightLines = resolveRoles(lightRoles, "light");
  const darkLines = resolveRoles(darkRoles, "dark");

  // ── Typography tokens ────────────────────────────────────────────
  // We use the "typography" section (individual properties) as it maps
  // cleanly to CSS custom properties.  The "font" section is a composite
  // duplicate — we skip it to avoid redundancy.

  const typoLines = [];
  const typography = typoData.typography;

  // Mapping of token property → CSS unit (px for dimensions, none for numbers/strings)
  const dimensionUnit = "px";

  for (const [styleName, props] of Object.entries(typography)) {
    const prefix = `--typo-${toKebab(styleName)}`;

    for (const [propName, token] of Object.entries(props)) {
      const kebabProp = toKebab(propName);
      const varName = `${prefix}-${kebabProp}`;

      // Skip paragraph-indent and paragraph-spacing when 0
      // (they have no CSS equivalent and clutter the output)
      if (
        (propName === "paragraphIndent" || propName === "paragraphSpacing") &&
        token.value === 0
      ) {
        continue;
      }

      // Skip textCase and textDecoration when "none"
      if (
        (propName === "textCase" || propName === "textDecoration") &&
        token.value === "none"
      ) {
        continue;
      }

      // Skip fontStretch and fontStyle when "normal" (browser defaults)
      if (
        (propName === "fontStretch" || propName === "fontStyle") &&
        token.value === "normal"
      ) {
        continue;
      }

      // Format value with units
      let formattedValue;
      if (token.type === "dimension") {
        formattedValue = `${token.value}${dimensionUnit}`;
      } else {
        formattedValue = `${token.value}`;
      }

      typoLines.push(`  ${varName}: ${formattedValue};`);
    }
  }

  // ── Assemble CSS ─────────────────────────────────────────────────

  const banner = `/* ==========================================================================
   Design Tokens — Auto-generated by generate-tokens.js
   Source:  color-token.json  ·  design-tokens.tokens.json
   Generated: ${new Date().toISOString()}
   
   COLOR ROLES:  Only semantic role tokens are exposed as CSS variables.
                 Primitive palette values are resolved at build time.
   TYPOGRAPHY:   All typography scale tokens (display, headline, title,
                 body, label) in large / medium / small variants.
   ========================================================================== */`;

  const sections = [];

  // -- Light theme (default) + Typography
  sections.push(`/* ── Light Theme (default) + Typography ─────────────────────────── */
:root {
  /* Color Roles — Light */
${lightLines.join("\n")}

  /* Typography Scale */
${typoLines.join("\n")}
}`);

  // -- Dark theme
  sections.push(`/* ── Dark Theme ─────────────────────────────────────────────────── */
[data-theme="dark"] {
${darkLines.join("\n")}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${darkLines.map((l) => `  ${l}`).join("\n")}
  }
}`);

  const output = [banner, "", ...sections, ""].join("\n\n");

  // 4. Write CSS
  fs.writeFileSync(OUTPUT_PATH, output, "utf-8");

  console.log(`✅  design-tokens.css generated (${output.length} bytes)`);
  console.log(`    → ${OUTPUT_PATH}`);

  if (warnings.length) {
    console.log(`\n⚠️  ${warnings.length} unresolved reference(s):`);
    warnings.forEach((w) => console.log(`   • ${w}`));
    console.log(
      `\n   These are commented out in the CSS. Add the missing palette\n   values to color-token.json to resolve them.`
    );
  }
}

main();
