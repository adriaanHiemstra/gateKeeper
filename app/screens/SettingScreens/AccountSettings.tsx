import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ChevronRight,
  User,
  Lock,
  Bell,
  CreditCard,
  HelpCircle,
  LogOut,
  MapPin,
  Users,
  Calendar,
  Shield,
  Ticket,
  Heart,
  Repeat,
} from "lucide-react-native";

// Components
import TopBanner from "../../components/TopBanner";
import BottomNav from "../../components/BottomNav";

// Styles
import { bannerGradient } from "../../styles/colours";
import { RootStackParamList } from "../../types/types";

const AccountSettings = () => {
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
            isDestructive ? "bg-red-500/10" : "bg-orange-500/10"
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

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => navigation.navigate("Login"),
      },
    ]);
  };

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
          {/* HEADER (No Back Button) */}
          <View className="mb-8 mt-2">
            <Text
              className="text-white text-4xl font-bold"
              style={{ fontFamily: "Jost-Medium" }}
            >
              Account
            </Text>
            <Text className="text-gray-400 text-base mt-1">
              Manage your activity & preferences
            </Text>
          </View>

          {/* SECTION 1: MY ACTIVITY (Replaces Profile Dashboard) */}
          <Text className="text-gray-500 font-bold text-xs uppercase mb-3 ml-2">
            My Activity
          </Text>
          <View className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-8">
            <SettingsItem
              icon={<Ticket color="#FA8900" size={20} />}
              label="My Tickets"
              onPress={() => navigation.navigate("MyTicketsScreen")}
            />
            <SettingsItem
              icon={<Heart color="#FA8900" size={20} />}
              label="Wishlist"
              onPress={() => navigation.navigate("Wishlist")}
            />
            <SettingsItem
              icon={<Users color="#FA8900" size={20} />}
              label="Social Circle"
              onPress={() => navigation.navigate("FriendsSocialCircle")}
            />
          </View>

          {/* SECTION 2: ACCOUNT */}
          <Text className="text-gray-500 font-bold text-xs uppercase mb-3 ml-2">
            Account Details
          </Text>
          <View className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-8">
            <SettingsItem
              icon={<User color="#FA8900" size={20} />}
              label="Edit Profile"
              onPress={() => navigation.navigate("EditUserProfile")}
            />
            <SettingsItem
              icon={<Shield color="#FA8900" size={20} />}
              label="Privacy & Security"
              onPress={() => navigation.navigate("PrivacySecuritySettings")}
            />
            <SettingsItem
              icon={<CreditCard color="#FA8900" size={20} />}
              label="Payment Methods"
              onPress={() => navigation.navigate("TicketsPaymentsSettings")}
            />
          </View>

          {/* SECTION 3: PREFERENCES */}
          <Text className="text-gray-500 font-bold text-xs uppercase mb-3 ml-2">
            Preferences
          </Text>
          <View className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-8">
            <SettingsItem
              icon={<Bell color="#FA8900" size={20} />}
              label="Notifications"
              onPress={() => navigation.navigate("NotificationsSettings")}
            />
            <SettingsItem
              icon={<Users color="#FA8900" size={20} />}
              label="Friends Settings"
              onPress={() => navigation.navigate("FriendsSocialSettings")}
            />
            <SettingsItem
              icon={<MapPin color="#FA8900" size={20} />}
              label="Location & Region"
              onPress={() => navigation.navigate("LocationSettings")}
            />
            <SettingsItem
              icon={<Calendar color="#FA8900" size={20} />}
              label="Calendar Sync"
              onPress={() => navigation.navigate("DataSyncSettings")}
            />
          </View>

          {/* SECTION 4: HOST MODE */}
          <Text className="text-gray-500 font-bold text-xs uppercase mb-3 ml-2">
            Organizer
          </Text>
          <View className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-8">
            <SettingsItem
              icon={<Repeat color="#D087FF" size={20} />}
              label="Switch to Host Mode"
              onPress={() => navigation.navigate("HostDashboard")}
            />
          </View>

          {/* SECTION 5: SUPPORT */}
          <Text className="text-gray-500 font-bold text-xs uppercase mb-3 ml-2">
            Support
          </Text>
          <View className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-8">
            <SettingsItem
              icon={<HelpCircle color="#FA8900" size={20} />}
              label="Help & Feedback"
              onPress={() => navigation.navigate("SupportFeedbackSettings")}
            />
          </View>

          {/* LOG OUT */}
          <View className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <SettingsItem
              icon={<LogOut color="#ef4444" size={20} />}
              label="Log Out"
              isDestructive
              onPress={handleLogout}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
      <BottomNav />
    </View>
  );
};

export default AccountSettings;
