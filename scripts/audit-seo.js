const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');

// 16 canonical pages to audit
const CANONICAL_PAGES = [
  { file: 'index.html', path: '/' },
  { file: 'pages/about.html', path: '/pages/about' },
  { file: 'pages/services.html', path: '/pages/services' },
  { file: 'pages/work.html', path: '/pages/work' },
  { file: 'pages/careers.html', path: '/pages/careers' },
  { file: 'pages/contact.html', path: '/pages/contact' },
  { file: 'services/seo.html', path: '/services/seo' },
  { file: 'services/social-media.html', path: '/services/social-media' },
  { file: 'services/paid-advertising.html', path: '/services/paid-advertising' },
  { file: 'services/performance-marketing.html', path: '/services/performance-marketing' },
  { file: 'services/digital-strategy.html', path: '/services/digital-strategy' },
  { file: 'services/website-design.html', path: '/services/website-design' },
  { file: 'services/branding-creative.html', path: '/services/branding-creative' },
  { file: 'services/content-marketing.html', path: '/services/content-marketing' },
  { file: 'services/influencer-marketing.html', path: '/services/influencer-marketing' },
  { file: 'services/website-seo.html', path: '/services/website-seo' }
];

const STUB_PAGES = [
  'pages/services/seo.html',
  'pages/services/social-media.html',
  'pages/services/paid-advertising.html',
  'pages/services/performance-marketing.html',
  'pages/services/digital-strategy.html',
  'pages/services/website-design.html'
];

let totalErrors = 0;
let totalWarnings = 0;

console.log('====================================================');
console.log('🔍 JYSA MEDIA — AUTOMATED COMPREHENSIVE SEO AUDIT');
console.log('====================================================\n');

// 1. Robots.txt audit
console.log('1. Checking robots.txt...');
const robotsPath = path.join(FRONTEND_DIR, 'robots.txt');
if (!fs.existsSync(robotsPath)) {
  console.error('❌ robots.txt is missing!');
  totalErrors++;
} else {
  const robotsContent = fs.readFileSync(robotsPath, 'utf8');
  if (!robotsContent.includes('Sitemap: https://www.jysamedia.in/sitemap.xml')) {
    console.error('❌ robots.txt missing correct Sitemap directive pointing to https://www.jysamedia.in/sitemap.xml');
    totalErrors++;
  } else if (!robotsContent.includes('Allow: /')) {
    console.warn('⚠️ robots.txt does not have explicit Allow: /');
    totalWarnings++;
  } else {
    console.log('✅ robots.txt is valid and points to https://www.jysamedia.in/sitemap.xml');
  }
}

// 2. Sitemap.xml audit
console.log('\n2. Checking sitemap.xml...');
const sitemapPath = path.join(FRONTENDDIR = path.join(FRONTEND_DIR, 'sitemap.xml'));
if (!fs.existsSync(sitemapPath)) {
  console.error('❌ sitemap.xml is missing!');
  totalErrors++;
} else {
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
  const locMatches = [...sitemapContent.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
  console.log(`Found ${locMatches.length} URLs in sitemap.xml.`);
  
  if (locMatches.length !== 16) {
    console.error(`❌ Expected 16 URLs in sitemap.xml, found ${locMatches.length}`);
    totalErrors++;
  }
  
  let invalidSitemapUrls = 0;
  for (const loc of locMatches) {
    if (!loc.startsWith('https://www.jysamedia.in')) {
      console.error(`❌ Sitemap URL does not start with https://www.jysamedia.in: ${loc}`);
      invalidSitemapUrls++;
    }
    if (loc.endsWith('.html')) {
      console.error(`❌ Sitemap URL has .html extension: ${loc}`);
      invalidSitemapUrls++;
    }
    if (loc.includes('/pages/services/')) {
      console.error(`❌ Sitemap URL contains obsolete stub path: ${loc}`);
      invalidSitemapUrls++;
    }
  }
  if (invalidSitemapUrls === 0) {
    console.log('✅ sitemap.xml contains strictly the 16 canonical clean URLs on www.jysamedia.in');
  } else {
    totalErrors += invalidSitemapUrls;
  }
}

// 3. Audit each canonical page
console.log('\n3. Checking 16 Canonical Pages...\n');

const titlesSeen = new Map();
const h1sSeen = new Map();

for (const page of CANONICAL_PAGES) {
  const fullPath = path.join(FRONTEND_DIR, page.file);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ File not found: ${page.file}`);
    totalErrors++;
    continue;
  }

  const html = fs.readFileSync(fullPath, 'utf8');

  // Title check
  const titleMatch = html.match(/<title>(.*?)<\/title>/is);
  const title = titleMatch ? titleMatch[1].trim() : '';
  const titleLen = title.length;
  let titleStatus = '✅';
  if (!title) {
    titleStatus = '❌ Missing';
    totalErrors++;
  } else if (titleLen > 60) {
    titleStatus = `❌ Too long (${titleLen} chars > 60)`;
    totalErrors++;
  } else if (titleLen < 30) {
    titleStatus = `⚠️ Short (${titleLen} chars)`;
    totalWarnings++;
  }
  if (titlesSeen.has(title)) {
    console.error(`❌ Duplicate title detected on ${page.file}: "${title}" (already on ${titlesSeen.get(title)})`);
    totalErrors++;
  } else {
    titlesSeen.set(title, page.file);
  }

  // Meta description check
  const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/is) ||
                        html.match(/<meta\s+content=["'](.*?)["']\s+name=["']description["']/is);
  const metaDesc = metaDescMatch ? metaDescMatch[1].trim() : '';
  const metaDescLen = metaDesc.length;
  let metaDescStatus = '✅';
  if (!metaDesc) {
    metaDescStatus = '❌ Missing';
    totalErrors++;
  } else if (metaDescLen < 120 || metaDescLen > 155) {
    // Check if within acceptable bounds
    if (metaDescLen > 160 || metaDescLen < 100) {
      metaDescStatus = `❌ Out of range (${metaDescLen} chars: target 120-155)`;
      totalErrors++;
    } else {
      metaDescStatus = `⚠️ Slightly outside target (${metaDescLen} chars: target 120-155)`;
      totalWarnings++;
    }
  }

  // Canonical tag check
  const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["'](.*?)["']/is) ||
                         html.match(/<link\s+href=["'](.*?)["']\s+rel=["']canonical["']/is);
  const canonical = canonicalMatch ? canonicalMatch[1].trim() : '';
  let canonicalStatus = '✅';
  const expectedCanonical = page.path === '/' ? 'https://www.jysamedia.in/' : `https://www.jysamedia.in${page.path}`;
  if (!canonical) {
    canonicalStatus = '❌ Missing';
    totalErrors++;
  } else if (canonical !== expectedCanonical) {
    canonicalStatus = `❌ Expected "${expectedCanonical}", got "${canonical}"`;
    totalErrors++;
  }

  // H1 tag check
  const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
  let h1Status = '✅';
  if (h1Matches.length === 0) {
    h1Status = '❌ No H1 found';
    totalErrors++;
  } else if (h1Matches.length > 1) {
    h1Status = `❌ Multiple H1 tags found (${h1Matches.length})`;
    totalErrors++;
  } else {
    const rawH1 = h1Matches[0][1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (!rawH1) {
      h1Status = '❌ Empty H1';
      totalErrors++;
    } else if (h1sSeen.has(rawH1)) {
      h1Status = `❌ Duplicate H1 "${rawH1}" (already on ${h1sSeen.get(rawH1)})`;
      totalErrors++;
    } else {
      h1sSeen.set(rawH1, page.file);
    }
  }

  // JSON-LD check
  const jsonLdMatches = [...html.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)];
  let jsonLdStatus = '✅';
  if (jsonLdMatches.length === 0) {
    jsonLdStatus = '❌ Missing JSON-LD';
    totalErrors++;
  } else {
    for (const match of jsonLdMatches) {
      try {
        const parsed = JSON.parse(match[1]);
        const hasContext = Boolean(parsed['@context']);
        const hasType = Boolean(
          parsed['@type'] ||
          (Array.isArray(parsed['@graph']) && parsed['@graph'].length > 0 && parsed['@graph'].every(node => Boolean(node['@type'])))
        );
        if (!hasContext || !hasType) {
          jsonLdStatus = '❌ Invalid JSON-LD schema (missing @context or @type)';
          totalErrors++;
        }
      } catch (err) {
        jsonLdStatus = `❌ Malformed JSON-LD: ${err.message}`;
        totalErrors++;
      }
    }
  }

  // Word count check (body text stripping HTML tags and scripts)
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let wordCount = 0;
  if (bodyMatch) {
    let cleanBody = bodyMatch[1]
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z0-9#]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const words = cleanBody.split(/\s+/).filter(w => w.length > 1);
    wordCount = words.length;
  }
  let wordCountStatus = '✅';
  if (wordCount < 250) {
    wordCountStatus = `❌ Low word count (${wordCount} words < 250)`;
    totalErrors++;
  } else {
    wordCountStatus = `✅ (${wordCount} words)`;
  }

  // Internal link check (.html extensions in hrefs or links to obsolete stubs)
  const hrefMatches = [...html.matchAll(/href=["']([^"']+)["']/g)].map(m => m[1]);
  let badLinks = [];
  for (const href of hrefMatches) {
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) {
      continue;
    }
    // relative or root-relative link
    if (href.includes('/pages/services/')) {
      badLinks.push(`Points to obsolete stub: ${href}`);
    }
    if (href.endsWith('.html')) {
      badLinks.push(`Contains .html extension: ${href}`);
    }
  }
  let linksStatus = '✅';
  if (badLinks.length > 0) {
    linksStatus = `❌ ${badLinks.length} bad internal links: ${badLinks.slice(0, 3).join(', ')}`;
    totalErrors++;
  }

  // Image alt check
  const imgMatches = [...html.matchAll(/<img\s+([^>]*?)>/gi)];
  let missingAlts = 0;
  for (const img of imgMatches) {
    const attrs = img[1];
    if (!attrs.includes('alt=') || /alt=["']\s*["']/.test(attrs)) {
      missingAlts++;
    }
  }
  let altStatus = '✅';
  if (missingAlts > 0) {
    altStatus = `⚠️ ${missingAlts} images missing alt text`;
    totalWarnings++;
  }

  console.log(`📄 ${page.file} (${page.path})`);
  console.log(`   Title [${titleLen}c]: "${title}" -> ${titleStatus}`);
  console.log(`   Meta Desc [${metaDescLen}c]: ${metaDescStatus}`);
  console.log(`   Canonical: ${canonical} -> ${canonicalStatus}`);
  console.log(`   H1: ${h1Status}`);
  console.log(`   JSON-LD: ${jsonLdStatus}`);
  console.log(`   Content: ${wordCountStatus}`);
  console.log(`   Links: ${linksStatus}`);
  console.log(`   Images: ${altStatus}`);
  console.log('----------------------------------------------------');
}

// 4. Audit Obsolete Stubs
console.log('\n4. Checking 6 Obsolete Stubs in frontend/pages/services/...\n');
for (const stub of STUB_PAGES) {
  const fullPath = path.join(FRONTEND_DIR, stub);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Stub file not found: ${stub}`);
    totalErrors++;
    continue;
  }
  const html = fs.readFileSync(fullPath, 'utf8');
  const slug = path.basename(stub, '.html');
  const expectedCanonical = `https://www.jysamedia.in/services/${slug}`;

  const hasNoindex = /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex[^"']*["']/i.test(html);
  const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["'](.*?)["']/i);
  const canonical = canonicalMatch ? canonicalMatch[1].trim() : '';
  const hasMetaRefresh = /<meta\s+http-equiv=["']refresh["']\s+content=["']0;\s*url=\/services\//i.test(html);

  let stubStatus = '✅';
  if (!hasNoindex) {
    stubStatus = '❌ Missing noindex';
    totalErrors++;
  } else if (canonical !== expectedCanonical) {
    stubStatus = `❌ Canonical mismatch: expected ${expectedCanonical}, got ${canonical}`;
    totalErrors++;
  } else if (!hasMetaRefresh) {
    stubStatus = '❌ Missing meta refresh fallback';
    totalErrors++;
  }
  console.log(`   ${stub} -> Canonical: ${canonical} | Noindex: ${hasNoindex} | Refresh: ${hasMetaRefresh} -> ${stubStatus}`);
}

// 5. Audit Vercel Redirects
console.log('\n5. Checking vercel.json Redirects...');
const vercelPath = path.join(ROOT_DIR, 'vercel.json');
const vercelJson = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
const redirects = vercelJson.redirects || [];
const hasStubRedirect = redirects.some(r => r.source.includes('/pages/services/') && r.permanent === true);
if (hasStubRedirect) {
  console.log('✅ vercel.json has permanent 301 redirects for /pages/services/* -> /services/*');
} else {
  console.error('❌ vercel.json missing 301 permanent redirect for /pages/services/*');
  totalErrors++;
}

console.log('\n====================================================');
console.log(`AUDIT FINISHED: ${totalErrors} Errors, ${totalWarnings} Warnings`);
console.log('====================================================');

process.exit(totalErrors > 0 ? 1 : 0);
