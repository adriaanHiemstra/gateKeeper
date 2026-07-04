import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  findNodeHandle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Lock, CheckCircle, Eye, EyeOff } from "lucide-react-native";

// Components
import TopBanner from "../../components/TopBanner";
import BottomNav from "../../components/BottomNav";

// Backend
import { supabase } from "../../lib/supabase";

// Styles
import { bannerGradient, fireGradient } from "../../styles/colours";

// 🚨 FIX: Moved PasswordInput OUTSIDE the main component so it doesn't remount on every keystroke
const PasswordInput = ({
  label,
  value,
  onChange,
  show,
  toggleShow,
  placeholder,
  onFocus,
}: any) => (
  <View className="mb-6">
    <Text className="text-gray-400 text-xs font-bold mb-2 ml-1 uppercase tracking-wider">
      {label}
    </Text>
    <View className="flex-row items-center bg-white/10 border border-white/20 rounded-xl px-4 h-14">
      <Lock color="white" size={20} className="mr-3 opacity-70" />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#666"
        secureTextEntry={!show}
        onFocus={onFocus}
        className="flex-1 text-white text-lg font-medium h-full"
        style={{ fontFamily: "Jost-Medium" }}
      />
      <TouchableOpacity onPress={toggleShow} className="p-2">
        {show ? (
          <EyeOff color="#999" size={20} />
        ) : (
          <Eye color="#999" size={20} />
        )}
      </TouchableOpacity>
    </View>
  </View>
);

const ChangePassword = () => {
  const navigation = useNavigation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Loading State
  const [loading, setLoading] = useState(false);

  // Visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // KeyboardAwareScrollView only auto-scrolls when the keyboard first opens —
  // tapping a different field while it's already up doesn't fire that event,
  // so each field's onFocus below nudges the scroll view manually.
  const scrollRef = useRef<any>(null);
  const handleFocus = (event: any) => {
    scrollRef.current?.scrollToFocusedInput(findNodeHandle(event.target));
  };

  const handleUpdate = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Missing Fields", "Please fill out all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      // 1. Get the current authenticated user's email
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user?.email) {
        throw new Error("Unable to verify user account. Please sign out and log back in.");
      }

      // 2. Verify current password by attempting a background sign-in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("Your current password is incorrect.");
      }

      // 3. Update to the new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      Alert.alert("Success", "Your password has been successfully updated.");
      navigation.goBack();
      
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <TopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <KeyboardAwareScrollView
          ref={scrollRef}
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 120, paddingBottom: 140 }}
          enableOnAndroid={true}
          extraScrollHeight={120}
          keyboardShouldPersistTaps="handled"
          enableAutomaticScroll={true}
        >
            {/* HEADER */}
            <View className="flex-row items-center mb-8">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="mr-4 bg-white/10 p-2 rounded-full"
              >
                <ArrowLeft color="white" size={24} />
              </TouchableOpacity>
              <Text
                className="text-white text-3xl font-bold"
                style={{ fontFamily: "Jost-Medium" }}
              >
                Security
              </Text>
            </View>

            <View className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
              <View className="flex-row items-center mb-4">
                <View className="bg-green-500/20 p-2 rounded-full mr-3">
                  <CheckCircle color="#4ade80" size={20} />
                </View>
                <View>
                  <Text className="text-white font-bold text-lg">
                    Strong Password
                  </Text>
                  <Text className="text-gray-400 text-xs">
                    Last changed recently
                  </Text>
                </View>
              </View>
              <Text className="text-gray-300 text-sm leading-5">
                Protect your account with a unique password at least 6
                characters long.
              </Text>
            </View>

            <PasswordInput
              label="Current Password"
              value={currentPassword}
              onChange={setCurrentPassword}
              show={showCurrent}
              toggleShow={() => setShowCurrent(!showCurrent)}
              placeholder="Enter current password"
              onFocus={handleFocus}
            />

            <PasswordInput
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              show={showNew}
              toggleShow={() => setShowNew(!showNew)}
              placeholder="Enter new password"
              onFocus={handleFocus}
            />

            <PasswordInput
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showNew}
              toggleShow={() => setShowNew(!showNew)}
              placeholder="Re-enter new password"
              onFocus={handleFocus}
            />
        </KeyboardAwareScrollView>

        {/* UPDATE BUTTON */}
        <View className="absolute bottom-24 left-0 right-0 p-6">
          <TouchableOpacity
            activeOpacity={0.8}
            className={`w-full shadow-lg ${loading ? 'opacity-80' : 'shadow-orange-500/20'}`}
            onPress={handleUpdate}
            disabled={loading}
          >
            <LinearGradient
              {...fireGradient}
              className="w-full py-4 rounded-full flex-row items-center justify-center"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text
                  className="text-white text-xl font-bold tracking-wide"
                  style={{ fontFamily: "Jost-Medium" }}
                >
                  UPDATE PASSWORD
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <BottomNav />
    </View>
  );
};

export default ChangePassword;