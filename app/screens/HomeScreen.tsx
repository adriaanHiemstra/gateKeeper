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
import { rankEvents } from "../lib/feedAlgorithm";
import { trackEventInteraction } from "../lib/interactions";
import { RootStackParamList } from "../types/types";

// How many items we pull per refresh. FlatList virtualizes rendering, so a
// healthy pool here is fine — we score these client-side and show the best first.
const MAX_EVENTS = 200;
const MAX_UPDATES = 30;

import EventFeedCard from "../components/EventFeedCard";
import PostFeedCard from "../components/PostFeedCard";
import BottomNav from "../components/BottomNav";
import TopBanner from "../components/TopBanner";
import { bannerGradient } from "../styles/colours";

const { width, height } = Dimensions.get("window");
const HEADER_HEIGHT = 100;
const PANEL_WIDTH = width * 0.85;

// Feed card sizing. Fit a whole card (including the VIEW EVENT button) between
// the header and the bottom nav, leaving a small peek of the next card so the
// feed reads as a vertical pager. Every slot is the SAME height (SNAP_INTERVAL),
// which is what keeps the snap from drifting and hiding the button as you scroll.
const NAV_HEIGHT = 80; // BottomNav is h-20
const CARD_PEEK = 48; // how much of the next card peeks above the nav
const CARD_GAP = 12; // gap between cards
const CARD_HEIGHT = height - HEADER_HEIGHT - NAV_HEIGHT - CARD_PEEK - CARD_GAP;
const SNAP_INTERVAL = CARD_HEIGHT + CARD_GAP;

const HomeScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Feed state
  const [feedData, setFeedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Panel State
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<any[]>([]);
  const [selectedEventTitle, setSelectedEventTitle] = useState("");

  useFocusEffect(
    useCallback(() => {
      // Refresh whenever the screen comes into focus (e.g. switching back to this tab).
      loadFeed();
    }, []),
  );

  // Builds the personalized feed: fetch a pool of upcoming events + posts, score
  // the events for this user, then interleave a post every few events.
  const loadFeed = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const nowIso = new Date().toISOString();

      // Fetch the building blocks in parallel for speed.
      const [eventsRes, updatesRes, profileRes, friendsRes] = await Promise.all([
        supabase
          .from("events")
          .select(
            `*, profiles:host_id ( username, avatar_url ), ticket_tiers (*)`,
          )
          .eq("is_public", true)
          .gte("date", nowIso)
          .order("date", { ascending: true })
          .limit(MAX_EVENTS),
        supabase
          .from("event_updates")
          .select(
            `*, events ( title, id, date, end_date, profiles:host_id ( username, avatar_url ) )`,
          )
          .order("created_at", { ascending: false })
          .limit(MAX_UPDATES),
        user
          ? supabase.from("profiles").select("interests").eq("id", user.id).single()
          : Promise.resolve({ data: null as any }),
        // Friendships store the user on either side, so match both columns.
        user
          ? supabase
              .from("friendships")
              .select("user_id_1, user_id_2")
              .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const events = eventsRes.data || [];
      const updates = updatesRes.data || [];

      // --- Build the scoring context for the algorithm ---

      // 1. The user's interest categories (stored as a text[] of category names).
      const interests: string[] = (profileRes.data?.interests || []).map(
        (i: string) => String(i).toLowerCase(),
      );

      // 2. The user's friend ids (the "other" side of each friendship row).
      const friendIds: string[] = (friendsRes.data || [])
        .map((f: any) => (f.user_id_1 === user?.id ? f.user_id_2 : f.user_id_1))
        .filter(Boolean);

      // 3. How many friends are going to / have saved each event. Count each
      //    friend once per event even if they both saved and RSVP'd.
      const friendIntentByEvent: Record<string, number> = {};
      if (friendIds.length > 0) {
        const [goingRes, savedRes] = await Promise.all([
          supabase
            .from("event_rsvps")
            .select("event_id, user_id")
            .in("user_id", friendIds),
          supabase
            .from("saved_events")
            .select("event_id, user_id")
            .in("user_id", friendIds),
        ]);
        const friendsPerEvent: Record<string, Set<string>> = {};
        [...(goingRes.data || []), ...(savedRes.data || [])].forEach(
          (row: any) => {
            if (!row.event_id || !row.user_id) return;
            if (!friendsPerEvent[row.event_id])
              friendsPerEvent[row.event_id] = new Set();
            friendsPerEvent[row.event_id].add(row.user_id);
          },
        );
        Object.entries(friendsPerEvent).forEach(([eventId, friends]) => {
          friendIntentByEvent[eventId] = friends.size;
        });
      }

      // 4. Events the user has already opened — so we can keep the feed fresh.
      const seenEventIds = new Set<string>();
      if (user) {
        const { data: seen } = await supabase
          .from("event_interactions")
          .select("event_id")
          .eq("user_id", user.id)
          .eq("intent", "CLICKED");
        (seen || []).forEach((r: any) => r.event_id && seenEventIds.add(r.event_id));
      }

      // 5. The user's learned taste: the categories of events they've already
      // saved / RSVP'd. This is what makes "liking" an event improve the feed.
      const savedCategoryWeights: Record<string, number> = {};
      const savedEventIds = new Set<string>();
      if (user) {
        const [savedRes, goingRes] = await Promise.all([
          supabase
            .from("saved_events")
            .select("event_id, events ( categories )")
            .eq("user_id", user.id),
          supabase
            .from("event_rsvps")
            .select("event_id, events ( categories )")
            .eq("user_id", user.id),
        ]);
        const addTaste = (rows: any[], weight: number) => {
          (rows || []).forEach((row: any) => {
            if (row.event_id) savedEventIds.add(row.event_id);
            const ev = Array.isArray(row.events) ? row.events[0] : row.events;
            const cats: string[] = ev?.categories || [];
            cats.forEach((c) => {
              const key = String(c).toLowerCase();
              savedCategoryWeights[key] =
                (savedCategoryWeights[key] || 0) + weight;
            });
          });
        };
        // Actually committing ("going") is a stronger taste signal than saving.
        addTaste(savedRes.data || [], 1);
        addTaste(goingRes.data || [], 2);
      }

      // --- Rank the events by relevance to this user ---
      const rankedEvents = rankEvents(events, {
        interests,
        savedCategoryWeights,
        friendIntentByEvent,
        seenEventIds,
        savedEventIds,
      }).map((e) => ({ ...e, type: "event" }));

      // --- Keep only updates whose event hasn't ended yet ---
      const nowTime = Date.now();
      const formattedUpdates = updates
        .filter((u: any) => {
          if (!u.events) return false;
          const endDate = u.events.end_date
            ? new Date(u.events.end_date)
            : new Date(new Date(u.events.date).getTime() + 24 * 60 * 60 * 1000);
          return nowTime <= endDate.getTime();
        })
        .map((u: any) => ({ ...u, type: "post" }));

      // --- Interleave: drop a post in after every 3rd event ---
      const feed: any[] = [];
      let postIdx = 0;
      rankedEvents.forEach((event, i) => {
        feed.push(event);
        if ((i + 1) % 3 === 0 && postIdx < formattedUpdates.length) {
          feed.push(formattedUpdates[postIdx]);
          postIdx++;
        }
      });
      // Append any posts we didn't get to.
      while (postIdx < formattedUpdates.length) {
        feed.push(formattedUpdates[postIdx]);
        postIdx++;
      }

      setFeedData(feed);
    } catch (error: any) {
      console.log("Feed load error:", error?.message ?? error);
    } finally {
      setLoading(false);
    }
  };

  // --- NAVIGATION HELPER ---
  const goToEventProfile = (data: any, isPartial: boolean = false) => {
    // Log the open so the algorithm knows this event has been "seen" (freshness).
    const openedId = isPartial ? data.event_id || data.id : data.id;
    if (openedId) trackEventInteraction(openedId, "CLICKED");

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
            renderItem={({ item }) => {
              if (item.type === "post") {
                // Safely extract the nested event and profile data
                const eventObj = Array.isArray(item.events) ? item.events[0] : item.events;
                const hostProfile = Array.isArray(eventObj?.profiles) ? eventObj.profiles[0] : eventObj?.profiles;

                return (
                  <View style={{ height: SNAP_INTERVAL }}>
                    <PostFeedCard
                      cardHeight={CARD_HEIGHT}
                      id={item.id}
                      eventId={item.event_id}
                    caption={item.caption}
                    image={item.image_url}
                    eventTitle={eventObj?.title || "Unknown Event"}
                    hostName={hostProfile?.username || "Unknown Host"}
                    
                    // 🚨 FIX: Pass the raw string URL (or null) instead of the { uri: ... } object!
                    hostAvatar={hostProfile?.avatar_url || null}
                    
                    timestamp={new Date(item.created_at).toLocaleDateString()}
                    attendeesCount={0}
                    onOpenSocial={() =>
                      openPanel([], eventObj?.title || "Event")
                    }
                    onViewEvent={() => goToEventProfile(item, true)}
                    /*onOpenDiscussion={() =>
                      navigation.navigate("EventCommunity", {
                        eventId: item.event_id,
                        eventTitle: eventObj?.title || "Event",
                      })
                    }*/
                    />
                  </View>
                );
              }

              // --- B. RENDER REGULAR EVENT CARD ---
              const tiers = item.ticket_tiers || [];
              const minPrice =
                tiers.length > 0
                  ? Math.min(...tiers.map((t: any) => parseFloat(t.price) || 0))
                  : null;

              // (Keep your EventFeedCard object logic exactly the same since it works!)
              const eventAvatar = item.profiles?.avatar_url && item.profiles.avatar_url.trim() !== ""
                ? { uri: item.profiles.avatar_url }
                : require("../assets/profile-pic-1.png");

              return (
                <View style={{ height: SNAP_INTERVAL }}>
                  <EventFeedCard
                    cardHeight={CARD_HEIGHT}
                    id={item.id}
                    title={item.title}
                    hostName={item.profiles?.username || "Unknown Host"}
                    mediaItems={item.images || []}
                    minPrice={minPrice ? minPrice.toString() : undefined}
                    tags={item.categories || []}
                    hostAvatar={eventAvatar}
                    image={
                      item.banner_url
                        ? { uri: item.banner_url }
                        : require("../assets/event-placeholder.png")
                    }
                    attendeesCount={0}
                    // The card loads "which friends are going" itself (useEventFriends);
                    // it hands that list back here so the slide-in panel can show them.
                    onOpenSocial={(friends) => openPanel(friends, item.title)}
                    onPressHost={() =>
                      navigation.navigate("EventHostProfile", {
                        hostId: item.host_id,
                      })
                    }
                    onViewEvent={() => goToEventProfile(item, false)}
                  />
                </View>
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
                renderItem={({ item }) => {
                  // 🚨 FIX: Protect friend panel images against empty string urls
                  const friendAvatar = item.avatar_url && item.avatar_url.trim() !== ""
                    ? { uri: item.avatar_url }
                    : require("../assets/profile-pic-1.png");

                  return (
                    <TouchableOpacity className="flex-row items-center mb-6">
                      <Image
                        source={friendAvatar}
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
                  );
                }}
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
