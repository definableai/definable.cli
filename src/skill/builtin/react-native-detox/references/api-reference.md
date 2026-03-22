# Detox API Reference

Complete reference for Detox v20.x — matchers, actions, expectations, device API, and configuration.

---

## Configuration (`.detoxrc.js`)

### Full Structure

```js
/** @type {Detox.DetoxConfig} */
module.exports = {
  logger: { level: 'info' },       // 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace'
  behavior: { init: { exposeGlobals: true } },
  session: {},
  testRunner: {
    args: { $0: 'jest', config: 'e2e/jest.config.js' },
    jest: { setupTimeout: 120000 },
    retries: 0,
    noRetryArgs: ['shard'],
  },
  artifacts: {
    rootDir: '.artifacts',
    pathBuilder: './config/pathbuilder.js',
    plugins: {
      instruments: { enabled: false },       // iOS only
      log: { enabled: true },
      uiHierarchy: 'enabled',               // iOS only
      screenshot: {
        enabled: true,
        shouldTakeAutomaticSnapshots: true,
        keepOnlyFailedTestsArtifacts: true,
        takeWhen: { testStart: false, testDone: true },
      },
      video: {
        android: { bitRate: 4000000 },
        simulator: { codec: 'hevc' },
      },
    },
  },
  devices: { /* ... */ },
  apps: { /* ... */ },
  configurations: { /* ... */ },
};
```

### Config file resolution order
1. `.detoxrc.js` 2. `.detoxrc.json` 3. `.detoxrc` 4. `detox.config.js` 5. `detox.config.json` 6. `package.json` `"detox"` key

### Extending configs
```js
module.exports = { extends: '@my-org/detox-preset' };
```

### App Configs

#### iOS
```js
apps: {
  'ios.debug': {
    type: 'ios.app',
    binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/YourApp.app',
    build: 'xcodebuild -workspace ios/YourApp.xcworkspace -scheme YourApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
  },
  'ios.release': {
    type: 'ios.app',
    binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/YourApp.app',
    build: 'xcodebuild -workspace ios/YourApp.xcworkspace -scheme YourApp -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
  },
}
```

#### Android
```js
apps: {
  'android.debug': {
    type: 'android.apk',
    binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
    build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
    testBinaryPath: 'android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk', // optional
  },
  'android.release': {
    type: 'android.apk',
    binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
    build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release',
  },
}
```

### Device Configs
```js
devices: {
  simulator: { type: 'ios.simulator', device: { type: 'iPhone 15' } },
  emulator:  { type: 'android.emulator', device: { avdName: 'Pixel_4_API_33' } },
  attached:  { type: 'android.attached', device: { adbName: '.*' } },
}
```

### Multi-App Configs
```js
configurations: {
  'multi.ios.debug': {
    device: 'simulator',
    apps: ['passenger.ios.debug', 'driver.ios.debug'],
  },
}
```

---

## Device API

Globally available as `device` in all test files.

### Properties

| Property | Description |
|----------|-------------|
| `device.id` | UDID (iOS) or ADB name (Android) |
| `device.name` | Human-readable device name |
| `device.appLaunchArgs` | Manage launch arguments |

### Launch Args

```js
device.appLaunchArgs.modify({ mockServerPort: 1234 });
device.appLaunchArgs.get();
device.appLaunchArgs.reset();
// Multi-app shared args
device.appLaunchArgs.shared.modify({ permanentFlag: true });
```

### Methods

#### `device.launchApp(params)`

| Param | Type | Description |
|-------|------|-------------|
| `newInstance` | boolean | Kill and relaunch (default: false) |
| `delete` | boolean | Uninstall + reinstall |
| `resetAppState` | boolean | Clear app data (faster than delete) |
| `permissions` | object | iOS only: `{ camera: 'YES', location: 'always' }` |
| `url` | string | Deep link URL |
| `userNotification` | object | Launch with push notification payload |
| `userActivity` | object | iOS only: NSUserActivity |
| `launchArgs` | object | Extra args: `{ detoxEnableSynchronization: 0 }` |
| `languageAndLocale` | object | iOS only: `{ language: 'es-MX', locale: 'es-MX' }` |
| `disableTouchIndicators` | boolean | iOS only |

Supported permissions (iOS): `location` (always/inuse/never/unset), `contacts`, `photos`, `calendar`, `camera`, `medialibrary`, `microphone`, `motion`, `reminders`, `siri`, `notifications`, `health`, `homekit`, `speech`, `faceid`, `userTracking`

#### Other Device Methods

```js
await device.terminateApp();                // current app
await device.terminateApp('com.other.app'); // specific bundle
await device.reloadReactNative();           // fast JS-only reload
await device.sendToHome();                  // background
await device.installApp('path/to/app');
await device.uninstallApp('com.bundle.id');
await device.openURL({ url: 'myapp://deep' });
await device.setOrientation('landscape');   // or 'portrait'
await device.setLocation(37.7749, -122.4194);
await device.enableSynchronization();
await device.disableSynchronization();
await device.setURLBlacklist(['.*analytics.*']);
await device.resetAppState();
await device.resetContentAndSettings();     // iOS only
await device.getPlatform();                 // 'ios' | 'android'
await device.takeScreenshot('name');
await device.captureViewHierarchy('name');  // iOS only, .viewhierarchy
await device.generateViewHierarchyXml();
await device.shake();                       // iOS only
await device.pressBack();                   // Android only
await device.reverseTcpPort(8081);          // Android only
await device.unreverseTcpPort(8081);        // Android only
await device.getUiDevice();                 // Android only — UiAutomator
await device.tap({ x: 100, y: 150 });
await device.longPress({ x: 100, y: 150 }, 2000);
```

#### Biometrics (iOS only)
```js
await device.setBiometricEnrollment(true);
await device.matchFace();     // Face ID success
await device.unmatchFace();   // Face ID failure
await device.matchFinger();   // Touch ID success
await device.unmatchFinger(); // Touch ID failure
```

#### Status Bar (iOS only)
```js
await device.setStatusBar({
  time: '12:34', dataNetwork: 'wifi', wifiBars: '3',
  batteryState: 'charging', batteryLevel: '100',
});
await device.resetStatusBar();
```

#### `device.selectApp(name)` — Multi-App
```js
await device.selectApp('driverApp');
```

#### `device.clearKeychain()` — iOS only

---

## Matchers

All matchers are accessed via the global `by` object.

### Primary Matchers

| Matcher | Description | Example |
|---------|-------------|---------|
| `by.id(id)` | Match `testID` / accessibility ID | `by.id('LoginBtn')` |
| `by.text(text)` | Match visible text | `by.text('Submit')` |
| `by.label(label)` | Match `accessibilityLabel` | `by.label('Close')` |
| `by.type(className)` | Match native class | `by.type('RCTImageView')` |
| `by.traits([...])` | Match accessibility traits (iOS) | `by.traits(['button'])` |

All string matchers support regex: `by.id(/^Login/)`, `by.text(/Welcome/i)`

Regex flags: `i` (ignore case), `s` (dot all), `m` (multiline). iOS does NOT support lookbehind.

### Compound Matchers

```js
element(by.id('child').withAncestor(by.id('parent')));
element(by.id('parent').withDescendant(by.id('child')));
element(by.id('item').and(by.text('Active')));
element(by.text('Item')).atIndex(2); // last resort — prefer unique IDs
```

---

## Actions

All actions are called on `element(matcher)` and return promises.

### Tap & Press

```js
await element(by.id('btn')).tap();
await element(by.id('btn')).tap({ x: 5, y: 10 });
await element(by.id('btn')).multiTap(3);
await element(by.id('btn')).longPress();
await element(by.id('btn')).longPress(1500);          // ms duration
await element(by.id('btn')).longPress({ x: 5, y: 10 }, 1500);
```

### Drag & Drop

```js
await element(by.id('source')).longPressAndDrag(
  2000,       // duration ms
  NaN,        // normalizedPositionX
  NaN,        // normalizedPositionY
  element(by.id('target')),
  NaN,        // normalizedTargetPositionX
  NaN,        // normalizedTargetPositionY
  'slow',     // speed: 'fast' | 'slow'
  0           // holdDuration
);
```

### Swipe

```js
await element(by.id('view')).swipe('left');   // direction: left | right | up | down
await element(by.id('view')).swipe('down', 'slow');
await element(by.id('view')).swipe('down', 'fast', 0.75);
await element(by.id('view')).swipe('down', 'fast', NaN, 0.8);       // startX
await element(by.id('view')).swipe('down', 'fast', NaN, NaN, 0.25); // startY
```

### Pinch (iOS only)

```js
await element(by.id('zoomable')).pinch(1.5);         // zoom in
await element(by.id('zoomable')).pinch(0.5);         // zoom out
await element(by.id('zoomable')).pinch(1.5, 'slow'); // with speed
await element(by.id('zoomable')).pinch(1.5, 'slow', 45); // with angle
```

### Scroll

```js
await element(by.id('list')).scroll(200, 'down');
await element(by.id('list')).scroll(200, 'down', NaN, 0.85); // startY
await element(by.id('list')).scrollTo('top');    // edge: top | bottom | left | right
await element(by.id('list')).scrollTo('bottom');
await element(by.id('list')).scrollToIndex(0);   // Android only
```

### Scroll Until Visible

```js
await waitFor(element(by.id('Item.42')))
  .toBeVisible()
  .whileElement(by.id('ScrollView'))
  .scroll(100, 'down');
```

### Text Input

```js
await element(by.id('input')).typeText('hello');       // uses keyboard
await element(by.id('input')).replaceText('replaced'); // faster, skips callbacks
await element(by.id('input')).clearText();
await element(by.id('input')).tapReturnKey();
await element(by.id('input')).tapBackspaceKey();
```

### Pickers & Sliders

```js
await element(by.id('picker')).setColumnToValue(0, 'Option A'); // iOS only
await element(by.id('datePicker')).setDatePickerDate('2024-01-15T10:30:00Z', 'ISO8601');
await element(by.id('datePicker')).setDatePickerDate('2024/01/15', 'yyyy/MM/dd');
await element(by.id('slider')).adjustSliderToPosition(0.5); // 0.0 to 1.0
```

### Element Inspection

```js
const attrs = await element(by.id('label')).getAttributes();
// Returns: { text, label, placeholder, enabled, identifier, visible, value, frame }
// iOS extras: activationPoint, hittable, elementFrame, safeAreaInsets, date, normalizedSliderPosition, contentOffset
// Android extras: visibility, width, height, elevation, alpha, focused, textSize, length

// Multiple matches:
const multi = await element(by.text('Item')).getAttributes();
// multi.elements is an array
```

### Screenshots & Accessibility

```js
await element(by.id('component')).takeScreenshot('component-state');
await element(by.id('view')).performAccessibilityAction('activate');
```

---

## Expectations

All expectations use the global `expect()` (Detox's version, not Jest's).

### Assertions

| Expectation | Description |
|-------------|-------------|
| `toBeVisible()` | At least 75% visible |
| `toBeVisible(35)` | At least 35% visible |
| `toExist()` | Exists in hierarchy (even if off-screen) |
| `toBeFocused()` | Element has focus |
| `toHaveText(text)` | Exact text match |
| `toHaveLabel(label)` | Accessibility label match |
| `toHaveId(id)` | testID match |
| `toHaveValue(value)` | Accessibility value match |
| `toHaveSliderPosition(pos, tolerance?)` | Slider normalized position |
| `toHaveToggleValue(bool)` | Switch/checkbox state |

### Negation

```js
await expect(element(by.id('modal'))).not.toBeVisible();
await expect(element(by.id('deleted'))).not.toExist();
```

### waitFor (Synchronization)

```js
await waitFor(element(by.id('loading'))).not.toBeVisible().withTimeout(5000);
await waitFor(element(by.id('content'))).toBeVisible().withTimeout(3000);

// Combined with scroll
await waitFor(element(by.id('Item.99')))
  .toBeVisible()
  .whileElement(by.id('ScrollView'))
  .scroll(50, 'down');
```

### Using Jest Expect Alongside Detox Expect

```js
const jestExpect = require('expect').default;
const attrs = await element(by.id('counter')).getAttributes();
jestExpect(parseInt(attrs.text, 10)).toBeGreaterThan(0);
jestExpect(attrs.enabled).toBe(true);
```

---

## System API (System Dialogs)

Detox provides a `system` API to interact with native system-level dialogs (Keychain, permissions, alerts) that sit outside the app's view hierarchy.

### System Matchers

```js
// Match by label text
system.element(by.system.label('Allow'));
system.element(by.system.label('Not Now'));
system.element(by.system.label("Don't Allow"));

// Match by type
system.element(by.system.type('button'));

// Combine matchers
system.element(by.system.type('button').and(by.system.label('OK')));
```

### System Actions

```js
// Tap a system dialog button
await system.element(by.system.label('Allow')).tap();
await system.element(by.system.label('Not Now')).tap();
```

### System Expectations

```js
await expect(system.element(by.system.label('Allow'))).toExist();
await expect(system.element(by.system.label('Allow'))).not.toExist();
```

### Common System Dialog Patterns

```js
// iOS Keychain "Save Password" / "Update Password" dialog
// Appears after entering credentials in login forms
async function dismissKeychainDialogIfPresent() {
  try {
    await system.element(by.system.label('Not Now')).tap();
  } catch (e) {
    // Dialog didn't appear — continue
  }
}

// Permission dialogs
await system.element(by.system.label('Allow')).tap();
await system.element(by.system.label('Allow While Using App')).tap();
await system.element(by.system.label("Don't Allow")).tap();
await system.element(by.system.label('Allow Once')).tap();

// Generic system alerts
await system.element(by.system.label('OK')).tap();
await system.element(by.system.label('Cancel')).tap();
await system.element(by.system.label('Dismiss')).tap();
```

### Preventing iOS Keychain Dialog (App-Level)

The cleanest fix — prevent the dialog from appearing at all:

```jsx
<TextInput
  testID="password_input"
  textContentType="none"       // Stops iOS from offering to save password
  autoComplete="off"           // Stops Android autofill prompt
  secureTextEntry={true}
/>
```

---

## Mocking via Metro

`jest.mock()` does NOT work in Detox. Override modules via Metro source extensions.

### Pattern

```
src/api/client.js          ← production code
src/api/client.mock.js     ← test override (same exports)
```

### metro.config.js

```js
const defaultSourceExts = require('metro-config/src/defaults/defaults').sourceExts;

module.exports = {
  resolver: {
    sourceExts: process.env.DETOX_MOCK === '1'
      ? ['mock.js', 'mock.ts', ...defaultSourceExts]
      : defaultSourceExts,
  },
};
```

### Running with mocks

```bash
DETOX_MOCK=1 npx react-native start
```

---

## Android-Specific Setup

### `android/build.gradle` patches

```gradle
buildscript {
  ext {
    minSdkVersion = 21
    kotlinVersion = 'X.Y.Z'
  }
  dependencies {
    classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")
  }
}
allprojects {
  repositories {
    maven { url("$rootDir/../node_modules/detox/Detox-android") }
  }
}
```

### `android/app/build.gradle` patches

```gradle
android {
  defaultConfig {
    testBuildType System.getProperty('testBuildType', 'debug')
    testInstrumentationRunner 'androidx.test.runner.AndroidJUnitRunner'
  }
  buildTypes {
    release {
      proguardFile "${rootProject.projectDir}/../node_modules/detox/android/detox/proguard-rules-app.pro"
    }
  }
}
dependencies {
  androidTestImplementation('com.wix:detox:+')
  implementation 'androidx.appcompat:appcompat:1.1.0'
}
```

### DetoxTest.java

At `android/app/src/androidTest/java/com/<package>/DetoxTest.java`:

```java
package com.yourpackage;

import com.wix.detox.Detox;
import com.wix.detox.config.DetoxConfig;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.filters.LargeTest;
import androidx.test.rule.ActivityTestRule;

@RunWith(AndroidJUnit4.class)
@LargeTest
public class DetoxTest {
    @Rule
    public ActivityTestRule<MainActivity> mActivityRule =
        new ActivityTestRule<>(MainActivity.class, false, false);

    @Test
    public void runDetoxTests() {
        DetoxConfig detoxConfig = new DetoxConfig();
        detoxConfig.idlePolicyConfig.masterTimeoutSec = 90;
        detoxConfig.idlePolicyConfig.idleResourceTimeoutSec = 60;
        detoxConfig.rnContextLoadTimeoutSec = (BuildConfig.DEBUG ? 180 : 60);
        Detox.runTests(mActivityRule, detoxConfig);
    }
}
```

### Network Security Config

`android/app/src/main/res/xml/network_security_config.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
```

Register in `AndroidManifest.xml`:
```xml
<application android:networkSecurityConfig="@xml/network_security_config">
```

---

## TestID Best Practices

### Forward testID in Custom Components

```jsx
function CustomButton({ testID, label, onPress }) {
  return (
    <TouchableOpacity testID={testID} onPress={onPress}>
      <Text testID={`${testID}.label`}>{label}</Text>
    </TouchableOpacity>
  );
}
```

### List Items — Unique IDs

```jsx
const renderItem = ({ item, index }) => (
  <ListItem
    testID={`OrderList.item.${index}`}
    title={item.title}
    subtitle={item.subtitle}
  />
);
```

### Naming Convention

```
MODULE.SCREEN.ELEMENT

AUTH.LOGIN.emailInput
AUTH.LOGIN.passwordInput
AUTH.LOGIN.submitBtn
AUTH.LOGIN.errorText
HOME.FEED.scrollView
HOME.FEED.item.0
HOME.FEED.item.1
SETTINGS.PROFILE.avatarImage
SETTINGS.PROFILE.nameLabel
```

---

## CI Configuration

### GitHub Actions — iOS

```yaml
jobs:
  detox-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: brew tap wix/brew && brew install applesimutils
      - run: npx detox build --configuration ios.sim.release
      - run: npx detox test --configuration ios.sim.release --retries 2 --cleanup
        env:
          DETOX_MOCK: '1'
```

### GitHub Actions — Android

```yaml
jobs:
  detox-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - uses: actions/setup-java@v4
        with: { distribution: 'temurin', java-version: '17' }
      - run: npm ci
      - run: npx detox build --configuration android.emu.release
      - name: Run Detox
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 33
          script: npx detox test --configuration android.emu.release --retries 2 --cleanup
```

### Artifact Collection

```js
// .detoxrc.js — CI-optimized artifacts
artifacts: {
  rootDir: process.env.CI ? process.env.ARTIFACTS_DIR || '.artifacts' : '.artifacts',
  plugins: {
    screenshot: {
      enabled: true,
      shouldTakeAutomaticSnapshots: true,
      keepOnlyFailedTestsArtifacts: true,
    },
    video: process.env.CI ? 'failing' : 'none',
    log: { enabled: true },
  },
},
```

---

## Troubleshooting Quick Reference

| Symptom | Cause | Fix |
|---------|-------|-----|
| Test hangs after login | iOS Keychain "Save/Update Password" system dialog | Dismiss with `system.element(by.system.label('Not Now')).tap()` or set `textContentType="none"` on password inputs |
| System dialog blocks test | Permission or system alert covering the app | Use `system.element(by.system.label('Allow')).tap()` to dismiss, or pre-grant with `device.launchApp({ permissions: {...} })` |
| Test hangs / times out | App not idle — background network, animations | `device.setURLBlacklist([...])` or `device.disableSynchronization()` |
| Element not found | testID not forwarded to native component | Forward `testID` prop to a `<View>` or `<Text>` |
| Flaky on CI, passes locally | Timing differences, slower CI machines | Add `waitFor(...).withTimeout(N)`, increase `setupTimeout` |
| `No simulators found` | Wrong device name in config | Run `xcrun simctl list devicetypes`, update `.detoxrc.js` |
| `No emulators found` | Wrong AVD name | Run `emulator -list-avds`, update `.detoxrc.js` |
| Android build fails | Missing Detox maven repo or Kotlin plugin | Verify `android/build.gradle` patches |
| `Cannot find test` | Wrong Jest config path | Check `testRunner.args.config` in `.detoxrc.js` |
| Stale app behavior | Build is outdated | Run `detox build` before `detox test` |
| `jest.mock()` not working | Jest mocking doesn't work in Detox | Use Metro source extension mocking |
| Keyboard not appearing | Simulator has software keyboard disabled | iOS: `Hardware > Keyboard > Toggle Software Keyboard` |
| `detoxEnableSynchronization` ignored | Must be passed as launch arg | `device.launchApp({ launchArgs: { detoxEnableSynchronization: 0 } })` |
