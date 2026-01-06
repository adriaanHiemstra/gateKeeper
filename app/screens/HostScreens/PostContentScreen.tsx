// app/screens/PostContentScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import {
  ArrowLeft,
  ImagePlus,
  Send,
  X,
  Video as VideoIcon,
  Trash2,
  Clock,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { Video, ResizeMode } from "expo-av";

// Backend
import { supabase } from "../../lib/supabase";
import { uploadImage } from "../../lib/upload";

// Styles & Components
import HostTopBanner from "../../components/HostTopBanner";
import { bannerGradient, electricGradient } from "../../styles/colours";
import { RootStackParamList } from "../../types/types";

type PostContentRouteProp = RouteProp<RootStackParamList, "PostContent">;

const PostContentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<PostContentRouteProp>();
  const { eventId } = route.params || { eventId: "1" };

  // Form State
  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState<{
    uri: string;
    type: "image" | "video";
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // History State
  const [previousPosts, setPreviousPosts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // --- 1. FETCH HISTORY ---
  const fetchPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("event_updates")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPreviousPosts(data || []);
    } catch (err) {
      console.log("Error fetching posts:", err);
    }
  }, [eventId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  // --- 2. MEDIA HANDLERS ---
  const handlePickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to media library.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.5,
      videoMaxDuration: 60,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setMedia({
        uri: asset.uri,
        type: asset.type === "video" ? "video" : "image",
      });
    }
  };

  const handleRemoveMedia = () => {
    setMedia(null);
  };

  // --- 3. POST ACTION ---
  const handlePost = async () => {
    if (!caption && !media) {
      Alert.alert("Empty Post", "Please add an image/video or a caption.");
      return;
    }

    setLoading(true);

    try {
      let uploadedUrl = null;

      if (media) {
        uploadedUrl = await uploadImage(media.uri, "event-updates");
      }

      const { error } = await supabase.from("event_updates").insert({
        event_id: eventId,
        caption: caption,
        image_url: uploadedUrl,
      });

      if (error) throw error;

      Alert.alert("Success", "Update posted!");
      setCaption("");
      setMedia(null);
      fetchPosts(); // Refresh list immediately
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- 4. DELETE ACTION ---
  const handleDeletePost = (post: any) => {
    // ✅ Pass full post object, not just ID
    Alert.alert("Delete Update", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          // 1. Delete File from Storage (if it exists)
          if (post.image_url) {
            // Extract path: "https://.../event-updates/filename.jpg" -> "filename.jpg"
            const path = post.image_url.split("event-updates/").pop();
            if (path) {
              await supabase.storage.from("event-updates").remove([path]);
            }
          }

          // 2. Delete Row from DB
          const { error } = await supabase
            .from("event_updates")
            .delete()
            .eq("id", post.id);

          if (error) {
            Alert.alert("Error", error.message);
          } else {
            fetchPosts(); // Refresh list
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <View className="absolute inset-0 bg-black/40" />
      <HostTopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingTop: 120, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#D087FF"
            />
          }
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
                Event Update
              </Text>
              <Text
                className="text-white text-3xl font-bold"
                style={{ fontFamily: "Jost-Medium" }}
              >
                Create Post
              </Text>
            </View>
          </View>

          {/* CREATE POST SECTION */}
          {media ? (
            <View className="mb-6 relative rounded-2xl overflow-hidden shadow-lg shadow-purple-900/40 bg-black">
              {media.type === "video" ? (
                <Video
                  source={{ uri: media.uri }}
                  style={{ width: "100%", height: 300 }}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay
                  isLooping
                  // isMuted removed so you can hear preview
                />
              ) : (
                <Image
                  source={{ uri: media.uri }}
                  className="w-full h-72"
                  resizeMode="cover"
                />
              )}

              <TouchableOpacity
                onPress={handleRemoveMedia}
                className="absolute top-3 right-3 bg-black/60 p-2 rounded-full border border-white/20"
              >
                <X color="white" size={20} />
              </TouchableOpacity>

              <View className="absolute bottom-3 left-3 bg-purple-600/90 px-3 py-1 rounded-md flex-row items-center">
                {media.type === "video" ? (
                  <VideoIcon size={12} color="white" className="mr-1" />
                ) : (
                  <ImagePlus size={12} color="white" className="mr-1" />
                )}
                <Text className="text-white text-xs font-bold uppercase">
                  {media.type === "video" ? "VIDEO ATTACHED" : "IMAGE ATTACHED"}
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handlePickMedia}
              activeOpacity={0.8}
              className="w-full h-48 bg-white/5 border-2 border-dashed border-white/20 rounded-2xl items-center justify-center mb-6"
            >
              <View className="bg-purple-500/20 p-4 rounded-full mb-2">
                <ImagePlus color="#D087FF" size={32} />
              </View>
              <Text className="text-gray-400 font-medium">
                Add Photo or Video
              </Text>
            </TouchableOpacity>
          )}

          <Text className="text-white text-lg font-bold mb-3">Caption</Text>
          <View className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 mb-6 h-32">
            <TextInput
              placeholder="What's the hype? (e.g. Backstage sneak peek!)"
              placeholderTextColor="#6b7280"
              value={caption}
              onChangeText={setCaption}
              multiline
              textAlignVertical="top"
              className="flex-1 text-white text-lg font-medium"
              style={{ fontFamily: "Jost-Medium" }}
            />
          </View>

          {/* POST BUTTON */}
          <TouchableOpacity
            activeOpacity={0.8}
            className="w-full shadow-lg shadow-purple-500/30 mb-12"
            onPress={handlePost}
            disabled={loading}
          >
            <LinearGradient
              {...electricGradient}
              className="w-full py-4 rounded-full flex-row items-center justify-center"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Send color="white" size={20} className="mr-2" />
                  <Text
                    className="text-white text-xl font-bold tracking-wide"
                    style={{ fontFamily: "Jost-Medium" }}
                  >
                    POST UPDATE
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* --- HISTORY SECTION --- */}
          <Text className="text-white text-xl font-bold mb-4 border-t border-white/10 pt-6">
            Previous Updates
          </Text>

          {previousPosts.length === 0 ? (
            <Text className="text-gray-500 italic text-center py-4">
              No updates posted yet.
            </Text>
          ) : (
            previousPosts.map((post) => (
              <View
                key={post.id}
                className="bg-white/5 border border-white/5 rounded-2xl p-3 mb-3 flex-row items-center"
              >
                {/* Thumbnail */}
                <View className="w-16 h-16 bg-black/30 rounded-xl overflow-hidden mr-4 border border-white/10">
                  {post.image_url ? (
                    post.image_url.includes(".mp4") ||
                    post.image_url.includes(".mov") ? (
                      <View className="flex-1 items-center justify-center bg-gray-800">
                        <VideoIcon color="white" size={20} />
                      </View>
                    ) : (
                      <Image
                        source={{ uri: post.image_url }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    )
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <ImagePlus color="#666" size={20} />
                    </View>
                  )}
                </View>

                {/* Info */}
                <View className="flex-1 pr-2">
                  <Text
                    className="text-white font-bold text-base mb-1"
                    numberOfLines={1}
                  >
                    {post.caption || "No Caption"}
                  </Text>
                  <View className="flex-row items-center">
                    <Clock size={12} color="#888" className="mr-1" />
                    <Text className="text-gray-400 text-xs">
                      {new Date(post.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {/* Delete Button */}
                <TouchableOpacity
                  onPress={() => handleDeletePost(post)}
                  className="bg-red-500/10 p-3 rounded-full"
                >
                  <Trash2 color="#ef4444" size={20} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default PostContentScreen;
