#!/usr/bin/env node

/**
 * Token Audit Script
 * Comprehensive design token violation detection for Mandalay Morning Star
 *
 * Usage: node scripts/audit-tokens.js [--json] [--verbose]
 *
 * Exit codes:
 *   0 = Clean (no violations)
 *   1 = Critical violations found OR regression detected
 *   2 = Warning violations found (no critical)
 *   3 = Info only violations
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// ============================================
// CONFIGURATION
// ============================================

const SOURCE_DIRS = ['src'];
const FILE_EXTENSIONS = ['.tsx', '.jsx', '.ts', '.js', '.css'];
const REPORT_PATH = '.planning/audit-report.md';

// TTY detection for colors and progress
const isTTY = process.stdout.isTTY;
const isVerbose = process.argv.includes('--verbose');
const isJSON = process.argv.includes('--json');

// ANSI color codes
const colors = {
  reset: isTTY ? '\x1b[0m' : '',
  bold: isTTY ? '\x1b[1m' : '',
  dim: isTTY ? '\x1b[2m' : '',
  red: isTTY ? '\x1b[31m' : '',
  green: isTTY ? '\x1b[32m' : '',
  yellow: isTTY ? '\x1b[33m' : '',
  blue: isTTY ? '\x1b[34m' : '',
  magenta: isTTY ? '\x1b[35m' : '',
  cyan: isTTY ? '\x1b[36m' : '',
  white: isTTY ? '\x1b[37m' : '',
  bgRed: isTTY ? '\x1b[41m' : '',
  bgYellow: isTTY ? '\x1b[43m' : '',
  bgBlue: isTTY ? '\x1b[44m' : '',
};

// ============================================
// DETECTION PATTERNS
// ============================================

const PATTERNS = {
  colors: {
    // Plain Tailwind color classes (text-white, bg-black, etc.)
    plain: [
      { regex: /\btext-white\b(?!\/)/g, name: 'text-white', severity: 'critical' },
      { regex: /\btext-black\b(?!\/)/g, name: 'text-black', severity: 'critical' },
      { regex: /\bbg-white\b(?!\/)/g, name: 'bg-white', severity: 'critical' },
      { regex: /\bbg-black\b(?!\/)/g, name: 'bg-black', severity: 'critical' },
      { regex: /\bborder-white\b(?!\/)/g, name: 'border-white', severity: 'warning' },
      { regex: /\bborder-black\b(?!\/)/g, name: 'border-black', severity: 'warning' },
    ],
    // Opacity variants (text-white/50, bg-black/80, etc.)
    opacity: [
      { regex: /\btext-white\/\d+/g, name: 'text-white/N', severity: 'critical' },
      { regex: /\btext-black\/\d+/g, name: 'text-black/N', severity: 'critical' },
      { regex: /\bbg-white\/\d+/g, name: 'bg-white/N', severity: 'critical' },
      { regex: /\bbg-black\/\d+/g, name: 'bg-black/N', severity: 'critical' },
      { regex: /\bborder-white\/\d+/g, name: 'border-white/N', severity: 'warning' },
      { regex: /\bborder-black\/\d+/g, name: 'border-black/N', severity: 'warning' },
    ],
    // Bracket syntax with hex values
    bracket: [
      { regex: /\btext-\[#[0-9a-fA-F]{3,8}\]/g, name: 'text-[#hex]', severity: 'critical' },
      { regex: /\bbg-\[#[0-9a-fA-F]{3,8}\]/g, name: 'bg-[#hex]', severity: 'critical' },
      { regex: /\bborder-\[#[0-9a-fA-F]{3,8}\]/g, name: 'border-[#hex]', severity: 'warning' },
    ],
    // Inline style hex colors
    inline: [
      { regex: /color:\s*['"]?#[0-9a-fA-F]{3,8}/g, name: 'inline color:#hex', severity: 'warning' },
      { regex: /backgroundColor:\s*['"]?#[0-9a-fA-F]{3,8}/g, name: 'inline bg:#hex', severity: 'warning' },
      { regex: /color:\s*['"]?rgba?\(/g, name: 'inline color:rgb()', severity: 'warning' },
      { regex: /backgroundColor:\s*['"]?rgba?\(/g, name: 'inline bg:rgb()', severity: 'warning' },
    ],
  },
  spacing: {
    arbitrary: [
      { regex: /\bp-\[\d+px\]/g, name: 'p-[Npx]', severity: 'warning' },
      { regex: /\bm-\[\d+px\]/g, name: 'm-[Npx]', severity: 'warning' },
      { regex: /\bpt-\[\d+px\]/g, name: 'pt-[Npx]', severity: 'warning' },
      { regex: /\bpb-\[\d+px\]/g, name: 'pb-[Npx]', severity: 'warning' },
      { regex: /\bpl-\[\d+px\]/g, name: 'pl-[Npx]', severity: 'warning' },
      { regex: /\bpr-\[\d+px\]/g, name: 'pr-[Npx]', severity: 'warning' },
      { regex: /\bpx-\[\d+px\]/g, name: 'px-[Npx]', severity: 'warning' },
      { regex: /\bpy-\[\d+px\]/g, name: 'py-[Npx]', severity: 'warning' },
      { regex: /\bmt-\[\d+px\]/g, name: 'mt-[Npx]', severity: 'warning' },
      { regex: /\bmb-\[\d+px\]/g, name: 'mb-[Npx]', severity: 'warning' },
      { regex: /\bml-\[\d+px\]/g, name: 'ml-[Npx]', severity: 'warning' },
      { regex: /\bmr-\[\d+px\]/g, name: 'mr-[Npx]', severity: 'warning' },
      { regex: /\bmx-\[\d+px\]/g, name: 'mx-[Npx]', severity: 'warning' },
      { regex: /\bmy-\[\d+px\]/g, name: 'my-[Npx]', severity: 'warning' },
      { regex: /\bgap-\[\d+px\]/g, name: 'gap-[Npx]', severity: 'warning' },
    ],
  },
  effects: {
    hardcoded: [
      // Tailwind arbitrary shadows
      { regex: /\bshadow-\[[^\]]+\]/g, name: 'shadow-[...]', severity: 'warning' },
      // Tailwind arbitrary blur
      { regex: /\bblur-\[\d+px\]/g, name: 'blur-[Npx]', severity: 'warning' },
      { regex: /\bbackdrop-blur-\[\d+px\]/g, name: 'backdrop-blur-[Npx]', severity: 'warning' },
      // Tailwind arbitrary durations - upgraded from info to warning for enforcement
      { regex: /\bduration-\[\d+m?s\]/g, name: 'duration-[Nms]', severity: 'warning' },
      // Tailwind arbitrary delays
      { regex: /\bdelay-\[\d+m?s\]/g, name: 'delay-[Nms]', severity: 'warning' },
      // Tailwind arbitrary transition timing functions
      { regex: /\bease-\[[^\]]+\]/g, name: 'ease-[...]', severity: 'info' },
    ],
    inline: [
      // Inline boxShadow with hardcoded values (not CSS variables)
      { regex: /boxShadow:\s*['"](?!var\()0\s+\d/g, name: 'inline boxShadow', severity: 'warning' },
      { regex: /boxShadow:\s*['"]inset\s/g, name: 'inline boxShadow inset', severity: 'warning' },
      // Inline backdropFilter with hardcoded blur
      { regex: /backdropFilter:\s*['"]blur\(\d+px\)/g, name: 'inline backdropFilter', severity: 'warning' },
      { regex: /filter:\s*['"]blur\(\d+px\)/g, name: 'inline filter blur', severity: 'warning' },
      // Inline transition with hardcoded duration (not CSS variable)
      { regex: /transition:\s*['"][^'"]*\d+m?s/g, name: 'inline transition duration', severity: 'warning' },
      // Inline transitionDuration with hardcoded value
      { regex: /transitionDuration:\s*['"]?\d+m?s/g, name: 'inline transitionDuration', severity: 'warning' },
      // Inline animationDuration with hardcoded value
      { regex: /animationDuration:\s*['"]?\d+m?s/g, name: 'inline animationDuration', severity: 'warning' },
    ],
  },
  deprecated: {
    patterns: [
      { regex: /\bv6-[a-zA-Z-]+/g, name: 'v6-* prefix', severity: 'warning' },
      { regex: /\bv7-[a-zA-Z-]+/g, name: 'v7-* prefix', severity: 'warning' },
      { regex: /v7Palette/g, name: 'v7Palette reference', severity: 'warning' },
      { regex: /v7Palettes/g, name: 'v7Palettes reference', severity: 'warning' },
    ],
  },
};

// File severity classification
const FILE_SEVERITY_MAP = [
  // CRITICAL: User-facing pages and components
  { pattern: /src\/app\/\(public\)/, severity: 'critical' },
  { pattern: /src\/app\/\(customer\)/, severity: 'critical' },
  { pattern: /src\/components\/homepage/, severity: 'critical' },
  { pattern: /src\/components\/menu/, severity: 'critical' },
  { pattern: /src\/components\/checkout/, severity: 'critical' },
  { pattern: /src\/components\/cart/, severity: 'critical' },
  { pattern: /src\/components\/ui\//, severity: 'critical' },
  { pattern: /src\/components\/ui-v8\//, severity: 'critical' },
  { pattern: /src\/components\/tracking/, severity: 'critical' },
  { pattern: /src\/components\/layout/, severity: 'critical' },

  // WARNING: Admin/Driver/Auth pages
  { pattern: /src\/app\/\(admin\)/, severity: 'warning' },
  { pattern: /src\/components\/admin/, severity: 'warning' },
  { pattern: /src\/app\/\(driver\)/, severity: 'warning' },
  { pattern: /src\/components\/driver/, severity: 'warning' },
  { pattern: /src\/app\/\(auth\)/, severity: 'warning' },
  { pattern: /src\/components\/auth/, severity: 'warning' },

  // INFO: Stories and tests
  { pattern: /\.stories\.tsx$/, severity: 'info' },
  { pattern: /\.test\.tsx$/, severity: 'info' },
  { pattern: /src\/stories\//, severity: 'info' },
];

// Suggested fix mappings
const FIX_SUGGESTIONS = {
  'text-white': 'text-text-inverse (or text-hero-text in hero sections)',
  'text-white/N': 'text-text-inverse/N',
  'text-black': 'text-text-primary',
  'text-black/N': 'text-text-primary/N',
  'bg-white': 'bg-surface-primary',
  'bg-white/N': 'bg-surface-primary/N',
  'bg-black': 'bg-surface-inverse or bg-[var(--color-text-primary)]',
  'bg-black/N': 'bg-[var(--color-text-primary)]/N',
  'border-white': 'border-border-default or border-text-inverse',
  'border-white/N': 'border-text-inverse/N',
  'border-black': 'border-border-strong',
  'border-black/N': 'border-border-strong/N',
  'text-[#hex]': 'Use semantic token (text-primary, text-secondary, etc.)',
  'bg-[#hex]': 'Use semantic token (bg-primary, bg-surface-primary, etc.)',
  'border-[#hex]': 'Use semantic token (border-border, border-primary, etc.)',
  'inline color:#hex': 'Use CSS variable: color: var(--color-text-primary)',
  'inline bg:#hex': 'Use CSS variable: backgroundColor: var(--color-surface-primary)',
  'inline color:rgb()': 'Use CSS variable: color: var(--color-text-primary)',
  'inline bg:rgb()': 'Use CSS variable: backgroundColor: var(--color-surface-primary)',
  'v6-* prefix': 'Remove v6- prefix, use semantic tokens',
  'v7-* prefix': 'Remove v7- prefix, use semantic tokens',
  'v7Palette reference': 'Use semantic tokens from @/styles/tokens.css',
  'v7Palettes reference': 'Use semantic tokens from @/styles/tokens.css',
  'p-[Npx]': 'Use Tailwind spacing scale (p-4, p-6, etc.)',
  'm-[Npx]': 'Use Tailwind spacing scale',
  'pt-[Npx]': 'Use Tailwind spacing scale',
  'pb-[Npx]': 'Use Tailwind spacing scale',
  'pl-[Npx]': 'Use Tailwind spacing scale',
  'pr-[Npx]': 'Use Tailwind spacing scale',
  'px-[Npx]': 'Use Tailwind spacing scale',
  'py-[Npx]': 'Use Tailwind spacing scale',
  'mt-[Npx]': 'Use Tailwind spacing scale',
  'mb-[Npx]': 'Use Tailwind spacing scale',
  'ml-[Npx]': 'Use Tailwind spacing scale',
  'mr-[Npx]': 'Use Tailwind spacing scale',
  'mx-[Npx]': 'Use Tailwind spacing scale',
  'my-[Npx]': 'Use Tailwind spacing scale',
  'gap-[Npx]': 'Use Tailwind spacing scale',
  'shadow-[...]': 'Use semantic shadow tokens (shadow-xs, shadow-sm, shadow-card, shadow-primary, etc.)',
  'blur-[Npx]': 'Use Tailwind blur scale (blur-sm=4px, blur-md=8px, blur-lg=12px, etc.)',
  'backdrop-blur-[Npx]': 'Use Tailwind backdrop-blur scale (backdrop-blur-sm, backdrop-blur-md, etc.)',
  'duration-[Nms]': 'Use motion tokens: duration-instant(0ms), duration-fast(150ms), duration-normal(220ms), duration-slow(350ms), duration-slower(500ms)',
  'delay-[Nms]': 'Use CSS variable: delay: var(--duration-*) or Tailwind delay scale',
  'ease-[...]': 'Use easing tokens: ease-default, ease-spring, ease-out, ease-in, ease-in-out',
  'inline transition duration': 'Use CSS variable: transition: all var(--duration-normal) var(--ease-default)',
  'inline transitionDuration': 'Use CSS variable: transitionDuration: var(--duration-normal)',
  'inline animationDuration': 'Use CSS variable: animationDuration: var(--duration-slow)',
  'inline boxShadow': 'Use CSS variable: boxShadow: var(--shadow-*)',
  'inline boxShadow inset': 'Use CSS variable: boxShadow: var(--shadow-inner-*)',
  'inline backdropFilter': 'Use CSS variable: backdropFilter: blur(var(--blur-*))',
  'inline filter blur': 'Use CSS variable: filter: blur(var(--blur-*))',
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Custom glob implementation using fs
 */
async function glob(dir, extensions) {
  const files = [];

  async function walkDir(currentDir) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        // Skip node_modules, .next, etc.
        if (entry.isDirectory()) {
          if (!['node_modules', '.next', 'out', 'build', '.git', 'storybook-static'].includes(entry.name)) {
            await walkDir(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (err) {
      // Skip directories we can't read
    }
  }

  await walkDir(dir);
  return files;
}

/**
 * Get file severity based on path
 */
function getFileSeverity(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');

  for (const { pattern, severity } of FILE_SEVERITY_MAP) {
    if (pattern.test(normalizedPath)) {
      return severity;
    }
  }

  return 'info'; // Default severity
}

/**
 * Get combined severity (max of file and pattern severity)
 */
function getCombinedSeverity(fileSeverity, patternSeverity) {
  const order = { critical: 3, warning: 2, info: 1 };
  return order[fileSeverity] >= order[patternSeverity] ? fileSeverity : patternSeverity;
}

/**
 * Get line number from character index
 */
function getLineNumber(content, index) {
  return content.substring(0, index).split('\n').length;
}

/**
 * Progress bar renderer
 */
function renderProgressBar(current, total, width = 30) {
  if (!isTTY) return '';

  const percent = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * width);
  const empty = width - filled;

  return `[${colors.green}${'='.repeat(filled)}${colors.reset}${' '.repeat(empty)}] ${percent}% | ${current}/${total} files`;
}

/**
 * Clear line for progress updates
 */
function clearLine() {
  if (isTTY) {
    process.stdout.write('\r\x1b[K');
  }
}

// ============================================
// MAIN SCANNING LOGIC
// ============================================

/**
 * Scan a single file for violations
 */
async function scanFile(filePath) {
  const violations = [];

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const relativePath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
    const fileSeverity = getFileSeverity(relativePath);

    // Check for audit-ignore comment (skip entire file)
    if (content.includes('// audit-ignore-file') || content.includes('/* audit-ignore-file */')) {
      return violations;
    }

    // Scan each category
    for (const [category, subcategories] of Object.entries(PATTERNS)) {
      for (const [subcategory, patterns] of Object.entries(subcategories)) {
        for (const { regex, name, severity: patternSeverity } of patterns) {
          // Reset regex state
          regex.lastIndex = 0;

          let match;
          while ((match = regex.exec(content)) !== null) {
            const lineNumber = getLineNumber(content, match.index);
            const matchedText = match[0];

            // Skip if line has audit-ignore comment
            const lineStart = content.lastIndexOf('\n', match.index) + 1;
            const lineEnd = content.indexOf('\n', match.index);
            const line = content.substring(lineStart, lineEnd === -1 ? undefined : lineEnd);

            if (line.includes('audit-ignore')) {
              continue;
            }

            // Skip external API patterns (Google Maps, etc.)
            if (line.includes('stylers') || line.includes('google.maps') ||
                line.includes('mapStyles') || line.includes('// external-api')) {
              continue;
            }

            violations.push({
              file: relativePath,
              line: lineNumber,
              column: match.index - lineStart + 1,
              category,
              subcategory,
              pattern: name,
              matched: matchedText,
              severity: getCombinedSeverity(fileSeverity, patternSeverity),
              suggestion: FIX_SUGGESTIONS[name] || 'Use semantic design tokens',
            });
          }
        }
      }
    }

    // Check for duplicate imports (ui/ and ui-v8/)
    const hasUiImport = /from ['"]@\/components\/ui\//.test(content);
    const hasUiV8Import = /from ['"]@\/components\/ui-v8\//.test(content);

    if (hasUiImport && hasUiV8Import) {
      violations.push({
        file: relativePath,
        line: 1,
        column: 1,
        category: 'imports',
        subcategory: 'duplicate',
        pattern: 'dual-ui-import',
        matched: 'Imports from both @/components/ui/ and @/components/ui-v8/',
        severity: getCombinedSeverity(fileSeverity, 'warning'),
        suggestion: 'Consolidate to single UI component source',
      });
    }

  } catch (err) {
    // Skip files we can't read
  }

  return violations;
}

/**
 * Parse existing baseline from report
 */
async function parseBaseline() {
  try {
    const reportPath = path.join(ROOT_DIR, REPORT_PATH);
    const content = await fs.readFile(reportPath, 'utf-8');

    // Extract baseline section
    const baselineMatch = content.match(/### Category Baselines\n([\s\S]*?)(?=\n##|\n---|\n*$)/);
    if (!baselineMatch) return null;

    const baseline = {};
    const lines = baselineMatch[1].trim().split('\n');

    for (const line of lines) {
      const match = line.match(/^- (\w+): (\d+)/);
      if (match) {
        baseline[match[1]] = parseInt(match[2], 10);
      }
    }

    // Extract historical trend
    const historyMatch = content.match(/### Historical Trend\n\|[\s\S]*?\n([\s\S]*?)(?=\n###|\n##|\n*$)/);
    const history = [];

    if (historyMatch) {
      const rows = historyMatch[1].trim().split('\n');
      for (const row of rows) {
        if (row.startsWith('|') && !row.includes('---')) {
          const cols = row.split('|').filter(c => c.trim());
          if (cols.length >= 6) {
            history.push({
              run: parseInt(cols[0].trim(), 10),
              date: cols[1].trim(),
              critical: parseInt(cols[2].trim(), 10),
              warning: parseInt(cols[3].trim(), 10),
              info: parseInt(cols[4].trim(), 10),
              total: parseInt(cols[5].trim(), 10),
            });
          }
        }
      }
    }

    return { baseline, history };
  } catch {
    return null;
  }
}

/**
 * Generate markdown report
 */
function generateReport(violations, baseline) {
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const date = new Date().toISOString().substring(0, 10);

  // Count by severity
  const bySeverity = { critical: 0, warning: 0, info: 0 };
  violations.forEach(v => bySeverity[v.severity]++);

  // Count by category
  const byCategory = {};
  violations.forEach(v => {
    if (!byCategory[v.category]) {
      byCategory[v.category] = { critical: 0, warning: 0, info: 0, total: 0 };
    }
    byCategory[v.category][v.severity]++;
    byCategory[v.category].total++;
  });

  // Count by pattern type
  const byPattern = {};
  violations.forEach(v => {
    if (!byPattern[v.pattern]) {
      byPattern[v.pattern] = { count: 0, severity: v.severity, suggestion: v.suggestion };
    }
    byPattern[v.pattern].count++;
  });

  // Group by file
  const byFile = {};
  violations.forEach(v => {
    if (!byFile[v.file]) {
      byFile[v.file] = [];
    }
    byFile[v.file].push(v);
  });

  // Sort files by severity then count
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  const sortedFiles = Object.entries(byFile).sort((a, b) => {
    const aSeverity = Math.min(...a[1].map(v => severityOrder[v.severity]));
    const bSeverity = Math.min(...b[1].map(v => severityOrder[v.severity]));
    if (aSeverity !== bSeverity) return aSeverity - bSeverity;
    return b[1].length - a[1].length;
  });

  // Build report
  let report = `# Token Audit Report

Generated: ${now}
Total files scanned: ${Object.keys(byFile).length + (violations.length === 0 ? 1 : 0)}
Total violations: ${violations.length}

## Summary

| Severity | Count |
|----------|-------|
| Critical | ${bySeverity.critical} |
| Warning | ${bySeverity.warning} |
| Info | ${bySeverity.info} |
| **Total** | **${violations.length}** |

## By Category

| Category | Critical | Warning | Info | Total |
|----------|----------|---------|------|-------|
`;

  for (const [category, counts] of Object.entries(byCategory)) {
    report += `| ${category} | ${counts.critical} | ${counts.warning} | ${counts.info} | ${counts.total} |\n`;
  }

  // By Type section
  report += `\n## By Type\n\n`;

  const sortedPatterns = Object.entries(byPattern)
    .sort((a, b) => b[1].count - a[1].count);

  for (const [pattern, data] of sortedPatterns) {
    const severityBadge = data.severity === 'critical' ? '**CRITICAL**' :
                          data.severity === 'warning' ? 'WARNING' : 'info';
    report += `### ${pattern} (${data.count}) - ${severityBadge}\n\n`;
    report += `**Suggested fix:** ${data.suggestion}\n\n`;

    // List first 10 occurrences
    const occurrences = violations.filter(v => v.pattern === pattern).slice(0, 10);
    for (const v of occurrences) {
      report += `- \`${v.file}:${v.line}\` - \`${v.matched}\`\n`;
    }

    const remaining = violations.filter(v => v.pattern === pattern).length - 10;
    if (remaining > 0) {
      report += `- ... and ${remaining} more\n`;
    }
    report += '\n';
  }

  // By File section
  report += `## By File\n\n`;
  report += `### Top 20 Files with Most Violations\n\n`;

  const top20 = sortedFiles.slice(0, 20);
  for (const [file, fileViolations] of top20) {
    const critCount = fileViolations.filter(v => v.severity === 'critical').length;
    const warnCount = fileViolations.filter(v => v.severity === 'warning').length;
    const infoCount = fileViolations.filter(v => v.severity === 'info').length;

    const severityLabel = critCount > 0 ? `${colors.red}CRITICAL${colors.reset}` :
                          warnCount > 0 ? 'WARNING' : 'info';

    report += `### ${file} (${fileViolations.length} violations)\n\n`;
    report += `Severity breakdown: ${critCount} critical, ${warnCount} warning, ${infoCount} info\n\n`;

    for (const v of fileViolations.slice(0, 15)) {
      report += `- Line ${v.line}: \`${v.matched}\` -> ${v.suggestion}\n`;
    }

    const remaining = fileViolations.length - 15;
    if (remaining > 0) {
      report += `- ... and ${remaining} more in this file\n`;
    }
    report += '\n';
  }

  if (sortedFiles.length > 20) {
    report += `\n*... and ${sortedFiles.length - 20} more files with violations*\n\n`;
  }

  // Baseline section
  report += `## Baseline\n\n`;

  // Current run counts
  const currentCounts = {
    colors: violations.filter(v => v.category === 'colors').length,
    spacing: violations.filter(v => v.category === 'spacing').length,
    effects: violations.filter(v => v.category === 'effects').length,
    deprecated: violations.filter(v => v.category === 'deprecated').length,
    imports: violations.filter(v => v.category === 'imports').length,
  };

  report += `### Current Run\n`;
  report += `| Category | Critical | Warning | Info | Total |\n`;
  report += `|----------|----------|---------|------|-------|\n`;

  for (const [category, counts] of Object.entries(byCategory)) {
    report += `| ${category} | ${counts.critical} | ${counts.warning} | ${counts.info} | ${counts.total} |\n`;
  }

  report += `\n### Historical Trend\n`;
  report += `| Run | Date | Critical | Warning | Info | Total |\n`;
  report += `|-----|------|----------|---------|------|-------|\n`;

  // Build history
  const history = baseline?.history || [];
  const nextRun = history.length + 1;

  // Add current run to history
  report += `| ${nextRun} | ${date} | ${bySeverity.critical} | ${bySeverity.warning} | ${bySeverity.info} | ${violations.length} |\n`;

  // Include last 4 runs from history
  for (const h of history.slice(-4).reverse()) {
    report += `| ${h.run} | ${h.date} | ${h.critical} | ${h.warning} | ${h.info} | ${h.total} |\n`;
  }

  report += `\n### Category Baselines\n`;
  for (const [category, count] of Object.entries(currentCounts)) {
    report += `- ${category}: ${count}\n`;
  }

  // Delta from previous run
  if (baseline?.baseline) {
    report += `\n### Delta from Previous Run\n`;

    let hasRegression = false;
    for (const [category, count] of Object.entries(currentCounts)) {
      const prev = baseline.baseline[category] || 0;
      const delta = count - prev;
      const deltaStr = delta === 0 ? '0' : delta > 0 ? `+${delta}` : `${delta}`;
      const indicator = delta > 0 ? ' **REGRESSION**' : delta < 0 ? ' (improved)' : '';
      report += `- ${category}: ${deltaStr}${indicator}\n`;
      if (delta > 0) hasRegression = true;
    }

    if (hasRegression) {
      report += `\n**WARNING: Regression detected! Violations have increased.**\n`;
    }
  }

  report += `\n---\n*Generated by scripts/audit-tokens.js*\n`;

  return report;
}

/**
 * Print terminal summary
 */
function printSummary(violations, baseline) {
  console.log('\n');

  // Count by severity
  const bySeverity = { critical: 0, warning: 0, info: 0 };
  violations.forEach(v => bySeverity[v.severity]++);

  // Header
  console.log(`${colors.bold}Token Audit Results${colors.reset}`);
  console.log('='.repeat(50));

  // Summary
  console.log(`\n${colors.bold}Violations Found:${colors.reset}`);
  console.log(`  ${colors.red}Critical:${colors.reset} ${bySeverity.critical}`);
  console.log(`  ${colors.yellow}Warning:${colors.reset}  ${bySeverity.warning}`);
  console.log(`  ${colors.blue}Info:${colors.reset}     ${bySeverity.info}`);
  console.log(`  ${colors.bold}Total:${colors.reset}    ${violations.length}`);

  // Top files
  const byFile = {};
  violations.forEach(v => {
    if (!byFile[v.file]) byFile[v.file] = [];
    byFile[v.file].push(v);
  });

  const sortedFiles = Object.entries(byFile)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10);

  if (sortedFiles.length > 0) {
    console.log(`\n${colors.bold}Top 10 Files (Quick Wins):${colors.reset}`);
    for (const [file, fileViolations] of sortedFiles) {
      const critCount = fileViolations.filter(v => v.severity === 'critical').length;
      const severity = critCount > 0 ? colors.red : colors.yellow;
      console.log(`  ${severity}${fileViolations.length}${colors.reset} - ${file}`);
    }
  }

  // Delta check
  if (baseline?.baseline) {
    const currentCounts = {
      colors: violations.filter(v => v.category === 'colors').length,
      spacing: violations.filter(v => v.category === 'spacing').length,
      effects: violations.filter(v => v.category === 'effects').length,
      deprecated: violations.filter(v => v.category === 'deprecated').length,
      imports: violations.filter(v => v.category === 'imports').length,
    };

    let hasRegression = false;
    let totalDelta = 0;

    for (const [category, count] of Object.entries(currentCounts)) {
      const prev = baseline.baseline[category] || 0;
      const delta = count - prev;
      totalDelta += delta;
      if (delta > 0) hasRegression = true;
    }

    console.log(`\n${colors.bold}Delta from Baseline:${colors.reset} ${totalDelta === 0 ? '0' : totalDelta > 0 ? `+${totalDelta}` : totalDelta}`);

    if (hasRegression) {
      console.log(`${colors.bgRed}${colors.white} REGRESSION DETECTED ${colors.reset} Violations have increased!`);
    } else if (totalDelta < 0) {
      console.log(`${colors.green}Improvement!${colors.reset} ${Math.abs(totalDelta)} violations fixed.`);
    }
  }

  console.log('\n');
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  const startTime = Date.now();

  if (!isJSON) {
    console.log(`${colors.bold}Token Audit v1.0${colors.reset}`);
    console.log(`${colors.dim}Scanning for design token violations...${colors.reset}\n`);
  }

  // Collect all files
  const allFiles = [];
  for (const dir of SOURCE_DIRS) {
    const dirPath = path.join(ROOT_DIR, dir);
    const files = await glob(dirPath, FILE_EXTENSIONS);
    allFiles.push(...files);
  }

  if (!isJSON) {
    console.log(`Found ${allFiles.length} files to scan`);
  }

  // Scan files with progress
  const violations = [];

  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];
    const fileViolations = await scanFile(file);
    violations.push(...fileViolations);

    if (isTTY && !isJSON) {
      clearLine();
      process.stdout.write(renderProgressBar(i + 1, allFiles.length));
    }
  }

  if (isTTY && !isJSON) {
    clearLine();
    console.log(renderProgressBar(allFiles.length, allFiles.length));
  }

  // Parse existing baseline
  const baseline = await parseBaseline();

  // Generate and write report
  const report = generateReport(violations, baseline);
  const reportPath = path.join(ROOT_DIR, REPORT_PATH);

  // Ensure directory exists
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, report, 'utf-8');

  if (!isJSON) {
    console.log(`\nReport written to: ${REPORT_PATH}`);
  }

  // Print terminal summary
  if (isJSON) {
    const output = {
      total: violations.length,
      critical: violations.filter(v => v.severity === 'critical').length,
      warning: violations.filter(v => v.severity === 'warning').length,
      info: violations.filter(v => v.severity === 'info').length,
      violations: violations,
      duration: Date.now() - startTime,
    };
    console.log(JSON.stringify(output, null, 2));
  } else {
    printSummary(violations, baseline);

    const duration = Date.now() - startTime;
    console.log(`${colors.dim}Completed in ${duration}ms${colors.reset}\n`);
  }

  // Determine exit code
  const criticalCount = violations.filter(v => v.severity === 'critical').length;
  const warningCount = violations.filter(v => v.severity === 'warning').length;
  const infoCount = violations.filter(v => v.severity === 'info').length;

  // Check for regression
  if (baseline?.baseline) {
    const currentTotal = {
      colors: violations.filter(v => v.category === 'colors').length,
      spacing: violations.filter(v => v.category === 'spacing').length,
      effects: violations.filter(v => v.category === 'effects').length,
      deprecated: violations.filter(v => v.category === 'deprecated').length,
      imports: violations.filter(v => v.category === 'imports').length,
    };

    for (const [category, count] of Object.entries(currentTotal)) {
      const prev = baseline.baseline[category] || 0;
      if (count > prev) {
        if (!isJSON) {
          console.log(`${colors.red}Exit code 1: Regression in ${category} category${colors.reset}`);
        }
        process.exit(1);
      }
    }
  }

  // Exit based on severity
  if (criticalCount > 0) {
    process.exit(1);
  } else if (warningCount > 0) {
    process.exit(2);
  } else if (infoCount > 0) {
    process.exit(3);
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
