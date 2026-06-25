// app/screens/Welcome.tsx
import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ArrowRight } from "lucide-react-native";

import { bannerGradient, fireGradient } from "../styles/colours";
import { RootStackParamList } from "../types/types";

// Landing screen shown when there's no logged-in session. Lets the user choose
// between creating an account and logging in.
const Welcome = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />

      <SafeAreaView className="flex-1">
        <View className="flex-1 px-6 justify-between py-10">
          {/* BRANDING */}
          <View className="flex-1 items-center justify-center">
            <Image
              source={require("../assets/logo.png")}
              className="w-28 h-28 mb-6"
              resizeMode="contain"
            />
            <Text
              className="text-white text-5xl font-bold"
              style={{ fontFamily: "Jost-Medium" }}
            >
              GateKeeper
            </Text>
            <Text className="text-gray-400 text-lg mt-2 text-center">
              Your pass to the best events.
            </Text>
          </View>

          {/* ACTIONS */}
          <View>
            {/* Primary: Sign Up */}
            <TouchableOpacity
              onPress={() => navigation.navigate("SignUp")}
              activeOpacity={0.9}
              className="w-full shadow-lg shadow-orange-500/30 mb-4"
            >
              <LinearGradient
                {...fireGradient}
                className="w-full py-4 rounded-2xl flex-row items-center justify-center"
              >
                <Text
                  className="text-white text-xl font-bold tracking-wide mr-2"
                  style={{ fontFamily: "Jost-Medium" }}
                >
                  GET STARTED
                </Text>
                <ArrowRight color="white" size={24} />
              </LinearGradient>
            </TouchableOpacity>

            {/* Secondary: Log In */}
            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
              activeOpacity={0.9}
              className="w-full py-4 rounded-2xl items-center justify-center border border-white/15 bg-white/5"
            >
              <Text
                className="text-white text-lg font-bold tracking-wide"
                style={{ fontFamily: "Jost-Medium" }}
              >
                I ALREADY HAVE AN ACCOUNT
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default Welcome;
