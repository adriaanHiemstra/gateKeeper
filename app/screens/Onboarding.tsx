// app/screens/Onboarding.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Alert,
  ActivityIndicator,
  Image, // <-- NEW IMPORT
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowRight,
  MapPin,
  User,
  Check,
  Phone,
  Users,
  CheckCircle2,
  Circle,
  Camera, // <-- NEW IMPORT
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import * as Contacts from "expo-contacts";
import * as ImagePicker from "expo-image-picker"; // <-- NEW IMPORT
import { decode } from "base64-arraybuffer"; // <-- NEW IMPORT

// Backend
import { supabase } from "../lib/supabase";

// Styles
import { bannerGradient, fireGradient } from "../styles/colours";
import { RootStackParamList } from "../types/types";

// --- CONSTANTS ---
const AVATAR_COLORS = [
  "#FF5733",
  "#33FF57",
  "#3357FF",
  "#F033FF",
  "#FFB533",
  "#00E5FF",
];

// --- HELPERS ---
const validateSAPhoneNumber = (phone: string) => {
  const cleaned = phone.replace(/[^\d+]/g, "");
  const isLocal = /^0[6-8][0-9]{8}$/.test(cleaned);
  const isIntl = /^(?:\+27|27)[6-8][0-9]{8}$/.test(cleaned);
  return isLocal || isIntl;
};

// --- TYPES ---
type MatchedContact = {
  id: string;
  phoneName: string;
  username: string;
  avatarColor: string;
  isSelected: boolean;
};

type Category = {
  id: string;
  name: string;
};

// --- CUSTOM ANIMATED COMPONENT ---
const AnimatedTag = ({
  label,
  isSelected,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) => {
  const wobbleAnim = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
    wobbleAnim.setValue(0);
    Animated.timing(wobbleAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const spin = wobbleAnim.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: ["0deg", "-10deg", "10deg", "-4deg", "4deg", "0deg"],
  });

  return (
    <Animated.View
      style={{
        transform: [{ rotate: spin }],
        marginBottom: 12,
        marginRight: 10,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        style={{ overflow: "hidden", borderRadius: 999 }}
      >
        {isSelected ? (
          <LinearGradient
            {...fireGradient}
            className="px-5 py-3 flex-row items-center"
          >
            <Text className="text-white font-bold mr-2">{label}</Text>
            <Check color="white" size={16} />
          </LinearGradient>
        ) : (
          <View className="bg-white/10 px-5 py-3 border border-white/10 rounded-full">
            <Text className="text-gray-300 font-bold">{label}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const Onboarding = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // --- MASTER STATE ---
  const [step, setStep] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);

  // Screen 1: Profile State
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [avatarColor, setAvatarColor] = useState("");
  // 🔥 NEW STATE FOR IMAGE
  const [profileImage, setProfileImage] = useState<{
    uri: string;
    base64: string;
    ext: string;
  } | null>(null);

  // Screen 2: Vibe Check State
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [selectedTags, setSelectedTags] = useState<Category[]>([]);

  // Screen 3 & 4: Contacts State
  const [phoneNumber, setPhoneNumber] = useState("");
  const [matchedContacts, setMatchedContacts] = useState<MatchedContact[]>([]);

  useEffect(() => {
    setAvatarColor(
      AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    );

    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching categories:", error);
      } else if (data) {
        setDbCategories(data);
      }
    };

    fetchCategories();
  }, []);

  // --- ACTIONS ---

  // 🔥 NEW IMAGE PICKER LOGIC
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1], // Forces a square crop for avatars
      quality: 0.5, // Compresses the image slightly for faster uploads
      base64: true, // Required for Supabase RN upload
    });

    if (!result.canceled && result.assets[0].base64) {
      const asset = result.assets[0];
      const ext = asset.uri.split(".").pop() || "jpeg";
      setProfileImage({
        uri: asset.uri,
        base64: asset.base64,
        ext,
      });
    }
  };

  const toggleTag = (cat: Category) => {
    const isSelected = selectedTags.some((t) => t.id === cat.id);
    if (isSelected) {
      setSelectedTags(selectedTags.filter((t) => t.id !== cat.id));
    } else {
      if (selectedTags.length >= 10) return;
      setSelectedTags([...selectedTags, cat]);
    }
  };

  const toggleContact = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMatchedContacts((prev) =>
      prev.map((contact) =>
        contact.id === id
          ? { ...contact, isSelected: !contact.isSelected }
          : contact,
      ),
    );
  };

  const handleNext = () => {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
  };

  const handleSyncContacts = async (skipSync: boolean = false) => {
    if (skipSync) {
      finishOnboarding();
      return;
    }

    if (!phoneNumber) {
      Alert.alert(
        "Hold up",
        "Please enter your own phone number so your friends can find you!",
      );
      return;
    }

    if (!validateSAPhoneNumber(phoneNumber)) {
      Alert.alert(
        "Invalid Number",
        "Please enter a valid South African phone number (e.g., 082 123 4567).",
      );
      return;
    }

    setIsFinishing(true);

    try {
      const { status } = await Contacts.requestPermissionsAsync();

      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
        });

        const cleanedContacts = data
          .flatMap((c) =>
            c.phoneNumbers ? c.phoneNumbers.map((p) => p.number) : [],
          )
          .filter(Boolean)
          .map((num) => num?.replace(/\D/g, ""))
          .flatMap((num) => {
            if (!num) return [];
            if (num.startsWith("27") && num.length === 11) {
              return [num, "0" + num.substring(2)];
            } else if (num.startsWith("0") && num.length === 10) {
              return [num, "27" + num.substring(1)];
            }
            return [num];
          });

        const uniqueContacts = Array.from(new Set(cleanedContacts));

        const { data: dbMatches, error } = await supabase.rpc(
          "match_contacts",
          {
            phone_array: uniqueContacts,
          },
        );

        if (error) throw error;

        if (dbMatches && dbMatches.length > 0) {
          const formattedMatches = dbMatches.map((match: any) => ({
            id: match.id,
            phoneName: match.full_name || "Mystery Friend",
            username: match.username || "@new_user",
            avatarColor: match.avatar_color || "#FA8900",
            isSelected: true,
          }));

          setMatchedContacts(formattedMatches);
          setStep(4);
        } else {
          Alert.alert(
            "No Matches",
            "None of your contacts are on GateKeeper yet. You're the trendsetter!",
          );
          finishOnboarding();
        }
      } else {
        Alert.alert(
          "Permission Denied",
          "No worries, we'll skip the contact sync for now.",
        );
        finishOnboarding();
      }
    } catch (error) {
      console.log("Error syncing contacts:", error);
      finishOnboarding();
    } finally {
      setIsFinishing(false);
    }
  };

  const finishOnboarding = async () => {
    setIsFinishing(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Could not find authenticated user.");
      }

      let finalAvatarUrl = null;

      // 🔥 IMAGE UPLOAD LOGIC
      if (profileImage) {
        const fileName = `${user.id}-${Date.now()}.${profileImage.ext}`;
        const filePath = `public/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("profile-pics")
          .upload(filePath, decode(profileImage.base64), {
            contentType: `image/${profileImage.ext}`,
            upsert: true,
          });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
        } else {
          // Get the public URL to save in the profiles table
          const { data } = supabase.storage
            .from("profile-pics")
            .getPublicUrl(filePath);
          finalAvatarUrl = data.publicUrl;
        }
      }

      // Update Profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          bio: bio || null,
          location: location || null,
          avatar_color: avatarColor,
          avatar_url: finalAvatarUrl, // <-- SAVE THE URL
          phone_number: phoneNumber || null,
          interests: selectedTags.map((t) => t.name),
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Update Interests
      if (selectedTags.length > 0) {
        const interestInserts = selectedTags.map((tag) => ({
          user_id: user.id,
          category_id: tag.id,
        }));
        await supabase.from("user_interests").upsert(interestInserts);
      }

      // Update Friendships
      const finalFriendsToSync = matchedContacts
        .filter((c) => c.isSelected)
        .map((c) => c.id);

      if (finalFriendsToSync.length > 0) {
        const friendshipInserts = finalFriendsToSync.map((friendId) => ({
          user_id_1: user.id,
          user_id_2: friendId,
        }));
        await supabase.from("friendships").insert(friendshipInserts);
      }

      navigation.replace("Home");
    } catch (error: any) {
      console.error("Error saving profile:", error.message);
      Alert.alert("Error", "We couldn't save your profile. Please try again.");
    } finally {
      setIsFinishing(false);
    }
  };

  const selectedCount = matchedContacts.filter((c) => c.isSelected).length;

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, padding: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {step < 4 && (
              <View className="flex-row gap-2 mb-8 mt-4 justify-center">
                <View className="h-2 flex-1 rounded-full bg-orange-500" />
                <View
                  className={`h-2 flex-1 rounded-full ${step >= 2 ? "bg-orange-500" : "bg-white/10"}`}
                />
                <View
                  className={`h-2 flex-1 rounded-full ${step >= 3 ? "bg-orange-500" : "bg-white/10"}`}
                />
              </View>
            )}

            {/* ========================================== */}
            {/* STEP 1: PROFILE POLISH                     */}
            {/* ========================================== */}
            {step === 1 && (
              <View className="flex-1 justify-center">
                <Text
                  className="text-white text-4xl font-bold "
                  style={{ fontFamily: "Jost-Medium" }}
                >
                  Set your vibe.
                </Text>
                <Text className="text-gray-400 text-lg mb-10">
                  How should the crowd know you?
                </Text>

                <View className="items-center mb-8">
                  {/* 🔥 UPDATED AVATAR CIRCLE */}
                  <TouchableOpacity
                    onPress={pickImage}
                    activeOpacity={0.8}
                    className="w-32 h-32 rounded-full items-center justify-center border-4 border-[#121212] shadow-2xl overflow-hidden relative"
                    style={{
                      backgroundColor: profileImage
                        ? "transparent"
                        : avatarColor,
                    }}
                  >
                    {profileImage ? (
                      <Image
                        source={{ uri: profileImage.uri }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <User color="white" size={48} opacity={0.8} />
                    )}

                    {/* Camera Overlay Icon */}
                    <View className="absolute bottom-2 right-2 bg-black/60 p-2 rounded-full">
                      <Camera color="white" size={16} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={pickImage}
                    className="mt-4 bg-white/10 px-4 py-2 rounded-full border border-white/10"
                  >
                    <Text className="text-white font-bold text-sm">
                      {profileImage ? "Change Photo" : "Add Photo"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* BIO INPUT */}
                <View className="mb-6 p-0">
                  <Text className="text-gray-400 text-xs font-bold uppercase mb-1 ml-1">
                    Short Bio
                  </Text>
                  <View className="flex-row bg-white/10 border border-white/20 rounded-2xl px-4 pt-4 pb-2 min-h-[100px]">
                    <TextInput
                      placeholder="I love techno and long hikes..."
                      placeholderTextColor="#666"
                      value={bio}
                      onChangeText={setBio}
                      multiline
                      maxLength={150}
                      className="flex-1 text-white text-lg font-medium ml-2 "
                      style={{
                        fontFamily: "Jost-Medium",
                        textAlignVertical: "top",
                      }}
                    />
                  </View>
                </View>

                {/* LOCATION INPUT */}
                <View className="mb-10">
                  <Text className="text-gray-400 text-xs font-bold uppercase mb-2 ml-1">
                    City
                  </Text>
                  <View className="flex-row items-center bg-white/10 border border-white/20 rounded-2xl px-4 h-14">
                    <MapPin
                      color="white"
                      size={20}
                      className="mr-3 opacity-70"
                    />
                    <TextInput
                      placeholder="Cape Town, ZA"
                      placeholderTextColor="#666"
                      value={location}
                      onChangeText={setLocation}
                      className="flex-1 text-white text-lg font-medium h-full ml-2"
                      style={{ fontFamily: "Jost-Medium" }}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* ========================================== */}
            {/* STEP 2: THE VIBE CHECK (TAGS)              */}
            {/* ========================================== */}
            {step === 2 && (
              <View className="flex-1 pt-4">
                <Text
                  className="text-white text-4xl font-bold mb-2"
                  style={{ fontFamily: "Jost-Medium" }}
                >
                  What's your scene?
                </Text>
                <Text className="text-gray-400 text-lg mb-8">
                  Pick up to 10 things you're into. We'll curate your feed.
                </Text>

                <View className="flex-row flex-wrap justify-start">
                  {dbCategories.map((cat) => (
                    <AnimatedTag
                      key={cat.id}
                      label={cat.name}
                      isSelected={selectedTags.some((t) => t.id === cat.id)}
                      onPress={() => toggleTag(cat)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* ========================================== */}
            {/* STEP 3: THE CREW SYNC (CONTACTS)           */}
            {/* ========================================== */}
            {step === 3 && (
              <View className="flex-1 justify-center">
                <View className="items-center mb-10">
                  <View className="bg-orange-500/20 p-6 rounded-full mb-6">
                    <Users color="#FA8900" size={56} />
                  </View>
                  <Text
                    className="text-white text-4xl font-bold mb-2 text-center"
                    style={{ fontFamily: "Jost-Medium" }}
                  >
                    Find your crew.
                  </Text>
                  <Text className="text-gray-400 text-lg text-center px-4">
                    See which of your friends are already buying tickets.
                  </Text>
                </View>

                {/* PHONE INPUT */}
                <View className="mb-8">
                  <Text className="text-gray-400 text-xs font-bold uppercase mb-2 ml-1">
                    Your Phone Number
                  </Text>
                  <View className="flex-row items-center bg-white/10 border border-white/20 rounded-2xl px-4 h-14">
                    <Phone
                      color="white"
                      size={20}
                      className="mr-3 opacity-70"
                    />
                    <TextInput
                      placeholder="e.g. 082 123 4567"
                      placeholderTextColor="#666"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="phone-pad"
                      className="flex-1 text-white text-lg font-medium h-full ml-2"
                      style={{ fontFamily: "Jost-Medium" }}
                    />
                  </View>
                  <Text className="text-gray-500 text-xs mt-2 ml-1">
                    Used securely to match you with your contacts.
                  </Text>
                </View>
              </View>
            )}

            {/* ========================================== */}
            {/* STEP 4: REVIEW MATCHES (CHECKLIST)         */}
            {/* ========================================== */}
            {step === 4 && (
              <View className="flex-1 pt-4">
                <Text
                  className="text-white text-4xl font-bold mb-2"
                  style={{ fontFamily: "Jost-Medium" }}
                >
                  Look who's here.
                </Text>
                <Text className="text-gray-400 text-lg mb-8">
                  We found {matchedContacts.length} people from your contacts.
                  Choose who to add.
                </Text>

                <View className="bg-white/5 border border-white/10 rounded-3xl p-2 mb-8">
                  {matchedContacts.map((contact, index) => (
                    <TouchableOpacity
                      key={contact.id}
                      activeOpacity={0.8}
                      onPress={() => toggleContact(contact.id)}
                      className={`flex-row items-center p-4 ${index !== matchedContacts.length - 1 ? "border-b border-white/5" : ""}`}
                    >
                      <View
                        className="w-12 h-12 rounded-full items-center justify-center mr-4"
                        style={{ backgroundColor: contact.avatarColor }}
                      >
                        <User color="white" size={20} opacity={0.8} />
                      </View>

                      <View className="flex-1">
                        <Text
                          className="text-white text-lg font-bold"
                          style={{ fontFamily: "Jost-Medium" }}
                        >
                          {contact.phoneName}
                        </Text>
                        <Text className="text-orange-400 text-sm font-medium mt-0.5">
                          {contact.username}
                        </Text>
                      </View>

                      <View className="ml-2">
                        {contact.isSelected ? (
                          <CheckCircle2 color="#FA8900" size={28} />
                        ) : (
                          <Circle color="#666" size={28} />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* DYNAMIC BOTTOM BUTTONS */}
            <View className="mt-auto pt-4 mb-6">
              {step < 3 ? (
                <TouchableOpacity
                  onPress={handleNext}
                  activeOpacity={0.9}
                  className="w-full shadow-lg shadow-orange-500/30"
                >
                  <LinearGradient
                    {...fireGradient}
                    className="w-full py-4 rounded-2xl flex-row items-center justify-center"
                  >
                    <Text
                      className="text-white text-xl font-bold tracking-wide mr-2"
                      style={{ fontFamily: "Jost-Medium" }}
                    >
                      {step === 2 && selectedTags.length === 0
                        ? "SKIP FOR NOW"
                        : "NEXT"}
                    </Text>
                    <ArrowRight color="white" size={24} />
                  </LinearGradient>
                </TouchableOpacity>
              ) : step === 3 ? (
                <>
                  <TouchableOpacity
                    onPress={() => handleSyncContacts(false)}
                    activeOpacity={0.9}
                    disabled={isFinishing}
                    className={`w-full shadow-lg shadow-orange-500/30 mb-4 ${isFinishing ? "opacity-50" : ""}`}
                  >
                    <LinearGradient
                      {...fireGradient}
                      className="w-full py-4 rounded-2xl flex-row items-center justify-center"
                    >
                      {isFinishing ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text
                          className="text-white text-xl font-bold tracking-wide"
                          style={{ fontFamily: "Jost-Medium" }}
                        >
                          SYNC CONTACTS
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleSyncContacts(true)}
                    disabled={isFinishing}
                    className="w-full py-4 rounded-2xl items-center border border-white/10 bg-white/5"
                  >
                    <Text
                      className="text-gray-400 text-lg font-bold tracking-wide"
                      style={{ fontFamily: "Jost-Medium" }}
                    >
                      SKIP
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  onPress={finishOnboarding}
                  activeOpacity={0.9}
                  className="w-full shadow-lg shadow-orange-500/30"
                >
                  <LinearGradient
                    {...fireGradient}
                    className="w-full py-4 rounded-2xl flex-row items-center justify-center"
                  >
                    <Text
                      className="text-white text-xl font-bold tracking-wide mr-2"
                      style={{ fontFamily: "Jost-Medium" }}
                    >
                      {selectedCount > 0
                        ? `ADD ${selectedCount} FRIENDS`
                        : "FINISH"}
                    </Text>
                    <ArrowRight color="white" size={24} />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default Onboarding;
