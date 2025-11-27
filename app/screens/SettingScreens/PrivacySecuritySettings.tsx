import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ArrowLeft,
  Lock,
  Eye,
  Shield,
  Key,
  Smartphone,
  ChevronRight,
  EyeOff,
} from "lucide-react-native";

// Components
import TopBanner from "../../components/TopBanner";
import BottomNav from "../../components/BottomNav";

// Styles
import { bannerGradient, fireGradient } from "../../styles/colours";
import { RootStackParamList } from "../../types/types";

const PrivacySecuritySettings = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Mock State
  const [isPrivate, setIsPrivate] = useState(false);
  const [activityStatus, setActivityStatus] = useState(true);
  const [faceId, setFaceId] = useState(true);

  const OptionRow = ({
    label,
    icon,
    value,
    onValueChange,
    type = "toggle",
    onPress,
  }: any) => (
    <TouchableOpacity
      activeOpacity={type === "link" ? 0.7 : 1}
      onPress={type === "link" ? onPress : null}
      className="flex-row items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl mb-3"
    >
      <View className="flex-row items-center flex-1 mr-4">
        <View className="bg-white/10 p-3 rounded-full mr-4">{icon}</View>
        <Text
          className="text-white font-bold text-lg"
          style={{ fontFamily: "Jost-Medium" }}
        >
          {label}
        </Text>
      </View>

      {type === "toggle" ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: "#333", true: "#FA8900" }} // User Theme Orange
          thumbColor={"#fff"}
        />
      ) : (
        <ChevronRight color="#666" size={20} />
      )}
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <TopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingTop: 120, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View className="flex-row items-center mb-8">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mr-4 bg-white/10 p-2 rounded-full"
            >
              <ArrowLeft color="white" size={24} />
            </TouchableOpacity>
            <View>
              <Text
                className="text-white text-3xl font-bold"
                style={{ fontFamily: "Jost-Medium" }}
              >
                Privacy & Security
              </Text>
              <Text className="text-gray-400 text-sm">
                Control who sees your activity
              </Text>
            </View>
          </View>

          {/* 1. ACCOUNT PRIVACY */}
          <Text className="text-gray-500 font-bold text-xs uppercase mb-3 ml-2">
            Visibility
          </Text>

          <OptionRow
            label="Private Account"
            icon={<Lock color="#FA8900" size={20} />}
            value={isPrivate}
            onValueChange={setIsPrivate}
          />
          <Text className="text-gray-400 text-xs ml-4 mb-6 leading-5">
            When your account is private, only people you approve can see your
            tickets and wishlists.
          </Text>

          <OptionRow
            label="Activity Status"
            icon={
              activityStatus ? (
                <Eye color="#FA8900" size={20} />
              ) : (
                <EyeOff color="#666" size={20} />
              )
            }
            value={activityStatus}
            onValueChange={setActivityStatus}
          />

          {/* 2. LOGIN & SECURITY */}
          <Text className="text-gray-500 font-bold text-xs uppercase mb-3 ml-2">
            Login & Security
          </Text>

          <OptionRow
            type="link"
            label="Change Password"
            icon={<Key color="#FA8900" size={20} />}
            onPress={() => navigation.navigate("ChangePassword")} // Links to the screen we built
          />

          <OptionRow
            label="FaceID / Biometrics"
            icon={<Shield color="#FA8900" size={20} />}
            value={faceId}
            onValueChange={setFaceId}
          />

          <OptionRow
            type="link"
            label="Two-Factor Auth"
            icon={<Smartphone color="#FA8900" size={20} />}
            onPress={() => console.log("2FA Flow")}
          />
        </ScrollView>
      </SafeAreaView>
      <BottomNav />
    </View>
  );
};

export default PrivacySecuritySettings;
