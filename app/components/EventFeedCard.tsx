// app/components/EventFeedCard.tsx
import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ImageSourcePropType,
  Modal,
  FlatList,
  StatusBar,
  Pressable,
} from "react-native";
import { Image } from "expo-image"; // 👈 Upgraded to Expo Image!
import { LinearGradient } from "expo-linear-gradient";
import {
  Users,
  Heart,
  ArrowRight,
  X,
  Volume2,
  VolumeX,
} from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import {
  Video,
  ResizeMode,
  Audio,
  InterruptionModeIOS,
  InterruptionModeAndroid,
} from "expo-av";
import { fireGradient } from "../styles/colours";

import { useSavedEvent } from "../hooks/useSavedEvent";
import { useEventFriends } from "../hooks/useEventFriends";
import { supabase } from "../lib/supabase";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("screen");

// 👇 FIX: Cap the height so it never spills off the top/bottom of smaller screens
const CARD_HEIGHT = Math.min(SCREEN_WIDTH * 1.6, SCREEN_HEIGHT * 0.75);

type EventFeedCardProps = {
  id: string;
  title: string;
  hostName?: string;
  hostAvatar?: ImageSourcePropType;
  image: any;
  mediaItems?: any[];
  attendeesCount: number;
  onOpenSocial: (friendsData: any[]) => void;
  onPressHost: () => void;
  onViewEvent: () => void;
  showSocial?: boolean;
  tags?: string[];
  minPrice?: string;
  disableTap?: boolean;
  onOpenDiscussion?: () => void;
};

// 🔥 THE BULLETPROOF HIGH-RES UPSCALER
const getSource = (source: any) => {
  let uri = typeof source === "string" ? source : source?.uri;

  if (uri) {
    // 1. Bandsintown: Swap /thumb/ for /large/
    uri = uri.replace("/thumb/", "/large/");

    // 2. Drupal CMS: Strip the thumbnail routing
    uri = uri.replace(/\/styles\/[^/]+\/public\//i, "/");

    // 3. WordPress Hardcoded Thumbnails
    uri = uri.replace(/-\d+x\d+\.(jpg|jpeg|png|webp)(?:\?.*)?$/i, ".$1");

    // 4. CDNs & Generic Query Params
    if (uri.match(/[?&]w=\d+/)) {
      uri = uri.replace(/([?&]w=)\d+/, "$11080");
    }
    if (uri.match(/[?&]h=\d+/)) {
      uri = uri.replace(/([?&]h=)\d+/, "$11080");
    }
  }

  return { uri };
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

const EventFeedCard = ({
  id,
  title,
  hostName,
  hostAvatar,
  image,
  mediaItems = [],
  attendeesCount,
  onOpenSocial,
  onPressHost,
  onViewEvent,
  showSocial = true,
  tags = [],
  disableTap = false,
}: EventFeedCardProps) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [groupedCategories, setGroupedCategories] = useState<
    Record<string, string[]>
  >({});

  const { isSaved, toggleSave } = useSavedEvent(id);
  const { friends } = useEventFriends(id);

  const carouselData =
    mediaItems && mediaItems.length > 0 ? mediaItems : [image];

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const enableAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          shouldDuckAndroid: true,
        });
      } catch (e) {
        console.warn("Error setting audio mode", e);
      }
    };
    enableAudio();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await supabase
          .from("categories")
          .select("name, group_name");

        if (data) {
          const grouped = data.reduce((acc: Record<string, string[]>, curr) => {
            const group = curr.group_name || "Other";
            if (!acc[group]) acc[group] = [];
            acc[group].push(curr.name);
            return acc;
          }, {});
          setGroupedCategories(grouped);
        }
      } catch (err) {
        console.error("Error fetching categories for EventCard:", err);
      }
    };

    if (tags && tags.length > 0) {
      fetchCategories();
    }
  }, [tags]);

  const handleLike = () => {
    toggleSave();

    if (!isSaved) {
      scale.value = 0;
      opacity.value = 1;
      scale.value = withSpring(1, { damping: 15 });
      opacity.value = withDelay(500, withTiming(0, { duration: 300 }));
    }
  };

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: Math.max(scale.value, 0) }],
    opacity: opacity.value,
  }));

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

  const renderFullScreenItem = ({
    item,
    index,
  }: {
    item: any;
    index: number;
  }) => {
    const source = getSource(item);
    const isVideo = isVideoFile(item);
    const isActive = index === currentIndex;

    return (
      <View
        style={{
          width: SCREEN_WIDTH,
          height: SCREEN_HEIGHT,
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
            isLooping={true}
            isMuted={isMuted}
            useNativeControls={false}
          />
        ) : (
          <Image
            source={source}
            style={{ width: "100%", height: "80%" }}
            contentFit="contain" // 👈 Updated for expo-image
            transition={300}
            cachePolicy="memory-disk"
          />
        )}
      </View>
    );
  };

  const mainSource = getSource(carouselData[0]);
  const isMainVideo = isVideoFile(carouselData[0]);

  let parsedTags: string[] = [];
  if (Array.isArray(tags)) {
    parsedTags = tags;
  } else if (typeof tags === "string") {
    try {
      parsedTags = JSON.parse(tags);
    } catch {
      parsedTags = [tags];
    }
  }

  return (
    <>
      <View
        // 👇 FIX: Added overflow-hidden to stop image bleeding!
        className="mb-2 bg-black relative overflow-hidden"
        style={{ height: CARD_HEIGHT, width: SCREEN_WIDTH }}
      >
        <Pressable
          onPress={() => setIsFullScreen(true)}
          style={{ flex: 1, backgroundColor: "#111" }}
        >
          {isMainVideo ? (
            <Video
              source={mainSource}
              style={{ width: "100%", height: "100%", position: "absolute" }}
              resizeMode={ResizeMode.COVER}
              shouldPlay={true}
              isLooping={true}
              isMuted={true}
            />
          ) : (
            <Image
              source={mainSource}
              style={{ width: "100%", height: "100%", position: "absolute" }}
              contentFit="cover" // 👈 Replaced resizeMode
              transition={300} // Smooth load-in
              cachePolicy="memory-disk"
            />
          )}

          {/* 👇 The Low-Res Artifact Mask */}
          <View className="absolute inset-0 bg-black/20" pointerEvents="none" />

          {/* 👇 Heart Animation (Cleaned up duplicates) */}
          <View className="absolute inset-0 justify-center items-center pointer-events-none">
            <Animated.View style={heartStyle}>
              <Heart color="#FA8900" size={150} fill="#FA8900" />
            </Animated.View>
          </View>
        </Pressable>

        <LinearGradient
          colors={[
            "transparent",
            "rgba(0,0,0,0.2)",
            "rgba(0,0,0,0.6)",
            "rgba(0,0,0,0.95)",
          ]}
          className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-32 justify-end z-20"
          pointerEvents="box-none"
        >
          <View>
            {parsedTags.length > 0 && (
              <View className="flex-row flex-wrap gap-2 mb-3">
                {parsedTags.map((tag: string, i: number) => {
                  const color = GET_CATEGORY_COLOR(tag, groupedCategories);
                  return (
                    <View
                      key={i}
                      style={{
                        backgroundColor: `${color}30`,
                        borderColor: `${color}80`,
                      }}
                      className="px-2 py-0.5 rounded-md border"
                    >
                      <Text
                        style={{ color: color }}
                        className="text-[10px] font-bold uppercase tracking-wider shadow-sm shadow-black"
                      >
                        {tag}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            <Text
              className="text-white text-4xl font-bold mb-3 leading-tight shadow-black"
              style={{ fontFamily: "Jost-Medium" }}
            >
              {title}
            </Text>
          </View>

          <View className="flex-row items-center justify-between mb-6">
            {/* Host pill dynamically shown/hidden based on DB data */}
            {/*hostName && hostName.trim() !== "" && hostAvatar && (
              <TouchableOpacity
                onPress={onPressHost}
                className="flex-row items-center"
              >
                <Image
                  source={hostAvatar}
                  style={{ width: 40, height: 40, borderRadius: 20 }}
                  className="border-2 border-orange-500 mr-3"
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
                <View>
                  <Text className="text-gray-300 text-xs font-bold uppercase tracking-wider">
                    Hosted By
                  </Text>
                  <Text
                    className="text-white text-lg font-bold"
                    style={{ fontFamily: "Jost-Medium" }}
                  >
                    {hostName}
                  </Text>
                </View>
              </TouchableOpacity>
            )*/}

            <View className="flex-1 items-end">
              <TouchableOpacity
                onPress={handleLike}
                className="bg-white/20 p-3 rounded-full backdrop-blur-md"
              >
                <Heart
                  color={isSaved ? "#FA8900" : "white"}
                  fill={isSaved ? "#FA8900" : "none"}
                  size={32}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={onViewEvent}
            disabled={disableTap}
            activeOpacity={0.9}
            className="w-full shadow-lg shadow-orange-500/30"
          >
            <LinearGradient
              {...fireGradient}
              className="w-full py-4 rounded-2xl flex-row items-center justify-center border border-white/10"
            >
              <Text
                className="text-white text-xl font-bold tracking-wide mr-2"
                style={{ fontFamily: "Jost-Medium" }}
              >
                VIEW EVENT
              </Text>
              <ArrowRight color="white" size={20} strokeWidth={2.5} />
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>

        {showSocial && (
          <TouchableOpacity
            onPress={() => onOpenSocial(friends)}
            activeOpacity={0.8}
            style={{ zIndex: 50 }}
            className={`absolute top-6 right-4 flex-row items-center rounded-full border border-white/20 shadow-lg shadow-black/60 ${friends.length > 0 ? "bg-black/80 pl-2 pr-4 py-2" : ""}`}
          >
            {friends.length > 0 ? (
              <>
                <View className="flex-row mr-2">
                  {friends.slice(0, 3).map((friend: any, i: number) => (
                    <Image
                      key={friend.friend_id}
                      source={
                        friend.avatar_url
                          ? { uri: friend.avatar_url }
                          : require("../assets/profile-pic-1.png")
                      }
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        marginLeft: i > 0 ? -12 : 0,
                      }}
                      className="border-2 border-[#121212]"
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  ))}
                </View>
                <Text className="text-white text-xs font-bold">
                  {friends.length} {friends.length === 1 ? "Friend" : "Friends"}
                </Text>
              </>
            ) : (
              <LinearGradient
                {...fireGradient}
                className="w-12 h-12 rounded-full items-center justify-center shadow-lg shadow-black/60 border-2 border-white/20"
              >
                <Users color="white" size={20} fill="white" />
              </LinearGradient>
            )}
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={isFullScreen}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setIsFullScreen(false)}
      >
        <View className="flex-1 bg-black">
          <StatusBar hidden />
          <TouchableOpacity
            onPress={() => setIsFullScreen(false)}
            className="absolute top-12 right-6 z-50 bg-black/50 p-2 rounded-full"
          >
            <X color="white" size={28} />
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
            data={carouselData}
            keyExtractor={(_, index) => index.toString()}
            renderItem={renderFullScreenItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            className="flex-1"
          />
          <View className="absolute bottom-10 left-6 right-6">
            <TouchableOpacity
              onPress={() => {
                setIsFullScreen(false);
                onViewEvent();
              }}
              activeOpacity={0.9}
              className="w-full shadow-lg shadow-orange-500/30"
            >
              <LinearGradient
                {...fireGradient}
                className="w-full py-4 rounded-full flex-row items-center justify-center border border-white/10"
              >
                <Text
                  className="text-white text-xl font-bold tracking-wide mr-2"
                  style={{ fontFamily: "Jost-Medium" }}
                >
                  VIEW EVENT
                </Text>
                <ArrowRight color="white" size={20} strokeWidth={2.5} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default EventFeedCard;
