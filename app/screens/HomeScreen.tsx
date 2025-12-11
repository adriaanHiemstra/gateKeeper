import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, ChevronRight } from "lucide-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

// Backend
import { supabase } from "../lib/supabase";

// Types
import { RootStackParamList } from "../types/types";

// Components
import EventFeedCard from "../components/EventFeedCard";
import BottomNav from "../components/BottomNav";
import TopBanner from "../components/TopBanner";

// Styles
import { bannerGradient } from "../styles/colours";

const { width } = Dimensions.get("window");
const HEADER_HEIGHT = 100;
const PANEL_WIDTH = width * 0.85;

// Layout Constants
const CARD_HEIGHT = width * 1.6;
const CARD_MARGIN = 8;
const SNAP_INTERVAL = CARD_HEIGHT + CARD_MARGIN;

const HomeScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Social Panel State
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<any[]>([]);
  const [selectedEventTitle, setSelectedEventTitle] = useState("");

  // --- FETCH DATA ---
  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [])
  );

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select(
          `
          *,
          profiles:host_id (
            username,
            avatar_url
          )
        `
        )
        .order("date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      console.log("Fetch Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

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

  const panelTranslateX = useSharedValue(width);

  const openPanel = (friends: any[], title: string) => {
    // Mock friends for now
    setSelectedFriends([
      { id: "1", name: "Sarah J", img: require("../assets/profile-pic-2.png") },
      { id: "2", name: "Mike T", img: require("../assets/profile-pic-1.png") },
    ]);
    setSelectedEventTitle(title);
    setIsPanelOpen(true);
    panelTranslateX.value = withTiming(width - PANEL_WIDTH, {
      duration: 300,
      easing: Easing.out(Easing.exp),
    });
  };

  const closePanel = () => {
    panelTranslateX.value = withTiming(width, { duration: 300 });
    setTimeout(() => setIsPanelOpen(false), 300);
  };

  const panelAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: panelTranslateX.value }],
  }));

  // Helper for navigation
  const goToEventProfile = (item: any) => {
    navigation.navigate("EventProfile", {
      eventName: item.title,
      attendees: 120,
      logo: item.profiles?.avatar_url
        ? { uri: item.profiles.avatar_url }
        : require("../assets/profile-pic-1.png"),
      banner: item.banner_url
        ? { uri: item.banner_url }
        : require("../assets/event-placeholder.png"),
      images: item.images || [],
      time: new Date(item.date).toLocaleDateString(),
      location: item.location_text,
      description: item.description,
      ticketUrl: item.ticket_url,
    });
  };

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />

      <TopBanner style={headerAnimatedStyle} />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        {loading ? (
          <View className="flex-1 justify-center items-center pt-20">
            <ActivityIndicator size="large" color="#FA8900" />
          </View>
        ) : (
          <Animated.FlatList
            data={events}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingTop: 100, paddingBottom: 100 }}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            // Snap Logic
            snapToInterval={SNAP_INTERVAL}
            snapToAlignment="start"
            decelerationRate="fast"
            disableIntervalMomentum={true}
            renderItem={({ item }) => (
              <EventFeedCard
                id={item.id}
                title={item.title}
                hostName={item.profiles?.username || "Unknown Host"}
                // ✅ FIX 1: Use 'item' instead of 'event'
                // ✅ FIX 2: Add '|| []' fallback so it never crashes if empty
                mediaItems={item.images || []}
                hostAvatar={
                  item.profiles?.avatar_url
                    ? { uri: item.profiles.avatar_url }
                    : require("../assets/profile-pic-1.png")
                }
                image={
                  item.banner_url
                    ? { uri: item.banner_url }
                    : require("../assets/event-placeholder.png")
                }
                attendeesCount={12}
                // Actions
                onOpenSocial={() => openPanel([], item.title)}
                onPressHost={() => navigation.navigate("EventHostProfile")}
                onViewEvent={() => goToEventProfile(item)}
              />
            )}
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center pt-32 px-10">
                <Text className="text-white text-xl font-bold mb-2">
                  No upcoming events
                </Text>
                <Text className="text-gray-500 text-center">
                  Be the first to host one!
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>

      {/* SIDE PANEL (Social) */}
      {isPanelOpen && (
        <View style={StyleSheet.absoluteFill} className="z-50">
          <Pressable
            className="absolute inset-0 bg-black/60"
            onPress={closePanel}
          />
          <Animated.View
            style={[
              {
                width: PANEL_WIDTH,
                height: "100%",
                position: "absolute",
                right: 0,
                top: 0,
              },
              panelAnimatedStyle,
            ]}
          >
            <LinearGradient
              {...bannerGradient}
              style={StyleSheet.absoluteFill}
            />
            <SafeAreaView className="flex-1 p-6">
              <View className="flex-row justify-between items-center mb-8 mt-10">
                <View className="flex-1 pr-4">
                  <Text className="text-gray-400 text-xs uppercase font-bold tracking-widest mb-1">
                    Who's Going?
                  </Text>
                  <Text
                    className="text-white text-2xl font-bold"
                    numberOfLines={2}
                    style={{ fontFamily: "Jost-Medium" }}
                  >
                    {selectedEventTitle}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={closePanel}
                  className="bg-white/10 p-2 rounded-full"
                >
                  <X color="white" size={24} />
                </TouchableOpacity>
              </View>

              <FlatList
                data={selectedFriends}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity className="flex-row items-center mb-6">
                    <Image
                      source={item.img}
                      className="w-14 h-14 rounded-full border-2 border-orange-500 mr-4"
                    />
                    <View className="flex-1">
                      <Text className="text-white text-lg font-bold">
                        {item.name}
                      </Text>
                      <Text className="text-gray-500 text-sm">Going</Text>
                    </View>
                    <ChevronRight color="#666" size={20} />
                  </TouchableOpacity>
                )}
              />
            </SafeAreaView>
          </Animated.View>
        </View>
      )}

      <BottomNav />
    </View>
  );
};

export default HomeScreen;
