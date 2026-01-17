# Hermes - Beauty Product Expiration Tracker

A React Native Expo app for tracking beauty product expiration dates with barcode scanning, notifications, and category organization.

## Features

- 📱 **Barcode Scanning** - Scan product barcodes or manually enter product details
- 📊 **Dashboard** - Overview of expiring products, expired items, and total inventory
- 🔔 **Notifications** - Alerts for products expiring soon or already expired
- 📁 **Categories** - Organize products by category (Skincare, Makeup, Haircare, etc.)
- 🔍 **Search & Filter** - Find products quickly with search and filter options
- 📸 **Photo Upload** - Add product photos for easy identification
- 🎨 **Modern UI** - Clean, intuitive interface with NativeWind/Tailwind CSS

## Tech Stack

- **React Native** with **Expo SDK 54**
- **TypeScript** for type safety
- **React Navigation** for navigation
- **NativeWind/Tailwind CSS** for styling
- **Supabase** (configured, using mock data for demo)
- **Context API** for state management

## Getting Started

### Prerequisites

- Node.js 20.19.x or later
- npm or yarn
- Expo Go app on your mobile device (for testing)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd "Hermes 2.0"
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Scan the QR code with Expo Go app or press:
   - `i` for iOS simulator
   - `a` for Android emulator
   - `w` for web browser

## Project Structure

```
src/
├── components/      # Reusable UI components
├── screens/        # App screens
├── navigation/     # Navigation configuration
├── context/        # React Context providers
├── services/       # API and service layers
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

## Demo Data

The app comes pre-populated with 10 realistic beauty products for demonstration:
- 2 expired products
- 3 expiring soon products
- 5 safe products

## Configuration

### Supabase Setup (Optional)

To use real Supabase backend instead of mock data:

1. Create a `.env` file:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

2. Update `src/services/productService.ts` to uncomment Supabase queries

3. Run the database schema SQL in your Supabase project (see `src/services/supabase.ts`)

## Development

- **Start dev server**: `npm start`
- **iOS**: `npm run ios`
- **Android**: `npm run android`
- **Web**: `npm run web`

## License

Private project - All rights reserved

## Demo Notes

This is a demo version prepared for presentation. All data is mocked and authentication is disabled for easy demonstration.
