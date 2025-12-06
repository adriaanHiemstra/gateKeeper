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
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  ImagePlus,
  Clock,
  Type,
  Plus,
  Trash2,
  X,
  Search,
  Check,
  Tag,
  Video as VideoIcon,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Calendar as RNCalendar } from "react-native-calendars";
import { Video, ResizeMode } from "expo-av";

// Backend
import { supabase } from "../../lib/supabase";
import { uploadImage } from "../../lib/upload";
import { useAuth } from "../../context/AuthContext";

// Components
import HostTopBanner from "../../components/HostTopBanner";
import { bannerGradient, electricGradient } from "../../styles/colours";

// --- HELPER COMPONENTS ---
const InputField = ({
  icon,
  placeholder,
  value,
  onChange,
  multiline = false,
  keyboardType = "default",
}: any) => (
  <View
    className={`flex-row items-start bg-white/5 border border-white/10 rounded-xl px-4 mb-4 ${
      multiline ? "h-32 py-3" : "h-14 items-center"
    }`}
  >
    <View className={`mr-3 opacity-70 ${multiline ? "mt-1" : ""}`}>{icon}</View>
    <TextInput
      placeholder={placeholder}
      placeholderTextColor="#6b7280"
      value={value}
      onChangeText={onChange}
      multiline={multiline}
      textAlignVertical={multiline ? "top" : "center"}
      keyboardType={keyboardType}
      className="flex-1 text-white text-lg font-medium h-full"
      style={{ fontFamily: "Jost-Medium" }}
    />
  </View>
);

const SelectorButton = ({ icon, label, value, onPress, placeholder }: any) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-1 flex-row items-center bg-white/5 border border-white/10 rounded-xl px-4 h-14 mb-4"
  >
    <View className="mr-3 opacity-70">{icon}</View>
    <Text
      className={`text-lg font-medium ${
        value ? "text-white" : "text-gray-500"
      }`}
      style={{ fontFamily: "Jost-Medium" }}
      numberOfLines={1}
    >
      {value || placeholder}
    </Text>
  </TouchableOpacity>
);

// --- DATA ---
const TIMES = Array.from({ length: 48 }).map((_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, "0")}:${m}`;
});

const MOCK_LOCATIONS = [
  "Clifton 4th Beach, Cape Town",
  "Green Point Stadium, Cape Town",
  "The Power Station, CBD",
  "Shimmy Beach Club, V&A Waterfront",
  "Kirstenbosch Gardens, Newlands",
];

const AVAILABLE_TAGS = [
  "Techno",
  "House",
  "Live Music",
  "Rock",
  "Jazz",
  "Acoustic",
  "Sports",
  "Rugby",
  "Soccer",
  "Cricket",
  "Tennis",
  "Outdoors",
  "Beach",
  "Hike",
  "Run",
  "Market",
  "Festival",
  "Comedy",
  "Theatre",
  "Cinema",
  "Gaming",
  "Networking",
];

const CreateEventScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const [mediaItems, setMediaItems] = useState<
    { uri: string; type: "image" | "video" }[]
  >([]);

  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [activeDateModal, setActiveDateModal] = useState<
    "start" | "end" | null
  >(null);
  const [activeTimeModal, setActiveTimeModal] = useState<
    "start" | "end" | null
  >(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const [locQuery, setLocQuery] = useState("");
  const [locResults, setLocResults] = useState(MOCK_LOCATIONS);
  const [tagQuery, setTagQuery] = useState("");

  const [loading, setLoading] = useState(false);

  // --- HANDLERS ---

  const handlePickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "We need access to your photos.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.7,
      videoMaxDuration: 60,
    });

    if (!result.canceled) {
      const newAsset = result.assets[0];
      setMediaItems([
        ...mediaItems,
        {
          uri: newAsset.uri,
          type: newAsset.type === "video" ? "video" : "image",
        },
      ]);
    }
  };

  const removeMedia = (index: number) => {
    const updated = [...mediaItems];
    updated.splice(index, 1);
    setMediaItems(updated);
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleLocationSearch = (text: string) => {
    setLocQuery(text);
    if (!text) setLocResults(MOCK_LOCATIONS);
    else
      setLocResults(
        MOCK_LOCATIONS.filter((l) =>
          l.toLowerCase().includes(text.toLowerCase())
        )
      );
  };

  const handlePublish = async () => {
    if (
      !title ||
      !startDate ||
      !startTime ||
      !location ||
      mediaItems.length === 0
    ) {
      Alert.alert(
        "Missing Info",
        "Please fill in all required fields and add at least one image/video."
      );
      return;
    }

    setLoading(true);

    try {
      const uploadedUrls = await Promise.all(
        mediaItems.map((item) => uploadImage(item.uri, "event-banners"))
      );

      const startISO = new Date(`${startDate}T${startTime}:00`).toISOString();
      const endISO =
        endDate && endTime
          ? new Date(`${endDate}T${endTime}:00`).toISOString()
          : null;

      const { error } = await supabase.from("events").insert({
        host_id: user?.id,
        title: title,
        description: description,
        date: startISO,
        end_date: endISO,
        location_text: location,
        banner_url: uploadedUrls[0],
        images: uploadedUrls,
        tags: selectedTags,
        is_public: isPublic,
        category: selectedTags[0] || "Other",
      });

      if (error) throw error;

      Alert.alert("Success!", "Your event is live.");
      navigation.goBack();
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
        <KeyboardAwareScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 120, paddingBottom: 140 }}
          enableOnAndroid={true}
          extraScrollHeight={100}
        >
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
              Create Event
            </Text>
          </View>

          {/* 1. MEDIA */}
          <Text className="text-white text-xl font-bold mb-4">Event Media</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-8"
          >
            <TouchableOpacity
              onPress={handlePickMedia}
              className="w-32 h-40 bg-white/5 border-2 border-dashed border-white/20 rounded-2xl items-center justify-center mr-3"
            >
              <View className="bg-purple-500/20 p-3 rounded-full mb-2">
                <ImagePlus color="#D087FF" size={24} />
              </View>
              <Text className="text-gray-400 text-xs font-bold">Add Media</Text>
            </TouchableOpacity>

            {mediaItems.map((item, index) => (
              <View key={index} className="relative mr-3">
                {item.type === "video" ? (
                  <Video
                    source={{ uri: item.uri }}
                    style={{
                      width: 128,
                      height: 160,
                      borderRadius: 16,
                      backgroundColor: "#000",
                    }}
                    resizeMode={ResizeMode.COVER}
                    isMuted
                    shouldPlay={false}
                  />
                ) : (
                  <Image
                    source={{ uri: item.uri }}
                    className="w-32 h-40 rounded-2xl bg-gray-800"
                    resizeMode="cover"
                  />
                )}

                <TouchableOpacity
                  onPress={() => removeMedia(index)}
                  className="absolute top-2 right-2 bg-black/60 p-1 rounded-full"
                >
                  <X color="white" size={14} />
                </TouchableOpacity>

                {index === 0 && (
                  <View className="absolute bottom-2 left-2 bg-purple-600 px-2 py-0.5 rounded">
                    <Text className="text-white text-[10px] font-bold">
                      COVER
                    </Text>
                  </View>
                )}
                {item.type === "video" && (
                  <View className="absolute top-1/2 left-1/2 -ml-3 -mt-3">
                    <VideoIcon color="white" size={24} />
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          {/* 2. DETAILS */}
          <Text className="text-white text-xl font-bold mb-4">Basic Info</Text>

          <InputField
            icon={<Type color="white" size={20} />}
            placeholder="Event Title"
            value={title}
            onChange={setTitle}
          />

          <View className="flex-row gap-4">
            <View className="flex-1">
              <SelectorButton
                icon={<Calendar color="white" size={20} />}
                value={startDate}
                placeholder="Start Date"
                onPress={() => setActiveDateModal("start")}
              />
            </View>
            <View className="flex-1">
              <SelectorButton
                icon={<Clock color="white" size={20} />}
                value={startTime}
                placeholder="Start Time"
                onPress={() => setActiveTimeModal("start")}
              />
            </View>
          </View>

          <View className="flex-row gap-4">
            <View className="flex-1">
              <SelectorButton
                icon={<Calendar color="#999" size={20} />}
                value={endDate}
                placeholder="End Date (Opt)"
                onPress={() => setActiveDateModal("end")}
              />
            </View>
            <View className="flex-1">
              <SelectorButton
                icon={<Clock color="#999" size={20} />}
                value={endTime}
                placeholder="End Time (Opt)"
                onPress={() => setActiveTimeModal("end")}
              />
            </View>
          </View>

          <SelectorButton
            icon={<MapPin color="white" size={20} />}
            value={location}
            placeholder="Search Location"
            onPress={() => setShowLocationPicker(true)}
          />

          <SelectorButton
            icon={<Tag color="white" size={20} />}
            value={selectedTags.length > 0 ? selectedTags.join(", ") : ""}
            placeholder="Select Categories"
            onPress={() => setShowCategoryPicker(true)}
          />

          <InputField
            icon={<Type color="white" size={20} />}
            placeholder="Description..."
            value={description}
            onChange={setDescription}
            multiline={true}
          />

          <View className="flex-row justify-between items-center bg-white/5 p-4 rounded-xl mb-8">
            <Text className="text-white font-bold text-lg">Public Event</Text>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: "#767577", true: "#D087FF" }}
              thumbColor={"#f4f3f4"}
            />
          </View>
        </KeyboardAwareScrollView>

        {/* PUBLISH BUTTON */}
        <View className="absolute bottom-0 left-0 right-0 p-6 bg-[#121212]/90 border-t border-white/10">
          <TouchableOpacity
            activeOpacity={0.8}
            className="w-full shadow-lg shadow-purple-500/30"
            onPress={handlePublish}
            disabled={loading}
          >
            <LinearGradient
              {...electricGradient}
              className="w-full py-4 rounded-full items-center justify-center"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text
                  className="text-white text-xl font-bold tracking-wide"
                  style={{ fontFamily: "Jost-Medium" }}
                >
                  PUBLISH EVENT
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* --- CATEGORY PICKER MODAL (Updated: Bottom Sheet Style) --- */}
      <Modal visible={showCategoryPicker} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-[#1E1E1E] rounded-t-3xl h-[80%] overflow-hidden">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-white/10">
              <Text className="text-white text-xl font-bold">Categories</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Text className="text-purple-400 font-bold text-lg">Done</Text>
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View className="px-4 py-2">
              <View className="flex-row items-center bg-black/40 rounded-xl px-4 h-12">
                <Search color="#999" size={20} className="mr-2" />
                <TextInput
                  placeholder="Search categories..."
                  placeholderTextColor="#666"
                  value={tagQuery}
                  onChangeText={setTagQuery}
                  className="flex-1 text-white text-lg font-medium"
                />
              </View>
            </View>

            {/* List */}
            <FlatList
              data={AVAILABLE_TAGS.filter((t) =>
                t.toLowerCase().includes(tagQuery.toLowerCase())
              )}
              keyExtractor={(item) => item}
              contentContainerStyle={{ paddingBottom: 40 }}
              renderItem={({ item }) => {
                const isSelected = selectedTags.includes(item);
                return (
                  <TouchableOpacity
                    onPress={() => toggleTag(item)}
                    className="flex-row items-center justify-between p-4 border-b border-white/5"
                  >
                    <Text
                      className={`text-lg font-bold ${
                        isSelected ? "text-purple-300" : "text-white"
                      }`}
                    >
                      {item}
                    </Text>
                    {isSelected && <Check color="#D087FF" size={20} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* --- DATE/TIME/LOCATION MODALS (Standard) --- */}
      <Modal visible={!!activeDateModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-[#1E1E1E] rounded-t-3xl p-4 h-[70%]">
            <View className="flex-row justify-between items-center mb-6 px-2">
              <Text className="text-white text-2xl font-bold">
                {activeDateModal === "start" ? "Start Date" : "End Date"}
              </Text>
              <TouchableOpacity
                onPress={() => setActiveDateModal(null)}
                className="bg-white/10 p-2 rounded-full"
              >
                <X color="white" size={24} />
              </TouchableOpacity>
            </View>
            <RNCalendar
              onDayPress={(day: any) => {
                if (activeDateModal === "start") setStartDate(day.dateString);
                else setEndDate(day.dateString);
                setActiveDateModal(null);
              }}
              theme={{
                backgroundColor: "#1E1E1E",
                calendarBackground: "#1E1E1E",
                dayTextColor: "#ffffff",
                todayTextColor: "#D087FF",
                selectedDayBackgroundColor: "#D087FF",
                selectedDayTextColor: "#ffffff",
                monthTextColor: "white",
                arrowColor: "#D087FF",
              }}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={!!activeTimeModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-[#1E1E1E] rounded-t-3xl p-4 h-[60%]">
            <View className="flex-row justify-between items-center mb-4 px-2">
              <Text className="text-white text-2xl font-bold">
                {activeTimeModal === "start" ? "Start Time" : "End Time"}
              </Text>
              <TouchableOpacity
                onPress={() => setActiveTimeModal(null)}
                className="bg-white/10 p-2 rounded-full"
              >
                <X color="white" size={24} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={TIMES}
              keyExtractor={(item) => item}
              initialScrollIndex={24}
              getItemLayout={(data, index) => ({
                length: 60,
                offset: 60 * index,
                index,
              })}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    if (activeTimeModal === "start") setStartTime(item);
                    else setEndTime(item);
                    setActiveTimeModal(null);
                  }}
                  className="p-4 border-b border-white/5 flex-row justify-between"
                >
                  <Text className="text-white text-lg font-bold">{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showLocationPicker} transparent animationType="slide">
        <View className="flex-1 bg-[#1E1E1E]">
          <SafeAreaView className="flex-1">
            <View className="flex-row items-center px-4 py-4 border-b border-white/10">
              <TouchableOpacity
                onPress={() => setShowLocationPicker(false)}
                className="mr-4"
              >
                <ArrowLeft color="white" size={24} />
              </TouchableOpacity>
              <View className="flex-1 flex-row items-center bg-black/40 rounded-xl px-4 h-12">
                <Search color="#999" size={20} className="mr-2" />
                <TextInput
                  placeholder="Search..."
                  placeholderTextColor="#666"
                  value={locQuery}
                  onChangeText={handleLocationSearch}
                  autoFocus
                  className="flex-1 text-white text-lg font-medium"
                />
              </View>
            </View>
            <FlatList
              data={locResults}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setLocation(item);
                    setShowLocationPicker(false);
                  }}
                  className="flex-row items-center p-4 border-b border-white/5"
                >
                  <View className="bg-white/10 p-2 rounded-full mr-3">
                    <MapPin color="white" size={20} />
                  </View>
                  <Text className="text-white text-lg font-medium">{item}</Text>
                </TouchableOpacity>
              )}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
};

export default CreateEventScreen;
