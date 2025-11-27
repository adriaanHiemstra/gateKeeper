import React, { useEffect } from "react";
import {
  View,
  Text,
  Image,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { X, MapPin, Clock, ArrowRight } from "lucide-react-native";

import { fireGradient, bannerGradient } from "../styles/colours";

const { height } = Dimensions.get("window");

type MapCardProps = {
  event: any;
  onClose: () => void;
  onViewEvent: () => void;
};

const MapCard = ({ event, onClose, onViewEvent }: MapCardProps) => {
  const translateY = useSharedValue(height);

  useEffect(() => {
    translateY.value = withTiming(0, {
      duration: 350,
      easing: Easing.out(Easing.exp),
    });
  }, [event]);

  const closeCard = () => {
    translateY.value = withTiming(
      height,
      {
        duration: 300,
        easing: Easing.in(Easing.quad),
      },
      () => {
        runOnJS(onClose)();
      }
    );
  };

  const pan = Gesture.Pan()
    .onChange((e) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 100) runOnJS(closeCard)();
      else translateY.value = withTiming(0, { duration: 200 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!event) return null;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[animatedStyle]}
        className="absolute bottom-0 left-0 right-0 bg-[#121212] rounded-t-3xl shadow-2xl shadow-black border-t border-white/10 z-50 pb-8"
      >
        <View className="w-full items-center pt-3 pb-2">
          <View className="w-12 h-1.5 bg-white/20 rounded-full" />
        </View>

        <TouchableOpacity
          onPress={closeCard}
          className="absolute top-4 right-4 bg-white/10 p-1.5 rounded-full"
        >
          <X color="#ccc" size={20} />
        </TouchableOpacity>

        <View className="px-6 pt-2">
          <View className="flex-row items-center mb-4">
            <Image
              source={event.image}
              className="w-20 h-20 rounded-xl mr-4"
              resizeMode="cover"
            />
            <View className="flex-1">
              <Text
                className="text-white text-2xl font-bold leading-tight mb-1"
                style={{ fontFamily: "Jost-Medium" }}
              >
                {event.title}
              </Text>
              <View className="flex-row items-center">
                <Clock color="#FA8900" size={14} className="mr-1" />
                <Text className="text-gray-400 text-sm">{event.time}</Text>
              </View>
              <View className="flex-row items-center mt-1">
                <MapPin color="#FA8900" size={14} className="mr-1" />
                <Text className="text-gray-400 text-sm">{event.location}</Text>
              </View>
            </View>
          </View>

          <Text
            className="text-gray-300 text-sm mb-6 leading-5"
            numberOfLines={2}
          >
            {event.description}
          </Text>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onViewEvent}
            className="w-full shadow-lg shadow-orange-500/20"
          >
            <LinearGradient
              {...fireGradient}
              className="w-full py-4 rounded-xl flex-row items-center justify-center"
            >
              <Text
                className="text-white font-bold text-lg mr-2"
                style={{ fontFamily: "Jost-Medium" }}
              >
                VIEW EVENT
              </Text>
              <ArrowRight color="white" size={20} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View className="h-20" />
      </Animated.View>
    </GestureDetector>
  );
};

export default MapCard;
