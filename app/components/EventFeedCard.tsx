import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  ImageSourcePropType,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Users, Heart, X } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

// Styles
import { fireGradient } from "../styles/colours";

const { width } = Dimensions.get("window");
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
  disableTap?: boolean; // 👈 NEW PROP: Disables the expansion gesture
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
  disableTap = false, // Default is enabled (for Home Feed)
}: EventFeedCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);

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

  // Gesture: Single Tap
  // 👇 FIX: We disable this gesture if 'disableTap' is passed
  const singleTap = Gesture.Tap()
    .enabled(!disableTap)
    .onStart(() => {
      runOnJS(setFullScreen)(true);
    });

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: Math.max(scale.value, 0) }],
    opacity: opacity.value,
  }));

  return (
    <>
      <View
        className="mb-2 bg-black relative"
        style={{ height: CARD_HEIGHT, width: width }}
      >
        {/* 1. Background Image */}
        <Image
          source={image}
          className="w-full h-full absolute"
          resizeMode="cover"
        />

        {/* 2. Pop-up Heart Animation */}
        <View className="absolute inset-0 justify-center items-center z-10 pointer-events-none">
          <Animated.View style={heartStyle}>
            <Heart color="#FA8900" size={100} fill="#FA8900" />
          </Animated.View>
        </View>

        {/* 3. TOUCH ZONE (Top 75%) */}
        <GestureDetector gesture={singleTap}>
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "75%",
              zIndex: 20,
              backgroundColor: "transparent",
            }}
          />
        </GestureDetector>

        {/* 4. BOTTOM CONTROLS */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.9)"]}
          className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-32 justify-end z-30"
          pointerEvents="box-none"
        >
          <Text
            className="text-white text-5xl font-bold mb-3 leading-tight shadow-black"
            style={{ fontFamily: "Jost-Medium" }}
          >
            {title}
          </Text>

          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={onPressHost}
              className="flex-row items-center"
              activeOpacity={0.8}
            >
              <Image
                source={hostAvatar}
                className="w-12 h-12 rounded-full border-2 border-orange-500 mr-3"
              />
              <View>
                <Text className="text-gray-300 text-xs font-bold uppercase tracking-wider shadow-black">
                  Hosted By
                </Text>
                <Text
                  className="text-white text-xl font-bold shadow-black"
                  style={{ fontFamily: "Jost-Medium" }}
                >
                  {hostName}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLike}
              className="bg-white/20 p-3 rounded-full backdrop-blur-md"
              activeOpacity={0.6}
            >
              <Heart
                color={isLiked ? "#FA8900" : "white"}
                fill={isLiked ? "#FA8900" : "none"}
                size={28}
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* 5. SOCIAL BUTTON */}
        {showSocial && (
          <TouchableOpacity
            onPress={onOpenSocial}
            activeOpacity={0.8}
            style={{ zIndex: 50 }}
            className="absolute top-6 right-4 items-center"
          >
            <LinearGradient
              {...fireGradient}
              className="w-20 h-20 rounded-full items-center justify-center shadow-lg shadow-black/60 border-2 border-white/20"
            >
              <Users color="white" size={32} fill="white" />
            </LinearGradient>
            <View className="bg-black/80 px-3 py-1 rounded-full mt-[-12px] border border-white/20">
              <Text className="text-white text-xs font-bold">
                +{attendeesCount}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* INTERNAL MODAL (Only used if disableTap is false) */}
      <Modal
        visible={fullScreen}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setFullScreen(false)}
      >
        <View className="flex-1 bg-black relative">
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setFullScreen(false)}
            className="flex-1"
          >
            <Image
              source={image}
              className="w-full h-full opacity-80"
              resizeMode="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFullScreen(false)}
            className="absolute top-12 right-6 bg-black/50 p-2 rounded-full"
          >
            <X color="white" size={32} />
          </TouchableOpacity>

          <View className="absolute bottom-12 left-0 right-0 px-6">
            <TouchableOpacity
              onPress={() => {
                setFullScreen(false);
                onViewEvent();
              }}
              activeOpacity={0.9}
              className="w-full shadow-lg shadow-orange-500/30"
            >
              <LinearGradient
                {...fireGradient}
                className="w-full py-5 rounded-full items-center justify-center"
              >
                <Text
                  className="text-white text-2xl font-bold tracking-wide"
                  style={{ fontFamily: "Jost-Medium" }}
                >
                  VIEW EVENT
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default EventFeedCard;
