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
  MessageCircle,
  ThumbsUp,
  Send,
  MoreHorizontal,
} from "lucide-react-native";

// Components
import TopBanner from "../components/TopBanner";
import BottomNav from "../components/BottomNav";

// Styles
import { bannerGradient, fireGradient } from "../styles/colours";
import { RootStackParamList } from "../types/types";

// Mock Data
const COMMENTS_DATA = [
  {
    id: "101",
    user: "David Miller",
    date: "10m ago",
    text: "Is there parking available at the venue?",
    replies: 2,
  },
  {
    id: "102",
    user: "Amanda Cole",
    date: "30m ago",
    text: "Does anyone have 2 extra VIP tickets?? 🙏",
    replies: 1,
  },
  {
    id: "103",
    user: "Ryan Ziglar",
    date: "1h ago",
    text: "So hyped for this lineup! lets gooooo",
    replies: 0,
  },
];

type RouteProps = RouteProp<RootStackParamList, "EventDiscussion">;

const EventDiscussionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { eventName } = route.params;

  const [commentText, setCommentText] = useState("");

  const handlePostComment = () => {
    if (!commentText.trim()) return;
    Alert.alert("Posted", "Your comment has been added!");
    setCommentText("");
  };

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
                  Discussion
                </Text>
                <Text className="text-gray-400 text-sm">{eventName}</Text>
              </View>
            </View>

            {/* Info Pill */}
            <View className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl mb-6 flex-row items-center">
              <MessageCircle color="#60A5FA" size={20} className="mr-3" />
              <Text className="text-blue-200 text-xs flex-1">
                Join the conversation! Ask questions or arrange meetups with
                other attendees.
              </Text>
            </View>

            {/* COMMENTS LIST */}
            <Text className="text-gray-400 text-xs font-bold uppercase mb-4 ml-1">
              Recent Activity
            </Text>
            {COMMENTS_DATA.map((comment) => (
              <CommentCard key={comment.id} item={comment} />
            ))}
          </ScrollView>

          {/* INPUT BAR */}
          <View className="absolute bottom-24 left-0 right-0 px-4 py-3 bg-[#121212] border-t border-white/10">
            <View className="flex-row items-center bg-white/10 rounded-full px-4 h-12 border border-white/10">
              <TextInput
                placeholder="Say something..."
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
        </KeyboardAvoidingView>
      </SafeAreaView>
      <BottomNav />
    </View>
  );
};

export default EventDiscussionScreen;
