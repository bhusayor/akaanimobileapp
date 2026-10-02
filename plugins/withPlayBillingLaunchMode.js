const { withAndroidManifest } = require('expo/config-plugins');

// Play Billing may temporarily send the user to a bank app for verification.
// singleTop lets Akaani resume that purchase when the user returns.
module.exports = function withPlayBillingLaunchMode(config) {
  return withAndroidManifest(config, (next) => {
    const activities = next.modResults.manifest.application?.[0]?.activity ?? [];
    const main = activities.find((activity) => activity.$?.['android:name'] === '.MainActivity');
    if (!main) throw new Error('Akaani MainActivity was not found in AndroidManifest.xml');
    main.$['android:launchMode'] = 'singleTop';
    return next;
  });
};
