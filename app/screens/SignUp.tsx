import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
} from "lucide-react-native";

import { bannerGradient, fireGradient } from "../styles/colours";

const SignUp = () => {
  const navigation = useNavigation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = () => {
    if (!name || !email || !password) {
      Alert.alert("Missing Details", "Please fill in all fields.");
      return;
    }
    // In real app: Create user -> Navigate to Onboarding or Home
    Alert.alert("Welcome!", "Your account has been created.");
    // @ts-ignore
    navigation.replace("Home");
  };

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, padding: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mb-6 bg-white/10 self-start p-2 rounded-full"
            >
              <ArrowLeft color="white" size={24} />
            </TouchableOpacity>

            <Text
              className="text-white text-4xl font-bold mb-2"
              style={{ fontFamily: "Jost-Medium" }}
            >
              Create Account
            </Text>
            <Text className="text-gray-400 text-lg mb-10">
              Join the party today.
            </Text>

            {/* NAME */}
            <View className="mb-4">
              <Text className="text-gray-400 text-xs font-bold uppercase mb-2 ml-1">
                Full Name
              </Text>
              <View className="flex-row items-center bg-white/10 border border-white/20 rounded-2xl px-4 h-14">
                <User color="white" size={20} className="mr-3 opacity-70" />
                <TextInput
                  placeholder="Adriaan Smith"
                  placeholderTextColor="#666"
                  value={name}
                  onChangeText={setName}
                  className="flex-1 text-white text-lg font-medium h-full ml-2"
                  style={{ fontFamily: "Jost-Medium" }}
                />
              </View>
            </View>

            {/* EMAIL */}
            <View className="mb-4">
              <Text className="text-gray-400 text-xs font-bold uppercase mb-2 ml-1">
                Email
              </Text>
              <View className="flex-row items-center bg-white/10 border border-white/20 rounded-2xl px-4 h-14">
                <Mail color="white" size={20} className="mr-3 opacity-70" />
                <TextInput
                  placeholder="hello@example.com"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="flex-1 text-white text-lg font-medium h-full ml-2"
                  style={{ fontFamily: "Jost-Medium" }}
                />
              </View>
            </View>

            {/* PASSWORD */}
            <View className="mb-8">
              <Text className="text-gray-400 text-xs font-bold uppercase mb-2 ml-1">
                Password
              </Text>
              <View className="flex-row items-center bg-white/10 border border-white/20 rounded-2xl px-4 h-14">
                <Lock color="white" size={20} className="mr-3 opacity-70" />
                <TextInput
                  placeholder="Create a password"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  className="flex-1 text-white text-lg font-medium h-full ml-2"
                  style={{ fontFamily: "Jost-Medium" }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff color="#999" size={20} />
                  ) : (
                    <Eye color="#999" size={20} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* SIGN UP BUTTON */}
            <TouchableOpacity
              onPress={handleSignUp}
              activeOpacity={0.9}
              className="w-full shadow-lg shadow-orange-500/30 mb-6"
            >
              <LinearGradient
                {...fireGradient}
                className="w-full py-4 rounded-2xl flex-row items-center justify-center"
              >
                <Text
                  className="text-white text-xl font-bold tracking-wide mr-2"
                  style={{ fontFamily: "Jost-Medium" }}
                >
                  SIGN UP
                </Text>
                <ArrowRight color="white" size={24} />
              </LinearGradient>
            </TouchableOpacity>

            <View className="flex-row justify-center">
              <Text className="text-gray-400">Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text className="text-white font-bold underline">Log In</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default SignUp;
