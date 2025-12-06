import React, { useState } from "react";
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
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

// Components
import TopBanner from "../../components/TopBanner";
import BottomNav from "../../components/BottomNav";

// Styles
import { bannerGradient, fireGradient } from "../../styles/colours";

const EditUserProfile = () => {
  const navigation = useNavigation();

  // Mock User Data
  const [name, setName] = useState("Adriaan");
  const [handle, setHandle] = useState("adriaan_za");
  const [bio, setBio] = useState(
    "Always looking for the next big festival. 🎵"
  );
  const [location, setLocation] = useState("Cape Town, SA");
  const [profilePic, setProfilePic] = useState<any>(
    require("../../assets/profile-pic-1.png")
  );

  const handleSave = () => {
    Alert.alert(
      "Profile Updated",
      "Your details have been saved successfully."
    );
    navigation.goBack();
  };

  const handlePickImage = async () => {
    // 1. Request Permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "We need access to your photos to upload a profile picture."
      );
      return;
    }

    // 2. Launch Picker (1:1 Aspect Ratio for Profile)
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Force Square
      quality: 0.8,
    });

    if (!result.canceled) {
      // 3. Check for low quality (Optional)
      if (result.assets[0].width < 500 || result.assets[0].height < 500) {
        Alert.alert("Low Quality", "This image might look blurry.");
      }
      setProfilePic({ uri: result.assets[0].uri });
    }
  };

  // Input Helper Component
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
            contentContainerStyle={{ paddingTop: 120, paddingBottom: 180 }}
          >
            {/* HEADER */}
            <View className="flex-row items-center mb-8">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="mr-4 bg-white/10 p-2 rounded-full"
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
                <View className="w-32 h-32 rounded-full border-4 border-orange-500/50 shadow-lg shadow-black/50 overflow-hidden">
                  <Image
                    source={profilePic}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>
                <TouchableOpacity
                  onPress={handlePickImage} // Connects to the picker function
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
            />

            <ProfileInput
              label="Username"
              icon={<AtSign color="white" size={20} />}
              value={handle}
              onChange={setHandle}
            />

            <ProfileInput
              label="Location"
              icon={<MapPin color="white" size={20} />}
              value={location}
              onChange={setLocation}
            />

            <ProfileInput
              label="Bio"
              icon={<AlignLeft color="white" size={20} />}
              value={bio}
              onChange={setBio}
              multiline={true}
            />
          </ScrollView>

          {/* SAVE BUTTON */}
          <View className="absolute bottom-36 left-0 right-0 p-6">
            <TouchableOpacity
              activeOpacity={0.8}
              className="w-full shadow-lg shadow-orange-500/20"
              onPress={handleSave}
            >
              <LinearGradient
                {...fireGradient}
                className="w-full py-4 rounded-full flex-row items-center justify-center"
              >
                <Save color="white" size={20} className="mr-2" />
                <Text
                  className="text-white text-xl font-bold tracking-wide"
                  style={{ fontFamily: "Jost-Medium" }}
                >
                  SAVE CHANGES
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <BottomNav />
    </View>
  );
};

export default EditUserProfile;
