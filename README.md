# alterQR

alterQR is a fast, offline-first React Native utility app designed to let users upload, manage, and cycle through multiple QR codes or barcode images. Built with a stunning **Neo-Brutalist** aesthetic, the app makes it effortless to rapidly switch between and share your different QR codes at events, check-ins, or networking sessions.

## Features

- **Dynamic QR Loop**: Load multiple QR code screenshots from your device's gallery. The app automatically cycles to the next QR code immediately after you share the current one.
- **Persistent Storage**: All images and the current sequence position are saved securely on-device using `AsyncStorage`.
- **Native Sharing**: Instantly trigger the native Android/iOS share sheet with one tap.
- **Neo-Brutalist UI**: High contrast, thick borders, sharp drop shadows, and incredibly snappy micro-animations.
- **Fully Offline**: Zero network requests required. Your data and images never leave your phone.

## Technology Stack

- **Framework**: React Native (via Expo SDK 56)
- **Routing**: Expo Router (File-based navigation)
- **Styling**: NativeWind (TailwindCSS)
- **Animations**: Moti & React Native Reanimated
- **Storage**: `@react-native-async-storage/async-storage`
- **Native Modules**: `expo-image-picker`, `expo-sharing`

## Screenshots & UI

*(If you have screenshots, place them in a folder and link them here)*

The interface relies on custom Reanimated worklets combined with Moti pressables to achieve physically accurate, snappy button interactions on the UI thread without dropping frames.

## Installation & Setup

Since the app uses NativeWind, which relies on custom Babel and Metro bundler configurations, you must run it as a custom development build (not the standard Expo Go app).

### Prerequisites
- Node.js (v18+)
- Android Studio / Android SDK (for local Android builds)

### 1. Clone & Install
```bash
git clone https://github.com/your-username/alterQR.git
cd alterQR
npm install
```

### 2. Run Locally
To run the app on an attached Android device or emulator:
```bash
npx expo run:android
```

## Release Builds (APK)

To generate a standalone Production APK (e.g., for GitHub Releases) without needing an active Metro bundler:

1. Ensure you have the required Gradle JVM arguments configured in `android/gradle.properties`:
   ```properties
   org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
   ```
2. Build the release APK skipping the heavy linting tasks:
   ```bash
   cd android
   ./gradlew assembleRelease --no-daemon -x lint -x lintVitalRelease -x lintVitalAnalyzeRelease
   ```
3. Find your built APK at:
   `android/app/build/outputs/apk/release/app-release.apk`

## Architecture

- **`src/app/`**: Contains the Expo Router file-based screens (`index.tsx` for the Home screen, `settings.tsx` for the Image manager).
- **`src/hooks/`**: Houses the global React Context providers. `use-qr-loop.tsx` provides the shared state logic syncing memory directly with AsyncStorage.
- **`src/components/`**: Reusable Neo-Brutalist UI pieces (e.g., `<NeoShadow>`).

