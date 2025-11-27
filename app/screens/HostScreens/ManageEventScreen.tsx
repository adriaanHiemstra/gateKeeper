import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import {
  Edit3,
  ImagePlus,
  Users,
  Share2,
  ArrowLeft,
  TrendingUp,
  CreditCard,
  Shield,
  MessageCircle,
} from "lucide-react-native";

// Components
import HostTopBanner from "../../components/HostTopBanner";
import HostBottomNav from "../../components/HostBottomNav";

// Styles
import { bannerGradient, electricGradient } from "../../styles/colours";

// Types
import { RootStackParamList } from "../../types/types";

const HEADER_HEIGHT = 100;

type ManageEventRouteProp = RouteProp<RootStackParamList, "ManageEvent">;

const ManageEventScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ManageEventRouteProp>();
  const { eventId } = route.params || { eventId: "1" };

  // --- Animation Logic ---
  const translateY = useSharedValue(0);
  const lastContentOffset = useSharedValue(0);
  const isHidden = useSharedValue(false);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const currentY = event.contentOffset.y;
      const diff = currentY - lastContentOffset.value;
      if (diff > 5 && currentY > 50 && !isHidden.value) {
        isHidden.value = true;
        translateY.value = withTiming(-HEADER_HEIGHT, {
          duration: 300,
          easing: Easing.inOut(Easing.ease),
        });
      } else if (diff < -5 && isHidden.value) {
        isHidden.value = false;
        translateY.value = withTiming(0, {
          duration: 300,
          easing: Easing.inOut(Easing.ease),
        });
      }
      lastContentOffset.value = currentY;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Helper: Action Button Component
  // Removed complex margins since we are using explicit rows now
  const ManagementAction = ({ icon, label, onPress }: any) => (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white/10 border border-white/5 p-4 rounded-2xl items-center justify-center flex-1"
    >
      <View className="mb-3 bg-white/10 p-3 rounded-full">{icon}</View>
      <Text
        className="text-white font-bold text-base"
        style={{ fontFamily: "Jost-Medium" }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Mock Data for Ticket Tiers
  const ticketTiers = [
    {
      name: "Early Bird",
      sold: 200,
      total: 200,
      price: "R 150",
      color: "#4ADE80",
    },
    {
      name: "Phase 1",
      sold: 450,
      total: 500,
      price: "R 250",
      color: "#FACC15",
    },
    { name: "VIP", sold: 45, total: 100, price: "R 500", color: "#D087FF" },
  ];

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <View className="absolute inset-0 bg-black/40" />

      <HostTopBanner style={headerAnimatedStyle} />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <Animated.ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: HEADER_HEIGHT + 20,
            paddingBottom: 120,
          }}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          {/* HEADER: Back & Title */}
          <View className="flex-row items-center mb-6">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mr-4 bg-white/10 p-2 rounded-full"
            >
              <ArrowLeft color="white" size={24} />
            </TouchableOpacity>
            <View>
              <Text className="text-white/60 text-sm uppercase font-bold tracking-widest">
                Managing Event
              </Text>
              <Text
                className="text-white text-3xl font-bold"
                style={{ fontFamily: "Jost-Medium" }}
              >
                Summer Slam 2025
              </Text>
            </View>
          </View>

          {/* 1. HIGH LEVEL STATS */}
          <View className="flex-row gap-4 mb-8">
            {/* Revenue Card */}
            <LinearGradient
              {...electricGradient}
              className="flex-1 rounded-2xl p-5 shadow-lg shadow-purple-900/50"
            >
              <View className="flex-row justify-between items-start mb-2">
                <CreditCard color="white" size={20} opacity={0.8} />
                <Text className="text-green-300 font-bold text-xs">+15%</Text>
              </View>
              <Text className="text-white/80 text-sm font-medium">
                Total Sales
              </Text>
              <Text className="text-white text-2xl font-bold">R 45,200</Text>
            </LinearGradient>

            {/* Tickets Card */}
            <View className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-5">
              <View className="flex-row justify-between items-start mb-2">
                <TrendingUp color="#D087FF" size={20} />
                <Text className="text-white/60 text-xs">65% Cap</Text>
              </View>
              <Text className="text-gray-400 text-sm font-medium">
                Tickets Sold
              </Text>
              <Text className="text-white text-2xl font-bold">
                695 <Text className="text-gray-500 text-sm">/ 1000</Text>
              </Text>
            </View>
          </View>

          {/* 2. ACTIONS GRID (Fixed Layout) */}
          <Text className="text-white text-xl font-bold mb-4">Management</Text>

          {/* 👇 FIX: Row 1 */}
          <View className="flex-row gap-4 mb-4">
            <ManagementAction
              icon={<Edit3 color="white" size={24} />}
              label="Edit Details"
              onPress={() =>
                navigation.navigate("EditEvent", { eventId: eventId })
              }
            />
            <ManagementAction
              icon={<ImagePlus color="white" size={24} />}
              label="Post Content"
              onPress={() => navigation.navigate("PostContent", { eventId })}
            />
          </View>

          {/* 👇 FIX: Row 2 (Explicit separation guarantees no overlap) */}
          <View className="flex-row gap-4 mb-4">
            <ManagementAction
              icon={<Users color="white" size={24} />}
              label="Guest List"
              onPress={() => navigation.navigate("GuestList")}
            />

            <ManagementAction
              icon={<Shield color="white" size={24} />} // Changed icon to Shield
              label="Team Access"
              // 👇 LINK TO THE NEW SCREEN
              onPress={() => navigation.navigate("TeamAccess")}
            />
          </View>

          <View className="flex-row gap-4 mb-8">
            <ManagementAction
              icon={<Share2 color="white" size={24} />}
              label="Promote"
              onPress={() => navigation.navigate("PromoteEvent", { eventId })}
            />
            <ManagementAction
              icon={<MessageCircle color="white" size={24} />}
              label="Reviews"
              onPress={() =>
                navigation.navigate("EventReviews", { eventId: eventId })
              }
            />
            {/* Empty slot for future features */}
          </View>

          {/* 3. TICKET BREAKDOWN */}
          <Text className="text-white text-xl font-bold mb-4">
            Ticket Breakdown
          </Text>
          <View className="bg-white/5 rounded-2xl border border-white/5 p-4">
            {ticketTiers.map((tier, index) => {
              const progress = (tier.sold / tier.total) * 100;
              return (
                <View
                  key={index}
                  className={`mb-5 ${
                    index === ticketTiers.length - 1 ? "mb-0" : ""
                  }`}
                >
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-white font-medium text-lg">
                      {tier.name}
                    </Text>
                    <Text className="text-white font-bold">
                      {tier.sold}{" "}
                      <Text className="text-gray-500 text-sm">
                        / {tier.total}
                      </Text>
                    </Text>
                  </View>

                  {/* Progress Bar Background */}
                  <View className="h-3 bg-black/40 rounded-full overflow-hidden flex-row items-center">
                    <View
                      style={{
                        width: `${progress}%`,
                        backgroundColor: tier.color,
                      }}
                      className="h-full rounded-full"
                    />
                  </View>
                  <View className="flex-row justify-between mt-1">
                    <Text className="text-gray-500 text-xs">
                      Price: {tier.price}
                    </Text>
                    <Text className="text-gray-500 text-xs">
                      {Math.round(progress)}% Sold
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.ScrollView>
      </SafeAreaView>

      <HostBottomNav />
    </View>
  );
};

export default ManageEventScreen;
