# HiWay Native Android Apps

Two Expo + React Native apps that compile to real native Android APKs.

## Quick Start

```bash
# Install Expo CLI
npm install -g expo-cli

# Build Rider APK (cloud build, no SDK needed)
cd apps/rider
npm install
npx eas build -p android --profile preview

# Build Driver APK
cd apps/driver
npm install
npx eas build -p android --profile preview
```

## First-Time EAS Setup

```bash
npx eas login                          # Log in to your Expo account
npx eas build:configure                 # Configure EAS Build
```

## Development

```bash
# Start dev server with hot reload
cd apps/rider
npm start

# Or driver
cd apps/driver
npm start
```

Scan the QR code with Expo Go on your Android device.

## Structure

```
apps/
├── rider/                # HiWay Rider — passenger app
│   ├── App.tsx           # Entry point with navigation
│   ├── src/
│   │   ├── api/          # API client (shared backend)
│   │   ├── screens/      # HomeScreen, RideScreen, HistoryScreen, ProfileScreen
│   │   └── components/   # Shared UI components
│   ├── app.json          # Expo config (Google Maps, location permissions)
│   └── package.json
├── driver/               # HiWay Driver — driver partner app
│   ├── App.tsx
│   ├── src/
│   │   ├── api/
│   │   ├── screens/      # HomeScreen, EarningsScreen
│   │   └── components/
│   ├── app.json
│   └── package.json
├── build.sh              # Build script
└── README.md
```

## API

Both apps connect to `https://hi-way-shuttle.fly.dev` — the same backend serving the web apps.

## Revolutionary Features

- **Zero surge pricing** — fixed rates, subscription discounts
- **Drivers keep 100%** — no commission, ever
- **Real-time tracking** — WebSocket + native location services
- **Safety** — share trip, emergency alerts, trip sharing
- **Background location** — driver location tracked in background
