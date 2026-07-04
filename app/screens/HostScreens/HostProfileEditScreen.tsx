import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  findNodeHandle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { Camera, User, AtSign, Link, AlignLeft, Save } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";

// Backend
import { supabase } from "../../lib/supabase";

// Components
import HostTopBanner from "../../components/HostTopBanner";
import HostBottomNav from "../../components/HostBottomNav";

// Styles
import { bannerGradient, electricGradient } from "../../styles/colours";

// Kept outside the screen component so typing doesn't dismiss the keyboard.
const ProfileInput = ({
  label,
  icon,
  value,
  onChange,
  multiline = false,
  placeholder,
  onFocus,
}: any) => (
  <View className="mb-6">
    <Text className="text-gray-400 text-sm font-bold mb-2 ml-1 uppercase tracking-wider">
      {label}
    </Text>
    <View
      className={`flex-row items-start bg-white/5 border border-white/10 rounded-xl px-4 ${
        multiline ? "h-32 py-3" : "h-14 items-center"
      }`}
    >
      <View className={`mr-3 opacity-70 ${multiline ? "mt-1" : ""}`}>
        {icon}
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#666"
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        autoCapitalize={label === "Handle (Username)" ? "none" : "sentences"}
        onFocus={onFocus}
        className="flex-1 text-white text-lg font-medium h-full"
        style={{ fontFamily: "Jost-Medium" }}
      />
    </View>
  </View>
);

const HostProfileEditScreen = () => {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [profilePic, setProfilePic] = useState<any>(
    require("../../assets/profile-pic-1.png"),
  );
  const [newImageUri, setNewImageUri] = useState<string | null>(null);

  // KeyboardAwareScrollView only auto-scrolls when the keyboard first opens —
  // tapping a different field while it's already up doesn't fire that event,
  // so each field's onFocus below nudges the scroll view manually.
  const scrollRef = useRef<any>(null);
  const handleFocus = (event: any) => {
    scrollRef.current?.scrollToFocusedInput(findNodeHandle(event.target));
  };

  // Load the host's real profile (host & user share the same profiles row).
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("No user logged in");
        setUserId(user.id);

        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, username, bio, website, avatar_url")
          .eq("id", user.id)
          .single();

        if (error && error.code !== "PGRST116") throw error;

        if (data) {
          setName(data.full_name || "");
          setHandle(data.username || "");
          setBio(data.bio || "");
          setWebsite(data.website || "");
          if (data.avatar_url) setProfilePic({ uri: data.avatar_url });
        }
      } catch (error: any) {
        console.error("Error loading host profile:", error.message);
        Alert.alert("Error", "Could not load your profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChangePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "We need access to your photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfilePic({ uri: result.assets[0].uri });
      setNewImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);

    try {
      let finalAvatarUrl = profilePic.uri ?? null;

      // Upload a freshly-picked photo to the profile-pics bucket first.
      if (newImageUri) {
        const base64 = await FileSystem.readAsStringAsync(newImageUri, {
          encoding: "base64",
        });
        const filePath = `${userId}/${Date.now()}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from("profile-pics")
          .upload(filePath, decode(base64), {
            contentType: "image/jpeg",
            upsert: true,
          });
        if (uploadError) throw new Error("Failed to upload image.");

        const {
          data: { publicUrl },
        } = supabase.storage.from("profile-pics").getPublicUrl(filePath);
        finalAvatarUrl = publicUrl;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: name,
          username: handle,
          bio: bio,
          website: website,
          avatar_url: finalAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        // Username has a UNIQUE constraint — give a friendly message.
        if (error.code === "23505") {
          throw new Error("That username is already taken. Try another.");
        }
        throw error;
      }

      Alert.alert("Profile Updated", "Your host profile has been saved.");
      navigation.goBack();
    } catch (error: any) {
      console.error("Error saving host profile:", error);
      Alert.alert("Error", error.message || "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#121212] justify-center items-center">
        <ActivityIndicator size="large" color="#D087FF" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <View className="absolute inset-0 bg-black/40" />

      <HostTopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <KeyboardAwareScrollView
          ref={scrollRef}
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: 120, paddingBottom: 200 }}
          enableOnAndroid={true}
          extraScrollHeight={120}
          enableAutomaticScroll={true}
          >
            {/* HEADER */}
            <View className="mb-8">
              <Text
                className="text-white text-3xl font-bold"
                style={{ fontFamily: "Jost-Medium" }}
              >
                Edit Profile
              </Text>
              <Text className="text-gray-400 text-base">
                Update your public host details
              </Text>
            </View>

            {/* 1. PROFILE PHOTO UPLOADER */}
            <View className="items-center mb-10">
              <View className="relative">
                <View className="w-32 h-32 rounded-full border-4 border-purple-500/30 shadow-lg shadow-purple-500/50 overflow-hidden bg-[#1E1E1E]">
                  <Image
                    source={profilePic}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>
                <TouchableOpacity
                  onPress={handleChangePhoto}
                  activeOpacity={0.8}
                  className="absolute bottom-0 right-0 bg-white p-3 rounded-full border-4 border-[#121212]"
                >
                  <Camera color="#D087FF" size={20} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
              <Text className="text-purple-300 font-bold mt-3">
                Change Profile Photo
              </Text>
            </View>

            {/* 2. FORM FIELDS */}
            <ProfileInput
              label="Display Name"
              icon={<User color="white" size={20} />}
              value={name}
              onChange={setName}
              placeholder="Rockstar Events"
              onFocus={handleFocus}
            />

            <ProfileInput
              label="Handle (Username)"
              icon={<AtSign color="white" size={20} />}
              value={handle}
              onChange={setHandle}
              placeholder="rockstarevents_sa"
              onFocus={handleFocus}
            />

            <ProfileInput
              label="Bio / Description"
              icon={<AlignLeft color="white" size={20} />}
              value={bio}
              onChange={setBio}
              multiline={true}
              placeholder="What's your vibe?"
              onFocus={handleFocus}
            />

            <ProfileInput
              label="Website / LinkTree"
              icon={<Link color="white" size={20} />}
              value={website}
              onChange={setWebsite}
              placeholder="https://..."
              onFocus={handleFocus}
            />
        </KeyboardAwareScrollView>

        {/* SAVE BUTTON */}
        <View className="absolute bottom-24 left-0 right-0 p-6">
          <TouchableOpacity
            activeOpacity={0.8}
            className="w-full shadow-lg shadow-purple-500/40"
            onPress={handleSave}
            disabled={saving}
          >
            <LinearGradient
              {...electricGradient}
              className={`w-full py-4 rounded-full flex-row items-center justify-center ${
                saving ? "opacity-70" : ""
              }`}
            >
              {saving ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Save color="white" size={20} className="mr-2" />
                  <Text
                    className="text-white text-xl font-bold tracking-wide"
                    style={{ fontFamily: "Jost-Medium" }}
                  >
                    SAVE PROFILE
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <HostBottomNav />
    </View>
  );
};

export default HostProfileEditScreen;
