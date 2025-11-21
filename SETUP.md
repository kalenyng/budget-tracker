# Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Create PWA Icons**
   
   You need to create the following icon files in the `public/` directory:
   - `pwa-192x192.png` (192x192 pixels)
   - `pwa-512x512.png` (512x512 pixels)
   - `apple-touch-icon.png` (180x180 pixels)
   
   You can use any image editor or online tool like:
   - [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
   - [RealFaviconGenerator](https://realfavicongenerator.net/)
   
   Recommended design: Budget/finance theme with primary color #8b5cf6 (purple)

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

5. **Run Tests**
   ```bash
   npm test
   ```

## PWA Installation

### Android
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Select "Add to Home screen" or "Install app"

### iOS Safari
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"

## Features Implemented

✅ **Monthly Budget Inputs**
- Fixed expenses (Rent, Electricity, Water, Medical Aid, Gym, Internet)
- Variable expenses (Groceries, Petrol, Eating Out, Entertainment, Random)
- Income input

✅ **Automatic Calculations**
- Monthly total expenses
- Remaining budget
- Category percentages
- Daily allowance
- Income change simulation
- Expense validation

✅ **Data Storage**
- IndexedDB for offline storage
- Automatic persistence
- Export/import functionality

✅ **Pages**
- Dashboard with summary and charts
- Add Expense (bottom sheet)
- Monthly Plan (view/edit expenses)
- History (month-by-month)
- Settings

✅ **UI Components**
- Bottom navigation bar
- Expense cards
- Summary cards
- Charts (Recharts)
- Progress bars
- Bottom sheets
- Settings drawer

✅ **PWA Features**
- Service worker
- Offline caching
- Installable
- Mobile-optimized

✅ **Animations**
- Framer Motion transitions
- Page transitions
- Component animations
- Haptic feedback

## Currency

All amounts are in **ZAR (South African Rand)** only. No currency conversion logic is included.

## Project Structure

```
budgetTracker/
├── public/
│   ├── manifest.webmanifest
│   ├── sw.js
│   └── icons/ (create PWA icons here)
├── src/
│   ├── components/      # UI components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utilities (DB, utils)
│   ├── utils/           # Budget calculations
│   ├── types/           # TypeScript types
│   ├── styles/          # Global styles
│   ├── test/            # Test setup
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Troubleshooting

### Icons not showing
- Make sure you've created the PWA icon files in the `public/` directory
- Check that the manifest.webmanifest references the correct icon paths

### Service Worker not registering
- Make sure you're running the app over HTTPS or localhost
- Check browser console for service worker errors

### Build errors
- Run `npm install` to ensure all dependencies are installed
- Check that Node.js version is 18+

## Next Steps

1. Create PWA icons
2. Customize theme colors if needed
3. Add Supabase integration (optional) for cloud sync
4. Deploy to hosting service (Vercel, Netlify, etc.)

