import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import * as Font from "expo-font";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// 👇 1. Import it here
import { NavigationContainer } from "@react-navigation/native";

import AppNavigator from "./app/navigation/AppNavigator";
import { AuthProvider, useAuth } from "./app/context/AuthContext";
import { SavedEventsProvider } from "./app/context/SavedEventsContext";

// Shared full-screen loading state.
const Splash = () => (
  <View
    style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#121212",
    }}
  >
    <ActivityIndicator size="large" color="#FA8900" />
  </View>
);

// Decides where the app opens, based on the auth/session state:
//   - not logged in            → SignUp
//   - logged in, not onboarded → Onboarding
//   - logged in and onboarded  → Home
function RootGate() {
  const { isLoading, session, onboarded } = useAuth();

  if (isLoading) return <Splash />;

  const initialRouteName = !session
    ? "SignUp"
    : onboarded
      ? "Home"
      : "Onboarding";

  return <AppNavigator initialRouteName={initialRouteName} />;
}

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        "Jost-Medium": require("./app/assets/Jost-Medium.ttf"),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return <Splash />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* 👇 2. Navigation Container is the KING. It wraps EVERYTHING. */}
      <NavigationContainer>
        <AuthProvider>
          <SavedEventsProvider>
            <RootGate />
            <StatusBar style="light" />
          </SavedEventsProvider>
        </AuthProvider>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
