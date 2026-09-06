# The Operators Journal mobile app

This folder packages the existing website as Android and iOS apps with Capacitor. The authoritative website remains in the parent folder. `npm run web:sync` creates a disposable `www` bundle from those files, so website and mobile development continue from one source.

## First setup

```text
npm install
npm run android:add
npm run ios:add
```

The Android build requires Java 21, Android Studio, and the Android SDK. The iOS build requires macOS with the current Xcode release.

## Refresh after a website change

```text
npm run cap:sync
```

Then use `npm run android:open` on Windows/macOS or `npm run ios:open` on macOS.

## Release prerequisite

Replace the temporary `trycloudflare.com` API endpoint with a permanent HTTPS backend before public store release. Ensure that backend CORS permits the Capacitor app origins used by Android and iOS.
