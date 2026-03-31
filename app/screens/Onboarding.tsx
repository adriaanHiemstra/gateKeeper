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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowRight,
  MapPin,
  Edit3,
  User,
  Check,
  Phone,
  Users,
  CheckCircle2,
  Circle,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import * as Contacts from "expo-contacts";

// Backend
import { supabase } from "../lib/supabase"; // <--- ADD THIS RIGHT HERE!

// Styles
import { bannerGradient, fireGradient } from "../styles/colours";
import { RootStackParamList } from "../types/types";

// ... rest of the file

// --- CONSTANTS ---
const AVATAR_COLORS = [
  "#FF5733",
  "#33FF57",
  "#3357FF",
  "#F033FF",
  "#FFB533",
  "#00E5FF",
];
const CATEGORIES = [
  "Acoustic",
  "Activities",
  "Afrobeats",
  "Amapiano",
  "Art",
  "Beach",
  "Cinema",
  "Comedy",
  "Crafts",
  "Cricket",
  "Date Night",
  "DnB",
  "Electronic",
  "Festivals",
  "Food Market",
  "Gaming",
  "Hikes",
  "Hiking",
  "Hip Hop",
  "House",
  "Jazz",
  "Live Music",
  "Magic",
  "Markets",
  "Music",
  "Nightlife",
  "Outdoors",
  "Psytrance",
  "Quiz",
  "Rock",
  "Rugby",
  "Running",
  "Shows",
  "Soccer",
  "Sports",
  "Surfing",
  "Techno",
  "Tennis",
  "Theatre",
  "Thrift",
  "Workshops",
  "Yoga",
];

// --- TYPES ---
type MatchedContact = {
  id: string;
  phoneName: string;
  username: string;
  avatarColor: string;
  isSelected: boolean;
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

  // Screen 2: Vibe Check State
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Screen 3 & 4: Contacts State
  const [phoneNumber, setPhoneNumber] = useState("");
  const [matchedContacts, setMatchedContacts] = useState<MatchedContact[]>([]);

  useEffect(() => {
    setAvatarColor(
      AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    );
  }, []);

  // --- ACTIONS ---
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      if (selectedTags.length >= 5) return;
      setSelectedTags([...selectedTags, tag]);
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

  // --- THE CREW SYNC LOGIC (WITH SA NORMALIZER!) ---
  const handleSyncContacts = async (skipSync: boolean = false) => {
    if (!phoneNumber && !skipSync) {
      Alert.alert(
        "Hold up",
        "Please enter your own phone number so your friends can find you!",
      );
      return;
    }

    if (skipSync) {
      finishOnboarding();
      return;
    }

    setIsFinishing(true);

    try {
      const { status } = await Contacts.requestPermissionsAsync();

      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
        });

        // 1. Extract, clean, and NORMALIZE the numbers for South Africa
        const cleanedContacts = data
          .flatMap((c) =>
            c.phoneNumbers ? c.phoneNumbers.map((p) => p.number) : [],
          )
          .filter(Boolean)
          .map((num) => num?.replace(/\D/g, "")) // Strip spaces and symbols
          .flatMap((num) => {
            if (!num) return [];

            // If it's a +27 number, generate both the 27 and 0 versions
            if (num.startsWith("27") && num.length === 11) {
              return [num, "0" + num.substring(2)];
            }
            // If it's a local 0 number, generate both the 0 and 27 versions
            else if (num.startsWith("0") && num.length === 10) {
              return [num, "27" + num.substring(1)];
            }

            // Otherwise, just return the number as-is
            return [num];
          });

        // Remove duplicates just in case
        const uniqueContacts = Array.from(new Set(cleanedContacts));

        // 🔥 LOUD LOG: It should say "NORMALIZED" now!
        console.log("📱 NORMALIZED CONTACTS:", uniqueContacts.slice(0, 10));

        // 2. Call our massive Database function
        const { data: dbMatches, error } = await supabase.rpc(
          "match_contacts",
          {
            phone_array: uniqueContacts, // <-- Now sending BOTH versions of every number
          },
        );

        if (error) {
          console.error("❌ SUPABASE RPC ERROR:", error.message);
          throw error;
        }

        console.log("✅ DB MATCHES FOUND:", dbMatches);

        // 3. Format the data for our UI Checklist
        if (dbMatches && dbMatches.length > 0) {
          const formattedMatches = dbMatches.map((match: any) => ({
            id: match.id,
            phoneName: match.full_name || "Mystery Friend",
            username: match.username || "@new_user",
            avatarColor: match.avatar_color || "#FA8900",
            isSelected: true, // Default to checked!
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

  const finishOnboarding = () => {
    const finalFriendsToSync = matchedContacts
      .filter((c) => c.isSelected)
      .map((c) => c.id);

    console.log("🚀 FINAL PAYLOAD READY FOR SUPABASE:", {
      profile: { bio, location, avatarColor, phoneNumber },
      interests: selectedTags,
      friendsToAdd: finalFriendsToSync,
    });

    navigation.replace("Home");
  };

  // Calculate how many friends are currently checked
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
            {/* PROGRESS BAR (Only show on steps 1-3) */}
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
                  className="text-white text-4xl font-bold mb-2"
                  style={{ fontFamily: "Jost-Medium" }}
                >
                  Set your vibe.
                </Text>
                <Text className="text-gray-400 text-lg mb-10">
                  How should the crowd know you?
                </Text>

                <View className="items-center mb-8">
                  <View
                    className="w-32 h-32 rounded-full items-center justify-center border-4 border-[#121212] shadow-2xl"
                    style={{ backgroundColor: avatarColor }}
                  >
                    <User color="white" size={48} opacity={0.8} />
                  </View>
                  <TouchableOpacity className="mt-4 bg-white/10 px-4 py-2 rounded-full border border-white/10">
                    <Text className="text-white font-bold text-sm">
                      Add Photo (Later)
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* BIO INPUT */}
                <View className="mb-6">
                  <Text className="text-gray-400 text-xs font-bold uppercase mb-2 ml-1">
                    Short Bio
                  </Text>
                  <View className="flex-row bg-white/10 border border-white/20 rounded-2xl px-4 pt-4 pb-2 min-h-[100px]">
                    <Edit3
                      color="white"
                      size={20}
                      className="mr-3 mt-1 opacity-70"
                    />
                    <TextInput
                      placeholder="I love techno and long hikes..."
                      placeholderTextColor="#666"
                      value={bio}
                      onChangeText={setBio}
                      multiline
                      maxLength={150}
                      className="flex-1 text-white text-lg font-medium ml-2"
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
                  Pick up to 5 things you're into. We'll curate your feed.
                </Text>

                <View className="flex-row flex-wrap justify-start">
                  {CATEGORIES.map((tag, index) => (
                    <AnimatedTag
                      key={index}
                      label={tag}
                      isSelected={selectedTags.includes(tag)}
                      onPress={() => toggleTag(tag)}
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
                      {/* Random Colored Avatar for Friend */}
                      <View
                        className="w-12 h-12 rounded-full items-center justify-center mr-4"
                        style={{ backgroundColor: contact.avatarColor }}
                      >
                        <User color="white" size={20} opacity={0.8} />
                      </View>

                      {/* Name & Username */}
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

                      {/* Custom Checkbox */}
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
                  {/* SYNC BUTTON */}
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

                  {/* SKIP BUTTON */}
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
                // STEP 4 FINISH BUTTON
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
