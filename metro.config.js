// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
// const path = require('path'); // Only needed if using projectRoot option

const config = getDefaultConfig(__dirname);

// -------------------------------------------------------------
// 👇 ADD THIS RESOLVER SECTION TO ENSURE ALIASES ARE CORRECT
// This targets common native module conflicts
// -------------------------------------------------------------
config.resolver.extraNodeModules = {
  // Ensuring 'react-native' components are linked correctly
  react: require.resolve("react"),
  "react-native": require.resolve("react-native"),

  // Explicitly linking core Expo/React Native dependencies
  "react-native-reanimated": require.resolve("react-native-reanimated"),
  "react-native-safe-area-context": require.resolve(
    "react-native-safe-area-context"
  ),
  "react-native-gesture-handler": require.resolve(
    "react-native-gesture-handler"
  ),
};
// -------------------------------------------------------------
// 👆 END OF NEW RESOLVER SECTION
// -------------------------------------------------------------

config.resolver.sourceExts.push("ts", "tsx");
config.resolver.assetExts.push("ttf");

module.exports = withNativeWind(config, { input: "./global.css" });
