import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/types";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import {
  Plus,
  QrCode,
  BarChart3,
  Settings,
  Ticket,
  Users,
  Bell,
  CreditCard,
} from "lucide-react-native";

// Components
import HostTopBanner from "../../components/HostTopBanner"; // Import the new banner
import HostBottomNav from "../../components/HostBottomNav";

// Styles
import { bannerGradient, electricGradient } from "../../styles/colours";

const { width } = Dimensions.get("window");
const HEADER_HEIGHT = 100; // Matches HostTopBanner height

const HostDashboard = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // --- Animation Logic ---
  const translateY = useSharedValue(0);
  const lastContentOffset = useSharedValue(0);
  const isHidden = useSharedValue(false);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const currentY = event.contentOffset.y;
      const diff = currentY - lastContentOffset.value;

      // If scrolling DOWN (diff > 0) and past the top (currentY > 50)
      if (diff > 5 && currentY > 50 && !isHidden.value) {
        isHidden.value = true;
        translateY.value = withTiming(-HEADER_HEIGHT, {
          duration: 300,
          easing: Easing.inOut(Easing.ease),
        });
      }
      // If scrolling UP (diff < -5)
      else if (diff < -5 && isHidden.value) {
        isHidden.value = false;
        translateY.value = withTiming(0, {
          duration: 300,
          easing: Easing.inOut(Easing.ease),
        });
      }

      lastContentOffset.value = currentY;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });
  // -----------------------

  // Placeholder Data
  const totalRevenue = "R 45,200";
  const ticketsSold = 1240;

  const recentActivity = [
    {
      id: "1",
      action: "Ticket Sold",
      details: "1x VIP - Summer Slam",
      time: "2m ago",
    },
    {
      id: "2",
      action: "Ticket Sold",
      details: "4x General - Summer Slam",
      time: "5m ago",
    },
    {
      id: "3",
      action: "New Follower",
      details: "Sarah Jenkins followed you",
      time: "12m ago",
    },
    {
      id: "4",
      action: "Comment",
      details: 'Mike: "Can\'t wait for this!"',
      time: "1h ago",
    },
    {
      id: "5",
      action: "Ticket Sold",
      details: "2x VVIP - Summer Slam",
      time: "2h ago",
    },
    {
      id: "6",
      action: "Ticket Sold",
      details: "1x General - Summer Slam",
      time: "3h ago",
    },
    {
      id: "7",
      action: "Ticket Sold",
      details: "5x General - Summer Slam",
      time: "5h ago",
    },
  ];

  const ActionButton = ({ icon, label, onPress }: any) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="bg-white/10 border border-white/5 rounded-2xl p-4 items-center justify-center mb-4"
      style={{ width: (width - 64) / 2, height: 110 }}
    >
      <View className="bg-white/10 p-3 rounded-full mb-3">{icon}</View>
      <Text
        className="text-white font-bold text-base"
        style={{ fontFamily: "Jost-Medium" }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-[#121212]">
      {/* Background */}
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <View className="absolute inset-0 bg-black/40" />

      {/* ✅ ANIMATED TOP BANNER */}
      <HostTopBanner style={headerAnimatedStyle} />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        {/* Using Animated.ScrollView to pass events to Reanimated */}
        <Animated.ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: HEADER_HEIGHT + 20, // Push content down to start visible
            paddingBottom: 120,
          }}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          {/* DASHBOARD HEADER */}
          <View className="flex-row justify-between items-center mb-8">
            <View>
              <Text
                className="text-gray-400 text-lg font-medium"
                style={{ fontFamily: "Jost-Medium" }}
              >
                Overview
              </Text>
              <Text
                className="text-white text-3xl font-bold"
                style={{ fontFamily: "Jost-Medium" }}
              >
                Performance
              </Text>
            </View>
            <TouchableOpacity
              className="bg-white/10 p-3 rounded-full"
              onPress={() => navigation.navigate("HostSettings")}
            >
              <Settings color="white" size={24} />
            </TouchableOpacity>
          </View>

          {/* MAIN STATS CARD */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate("EventStats")}
          >
            <LinearGradient
              {...electricGradient}
              className="w-full rounded-3xl p-6 mb-8 shadow-lg shadow-purple-900/50"
            >
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-white/80 font-medium text-lg">
                  Total Revenue
                </Text>
                <BarChart3 color="white" size={24} opacity={0.8} />
              </View>
              <Text className="text-white text-5xl font-bold mb-4">
                {totalRevenue}
              </Text>

              <View className="flex-row gap-4">
                <View className="bg-black/20 rounded-lg px-3 py-2">
                  <Text className="text-white font-bold">
                    {ticketsSold} Tickets Sold
                  </Text>
                </View>
                <View className="bg-black/20 rounded-lg px-3 py-2">
                  <Text className="text-green-300 font-bold">
                    +12% this week
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* QUICK ACTIONS GRID */}
          <Text className="text-white text-xl font-bold mb-4">
            Quick Actions
          </Text>
          <View className="flex-row flex-wrap justify-between">
            <ActionButton
              icon={<Plus color="#D087FF" size={28} />}
              label="Create Event"
              onPress={() => navigation.navigate("CreateEvent")}
            />
            <ActionButton
              icon={<QrCode color="#D087FF" size={28} />}
              label="Scan Tickets"
              onPress={() => console.log("Scan Tickets")}
            />
            <ActionButton
              icon={<Ticket color="#D087FF" size={28} />}
              label="My Events"
              onPress={() => navigation.navigate("MyEventsList")}
            />
            <ActionButton
              icon={<CreditCard color="#D087FF" size={28} />}
              label="Payouts"
              onPress={() => navigation.navigate("PayoutsSetup")}
            />
          </View>

          {/* RECENT ACTIVITY FEED */}
          <Text className="text-white text-xl font-bold mb-4 mt-4">
            Live Feed
          </Text>
          <View className="bg-white/5 rounded-2xl border border-white/5 p-4 mb-8">
            {recentActivity.map((item, index) => (
              <View
                key={item.id}
                className={`flex-row items-center py-3 ${
                  index !== recentActivity.length - 1
                    ? "border-b border-white/10"
                    : ""
                }`}
              >
                <View className="bg-purple-500/20 p-2 rounded-full mr-4">
                  <Bell color="#D087FF" size={16} />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-base">
                    {item.action}
                  </Text>
                  <Text className="text-gray-400 text-sm">{item.details}</Text>
                </View>
                <Text className="text-gray-500 text-xs">{item.time}</Text>
              </View>
            ))}
          </View>
        </Animated.ScrollView>
      </SafeAreaView>

      <HostBottomNav />
    </View>
  );
};

export default HostDashboard;
