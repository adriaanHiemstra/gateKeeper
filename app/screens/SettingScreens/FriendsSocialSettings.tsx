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
  Users,
  UserPlus,
  Contact,
  ShieldBan,
  ChevronRight,
} from "lucide-react-native";

// Components
import TopBanner from "../../components/TopBanner";
import BottomNav from "../../components/BottomNav";

// Styles
import { bannerGradient, fireGradient } from "../../styles/colours";
import { RootStackParamList } from "../../types/types";

const FriendsSocialSettings = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Mock State
  const [allowFriendRequests, setAllowFriendRequests] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [syncContacts, setSyncContacts] = useState(false);

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
              Friends & Social
            </Text>
          </View>

          {/* 1. DISCOVERY */}
          <Text className="text-gray-500 font-bold text-xs uppercase mb-3 ml-2">
            Discovery
          </Text>

          <OptionRow
            label="Sync Contacts"
            subtext="Find people you know on GateKeeper."
            icon={<Contact color="#FA8900" size={20} />}
            value={syncContacts}
            onValueChange={(val: boolean) => {
              setSyncContacts(val);
              if (val) navigation.navigate("GetConnected"); // Link to the screen we built!
            }}
          />

          <OptionRow
            label="Share Activity"
            subtext="Let friends see which events you are interested in."
            icon={<Users color="#FA8900" size={20} />}
            value={showActivity}
            onValueChange={setShowActivity}
          />

          {/* 2. REQUESTS */}
          <Text className="text-gray-500 font-bold text-xs uppercase mb-3 ml-2 mt-4">
            Requests
          </Text>

          <OptionRow
            label="Allow Friend Requests"
            subtext="If off, only people with your QR code can add you."
            icon={<UserPlus color="#FA8900" size={20} />}
            value={allowFriendRequests}
            onValueChange={setAllowFriendRequests}
          />

          <OptionRow
            type="link"
            label="Blocked Accounts"
            icon={<ShieldBan color="#ef4444" size={20} />}
            onPress={() => console.log("Go to Blocked List")}
          />
        </ScrollView>
      </SafeAreaView>
      <BottomNav />
    </View>
  );
};

export default FriendsSocialSettings;
