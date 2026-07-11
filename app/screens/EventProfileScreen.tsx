// app/screens/EventProfileScreen.tsx
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Share,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Modal,
  AppState,
  FlatList,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  RouteProp,
  useRoute,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Ticket,
  Heart,
  Share2,
  X,
  Volume2,
  VolumeX,
  ChevronRight,
} from "lucide-react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Video, ResizeMode, Audio } from "expo-av";
import * as Haptics from "expo-haptics";

// Components & Backend
import TopBanner from "../components/TopBanner";
import { useSavedEvent } from "../hooks/useSavedEvent";
import { useEventFriends } from "../hooks/useEventFriends";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

// Styles
import { fireGradient, bannerGradient } from "../styles/colours";
import { RootStackParamList } from "../types/types";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

type EventProfileRouteProp = RouteProp<RootStackParamList, "EventProfile">;

// --- HELPERS ---
const getSource = (source: any) => {
  if (typeof source === "string") return { uri: source };
  return source;
};

const isVideoFile = (source: any) => {
  const uri = typeof source === "string" ? source : source?.uri;
  if (uri) {
    const lower = uri.toLowerCase();
    return (
      lower.endsWith(".mp4") ||
      lower.endsWith(".mov") ||
      lower.endsWith(".quicktime")
    );
  }
  return false;
};

// ✅ STRICT SUPER-CATEGORY COLOR ENGINE (Synced from Map)
const GET_CATEGORY_COLOR = (
  name: string,
  groupedCategories: Record<string, string[]>,
) => {
  if (!name) return "#FA8900";

  let targetGroup = name;

  if (!groupedCategories[name]) {
    for (const [group, cats] of Object.entries(groupedCategories)) {
      if (cats.includes(name)) {
        targetGroup = group;
        break;
      }
    }
  }

  const g = targetGroup.toLowerCase();
  if (g.includes("music")) return "#A855F7";
  if (g.includes("sport")) return "#F43F5E";
  if (g.includes("active")) return "#F97316";
  if (g.includes("show")) return "#10B981";
  if (g.includes("food") || g.includes("restaurant")) return "#3B82F6";

  return "#FA8900";
};

const EventProfileScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<EventProfileRouteProp>();
  const { user } = useAuth();

  // Initial Params (Fallback)
  const eventId = params?.eventId;

  // LIVE STATE
  const [eventData, setEventData] = useState<any>(null);
  const [groupedCategories, setGroupedCategories] = useState<
    Record<string, string[]>
  >({});
  const [loading, setLoading] = useState(true);

  // --- TRAPDOOR STATE ---
  const appState = useRef(AppState.currentState);
  const [awaitingTicketReturn, setAwaitingTicketReturn] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

  // --- THE TRAPDOOR LISTENER ---
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        if (awaitingTicketReturn) {
          setShowTicketModal(true);
          setAwaitingTicketReturn(false);
        }
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [awaitingTicketReturn]);

  // Gallery State
  const [activeSlide, setActiveSlide] = useState(0);
  const [showFullGallery, setShowFullGallery] = useState(false);
  const [fullScreenIndex, setFullScreenIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Initialize the custom hook for saving the event
  const { isSaved, toggleSave } = useSavedEvent(eventId);

  // Which of the user's friends are going to / interested in this event.
  const { friends } = useEventFriends(eventId);
  const [showFriends, setShowFriends] = useState(false);

  const handleShare = async () => {
    try {
      const shareUrl = `https://gatekeeper.app/event/${eventId}`;
      const message = `Yo, I'm checking out ${eventName} on GateKeeper! Grab a ticket and let's go: ${shareUrl}`;

      const result = await Share.share({
        message: message,
        url: shareUrl,
        title: `Check out ${eventName}`,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log("Shared via", result.activityType);
        } else {
          console.log("Share successful!");
        }
      } else if (result.action === Share.dismissedAction) {
        console.log("Share dismissed");
      }
    } catch (error: any) {
      console.error("Error sharing:", error.message);
    }
  };

  // FETCH FRESH DATA ON FOCUS
  useFocusEffect(
    useCallback(() => {
      if (!eventId) return;

      const fetchData = async () => {
        try {
          // Fetch Event Data
// Fetch Event Data
          const { data: event, error: eventError } = await supabase
            .from("events")
            // Host identity is separate from personal — prefer host_* fields,
            // falling back to personal ones for hosts who never set up a host profile.
            .select(`*, profiles:host_id ( host_username, host_full_name, host_avatar_url, username, full_name, avatar_url ), ticket_tiers (*)`)
            .eq("id", eventId)
            .single();

          if (!eventError) setEventData(event);

          // Fetch Category Groups for the color engine
          const { data: categoryData } = await supabase
            .from("categories")
            .select("name, group_name");

          if (categoryData) {
            const grouped = categoryData.reduce(
              (acc: Record<string, string[]>, curr) => {
                const group = curr.group_name || "Other";
                if (!acc[group]) acc[group] = [];
                acc[group].push(curr.name);
                return acc;
              },
              {},
            );
            setGroupedCategories(grouped);
          }
        } catch (err) {
          console.log("Error fetching event details:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [eventId]),
  );

  // --- DERIVED DATA ---
  const displayEvent = eventData || params;
  const eventName =
    displayEvent?.title || displayEvent?.eventName || "Loading...";

  const hostName =
    displayEvent?.profiles?.host_username ||
    displayEvent?.profiles?.host_full_name ||
    displayEvent?.profiles?.username ||
    displayEvent?.profiles?.full_name ||
    "Unknown Host";

  const hostAvatarUrl =
    displayEvent?.profiles?.host_avatar_url || displayEvent?.profiles?.avatar_url;
  const hostAvatar = hostAvatarUrl
    ? { uri: hostAvatarUrl }
    : require("../assets/profile-pic-1.png");

  const rawDescription =
    displayEvent?.description || "Join us for an unforgettable experience!";
  const displayDescription = rawDescription.split(/Date:/i)[0].trim();

  const locationText =
    displayEvent?.location_text || displayEvent?.location || "Location TBA";

  const formatDateTime = (d: Date) =>
    `${d.toLocaleDateString()} • ${d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;

  const dateObj = displayEvent?.date ? new Date(displayEvent.date) : null;
  const timeText = dateObj
    ? formatDateTime(dateObj)
    : displayEvent?.time || "Date TBA";

  const endDateObj = displayEvent?.end_date
    ? new Date(displayEvent.end_date)
    : null;
  const endTimeText = endDateObj ? formatDateTime(endDateObj) : null;

  const rawImages = displayEvent?.images;
  const banner =
    displayEvent?.banner_url ||
    displayEvent?.banner ||
    require("../assets/event-placeholder.png");
  const galleryImages =
    rawImages && rawImages.length > 0 ? rawImages : [banner];

  const tiers = displayEvent?.ticket_tiers || [];
  const activeTiers = tiers.filter((t: any) => t.is_active !== false);
  // Derive the lowest price straight from the tiers rather than trusting a
  // separate lowest_price column, which can go stale or be unset.
  const lowestPrice =
    activeTiers.length > 0
      ? Math.min(...activeTiers.map((t: any) => Number(t.price) || 0))
      : displayEvent?.lowest_price;
  const rawPriceString = (tiers.length > 0 && tiers[0].price != null)
    ? String(tiers[0].price)
    : "TBA";
  const isFree =
    lowestPrice === 0 || rawPriceString.toLowerCase().includes("free");

  let displayPrice = "TBA";
  if (isFree) {
    displayPrice = "FIND OUT MORE";
  } else if (lowestPrice !== null && lowestPrice !== undefined) {
    displayPrice = `As From R${lowestPrice}`;
  } else {
    displayPrice = rawPriceString
      .split("|")[0]
      .split(/Website:/i)[0]
      .trim();
  }

  const ticketUrl = displayEvent?.ticket_url;
  // Info-only events (no ticket_tiers, e.g. meetups or scraped listings)
  // default to true when the column predates this event's row.
  const requiresTickets = displayEvent?.requires_tickets ?? true;

  // Hosts shouldn't be able to buy tickets to their own event.
  const isOwnEvent = !!user && !!displayEvent?.host_id && displayEvent.host_id === user.id;

  // 🔥 SAFELY PARSE CATEGORIES FOR TAGS
  let parsedTags: string[] = [];
  const rawCats =
    displayEvent?.categories || displayEvent?.tags || params?.tags;
  if (Array.isArray(rawCats)) {
    parsedTags = rawCats;
  } else if (typeof rawCats === "string") {
    try {
      parsedTags = JSON.parse(rawCats);
    } catch {
      parsedTags = [rawCats];
    }
  }
  const tags = parsedTags.length > 0 ? parsedTags : [];

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  }, []);

  const handleScroll = (event: any) => {
    const slide = Math.ceil(
      event.nativeEvent.contentOffset.x /
        event.nativeEvent.layoutMeasurement.width,
    );
    if (slide !== activeSlide) setActiveSlide(slide);
  };

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setFullScreenIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  const handleTicketPress = () => {
    if (isOwnEvent) {
      Alert.alert("Your Event", "You can't buy tickets to your own event.");
      return;
    }
    if (ticketUrl) {
      setAwaitingTicketReturn(true);
      Linking.openURL(ticketUrl).catch((err) => {
        console.error("Couldn't load page", err);
        setAwaitingTicketReturn(false);
      });
    } else if (eventId) {
      navigation.navigate("PurchaseTicket", {
        eventId,
        eventName,
        ticket_tiers: tiers,
        banner,
        logo: hostAvatar,
        time: timeText,
        location: locationText,
      });
    }
  };

  const openNativeMaps = () => {
    if (displayEvent?.lat && displayEvent?.lng) {
      const scheme = Platform.select({
        ios: "maps:0,0?q=",
        android: "geo:0,0?q=",
      });
      const latLng = `${displayEvent.lat},${displayEvent.lng}`;
      const label = locationText;
      const url = Platform.select({
        ios: `${scheme}${label}@${latLng}`,
        android: `${scheme}${latLng}(${label})`,
      });
      Linking.openURL(url as string);
    } else {
      const scheme = Platform.OS === "ios" ? "maps:0,0?q=" : "geo:0,0?q=";
      Linking.openURL(`${scheme}${encodeURIComponent(locationText)}`);
    }
  };

  const renderHeaderItem = (item: any, index: number) => {
    const source = getSource(item);
    const isVideo = isVideoFile(item);

    return (
      <TouchableOpacity
        key={index}
        activeOpacity={0.9}
        onPress={() => {
          setFullScreenIndex(index);
          setShowFullGallery(true);
        }}
      >
        {isVideo ? (
          <View
            style={{
              width: screenWidth,
              height: 320,
              backgroundColor: "black",
            }}
          >
            <Video
              source={source}
              style={{ width: "100%", height: "100%" }}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              isMuted
            />
            <View className="absolute inset-0 items-center justify-center">
              <View className="bg-black/30 p-3 rounded-full backdrop-blur-sm">
                <VolumeX color="white" size={20} />
              </View>
            </View>
          </View>
        ) : (
          <Image
            source={source}
            style={{ width: screenWidth, height: 320 }}
            resizeMode="cover"
          />
        )}
      </TouchableOpacity>
    );
  };

  const renderFullScreenItem = ({ item, index }: any) => {
    const source = getSource(item);
    const isVideo = isVideoFile(item);
    const isActive = index === fullScreenIndex;
    return (
      <View
        style={{
          width: screenWidth,
          height: screenHeight,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "black",
        }}
      >
        {isVideo ? (
          <Video
            source={source}
            style={{ width: "100%", height: "80%" }}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={isActive}
            isLooping
            isMuted={isMuted}
            useNativeControls={false}
          />
        ) : (
          <Image
            source={source}
            style={{ width: "100%", height: "80%" }}
            resizeMode="contain"
          />
        )}
      </View>
    );
  };

  const handleConfirmGoing = async () => {
    setShowTicketModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !eventId) return;

      // RSVP lives in its own table with a (user_id, event_id) primary key, so
      // this upsert finally has a real key to conflict on and actually persists.
      const { error } = await supabase.from("event_rsvps").upsert(
        {
          user_id: user.id,
          event_id: eventId,
          status: "going",
        },
        { onConflict: "user_id,event_id" },
      );

      if (error) throw error;
      console.log("🎟️ User officially going to:", eventName);
    } catch (error) {
      console.error("Error saving going intent:", error);
    }
  };

  return (
    <View className="flex-1 bg-[#121212]">
      <StatusBar barStyle="light-content" />
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <TopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingTop: 100, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          {/* THE POST-CLICK TRAPDOOR MODAL */}
          <Modal
            visible={showTicketModal}
            transparent={true}
            animationType="slide"
          >
            <View className="flex-1 bg-black/80 justify-end">
              <View className="bg-[#1E1E1E] rounded-t-3xl p-6 border-t border-white/10 pb-12">
                <View className="items-center mb-6">
                  <View className="bg-orange-500/20 p-4 rounded-full mb-4">
                    <Ticket color="#FA8900" size={40} />
                  </View>
                  <Text
                    className="text-white text-3xl font-bold mb-2 text-center"
                    style={{ fontFamily: "Jost-Medium" }}
                  >
                    Secure your spot?
                  </Text>
                  <Text className="text-gray-400 text-center text-base px-4">
                    Did you end up grabbing tickets to {eventName}? Let your
                    crew know you're in.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleConfirmGoing}
                  activeOpacity={0.9}
                  className="w-full shadow-lg shadow-orange-500/30 mb-4"
                >
                  <LinearGradient
                    {...fireGradient}
                    className="w-full py-4 rounded-2xl items-center justify-center"
                  >
                    <Text
                      className="text-white text-lg font-bold tracking-wide"
                      style={{ fontFamily: "Jost-Medium" }}
                    >
                      YEAH, I'M GOING! 🚀
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowTicketModal(false)}
                  className="w-full py-4 rounded-2xl items-center bg-white/5 border border-white/10"
                >
                  <Text
                    className="text-gray-400 text-lg font-bold tracking-wide"
                    style={{ fontFamily: "Jost-Medium" }}
                  >
                    NAH, PASSED.
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* HEADER GALLERY */}
          <View className="relative h-80 w-full mb-6">
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {galleryImages.map((img: any, i: number) =>
                renderHeaderItem(img, i),
              )}
            </ScrollView>
            <LinearGradient
              colors={["transparent", "#121212"]}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: 100,
              }}
              pointerEvents="none"
            />
            {galleryImages.length > 1 && (
              <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
                {galleryImages.map((_: any, i: number) => (
                  <View
                    key={i}
                    className={`w-2 h-2 rounded-full ${i === activeSlide ? "bg-white" : "bg-white/30"}`}
                  />
                ))}
              </View>
            )}

            {/* Back Button */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="absolute top-4 left-4 bg-black/50 p-3 rounded-full border border-white/10"
            >
              <ArrowLeft color="white" size={24} />
            </TouchableOpacity>

            {/* Heart & Share Buttons */}
            <View className="absolute top-4 right-4 flex-row gap-3">
              <TouchableOpacity
                onPress={toggleSave}
                activeOpacity={0.7}
                className="bg-black/50 p-3 rounded-full border border-white/10"
              >
                <Heart
                  color={isSaved ? "#FA8900" : "white"}
                  fill={isSaved ? "#FA8900" : "transparent"}
                  size={20}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShare}
                activeOpacity={0.7}
                className="bg-black/50 p-3 rounded-full border border-white/10"
              >
                <Share2 color="white" size={20} />
              </TouchableOpacity>
            </View>
          </View>

          {/* TITLE & HOST */}
          <View className="px-6 mb-6 -mt-12">
            {/* 👇 UPDATED: Hides the host pill if there's an external ticket link */}
            {displayEvent?.host_id &&
              hostName &&
              hostName.trim() !== "" &&
              !ticketUrl && (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("EventHostProfile", {
                      hostId: displayEvent.host_id,
                    })
                  }
                  className="flex-row items-center bg-[#1E1E1E] self-start px-3 py-1.5 rounded-full border border-white/10 mb-4 shadow-lg"
                >
                  <Image
                    source={hostAvatar}
                    className="w-6 h-6 rounded-full mr-2"
                  />
                  <Text className="text-gray-300 text-sm font-bold pr-1">
                    {hostName}
                  </Text>
                </TouchableOpacity>
              )}

            <Text
              className="text-white text-4xl font-bold mb-2 leading-tight"
              style={{ fontFamily: "Jost-Medium" }}
            >
              {eventName}
            </Text>

            {/* 🔥 DYNAMIC COLORED TAGS */}
            <View className="flex-row flex-wrap gap-2 mt-3">
              {tags.map((tag: string, i: number) => {
                const color = GET_CATEGORY_COLOR(tag, groupedCategories);
                return (
                  <View
                    key={i}
                    style={{
                      backgroundColor: `${color}15`, // 15% opacity tint
                      borderColor: `${color}40`, // 40% opacity border
                    }}
                    className="px-3 py-1 rounded-lg border"
                  >
                    <Text
                      style={{ color: color }}
                      className="text-xs font-bold uppercase tracking-wider"
                    >
                      {tag}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* FRIENDS GOING */}
          {friends.length > 0 && (
            <TouchableOpacity
              onPress={() => setShowFriends(true)}
              activeOpacity={0.85}
              className="mx-6 mb-8 flex-row items-center bg-white/5 border border-white/10 rounded-3xl p-4"
            >
              <View className="flex-row mr-4">
                {friends.slice(0, 4).map((f: any, i: number) => (
                  <Image
                    key={f.friend_id || i}
                    source={
                      f.avatar_url
                        ? { uri: f.avatar_url }
                        : require("../assets/profile-pic-1.png")
                    }
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      marginLeft: i > 0 ? -14 : 0,
                    }}
                    className="border-2 border-[#1E1E1E]"
                  />
                ))}
              </View>
              <View className="flex-1">
                <Text
                  className="text-white font-bold text-base"
                  style={{ fontFamily: "Jost-Medium" }}
                >
                  {friends.length}{" "}
                  {friends.length === 1 ? "friend is" : "friends are"} interested
                </Text>
                <Text className="text-gray-400 text-sm">
                  Tap to see who's in
                </Text>
              </View>
              <ChevronRight color="#666" size={20} />
            </TouchableOpacity>
          )}

          {/* DETAILS */}
          <View className="mx-6 bg-white/5 border border-white/10 rounded-3xl p-5 mb-8 gap-5">
            <View className="flex-row items-center">
              <View className="bg-orange-500/20 p-3 rounded-xl mr-4">
                <Calendar color="#FA8900" size={24} />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-lg">
                  Date & Time
                </Text>
                <Text className="text-gray-400">Starts {timeText}</Text>
                {endTimeText && (
                  <Text className="text-gray-400">Ends {endTimeText}</Text>
                )}
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="bg-blue-500/20 p-3 rounded-xl mr-4">
                <MapPin color="#60A5FA" size={24} />
              </View>
              <View className="flex-1 pr-2">
                <Text className="text-white font-bold text-lg">Location</Text>
                <TouchableOpacity onPress={openNativeMaps}>
                  <Text className="text-orange-400 underline font-medium mt-0.5">
                    {locationText}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-row items-start">
              <View className="bg-purple-500/20 p-3 rounded-xl mr-4">
                <Ticket color="#D087FF" size={24} />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-lg mb-1">
                  Tickets
                </Text>
                {activeTiers.length > 0 ? (
                  activeTiers.map((tier: any, i: number) => (
                    <View
                      key={tier.id || i}
                      className="flex-row justify-between items-center mb-1"
                    >
                      <Text
                        className="text-gray-400 flex-1 mr-2"
                        numberOfLines={1}
                      >
                        {tier.name}
                      </Text>
                      <Text className="text-gray-300 font-semibold">
                        {Number(tier.price) === 0 ? "Free" : `R${tier.price}`}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text className="text-gray-400">{displayPrice}</Text>
                )}
              </View>
            </View>
          </View>

          {/* ABOUT SECTION */}
          <View className="px-6 mb-6">
            <Text className="text-white text-xl font-bold mb-2">About</Text>
            <Text className="text-gray-400 text-base leading-6">
              {displayDescription}
            </Text>
          </View>
        </ScrollView>

        {/* BOTTOM ACTION BAR — informational events with nothing to link to
            skip this entirely, since there's nothing actionable to show.
            Gated on !loading too: until the real row loads, requiresTickets
            falls back to the nav params (which never carry that field) and
            would otherwise flash a bogus "Buy Tickets" button. */}
        {!loading && !isOwnEvent && (requiresTickets || ticketUrl) && (
          <View className="absolute bottom-0 left-0 right-0 bg-[#121212]/95 border-t border-white/10 p-6 pb-8 flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text className="text-gray-400 text-xs font-bold uppercase">
                {!requiresTickets ? "MORE INFO" : isFree ? "ADMISSION" : "TICKETS"}
              </Text>
              <Text
                className="text-white text-2xl font-bold"
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {!requiresTickets ? "Details Online" : displayPrice}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              className="w-[55%] shadow-lg shadow-orange-500/40"
              onPress={handleTicketPress}
            >
              <LinearGradient
                {...fireGradient}
                className="w-full py-4 rounded-2xl items-center justify-center"
              >
                <Text
                  className="text-white text-lg font-bold tracking-wide"
                  style={{ fontFamily: "Jost-Medium" }}
                >
                  {!requiresTickets
                    ? "VISIT WEBSITE"
                    : isFree
                      ? "GET TICKETS"
                      : ticketUrl
                        ? "BUY ONLINE"
                        : "BUY TICKETS"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {!loading && isOwnEvent && requiresTickets && (
          <View className="absolute bottom-0 left-0 right-0 bg-[#121212]/95 border-t border-white/10 p-6 pb-8">
            <Text className="text-gray-400 text-center font-medium">
              You're hosting this event — manage tickets from your Host Dashboard.
            </Text>
          </View>
        )}
      </SafeAreaView>

      {/* FRIENDS GOING MODAL */}
      <Modal
        visible={showFriends}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFriends(false)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-[#1E1E1E] rounded-t-3xl p-6 border-t border-white/10 pb-12 max-h-[70%]">
            <View className="flex-row justify-between items-start mb-6">
              <View className="flex-1 pr-4">
                <Text className="text-gray-400 text-xs uppercase font-bold tracking-widest mb-1">
                  Who's Going?
                </Text>
                <Text
                  className="text-white text-2xl font-bold"
                  numberOfLines={2}
                  style={{ fontFamily: "Jost-Medium" }}
                >
                  {eventName}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowFriends(false)}
                className="bg-white/10 p-2 rounded-full"
              >
                <X color="white" size={24} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={friends}
              keyExtractor={(item, i) => item.friend_id || String(i)}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }: { item: any }) => (
                <View className="flex-row items-center mb-4">
                  <Image
                    source={
                      item.avatar_url
                        ? { uri: item.avatar_url }
                        : require("../assets/profile-pic-1.png")
                    }
                    className="w-12 h-12 rounded-full border-2 border-orange-500 mr-4"
                  />
                  <View className="flex-1">
                    <Text className="text-white text-lg font-bold">
                      {item.username || "Friend"}
                    </Text>
                    <Text className="text-gray-400 text-sm">
                      {item.intent === "GOING" ? "Going 🚀" : "Interested"}
                    </Text>
                  </View>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showFullGallery}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setShowFullGallery(false)}
      >
        <View className="flex-1 bg-black relative">
          <StatusBar hidden />
          <TouchableOpacity
            onPress={() => setShowFullGallery(false)}
            className="absolute top-12 right-6 z-50 bg-black/50 p-2 rounded-full"
          >
            <X color="white" size={32} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsMuted(!isMuted)}
            className="absolute top-12 left-6 z-50 bg-black/50 p-2 rounded-full"
          >
            {isMuted ? (
              <VolumeX color="white" size={24} />
            ) : (
              <Volume2 color="white" size={24} />
            )}
          </TouchableOpacity>
          <FlatList
            data={galleryImages}
            keyExtractor={(_, index) => index.toString()}
            renderItem={renderFullScreenItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            initialScrollIndex={fullScreenIndex}
            onScrollToIndexFailed={() => {}}
          />
          <View className="absolute bottom-10 w-full items-center">
            <Text className="text-white/60 font-bold">Swipe for more</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default EventProfileScreen;
