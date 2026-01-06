// app/components/PostFeedCard.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  Pressable,
  Modal,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowRight,
  MessageCircle,
  Bell,
  MoreHorizontal,
  Users,
  X,
  Volume2,
  VolumeX,
} from "lucide-react-native";
import {
  Video,
  ResizeMode,
  Audio,
  InterruptionModeIOS,
  InterruptionModeAndroid,
} from "expo-av";
import { fireGradient } from "../styles/colours";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("screen");
const CARD_HEIGHT = SCREEN_WIDTH * 1.5;

type PostFeedCardProps = {
  id: string;
  caption: string;
  image: string | null;
  eventTitle: string;
  hostName: string;
  hostAvatar: string | null;
  timestamp: string;
  attendeesCount: number;
  onOpenSocial: () => void;
  onViewEvent: () => void;
  onOpenDiscussion: () => void;
};

const PostFeedCard = ({
  caption,
  image,
  eventTitle,
  hostName,
  hostAvatar,
  timestamp,
  attendeesCount,
  onOpenSocial,
  onViewEvent,
  onOpenDiscussion,
}: PostFeedCardProps) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const isVideo = image?.includes(".mp4") || image?.includes(".mov");

  // ✅ AUDIO FIX: Allow mixing so background music (Spotify) keeps playing
  useEffect(() => {
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          // 👇 These two lines stop the app from killing Spotify
          interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          shouldDuckAndroid: true,
        });
      } catch (e) {
        console.warn("Audio config error:", e);
      }
    };
    configureAudio();
  }, []);

  const openFullScreen = () => {
    setIsMuted(false);
    setIsFullScreen(true);
  };

  const renderMedia = (
    resize: ResizeMode,
    shouldPlay: boolean,
    muted: boolean
  ) => {
    if (image && isVideo) {
      return (
        <Video
          source={{ uri: image }}
          style={{ width: "100%", height: "100%", position: "absolute" }}
          resizeMode={resize}
          isLooping
          shouldPlay={shouldPlay}
          isMuted={muted}
        />
      );
    }
    return (
      <Image
        source={
          image ? { uri: image } : require("../assets/event-placeholder.png")
        }
        className="w-full h-full absolute"
        resizeMode={resize === ResizeMode.CONTAIN ? "contain" : "cover"}
      />
    );
  };

  return (
    <>
      <View
        className="mb-2 bg-black relative rounded-[32px] overflow-hidden mx-1 shadow-xl shadow-black"
        style={{ height: CARD_HEIGHT, width: SCREEN_WIDTH - 8 }}
      >
        {/* ✅ TAP FIX: Removed double-tap like. Single tap anywhere opens full screen. */}
        <Pressable
          onPress={openFullScreen}
          style={{ flex: 1, backgroundColor: "#111" }}
        >
          {renderMedia(ResizeMode.COVER, true, true)}
        </Pressable>

        {/* HEADER */}
        <View className="absolute top-4 left-4 right-4 flex-row justify-between items-start">
          <View className="bg-purple-600/90 px-3 py-1.5 rounded-full flex-row items-center border border-white/20 shadow-lg backdrop-blur-md">
            <Bell size={12} color="white" fill="white" className="mr-1.5" />
            <Text className="text-white text-[10px] font-bold tracking-widest uppercase">
              Update
            </Text>
          </View>

          <TouchableOpacity
            onPress={onOpenSocial}
            activeOpacity={0.8}
            className="items-center"
          >
            <LinearGradient
              {...fireGradient}
              className="w-12 h-12 rounded-full items-center justify-center shadow-lg shadow-black/60 border-2 border-white/20"
            >
              <Users color="white" size={20} fill="white" />
            </LinearGradient>
            <View className="bg-black/80 px-2 py-0.5 rounded-full mt-[-8px] border border-white/20">
              <Text className="text-white text-[10px] font-bold">
                +{attendeesCount}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* BOTTOM CONTENT */}
        {/* ✅ POINTER EVENTS FIX: 'box-none' lets taps pass through the transparent parts */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.95)"]}
          className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-32 justify-end"
          pointerEvents="box-none"
        >
          <TouchableOpacity
            onPress={onViewEvent}
            className="mb-2 flex-row items-center"
          >
            <Text className="text-purple-300 font-bold text-xs uppercase tracking-wider mr-1">
              Event:
            </Text>
            <Text className="text-white font-bold text-sm underline decoration-purple-400">
              {eventTitle}
            </Text>
          </TouchableOpacity>

          <Text
            className="text-white text-2xl font-medium mb-4 leading-8 shadow-black"
            numberOfLines={3}
            style={{ fontFamily: "Jost-Medium" }}
          >
            {caption}
          </Text>

          <View className="flex-row items-center justify-between mb-5">
            <View className="flex-row items-center">
              <Image
                source={
                  hostAvatar
                    ? { uri: hostAvatar }
                    : require("../assets/profile-pic-1.png")
                }
                className="w-10 h-10 rounded-full border-2 border-purple-500 mr-3"
              />
              <View>
                <Text className="text-white text-base font-bold">
                  {hostName || "Host"}
                </Text>
                <Text className="text-white/60 text-xs font-medium">
                  {timestamp}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              className="bg-white/10 p-3 rounded-full backdrop-blur-md"
              onPress={onOpenDiscussion}
            >
              <MessageCircle color="white" size={22} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={onViewEvent}
            activeOpacity={0.9}
            className="w-full"
          >
            <LinearGradient
              {...fireGradient}
              className="w-full py-4 rounded-2xl flex-row items-center justify-center border border-white/10"
            >
              <Text
                className="text-white text-lg font-bold tracking-wide mr-2"
                style={{ fontFamily: "Jost-Medium" }}
              >
                VIEW EVENT
              </Text>
              <ArrowRight color="white" size={18} strokeWidth={2.5} />
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
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

          <TouchableOpacity
            onPress={() => setIsFullScreen(false)}
            className="absolute top-12 right-6 z-50 bg-black/50 p-2 rounded-full"
          >
            <X color="white" size={28} />
          </TouchableOpacity>

          {isVideo && (
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
          )}

          <View className="flex-1 justify-center items-center">
            {renderMedia(ResizeMode.CONTAIN, true, isMuted)}
          </View>

          <View className="absolute bottom-10 left-6 right-6">
            <Text className="text-white text-lg font-medium mb-4 text-center">
              {caption}
            </Text>
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

export default PostFeedCard;
