// app/screens/EventCommunityScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import {
  ArrowLeft,
  Send,
  ShieldCheck,
  Pin,
  Trash2,
  MessageCircle,
} from "lucide-react-native";

// Backend
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

// Components & Styles
import HostTopBanner from "../components/HostTopBanner";
import HostBottomNav from "../components/HostBottomNav";
import { bannerGradient } from "../styles/colours";
import { RootStackParamList } from "../types/types";

type CommunityRouteProp = RouteProp<RootStackParamList, "EventCommunity">;

const EventCommunityScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<CommunityRouteProp>();
  const { eventId, eventTitle } = route.params || {
    eventId: "",
    eventTitle: "Event",
  };
  const { user } = useAuth();

  const [posts, setPosts] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [myProfile, setMyProfile] = useState<any>(null);

  // --- 1. INITIAL SETUP ---
  useEffect(() => {
    const setupScreen = async () => {
      if (!user || !eventId) return;

      const { data: eventData } = await supabase
        .from("events")
        .select("host_id")
        .eq("id", eventId)
        .single();
      if (eventData) setIsHost(eventData.host_id === user.id);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .single();
      if (profileData) setMyProfile(profileData);
    };
    setupScreen();
  }, [eventId, user]);

  // --- 2. FETCH POSTS ---
  const fetchPosts = useCallback(async () => {
    if (!eventId) return;
    try {
      const { data, error } = await supabase
        .from("event_community_posts")
        .select(`*, profiles:user_id ( username, avatar_url )`)
        .eq("event_id", eventId)
        // Note: We keep this 'descending' (Newest First).
        // Because the list is inverted, Index 0 (Newest) will appear at the BOTTOM.
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.log("Error fetching community:", err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchPosts();
    const subscription = supabase
      .channel("public:event_community_posts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "event_community_posts",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const newRecord = payload.new as any;
          if (newRecord && newRecord.user_id !== user?.id) {
            fetchPosts();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchPosts, eventId, user?.id]);

  // --- 3. SEND MESSAGE ---
  const handleSend = async () => {
    const textToSend = inputText.trim();
    if (!textToSend) return;
    setInputText("");

    const optimisticPost = {
      id: "temp-" + Date.now(),
      content: textToSend,
      created_at: new Date().toISOString(),
      is_pinned: false,
      is_staff_post: isHost,
      user_id: user?.id,
      profiles: {
        username: myProfile?.username || "Me",
        avatar_url: myProfile?.avatar_url || null,
      },
    };

    // Add to START of array (which is visually the BOTTOM in inverted list)
    setPosts((prevPosts) => [optimisticPost, ...prevPosts]);

    try {
      const { error } = await supabase.from("event_community_posts").insert({
        event_id: eventId,
        user_id: user?.id,
        content: textToSend,
        is_staff_post: isHost,
      });
      if (error) throw error;
      fetchPosts();
    } catch (error: any) {
      Alert.alert("Error", "Message failed to send.");
      setPosts((prev) => prev.filter((p) => p.id !== optimisticPost.id));
      setInputText(textToSend);
    }
  };

  // --- 4. DELETE POST ---
  const handleDelete = (id: string) => {
    Alert.alert("Delete Post", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setPosts((prev) => prev.filter((p) => p.id !== id));
          const { error } = await supabase
            .from("event_community_posts")
            .delete()
            .eq("id", id);
          if (error) fetchPosts();
        },
      },
    ]);
  };

  // --- 5. RENDER CARD ---
  const CommentCard = ({ item }: { item: any }) => {
    const isStaff = item.is_staff_post;
    const isOwner = item.user_id === user?.id;
    const isTemp = item.id.toString().startsWith("temp-");

    return (
      <View
        className={`mb-4 border rounded-2xl p-4 ${
          item.is_pinned
            ? "bg-purple-900/10 border-purple-500/30"
            : "bg-white/5 border-white/10"
        } ${isTemp ? "opacity-70" : "opacity-100"}`}
      >
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-row items-center">
            <Image
              source={
                item.profiles?.avatar_url
                  ? { uri: item.profiles.avatar_url }
                  : require("../assets/profile-pic-1.png")
              }
              className="w-10 h-10 rounded-full border border-white/10 mr-3 bg-gray-800"
            />
            <View>
              <View className="flex-row items-center">
                <Text className="text-white font-bold text-base mr-2">
                  {item.profiles?.username || "User"}
                </Text>
                {isStaff && (
                  <View className="bg-purple-600 px-1.5 py-0.5 rounded flex-row items-center">
                    <ShieldCheck size={10} color="white" className="mr-1" />
                    <Text className="text-white text-[10px] font-bold ml-1">
                      HOST
                    </Text>
                  </View>
                )}
                {item.is_pinned && (
                  <View className="flex-row items-center ml-2">
                    <Pin size={12} color="#D087FF" className="mr-1" />
                    <Text className="text-purple-300 text-[10px] font-bold">
                      PINNED
                    </Text>
                  </View>
                )}
              </View>
              <Text className="text-gray-500 text-xs mt-0.5">
                {isTemp
                  ? "Sending..."
                  : new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
          {!isTemp && (isHost || isOwner) && (
            <TouchableOpacity
              onPress={() => handleDelete(item.id)}
              className="p-2"
            >
              <Trash2 color="#666" size={16} />
            </TouchableOpacity>
          )}
        </View>
        <Text className="text-gray-200 text-base leading-6 mb-1">
          {item.content}
        </Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <View className="absolute inset-0 bg-black/40" />
      <HostTopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        {/* --- HEADER --- */}
        <View className="flex-row items-center px-6 pt-4 pb-4 border-b border-white/5 bg-[#121212]/50 z-10">
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
            <Text className="text-gray-400 text-sm" numberOfLines={1}>
              {eventTitle}
            </Text>
          </View>
        </View>

        {/* --- CONTENT + KEYBOARD HANDLING --- */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        >
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <CommentCard item={item} />}
            // ✅ CHANGE: Inverted = true makes it start from bottom
            inverted={true}
            contentContainerStyle={{
              paddingHorizontal: 24,
              // ✅ CHANGE: Inverted swaps these visually.
              // paddingBottom now affects the TOP of the screen (history)
              // paddingTop now affects the BOTTOM (near input)
              paddingBottom: 20,
              paddingTop: 10,
            }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              !loading ? (
                // ✅ FIX: Inverted list inverts components too, so we flip it back
                <View
                  className="items-center justify-center py-20 opacity-60"
                  style={{ transform: [{ scaleY: -1 }] }}
                >
                  <MessageCircle size={48} color="#666" />
                  <Text className="text-white font-bold text-lg mt-4">
                    No discussions yet
                  </Text>
                  <Text className="text-gray-400 text-center">
                    Be the first to start the conversation!
                  </Text>
                </View>
              ) : (
                <ActivityIndicator color="#D087FF" className="mt-20" />
              )
            }
          />

          {/* INPUT BAR */}
          <View className="bg-[#121212] px-4 py-3 border-t border-white/10 pb-4">
            <View className="flex-row items-center bg-white/10 rounded-2xl px-4 h-12 border border-white/10">
              <TextInput
                placeholder="Type a message..."
                placeholderTextColor="#666"
                value={inputText}
                onChangeText={setInputText}
                className="flex-1 text-white font-medium h-full mr-2 text-base"
                onSubmitEditing={handleSend}
              />
              <TouchableOpacity
                onPress={handleSend}
                disabled={!inputText.trim()}
                className={`p-2 rounded-full ${
                  !inputText.trim() ? "opacity-50" : "bg-purple-600"
                }`}
              >
                <Send color="white" size={18} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default EventCommunityScreen;
