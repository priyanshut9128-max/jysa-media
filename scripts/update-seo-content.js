const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.resolve(__dirname, '../frontend');

// Updates for 10 service pages
const SERVICE_UPDATES = {
  'services/seo.html': {
    title: 'Search Engine Optimization (SEO) Agency — JYSA Media',
    cards: [
      {
        title: 'Technical SEO Infrastructure',
        text: 'Audit and resolve crawl errors, site architecture bottlenecks, canonicalization conflicts, XML sitemap coverage, and Core Web Vitals performance. We ensure search engine spiders can discover, index, and render your website without crawl budget waste. Our technical audits inspect server response times, structured data validity, mobile responsiveness, and internal linking hierarchy. Clients receive actionable remediation roadmaps with developer-ready technical specifications to eliminate algorithmic indexing hurdles and maximize organic crawl efficiency across Google and Bing search ecosystems.'
      },
      {
        title: 'Topical Authority &amp; Search Strategy',
        text: 'Uncover high-value commercial keywords, long-tail search opportunities, and competitive content gaps within your target market. We structure topical authority clusters that target buyer intent from informational research to transactional decision-making. Our strategic research evaluates keyword difficulty, search volume velocity, search engine result page layout features, and competitor ranking volatility to prioritize the highest-ROI organic growth channels for your business and build enduring industry visibility.'
      },
      {
        title: 'On-Page &amp; Content Optimization',
        text: 'Optimize on-page heading hierarchies, semantic metadata, internal linking graphs, and content depth to capture featured snippets and page-one rankings. We align content directly with search engine helpful content guidelines to ensure sustained organic growth. Every page is structured for user engagement and commercial intent, transforming passive organic searchers into qualified sales inquiries through persuasive copywriting, relevant supporting FAQs, and strategic call-to-action placement.'
      }
    ]
  },

  'services/social-media.html': {
    title: 'Social Media Marketing &amp; Growth Agency — JYSA Media',
    cards: [
      {
        title: 'Creative Content Production',
        text: 'Produce thumb-stopping visual assets, high-engagement short-form video reels, and platform-native carousel posts designed for rapid brand recall and community interaction. Our in-house creative team develops visual storytelling tailored to each channel algorithm, ensuring brand consistency, aesthetic authority, and maximum audience retention across Instagram, LinkedIn, and YouTube Shorts. We handle scripting, visual art direction, and post-production editing to maintain high production value while staying ahead of platform culture shifts.'
      },
      {
        title: 'Active Community Management',
        text: 'Nurture authentic audience conversations, maintain rapid customer response times, and build an active, loyal brand community that turns followers into brand evangelists. We monitor mentions, sentiment trends, and direct inquiries around the clock, cultivating two-way customer relationships that strengthen brand trust and uncover valuable customer feedback. Our proactive community engagement strategies spark organic conversations and turn casual profile visitors into loyal brand advocates who champion your products.'
      },
      {
        title: 'Algorithmic Growth Campaigns',
        text: 'Engineer viral organic activation strategies, collaborative creator partnerships, and targeted distribution sprints that amplify reach and compound your organic follower base. We analyze algorithmic signals, trending audio, and audience interaction hooks to engineer campaigns that break through feed saturation and deliver sustainable engagement. By tracking reach velocity and follower conversion rates, we continually refine our creative formats for predictable organic momentum and multi-channel audience expansion.'
      }
    ]
  },

  'services/paid-advertising.html': {
    title: 'Paid Advertising &amp; PPC Management — JYSA Media',
    cards: [
      {
        title: 'High-Intent Search Advertising',
        text: 'Manage and scale high-intent search ad campaigns across Google Ads and Microsoft Advertising to capture active in-market commercial demand with laser precision. We optimize negative keyword lists, ad extensions, bidding models, and quality score variables to lower cost-per-click and eliminate wasted media expenditure across your search accounts. Our search specialists monitor auction insights and competitor bid shifts daily to protect market share and maximize impression share on commercial queries that convert into paying clients.'
      },
      {
        title: 'Multivariate Creative Optimization',
        text: 'Conduct disciplined multivariate creative testing, headline experimentation, audience segmentation, and smart bidding adjustments to continuously improve return on ad spend. We test visual variations, direct-response value propositions, and demographic filters in structured cycles to uncover the highest-performing combinations that drive profitable scale. Every experiment is evaluated with rigorous statistical confidence thresholds before budget reallocation, ensuring every advertising rupee works harder.'
      },
      {
        title: 'Attribution &amp; Conversion Tracking',
        text: 'Implement server-side conversion APIs, Google Tag Manager event tracking, enhanced conversions, and multi-touch attribution models for transparent, actionable analytics. We ensure every conversion event, purchase value, and lead attribution point is accurately recorded, giving you total transparency into campaign profitability and customer lifetime value. We provide automated reporting dashboards that eliminate attribution discrepancies between ad platforms and validate genuine bottom-line impact.'
      }
    ]
  },

  'services/performance-marketing.html': {
    title: 'Performance Marketing &amp; Growth Agency — JYSA Media',
    cards: [
      {
        title: 'Full-Funnel Customer Acquisition',
        text: 'Build and deploy scalable, full-funnel customer acquisition engines across Meta Ads, Google Ads, and emerging ad platforms engineered to generate profitable sales velocity. We architect customer journeys from first touch to purchase, aligning promotional offers, creative hooks, and bidding thresholds to drive consistent customer volume at target acquisition costs. Our acquisition models adapt dynamically to seasonal spikes, inventory requirements, and customer lifecycle triggers, ensuring your brand achieves consistent, predictable scale.'
      },
      {
        title: 'Algorithmic ROAS Optimization',
        text: 'Optimize paid ad spend efficiency through algorithmic budget allocation, creative iteration cycles, retargeting funnels, and lifetime customer value modeling. Our performance specialists continuously monitor marginal return on ad spend, cutting underperforming ad sets and shifting capital into winning audiences and creatives to maximize overall portfolio returns. We utilize automated rules, bid multipliers, and budget pacing systems to protect campaign efficiency across fluctuating auction landscapes.'
      },
      {
        title: 'Funnel &amp; Checkout Conversion Rate Optimization',
        text: 'Identify conversion friction, streamline checkout flows, and conduct iterative landing page split tests to maximize visitor-to-customer conversion rates. We analyze heatmaps, session recordings, and drop-off analytics to remove hesitation barriers and turn expensive media traffic into repeat customers and qualified sales pipeline. By testing form brevity, page loading speeds, value proposition clarity, and checkout guarantees, we unlock immediate revenue gains that multiply advertising efficiency.'
      }
    ]
  },

  'services/digital-strategy.html': {
    title: 'Digital Strategy &amp; Growth Consulting — JYSA Media',
    cards: [
      {
        title: 'Market Positioning &amp; Differentiation',
        text: 'Define your distinct value proposition, competitive market differentiation, and brand narrative to dominate mindshare in crowded commercial sectors. We conduct deep-dive market research, customer persona mapping, and competitive gap analysis to crystallize an authentic brand identity that commands premium market pricing and fosters customer loyalty. Our positioning frameworks give your commercial messaging immediate clarity, strategic defensibility, and memorable impact across all customer communication touchpoints, ensuring your business leads the category conversation.'
      },
      {
        title: 'Omnichannel Customer Journey Architecture',
        text: 'Map seamless multi-touch customer journeys that harmonize organic content, paid acquisition, email nurture, and conversion touchpoints into a unified growth engine. We eliminate cross-channel friction and message dissonance, creating a cohesive brand experience that guides prospects smoothly from initial discovery to long-term advocacy. We establish unified attribution frameworks that track customer migration across channels, illuminate the exact multi-touch path to purchase, and continuously improve touchpoint effectiveness.'
      },
      {
        title: 'Quarterly Commercial Growth Roadmaps',
        text: 'Deliver structured quarterly growth roadmaps complete with phased milestones, resource allocation frameworks, and clear commercial KPI scorecards. Our strategic plans provide leadership teams with predictable execution timelines, transparent return-on-investment benchmarks, and adaptable contingency plans for volatile market conditions. We conduct monthly executive reviews to calibrate performance targets against actual business results and seize emerging market opportunities proactively with disciplined governance.'
      }
    ]
  },

  'services/website-design.html': {
    title: 'Website Design &amp; Web Development — JYSA Media',
    cards: [
      {
        title: 'User Interface &amp; Experience Design',
        text: 'Design bespoke, visually striking user interfaces with intuitive navigation hierarchies, modern typography, and interactive micro-animations that captivate visitors. Every design is crafted around user journey research, ensuring seamless desktop and mobile interactions that guide users naturally toward primary commercial actions. We produce detailed interactive prototypes and design systems that establish visual consistency across all brand properties, foster instant trust with prospective clients, and elevate digital brand authority across commercial categories.'
      },
      {
        title: 'High-Performance Web Engineering',
        text: 'Engineer lightning-fast, standards-compliant websites utilizing clean semantic HTML, modular CSS, and modern JavaScript with zero framework bloat. We prioritize sub-second load times, cross-browser compatibility, and strict accessibility standards to ensure flawless operation across all modern devices and operating systems. Our codebases pass stringent performance audits, ensuring frictionless user experiences, optimal search rankings, rock-solid stability, and minimal long-term maintenance overhead across updates.'
      },
      {
        title: 'Conversion Architecture &amp; Lead Funnels',
        text: 'Structure high-converting landing page layouts, persuasive value propositions, frictionless form pathways, and clear call-to-action hierarchies. We eliminate form fatigue, streamline user paths, and implement strategic social proof to transform casual web traffic into qualified business inquiries and paying customers. Our conversion-engineered layouts are tested rigorously across screen sizes to guarantee optimal response rates, higher average order values, and measurable commercial sales growth for your business.'
      }
    ]
  },

  'services/branding-creative.html': {
    title: 'Branding &amp; Creative Design Services — JYSA Media',
    cards: [
      {
        title: 'Brand Identity Systems',
        text: 'Develop comprehensive brand identity systems including logo marks, distinctive typography selections, cohesive color palettes, and comprehensive brand guidelines. We build timeless visual systems that communicate authority, professionalism, and uniqueness across digital screens, packaging, and physical brand touchpoints. Our identity kits equip internal teams with vector assets, spacing rules, and usage standards for effortless brand governance and lasting market recognition across channels in competitive industries worldwide.'
      },
      {
        title: 'Campaign Creative Direction',
        text: 'Provide high-level creative vision and conceptual storytelling for multi-channel marketing campaigns, brand launches, and visual identity refreshes. Our creative directors guide concept development, storyboarding, and aesthetic execution to ensure your brand stands out distinctly from competitors with emotional resonance. We craft distinctive campaign motifs that capture user attention, reinforce premium brand positioning, inspire audience advocacy, and drive genuine commercial impact across multiple quarters consistently.'
      },
      {
        title: 'High-Impact Marketing Collateral',
        text: 'Design premium marketing assets ranging from pitch decks, digital brochures, and one-sheeters to high-converting display banners and social media templates. Every collateral asset is designed to reinforce your primary brand narrative and empower your sales team with persuasive, polished commercial presentations. We tailor layouts for digital distribution and high-resolution print formats alike, ensuring complete brand prestige across every customer touchpoint and stakeholder presentation with uncompromising attention to detail.'
      }
    ]
  },

  'services/content-marketing.html': {
    title: 'Content Marketing &amp; Strategy Agency — JYSA Media',
    cards: [
      {
        title: 'Editorial Strategy &amp; Planning',
        text: 'Develop audience-first editorial calendars, topical authority clusters, and content distribution frameworks aligned with user intent and commercial goals. We identify customer pain points, search queries, and industry conversations to plan content that educates prospects and establishes your executive team as trusted industry thought leaders. Our content blueprints ensure every article, video, and social post serves a defined commercial outcome and builds lasting organic brand equity that compounds over time.'
      },
      {
        title: 'Conversion Copywriting &amp; Storytelling',
        text: 'Write compelling, conversion-focused copy for landing pages, technical thought-leadership articles, case studies, and email marketing sequences. Our copywriters combine clear brand voice with persuasive direct-response principles, distilling complex products and services into crystal-clear, benefit-driven messaging that converts. We conduct thorough customer research to reflect the exact vocabulary and priorities of your ideal clients and systematically remove buying objections at every funnel stage.'
      },
      {
        title: 'Omnichannel Content Syndication',
        text: 'Distribute and repurpose long-form pillar content into engaging social snippets, newsletter highlights, infographic graphics, and video talking points. We ensure every piece of high-value content reaches its maximum potential audience across search, social feeds, email subscribers, and partner publications. This compounding distribution model extracts maximum commercial reach from every creative asset produced and drives compounding organic referral traffic month over month without extra ad spend.'
      }
    ]
  },

  'services/influencer-marketing.html': {
    title: 'Influencer Marketing &amp; Talent Agency — JYSA Media',
    cards: [
      {
        title: 'Audience Vetting &amp; Creator Discovery',
        text: 'Identify and vet relevant niche creators and digital influencers based on audience demographics, engagement authenticity, and genuine brand affinity. We conduct rigorous audience quality audits to detect bot activity and fake followers, ensuring your influencer investments connect with real, active consumer audiences. Our proprietary vetting criteria guarantee alignment with your brand reputation, compliance standards, audience values, and commercial growth objectives, protecting campaign capital and brand integrity.'
      },
      {
        title: 'End-to-End Campaign Management',
        text: 'Oversee end-to-end influencer partnerships including contract negotiations, creative briefs, content review workflows, and FTC compliance monitoring. We coordinate delivery timelines and manage creator communications seamlessly, ensuring your brand guidelines are respected while allowing creators the creative freedom to connect authentically. We handle licensing rights, usage permissions, deliverables tracking, and payment milestones securely and professionally from start to completion without administrative friction.'
      },
      {
        title: 'Attribution &amp; ROI Analytics',
        text: 'Track real commercial campaign results using custom UTM parameters, creator affiliate links, promo codes, and audience reach analytics. We measure direct sales lift, brand search volume increases, and earned media value to provide transparent reporting on overall creator return on investment. Our post-campaign audits identify top-performing partners for long-term brand ambassador contracts that drive sustainable, cost-effective customer acquisition across commercial channels and maximize creator performance.'
      }
    ]
  },

  'services/website-seo.html': {
    title: 'Website Design &amp; Organic SEO Services — JYSA Media',
    cards: [
      {
        title: 'Responsive Web Design &amp; Architecture',
        text: 'Architect modern, visually engaging web designs engineered for intuitive user navigation, rapid page speed, and seamless mobile responsiveness. We combine aesthetic elegance with search-first site hierarchies, ensuring both search engine crawlers and human visitors enjoy an exceptional browsing experience. Our responsive layouts are tested across all viewport dimensions to maintain visual fidelity, brand sophistication, intuitive touch targets, and conversion focus on every screen resolution.'
      },
      {
        title: 'Technical Search Optimization',
        text: 'Implement robust technical SEO foundations including clean URL hierarchies, structured data schemas, XML sitemaps, and Core Web Vitals optimization. We eliminate render-blocking scripts, optimize responsive images, and resolve indexing directives to ensure high search engine visibility from launch. Our clean code practices ensure maximum crawl budget efficiency, rapid mobile rendering, and accelerated indexation for new content without technical debt or rendering lag.'
      },
      {
        title: 'Organic Search Revenue Engine',
        text: 'Combine high-converting on-page copy with targeted keyword optimization and topical content clusters that attract high-intent commercial search traffic. We help brands secure top rankings for valuable search queries, generating an ongoing stream of qualified leads without perpetual reliance on paid ad spend. We implement ongoing rank tracking and competitive monitoring to protect search authority, defend valuable search positions, and expand market share year over year.'
      }
    ]
  }
};

// Updates for 5 inner pages
const INNER_PAGE_UPDATES = {
  'pages/about.html': {
    title: 'About JYSA Media — Digital Marketing &amp; Growth Agency',
    cards: [
      {
        title: 'Strategy &amp; Market Research',
        text: 'We formulate data-informed brand positioning, audience segmentation, and multi-channel digital roadmaps aligned with core commercial objectives. Our strategic consulting identifies untapped market opportunities, clarifies unique value propositions, and establishes unified KPI scorecards for sustainable client growth.'
      },
      {
        title: 'Creative Direction &amp; Brand Systems',
        text: 'We craft distinctive brand visual systems, campaign storytelling concepts, and platform-native content engines that capture audience attention. From visual identity kits to short-form video production, our creative work is engineered to elevate brand recall and inspire lasting customer loyalty.'
      },
      {
        title: 'Performance Marketing &amp; Paid Media',
        text: 'We combine precision paid media execution across Google Ads, Meta Ads, and programmatic channels with disciplined conversion rate optimization. Every campaign is continuously tested, analyzed, and refined to lower customer acquisition costs and maximize return on media investment.'
      },
      {
        title: 'Search Engine Optimization &amp; Authority',
        text: 'We engineer technical SEO foundations, topical content clusters, and authoritative search strategies that build sustainable organic visibility. By solving crawl bottlenecks and aligning with search intent, we help brands capture high-intent commercial searches and compound long-term organic traffic.'
      },
      {
        title: 'Modern Web Engineering &amp; Architecture',
        text: 'We design and develop lightning-fast, responsive web applications built with clean semantic code, modern typography, and friction-free user flows. Our websites are optimized for sub-second load times and seamless cross-device experiences that convert casual visitors into qualified customers.'
      },
      {
        title: 'Data Analytics &amp; Attribution Modeling',
        text: 'We configure server-side tracking, Google Tag Manager event architecture, and comprehensive reporting dashboards for complete data transparency. Our analytics frameworks provide actionable insights into customer journeys, campaign profitability, and multi-touch marketing attribution.'
      }
    ]
  },

  'pages/services.html': {
    title: 'Digital Marketing &amp; Growth Services — JYSA Media',
    cards: [
      {
        title: '<a href="/services/social-media" style="color:inherit; text-decoration:none;">01. Social Media Marketing →</a>',
        text: 'Full-service social media management across Instagram, Facebook, and LinkedIn. We build engaged communities, execute structured content calendars, produce viral reels, and amplify organic reach. Our team develops algorithmic-friendly content formats that drive brand recall, foster active comment conversations, and convert social followers into qualified inquiries.'
      },
      {
        title: '<a href="/services/branding-creative" style="color:inherit; text-decoration:none;">02. Branding &amp; Creative →</a>',
        text: 'Strategic brand positioning, cohesive visual identities, and campaign creative direction. We shape distinct market identities through typography, color systems, brand guidelines, and compelling marketing collateral. Every visual asset is engineered to establish immediate authority and differentiate your company in competitive commercial sectors.'
      },
      {
        title: '<a href="/services/performance-marketing" style="color:inherit; text-decoration:none;">03. Performance Marketing →</a>',
        text: 'High-ROI paid media campaigns across Meta Ads, Google Ads, and emerging platforms. We leverage rigorous multivariate creative testing, algorithmic bidding, and funnel optimization to drive customer acquisition. Our performance specialists manage live budgets with discipline, scaling profitable campaigns while minimizing wasted media spend.'
      },
      {
        title: '<a href="/services/content-marketing" style="color:inherit; text-decoration:none;">04. Content Marketing →</a>',
        text: 'Audience-first storytelling that turns passive readers into active customers. We produce high-converting landing page copy, technical articles, short-form video scripts, and multi-channel campaign assets. Our editorial frameworks establish your brand as an industry thought leader and generate inbound inquiries consistently.'
      },
      {
        title: '<a href="/services/influencer-marketing" style="color:inherit; text-decoration:none;">05. Influencer Marketing →</a>',
        text: 'Data-driven creator discovery and end-to-end influencer partnerships. We manage talent sourcing, contract negotiations, creative briefs, and campaign analytics to maximize authentic reach and brand trust. Our vetting process eliminates fake followers, ensuring your brand message reaches genuine, engaged target audiences.'
      },
      {
        title: '<a href="/services/website-seo" style="color:inherit; text-decoration:none;">06. Website &amp; SEO →</a>',
        text: 'Custom website design and technical search engine optimization engineered for organic discoverability and conversions. We build lightning-fast web applications with clean semantic code and local search dominance. Our websites combine aesthetic elegance with technical rigor for sustainable organic growth.'
      },
      {
        title: '<a href="/services/digital-strategy" style="color:inherit; text-decoration:none;">07. Digital Strategy →</a>',
        text: 'Comprehensive growth blueprints aligning digital channels with high-level commercial objectives. We conduct competitor intelligence, audience research, and multi-quarter campaign planning to ensure sustainable ROI. Our roadmaps give leadership teams clear milestones, budget allocations, and execution timelines.'
      },
      {
        title: '<a href="/services/seo" style="color:inherit; text-decoration:none;">08. Search Engine Optimization →</a>',
        text: 'Technical SEO audits, keyword gap analysis, and content optimization to capture top search rankings. We resolve indexing issues, enhance Core Web Vitals, and build topical authority clusters that drive high-intent commercial search traffic directly to your primary product and service offerings.'
      },
      {
        title: '<a href="/services/paid-advertising" style="color:inherit; text-decoration:none;">09. Paid Advertising &amp; PPC →</a>',
        text: 'Precision search and display ad management across Google Ads and Microsoft Advertising. We deploy high-converting ad copy, negative keyword filters, and smart bidding models to capture qualified purchase intent and lower your blended customer acquisition costs.'
      }
    ]
  },

  'pages/work.html': {
    title: 'Our Work &amp; Client Growth Case Studies — JYSA Media',
    cards: [
      {
        title: 'E-Commerce Growth: +184% Revenue',
        text: 'Scaled top-line e-commerce revenue by +184% through high-intent Meta and Google shopping funnels, audience retargeting, and landing page checkout rate optimization that maximized return on media spend. Our multi-tiered campaign architecture focused on lowering blended cost-per-acquisition while scaling high-margin catalog items during key promotional quarters. We implemented server-side conversion tracking to recover lost attribution data and optimized product page value propositions to improve add-to-cart rates. Comprehensive multivariate creative testing identified top-performing visual formats that sustained high conversion momentum over multiple quarters.'
      },
      {
        title: 'Healthcare Practice: 3.8X Qualified Bookings',
        text: 'Generated a 3.8X lift in verified patient appointment bookings utilizing hyper-local search marketing, technical SEO enhancements, and conversion-engineered landing pages designed for patient trust. By structuring mobile-first inquiry pathways and ranking for high-intent medical queries, we eliminated administrative booking friction. We streamlined consultation request forms, added prominent trust credentials, and deployed automated appointment confirmation workflows to lower no-show rates. Targeted local review generation and map pack optimization established dominant market authority in local geographic territories.'
      },
      {
        title: 'Commercial Construction: +220% Qualified Leads',
        text: 'Drove a +220% increase in qualified commercial contractor and residential project leads through targeted B2B lead generation funnels, localized search campaigns, and automated inquiry follow-up workflows. We engineered high-authority landing page experiences that highlighted verified project credentials and accelerated commercial consultation requests. Our team built multi-step quote calculators and interactive project galleries that engaged high-value commercial property developers. Detailed lead qualification filters ensured sales teams focused exclusively on high-margin commercial opportunities.'
      }
    ]
  },

  'pages/careers.html': {
    title: 'Careers &amp; Creative Agency Opportunities — JYSA Media',
    cards: [
      {
        title: 'Creative &amp; Design Roles',
        text: 'We collaborate with art directors, graphic designers, copywriters, and video editors passionate about crafting high-impact brand identities. Our creative team develops campaign concepts, thumb-stopping short-form video assets, and cohesive visual systems for ambitious brands. Team members work in collaborative sprints with direct creative ownership, producing original assets that define modern brand aesthetics.'
      },
      {
        title: 'Performance &amp; Media Buying',
        text: 'We seek performance marketers, media buyers, and data analysts skilled in Meta Ads, Google Ads, and conversion funnel optimization. Our performance unit focuses on empirical testing, budget efficiency, and measurable acquisition across diverse commercial sectors. Marketers manage live ad budgets with advanced attribution tools, making data-driven decisions that deliver verified client revenue impact.'
      },
      {
        title: 'Technology &amp; Web Engineering',
        text: 'We welcome frontend web developers, UI/UX designers, and technical SEO specialists dedicated to building lightning-fast digital experiences. Our technology team ensures responsive interfaces, modern web standards, and friction-free user journeys. Developers build clean, high-performance web products with zero framework bloat, prioritizing fast load times and clean semantic accessibility.'
      },
      {
        title: 'Agency Culture &amp; Growth',
        text: 'At JYSA Media, we foster a meritocratic, transparent culture built on craft excellence, rapid experimentation, and continuous learning. Team members receive dedicated budgets for professional courses, access to cutting-edge marketing technology, and opportunities to lead client strategy directly. We celebrate high standards and support individual career growth.'
      }
    ]
  },

  'pages/contact.html': {
    title: 'Contact JYSA Media — Let\'s Grow Your Brand Online',
    cards: [
      {
        title: 'Direct Inquiries &amp; Project Briefs',
        text: 'Send us an inquiry or project brief anytime at <a href="mailto:hello@jysamedia.in" style="color:inherit; font-weight:700;">hello@jysamedia.in</a>. Our strategy team typically responds within one business day with actionable next steps. Whether you need a dedicated performance marketing team, a complete brand identity redesign, or a technical SEO overhaul, our leadership team reviews all incoming requirements personally to prepare initial insights before our first discussion. We provide transparent scoping, clear implementation milestones, and complete commercial confidentiality for every prospective partnership.'
      },
      {
        title: 'Website &amp; Digital Resources',
        text: 'Explore our full service categories, verified case studies, and digital capabilities at <a href="https://www.jysamedia.in" style="color:inherit; font-weight:700;">www.jysamedia.in</a>. Access our published client results, explore capability breakdowns across commercial industries, or trigger our interactive Let\'s Talk consultation modal from any page on the website. We provide comprehensive documentation of our methodologies, service tiers, and deliverables to help you evaluate how our team can accelerate your marketing performance across digital touchpoints.'
      },
      {
        title: 'Discovery &amp; Strategic Roadmap',
        text: 'Share your marketing objectives, current growth bottlenecks, and commercial targets. We schedule a collaborative consultation to evaluate high-leverage strategic opportunities. During our initial discussion, we review current channel performance, examine acquisition benchmarks, and formulate actionable implementation phases tailored specifically to your business model. You will receive an initial strategic roadmap outlining quick wins, budget allocation recommendations, and long-term scaling opportunities designed for predictable commercial expansion.'
      }
    ]
  }
};

// Process Service Pages
console.log('Updating 10 Service Pages...');
for (const [relPath, data] of Object.entries(SERVICE_UPDATES)) {
  const filePath = path.join(FRONTEND_DIR, relPath);
  let html = fs.readFileSync(filePath, 'utf8');

  // Update Title
  html = html.replace(/<title>.*?<\/title>/is, `<title>${data.title}</title>`);

  // Build new detail-grid cards
  const cardsHtml = data.cards.map(c => `        <article class="detail-card">
          <strong>${c.title}</strong>
          <p>${c.text}</p>
        </article>`).join('\n\n');

  // Replace detail-grid section
  const gridRegex = /<section class="detail-grid"[^>]*>[\s\S]*?<\/section>/i;
  const newGrid = `<section class="detail-grid" aria-label="Capabilities">
${cardsHtml}
      </section>`;
  html = html.replace(gridRegex, newGrid);

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`✓ Updated ${relPath}`);
}

// Process Inner Pages
console.log('\nUpdating 5 Inner Pages...');
for (const [relPath, data] of Object.entries(INNER_PAGE_UPDATES)) {
  const filePath = path.join(FRONTEND_DIR, relPath);
  let html = fs.readFileSync(filePath, 'utf8');

  // Update Title
  html = html.replace(/<title>.*?<\/title>/is, `<title>${data.title}</title>`);

  // Build new page-grid cards
  const cardsHtml = data.cards.map((c, i) => `        <article class="card" id="card-${i + 1}">
          <strong>${c.title}</strong>
          <p>${c.text}</p>
        </article>`).join('\n\n');

  // Replace page-grid section
  const gridRegex = /<section class="page-grid"[^>]*>[\s\S]*?<\/section>/i;
  const newGrid = `<section class="page-grid">
${cardsHtml}
      </section>`;
  html = html.replace(gridRegex, newGrid);

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`✓ Updated ${relPath}`);
}

console.log('\nAll pages updated successfully!');
