#!/usr/bin/env node
/**
 * JYSA Media — Production Build & Asset Minifier
 * Zero-dependency minification for CSS and JS assets.
 * Preserves original source files while creating production .min.css and .min.js files.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');

function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([\{\}\:\;\,])\s*/g, '$1')
    .replace(/\;(?=\})/g, '')
    .trim();
}

function minifyJS(js) {
  let out = '';
  let i = 0;
  const len = js.length;
  let inQuote = null;
  let inTemplate = false;

  while (i < len) {
    const ch = js[i];
    const prev = js[i - 1];
    const next = js[i + 1];

    // Template literals
    if (!inQuote && ch === '`' && prev !== '\\') {
      inTemplate = !inTemplate;
      out += ch;
      i++;
      continue;
    }

    if (inTemplate) {
      out += ch;
      i++;
      continue;
    }

    // Single/Double quoted strings
    if (!inQuote && (ch === '"' || ch === "'") && prev !== '\\') {
      inQuote = ch;
      out += ch;
      i++;
      continue;
    } else if (inQuote && ch === inQuote && prev !== '\\') {
      inQuote = null;
      out += ch;
      i++;
      continue;
    }

    if (inQuote) {
      out += ch;
      i++;
      continue;
    }

    // Single-line comments
    if (ch === '/' && next === '/') {
      while (i < len && js[i] !== '\n' && js[i] !== '\r') i++;
      continue;
    }

    // Multi-line comments
    if (ch === '/' && next === '*') {
      i += 2;
      while (i < len && !(js[i] === '*' && js[i + 1] === '/')) i++;
      i += 2;
      continue;
    }

    out += ch;
    i++;
  }

  // Safely collapse lines
  const minified = out
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');

  // Verify syntax with Node VM
  new vm.Script(minified);
  return minified;
}

function build() {
  console.log('--- JYSA Media Production Build ---');

  // 1. Minify CSS files
  const cssFiles = ['style.css', 'service.css', 'pages.css'];
  cssFiles.forEach((file) => {
    const srcPath = path.join(frontendDir, 'css', file);
    const destPath = path.join(frontendDir, 'css', file.replace('.css', '.min.css'));
    if (fs.existsSync(srcPath)) {
      const src = fs.readFileSync(srcPath, 'utf8');
      const min = minifyCSS(src);
      fs.writeFileSync(destPath, min, 'utf8');
      const pct = Math.round((1 - min.length / src.length) * 100);
      console.log(`✓ Minified ${file} -> ${path.basename(destPath)} (${src.length}B -> ${min.length}B, -${pct}%)`);
    }
  });

  // 2. Minify JS files
  const jsFiles = ['main.js'];
  jsFiles.forEach((file) => {
    const srcPath = path.join(frontendDir, 'js', file);
    const destPath = path.join(frontendDir, 'js', file.replace('.js', '.min.js'));
    if (fs.existsSync(srcPath)) {
      const src = fs.readFileSync(srcPath, 'utf8');
      const min = minifyJS(src);
      fs.writeFileSync(destPath, min, 'utf8');
      const pct = Math.round((1 - min.length / src.length) * 100);
      console.log(`✓ Minified ${file} -> ${path.basename(destPath)} (${src.length}B -> ${min.length}B, -${pct}%)`);
    }
  });

  console.log('Build completed successfully!');
}

build();
