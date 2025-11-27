import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowLeft,
  ChevronRight,
  User,
  Lock,
  Bell,
  CreditCard,
  HelpCircle,
  LogOut,
  Zap,
  Repeat,
} from "lucide-react-native";

// 👇 FIX 1: Import these two specific types
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/types";

import HostTopBanner from "../../components/HostTopBanner";
import HostBottomNav from "../../components/HostBottomNav";
import { bannerGradient, electricGradient } from "../../styles/colours";

const HostSettingsScreen = () => {
  // 👇 FIX 2: Tell the hook to use your specific route list
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const SettingsItem = ({
    icon,
    label,
    onPress,
    isDestructive = false,
  }: any) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-between p-4 border-b border-white/5"
    >
      <View className="flex-row items-center">
        <View
          className={`p-2 rounded-lg mr-4 ${
            isDestructive ? "bg-red-500/10" : "bg-white/5"
          }`}
        >
          {icon}
        </View>
        <Text
          className={`text-lg font-medium ${
            isDestructive ? "text-red-500" : "text-white"
          }`}
          style={{ fontFamily: "Jost-Medium" }}
        >
          {label}
        </Text>
      </View>
      {!isDestructive && <ChevronRight color="#666" size={20} />}
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <View className="absolute inset-0 bg-black/40" />
      <HostTopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingTop: 120, paddingBottom: 140 }}
        >
          {/* HEADER */}
          <View className="mb-8">
            <Text
              className="text-white text-3xl font-bold"
              style={{ fontFamily: "Jost-Medium" }}
            >
              Host Menu
            </Text>
            <Text className="text-gray-400 text-base">
              Manage your business & account
            </Text>
          </View>

          {/* UPGRADE TO PRO BANNER */}
          <TouchableOpacity
            activeOpacity={0.9}
            className="mb-8 shadow-lg shadow-purple-900/50"
            onPress={() => console.log("Go to Pro Upgrade")}
          >
            <LinearGradient
              {...electricGradient}
              className="p-5 rounded-2xl border border-white/10"
            >
              <View className="flex-row justify-between items-start">
                <View>
                  <View className="flex-row items-center mb-1">
                    <Zap
                      color="#FFD700"
                      size={20}
                      fill="#FFD700"
                      className="mr-2"
                    />
                    <Text className="text-white font-bold text-xl italic">
                      GATEKEEPER PRO
                    </Text>
                  </View>
                  <Text className="text-white/80 text-sm mb-3 max-w-[250px]">
                    Unlock advanced analytics, ticket heatmaps, and marketing
                    tools.
                  </Text>
                </View>
                <View className="bg-white/20 px-3 py-1 rounded-lg">
                  <Text className="text-white font-bold text-xs">UPGRADE</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* SECTION 1: BUSINESS */}
          <Text className="text-gray-500 font-bold text-xs uppercase mb-3 ml-2">
            Business Tools
          </Text>
          <View className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-8">
            {/* Now these navigations will work without error */}
            <SettingsItem
              icon={<User color="white" size={20} />}
              label="Edit Host Profile"
              onPress={() => navigation.navigate("HostProfileEdit")}
            />
            <SettingsItem
              icon={<CreditCard color="white" size={20} />}
              label="Payouts & Finance"
              onPress={() => navigation.navigate("PayoutsSetup")}
            />
          </View>

          {/* SECTION 2: APP SETTINGS */}
          <Text className="text-gray-500 font-bold text-xs uppercase mb-3 ml-2">
            App Settings
          </Text>
          <View className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-8">
            <SettingsItem
              icon={<Repeat color="white" size={20} />}
              label="Switch to Party Mode"
              onPress={() => navigation.navigate("Home")}
            />
            <SettingsItem
              icon={<Bell color="white" size={20} />}
              label="Notifications"
              onPress={() => navigation.navigate("HostNotifications")} // ✅ Updated
            />
            <SettingsItem
              icon={<Lock color="white" size={20} />}
              label="Security & Login"
              onPress={() => navigation.navigate("HostSecurity")} // ✅ Updated
            />
            <SettingsItem
              icon={<HelpCircle color="white" size={20} />}
              label="Support & Help"
              onPress={() => navigation.navigate("HostSupport")} // ✅ Updated
            />
          </View>

          {/* LOG OUT */}
          <View className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <SettingsItem
              icon={<LogOut color="#ef4444" size={20} />}
              label="Log Out"
              isDestructive
              onPress={() => console.log("Log Out")}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
      <HostBottomNav />
    </View>
  );
};

export default HostSettingsScreen;
