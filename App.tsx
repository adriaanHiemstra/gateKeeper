import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import * as Font from "expo-font";
import { ActivityIndicator, View } from "react-native";
import AppNavigator from "./app/navigation/AppNavigator";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-gesture-handler";

// 👇 IMPORT THE AUTH PROVIDER
import { AuthProvider } from "./app/context/AuthContext";

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      "Jost-Medium": require("./app/assets/Jost-Medium.ttf"),
    }).then(() => setFontsLoaded(true));
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* 👇 WRAP EVERYTHING IN AUTH PROVIDER */}
      <AuthProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
