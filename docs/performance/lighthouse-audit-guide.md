# Lighthouse Audit Guide

**Date**: 2025-12-16
**Target**: < 2 second load time
**Performance Standards**: Lighthouse score ≥ 90

## Running Lighthouse Audit

### Chrome DevTools Method

1. Open the app in Chrome (production URL or `npm run build && npm start`)
2. Open DevTools (F12)
3. Navigate to **Lighthouse** tab
4. Select **Performance**, **Accessibility**, **Best Practices**, **SEO**, **PWA**
5. Click **Analyze page load**
6. Review the report

### CLI Method

```bash
# Install Lighthouse CLI globally
npm install -g lighthouse

# Run audit on production URL
lighthouse https://mood-tracker.slingshotgrp.com --view

# Run audit on local build
npm run build
npm start
lighthouse http://localhost:3000 --view
```

## Expected Performance Metrics (Target)

| Metric                             | Target  | Description                               |
| ---------------------------------- | ------- | ----------------------------------------- |
| **First Contentful Paint (FCP)**   | < 1.8s  | Time until first content renders          |
| **Largest Contentful Paint (LCP)** | < 2.5s  | Time until main content visible           |
| **Total Blocking Time (TBT)**      | < 200ms | Time main thread is blocked               |
| **Cumulative Layout Shift (CLS)**  | < 0.1   | Visual stability score                    |
| **Speed Index**                    | < 3.4s  | How quickly content is visually populated |

## Current Optimizations Already Implemented

### 1. Next.js 16 Performance Features

- ✅ **Turbopack** - 5x faster builds (default in Next.js 16)
- ✅ **React 19.2** - Improved compiler optimizations
- ✅ **Server Components** - Used where appropriate
- ✅ **Automatic code splitting** - Each route loads only necessary code

### 2. Image Optimization

- ✅ **SVG icons** - Lightweight vector graphics (no raster images)
- ✅ **Inline SVGs** - No additional HTTP requests for icons
- ✅ **No external images** - All assets are code/emoji-based

### 3. CSS/Styling Optimization

- ✅ **Tailwind CSS 4.0** - 5x faster builds, smaller output
- ✅ **CSS-first config** - Optimized processing
- ✅ **Dark mode** - Uses CSS media queries (no JS toggle overhead)
- ✅ **Minimal animations** - CSS-only, no JS animation libraries

### 4. JavaScript Optimization

- ✅ **Minimal dependencies** - Only essential packages
- ✅ **Tree-shaking** - Unused code eliminated automatically
- ✅ **Code splitting** - Route-based lazy loading
- ✅ **No large libraries** - No jQuery, Moment.js, etc.

### 5. PWA & Caching

- ✅ **Service Worker** - Aggressive caching strategy
- ✅ **Cache-first** - Static assets served from cache
- ✅ **Network-first for API** - Fresh data with fallback
- ✅ **Offline support** - App works without network

### 6. Database & API Optimization

- ✅ **Vercel Edge Functions** - API routes run at the edge
- ✅ **Azure Cosmos DB serverless** - Fast globally distributed database
- ✅ **Indexed queries** - Database queries optimized with indexes
- ✅ **Minimal data transfer** - Only necessary fields returned

## Additional Optimizations to Consider

### If LCP > 2.5s:

1. **Preconnect to external domains** (if any)

   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com" />
   ```

2. **Font optimization** (currently using system fonts - already optimal)

3. **Critical CSS inlining** (Next.js handles this automatically)

4. **Lazy load below-the-fold content**
   - Calendar can be lazy-loaded if it's causing issues
   - Modal can be code-split

### If TBT > 200ms:

1. **Defer non-critical JavaScript**

   ```tsx
   import dynamic from 'next/dynamic'
   const Calendar = dynamic(() => import('@/components/Calendar'))
   ```

2. **Web Worker for heavy computations**
   - Currently not needed (no heavy computations)

3. **Debounce expensive operations**
   - ✅ Already implemented for notes auto-save

### If CLS > 0.1:

1. **Reserve space for dynamic content**
   - Add skeleton loaders (already implemented)
   - Ensure calendar grid has fixed dimensions

2. **Font loading strategy**
   - System fonts prevent font flash (already using system fonts)

3. **Image dimension attributes**
   - Not applicable (no external images)

## Accessibility Audit (WCAG 2.1 AA)

Expected Lighthouse Accessibility Score: **100**

Already implemented:

- ✅ ARIA labels on all interactive elements
- ✅ Keyboard navigation support
- ✅ Focus indicators (visible focus states)
- ✅ Color contrast meets WCAG AA standards
- ✅ Semantic HTML (header, main, section, footer)
- ✅ Screen reader friendly labels
- ✅ Form labels and descriptions

## PWA Audit

Expected Lighthouse PWA Score: **100**

Already implemented:

- ✅ Web App Manifest (`/manifest.json`)
- ✅ Service Worker registered
- ✅ Offline functionality
- ✅ Installable (add to home screen)
- ✅ Icons for all platforms
- ✅ Theme color and background color
- ✅ HTTPS (required for PWA)

## SEO Audit

Expected Lighthouse SEO Score: **100**

Already implemented:

- ✅ Meta description
- ✅ Title tag
- ✅ Viewport meta tag
- ✅ Semantic HTML
- ✅ Robots.txt allowed (no blocks)

## Best Practices Audit

Expected Lighthouse Best Practices Score: **100**

Already implemented:

- ✅ HTTPS
- ✅ No console errors
- ✅ Secure dependencies
- ✅ Modern JavaScript (ES6+)
- ✅ No deprecated APIs

## Performance Budget

Set the following performance budgets to maintain performance:

| Resource         | Budget   | Current Estimate |
| ---------------- | -------- | ---------------- |
| Total JavaScript | < 150 KB | ~120 KB          |
| Total CSS        | < 50 KB  | ~30 KB           |
| HTML             | < 30 KB  | ~15 KB           |
| Total page size  | < 300 KB | ~200 KB          |
| HTTP requests    | < 20     | ~8               |

## Monitoring Performance

### Continuous Monitoring

1. **Vercel Analytics** - Automatic real-user monitoring
2. **Web Vitals** - Track Core Web Vitals in production
3. **Lighthouse CI** - Automated Lighthouse tests on deploy

### Setting up Lighthouse CI (Optional)

```json
// lighthouserc.json
{
  "ci": {
    "collect": {
      "startServerCommand": "npm start",
      "url": ["http://localhost:3000/"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 1.0 }],
        "categories:best-practices": ["error", { "minScore": 1.0 }],
        "categories:seo": ["error", { "minScore": 1.0 }],
        "categories:pwa": ["error", { "minScore": 0.9 }]
      }
    }
  }
}
```

## Troubleshooting Common Issues

### Issue: High LCP on first visit

**Cause**: No cached resources
**Solution**: Service worker warms cache on first visit (expected behavior)

### Issue: Long task blocking TBT

**Cause**: Large JavaScript bundle
**Solution**: Code-split heavy components, lazy-load below-the-fold

### Issue: CLS from calendar rendering

**Cause**: Calendar grid calculates dates dynamically
**Solution**: Add loading skeleton with fixed dimensions (already implemented)

### Issue: Slow API responses affecting FCP

**Cause**: Database query performance
**Solution**: Add database indexes, cache responses, use SWR (stale-while-revalidate)

## Expected Final Lighthouse Scores

| Category       | Target Score | Expected |
| -------------- | ------------ | -------- |
| Performance    | ≥ 90         | 95-100   |
| Accessibility  | 100          | 100      |
| Best Practices | 100          | 100      |
| SEO            | 100          | 100      |
| PWA            | ≥ 90         | 95-100   |

## Next Steps

1. Run Lighthouse audit on production deployment
2. Document actual scores
3. Identify any areas below target
4. Implement specific optimizations if needed
5. Re-run audit to verify improvements
6. Set up continuous monitoring

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse/)
- [Next.js Performance Best Practices](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Vercel Analytics](https://vercel.com/docs/analytics)
