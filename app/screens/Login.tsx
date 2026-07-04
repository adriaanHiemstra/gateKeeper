import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Modal,
  findNodeHandle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  X,
} from "lucide-react-native";

// Backend
import { supabase } from "../lib/supabase";

// Styles
import { bannerGradient, fireGradient } from "../styles/colours";
import { RootStackParamList } from "../types/types";

const Login = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Staff Modal State
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffCode, setStaffCode] = useState("");
  const [staffLoading, setStaffLoading] = useState(false);

  // KeyboardAwareScrollView only auto-scrolls when the keyboard first opens —
  // tapping a different field while it's already up doesn't fire that event,
  // so each field's onFocus below nudges the scroll view manually.
  const scrollRef = useRef<any>(null);
  const handleFocus = (event: any) => {
    scrollRef.current?.scrollToFocusedInput(findNodeHandle(event.target));
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please enter your email and password.");
      return;
    }

    setLoading(true);

    // 👇 SUPABASE LOGIN LOGIC
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setLoading(false);
      Alert.alert("Login Failed", error.message);
      return;
    }

    // Send first-timers (who never finished onboarding) to Onboarding,
    // and returning users straight to Home.
    let onboarded = true;
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarded")
        .eq("id", data.user.id)
        .single();
      onboarded = profile?.onboarded ?? false;
    }

    setLoading(false);
    navigation.replace(onboarded ? "Home" : "Onboarding");
  };

  const handleStaffLogin = async () => {
    const code = staffCode.replace(/\D/g, ""); // digits only
    if (!code) {
      Alert.alert("Missing Code", "Enter the code your host gave you.");
      return;
    }

    setStaffLoading(true);
    try {
      // Validate the code server-side and find out which event it unlocks.
      const { data, error } = await supabase.functions.invoke("staff-login", {
        body: { code },
      });

      if (error || !data?.ok) {
        Alert.alert("Invalid Code", data?.error ?? "Access denied. Please check your code.");
        return;
      }

      setShowStaffModal(false);
      setStaffCode("");
      // Scope the scanner to this event and pass the code so each scan is
      // authorized (staff have no Supabase session of their own).
      navigation.replace("ScanTickets", {
        eventId: data.eventId,
        staffCode: code,
        eventName: data.eventName,
      });
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not verify the code. Try again.");
    } finally {
      setStaffLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />

      <SafeAreaView className="flex-1">
        <KeyboardAwareScrollView
          ref={scrollRef}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            padding: 24,
          }}
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}
          extraScrollHeight={120}
          enableAutomaticScroll={true}
          >
            {/* LOGO & HEADER */}
            <View className="items-center mb-12">
              <Image
                source={require("../assets/logo.png")}
                className="w-24 h-24 mb-4"
                resizeMode="contain"
              />
              <Text
                className="text-white text-4xl font-bold"
                style={{ fontFamily: "Jost-Medium" }}
              >
                GateKeeper
              </Text>
              <Text className="text-gray-400 text-lg mt-1">
                Your pass to the best events.
              </Text>
            </View>

            {/* EMAIL INPUT */}
            <View className="mb-4">
              <Text className="text-gray-400 text-xs font-bold uppercase mb-2 ml-1">
                Email
              </Text>
              <View className="flex-row items-center bg-white/10 border border-white/20 rounded-2xl px-4 h-14">
                <Mail color="white" size={20} className="mr-3 opacity-70" />
                <TextInput
                  placeholder="Enter your email"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onFocus={handleFocus}
                  className="flex-1 text-white text-lg font-medium h-full ml-1"
                  style={{ fontFamily: "Jost-Medium" }}
                />
              </View>
            </View>

            {/* PASSWORD INPUT */}
            <View className="mb-2">
              <Text className="text-gray-400 text-xs font-bold uppercase mb-2 ml-1">
                Password
              </Text>
              <View className="flex-row items-center bg-white/10 border border-white/20 rounded-2xl px-4 h-14">
                <Lock color="white" size={20} className="mr-3 opacity-70" />
                <TextInput
                  placeholder="Enter your password"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={handleFocus}
                  className="flex-1 text-white text-lg font-medium h-full ml-1"
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

            {/* FORGOT PASSWORD */}
            <TouchableOpacity
              onPress={() => navigation.navigate("ForgotPassword")}
              className="self-end mb-8"
            >
              <Text className="text-orange-400 font-bold text-sm">
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* LOGIN BUTTON */}
            <TouchableOpacity
              onPress={handleLogin}
              activeOpacity={0.9}
              disabled={loading}
              className={`w-full shadow-lg shadow-orange-500/30 mb-6 ${
                loading ? "opacity-50" : "opacity-100"
              }`}
            >
              <LinearGradient
                {...fireGradient}
                className="w-full py-4 rounded-2xl flex-row items-center justify-center"
              >
                <Text
                  className="text-white text-xl font-bold tracking-wide mr-2"
                  style={{ fontFamily: "Jost-Medium" }}
                >
                  {loading ? "LOGGING IN..." : "LOG IN"}
                </Text>
                {!loading && <ArrowRight color="white" size={24} />}
              </LinearGradient>
            </TouchableOpacity>

            {/* SIGN UP LINK */}
            <View className="flex-row justify-center mb-12">
              <Text className="text-gray-400">Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
                <Text className="text-white font-bold underline">Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* STAFF PORTAL BUTTON */}
            <TouchableOpacity
              onPress={() => setShowStaffModal(true)}
              className="flex-row items-center justify-center py-3 bg-white/5 rounded-xl border border-white/10"
            >
              <ShieldCheck color="#666" size={18} className="mr-2" />
              <Text className="text-gray-500 font-bold text-sm">
                Staff / Bouncer Check-in
              </Text>
            </TouchableOpacity>
        </KeyboardAwareScrollView>
      </SafeAreaView>

      {/* STAFF LOGIN MODAL */}
      <Modal visible={showStaffModal} transparent animationType="slide">
        <View className="flex-1 bg-black/90 justify-center items-center px-6">
          <View className="w-full bg-[#1E1E1E] rounded-3xl p-6 border border-white/10">
            <View className="items-center mb-6">
              <View className="bg-purple-500/20 p-4 rounded-full mb-4">
                <ShieldCheck color="#D087FF" size={40} />
              </View>
              <Text className="text-white text-2xl font-bold">
                Staff Access
              </Text>
              <Text className="text-gray-400 text-center mt-2">
                Enter the 6-digit event code provided by the host.
              </Text>
            </View>

            <TextInput
              placeholder="000-000"
              placeholderTextColor="#666"
              value={staffCode}
              onChangeText={setStaffCode}
              className="bg-black/50 border border-white/20 rounded-xl px-4 h-16 text-white font-bold text-2xl text-center mb-6 tracking-widest"
              keyboardType="number-pad"
              maxLength={6}
            />

            <TouchableOpacity
              onPress={handleStaffLogin}
              disabled={staffLoading}
              className="w-full bg-purple-600 py-4 rounded-xl items-center mb-3"
            >
              <Text className="text-white font-bold text-lg">
                {staffLoading ? "CHECKING…" : "ENTER"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowStaffModal(false)}
              className="w-full py-3 items-center"
            >
              <Text className="text-gray-500 font-bold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Login;
