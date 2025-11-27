import React from "react";
import { Text, Image, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";

// Styles
import { fireGradient } from "../styles/colours";

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

type Props = {
  style?: any;
};

const TopBanner = ({ style }: Props) => {
  return (
    <AnimatedGradient {...fireGradient} style={[styles.container, style]}>
      {/* 👇 FIX: Logo is now Absolute Left to allow text centering */}
      <Image
        source={require("../assets/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* 👇 FIX: Text is strictly centered */}
      <View style={styles.textContainer}>
        <Text style={styles.text}>GateKeeper</Text>
      </View>
    </AnimatedGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    height: 100,
    justifyContent: "flex-end", // Aligns content to bottom
    paddingBottom: 12,
  },
  logo: {
    position: "absolute", // Take out of flow
    left: 24, // Pin to left
    bottom: 12, // Align with text
    width: 45,
    height: 45,
  },
  textContainer: {
    width: "100%",
    alignItems: "center", // Center text horizontally
    justifyContent: "flex-end",
  },
  text: {
    color: "white",
    fontSize: 32,
    fontFamily: "Jost-Medium",
    fontWeight: "bold",
    // Removed marginLeft since we are centering
  },
});

export default TopBanner;
