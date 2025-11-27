import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowLeft,
  Calendar,
  Download,
  Trash2,
  Database,
  ChevronRight,
  RefreshCw,
} from "lucide-react-native";

// Components
import TopBanner from "../../components/TopBanner";
import BottomNav from "../../components/BottomNav";

// Styles
import { bannerGradient, fireGradient } from "../../styles/colours";

const DataSyncSettings = () => {
  const navigation = useNavigation();

  // State
  const [autoSync, setAutoSync] = useState(true);
  const [smartReminders, setSmartReminders] = useState(true);

  const handleClearCache = () => {
    Alert.alert(
      "Clear Cache",
      "This will free up space but images may take longer to load next time.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", onPress: () => console.log("Cache Cleared") },
      ]
    );
  };

  const handleDownloadData = () => {
    Alert.alert(
      "Request Data",
      "We will email a copy of your data to you within 24 hours."
    );
  };

  const OptionRow = ({
    label,
    subtext,
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
        <View className="flex-1">
          <Text
            className="text-white font-bold text-lg"
            style={{ fontFamily: "Jost-Medium" }}
          >
            {label}
          </Text>
          {subtext && (
            <Text className="text-gray-400 text-xs leading-4 mt-1">
              {subtext}
            </Text>
          )}
        </View>
      </View>

      {type === "toggle" ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: "#333", true: "#FA8900" }}
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
            <Text
              className="text-white text-3xl font-bold"
              style={{ fontFamily: "Jost-Medium" }}
            >
              Data & Sync
            </Text>
          </View>

          {/* 1. CALENDAR */}
          <Text className="text-gray-500 font-bold text-xs uppercase mb-3 ml-2">
            Calendar Integration
          </Text>

          <OptionRow
            label="Sync Events"
            subtext="Automatically add tickets to your phone's calendar."
            icon={<Calendar color="#FA8900" size={20} />}
            value={autoSync}
            onValueChange={setAutoSync}
          />

          <OptionRow
            label="Smart Reminders"
            subtext="Alerts for when to leave based on traffic."
            icon={<RefreshCw color="#FA8900" size={20} />}
            value={smartReminders}
            onValueChange={setSmartReminders}
          />

          {/* 2. DATA MANAGEMENT */}
          <Text className="text-gray-500 font-bold text-xs uppercase mb-3 ml-2 mt-4">
            Storage & Privacy
          </Text>

          <OptionRow
            type="link"
            label="Download My Data"
            subtext="Get a copy of your history and preferences."
            icon={<Download color="#60A5FA" size={20} />}
            onPress={handleDownloadData}
          />

          <OptionRow
            type="link"
            label="Clear Cache"
            subtext="Free up space on your device (124 MB)."
            icon={<Trash2 color="#ef4444" size={20} />}
            onPress={handleClearCache}
          />
        </ScrollView>
      </SafeAreaView>
      <BottomNav />
    </View>
  );
};

export default DataSyncSettings;
