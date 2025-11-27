import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Share,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowLeft,
  Share2,
  Instagram,
  Copy,
  Zap,
  Users,
  TrendingUp,
  CheckCircle,
} from "lucide-react-native";

// Components
import HostTopBanner from "../../components/HostTopBanner";
import HostBottomNav from "../../components/HostBottomNav";

// Styles
import { bannerGradient, electricGradient } from "../../styles/colours";

const { width } = Dimensions.get("window");

const PromoteEventScreen = () => {
  const navigation = useNavigation();
  const [isBoosted, setIsBoosted] = useState(false);

  // Mock Share Function
  const handleShare = async () => {
    try {
      await Share.share({
        message:
          "Join us at Summer Slam 2025! Get your tickets here: https://gatekeeper.com/e/summer-slam",
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleBoost = () => {
    Alert.alert(
      "Confirm Boost",
      "Spend R 500 to feature this event on the Home Screen for 24 hours?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Pay R 500",
          onPress: () => {
            setIsBoosted(true);
            Alert.alert("Success", "Your event is now featured!");
          },
        },
      ]
    );
  };

  const handlePushBlast = () => {
    Alert.alert("Notify Followers", "Blast sent to 1,240 followers!");
  };

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <View className="absolute inset-0 bg-black/40" />

      <HostTopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 120, paddingBottom: 140 }}
        >
          {/* HEADER */}
          <View className="flex-row items-center mb-8">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mr-4 bg-white/10 p-2 rounded-full"
            >
              <ArrowLeft color="white" size={24} />
            </TouchableOpacity>
            <View>
              <Text className="text-white/60 text-sm uppercase font-bold tracking-widest">
                Marketing
              </Text>
              <Text
                className="text-white text-3xl font-bold"
                style={{ fontFamily: "Jost-Medium" }}
              >
                Promote Event
              </Text>
            </View>
          </View>

          {/* 1. THE SHARE CARD (Preview) */}
          <Text className="text-white text-xl font-bold mb-4">
            Social Share
          </Text>
          <View className="items-center mb-8">
            <View
              className="bg-white rounded-3xl overflow-hidden shadow-2xl shadow-black/80"
              style={{ width: width * 0.7, height: width * 0.9 }} // Poster aspect ratio
            >
              <Image
                source={require("../../assets/imagePlaceHolder1.png")}
                className="w-full h-[70%]"
                resizeMode="cover"
              />
              <View className="flex-1 bg-black p-4 justify-center items-center">
                <Text className="text-white font-bold text-xl mb-1 text-center">
                  SUMMER SLAM
                </Text>
                <Text className="text-purple-400 font-bold text-sm mb-2">
                  28 OCT • CLIFTON
                </Text>
                <View className="bg-white px-4 py-2 rounded-full">
                  <Text className="text-black font-bold text-xs">
                    GET TICKETS
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Social Action Buttons */}
          <View className="flex-row gap-3 mb-10">
            <TouchableOpacity
              onPress={handleShare}
              className="flex-1 bg-white/10 border border-white/10 py-4 rounded-xl items-center justify-center"
            >
              <Share2 color="white" size={24} className="mb-2" />
              <Text className="text-white font-bold">Share</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-1 bg-pink-600/20 border border-pink-500/50 py-4 rounded-xl items-center justify-center">
              <Instagram color="#ec4899" size={24} className="mb-2" />
              <Text className="text-pink-400 font-bold">Stories</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Alert.alert("Copied", "Link copied to clipboard")}
              className="flex-1 bg-white/10 border border-white/10 py-4 rounded-xl items-center justify-center"
            >
              <Copy color="white" size={24} className="mb-2" />
              <Text className="text-white font-bold">Copy Link</Text>
            </TouchableOpacity>
          </View>

          {/* 2. DIRECT MARKETING (Push Blast) */}
          <Text className="text-white text-xl font-bold mb-4">
            Direct Marketing
          </Text>
          <View className="bg-white/5 border border-white/10 p-5 rounded-2xl mb-8 flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <View className="flex-row items-center mb-1">
                <Users color="white" size={18} className="mr-2" />
                <Text className="text-white font-bold text-lg">
                  Follower Blast
                </Text>
              </View>
              <Text className="text-gray-400 text-sm">
                Send a push notification to your 1,240 followers. (1 Free Blast
                left)
              </Text>
            </View>
            <TouchableOpacity
              onPress={handlePushBlast}
              className="bg-white px-4 py-2 rounded-full"
            >
              <Text className="text-black font-bold">SEND</Text>
            </TouchableOpacity>
          </View>

          {/* 3. PAID BOOST (Upsell) */}
          <Text className="text-white text-xl font-bold mb-4">
            Paid Promotion
          </Text>
          <LinearGradient
            colors={isBoosted ? ["#059669", "#047857"] : ["#4338ca", "#3730a3"]} // Green if active, Indigo if not
            className="rounded-3xl p-1 relative overflow-hidden"
          >
            <View className="bg-[#121212] rounded-[22px] p-6">
              {/* Header */}
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-row items-center">
                  <View
                    className={`p-2 rounded-lg mr-3 ${
                      isBoosted ? "bg-green-500/20" : "bg-yellow-500/20"
                    }`}
                  >
                    {isBoosted ? (
                      <CheckCircle color="#4ade80" size={24} />
                    ) : (
                      <Zap color="#FACC15" size={24} fill="#FACC15" />
                    )}
                  </View>
                  <View>
                    <Text className="text-white font-bold text-xl">
                      {isBoosted ? "Event is Boosted!" : "Boost Event"}
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      {isBoosted
                        ? "Expires in 23h 10m"
                        : "Get 10x more visibility"}
                    </Text>
                  </View>
                </View>
                {!isBoosted && (
                  <View className="bg-white/10 px-3 py-1 rounded-md">
                    <Text className="text-white font-bold">R 500</Text>
                  </View>
                )}
              </View>

              {/* Stats/Benefits */}
              <View className="flex-row gap-4 mb-6">
                <View className="flex-row items-center">
                  <TrendingUp
                    color={isBoosted ? "#4ade80" : "#FACC15"}
                    size={16}
                    className="mr-2"
                  />
                  <Text className="text-gray-300 text-sm">
                    Featured on Home
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Users
                    color={isBoosted ? "#4ade80" : "#FACC15"}
                    size={16}
                    className="mr-2"
                  />
                  <Text className="text-gray-300 text-sm">Top of Search</Text>
                </View>
              </View>

              {/* Button */}
              <TouchableOpacity activeOpacity={0.8} disabled={isBoosted}>
                <LinearGradient
                  {...electricGradient}
                  colors={
                    isBoosted ? ["#065f46", "#064e3b"] : ["#B92BFF", "#6500B0"]
                  } // Dark green if boosted
                  className="w-full py-3 rounded-xl items-center justify-center"
                >
                  <Text className="text-white font-bold text-lg tracking-wide">
                    {isBoosted ? "BOOST ACTIVE" : "BOOST NOW"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ScrollView>
      </SafeAreaView>
      <HostBottomNav />
    </View>
  );
};

export default PromoteEventScreen;
