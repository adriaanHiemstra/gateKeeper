// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    // 👈 FIX: Removed the redundant "nativewind/babel" preset
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }], 
    ],
    plugins: [
      // NOTE: Must be the *LAST* plugin in the list!
      'react-native-reanimated/plugin',
    ],
  };
};