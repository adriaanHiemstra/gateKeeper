// app/screens/HomeScreen.tsx
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

import { supabase } from "../lib/supabase";
import { RootStackParamList } from "../types/types";

import EventFeedCard from "../components/EventFeedCard";
import PostFeedCard from "../components/PostFeedCard";
import BottomNav from "../components/BottomNav";
import TopBanner from "../components/TopBanner";
import { bannerGradient } from "../styles/colours";

const { width } = Dimensions.get("window");
const HEADER_HEIGHT = 100;
const PANEL_WIDTH = width * 0.85;
const SNAP_INTERVAL = width * 1.6 + 8;

const HomeScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // 🔥 PAGINATION STATE
  const [feedData, setFeedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Panel State
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<any[]>([]);
  const [selectedEventTitle, setSelectedEventTitle] = useState("");

  useFocusEffect(
    useCallback(() => {
      // Whenever the screen is focused (e.g., coming from another tab), refresh from the top
      fetchFeed(0);
    }, []),
  );

  // --- 🔥 UPDATED FETCH WITH PAGINATION ---
  const fetchFeed = async (pageIndex: number = 0) => {
    // Prevent fetching if we are already fetching or have run out of data
    if (pageIndex > 0 && (loadingMore || !hasMore)) return;

    if (pageIndex === 0) {
      setLoading(true);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const today = new Date().toISOString();

      const EVENT_LIMIT = 20;
      const POST_LIMIT = 10;
      const eventOffset = pageIndex * EVENT_LIMIT;
      const postOffset = pageIndex * POST_LIMIT;

      let eventsData: any[] = [];

      // --- 1. ALGORITHM FEED ---
      if (user) {
        const { data: algoData, error: algoError } = await supabase.rpc(
          "get_recommended_feed",
          {
            req_user_id: user.id,
            p_offset: eventOffset,
            p_limit: EVENT_LIMIT,
          },
        ).select(`
            *,
            profiles:host_id ( username, avatar_url ),
            ticket_tiers (*) 
          `);

        if (!algoError && algoData && algoData.length > 0) {
          eventsData = algoData;
        }
      }

      // --- 2. COLD START FALLBACK ---
      if (eventsData.length === 0) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("events")
          .select(
            `
            *,
            profiles:host_id ( username, avatar_url ),
            ticket_tiers (*) 
          `,
          )
          .gte("date", today)
          .eq("is_public", true)
          .order("date", { ascending: true })
          .range(eventOffset, eventOffset + EVENT_LIMIT - 1); // Range handles pagination for standard queries

        if (!fallbackError) eventsData = fallbackData || [];
      }

      // --- 3. FETCH COMMUNITY UPDATES ---
      const { data: updatesData } = await supabase
        .from("event_updates")
        .select(`*, events ( title, id )`)
        .order("created_at", { ascending: false })
        .range(postOffset, postOffset + POST_LIMIT - 1);

      // --- 4. END OF FEED CHECK ---
      if (
        eventsData.length === 0 &&
        (!updatesData || updatesData.length === 0)
      ) {
        setHasMore(false);
      }

      const formattedEvents = eventsData.map((e) => ({ ...e, type: "event" }));
      const formattedUpdates = (updatesData || []).map((u) => ({
        ...u,
        type: "post",
      }));

      // --- 5. THE INTERLEAVE STRATEGY (For this specific chunk) ---
      const newBatch: any[] = [];
      let eventIdx = 0;
      let postIdx = 0;

      while (
        eventIdx < formattedEvents.length ||
        postIdx < formattedUpdates.length
      ) {
        if (postIdx < formattedUpdates.length) {
          newBatch.push(formattedUpdates[postIdx]);
          postIdx++;
        }
        if (eventIdx < formattedEvents.length) {
          newBatch.push(formattedEvents[eventIdx]);
          eventIdx++;
        }
        if (eventIdx < formattedEvents.length) {
          newBatch.push(formattedEvents[eventIdx]);
          eventIdx++;
        }
      }

      // --- 6. GLUE TO FEED ---
      if (pageIndex === 0) {
        setFeedData(newBatch);
      } else {
        setFeedData((prev) => [...prev, ...newBatch]);
      }

      setPage(pageIndex);
    } catch (error: any) {
      console.log("Fetch Error:", error.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // --- NAVIGATION HELPER ---
  const goToEventProfile = (data: any, isPartial: boolean = false) => {
    if (isPartial) {
      navigation.navigate("EventProfile", {
        eventId: data.event_id || data.id,
        eventName: data.events?.title || "Loading...",
        attendees: 0,
        logo: require("../assets/profile-pic-1.png"),
        banner: require("../assets/event-placeholder.png"),
      });
    } else {
      navigation.navigate("EventProfile", {
        eventId: data.id,
        eventName: data.title,
        attendees: 120,
        logo: data.profiles?.avatar_url
          ? { uri: data.profiles.avatar_url }
          : require("../assets/profile-pic-1.png"),
        banner: data.banner_url
          ? { uri: data.banner_url }
          : require("../assets/event-placeholder.png"),
        images: data.images || [],
        time: new Date(data.date).toLocaleDateString(),
        location: data.location_text,
        description: data.description,
        ticketUrl: data.ticket_url,
        tags: data.categories || data.tags || [],
        ticket_tiers: data.ticket_tiers || [],
      });
    }
  };

  // --- ANIMATIONS ---
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

  const openPanel = (friendsData: any[], title: string) => {
    setSelectedFriends(friendsData);
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
            data={feedData}
            keyExtractor={(item, index) => item.id + item.type + index}
            contentContainerStyle={{ paddingTop: 100, paddingBottom: 100 }}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            snapToInterval={SNAP_INTERVAL}
            snapToAlignment="start"
            decelerationRate="fast"
            disableIntervalMomentum={true}
            // 🔥 PAGINATION TRIGGERS HERE
            onEndReached={() => {
              if (hasMore) fetchFeed(page + 1);
            }}
            onEndReachedThreshold={0.5} // Trigger when 50% through the last card
            ListFooterComponent={
              loadingMore ? (
                <View className="py-10 items-center justify-center">
                  <ActivityIndicator size="large" color="#FA8900" />
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              if (item.type === "post") {
                return (
                  <PostFeedCard
                    id={item.id}
                    eventId={item.event_id}
                    caption={item.caption}
                    image={item.image_url}
                    eventTitle={item.events?.title || "Unknown Event"}
                    hostName={"Event Update"}
                    hostAvatar={null}
                    timestamp={new Date(item.created_at).toLocaleDateString()}
                    attendeesCount={12}
                    onOpenSocial={() =>
                      openPanel([], item.events?.title || "Event")
                    }
                    onViewEvent={() => goToEventProfile(item, true)}
                    onOpenDiscussion={() =>
                      navigation.navigate("EventCommunity", {
                        eventId: item.event_id,
                        eventTitle: item.events?.title || "Event",
                      })
                    }
                  />
                );
              }

              const tiers = item.ticket_tiers || [];
              const minPrice =
                tiers.length > 0
                  ? Math.min(...tiers.map((t: any) => parseFloat(t.price) || 0))
                  : null;

              return (
                <EventFeedCard
                  id={item.id}
                  title={item.title}
                  hostName={item.profiles?.username || "Unknown Host"}
                  mediaItems={item.images || []}
                  minPrice={minPrice ? minPrice.toString() : undefined}
                  tags={item.categories || item.tags || []}
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
                  onOpenSocial={(friends) => openPanel(friends, item.title)}
                  onPressHost={() =>
                    navigation.navigate("EventHostProfile", {
                      hostId: item.host_id,
                    })
                  }
                  onViewEvent={() => goToEventProfile(item, false)}
                />
              );
            }}
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center pt-32 px-10">
                <Text className="text-white text-xl font-bold mb-2">
                  Feed is empty
                </Text>
                <Text className="text-gray-500 text-center">
                  Follow some hosts to see updates!
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>

      {/* SIDE PANEL */}
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
                keyExtractor={(item) =>
                  item.friend_id || Math.random().toString()
                }
                ListEmptyComponent={
                  <Text className="text-gray-500 text-center mt-10">
                    None of your crew has jumped on this yet.
                  </Text>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity className="flex-row items-center mb-6">
                    <Image
                      source={
                        item.avatar_url
                          ? { uri: item.avatar_url }
                          : require("../assets/profile-pic-1.png")
                      }
                      className="w-14 h-14 rounded-full border-2 border-orange-500 mr-4"
                    />
                    <View className="flex-1">
                      <Text className="text-white text-lg font-bold">
                        {item.username}
                      </Text>
                      <Text className="text-gray-400 text-sm">
                        {item.intent === "GOING" ? "Going 🚀" : "Interested"}
                      </Text>
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
