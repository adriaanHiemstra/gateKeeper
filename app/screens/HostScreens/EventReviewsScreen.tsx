import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowLeft,
  Star,
  MessageCircle,
  ThumbsUp,
  Reply,
  Send,
  MoreHorizontal,
} from "lucide-react-native";

// Components
import HostTopBanner from "../../components/HostTopBanner";
import HostBottomNav from "../../components/HostBottomNav";

// Styles
import { bannerGradient, electricGradient } from "../../styles/colours";

// --- MOCK DATA ---
const REVIEWS_DATA = [
  {
    id: "1",
    user: "Sarah Jenkins",
    rating: 5,
    date: "2h ago",
    text: "Absolutely insane energy! Best production I have seen in Cape Town this year. 🔥",
    replies: [],
  },
  {
    id: "2",
    user: "Mike Thompson",
    rating: 4,
    date: "5h ago",
    text: "Great vibes but the bar queue was a bit long. Otherwise 10/10.",
    replies: ["Thanks Mike! We are doubling the bar staff for next time."],
  },
  {
    id: "3",
    user: "Jessica Lee",
    rating: 5,
    date: "1d ago",
    text: "Take my money for the next one immediately.",
    replies: [],
  },
];

const COMMENTS_DATA = [
  {
    id: "101",
    user: "David Miller",
    date: "10m ago",
    text: "Is there parking available at the venue?",
    replies: [],
  },
  {
    id: "102",
    user: "Amanda Cole",
    date: "30m ago",
    text: "Does anyone have 2 extra VIP tickets?? 🙏",
    replies: [],
  },
  {
    id: "103",
    user: "Ryan Ziglar",
    date: "1h ago",
    text: "So hyped for this lineup! lets gooooo",
    replies: ["See you on the dancefloor Ryan!"],
  },
];

const EventReviewsScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<"reviews" | "discussion">(
    "reviews"
  );
  const [replyText, setReplyText] = useState("");

  // Helper: Star Rating Component
  const StarRating = ({ rating }: { rating: number }) => (
    <View className="flex-row">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          color={star <= rating ? "#FACC15" : "#4B5563"}
          fill={star <= rating ? "#FACC15" : "none"}
          className="mr-1"
        />
      ))}
    </View>
  );

  // 1. REVIEW CARD (Includes Stars)
  const ReviewCard = ({ item }: { item: any }) => (
    <View className="mb-4 bg-white/5 border border-white/10 rounded-2xl p-4">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-row items-center">
          <View className="w-10 h-10 bg-purple-500/20 rounded-full items-center justify-center border border-white/10 mr-3">
            <Text className="text-purple-300 font-bold text-lg">
              {item.user.charAt(0)}
            </Text>
          </View>
          <View>
            <Text className="text-white font-bold text-base">{item.user}</Text>
            <View className="flex-row items-center mt-1">
              <StarRating rating={item.rating} />
              <Text className="text-gray-500 text-xs ml-2">{item.date}</Text>
            </View>
          </View>
        </View>
        <View className="bg-white/5 px-2 py-1 rounded-md">
          <Text className="text-white text-xs font-bold">{item.rating}.0</Text>
        </View>
      </View>

      <Text className="text-gray-300 text-sm leading-5 mb-4">{item.text}</Text>

      {item.replies.length > 0 && (
        <View className="bg-purple-500/10 border-l-2 border-purple-500 p-3 rounded-r-lg mb-3">
          <Text className="text-purple-300 text-xs font-bold mb-1">
            You replied:
          </Text>
          <Text className="text-gray-400 text-xs italic">
            "{item.replies[0]}"
          </Text>
        </View>
      )}

      <View className="flex-row gap-3 border-t border-white/5 pt-3">
        <TouchableOpacity className="flex-row items-center bg-white/5 px-3 py-2 rounded-full">
          <Reply color="white" size={14} className="mr-2" />
          <Text className="text-white text-xs font-bold">Reply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // 2. COMMENT CARD (No Stars, more chat-like)
  const CommentCard = ({ item }: { item: any }) => (
    <View className="mb-4 bg-white/5 border border-white/10 rounded-2xl p-4">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-row items-center">
          <View className="w-10 h-10 bg-blue-500/20 rounded-full items-center justify-center border border-white/10 mr-3">
            <Text className="text-blue-300 font-bold text-lg">
              {item.user.charAt(0)}
            </Text>
          </View>
          <View>
            <Text className="text-white font-bold text-base">{item.user}</Text>
            <Text className="text-gray-500 text-xs mt-1">{item.date}</Text>
          </View>
        </View>
        <TouchableOpacity>
          <MoreHorizontal color="#666" size={20} />
        </TouchableOpacity>
      </View>

      <Text className="text-white text-base leading-6 mb-3">{item.text}</Text>

      {item.replies.length > 0 && (
        <View className="bg-blue-500/10 border-l-2 border-blue-500 p-3 rounded-r-lg mb-3 ml-4">
          <View className="flex-row items-center mb-1">
            <View className="w-4 h-4 bg-purple-500 rounded-full mr-2" />
            <Text className="text-purple-300 text-xs font-bold">Host</Text>
          </View>
          <Text className="text-gray-300 text-sm">"{item.replies[0]}"</Text>
        </View>
      )}

      <View className="flex-row gap-4">
        <TouchableOpacity className="flex-row items-center">
          <Reply color="#aaa" size={16} className="mr-1" />
          <Text className="text-gray-400 text-xs font-bold">Reply</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center">
          <ThumbsUp color="#aaa" size={16} className="mr-1" />
          <Text className="text-gray-400 text-xs font-bold">Like</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <View className="absolute inset-0 bg-black/40" />
      <HostTopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            className="flex-1 px-6"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 120, paddingBottom: 140 }}
          >
            {/* Header */}
            <View className="flex-row items-center mb-6">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="mr-4 bg-white/10 p-2 rounded-full"
              >
                <ArrowLeft color="white" size={24} />
              </TouchableOpacity>
              <View>
                <Text
                  className="text-white text-3xl font-bold"
                  style={{ fontFamily: "Jost-Medium" }}
                >
                  Community
                </Text>
                <Text className="text-gray-400 text-sm">Summer Slam 2025</Text>
              </View>
            </View>

            {/* TAB SWITCHER */}
            <View className="flex-row bg-white/10 p-1 rounded-xl mb-6">
              <TouchableOpacity
                onPress={() => setActiveTab("reviews")}
                className={`flex-1 py-3 rounded-lg items-center justify-center ${
                  activeTab === "reviews" ? "bg-white/20" : "bg-transparent"
                }`}
              >
                <Text
                  className={`text-sm font-bold ${
                    activeTab === "reviews" ? "text-white" : "text-gray-400"
                  }`}
                >
                  Reviews (128)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab("discussion")}
                className={`flex-1 py-3 rounded-lg items-center justify-center ${
                  activeTab === "discussion" ? "bg-white/20" : "bg-transparent"
                }`}
              >
                <Text
                  className={`text-sm font-bold ${
                    activeTab === "discussion" ? "text-white" : "text-gray-400"
                  }`}
                >
                  Discussion (45)
                </Text>
              </TouchableOpacity>
            </View>

            {/* CONTENT AREA */}
            {activeTab === "reviews" ? (
              <>
                {/* Score Card (Only visible in Reviews tab) */}
                <LinearGradient
                  {...electricGradient}
                  className="w-full rounded-2xl p-6 mb-8 shadow-lg shadow-purple-900/50 flex-row justify-between items-center"
                >
                  <View>
                    <Text className="text-white/80 font-medium text-lg mb-1">
                      Overall Rating
                    </Text>
                    <View className="flex-row items-end">
                      <Text className="text-white text-5xl font-bold mr-2">
                        4.8
                      </Text>
                      <Text className="text-white/60 text-xl mb-1 font-bold">
                        / 5.0
                      </Text>
                    </View>
                  </View>
                  <View className="bg-white/20 p-4 rounded-full border border-white/10">
                    <Star color="#FACC15" size={40} fill="#FACC15" />
                  </View>
                </LinearGradient>

                {REVIEWS_DATA.map((review) => (
                  <ReviewCard key={review.id} item={review} />
                ))}
              </>
            ) : (
              <>
                {/* Discussion List */}
                {COMMENTS_DATA.map((comment) => (
                  <CommentCard key={comment.id} item={comment} />
                ))}
              </>
            )}
          </ScrollView>

          {/* QUICK REPLY BAR (Visible in Discussion Tab) */}
          {activeTab === "discussion" && (
            <View className="absolute bottom-24 left-0 right-0 px-4 py-3 bg-[#121212] border-t border-white/10">
              <View className="flex-row items-center bg-white/10 rounded-full px-4 h-12 border border-white/10">
                <TextInput
                  placeholder="Reply to community..."
                  placeholderTextColor="#666"
                  value={replyText}
                  onChangeText={setReplyText}
                  className="flex-1 text-white font-medium h-full mr-2"
                />
                <TouchableOpacity className="bg-purple-500 p-2 rounded-full">
                  <Send color="white" size={16} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
      <HostBottomNav />
    </View>
  );
};

export default EventReviewsScreen;
