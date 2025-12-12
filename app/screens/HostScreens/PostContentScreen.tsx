import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { ArrowLeft, ImagePlus, Send, Bell, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

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

  const [caption, setCaption] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [sendNotification, setSendNotification] = useState(true);
  const [loading, setLoading] = useState(false);

  // 1. PICK & COMPRESS IMAGE
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to photos.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.5, // ⚡️ PERFORMANCE: Compress image to 50% quality
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleRemoveImage = () => {
    setImageUri(null);
  };

  // 2. POST UPDATE
  const handlePost = async () => {
    if (!caption && !imageUri) {
      Alert.alert("Empty Post", "Please add an image or a caption.");
      return;
    }

    setLoading(true);

    try {
      let uploadedUrl = null;

      // Upload if exists
      if (imageUri) {
        uploadedUrl = await uploadImage(imageUri, "event-updates");
      }

      // Insert Row
      const { error } = await supabase.from("event_updates").insert({
        event_id: eventId,
        caption: caption,
        image_url: uploadedUrl,
        send_notification: sendNotification,
      });

      if (error) throw error;

      Alert.alert("Success", "Update posted successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <View className="absolute inset-0 bg-black/40" />
      <HostTopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingTop: 120, paddingBottom: 140 }}
        >
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

          {imageUri ? (
            <View className="mb-6 relative rounded-2xl overflow-hidden shadow-lg shadow-purple-900/40">
              <Image
                source={{ uri: imageUri }}
                className="w-full h-64"
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={handleRemoveImage}
                className="absolute top-3 right-3 bg-black/60 p-2 rounded-full border border-white/20"
              >
                <X color="white" size={20} />
              </TouchableOpacity>
              <View className="absolute bottom-3 left-3 bg-purple-600/90 px-3 py-1 rounded-md">
                <Text className="text-white text-xs font-bold">
                  MEDIA ATTACHED
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handlePickImage}
              activeOpacity={0.8}
              className="w-full h-48 bg-white/5 border-2 border-dashed border-white/20 rounded-2xl items-center justify-center mb-6"
            >
              <View className="bg-purple-500/20 p-4 rounded-full mb-2">
                <ImagePlus color="#D087FF" size={32} />
              </View>
              <Text className="text-gray-400 font-medium">Add a Photo</Text>
            </TouchableOpacity>
          )}

          <Text className="text-white text-lg font-bold mb-3">Caption</Text>
          <View className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 mb-6 h-40">
            <TextInput
              placeholder="What's new? (e.g. Set times released!)"
              placeholderTextColor="#6b7280"
              value={caption}
              onChangeText={setCaption}
              multiline
              textAlignVertical="top"
              className="flex-1 text-white text-lg font-medium"
              style={{ fontFamily: "Jost-Medium" }}
            />
          </View>

          <View className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4 flex-row items-center justify-between mb-8">
            <View className="flex-row items-center flex-1 mr-4">
              <View className="bg-purple-500/20 p-3 rounded-full mr-3">
                <Bell color="#D087FF" size={24} />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-lg">
                  Notify Attendees
                </Text>
                <Text className="text-gray-400 text-xs leading-4">
                  Sends a push notification to attendees.
                </Text>
              </View>
            </View>
            <Switch
              value={sendNotification}
              onValueChange={setSendNotification}
              trackColor={{ false: "#333", true: "#D087FF" }}
              thumbColor={"#fff"}
            />
          </View>
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 p-6 bg-[#121212]/90 border-t border-white/10">
          <TouchableOpacity
            activeOpacity={0.8}
            className="w-full shadow-lg shadow-purple-500/30"
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
        </View>
      </SafeAreaView>
    </View>
  );
};

export default PostContentScreen;
