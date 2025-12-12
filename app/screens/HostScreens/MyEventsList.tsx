// app/screens/MyEventsList.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import {
  Plus,
  Calendar,
  MapPin,
  Ticket,
  MoreVertical,
} from "lucide-react-native";

// Navigation Types
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/types";

// Components & Backend
import HostTopBanner from "../../components/HostTopBanner";
import HostBottomNav from "../../components/HostBottomNav";
import { supabase } from "../../lib/supabase";

// Styles
import { bannerGradient, electricGradient } from "../../styles/colours";

const HEADER_HEIGHT = 100;

const MyEventsList = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "drafts">(
    "upcoming"
  );
  const [loading, setLoading] = useState(true);

  // Data Buckets
  const [eventsData, setEventsData] = useState<{
    upcoming: any[];
    past: any[];
    drafts: any[];
  }>({ upcoming: [], past: [], drafts: [] });

  // --- 1. FETCH DATA ON FOCUS ---
  useFocusEffect(
    useCallback(() => {
      fetchMyEvents();
    }, [])
  );

  const fetchMyEvents = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // A. Fetch Events
      const { data: events, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("host_id", user.id)
        .order("date", { ascending: false });

      if (eventError) throw eventError;

      // B. Fetch Tickets (to calc sales) & Tiers (to get price)
      // Note: We fetch ALL tickets for this host's events to calculate totals locally
      const eventIds = events.map((e) => e.id);

      const [ticketsRes, tiersRes] = await Promise.all([
        supabase
          .from("tickets")
          .select("event_id, tier_id")
          .in("event_id", eventIds)
          .eq("status", "valid"),
        supabase
          .from("ticket_tiers")
          .select("id, price, event_id")
          .in("event_id", eventIds),
      ]);

      const allTickets = ticketsRes.data || [];
      const allTiers = tiersRes.data || [];

      // C. Process & Sort Data
      const now = new Date();
      const organized = {
        upcoming: [] as any[],
        past: [] as any[],
        drafts: [] as any[],
      };

      events.forEach((event) => {
        // Filter tickets/tiers for this specific event
        const eventTickets = allTickets.filter((t) => t.event_id === event.id);

        // Calculate Revenue: Map ticket -> tier -> price
        const revenue = eventTickets.reduce((sum, ticket) => {
          const tier = allTiers.find((t) => t.id === ticket.tier_id);
          return sum + (Number(tier?.price) || 0);
        }, 0);

        const eventObj = {
          id: event.id,
          title: event.title,
          date: new Date(event.date).toLocaleDateString(),
          rawDate: new Date(event.date), // For sorting
          location: event.location_text || "Location TBA",
          sold: eventTickets.length,
          revenue: `R ${revenue.toLocaleString()}`,
          image: event.banner_url
            ? { uri: event.banner_url }
            : require("../../assets/event-placeholder.png"),
          is_public: event.is_public,
        };

        if (!event.is_public) {
          organized.drafts.push(eventObj);
        } else if (eventObj.rawDate >= now) {
          organized.upcoming.push(eventObj);
        } else {
          organized.past.push(eventObj);
        }
      });

      // Sort upcoming by soonest first
      organized.upcoming.sort(
        (a, b) => a.rawDate.getTime() - b.rawDate.getTime()
      );

      setEventsData(organized);
    } catch (error) {
      console.log("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Scroll Animation Logic ---
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

  // --- RENDER ITEM ---
  const renderEventCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      className="mb-6 bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
      onPress={() => navigation.navigate("ManageEvent", { eventId: item.id })}
    >
      {/* Event Image Banner */}
      <View className="h-32 w-full relative">
        <Image
          source={item.image}
          className="w-full h-full opacity-80"
          resizeMode="cover"
        />
        {/* Status Badge */}
        <View className="absolute top-3 right-3 flex-row gap-2">
          {activeTab === "drafts" && (
            <View className="bg-yellow-500/80 px-2 py-1 rounded-md">
              <Text className="text-black text-xs font-bold">DRAFT</Text>
            </View>
          )}
          <TouchableOpacity className="bg-black/40 p-2 rounded-full">
            <MoreVertical color="white" size={16} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Event Details */}
      <View className="p-4">
        <View className="flex-row justify-between items-start mb-3">
          {/* Title */}
          <Text
            className="text-white text-2xl font-bold flex-1 mr-2"
            style={{ fontFamily: "Jost-Medium" }}
            numberOfLines={1}
          >
            {item.title}
          </Text>

          {/* Revenue Label */}
          {activeTab !== "drafts" && (
            <View className="items-end">
              <Text className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-0.5">
                Revenue
              </Text>
              <Text className="text-green-400 font-bold text-xl leading-6">
                {item.revenue}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row items-center mb-2">
          <Calendar color="#ccc" size={14} className="mr-4" />
          <Text className="text-gray-400 text-sm ml-1">{item.date}</Text>
        </View>

        <View className="flex-row items-center mb-4">
          <MapPin color="#ccc" size={14} className="mr-4" />
          <Text className="text-gray-400 text-sm ml-1">{item.location}</Text>
        </View>

        {/* Business Stats Footer */}
        <View className="flex-row gap-3 pt-3 border-t border-white/10">
          {activeTab !== "drafts" ? (
            <>
              <View className="flex-row items-center bg-white/10 px-3 py-1 rounded-lg">
                <Ticket color="#D087FF" size={14} className="mr-3" />
                <Text className="text-white font-medium text-xs ml-2">
                  {item.sold} Sold
                </Text>
              </View>
              <View className="flex-row items-center bg-white/10 px-3 py-1 rounded-lg">
                <Text className="text-purple-300 font-medium text-xs">
                  Manage Event →
                </Text>
              </View>
            </>
          ) : (
            <Text className="text-yellow-500 font-medium text-sm">
              Action Required: Publish to go live
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-[#121212]">
      {/* Background */}
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <View className="absolute inset-0 bg-black/40" />

      {/* Animated Header */}
      <HostTopBanner style={headerAnimatedStyle} />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <View className="flex-1 pt-[120px]">
          {/* TABS SEGMENTED CONTROL */}
          <View className="flex-row bg-white/10 p-1 rounded-xl mx-6 mb-6">
            {(["upcoming", "past", "drafts"] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  className={`flex-1 py-3 rounded-lg items-center justify-center ${
                    isActive ? "bg-white/20" : "bg-transparent"
                  }`}
                >
                  <Text
                    className={`text-sm font-bold capitalize ${
                      isActive ? "text-white" : "text-gray-400"
                    }`}
                    style={{ fontFamily: "Jost-Medium" }}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* EVENTS LIST */}
          {loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#D087FF" />
            </View>
          ) : (
            <Animated.FlatList
              data={eventsData[activeTab]}
              renderItem={renderEventCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{
                paddingHorizontal: 24,
                paddingBottom: 120,
              }}
              onScroll={scrollHandler}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View className="items-center justify-center mt-10 opacity-60">
                  <Text className="text-gray-400 text-lg font-bold mb-2">
                    No events found
                  </Text>
                  <Text className="text-gray-500 text-center px-10">
                    {activeTab === "drafts"
                      ? "You don't have any unpublished events."
                      : "Tap the + button to create your first event!"}
                  </Text>
                </View>
              }
            />
          )}
        </View>

        {/* FLOATING CREATE BUTTON */}
        <TouchableOpacity
          activeOpacity={0.9}
          className="absolute bottom-28 right-6 shadow-lg shadow-purple-500/50"
          onPress={() => navigation.navigate("CreateEvent")}
        >
          <LinearGradient
            {...electricGradient}
            className="w-14 h-14 rounded-full items-center justify-center"
          >
            <Plus color="white" size={32} />
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>

      <HostBottomNav />
    </View>
  );
};

export default MyEventsList;
