import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  ImageSourcePropType,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Users, Heart, ArrowRight } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from "react-native-reanimated";

// Styles
import { fireGradient } from "../styles/colours";

const { width } = Dimensions.get("screen");
const CARD_HEIGHT = width * 1.35;

type EventFeedCardProps = {
  id: string;
  title: string;
  hostName: string;
  hostAvatar: ImageSourcePropType;
  image: ImageSourcePropType;
  attendeesCount: number;
  onOpenSocial: () => void;
  onPressHost: () => void;
  onViewEvent: () => void;
  showSocial?: boolean;
  disableTap?: boolean; // Unused now, but kept for compatibility
};

const EventFeedCard = ({
  id,
  title,
  hostName,
  hostAvatar,
  image,
  attendeesCount,
  onOpenSocial,
  onPressHost,
  onViewEvent,
  showSocial = true,
}: EventFeedCardProps) => {
  const [isLiked, setIsLiked] = useState(false);

  // Animation Values (Heart Pop only)
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

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

  return (
    <View
      className="mb-2 bg-red-500 relative"
      style={{ height: CARD_HEIGHT, width: width }}
    >
      {/* 1. Main Image Area */}
      <View className="flex-1 relative justify-center items-center">
        <Image
          source={image}
          className="w-full h-full absolute"
          resizeMode="cover"
        />

        {/* Pop-up Heart Animation (Visual Only) */}
        <View className="absolute inset-0 justify-center items-center z-10 pointer-events-none">
          <Animated.View style={heartStyle}>
            <Heart color="#FA8900" size={100} fill="#FA8900" />
          </Animated.View>
        </View>

        {/* Bottom Gradient Overlay */}
        <LinearGradient
          colors={[
            "transparent",
            "rgba(0,0,0,0.2)",
            "rgba(0,0,0,0.6)",
            "rgba(0,0,0,0.95)",
          ]}
          className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-32 justify-end z-20"
        >
          {/* Title */}
          <TouchableOpacity onPress={onViewEvent} activeOpacity={0.8}>
            <Text
              className="text-white text-4xl font-bold mb-3 leading-tight shadow-black"
              style={{ fontFamily: "Jost-Medium" }}
            >
              {title}
            </Text>
          </TouchableOpacity>

          {/* Host Info Row */}
          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity
              onPress={onPressHost}
              className="flex-row items-center"
              activeOpacity={0.8}
            >
              <Image
                source={hostAvatar}
                className="w-10 h-10 rounded-full border-2 border-orange-500 mr-3"
              />
              <View>
                <Text className="text-gray-300 text-xs font-bold uppercase tracking-wider shadow-black">
                  Hosted By
                </Text>
                <Text
                  className="text-white text-lg font-bold shadow-black"
                  style={{ fontFamily: "Jost-Medium" }}
                >
                  {hostName}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Like Button */}
            <TouchableOpacity
              onPress={handleLike}
              className="bg-white/20 p-3 rounded-full backdrop-blur-md"
              activeOpacity={0.6}
            >
              <Heart
                color={isLiked ? "#FA8900" : "white"}
                fill={isLiked ? "#FA8900" : "none"}
                size={24}
              />
            </TouchableOpacity>
          </View>

          {/* VIEW EVENT BUTTON (Always Visible) */}
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
      </View>

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
  );
};

export default EventFeedCard;
