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
import {
  ArrowLeft,
  Bell,
  Users,
  Ticket,
  Zap,
  Mail,
  MessageSquare,
} from "lucide-react-native";

// Components
import TopBanner from "../../components/TopBanner";
import BottomNav from "../../components/BottomNav";

// Styles
import { bannerGradient, fireGradient } from "../../styles/colours";

const NotificationsSettings = () => {
  const navigation = useNavigation();

  // State
  const [pauseAll, setPauseAll] = useState(false);
  const [friendActivity, setFriendActivity] = useState(true);
  const [ticketAlerts, setTicketAlerts] = useState(true);
  const [eventUpdates, setEventUpdates] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  const NotificationRow = ({
    label,
    subtext,
    icon,
    value,
    onValueChange,
    disabled = false,
  }: any) => (
    <View
      className={`flex-row items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl mb-3 ${
        disabled ? "opacity-50" : "opacity-100"
      }`}
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
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: "#333", true: "#FA8900" }}
        thumbColor={"#fff"}
      />
    </View>
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
              Notifications
            </Text>
          </View>

          {/* MASTER SWITCH */}
          <View className="mb-8">
            <NotificationRow
              label="Pause All"
              subtext="Temporarily disable all push notifications."
              icon={<Bell color="#FA8900" size={20} />}
              value={pauseAll}
              onValueChange={setPauseAll}
            />
          </View>

          {/* 1. PUSH NOTIFICATIONS */}
          <Text className="text-gray-500 font-bold text-xs uppercase mb-3 ml-2">
            Push Alerts
          </Text>

          <NotificationRow
            label="Friend Activity"
            subtext="When friends buy tickets or follow you."
            icon={<Users color="#60A5FA" size={20} />}
            value={friendActivity}
            onValueChange={setFriendActivity}
            disabled={pauseAll}
          />

          <NotificationRow
            label="My Tickets"
            subtext="Reminders 24h before your event starts."
            icon={<Ticket color="#4ade80" size={20} />}
            value={ticketAlerts}
            onValueChange={setTicketAlerts}
            disabled={pauseAll}
          />

          <NotificationRow
            label="Event Updates"
            subtext="Lineup changes, time updates, and host announcements."
            icon={<Zap color="#FACC15" size={20} />}
            value={eventUpdates}
            onValueChange={setEventUpdates}
            disabled={pauseAll}
          />

          {/* 2. EMAIL & SMS */}
          <Text className="text-gray-500 font-bold text-xs uppercase mb-3 ml-2 mt-4">
            Email & SMS
          </Text>

          <NotificationRow
            label="Marketing Emails"
            subtext="Weekly newsletter with top events for you."
            icon={<Mail color="#FA8900" size={20} />}
            value={marketingEmails}
            onValueChange={setMarketingEmails}
          />
        </ScrollView>
      </SafeAreaView>
      <BottomNav />
    </View>
  );
};

export default NotificationsSettings;
