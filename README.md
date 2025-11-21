# Budget Tracker PWA

A modern, mobile-first Progressive Web App for tracking your monthly budget in ZAR (South African Rand).

## Features

- 📱 **Mobile-First Design** - Optimized for mobile devices with smooth animations
- 💰 **ZAR Currency Only** - All amounts in South African Rand
- 📊 **Budget Tracking** - Track fixed and variable monthly expenses
- 📈 **Visual Analytics** - Charts and breakdowns of your spending
- 💾 **Offline Support** - Works offline with IndexedDB storage
- 🎨 **Modern UI** - Clean, fintech-style interface with glassmorphism effects
- ⚡ **PWA Ready** - Installable on Android and iOS

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

## Project Structure

```
src/
  components/     # Reusable UI components
  pages/          # Page components
  hooks/          # Custom React hooks
  lib/            # Utilities and database
  utils/          # Budget calculation utilities
  types/          # TypeScript type definitions
  styles/         # Global styles
  test/           # Test setup and utilities
```

## Features Overview

### Monthly Budget Inputs

- **Fixed Expenses**: Rent, Electricity, Water, Medical Aid, Gym, Internet
- **Variable Expenses**: Groceries, Petrol, Eating Out, Entertainment, Random/Other
- **Income**: Monthly income in ZAR

### Automatic Calculations

- Monthly total expenses
- Remaining budget
- Category percentages
- Daily allowance
- Income change simulation

### Data Storage

- Uses IndexedDB for offline storage
- Automatic data persistence
- Export/import functionality

## Technologies

- React 18
- TypeScript
- Vite
- TailwindCSS
- Framer Motion
- Recharts
- IndexedDB (idb)

## License

MIT

