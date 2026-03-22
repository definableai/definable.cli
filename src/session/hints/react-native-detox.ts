import type { Detector } from "./context"
import { isReactNative } from "./context"

/** React Native → react-native-detox (NOT dogfood) */
export const reactNativeDetox: Detector = (ctx) => {
  if (!isReactNative(ctx)) return
  if ("detox" in ctx.deps) {
    return `This is a React Native project with Detox installed. If the user asks to "test my app", "e2e test", or any testing request, use the "react-native-detox" skill — NOT the "dogfood" skill. Dogfood is for web apps only. This is a mobile app.`
  }
  return `This is a React Native project without E2E testing set up. If the user wants to test their app, suggest loading the "react-native-detox" skill to set up automated E2E testing with Detox. Do NOT use the "dogfood" skill — that is for web apps only. Ask the user: "Would you like to automate your native app testing with Detox?"`
}
