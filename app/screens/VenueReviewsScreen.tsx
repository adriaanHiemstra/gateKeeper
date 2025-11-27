import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import {
  ArrowLeft,
  Star,
  MessageCircle,
  ThumbsUp,
  PenLine,
  Send,
  MoreHorizontal,
} from "lucide-react-native";

// Components
import TopBanner from "../components/TopBanner";
import BottomNav from "../components/BottomNav";

// Styles
import {
  bannerGradient,
  fireGradient,
  electricGradient,
} from "../styles/colours";
import { RootStackParamList } from "../types/types";

// --- MOCK DATA ---
const REVIEWS_DATA = [
  {
    id: "1",
    user: "Sarah Jenkins",
    rating: 5,
    date: "2 days ago",
    text: "Best sound system in the city! The staff are super friendly too.",
    likes: 12,
  },
  {
    id: "2",
    user: "Mike Thompson",
    rating: 4,
    date: "1 week ago",
    text: "Great vibe but drinks are a bit pricey.",
    likes: 5,
  },
  {
    id: "3",
    user: "Jessica Lee",
    rating: 5,
    date: "2 weeks ago",
    text: "Always a good time here. Highly recommend for techno nights.",
    likes: 8,
  },
];

const COMMENTS_DATA = [
  {
    id: "101",
    user: "David Miller",
    date: "10m ago",
    text: "Is there a dress code for tonight?",
    replies: 2,
  },
  {
    id: "102",
    user: "Amanda Cole",
    date: "1h ago",
    text: "Does anyone know if they have a coat check?",
    replies: 1,
  },
];

type VenueReviewsRouteProp = RouteProp<RootStackParamList, "VenueReviews">;

const VenueReviewsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<VenueReviewsRouteProp>();
  const { venueName = "Venue" } = route.params || {};

  const [activeTab, setActiveTab] = useState<"reviews" | "discussion">(
    "reviews"
  );
  const [commentText, setCommentText] = useState("");

  const handlePostComment = () => {
    if (!commentText.trim()) return;
    Alert.alert("Posted", "Your comment has been added!");
    setCommentText("");
  };

  const handleWriteReview = () => {
    Alert.alert("Write Review", "Opens review modal...");
  };

  // Helper: Star Rating
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

  // 1. REVIEW CARD
  const ReviewCard = ({ item }: { item: any }) => (
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

      <TouchableOpacity className="flex-row items-center self-start">
        <ThumbsUp color="#aaa" size={14} className="mr-1" />
        <Text className="text-gray-500 text-xs font-bold">
          Helpful ({item.likes})
        </Text>
      </TouchableOpacity>
    </View>
  );

  // 2. COMMENT CARD
  const CommentCard = ({ item }: { item: any }) => (
    <View className="mb-4 bg-white/5 border border-white/10 rounded-2xl p-4">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-row items-center">
          <View className="w-10 h-10 bg-orange-500/20 rounded-full items-center justify-center border border-white/10 mr-3">
            <Text className="text-orange-300 font-bold text-lg">
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

      <View className="flex-row gap-4">
        <TouchableOpacity className="flex-row items-center">
          <MessageCircle color="#aaa" size={16} className="mr-1" />
          <Text className="text-gray-400 text-xs font-bold">
            {item.replies} Replies
          </Text>
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
      <TopBanner />

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
                <Text className="text-gray-400 text-sm">{venueName}</Text>
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
                  Reviews (120)
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
                  Discussion (24)
                </Text>
              </TouchableOpacity>
            </View>

            {/* CONTENT AREA */}
            {activeTab === "reviews" ? (
              <>
                {/* Score Card */}
                <LinearGradient
                  colors={["#2e1065", "#000"]} // Darker purple for user theme
                  className="w-full rounded-2xl p-6 mb-8 border border-white/10 flex-row justify-between items-center"
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
                    <Text className="text-white/60 text-xs mt-1">
                      Based on 120 reviews
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={handleWriteReview}
                    className="bg-orange-500 p-4 rounded-full shadow-lg"
                  >
                    <PenLine color="white" size={24} />
                  </TouchableOpacity>
                </LinearGradient>

                {REVIEWS_DATA.map((review) => (
                  <ReviewCard key={review.id} item={review} />
                ))}
              </>
            ) : (
              <>
                <Text className="text-gray-400 text-xs font-bold uppercase mb-4 ml-1">
                  Recent Questions
                </Text>
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
                  placeholder="Ask a question..."
                  placeholderTextColor="#666"
                  value={commentText}
                  onChangeText={setCommentText}
                  className="flex-1 text-white font-medium h-full mr-2"
                />
                <TouchableOpacity
                  onPress={handlePostComment}
                  className="bg-orange-500 p-2 rounded-full"
                >
                  <Send color="white" size={16} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
      <BottomNav />
    </View>
  );
};

export default VenueReviewsScreen;
