import React, { useState, useEffect } from "react";
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
import {
  ArrowLeft,
  Calendar,
  MapPin,
  ImagePlus,
  Clock,
  Type,
  Plus,
  Trash2,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

// Backend
import { supabase } from "../../lib/supabase";
import { uploadImage } from "../../lib/upload";

// Components
import HostTopBanner from "../../components/HostTopBanner";

// Styles
import { bannerGradient, electricGradient } from "../../styles/colours";
import { RootStackParamList } from "../../types/types";

type EditEventRouteProp = RouteProp<RootStackParamList, "EditEvent">;

const EditEventScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<EditEventRouteProp>();
  const { eventId } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [imageChanged, setImageChanged] = useState(false); // Track if we need to re-upload

  // 1. FETCH EXISTING DATA ON LOAD
  useEffect(() => {
    fetchEventDetails();
  }, []);

  const fetchEventDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (error) throw error;

      // Populate State
      setTitle(data.title);
      setLocation(data.location_text);
      setDescription(data.description);
      setBannerImage(data.banner_url);
      setIsPublic(data.is_public);

      // Parse timestamp into Date/Time (Simplified for demo)
      const dt = new Date(data.date);
      setDate(dt.toISOString().split("T")[0]); // YYYY-MM-DD
      setTime(dt.toTimeString().slice(0, 5)); // HH:MM
    } catch (error: any) {
      Alert.alert("Error", "Could not fetch event details.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // 2. IMAGE PICKER
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "We need access to your photos.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.7,
    });

    if (!result.canceled) {
      setBannerImage(result.assets[0].uri);
      setImageChanged(true); // Mark as changed so we know to upload it
    }
  };

  // 3. SAVE CHANGES (UPDATE)
  const handleSave = async () => {
    setSaving(true);
    try {
      let publicUrl = bannerImage;

      // Only upload if the image was actually changed
      if (imageChanged && bannerImage) {
        publicUrl = await uploadImage(bannerImage, "event-banners");
      }

      // Update Database
      const { error } = await supabase
        .from("events")
        .update({
          title,
          description,
          location_text: location,
          // Re-combine date/time or just save date string for now
          // date: new Date(`${date}T${time}:00`).toISOString(),
          banner_url: publicUrl,
          is_public: isPublic,
        })
        .eq("id", eventId); // 👈 CRITICAL: Updates THIS specific event

      if (error) throw error;

      Alert.alert("Success", "Event updated!");
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Event", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase
            .from("events")
            .delete()
            .eq("id", eventId);
          if (!error) navigation.goBack();
        },
      },
    ]);
  };

  // Reusable Input
  const InputField = ({
    icon,
    placeholder,
    value,
    onChange,
    multiline = false,
  }: any) => (
    <View
      className={`flex-row items-start bg-white/5 border border-white/10 rounded-xl px-4 mb-4 ${
        multiline ? "h-32 py-3" : "h-14 items-center"
      }`}
    >
      <View className={`mr-3 opacity-70 ${multiline ? "mt-1" : ""}`}>
        {icon}
      </View>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#6b7280"
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        className="flex-1 text-white text-lg font-medium h-full"
        style={{ fontFamily: "Jost-Medium" }}
      />
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-[#121212] justify-center items-center">
        <ActivityIndicator size="large" color="#B92BFF" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <View className="absolute inset-0 bg-black/40" />

      <HostTopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 120, paddingBottom: 140 }}
        >
          <View className="flex-row items-center justify-between mb-8">
            <View className="flex-row items-center">
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
                Edit Details
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleDelete}
              className="bg-red-500/20 p-2 rounded-full"
            >
              <Trash2 color="#ef4444" size={24} />
            </TouchableOpacity>
          </View>

          {/* VISUALS */}
          <Text className="text-white text-xl font-bold mb-4">
            Event Visuals
          </Text>
          <View className="mb-6">
            <Image
              source={{ uri: bannerImage || undefined }} // Handle null
              className="w-full h-48 rounded-2xl mb-3"
              resizeMode="cover"
            />
            <TouchableOpacity
              onPress={handlePickImage}
              className="flex-row items-center justify-center bg-white/10 py-3 rounded-xl border border-white/10"
            >
              <ImagePlus color="white" size={20} className="mr-2" />
              <Text className="text-white font-bold">Change Banner Image</Text>
            </TouchableOpacity>
          </View>

          {/* DETAILS */}
          <Text className="text-white text-xl font-bold mb-4">Basic Info</Text>

          <InputField
            icon={<Type color="white" size={20} />}
            placeholder="Event Title"
            value={title}
            onChange={setTitle}
          />

          <View className="flex-row gap-4">
            <View className="flex-1">
              <InputField
                icon={<Calendar color="white" size={20} />}
                placeholder="Date"
                value={date}
                onChange={setDate}
              />
            </View>
            <View className="flex-1">
              <InputField
                icon={<Clock color="white" size={20} />}
                placeholder="Time"
                value={time}
                onChange={setTime}
              />
            </View>
          </View>

          <InputField
            icon={<MapPin color="white" size={20} />}
            placeholder="Location"
            value={location}
            onChange={setLocation}
          />

          <InputField
            icon={<Type color="white" size={20} />}
            placeholder="Description"
            value={description}
            onChange={setDescription}
            multiline={true}
          />

          {/* TOGGLE */}
          <View className="flex-row justify-between items-center bg-white/5 p-4 rounded-xl mb-8">
            <Text className="text-white font-bold text-lg">Public Event</Text>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: "#767577", true: "#D087FF" }}
              thumbColor={"#f4f3f4"}
            />
          </View>
        </ScrollView>

        {/* SAVE BUTTON */}
        <View className="absolute bottom-0 left-0 right-0 p-6 bg-[#121212]/90 border-t border-white/10">
          <TouchableOpacity
            activeOpacity={0.8}
            className="w-full shadow-lg shadow-purple-500/30"
            onPress={handleSave}
            disabled={saving}
          >
            <LinearGradient
              {...electricGradient}
              className="w-full py-4 rounded-full items-center justify-center"
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text
                  className="text-white text-xl font-bold tracking-wide"
                  style={{ fontFamily: "Jost-Medium" }}
                >
                  SAVE CHANGES
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default EditEventScreen;
