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
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  User,
  AtSign, // 🚨 Added AtSign icon for Username
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Calendar,
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

// Backend
import { supabase } from "../lib/supabase";

// Styles
import { bannerGradient, fireGradient } from "../styles/colours";
import { RootStackParamList } from "../types/types";

const SignUp = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [name, setName] = useState("");
  const [username, setUsername] = useState(""); // 🚨 New Username state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    // 🚨 Added username to the validation check
    if (!name || !username || !email || !password || !gender || !dob) {
      Alert.alert("Missing Fields", "Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const formattedDob = `${dob.getFullYear()}-${String(dob.getMonth() + 1).padStart(2, '0')}-${String(dob.getDate()).padStart(2, '0')}`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            username: username.toLowerCase().trim(), // 🚨 Format cleanly
            gender: gender,
            dob: formattedDob,
          },
        },
      });

      if (error) throw error;

      // If email confirmation is OFF, signUp returns a live session — the user
      // is already authenticated, so take them straight into onboarding.
      if (data.session) {
        navigation.replace("Onboarding");
      } else {
        // Email confirmation is ON: they must confirm before they can log in.
        Alert.alert(
          "Almost there!",
          "Check your email to confirm your account, then log in."
        );
        navigation.navigate("Login");
      }
    } catch (error: any) {
      Alert.alert("Sign Up Error", error.message);
    } finally {
      setLoading(false);
    }
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
            contentContainerStyle={{ padding: 24, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-12 h-12 bg-white/10 rounded-full items-center justify-center mb-6"
            >
              <ArrowLeft color="white" size={24} />
            </TouchableOpacity>

            <View className="mb-10">
              <Text
                className="text-white text-4xl font-bold mb-2"
                style={{ fontFamily: "Jost-Medium" }}
              >
                Create Account
              </Text>
              <Text className="text-gray-400 text-lg">
                Join GateKeeper today
              </Text>
            </View>

            <View className="space-y-4 mb-8">
              {/* FULL NAME */}
              <View className="mb-4">
                <Text className="text-gray-400 ml-2 mb-2 font-medium">
                  Full Name
                </Text>
                <View className="flex-row items-center bg-white/10 border border-white/20 rounded-2xl px-4 h-14">
                  <User color="#999" size={20} className="mr-3" />
                  <TextInput
                    placeholder="John Doe"
                    placeholderTextColor="#666"
                    value={name}
                    onChangeText={setName}
                    className="flex-1 text-white text-lg font-medium h-full ml-1"
                    style={{ fontFamily: "Jost-Medium", textAlignVertical: "center" }}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* 🚨 USERNAME */}
              <View className="mb-4">
                <Text className="text-gray-400 ml-2 mb-2 font-medium">
                  Username
                </Text>
                <View className="flex-row items-center bg-white/10 border border-white/20 rounded-2xl px-4 h-14">
                  <AtSign color="#999" size={20} className="mr-3" />
                  <TextInput
                    placeholder="johndoe123"
                    placeholderTextColor="#666"
                    value={username}
                    onChangeText={setUsername}
                    className="flex-1 text-white text-lg font-medium h-full ml-1"
                    style={{ fontFamily: "Jost-Medium", textAlignVertical: "center" }}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* DATE OF BIRTH */}
              <View className="mb-4">
                <Text className="text-gray-400 ml-2 mb-2 font-medium">
                  Date of Birth
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="flex-row items-center bg-white/10 border border-white/20 rounded-2xl px-4 h-14"
                >
                  <Calendar color="#999" size={20} className="mr-3" />
                  <Text className={`flex-1 text-lg ${dob ? "text-white" : "text-[#666]"}`}>
                    {dob ? dob.toLocaleDateString() : "Select your birth date"}
                  </Text>
                </TouchableOpacity>

                {Platform.OS === "android" && showDatePicker && (
                  <DateTimePicker
                    value={dob || new Date(2000, 0, 1)}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) setDob(selectedDate);
                    }}
                  />
                )}

                {Platform.OS === "ios" && (
                  <Modal visible={showDatePicker} transparent animationType="slide">
                    <TouchableOpacity 
                      className="flex-1 justify-end bg-black/60"
                      activeOpacity={1}
                      onPress={() => setShowDatePicker(false)} 
                    >
                      <TouchableOpacity 
                        activeOpacity={1} 
                        className="bg-[#1E1E1E] rounded-t-3xl pb-10 pt-4"
                      >
                        <View className="flex-row justify-between items-center px-6 mb-4">
                          <Text className="text-white text-xl font-bold">Birth Date</Text>
                          <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                            <Text className="text-purple-400 font-bold text-lg">Done</Text>
                          </TouchableOpacity>
                        </View>
                        <DateTimePicker
                          value={dob || new Date(2000, 0, 1)}
                          mode="date"
                          display="spinner"
                          themeVariant="dark"
                          maximumDate={new Date()}
                          onChange={(event, selectedDate) => {
                            if (selectedDate) setDob(selectedDate);
                          }}
                        />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </Modal>
                )}
              </View>

              {/* GENDER */}
              <View className="mb-4">
                <Text className="text-gray-400 ml-2 mb-2 font-medium">Gender</Text>
                <View className="flex-row gap-3">
                  {["Male", "Female", "Other"].map((g) => (
                    <TouchableOpacity
                      key={g}
                      onPress={() => setGender(g)}
                      className={`flex-1 items-center justify-center h-12 rounded-xl border ${
                        gender === g
                          ? "bg-purple-500/20 border-purple-500"
                          : "bg-white/5 border-white/10"
                      }`}
                    >
                      <Text
                        className={`font-medium ${
                          gender === g ? "text-purple-300" : "text-gray-400"
                        }`}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* EMAIL */}
              <View className="mb-4">
                <Text className="text-gray-400 ml-2 mb-2 font-medium">
                  Email
                </Text>
                <View className="flex-row items-center bg-white/10 border border-white/20 rounded-2xl px-4 h-14">
                  <Mail color="#999" size={20} className="mr-3" />
                  <TextInput
                    placeholder="you@example.com"
                    placeholderTextColor="#666"
                    value={email}
                    onChangeText={setEmail}
                    className="flex-1 text-white text-lg font-medium h-full ml-1"
                    style={{ fontFamily: "Jost-Medium", textAlignVertical: "center" }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* PASSWORD */}
              <View className="mb-4">
                <Text className="text-gray-400 ml-2 mb-2 font-medium">
                  Password
                </Text>
                <View className="flex-row items-center bg-white/10 border border-white/20 rounded-2xl px-4 h-14">
                  <Lock color="#999" size={20} className="mr-3" />
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={setPassword}
                    className="flex-1 text-white text-lg font-medium h-full ml-1"
                    style={{ fontFamily: "Jost-Medium", textAlignVertical: "center" }}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="p-2"
                  >
                    {showPassword ? (
                      <EyeOff color="#999" size={20} />
                    ) : (
                      <Eye color="#999" size={20} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* SIGN UP BUTTON */}
            <TouchableOpacity
              onPress={handleSignUp}
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
                  {loading ? "CREATING..." : "SIGN UP"}
                </Text>
                {!loading && <ArrowRight color="white" size={24} />}
              </LinearGradient>
            </TouchableOpacity>

            <View className="flex-row justify-center pb-6">
              <Text className="text-gray-400">Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
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