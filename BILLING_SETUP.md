# Native subscription setup

The Akaani paywall is connected to RevenueCat's React Native SDK. It opens the App Store purchase sheet on iOS and Google Play Billing on Android after the store products are configured. Premium access is granted only when RevenueCat reports an active `premium` entitlement. The former local subscription flags are ignored.

1. Set the final `ios.bundleIdentifier` and `android.package` in `app.json`. They must match the apps registered with Apple, Google, and RevenueCat. These identifiers are not yet in this project.
2. Create monthly and yearly auto-renewing subscriptions in App Store Connect and Google Play Console. In RevenueCat, attach both to the entitlement named exactly `premium`, and put them in the current offering's standard monthly and annual packages.
3. Copy `.env.example` to `.env.local` and set the two RevenueCat public app API keys. The keys are intentionally absent from this repository. Confirm store setup, product status, pricing, and any free trial in the store dashboards; the app displays the store's localized price and does not promise a trial that has not been configured.
4. Rebuild the native app after adding the keys and SDK. Expo Go can preview the screen but cannot make a real purchase. Use an Expo development build, then test with App Store sandbox and Google Play test accounts on devices.
   The Android config plugin sets MainActivity to `singleTop` so a payment verification step in another app does not cancel the billing flow.
5. Verify purchase, cancellation, pending purchase, renewal, and “Restore purchases” on both platforms before release. The paywall uses the store's own purchase confirmation sheet; it does not handle payment details.

This project currently has local demo sign-in, so the SDK uses RevenueCat's anonymous customer identity. Store restore is available on the paywall and subscription settings. Cross-account subscription sharing would require a real authenticated user ID and account backend.
