# Tech Detector Pro v3.0

Advanced website technology, CMS, theme, SEO, analytics, framework, hosting, color palette, fonts, PWA, and resource analyzer — built as a Chrome Extension.

---

## What's New in v3.0

### Deep CMS & Theme Detection (New Tab)
- **Shopify** — Detects theme name, ID, role, and `theme_store_id` with a direct **"View in Theme Store"** button linking to `themes.shopify.com`
- **WordPress** — Detects active theme + parent theme from stylesheet URLs and body classes, with **"View on WP.org"** button
- **Squarespace** — Template ID from `SQUARESPACE_CONTEXT` with direct link
- **Webflow** — Site ID detection with marketplace link
- **Ghost** — Theme name from stylesheet URL
- **Wix, Framer, Drupal, Joomla, HubSpot CMS, Contentful, Sanity** also supported
- Dedicated **CMS & Theme** tab with rich card UI

### New Detections (60+ Technologies)
- **Payments**: Stripe, PayPal, Klarna, Afterpay, Square
- **Cookie Consent**: OneTrust, Cookiebot, CookieYes, Osano
- **Monitoring**: Sentry, Datadog
- **Analytics**: PostHog, Heap added
- **State Management**: Zustand added
- **Animation**: GSAP, Framer Motion, Three.js, Lottie
- **UI Libraries**: Radix UI, shadcn/ui added
- **Frameworks**: Astro, SvelteKit added
- **Fonts**: Adobe Fonts (Typekit) added
- **E-commerce**: WooCommerce added

### Color Palette Extraction
- Automatically extracts colors from CSS custom properties (`:root` variables)
- Scans inline stylesheets for color definitions
- Reads `meta[name="theme-color"]`
- Clickable swatches to copy color values

### Font Detection
- Google Fonts — detects all loaded font families from API URL
- Adobe Fonts / Typekit
- Self-hosted fonts via `preload` hints

### PWA & Manifest Detection
- Web App Manifest detection with URL
- Service Worker availability
- Apple Web App Capable status
- Theme color display

### Social Links Detection
- Auto-extracts social profiles: Twitter/X, Instagram, Facebook, LinkedIn, YouTube, TikTok, GitHub, Pinterest, Discord, Slack

### Security Indicator
- HTTPS/HTTP badge in header
- CSP meta tag detection

### Fixed Freeze Behavior
- Freeze is now guaranteed to work correctly across tab switches
- Race condition between `loadSavedData()` and auto-scan fully resolved
- Frozen state shows animated badge and pulsing freeze button
- Opening popup on a different tab while frozen shows the frozen data

### UI Improvements
- Tech filter (text + category dropdown)
- Security badge in header (🔒 / ⚠️)
- Animated frozen state
- Improved loading/error states
- SRI integrity badge on scripts/stylesheets
- Module script badge
- Better toast notifications

---

## Features

| Category | What's Detected |
|---|---|
| CMS | Shopify, WordPress, Webflow, Squarespace, Wix, Framer, Ghost, Drupal, Joomla, HubSpot CMS, Contentful, Sanity |
| Themes | Theme name, ID, role, direct store links |
| JS Frameworks | React, Vue, Angular, Svelte, Next.js, Nuxt, Remix, Gatsby, Astro, SvelteKit |
| JS Libraries | jQuery, Alpine.js, HTMX, Ember.js, Backbone.js |
| CSS Frameworks | Tailwind CSS, Bootstrap, Bulma, Foundation |
| UI Libraries | Chakra UI, Material UI, Ant Design, Radix UI, shadcn/ui |
| State | Redux, MobX, Zustand |
| Analytics | Google Analytics, GTM, Hotjar, Mixpanel, Segment, Plausible, Heap, PostHog |
| Payments | Stripe, PayPal, Klarna, Afterpay, Square |
| Cookie Consent | OneTrust, Cookiebot, CookieYes, Osano |
| CDN/Hosting | Cloudflare, Vercel, Netlify |
| Fonts | Google Fonts, Adobe Fonts |
| Support/CRM | Intercom, Crisp, Zendesk, HubSpot, Drift |
| Build Tools | Vite, Webpack, esbuild |
| Animation | GSAP, Framer Motion, Three.js, Lottie |
| Monitoring | Sentry, Datadog |
| E-commerce | WooCommerce |

---

## Installation

### Load Extension Locally

1. Clone or download this repository
2. Open Chrome → `chrome://extensions`
3. Enable **Developer Mode** (top right)
4. Click **Load Unpacked**
5. Select the `tech-detector-pro` folder
6. Done ✅

---

## Tech Stack

- Vanilla JavaScript (no dependencies)
- HTML5
- CSS3
- Chrome Extension Manifest V3

---

## Author

**Siddhant Srivastava**

Portfolio: https://siddhant7701.github.io/Portfolio-Sid/#home  
GitHub: https://github.com/siddhant7701  
LinkedIn: https://linkedin.com/in/siddhant-srivastava389212211/

---

## License

MIT License