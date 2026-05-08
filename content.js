// Tech Detector Pro v3.1 — Content Script
// Bulletproof CMS/Theme detection, SEO issues, broken images, stack fingerprinting

(function () {
  'use strict';

  /* ── Mini helpers ──────────────────────────────────────── */
  const w  = window;
  const d  = document;
  const qs  = (sel, ctx) => { try { return (ctx||d).querySelector(sel); } catch(e) { return null; } };
  const qsa = (sel, ctx) => { try { return [...(ctx||d).querySelectorAll(sel)]; } catch(e) { return []; } };
  const safe = (fn, fb) => { try { const r = fn(); return (r === undefined || r === null) ? (fb !== undefined ? fb : '') : r; } catch(e) { return fb !== undefined ? fb : ''; } };
  const titleCase = s => String(s||'').replace(/[-_]/g,' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
  const getMeta = (...names) => {
    for (const n of names) {
      const el = qs(`meta[name="${n}"],meta[property="${n}"],meta[http-equiv="${n}"]`);
      if (el) return el.getAttribute('content') || '';
    }
    return '';
  };

  /* ═══════════════════════════════════════════════════════════
     CMS SCORING ENGINE
     Each CMS has weighted signals. If total score >= threshold
     that CMS is considered detected. The one with the highest
     score wins (prevents false positives).
  ═══════════════════════════════════════════════════════════ */
  function scoreCMS() {
    const platforms = [

      /* SHOPIFY */
      { name:'Shopify', icon:'🛍️', color:'#96bf48', link:'https://shopify.com', threshold:8,
        signals:[
          [()=>!!w.Shopify,                                               12],
          [()=>!!w.ShopifyAnalytics,                                      10],
          [()=>!!qs('meta[name="shopify-checkout-api-token"]'),            12],
          [()=>!!qs('script[src*="cdn.shopify.com"]'),                      9],
          [()=>!!qs('link[href*="cdn.shopify.com"]'),                       8],
          [()=>!!qs('[data-shopify-feature]'),                              8],
          [()=>!!qs('script[src*="pay.shopify.com"]'),                     10],
          [()=>!!qs('link[rel="canonical"][href*=".myshopify.com"]'),       9],
          [()=>location.hostname.endsWith('.myshopify.com'),               15],
          [()=>!!w.Shopify?.shop,                                           6],
          [()=>d.cookie.includes('_shopify'),                               7],
          [()=>!!qs('body[class*="template-"]') && !!w.Shopify,            8],
        ]
      },

      /* WORDPRESS */
      { name:'WordPress', icon:'📝', color:'#21759b', link:'https://wordpress.org', threshold:8,
        signals:[
          [()=>!!qs('link[href*="/wp-content/"]'),                         10],
          [()=>!!qs('link[href*="/wp-includes/"]'),                        10],
          [()=>!!qs('script[src*="/wp-content/"]'),                        10],
          [()=>!!qs('script[src*="/wp-includes/"]'),                       10],
          [()=>getMeta('generator').toLowerCase().includes('wordpress'),   12],
          [()=>!!qs('link[rel="https://api.w.org/"]'),                     12],
          [()=>!!qs('#wpadminbar'),                                         12],
          [()=>!!w.wp,                                                       8],
          [()=>!!w.wpApiSettings,                                            8],
          [()=>location.pathname.includes('/wp-'),                           5],
          [()=>(qs('body')?.className||'').includes('wp-'),                  6],
          [()=>!!qs('link[href*="wp-json"]'),                               7],
          [()=>!!qs('script[id$="-js"][src*="/wp-content/"]'),              9],
        ]
      },

      /* WEBFLOW */
      { name:'Webflow', icon:'🌊', color:'#4353ff', link:'https://webflow.com', threshold:8,
        signals:[
          [()=>!!qs('[data-wf-site]'),                                      12],
          [()=>!!qs('[data-wf-page]'),                                      12],
          [()=>getMeta('generator').includes('Webflow'),                    14],
          [()=>!!qs('script[src*="webflow.com"]'),                          10],
          [()=>!!qs('link[href*="uploads-ssl.webflow.com"]'),               10],
          [()=>!!qs('link[href*="assets.website-files.com"]'),              10],
          [()=>!!qs('script[src*="assets.website-files.com"]'),              9],
          [()=>d.documentElement.className.includes('w-mod-'),               8],
          [()=>!!qs('.w-nav,.w-section,.w-container,.w-richtext'),           7],
          [()=>location.hostname.endsWith('.webflow.io'),                   15],
        ]
      },

      /* SQUARESPACE */
      { name:'Squarespace', icon:'⬛', color:'#ffffff', link:'https://squarespace.com', threshold:8,
        signals:[
          [()=>!!w.Squarespace,                                             12],
          [()=>!!w.Static?.SQUARESPACE_CONTEXT,                             14],
          [()=>!!qs('script[src*="squarespace.com"]'),                      10],
          [()=>!!qs('[data-sqs-type]'),                                      9],
          [()=>!!qs('.sqs-block,.sqs-row'),                                  9],
          [()=>!!qs('[id="siteWrapper"]'),                                   8],
          [()=>location.hostname.endsWith('.squarespace.com'),              15],
          [()=>!!qs('link[href*="squarespace.com"]'),                        8],
          [()=>!!qs('[class*="sqs-layout"]'),                                7],
        ]
      },

      /* WIX */
      { name:'Wix', icon:'🌐', color:'#faad00', link:'https://wix.com', threshold:8,
        signals:[
          [()=>!!w.wixBiSession,                                            12],
          [()=>!!qs('[data-mesh-id]'),                                      10],
          [()=>!!qs('script[src*="static.wixstatic.com"]'),                 10],
          [()=>!!qs('link[href*="static.wixstatic.com"]'),                  10],
          [()=>!!qs('[id^="SITE_CONTAINER"]'),                              10],
          [()=>location.hostname.endsWith('.wix.com'),                      12],
          [()=>location.hostname.endsWith('.wixsite.com'),                  12],
          [()=>!!qs('script[src*="parastorage.com"]'),                       7],
        ]
      },

      /* FRAMER */
      { name:'Framer', icon:'🖼️', color:'#0099ff', link:'https://framer.com', threshold:8,
        signals:[
          [()=>getMeta('generator').includes('Framer'),                     14],
          [()=>!!qs('script[src*="framer.com"]'),                           10],
          [()=>!!qs('[data-framer-component-type]'),                        10],
          [()=>!!qs('[data-framer-name]'),                                    9],
          [()=>location.hostname.endsWith('.framer.app'),                   15],
          [()=>location.hostname.endsWith('.framer.website'),               15],
        ]
      },

      /* GHOST */
      { name:'Ghost', icon:'👻', color:'#15212a', link:'https://ghost.org', threshold:8,
        signals:[
          [()=>getMeta('generator').toLowerCase().includes('ghost'),        14],
          [()=>!!qs('link[href*="/content/themes/"]'),                      12],
          [()=>!!w.ghost,                                                   12],
          [()=>!!qs('[data-members-form]'),                                  9],
          [()=>location.hostname.endsWith('.ghost.io'),                     15],
        ]
      },

      /* DRUPAL */
      { name:'Drupal', icon:'💧', color:'#009dde', link:'https://drupal.org', threshold:8,
        signals:[
          [()=>!!w.Drupal,                                                  14],
          [()=>getMeta('generator').includes('Drupal'),                     12],
          [()=>!!qs('script[src*="/sites/default/files/"]'),                10],
          [()=>!!qs('link[href*="/sites/default/files/"]'),                 10],
          [()=>!!qs('[data-drupal-link-query],[data-drupal-selector]'),      9],
          [()=>!!qs('script[src*="/core/misc/drupal"]'),                    12],
        ]
      },

      /* JOOMLA */
      { name:'Joomla', icon:'🔵', color:'#f44321', link:'https://joomla.org', threshold:8,
        signals:[
          [()=>getMeta('generator').toLowerCase().includes('joomla'),       14],
          [()=>!!w.Joomla,                                                  12],
          [()=>!!qs('script[src*="/media/system/js/"]'),                    10],
          [()=>!!qs('a[href*="option=com_"]'),                               9],
        ]
      },

      /* MAGENTO */
      { name:'Magento', icon:'🛒', color:'#ee672d', link:'https://magento.com', threshold:8,
        signals:[
          [()=>!!w.Mage,                                                    14],
          [()=>!!qs('[data-mage-init]'),                                    10],
          [()=>!!qs('script[type="text/x-magento-init"]'),                 12],
          [()=>!!qs('script[src*="mage/"]'),                                10],
        ]
      },

      /* HUBSPOT CMS */
      { name:'HubSpot CMS', icon:'🟠', color:'#ff7a59', link:'https://cms.hubspot.com', threshold:8,
        signals:[
          [()=>getMeta('generator').toLowerCase().includes('hubspot'),      14],
          [()=>!!qs('script[src*="hs-scripts.com"]'),                       10],
          [()=>location.hostname.endsWith('.hs-sites.com'),                 14],
          [()=>location.hostname.endsWith('.hubspot.com'),                  12],
        ]
      },

      /* PRESTASHOP */
      { name:'PrestaShop', icon:'🛍️', color:'#25b9d7', link:'https://prestashop.com', threshold:8,
        signals:[
          [()=>!!w.prestashop,                                              14],
          [()=>getMeta('generator').toLowerCase().includes('prestashop'),   12],
          [()=>!!qs('script[src*="prestashop"]'),                            9],
        ]
      },

    ];

    let best = null;
    let bestScore = 0;

    for (const p of platforms) {
      let score = 0;
      for (const [signal, pts] of p.signals) {
        if (safe(signal, false)) score += pts;
        if (score >= 30) break; // very confident, stop early
      }
      if (score >= p.threshold && score > bestScore) {
        bestScore = score;
        best = { name:p.name, icon:p.icon, color:p.color, link:p.link, detectionScore:score };
      }
    }

    if (best) {
      // Append version for supported CMS
      let version = '';
      if (best.name === 'WordPress') {
        const m = getMeta('generator').match(/WordPress\s*([\d.]+)/);
        version = m ? m[1] : '';
      } else if (best.name === 'Ghost') {
        const m = getMeta('generator').match(/Ghost\s*([\d.]+)/);
        version = m ? m[1] : '';
      } else if (best.name === 'Drupal') {
        const m = getMeta('generator').match(/Drupal\s*([\d.]+)/);
        version = m ? m[1] : '';
      }
      best.version = version;
    }

    return best;
  }

  /* ══════════════════════════════════════════════════════════
     THEME DETECTION  — runs after CMS is identified
  ══════════════════════════════════════════════════════════ */
  function detectTheme(cms) {
    if (!cms) return null;

    /* Shopify */
    if (cms.name === 'Shopify') {
      const t = safe(() => w.Shopify?.theme, {});
      const name    = t?.name    || '';
      const id      = t?.id      || '';
      const handle  = t?.handle  || '';
      const role    = t?.role    || '';
      const storeId = t?.theme_store_id || null;

      // Infer name from CDN URL patterns when window.Shopify.theme.name is absent
      let inferred = name;
      if (!inferred) {
        const skip = new Set(['theme','vendor','sections','index','cart','product','collection',
          'customer','search','password','checkout','jquery','bootstrap','slick','swiper',
          'aos','lazysizes','application','base','global','main','core','predictive']);
        const els = qsa('script[src*="cdn.shopify.com"],link[href*="cdn.shopify.com"]');
        outer:
        for (const el of els) {
          const src = el.src || el.href || '';
          for (const re of [
            /\/t\/\d+\/assets\/([a-z][a-z0-9-]+?)(?:\.min)?\.js(?:\?|$)/i,
            /\/t\/\d+\/assets\/([a-z][a-z0-9-]+?)(?:\.min)?\.css(?:\?|$)/i,
          ]) {
            const m = src.match(re);
            if (m && !skip.has(m[1].toLowerCase())) { inferred = titleCase(m[1]); break outer; }
          }
        }
      }

      return {
        cms:'Shopify',
        name: name || inferred || 'Shopify Theme',
        rawName: name, id: String(id), handle, role,
        storeId: storeId ? String(storeId) : '',
        storeUrl: storeId ? `https://themes.shopify.com/themes/${storeId}/previews` : '',
        browseUrl:'https://themes.shopify.com',
        confidence: name ? 'high' : inferred ? 'medium' : 'low',
        icon:'🛍️'
      };
    }

    /* WordPress */
    if (cms.name === 'WordPress') {
      const found = [];
      // 1. Stylesheets
      for (const l of qsa('link[rel="stylesheet"]')) {
        const m = l.href.match(/wp-content\/themes\/([^/?#]+)\//);
        if (m && !found.includes(m[1])) found.push(m[1]);
      }
      // 2. Scripts
      if (found.length === 0) {
        for (const s of qsa('script[src*="wp-content/themes/"]')) {
          const m = s.src.match(/wp-content\/themes\/([^/?#]+)\//);
          if (m && !found.includes(m[1])) found.push(m[1]);
        }
      }
      // 3. Body class fallback
      if (found.length === 0 && d.body) {
        for (const cls of d.body.className.split(/\s+/)) {
          if (cls.startsWith('theme-') && cls.length > 6) { found.push(cls.slice(6)); break; }
        }
      }
      const slug       = found[0] || '';
      const parentSlug = found[1] || '';
      return {
        cms:'WordPress', name: slug ? titleCase(slug) : 'WordPress Theme',
        slug, parentSlug, parentName: parentSlug ? titleCase(parentSlug) : '',
        storeUrl: slug ? `https://wordpress.org/themes/${slug}/` : '',
        browseUrl:'https://wordpress.org/themes/',
        isAdmin: !!qs('#wpadminbar'),
        confidence: found.length ? 'high' : 'low', icon:'📝'
      };
    }

    /* Squarespace */
    if (cms.name === 'Squarespace') {
      const ctx = safe(() => w.Static?.SQUARESPACE_CONTEXT || {}, {});
      const tplId  = ctx.templateId || ctx.templateName || '';
      const ver    = ctx.templateVersion || '';
      let bodyTpl  = '';
      if (d.body) { const m = d.body.className.match(/sqs-layout-([a-z0-9-]+)/i); if (m) bodyTpl = m[1]; }
      const name = tplId || bodyTpl || 'Squarespace Template';
      return {
        cms:'Squarespace', name: titleCase(name), templateId:tplId, version:ver,
        storeUrl:'https://www.squarespace.com/templates',
        browseUrl:'https://www.squarespace.com/templates',
        confidence: tplId ? 'high' : bodyTpl ? 'medium' : 'low', icon:'⬛'
      };
    }

    /* Webflow */
    if (cms.name === 'Webflow') {
      const siteId = safe(() => qs('[data-wf-site]')?.getAttribute('data-wf-site') || '');
      return {
        cms:'Webflow', name:'Webflow Project', siteId,
        storeUrl:'https://webflow.com/marketplace/templates',
        browseUrl:'https://webflow.com/marketplace',
        confidence: siteId ? 'high' : 'medium', icon:'🌊'
      };
    }

    /* Ghost */
    if (cms.name === 'Ghost') {
      let slug = '', name = '';
      for (const l of qsa('link[rel="stylesheet"]')) {
        const m = l.href.match(/\/content\/themes\/([^/?#]+)\//);
        if (m) { slug = m[1]; name = titleCase(slug); break; }
      }
      return {
        cms:'Ghost', name: name || 'Ghost Theme', slug,
        storeUrl:'https://ghost.org/themes/',
        browseUrl:'https://ghost.org/themes/',
        confidence: slug ? 'high' : 'low', icon:'👻'
      };
    }

    /* Wix */
    if (cms.name === 'Wix') {
      const tplId = safe(() => w.wixBiSession?.templateId || '', '');
      return {
        cms:'Wix', name: tplId ? `Wix Template #${tplId}` : 'Wix Template', templateId:tplId,
        storeUrl:'https://www.wix.com/website/templates',
        browseUrl:'https://www.wix.com/website/templates',
        confidence: tplId ? 'medium' : 'low', icon:'🌐'
      };
    }

    /* Framer */
    if (cms.name === 'Framer') {
      return { cms:'Framer', name:'Framer Site', storeUrl:'https://www.framer.com/marketplace/', browseUrl:'https://www.framer.com/marketplace/', confidence:'medium', icon:'🖼️' };
    }

    /* Magento */
    if (cms.name === 'Magento') {
      let themeName = '';
      for (const l of qsa('link[rel="stylesheet"]')) {
        const m = l.href.match(/frontend\/([^/]+)\/([^/]+)\//);
        if (m) { themeName = titleCase(m[2]); break; }
      }
      return { cms:'Magento', name: themeName || 'Magento Theme', storeUrl:'https://marketplace.magento.com/extensions/themes.html', browseUrl:'https://marketplace.magento.com/extensions/themes.html', confidence: themeName ? 'high' : 'low', icon:'🛒' };
    }

    return { cms:cms.name, name:`${cms.name} Theme`, storeUrl:'', browseUrl:'', confidence:'low', icon:cms.icon||'🎨' };
  }

  /* ══════════════════════════════════════════════════════════
     FRONTEND / BACKEND STACK
  ══════════════════════════════════════════════════════════ */
  function detectStack() {
    const frontend = [], backend = [], hosting = [];

    // Frontend
    if (w.React || w.__REACT_DEVTOOLS_GLOBAL_HOOK__ || qs('[data-reactroot],[data-reactid]'))
      frontend.push({ name:'React', icon:'⚛️', color:'#61dafb', link:'https://react.dev' });
    if (w.__NEXT_DATA__ || qs('script[src*="_next/static"]'))
      frontend.push({ name:'Next.js', icon:'▲', color:'#ffffff', link:'https://nextjs.org' });
    if ((w.Vue || w.__VUE__ || w.__vue_app__ || qs('[data-v-app]')) && !w.__NEXT_DATA__)
      frontend.push({ name:'Vue.js', icon:'💚', color:'#42b883', link:'https://vuejs.org' });
    if (w.__NUXT__ || w.$nuxt)
      frontend.push({ name:'Nuxt.js', icon:'💚', color:'#00dc82', link:'https://nuxt.com' });
    if (w.angular || qs('[ng-version]'))
      frontend.push({ name:'Angular', icon:'🔴', color:'#dd0031', link:'https://angular.io' });
    if (w.__svelte || qs('[class*="svelte-"]'))
      frontend.push({ name:'Svelte', icon:'🧡', color:'#ff3e00', link:'https://svelte.dev' });
    if (qs('script[src*="/_app/"]') || w.__sveltekit_dev)
      frontend.push({ name:'SvelteKit', icon:'🧡', color:'#ff3e00', link:'https://kit.svelte.dev' });
    if (w.___gatsby || qs('#gatsby-chunk-uuid'))
      frontend.push({ name:'Gatsby', icon:'💜', color:'#663399', link:'https://gatsbyjs.com' });
    if (w.__remixContext)
      frontend.push({ name:'Remix', icon:'💿', color:'#e8f2ff', link:'https://remix.run' });
    if (getMeta('generator').includes('Astro') || qs('[data-astro-source-file]'))
      frontend.push({ name:'Astro', icon:'🚀', color:'#ff5d01', link:'https://astro.build' });

    // Backend (inferred from DOM signals)
    if (qs('[name="csrfmiddlewaretoken"]'))
      backend.push({ name:'Django / Python', icon:'🐍', color:'#092e20', link:'https://djangoproject.com' });
    if (qsa('script[src]').some(s => s.src.includes('rails-ujs') || s.src.includes('actioncable')))
      backend.push({ name:'Ruby on Rails', icon:'💎', color:'#cc0000', link:'https://rubyonrails.org' });
    if (qs('input[name="_token"]') && !qs('[name="csrfmiddlewaretoken"]'))
      backend.push({ name:'Laravel / PHP', icon:'🐘', color:'#ff2d20', link:'https://laravel.com' });
    if (qsa('a[href],script[src]').some(el => /\.(jsp|jspx|do)(\?|$)/.test(el.href||el.src||'')))
      backend.push({ name:'Java / JSP', icon:'☕', color:'#f89820', link:'https://java.com' });
    if (qsa('a[href],script[src],link[href]').some(el => (el.href||el.src||'').includes('.aspx')))
      backend.push({ name:'ASP.NET', icon:'🔷', color:'#512bd4', link:'https://dotnet.microsoft.com' });
    if (!backend.length && qsa('a[href],script[src]').some(el => (el.href||el.src||'').includes('.php')))
      backend.push({ name:'PHP', icon:'🐘', color:'#777bb4', link:'https://php.net' });

    // Hosting
    if (w.__VERCEL_INSIGHTS_SCRIPT__ || qs('script[src*="vercel"]') || location.hostname.includes('.vercel.app'))
      hosting.push({ name:'Vercel', icon:'▲', color:'#000000', link:'https://vercel.com' });
    else if (qs('script[src*="netlify"]') || location.hostname.includes('.netlify.app'))
      hosting.push({ name:'Netlify', icon:'🟩', color:'#00c7b7', link:'https://netlify.com' });
    else if (location.hostname.includes('.github.io'))
      hosting.push({ name:'GitHub Pages', icon:'🐙', color:'#24292e', link:'https://pages.github.com' });
    else if (location.hostname.includes('.cloudflare') || location.hostname.includes('.pages.dev'))
      hosting.push({ name:'Cloudflare Pages', icon:'☁️', color:'#f38020', link:'https://pages.cloudflare.com' });
    else if (location.hostname.includes('.render.com'))
      hosting.push({ name:'Render', icon:'🟣', color:'#46e3b7', link:'https://render.com' });
    else if (location.hostname.includes('.railway.app'))
      hosting.push({ name:'Railway', icon:'🚂', color:'#0b0d0e', link:'https://railway.app' });
    else if (location.hostname.includes('.fly.dev'))
      hosting.push({ name:'Fly.io', icon:'✈️', color:'#7c3aed', link:'https://fly.io' });

    return { frontend, backend, hosting };
  }

  /* ── Color Palette ─────────────────────────────────────── */
  function detectColors() {
    const result = [], seen = new Set();
    const add = (src, val) => {
      const v = String(val||'').trim();
      if (!v || seen.has(v) || /^(transparent|inherit|initial|currentcolor|none|unset|auto)$/i.test(v)) return;
      seen.add(v); result.push({ source:src, value:v });
    };
    const tc = qs('meta[name="theme-color"]');
    if (tc?.content) add('theme-color', tc.content);
    const rs = safe(() => getComputedStyle(d.documentElement));
    if (rs) {
      for (const p of ['--primary','--secondary','--accent','--background','--foreground',
        '--color-primary','--color-secondary','--color-accent','--color-bg','--color-text',
        '--brand','--brand-color','--bg','--fg','--link','--surface','--highlight','--muted',
        '--clr-primary','--clr-accent','--primary-color','--accent-color']) {
        const v = rs.getPropertyValue(p).trim();
        if (v) add(p, v);
        if (result.length >= 12) break;
      }
    }
    for (const sheet of d.styleSheets) {
      if (result.length >= 14) break;
      try {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText === ':root' || rule.selectorText === 'html') {
            for (const [, prop, val] of [...rule.cssText.matchAll(/(--[a-z][a-z0-9-]*):\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsl[a]?\([^)]+\))/g)])
              add(prop, val);
          }
        }
      } catch(e) {}
    }
    return result.slice(0, 12);
  }

  /* ── Fonts ─────────────────────────────────────────────── */
  function detectFonts() {
    const googleFonts = [], customFonts = [], seen = new Set();
    for (const l of qsa('link[href*="fonts.googleapis.com"]')) {
      const m = l.href.match(/family=([^&]+)/);
      if (m) decodeURIComponent(m[1]).split('|').map(f=>f.split(':')[0].replace(/\+/g,' ').trim())
             .forEach(f=>{ if(f && !seen.has(f)){ seen.add(f); googleFonts.push(f); } });
    }
    const adobeFonts = !!qs('link[href*="use.typekit.net"],script[src*="use.typekit.net"]');
    for (const l of qsa('link[rel="preload"][as="font"]')) {
      const m = (l.href||'').match(/\/([^/?#]+)\.(woff2?|ttf|otf)/i);
      if (m && !seen.has(m[1])){ seen.add(m[1]); customFonts.push(m[1].replace(/-/g,' ')); }
    }
    return { googleFonts, adobeFonts, customFonts };
  }

  /* ── PWA ────────────────────────────────────────────────── */
  function detectPWA() {
    const ml = qs('link[rel="manifest"]');
    return {
      hasManifest: !!ml, manifestUrl: ml?.href||'',
      hasServiceWorker: 'serviceWorker' in navigator,
      themeColor:   getMeta('theme-color'),
      appleCapable: getMeta('apple-mobile-web-app-capable') === 'yes',
      appleTitle:   getMeta('apple-mobile-web-app-title'),
    };
  }

  /* ── Social ─────────────────────────────────────────────── */
  function detectSocial() {
    const pats = {
      twitter:   /(?:x\.com|twitter\.com)\/([^/?#\s"]+)/i,
      instagram: /instagram\.com\/([^/?#\s"]+)/i,
      facebook:  /facebook\.com\/([^/?#\s"]+)/i,
      linkedin:  /linkedin\.com\/(?:company|in)\/([^/?#\s"]+)/i,
      youtube:   /youtube\.com\/(?:@|channel\/|c\/)?([^/?#\s"]+)/i,
      tiktok:    /tiktok\.com\/@([^/?#\s"]+)/i,
      github:    /github\.com\/([^/?#\s"]+)/i,
      pinterest: /pinterest\.com\/([^/?#\s"]+)/i,
      discord:   /discord\.gg\/([^/?#\s"]+)/i,
    };
    const skip = new Set(['home','about','blog','careers','terms','privacy','help','login','signup','explore','share']);
    const result = {};
    for (const a of qsa('a[href]')) {
      for (const [platform, re] of Object.entries(pats)) {
        if (!result[platform]) {
          const m = (a.href||'').match(re);
          if (m && !skip.has(m[1].toLowerCase())) result[platform] = { url:a.href, handle:m[1] };
        }
      }
    }
    return result;
  }

  /* ── Security ───────────────────────────────────────────── */
  function detectSecurity() {
    return {
      isHTTPS:  location.protocol === 'https:',
      hasCSP:   !!qs('meta[http-equiv="Content-Security-Policy"]'),
      noindex:  getMeta('robots').toLowerCase().includes('noindex'),
      nofollow: getMeta('robots').toLowerCase().includes('nofollow'),
    };
  }

  /* ══════════════════════════════════════════════════════════
     MAIN collect()
  ══════════════════════════════════════════════════════════ */
  function collect() {
    const data = {};

    data.url       = location.href;
    data.hostname  = location.hostname;
    data.title     = d.title;
    data.charset   = d.characterSet;
    data.lang      = d.documentElement.lang;
    data.doctype   = d.doctype ? d.doctype.name : 'none';
    data.scannedAt = new Date().toISOString();

    data.cmsInfo   = scoreCMS();
    data.themeInfo = detectTheme(data.cmsInfo);
    data.stack     = detectStack();
    data.colors    = detectColors();
    data.fontInfo  = detectFonts();
    data.pwa       = detectPWA();
    data.social    = detectSocial();
    data.security  = detectSecurity();

    // Meta tags
    data.metas = qsa('meta').map(m => ({
      name:    m.getAttribute('name')||m.getAttribute('property')||m.getAttribute('http-equiv')||'',
      content: m.getAttribute('content')||'',
      charset: m.getAttribute('charset')||''
    }));

    // SEO
    data.seo = {
      title: d.title, titleLen: d.title.length,
      description:          getMeta('description','og:description'),
      keywords:             getMeta('keywords'),
      robots:               getMeta('robots'),
      canonical:            safe(() => qs('link[rel="canonical"]')?.href||''),
      ogTitle:              getMeta('og:title'),
      ogDescription:        getMeta('og:description'),
      ogImage:              getMeta('og:image'),
      ogType:               getMeta('og:type'),
      ogUrl:                getMeta('og:url'),
      ogSiteName:           getMeta('og:site_name'),
      twitterCard:          getMeta('twitter:card'),
      twitterTitle:         getMeta('twitter:title'),
      twitterDescription:   getMeta('twitter:description'),
      twitterImage:         getMeta('twitter:image'),
      twitterSite:          getMeta('twitter:site'),
      viewport:             getMeta('viewport'),
      themeColor:           getMeta('theme-color'),
      author:               getMeta('author'),
      generator:            getMeta('generator'),
    };

    // Links
    const origin = location.origin;
    data.links = qsa('a[href]').map(a => {
      const href = a.href||'';
      const raw  = a.getAttribute('href')||'';
      const isInternal = href.startsWith(origin) || raw.startsWith('/') || raw.startsWith('#');
      return {
        text: a.textContent.trim().slice(0,100), href,
        title:a.title||'', rel:a.rel||'', target:a.target||'',
        type: href.startsWith('mailto:') ? 'email'
            : href.startsWith('tel:')    ? 'phone'
            : raw.startsWith('#')        ? 'anchor'
            : isInternal                 ? 'internal' : 'external',
        isNofollow: (a.rel||'').includes('nofollow'),
        status: null
      };
    });

    // Images — detect broken without network
    data.images = qsa('img').map(img => {
      const src = img.src || img.getAttribute('src') || '';
      return {
        src, alt:img.alt||'', title:img.title||'',
        width:   img.naturalWidth  || img.width  || img.getAttribute('width')  || '',
        height:  img.naturalHeight || img.height || img.getAttribute('height') || '',
        loading: img.loading||'', srcset:img.getAttribute('srcset')||'',
        isLazyLoaded: img.loading === 'lazy',
        hasMissingAlt: !img.alt,
        isBroken: !!(src && img.complete && img.naturalWidth===0 && img.naturalHeight===0),
      };
    });

    // Forms
    data.forms = qsa('form').map((form) => ({
      id:form.id||'', name:form.name||'', action:form.action||'',
      method:form.method||'get', enctype:form.enctype||'',
      fields: qsa('input,select,textarea,button', form).map(f => ({
        tag:f.tagName.toLowerCase(), type:f.type||'', name:f.name||'', id:f.id||'',
        placeholder:f.placeholder||'', required:f.required||false,
        label: safe(() => f.id ? (qs(`label[for="${f.id}"]`)?.textContent.trim()||'') : '')
      }))
    }));

    // Headings
    data.headings = [];
    ['h1','h2','h3','h4','h5','h6'].forEach(t =>
      qsa(t).forEach(el => data.headings.push({ level:parseInt(t[1]), text:el.textContent.trim().slice(0,200) }))
    );

    // Scripts / Styles
    data.scripts = qsa('script[src]').map(s => ({
      src:s.src, async:s.async, defer:s.defer, type:s.type||'text/javascript',
      crossOrigin:s.crossOrigin||'', module:s.type==='module', integrity:s.integrity||''
    }));
    data.styles  = qsa('link[rel="stylesheet"]').map(l => ({
      href:l.href, media:l.media||'', crossOrigin:l.crossOrigin||'', integrity:l.integrity||''
    }));
    data.inlineScripts = d.querySelectorAll('script:not([src])').length;
    data.inlineStyles  = d.querySelectorAll('style').length;

    // Tech fingerprinting (60+ detections)
    const checks = [
      { name:'React',       cat:'JS Framework', icon:'⚛️', color:'#61dafb', link:'https://react.dev',
        detect:()=>!!(w.React||w.__REACT_DEVTOOLS_GLOBAL_HOOK__||qs('[data-reactroot],[data-reactid]')),
        ver:()=>w.React?.version||'' },
      { name:'Vue.js',      cat:'JS Framework', icon:'💚', color:'#42b883', link:'https://vuejs.org',
        detect:()=>!!(w.Vue||w.__VUE__||w.__vue_app__||qs('[data-v-app]')),
        ver:()=>w.Vue?.version||'' },
      { name:'Angular',     cat:'JS Framework', icon:'🔴', color:'#dd0031', link:'https://angular.io',
        detect:()=>!!(w.angular||w.ng||qs('[ng-version]')),
        ver:()=>safe(()=>qs('[ng-version]')?.getAttribute('ng-version')||'') },
      { name:'Svelte',      cat:'JS Framework', icon:'🧡', color:'#ff3e00', link:'https://svelte.dev',
        detect:()=>!!(w.__svelte||qs('[class*="svelte-"]')), ver:()=>'' },
      { name:'Next.js',     cat:'JS Framework', icon:'▲',  color:'#ffffff', link:'https://nextjs.org',
        detect:()=>!!(w.__NEXT_DATA__||qs('script[src*="_next/static"]')), ver:()=>'' },
      { name:'Nuxt.js',     cat:'JS Framework', icon:'💚', color:'#00dc82', link:'https://nuxt.com',
        detect:()=>!!(w.__NUXT__||w.$nuxt||qs('script[src*="/_nuxt/"]')), ver:()=>'' },
      { name:'Remix',       cat:'JS Framework', icon:'💿', color:'#e8f2ff', link:'https://remix.run',
        detect:()=>!!(w.__remixContext||qs('[data-remix-route]')), ver:()=>'' },
      { name:'Gatsby',      cat:'JS Framework', icon:'💜', color:'#663399', link:'https://gatsbyjs.com',
        detect:()=>!!(w.___gatsby||qs('#gatsby-chunk-uuid')), ver:()=>'' },
      { name:'Astro',       cat:'JS Framework', icon:'🚀', color:'#ff5d01', link:'https://astro.build',
        detect:()=>!!(getMeta('generator').includes('Astro')||qs('[data-astro-source-file]')), ver:()=>'' },
      { name:'jQuery',      cat:'JS Library',   icon:'🔵', color:'#0769ad', link:'https://jquery.com',
        detect:()=>!!(w.jQuery||w.$?.fn?.jquery),
        ver:()=>w.jQuery?.fn?.jquery||w.$?.fn?.jquery||'' },
      { name:'Alpine.js',   cat:'JS Library',   icon:'🏔️', color:'#77c1d2', link:'https://alpinejs.dev',
        detect:()=>!!(w.Alpine||qs('[x-data]')), ver:()=>w.Alpine?.version||'' },
      { name:'HTMX',        cat:'JS Library',   icon:'⚡', color:'#ff6600', link:'https://htmx.org',
        detect:()=>!!(w.htmx||qs('[hx-get],[hx-post],[hx-boost]')), ver:()=>w.htmx?.version||'' },
      { name:'Tailwind CSS',cat:'CSS Framework',icon:'🌊', color:'#38bdf8', link:'https://tailwindcss.com',
        detect:()=>{
          for (const s of d.styleSheets){try{for(const r of s.cssRules){if((r.cssText||'').includes('@tailwind'))return true;}}catch(e){}}
          return !!(qs('[class*="text-"][class*="bg-"]')&&qs('[class*="rounded-"],[class*="px-"],[class*="py-"]'));
        }, ver:()=>'' },
      { name:'Bootstrap',   cat:'CSS Framework',icon:'🅱️', color:'#7952b3', link:'https://getbootstrap.com',
        detect:()=>!!(w.bootstrap||qs('.container-fluid,.navbar-expand,.modal.fade')||[...d.styleSheets].some(s=>(s.href||'').includes('bootstrap'))),
        ver:()=>w.bootstrap?.VERSION||'' },
      { name:'Bulma',       cat:'CSS Framework',icon:'💪', color:'#00d1b2', link:'https://bulma.io',
        detect:()=>!!(qs('.columns.is-multiline,.hero.is-primary')||[...d.styleSheets].some(s=>(s.href||'').includes('bulma'))), ver:()=>'' },
      { name:'Material UI', cat:'UI Library',   icon:'📦', color:'#007fff', link:'https://mui.com',
        detect:()=>!!(qs('[class*="MuiButton"],[class*="MuiBox"]')||w.__MUI_STYLES__), ver:()=>'' },
      { name:'Ant Design',  cat:'UI Library',   icon:'🐜', color:'#1677ff', link:'https://ant.design',
        detect:()=>!!qs('.ant-btn,.ant-layout,.ant-row'), ver:()=>'' },
      { name:'Chakra UI',   cat:'UI Library',   icon:'⚡', color:'#319795', link:'https://chakra-ui.com',
        detect:()=>!!(qs('[class*="chakra-"]')||w.__chakraColorMode!==undefined), ver:()=>'' },
      { name:'Radix UI',    cat:'UI Library',   icon:'🎯', color:'#6e56cf', link:'https://radix-ui.com',
        detect:()=>!!qs('[data-radix-popper-content-wrapper],[data-radix-collection-item]'), ver:()=>'' },
      { name:'shadcn/ui',   cat:'UI Library',   icon:'🎨', color:'#ffffff', link:'https://ui.shadcn.com',
        detect:()=>!!qs('[data-slot],[cmdk-root],[vaul-drawer]'), ver:()=>'' },
      { name:'Google Analytics',  cat:'Analytics', icon:'📊', color:'#e37400', link:'https://analytics.google.com',
        detect:()=>!!(w.ga||w.gtag||w.GoogleAnalyticsObject||qs('script[src*="google-analytics"],script[src*="googletagmanager"]')),
        ver:()=>w.gtag?'GA4':w.ga?'Universal':'' },
      { name:'Google Tag Manager',cat:'Analytics', icon:'🏷️', color:'#246fdb', link:'https://tagmanager.google.com',
        detect:()=>!!(w.google_tag_manager||w.dataLayer||qs('script[src*="googletagmanager.com/gtm"]')), ver:()=>'' },
      { name:'Hotjar',     cat:'Analytics', icon:'🔥', color:'#fd3a5c', link:'https://hotjar.com',
        detect:()=>!!(w.hj||w._hjSettings), ver:()=>'' },
      { name:'Mixpanel',   cat:'Analytics', icon:'📈', color:'#7856ff', link:'https://mixpanel.com',
        detect:()=>!!w.mixpanel, ver:()=>'' },
      { name:'PostHog',    cat:'Analytics', icon:'🦔', color:'#f54e00', link:'https://posthog.com',
        detect:()=>!!(w.posthog||qs('script[src*="posthog"]')), ver:()=>'' },
      { name:'Plausible',  cat:'Analytics', icon:'📊', color:'#5850ec', link:'https://plausible.io',
        detect:()=>!!(qs('script[src*="plausible"]')||w.plausible), ver:()=>'' },
      { name:'Stripe',     cat:'Payments', icon:'💳', color:'#635bff', link:'https://stripe.com',
        detect:()=>!!(w.Stripe||qs('script[src*="js.stripe.com"]')), ver:()=>'' },
      { name:'PayPal',     cat:'Payments', icon:'💰', color:'#003087', link:'https://paypal.com',
        detect:()=>!!(w.paypal||qs('script[src*="paypal.com"]')), ver:()=>'' },
      { name:'Klarna',     cat:'Payments', icon:'🛒', color:'#ffb3c7', link:'https://klarna.com',
        detect:()=>!!(qs('script[src*="klarna.com"]')||w.Klarna), ver:()=>'' },
      { name:'OneTrust',   cat:'Cookie Consent', icon:'🍪', color:'#31870e', link:'https://onetrust.com',
        detect:()=>!!(w.OneTrust||qs('script[src*="onetrust"]')), ver:()=>'' },
      { name:'Cookiebot',  cat:'Cookie Consent', icon:'🍪', color:'#2a2a2a', link:'https://cookiebot.com',
        detect:()=>!!(qs('script[src*="cookiebot"]')||w.Cookiebot), ver:()=>'' },
      { name:'Redux',      cat:'State', icon:'🔄', color:'#764abc', link:'https://redux.js.org',
        detect:()=>!!(w.__REDUX_DEVTOOLS_EXTENSION__||w.__REDUX_STORE__), ver:()=>'' },
      { name:'Vite',       cat:'Build Tool', icon:'⚡', color:'#bd34fe', link:'https://vitejs.dev',
        detect:()=>!!(qs('script[type="module"][src*="/@vite/"]')||w.__vite_is_modern_browser), ver:()=>'' },
      { name:'Webpack',    cat:'Build Tool', icon:'📦', color:'#8dd6f9', link:'https://webpack.js.org',
        detect:()=>!!(w.webpackChunkName||w.webpackJsonp||w.__webpack_require__), ver:()=>'' },
      { name:'GSAP',       cat:'Animation', icon:'🎬', color:'#88ce02', link:'https://greensock.com',
        detect:()=>!!(w.gsap||w.TweenMax||qs('script[src*="gsap"]')), ver:()=>w.gsap?.version||'' },
      { name:'Three.js',   cat:'3D/WebGL',  icon:'🎲', color:'#049ef4', link:'https://threejs.org',
        detect:()=>!!(w.THREE||qs('canvas[data-engine*="three"]')), ver:()=>w.THREE?.REVISION?`r${w.THREE.REVISION}`:'' },
      { name:'Cloudflare', cat:'CDN/Security', icon:'☁️', color:'#f38020', link:'https://cloudflare.com',
        detect:()=>!!(qs('script[src*="cloudflare"],link[href*="cloudflare"]')||w.__CF?.loaded), ver:()=>'' },
      { name:'Vercel',     cat:'Hosting', icon:'▲', color:'#000000', link:'https://vercel.com',
        detect:()=>!!(w.__VERCEL_INSIGHTS_SCRIPT__||qs('script[src*="vercel"]')||location.hostname.includes('.vercel.app')), ver:()=>'' },
      { name:'Netlify',    cat:'Hosting', icon:'🟩', color:'#00c7b7', link:'https://netlify.com',
        detect:()=>!!(qs('script[src*="netlify"]')||location.hostname.includes('.netlify.app')), ver:()=>'' },
      { name:'Google Fonts',cat:'Fonts', icon:'🔤', color:'#4285f4', link:'https://fonts.google.com',
        detect:()=>!!qs('link[href*="fonts.googleapis.com"]'), ver:()=>'' },
      { name:'Adobe Fonts', cat:'Fonts', icon:'🅰️', color:'#fa0f00', link:'https://fonts.adobe.com',
        detect:()=>!!qs('link[href*="use.typekit.net"],script[src*="use.typekit.net"]'), ver:()=>'' },
      { name:'Intercom',   cat:'Support', icon:'💬', color:'#1f8ded', link:'https://intercom.com',
        detect:()=>!!w.Intercom, ver:()=>'' },
      { name:'Crisp',      cat:'Support', icon:'💬', color:'#ff4f1f', link:'https://crisp.chat',
        detect:()=>!!(w.$crisp||w.CRISP_WEBSITE_ID), ver:()=>'' },
      { name:'Zendesk',    cat:'Support', icon:'🎫', color:'#03363d', link:'https://zendesk.com',
        detect:()=>!!(w.zE||w.zEACLoaded), ver:()=>'' },
      { name:'Sentry',     cat:'Monitoring', icon:'🐞', color:'#362d59', link:'https://sentry.io',
        detect:()=>!!(w.Sentry||qs('script[src*="sentry"]')), ver:()=>'' },
      { name:'WooCommerce',cat:'E-commerce', icon:'🛒', color:'#96588a', link:'https://woocommerce.com',
        detect:()=>!!(w.wc||qs('.woocommerce,script[src*="woocommerce"]')), ver:()=>'' },
    ];

    data.technologies = checks
      .filter(c => { try { return c.detect(); } catch(e) { return false; } })
      .map(c => ({
        name:c.name, category:c.cat, icon:c.icon,
        version: safe(() => c.ver(), ''), link:c.link, color:c.color
      }));

    data.stats = {
      wordCount:        safe(()=>d.body?.innerText?.trim().split(/\s+/).length||0, 0),
      linkCount:        data.links.length,
      imageCount:       data.images.length,
      formCount:        data.forms.length,
      scriptCount:      data.scripts.length,
      styleCount:       data.styles.length,
      headingCount:     data.headings.length,
      metaCount:        data.metas.length,
      internalLinks:    data.links.filter(l=>l.type==='internal').length,
      externalLinks:    data.links.filter(l=>l.type==='external').length,
      missingAltImages: data.images.filter(i=>i.hasMissingAlt).length,
      brokenImages:     data.images.filter(i=>i.isBroken).length,
      nofollowLinks:    data.links.filter(l=>l.isNofollow).length,
      techCount:        data.technologies.length,
      h1Count:          data.headings.filter(h=>h.level===1).length,
    };

    data.linkTags = qsa('link').map(l => ({
      rel:l.rel||'', href:l.href||'', type:l.type||'',
      media:l.media||'', hreflang:l.hreflang||'', sizes:l.getAttribute('sizes')||''
    }));
    data.structuredData = [];
    qsa('script[type="application/ld+json"]').forEach(s => {
      try { data.structuredData.push(JSON.parse(s.textContent)); } catch(e) {}
    });

    return data;
  }

  /* Message listener */
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.action === 'scan') {
      try { sendResponse({ success:true, data:collect() }); }
      catch(e) { sendResponse({ success:false, error:e.message }); }
    }
    return true;
  });

})();