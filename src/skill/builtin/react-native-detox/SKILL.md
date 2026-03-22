---
name: react-native-detox
description: Write, run, and debug Detox end-to-end tests for React Native apps on iOS and Android. Use when the user mentions "detox", "e2e test", "end-to-end test", "mobile testing", "react native test", "simulator test", "emulator test", "UI test mobile", "integration test react native", or wants to test user flows on iOS/Android simulators. Handles test setup, writing test suites, configuring .detoxrc.js, mocking, CI integration, and debugging flaky tests.
license: MIT
metadata:
  author: defcode
  version: "1.0.0"
  domain: testing
  triggers: detox, e2e, end-to-end, mobile test, react native test, simulator test, emulator test, UI test mobile, integration test react native, detox config, .detoxrc, flaky test mobile
  role: specialist
  scope: testing
  output-format: code
  related-skills: vercel-react-native-skills, backend-testing, test-driven-development
---

# React Native Detox E2E Testing

Senior mobile test engineer specializing in Detox gray-box end-to-end testing for React Native. Writes deterministic, non-flaky test suites that run on iOS simulators and Android emulators.

## Core Workflow

1. **Assess** — Identify the app's platform targets, navigation structure, and critical user flows to test
2. **Configure** — Ensure `.detoxrc.js`, Jest config, and platform-specific setup (Gradle patches, `DetoxTest.java`, network security) are correct
3. **Write tests** — Create test suites using `testID`-based matchers, proper `beforeEach` resets, and `waitFor` synchronization
4. **Run** — Build the app with `detox build`, run tests with `detox test`, capture artifacts on failure
5. **Debug** — If tests fail or flake, use synchronization debugging, view hierarchy inspection, and targeted `waitFor` fixes
6. **Optimize** — Reduce flakiness by eliminating `sleep`, using `waitFor`, blacklisting URLs, and managing synchronization

## Reference Guide

Load detailed guidance based on context:

| Topic | Reference | Load When |
|-------|-----------|-----------|
| Full API Reference | `references/api-reference.md` | Writing tests, matchers, actions, expectations, device API, mocking, configuration |

## Setup Checklist

Before writing tests, verify:

1. **Dependencies installed**: `detox` and `jest@^29` in devDependencies
2. **Detox initialized**: `detox init` has been run (creates `.detoxrc.js`, `e2e/jest.config.js`, `e2e/starter.test.js`)
3. **App configs**: Binary paths and build commands set for each platform in `.detoxrc.js`
4. **Device configs**: Simulator/emulator names match available devices
5. **Android extras** (if targeting Android):
   - Kotlin + Detox maven repo in `android/build.gradle`
   - `testInstrumentationRunner`, `testBuildType`, proguard rules in `android/app/build.gradle`
   - `DetoxTest.java` in `androidTest` directory
   - Network security config allowing localhost cleartext
6. **Build succeeds**: `detox build --configuration <config>` completes without errors
7. **Metro dev server running** (debug builds): Detox debug tests depend on the React Native Metro bundler dev server. Verify it is running before executing tests.

### Dev Server Requirement (CRITICAL for Debug Builds)

Detox debug tests load the JS bundle from the Metro dev server. If Metro is not running, the app will launch but show a red screen or hang on the splash screen, causing all tests to time out.

**Before running tests, always check and start the dev server:**

```bash
# Check if Metro is already running
lsof -i :8081 | grep LISTEN

# If not running, start it in the background
npx react-native start &

# Or for Expo projects
npx expo start &

# Wait a moment for Metro to boot before running tests
sleep 5
detox test --configuration ios.sim.debug
```

**Signs that the dev server is not running:**
- Tests hang on app launch with no UI rendered
- Red screen with "No bundle URL present" or "Could not connect to development server"
- All tests time out without any assertions running
- Error: `"Runtime is not ready for debugging"` in logs

**Note:** Release builds (`ios.sim.release`, `android.emu.release`) bundle the JS inline and do NOT need the dev server. Only debug configurations require it.

### Quick Config Template

```js
/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/YourApp.app',
      build: 'xcodebuild -workspace ios/YourApp.xcworkspace -scheme YourApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: { type: 'iPhone 15' },
    },
    emulator: {
      type: 'android.emulator',
      device: { avdName: 'Pixel_4_API_33' },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
  },
  artifacts: {
    rootDir: '.artifacts',
    plugins: {
      screenshot: {
        enabled: true,
        shouldTakeAutomaticSnapshots: true,
        keepOnlyFailedTestsArtifacts: true,
      },
      log: { enabled: true },
      video: 'failing',
    },
  },
};
```

## Writing Tests — Patterns

### Test Structure

```js
describe('Feature: Login', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show error on invalid credentials', async () => {
    await element(by.id('LoginScreen.emailInput')).typeText('bad@email.com');
    await element(by.id('LoginScreen.passwordInput')).typeText('wrong');
    await element(by.id('LoginScreen.submitBtn')).tap();

    await waitFor(element(by.id('LoginScreen.errorText')))
      .toBeVisible()
      .withTimeout(3000);
    await expect(element(by.id('LoginScreen.errorText')))
      .toHaveText('Invalid credentials');
  });

  it('should navigate to home on valid login', async () => {
    await element(by.id('LoginScreen.emailInput')).typeText('user@test.com');
    await element(by.id('LoginScreen.passwordInput')).typeText('password123');
    await element(by.id('LoginScreen.submitBtn')).tap();

    await waitFor(element(by.id('HomeScreen.root')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
```

### TestID Naming Convention

Use dot-separated hierarchical names: `ScreenName.elementDescription`

```
LoginScreen.root
LoginScreen.emailInput
LoginScreen.passwordInput
LoginScreen.submitBtn
LoginScreen.errorText
HomeScreen.root
HomeScreen.settingsBtn
ProfileScreen.avatarImage
ProfileScreen.nameLabel
ItemList.item.0
ItemList.item.1
```

Rules:
- Always forward `testID` to the underlying native component in custom components
- Use unique IDs — never rely on `atIndex()` for production tests
- Never embed display text in testIDs — they must be locale-independent
- For lists, use index-based IDs: `ListName.item.${index}`

### Scrolling to Find Elements

```js
await waitFor(element(by.id('ItemList.item.15')))
  .toBeVisible()
  .whileElement(by.id('ItemList.scrollView'))
  .scroll(100, 'down');
```

### Handling Animations and Async

```js
// Prefer waitFor over sleep — ALWAYS
await waitFor(element(by.id('Modal.content')))
  .toBeVisible()
  .withTimeout(2000);

// Blacklist URLs that prevent idle detection
await device.setURLBlacklist([
  '.*analytics\\.example\\.com.*',
  '.*sentry\\.io.*',
]);

// Last resort: disable synchronization for animations
await device.disableSynchronization();
await element(by.id('AnimatedButton')).tap();
await device.enableSynchronization();
```

### Platform-Specific Logic

```js
if (device.getPlatform() === 'ios') {
  await device.launchApp({
    permissions: { notifications: 'YES', camera: 'YES' },
  });
}

if (device.getPlatform() === 'android') {
  await device.pressBack();
}
```

### Background/Foreground

```js
await device.sendToHome();
// Simulate user returning after delay
await device.launchApp({ newInstance: false });
await expect(element(by.id('HomeScreen.root'))).toBeVisible();
```

### Deep Links

```js
await device.launchApp({
  newInstance: true,
  url: 'myapp://profile/123',
});
await expect(element(by.id('ProfileScreen.root'))).toBeVisible();
```

### Assertions with getAttributes

```js
const jestExpect = require('expect').default;
const attrs = await element(by.id('PriceLabel')).getAttributes();
jestExpect(parseFloat(attrs.text.replace('$', ''))).toBeGreaterThan(0);
```

## Running Tests

```bash
# Build first
detox build --configuration ios.sim.debug

# Run all tests
detox test --configuration ios.sim.debug

# Run specific test file
detox test --configuration ios.sim.debug e2e/login.test.js

# Run with artifacts on failure
detox test --configuration ios.sim.debug --artifacts-location .artifacts --record-logs failing --take-screenshots failing --record-videos failing

# Retry flaky tests
detox test --configuration ios.sim.debug --retries 2

# Run specific test by name
detox test --configuration ios.sim.debug --grep "should login"
```

## Debugging Flaky Tests

When tests flake, investigate in this order:

1. **Check system dialogs** — iOS Keychain, permission prompts, or other native alerts block tests. Dismiss them with Detox's `system` API:
   ```js
   // Dismiss system dialogs (Keychain "Save Password", permissions, alerts)
   await system.element(by.system.label('Not Now')).tap();
   await system.element(by.system.label('Allow')).tap();
   ```
   To prevent the iOS Keychain dialog entirely, set `textContentType="none"` on password/email `TextInput` components.
   Pre-grant permissions at launch: `device.launchApp({ permissions: { camera: 'YES' } })`

2. **Check synchronization** — Is the app idle when Detox acts?
   - Add `await device.setURLBlacklist([...])` for background network calls
   - Wrap assertions in `waitFor(...).toBeVisible().withTimeout(N)`
3. **Check animations** — Infinite loops or long transitions?
   - Disable synchronization around animated interactions
4. **Check testIDs** — Are they forwarded to native components?
   - Use `device.generateViewHierarchyXml()` to inspect
5. **Check state** — Is `beforeEach` resetting properly?
   - Use `device.launchApp({ delete: true })` for full reset if needed
6. **Check timing** — Is the build stale?
   - Rebuild: `detox build --configuration <config>`
7. **Capture evidence** — Enable all artifacts for the failing test:
   ```js
   artifacts: {
     plugins: {
       screenshot: 'all',
       video: 'all',
       log: 'all',
     },
   }
   ```

## Mocking (Metro Bundler)

Standard `jest.mock()` does NOT work in Detox. Use Metro source extension overrides:

```js
// src/api/config.js (production)
export const API_URL = 'https://api.production.com';

// src/api/config.mock.js (test override)
export * from './config.js';
export const API_URL = 'http://localhost:9001';
```

```js
// metro.config.js
const { getDefaultConfig } = require('metro-config');
const defaultSourceExts = require('metro-config/src/defaults/defaults').sourceExts;

module.exports = {
  resolver: {
    sourceExts: process.env.DETOX_MOCK === '1'
      ? ['mock.js', 'mock.ts', ...defaultSourceExts]
      : defaultSourceExts,
  },
};
```

```bash
DETOX_MOCK=1 npx react-native start
```

## CI Integration (GitHub Actions)

```yaml
# iOS
- name: Install Detox CLI
  run: npm install -g detox-cli

- name: Build for Detox
  run: detox build --configuration ios.sim.release

- name: Run Detox Tests
  run: detox test --configuration ios.sim.release --retries 2 --cleanup

# Android (requires emulator setup)
- name: Start Android Emulator
  uses: reactivecircus/android-emulator-runner@v2
  with:
    api-level: 33
    script: detox test --configuration android.emu.release --retries 2 --cleanup
```

## Constraints

### MUST DO
- Use `testID` as the primary matcher — never match by text for critical flows
- Always `await` every Detox call — all APIs are async
- Use `waitFor(...).toBeVisible().withTimeout(N)` instead of `sleep()` or fixed delays
- Reset state in `beforeEach` using `device.reloadReactNative()` or `device.launchApp({ newInstance: true })`
- Forward `testID` props to underlying native components in all custom React Native components
- Use unique testIDs — never rely on `atIndex()` in production tests
- Re-enable synchronization after disabling it: `device.enableSynchronization()`
- Set up artifact capture for failing tests in CI
- Use `jestExpect` (from `require('expect').default`) for non-Detox assertions alongside Detox `expect`
- Keep test files in the `e2e/` directory

### MUST NOT DO
- Use `jest.mock()` in Detox tests — it does not work; use Metro bundler mocking
- Use `sleep()` or arbitrary timeouts — use `waitFor` with `withTimeout`
- Match elements by text for localized or frequently-changing content
- Forget `await` on Detox calls — this causes silent failures and flaky tests
- Broadly disable synchronization — keep scope minimal
- Use `atIndex()` as a primary strategy — fix testIDs instead
- Hard-code simulator/emulator names — use config-driven device selection
- Skip the `detox build` step before running tests after code changes
- Use `device.reloadReactNative()` when full state reset is needed — use `device.launchApp({ delete: true })`
- Introduce platform-specific test logic without `device.getPlatform()` guards
