import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import {
  Camera,
  User,
  AtSign,
  AlignLeft,
  MapPin,
  Save,
  ArrowLeft,
  Tag,
  Search,
  X,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";

// Backend
import { supabase } from "../../lib/supabase";

// Components
import TopBanner from "../../components/TopBanner";

// Styles
import { bannerGradient, fireGradient } from "../../styles/colours";

// Profile Input Component (Kept safely outside to prevent keyboard closing)
const ProfileInput = ({
  label,
  icon,
  value,
  onChange,
  multiline = false,
  placeholder,
}: any) => (
  <View className="mb-6">
    <Text className="text-gray-400 text-xs font-bold mb-2 ml-1 uppercase tracking-wider">
      {label}
    </Text>
    <View
      className={`flex-row items-start bg-white/10 border border-white/20 rounded-xl px-4 ${
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
        className="flex-1 text-white text-lg font-medium h-full"
        style={{ fontFamily: "Jost-Medium" }}
      />
    </View>
  </View>
);

const EditUserProfile = () => {
  const navigation = useNavigation();

  // --- LIVE STATE ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [interests, setInterests] = useState<string[]>([]);

  // Tag Search State
  const [allTags, setAllTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Image states
  const [profilePic, setProfilePic] = useState<any>(
    require("../../assets/profile-pic-1.png"),
  );
  const [newImageUri, setNewImageUri] = useState<string | null>(null);

  // --- FETCH INITIAL DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("No user logged in");
        setUserId(user.id);

        // 1. Fetch User Profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError && profileError.code !== "PGRST116")
          throw profileError;

        if (profileData) {
          setName(profileData.full_name || "");
          setHandle(profileData.username || "");
          setBio(profileData.bio || "");
          setLocation(profileData.location || "");
          // Ensure it's always an array even if database returns null
          setInterests(profileData.interests || []);

          if (profileData.avatar_url) {
            setProfilePic({ uri: profileData.avatar_url });
          }
        }

        // 2. Fetch Categories directly from the categories table
        const { data: catData, error: catError } = await supabase
          .from("categories")
          .select("name");

        if (!catError && catData && catData.length > 0) {
          // Extract the names and sort them alphabetically
          const extractedTags = catData.map((c) => c.name).sort();
          setAllTags(extractedTags);
        } else {
          console.log("Could not fetch categories, or table is empty.");
        }
      } catch (error: any) {
        console.error("Error fetching data:", error.message);
        Alert.alert("Error", "Could not load profile data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- TOGGLE TAGS ---
  const toggleInterest = (tag: string) => {
    if (interests.includes(tag)) {
      setInterests(interests.filter((i) => i !== tag));
    } else {
      if (interests.length >= 5) {
        Alert.alert(
          "Limit Reached",
          "You can only select up to 5 event preferences.",
        );
        return;
      }
      setInterests([...interests, tag]);
    }
  };

  // --- PICK IMAGE ---
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "We need access to your photos.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
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

  // --- SAVE PROFILE ---
  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);

    try {
      let finalAvatarUrl = profilePic.uri;

      if (newImageUri) {
        const base64 = await FileSystem.readAsStringAsync(newImageUri, {
          encoding: "base64",
        });
        const filePath = `${userId}/${Date.now()}.jpg`;
        const contentType = "image/jpeg";

        const { error: uploadError } = await supabase.storage
          .from("profile-pics")
          .upload(filePath, decode(base64), { contentType, upsert: true });

        if (uploadError) {
          console.error("Storage Upload Error:", uploadError);
          throw new Error("Failed to upload image.");
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("profile-pics").getPublicUrl(filePath);

        finalAvatarUrl = publicUrl;
      }

      // We are trying to push this exact object to Supabase:
      const updatePayload = {
        id: userId,
        full_name: name,
        username: handle,
        bio: bio,
        location: location,
        interests: interests, // THIS IS AN ARRAY OF STRINGS
        avatar_url: finalAvatarUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(updatePayload, { onConflict: "id" });

      // 🔥 IF THERE IS AN ERROR, WE LOG THE WHOLE OBJECT NOW
      if (error) {
        console.error("SUPABASE PROFILES UPSERT ERROR FULL:", error);
        throw error;
      }

      Alert.alert("Success", "Your profile has been updated!");
      navigation.goBack();
    } catch (error: any) {
      // The console will show us exactly why it failed
      console.error("Error saving profile details:", error);
      Alert.alert("Error", "Could not save profile details. Check console.");
    } finally {
      setSaving(false);
    }
  };

  // Filter tags based on search query
  const filteredTags = allTags.filter((tag) =>
    tag.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <View className="flex-1 bg-[#121212] justify-center items-center">
        <ActivityIndicator size="large" color="#FA8900" />
      </View>
    );
  }

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
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingTop: 100, paddingBottom: 140 }}
          >
            {/* HEADER */}
            <View className="flex-row items-center mb-8">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="mr-4 bg-white/10 p-2 rounded-full border border-white/10"
              >
                <ArrowLeft color="white" size={24} />
              </TouchableOpacity>
              <Text
                className="text-white text-3xl font-bold"
                style={{ fontFamily: "Jost-Medium" }}
              >
                Edit Profile
              </Text>
            </View>

            {/* 1. PROFILE PHOTO UPLOADER */}
            <View className="items-center mb-10">
              <View className="relative">
                <View className="w-32 h-32 rounded-full border-4 border-orange-500/50 shadow-lg shadow-black/50 overflow-hidden bg-[#1E1E1E]">
                  {profilePic.uri &&
                  !profilePic.uri.includes("profile-pic-1") ? (
                    <Image
                      source={profilePic}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      <User color="#666" size={40} />
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={handlePickImage}
                  activeOpacity={0.8}
                  className="absolute bottom-0 right-0 bg-[#1E1E1E] p-3 rounded-full border-2 border-white/20"
                >
                  <Camera color="#FA8900" size={20} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
              <Text className="text-orange-400 font-bold mt-3 text-sm">
                Change Photo
              </Text>
            </View>

            {/* 2. FORM FIELDS */}
            <ProfileInput
              label="Display Name"
              icon={<User color="white" size={20} />}
              value={name}
              onChange={setName}
              placeholder="Adriaan Smith"
            />
            <ProfileInput
              label="Username"
              icon={<AtSign color="white" size={20} />}
              value={handle}
              onChange={setHandle}
              placeholder="adriaan_za"
            />
            <ProfileInput
              label="Location"
              icon={<MapPin color="white" size={20} />}
              value={location}
              onChange={setLocation}
              placeholder="Cape Town, SA"
            />
            <ProfileInput
              label="Bio"
              icon={<AlignLeft color="white" size={20} />}
              value={bio}
              onChange={setBio}
              multiline={true}
              placeholder="Tell the community about yourself..."
            />

            {/* 3. EVENT PREFERENCES (TAGS & SEARCH) */}
            <View className="mb-10">
              <View className="flex-row items-center mb-3 ml-1">
                <Tag color="#9CA3AF" size={16} className="mr-2" />
                <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                  Event Preferences ({interests.length}/5)
                </Text>
              </View>

              {/* SEARCH BAR */}
              <View className="flex-row items-center bg-white/5 border border-white/10 rounded-xl px-4 h-12 mb-4">
                <Search color="#666" size={18} className="mr-2" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search categories..."
                  placeholderTextColor="#666"
                  className="flex-1 text-white"
                  style={{ fontFamily: "Jost-Medium" }}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery("")}
                    className="p-1"
                  >
                    <X color="#666" size={16} />
                  </TouchableOpacity>
                )}
              </View>

              {/* SELECTED TAGS */}
              {interests.length > 0 && (
                <View className="flex-row flex-wrap gap-2 mb-4 pb-4 border-b border-white/10">
                  {interests.map((tag) => (
                    <TouchableOpacity
                      key={`selected-${tag}`}
                      onPress={() => toggleInterest(tag)}
                      activeOpacity={0.7}
                      className="px-4 py-2 rounded-full border bg-orange-500/20 border-orange-500 flex-row items-center"
                    >
                      <Text className="font-bold text-orange-400 mr-2">
                        {tag}
                      </Text>
                      <X color="#FA8900" size={14} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* AVAILABLE TAGS FROM DATABASE */}
              <View className="flex-row flex-wrap gap-3">
                {filteredTags
                  .filter((tag) => !interests.includes(tag))
                  .map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => toggleInterest(tag)}
                      activeOpacity={0.7}
                      className="px-4 py-2 rounded-full border bg-white/5 border-white/10"
                    >
                      <Text className="font-bold text-gray-400">{tag}</Text>
                    </TouchableOpacity>
                  ))}

                {filteredTags.length === 0 && allTags.length > 0 && (
                  <Text className="text-gray-500 text-sm mt-2 ml-1">
                    No categories match your search.
                  </Text>
                )}
                {allTags.length === 0 && (
                  <Text className="text-gray-500 text-sm mt-2 ml-1">
                    Loading categories...
                  </Text>
                )}
              </View>
            </View>
          </ScrollView>

          {/* SAVE BUTTON */}
          <View className="absolute bottom-0 left-0 right-0 p-6 bg-[#121212]/90 border-t border-white/5 pb-10">
            <TouchableOpacity
              activeOpacity={0.9}
              className="w-full shadow-lg shadow-orange-500/30"
              onPress={handleSave}
              disabled={saving}
            >
              <LinearGradient
                {...fireGradient}
                className={`w-full py-4 rounded-xl flex-row items-center justify-center ${saving ? "opacity-70" : ""}`}
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
                      SAVE CHANGES
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default EditUserProfile;
