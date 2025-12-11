import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  ImageSourcePropType,
  Modal,
  FlatList,
  StatusBar,
  Pressable,
} from "react-native";
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
import { Video, ResizeMode } from "expo-av";
import { fireGradient } from "../styles/colours";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("screen");
const CARD_HEIGHT = SCREEN_WIDTH * 1.6;

type EventFeedCardProps = {
  id: string;
  title: string;
  hostName: string;
  hostAvatar: ImageSourcePropType;
  image: any; // Fallback single image/video
  mediaItems?: any[]; // ✅ NEW: Array of media for carousel
  attendeesCount: number;
  onOpenSocial: () => void;
  onPressHost: () => void;
  onViewEvent: () => void;
  showSocial?: boolean;
};

// --- HELPER TO CHECK MEDIA TYPE ---
const isVideoFile = (source: any) => {
  if (source?.uri) {
    const uri = source.uri.toLowerCase();
    return (
      uri.endsWith(".mp4") || uri.endsWith(".mov") || uri.endsWith(".quicktime")
    );
  }
  return false;
};

const EventFeedCard = ({
  id,
  title,
  hostName,
  hostAvatar,
  image,
  mediaItems = [], // Default to empty if not passed
  attendeesCount,
  onOpenSocial,
  onPressHost,
  onViewEvent,
  showSocial = true,
}: EventFeedCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Combine single image into array if mediaItems is empty
  const carouselData = mediaItems.length > 0 ? mediaItems : [image];

  // Animation Values
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  // --- FULL SCREEN VIDEO STATE ---
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false); // Default sound on in full screen? Up to you.

  // Handle Like Animation
  const handleLike = () => {
    const newState = !isLiked;
    setIsLiked(newState);
    if (newState) {
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

  // Track which item is visible in the Carousel to play video
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

  // --- RENDER ITEM FOR CAROUSEL ---
  const renderFullScreenItem = ({
    item,
    index,
  }: {
    item: any;
    index: number;
  }) => {
    const isVideo = isVideoFile(item);
    const isActive = index === currentIndex; // Only play if active slide

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
            source={item}
            style={{ width: "100%", height: "80%" }} // ✅ Takes up 80% as requested
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={isActive} // Only play if looking at it
            isLooping={true}
            isMuted={isMuted}
            useNativeControls={false}
          />
        ) : (
          <Image
            source={item}
            style={{ width: "100%", height: "80%" }}
            resizeMode="contain"
          />
        )}
      </View>
    );
  };

  // --- MAIN FEED RENDER (Mini Card) ---
  const isMainVideo = isVideoFile(carouselData[0]);

  return (
    <>
      <View
        className="mb-2 bg-black relative"
        style={{ height: CARD_HEIGHT, width: SCREEN_WIDTH }}
      >
        {/* 1. Main Clickable Area - TRIGGERS FULL SCREEN */}
        <Pressable
          onPress={() => setIsFullScreen(true)}
          style={{ flex: 1, backgroundColor: "#111" }}
        >
          {isMainVideo ? (
            <Video
              source={carouselData[0]}
              style={{ width: "100%", height: "100%", position: "absolute" }}
              resizeMode={ResizeMode.COVER}
              shouldPlay={true} // Auto-play on feed
              isLooping={true}
              isMuted={true} // Muted on feed
            />
          ) : (
            <Image
              source={carouselData[0]}
              className="w-full h-full absolute"
              resizeMode="cover"
            />
          )}

          {/* Like Heart Pop-up */}
          <View className="absolute inset-0 justify-center items-center pointer-events-none">
            <Animated.View style={heartStyle}>
              <Heart color="#FA8900" size={100} fill="#FA8900" />
            </Animated.View>
          </View>
        </Pressable>

        {/* 2. Bottom Gradient Overlay (Title, Host, etc.) */}
        {/* pointerEvents="box-none" ensures clicks pass through empty spaces */}
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
          {/* Title */}
          <View>
            <Text
              className="text-white text-4xl font-bold mb-3 leading-tight shadow-black"
              style={{ fontFamily: "Jost-Medium" }}
            >
              {title}
            </Text>
          </View>

          {/* Host Info Row */}
          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity
              onPress={onPressHost}
              className="flex-row items-center"
            >
              <Image
                source={hostAvatar}
                className="w-10 h-10 rounded-full border-2 border-orange-500 mr-3"
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

            <TouchableOpacity
              onPress={handleLike}
              className="bg-white/20 p-3 rounded-full backdrop-blur-md"
            >
              <Heart
                color={isLiked ? "#FA8900" : "white"}
                fill={isLiked ? "#FA8900" : "none"}
                size={24}
              />
            </TouchableOpacity>
          </View>

          {/* VIEW EVENT BUTTON */}
          <TouchableOpacity
            onPress={onViewEvent}
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

        {/* Social Button (Top Right) */}
        {showSocial && (
          <TouchableOpacity
            onPress={onOpenSocial}
            activeOpacity={0.8}
            style={{ zIndex: 50 }}
            className="absolute top-6 right-4 items-center"
          >
            <LinearGradient
              {...fireGradient}
              className="w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-black/60 border-2 border-white/20"
            >
              <Users color="white" size={28} fill="white" />
            </LinearGradient>
            <View className="bg-black/80 px-3 py-1 rounded-full mt-[-10px] border border-white/20">
              <Text className="text-white text-xs font-bold">
                +{attendeesCount}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* --- FULL SCREEN MODAL --- */}
      <Modal
        visible={isFullScreen}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setIsFullScreen(false)}
      >
        <View className="flex-1 bg-black">
          <StatusBar hidden />

          {/* Close Button */}
          <TouchableOpacity
            onPress={() => setIsFullScreen(false)}
            className="absolute top-12 right-6 z-50 bg-black/50 p-2 rounded-full"
          >
            <X color="white" size={28} />
          </TouchableOpacity>

          {/* Mute Toggle (Optional for UX) */}
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

          {/* Carousel Content */}
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

          {/* Bottom Button Only (No Title/Host) */}
          <View className="absolute bottom-10 left-6 right-6">
            <TouchableOpacity
              onPress={() => {
                setIsFullScreen(false); // Close modal first? Or go straight to event?
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
