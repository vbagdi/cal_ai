# CalTrack

A personal calorie tracking Progressive Web App (PWA) with AI-powered food scanning.

## Features

- Track daily meals and workouts
- AI food scanning using Claude API (claude-sonnet-4-20250514) for automatic nutrition detection
- Calorie progress tracking with visual progress bar
- Daily notes for journaling
- Works offline as a PWA
- Mobile-first responsive design

## Security

CalTrack is designed for **personal device use only**. Your data stays on your device and is protected by multiple security layers:

### Authentication
- Password-protected access with PBKDF2 hashing (100,000 iterations)
- Optional biometric authentication (Face ID / Fingerprint) via WebAuthn
- Account lockout after 5 failed login attempts (30-second lockout)
- Auto-lock after 5 minutes of tab inactivity
- 30-minute session timeout

### API Key Protection
- Your Claude API key is encrypted with AES-256-GCM
- Encryption key is derived from your password using PBKDF2
- The key is only decrypted in memory during active sessions
- Never stored in plaintext

### Data Storage
- All data stored locally in IndexedDB (via Dexie.js)
- No data sent to external servers (except Claude API for food scanning)
- "Delete All Data" option available in Settings

### Important Notes
- This app is designed for personal use on trusted devices
- Do not share your device with untrusted parties while logged in
- Your password cannot be recovered - there is no "forgot password" option
- Deleting all data is permanent and cannot be undone

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Configuration

1. Open the app and create a password on first launch
2. Optionally enable biometric authentication
3. Add your Claude API key in Settings (get one from [console.anthropic.com](https://console.anthropic.com/settings/keys))

## Tech Stack

- React + Vite
- Tailwind CSS v4
- Dexie.js (IndexedDB)
- Web Crypto API (PBKDF2, AES-256-GCM)
- WebAuthn API (biometrics)
- vite-plugin-pwa (PWA support)

## License

MIT
