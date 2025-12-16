# PWA Installation Testing Guide

This guide provides comprehensive instructions for testing the Progressive Web App (PWA) installation functionality of Rate Your Day across different browsers and platforms.

## Prerequisites

Before testing, ensure:

- The app is deployed to a production or preview environment (HTTPS is required)
- Service Worker is registered successfully (check browser console)
- Web App Manifest is accessible at `/manifest.json`

## Test Environment URLs

- **Production**: https://mood-tracker.slingshotgrp.com
- **Preview**: Check Vercel deployment URLs for branch previews

## T093: Test Install Prompt on Chrome

### Chrome Desktop (Windows/Mac/Linux)

#### Installation Steps

1. **Open Chrome** and navigate to the app URL
2. **Check PWA Installability**:
   - Look for the install icon in the address bar (right side)
   - Or click the three-dot menu → "Install Rate Your Day..."
   - Or use the "Install App" button in the app header

3. **Install the App**:
   - Click the install icon or button
   - Confirm the installation in the popup dialog
   - The app should install and open in a new window

4. **Verify Installation**:
   - App should appear in Chrome's Apps list (chrome://apps/)
   - App should be available in the system's application menu/launcher
   - A desktop shortcut should be created (if applicable)

#### Expected Behavior

- ✅ Install prompt appears after Service Worker is registered
- ✅ "Install App" button is visible (before installation)
- ✅ Installation dialog shows correct app name: "Rate Your Day"
- ✅ Installation dialog shows correct icon
- ✅ After installation, the "Install App" button disappears
- ✅ App opens in a new window without browser chrome

#### Chrome DevTools Verification

1. Open DevTools (F12)
2. Go to **Application** tab
3. Check **Manifest** section:
   - Name: "Rate Your Day"
   - Short name: "RateDay"
   - Start URL: "/"
   - Display: "standalone"
   - Theme color: "#3b82f6"
   - Icons: 192x192 and 512x512 SVG files

4. Check **Service Workers** section:
   - Status should be "activated and running"
   - Source: /sw.js

### Chrome Mobile (Android)

#### Installation Steps

1. **Open Chrome on Android** and navigate to the app URL
2. **Look for Install Banner**:
   - Chrome may show an automatic install banner at the bottom
   - Or tap the three-dot menu → "Install app"
   - Or tap the "Install App" button in the app header

3. **Install the App**:
   - Tap "Install" in the banner or dialog
   - Wait for the installation to complete

4. **Verify Installation**:
   - App icon should appear on the home screen
   - App should be listed in the app drawer
   - Tapping the icon should open the app in standalone mode

#### Expected Behavior

- ✅ Install banner appears after criteria are met
- ✅ "Install App" button works on mobile
- ✅ App installs to home screen with correct icon
- ✅ App name displays correctly: "Rate Your Day"
- ✅ After installation, opening from home screen shows no browser UI
- ✅ App uses the full screen (no address bar)

#### Mobile DevTools Verification

1. Enable USB debugging on Android device
2. Connect to Chrome DevTools via chrome://inspect
3. Verify Manifest and Service Worker as above

### Chrome Installation Criteria

For Chrome to show the install prompt, the following criteria must be met:

- ✅ Served over HTTPS
- ✅ Includes a Web App Manifest with:
  - `name` or `short_name`
  - `icons` (at least 192x192 and 512x512)
  - `start_url`
  - `display` (set to `standalone`, `fullscreen`, or `minimal-ui`)
- ✅ Registers a Service Worker with a `fetch` event handler
- ✅ User has not previously dismissed the install prompt
- ✅ User has engaged with the site (some interaction required)

## T094: Test Install on Safari (iOS 15+)

### Safari Mobile (iOS 15+)

#### Installation Steps

Safari on iOS does not support the standard `beforeinstallprompt` event. Installation must be done manually through Safari's "Add to Home Screen" feature.

1. **Open Safari on iOS** and navigate to the app URL
2. **Add to Home Screen**:
   - Tap the **Share** button (box with arrow pointing up)
   - Scroll down and tap **"Add to Home Screen"**
   - Edit the name if desired (should show "Rate Your Day")
   - Tap **"Add"** in the top right

3. **Verify Installation**:
   - App icon should appear on the home screen
   - Icon should use the configured app icon
   - Name should display as "Rate Your Day" (or "RateDay" if truncated)

4. **Launch the App**:
   - Tap the home screen icon
   - App should open in full screen mode
   - No Safari UI should be visible (no address bar, no tab bar)

#### Expected Behavior

- ✅ "Add to Home Screen" option is available in Share menu
- ✅ App name pre-fills as "Rate Your Day"
- ✅ App icon displays correctly in the add dialog
- ✅ After adding, icon appears on home screen
- ✅ Launching from home screen opens in standalone mode
- ✅ Status bar color matches theme color (#3b82f6)
- ✅ App uses the full screen (no Safari UI)

#### iOS-Specific Manifest Configuration

The app is configured with iOS-specific meta tags in `layout.tsx`:

```typescript
appleWebApp: {
  capable: true,
  statusBarStyle: 'default',
  title: 'Rate Your Day',
}
```

#### Known Limitations on iOS Safari

- ⚠️ No automatic install prompt (user must manually add to home screen)
- ⚠️ "Install App" button will not show on iOS (by design, since `beforeinstallprompt` is not supported)
- ⚠️ Service Worker support is limited compared to Chrome
- ⚠️ Push notifications may have restrictions (iOS 16.4+ required)

### Safari Desktop (macOS)

Safari on macOS does not support PWA installation as of macOS 14.x. Users should use Chrome or Edge instead.

## T095: Verify Standalone Mode (No Browser Chrome)

### What is Standalone Mode?

Standalone mode means the app runs in its own window without browser UI elements like:

- Address bar
- Navigation buttons (back, forward, refresh)
- Bookmarks bar
- Browser tabs
- Browser menu

### Testing Standalone Mode

1. **Install the app** using instructions from T093 or T094
2. **Launch the installed app** from:
   - Desktop icon (Windows/Mac/Linux)
   - Home screen icon (Android/iOS)
   - App launcher/Start menu

3. **Verify No Browser Chrome**:
   - ✅ No address bar visible
   - ✅ No back/forward buttons
   - ✅ No bookmark bar
   - ✅ No browser tabs
   - ✅ App title bar shows "Rate Your Day" (not browser name)
   - ✅ Window/app icon shows Rate Your Day icon (not browser icon)

4. **Verify App-Like Experience**:
   - ✅ App appears as separate window/app in task switcher (Alt+Tab / Cmd+Tab)
   - ✅ App has its own window controls (minimize, maximize, close)
   - ✅ Opening external links opens in default browser (not in the PWA window)

### Detecting Standalone Mode in Code

The app can detect if it's running in standalone mode:

```javascript
// Check if running in standalone mode
if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('Running in standalone mode')
}

// Check iOS standalone
if (navigator.standalone) {
  console.log('Running in iOS standalone mode')
}
```

This is used in `usePWAInstall.ts` hook to determine if the app is already installed.

## T096: Verify App Icon Displays Correctly on Home Screen

### Icon Requirements

The app uses SVG icons located at:

- `/public/icons/icon-192x192.svg` (192x192px)
- `/public/icons/icon-512x512.svg` (512x512px)

Both icons should be:

- ✅ Vector-based SVG format (scales perfectly)
- ✅ Purpose: both "any" and "maskable" (for different OS styles)

### Testing App Icon Display

#### Desktop (Windows/Mac/Linux)

1. **Install the app** via Chrome
2. **Check Desktop Icon** (if applicable):
   - Icon should be visible and properly rendered
   - Icon should not appear pixelated or distorted
   - Icon should match the branding

3. **Check Taskbar/Dock**:
   - When app is running, icon in taskbar/dock should show correctly
   - Icon should be distinguishable from browser icon

4. **Check Windows Start Menu** (Windows only):
   - App should appear in Start Menu with correct icon
   - Icon should be high resolution

#### Mobile (Android/iOS)

1. **Install the app** via Add to Home Screen
2. **Check Home Screen Icon**:
   - Icon should render correctly at device resolution
   - Icon should not be blurry or pixelated
   - Icon colors should be accurate
   - Icon should fit well within the device's icon shape (rounded corners, circular, etc.)

3. **Check App Drawer** (Android only):
   - App should appear in app drawer
   - Icon should render correctly

4. **Check Splash Screen** (if applicable):
   - Some browsers generate a splash screen from the icon and theme color
   - Splash should look professional

### Icon Troubleshooting

If icons don't display correctly:

1. **Clear browser cache** and reinstall
2. **Verify icon files exist**:
   - Check `/public/icons/icon-192x192.svg` exists
   - Check `/public/icons/icon-512x512.svg` exists
3. **Verify manifest**:
   - Check `/manifest.json` or generated manifest
   - Verify icon paths are correct
4. **Test with PNG fallback** (if SVG issues occur):
   - Convert SVG to PNG: 192x192.png and 512x512.png
   - Update manifest.ts to reference PNG files

## T097: Test All Functionality in Installed App Mode

### Full Functionality Test Checklist

After installing the app, verify all features work correctly in standalone mode:

#### Authentication

- [ ] App requires authentication on first launch
- [ ] Microsoft Entra ID sign-in flow works in standalone mode
- [ ] Session persists across app relaunches
- [ ] Sign-out functionality works correctly

#### Mood Rating

- [ ] Today's mood can be selected
- [ ] Mood selection saves successfully
- [ ] Success/error messages display correctly
- [ ] Rating persists after closing and reopening app
- [ ] Changing mood updates correctly

#### Notes

- [ ] Notes can be added to a rating
- [ ] Auto-save works (after 1 second delay)
- [ ] Notes persist after closing and reopening app
- [ ] Character counter works (280 char limit)

#### Calendar View

- [ ] Calendar displays current month correctly
- [ ] Past ratings show correct emoji faces
- [ ] Empty days show neutral state
- [ ] Month navigation (previous/next) works
- [ ] Calendar data loads correctly on app launch

#### Day Selection

- [ ] Clicking a past day opens the detail modal
- [ ] Modal displays correct date, rating, and notes
- [ ] Editing past ratings works
- [ ] Deleting past ratings works
- [ ] Modal can be closed (X button or outside click)
- [ ] Calendar updates after editing a day

#### Offline Support

- [ ] App loads when offline
- [ ] Cached ratings display when offline
- [ ] New ratings can be saved offline
- [ ] "Saved offline" message displays
- [ ] Background sync triggers when connection restored
- [ ] Offline indicator shows/hides correctly

#### Push Notifications

- [ ] Notification permission can be requested
- [ ] Permission dialog appears correctly
- [ ] Subscription registers successfully
- [ ] Test notification can be sent
- [ ] Notification appears on device
- [ ] Clicking notification opens app
- [ ] Notification settings persist

#### PWA-Specific

- [ ] App window has correct title
- [ ] App uses configured theme color
- [ ] External links open in browser (not in PWA window)
- [ ] App can be uninstalled
- [ ] After uninstall, web version still works

#### Performance

- [ ] Initial load time is acceptable (< 3 seconds)
- [ ] Interactions feel responsive
- [ ] Animations are smooth
- [ ] No console errors in DevTools
- [ ] No significant memory leaks (check DevTools Memory tab)

#### Visual/UI

- [ ] Layout is correct in standalone mode
- [ ] Responsive design works (resize window)
- [ ] Dark mode works (if device is in dark mode)
- [ ] Colors match branding
- [ ] Icons and emojis render correctly
- [ ] Text is readable

### Regression Testing

Test these after updates to ensure nothing broke:

1. **Install/Reinstall Test**:
   - Uninstall the app
   - Clear browser cache
   - Reinstall the app
   - Verify everything works

2. **Cross-Browser Test**:
   - Test on Chrome (desktop and mobile)
   - Test on Safari (iOS)
   - Test on Edge (desktop)

3. **Cross-Device Test**:
   - Test on Windows desktop
   - Test on Mac desktop
   - Test on Android mobile
   - Test on iOS mobile

## Common Issues and Solutions

### Issue: Install Prompt Doesn't Appear

**Solutions**:

1. Check that all PWA criteria are met (see Chrome Installation Criteria above)
2. Clear browser cache and reload
3. Open in incognito/private window
4. Check DevTools Console for errors
5. Verify Service Worker is registered (DevTools → Application → Service Workers)
6. Verify manifest is valid (DevTools → Application → Manifest)

### Issue: App Icon Not Showing

**Solutions**:

1. Verify icon files exist at `/public/icons/`
2. Check manifest icon paths are correct
3. Try using PNG instead of SVG
4. Clear cache and reinstall
5. Check icon is accessible (try visiting URL directly)

### Issue: App Opens in Browser Instead of Standalone

**Solutions**:

1. Verify manifest has `display: "standalone"`
2. Reinstall the app
3. Check that you're launching from the installed icon (not a bookmark)
4. On iOS, ensure you used "Add to Home Screen" (not a bookmark)

### Issue: Service Worker Not Registering

**Solutions**:

1. Check HTTPS is enabled (Service Workers require HTTPS)
2. Check `/sw.js` file exists and is accessible
3. Check for JavaScript errors in console
4. Verify Service Worker code is valid
5. Clear browser cache and reload
6. Check browser DevTools → Application → Service Workers for error messages

### Issue: Functionality Missing in Standalone Mode

**Solutions**:

1. Check that the feature doesn't depend on browser-specific APIs
2. Verify all API calls use absolute URLs (not relative)
3. Check that authentication is working correctly
4. Test in browser mode first to isolate the issue
5. Check DevTools Console for errors when running in standalone mode

## Browser Compatibility Matrix

| Feature                  | Chrome Desktop | Chrome Android | Safari iOS | Safari macOS | Edge Desktop |
| ------------------------ | -------------- | -------------- | ---------- | ------------ | ------------ |
| Install Prompt           | ✅             | ✅             | ❌ Manual  | ❌           | ✅           |
| Standalone Mode          | ✅             | ✅             | ✅         | ❌           | ✅           |
| Service Worker           | ✅             | ✅             | ⚠️ Limited | ⚠️ Limited   | ✅           |
| Push Notifications       | ✅             | ✅             | ⚠️ iOS 16+ | ❌           | ✅           |
| Background Sync          | ✅             | ✅             | ❌         | ❌           | ✅           |
| beforeinstallprompt      | ✅             | ✅             | ❌         | ❌           | ✅           |
| Add to Home Screen (iOS) | N/A            | N/A            | ✅         | N/A          | N/A          |

**Legend**:

- ✅ Fully supported
- ⚠️ Partially supported or has limitations
- ❌ Not supported
- N/A Not applicable

## Resources

- [Chrome PWA Install Criteria](https://web.dev/install-criteria/)
- [Safari PWA Support](https://webkit.org/blog/8090/workers-at-your-service/)
- [MDN: beforeinstallprompt](https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent)
- [Web App Manifest Specification](https://w3c.github.io/manifest/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
