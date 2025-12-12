import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from "@react-navigation/native";
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

// Components & Backend
import HostTopBanner from "../../components/HostTopBanner";
import HostBottomNav from "../../components/HostBottomNav";
import { supabase } from "../../lib/supabase";

import { bannerGradient, electricGradient } from "../../styles/colours";
import { RootStackParamList } from "../../types/types";

const HEADER_HEIGHT = 100;
type ManageEventRouteProp = RouteProp<RootStackParamList, "ManageEvent">;

const ManageEventScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ManageEventRouteProp>();
  const { eventId } = route.params || { eventId: "1" };

  const [loading, setLoading] = useState(true);
  const [eventTitle, setEventTitle] = useState("Loading...");

  // Stats
  const [stats, setStats] = useState({
    revenue: 0,
    soldCount: 0,
    totalCapacity: 0,
    percentageSold: 0,
  });
  const [tiers, setTiers] = useState<any[]>([]);

  // Animation Logic
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

  // --- OPTIMIZED DATA FETCHING ---
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [eventId])
  );

  const fetchDashboardData = async () => {
    try {
      // ⚡️ PERFORMANCE: Promise.all fetches everything in parallel
      const [eventRes, tiersRes, salesRes] = await Promise.all([
        // 1. Get Title
        supabase.from("events").select("title").eq("id", eventId).single(),

        // 2. Get Tiers (Capacity)
        supabase.from("ticket_tiers").select("*").eq("event_id", eventId),

        // 3. Get Sales (Only grab price & tier_id to save bandwidth)
        supabase
          .from("tickets")
          .select("price, tier_id")
          .eq("event_id", eventId)
          .eq("status", "valid"),
      ]);

      if (eventRes.error) throw eventRes.error;
      if (tiersRes.error) throw tiersRes.error;
      if (salesRes.error) throw salesRes.error;

      setEventTitle(eventRes.data.title);

      // Process Data
      const ticketData = salesRes.data || [];
      const tierData = tiersRes.data || [];

      let totalRev = 0;
      let totalCap = 0;

      // Calculate Revenue efficiently
      ticketData.forEach((t) => (totalRev += Number(t.price) || 0));

      // Map Tiers with their specific sold counts
      const processedTiers = tierData.map((tier) => {
        const soldCount = ticketData.filter(
          (t) => t.tier_id === tier.id
        ).length;
        totalCap += tier.quantity_total;

        return {
          ...tier,
          sold: soldCount,
          progress:
            tier.quantity_total > 0
              ? (soldCount / tier.quantity_total) * 100
              : 0,
          color: "#D087FF",
        };
      });

      setStats({
        revenue: totalRev,
        soldCount: ticketData.length,
        totalCapacity: totalCap,
        percentageSold:
          totalCap > 0 ? Math.round((ticketData.length / totalCap) * 100) : 0,
      });

      setTiers(processedTiers);
    } catch (error) {
      console.log("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

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
          {/* HEADER */}
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
                numberOfLines={1}
              >
                {eventTitle}
              </Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#D087FF"
              className="mb-10 mt-10"
            />
          ) : (
            <>
              {/* 1. HIGH LEVEL STATS */}
              <View className="flex-row gap-4 mb-8">
                <LinearGradient
                  {...electricGradient}
                  className="flex-1 rounded-2xl p-5 shadow-lg shadow-purple-900/50"
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <CreditCard color="white" size={20} opacity={0.8} />
                    <Text className="text-green-300 font-bold text-xs">
                      +15%
                    </Text>
                  </View>
                  <Text className="text-white/80 text-sm font-medium">
                    Total Sales
                  </Text>
                  <Text className="text-white text-2xl font-bold">
                    R {stats.revenue.toLocaleString()}
                  </Text>
                </LinearGradient>

                <View className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-5">
                  <View className="flex-row justify-between items-start mb-2">
                    <TrendingUp color="#D087FF" size={20} />
                    <Text className="text-white/60 text-xs">
                      {stats.percentageSold}% Cap
                    </Text>
                  </View>
                  <Text className="text-gray-400 text-sm font-medium">
                    Tickets Sold
                  </Text>
                  <Text className="text-white text-2xl font-bold">
                    {stats.soldCount}{" "}
                    <Text className="text-gray-500 text-sm">
                      / {stats.totalCapacity}
                    </Text>
                  </Text>
                </View>
              </View>

              {/* 2. ACTIONS */}
              <Text className="text-white text-xl font-bold mb-4">
                Management
              </Text>
              <View className="flex-row gap-4 mb-4">
                <ManagementAction
                  icon={<Edit3 color="white" size={24} />}
                  label="Edit Details"
                  onPress={() => navigation.navigate("EditEvent", { eventId })}
                />
                <ManagementAction
                  icon={<ImagePlus color="white" size={24} />}
                  label="Post Content"
                  onPress={() =>
                    navigation.navigate("PostContent", { eventId })
                  }
                />
              </View>
              <View className="flex-row gap-4 mb-4">
                <ManagementAction
                  icon={<Users color="white" size={24} />}
                  label="Guest List"
                  onPress={() => navigation.navigate("GuestList")}
                />
                <ManagementAction
                  icon={<Shield color="white" size={24} />}
                  label="Team Access"
                  onPress={() => navigation.navigate("TeamAccess")}
                />
              </View>
              <View className="flex-row gap-4 mb-8">
                <ManagementAction
                  icon={<Share2 color="white" size={24} />}
                  label="Promote"
                  onPress={() =>
                    navigation.navigate("PromoteEvent", { eventId })
                  }
                />
                <ManagementAction
                  icon={<MessageCircle color="white" size={24} />}
                  label="Reviews"
                  onPress={() =>
                    navigation.navigate("VenueReviews", {
                      venueId: "1",
                      venueName: eventTitle,
                    })
                  }
                />
              </View>

              {/* 3. TICKET BREAKDOWN */}
              <Text className="text-white text-xl font-bold mb-4">
                Ticket Breakdown
              </Text>
              {tiers.length === 0 ? (
                <Text className="text-gray-500 italic">
                  No tickets configured.
                </Text>
              ) : (
                <View className="bg-white/5 rounded-2xl border border-white/5 p-4">
                  {tiers.map((tier, index) => (
                    <View
                      key={index}
                      className={`mb-5 ${
                        index === tiers.length - 1 ? "mb-0" : ""
                      }`}
                    >
                      <View className="flex-row justify-between mb-2">
                        <Text className="text-white font-medium text-lg">
                          {tier.name}
                        </Text>
                        <Text className="text-white font-bold">
                          {tier.sold}{" "}
                          <Text className="text-gray-500 text-sm">
                            / {tier.quantity_total}
                          </Text>
                        </Text>
                      </View>
                      <View className="h-3 bg-black/40 rounded-full overflow-hidden flex-row items-center">
                        <View
                          style={{
                            width: `${tier.progress}%`,
                            backgroundColor: tier.color,
                          }}
                          className="h-full rounded-full"
                        />
                      </View>
                      <View className="flex-row justify-between mt-1">
                        <Text className="text-gray-500 text-xs">
                          Price: R {tier.price}
                        </Text>
                        <Text className="text-gray-500 text-xs">
                          {Math.round(tier.progress)}% Sold
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </Animated.ScrollView>
      </SafeAreaView>
      <HostBottomNav />
    </View>
  );
};

export default ManageEventScreen;
