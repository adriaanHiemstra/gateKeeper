import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Lock, CheckCircle, Eye, EyeOff } from "lucide-react-native";

// Components
import TopBanner from "../../components/TopBanner";
import BottomNav from "../../components/BottomNav";

// Styles
import { bannerGradient, fireGradient } from "../../styles/colours";

const ChangePassword = () => {
  const navigation = useNavigation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleUpdate = () => {
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }
    // Logic to update password...
    Alert.alert("Success", "Your password has been updated.");
    navigation.goBack();
  };

  const PasswordInput = ({
    label,
    value,
    onChange,
    show,
    toggleShow,
    placeholder,
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

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <TopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            className="flex-1 px-6"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 120, paddingBottom: 140 }}
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
                    Last changed 3 months ago
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
            />

            <PasswordInput
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              show={showNew}
              toggleShow={() => setShowNew(!showNew)}
              placeholder="Enter new password"
            />

            <PasswordInput
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showNew}
              toggleShow={() => setShowNew(!showNew)}
              placeholder="Re-enter new password"
            />
          </ScrollView>

          {/* UPDATE BUTTON */}
          <View className="absolute bottom-24 left-0 right-0 p-6">
            <TouchableOpacity
              activeOpacity={0.8}
              className="w-full shadow-lg shadow-orange-500/20"
              onPress={handleUpdate}
            >
              <LinearGradient
                {...fireGradient}
                className="w-full py-4 rounded-full items-center justify-center"
              >
                <Text
                  className="text-white text-xl font-bold tracking-wide"
                  style={{ fontFamily: "Jost-Medium" }}
                >
                  UPDATE PASSWORD
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <BottomNav />
    </View>
  );
};

export default ChangePassword;
