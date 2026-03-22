import type { Detector } from "./context"
import { isReactNative } from "./context"

/** React Native → react-native-detox (NOT dogfood) */
export const reactNativeDetox: Detector = (ctx) => {
  if (!isReactNative(ctx)) return
  const framework = "expo" in ctx.deps ? "Expo" : "React Native"
  if ("detox" in ctx.deps) {
    return `PROJECT TYPE: ${framework} mobile app (detox installed). For ANY testing request ("test my app", "test my page", "test my login", etc.), use the "react-native-detox" skill. Tell the user: "I see this is a ${framework} project — I'll use Detox to run E2E tests on the simulator." Do NOT use "dogfood" or ask for a URL.`
  }
  return `PROJECT TYPE: ${framework} mobile app (no E2E testing set up). For ANY testing request, suggest the "react-native-detox" skill. Tell the user: "I see this is a ${framework} project — would you like me to set up Detox for E2E testing?" Do NOT use "dogfood" or ask for a URL.`
}
