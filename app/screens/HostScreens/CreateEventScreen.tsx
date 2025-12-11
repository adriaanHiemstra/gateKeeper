import React, { useState, useMemo } from "react";
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
  Modal,
  FlatList,
  LayoutAnimation,
  Platform,
  UIManager,
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
  Trash2,
  X,
  Search,
  Check,
  Tag,
  Video as VideoIcon,
  Ticket,
  Plus,
  Pencil,
  Hash,
  Sparkles,
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

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- CUSTOM SWITCH COMPONENT ---
const CustomSwitch = ({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (val: boolean) => void;
}) => {
  const toggleSwitch = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onValueChange(!value);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={toggleSwitch}
      className={`w-16 h-9 rounded-full justify-center px-1 ${
        value ? "bg-[#4ade80]" : "bg-[#3A3A3A]"
      }`}
    >
      <View
        className={`w-7 h-7 bg-white rounded-full shadow-sm ${
          value ? "self-end" : "self-start"
        }`}
      />
    </TouchableOpacity>
  );
};

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
    className={`flex-row items-start bg-white/5 border border-white/10 rounded-2xl px-4 mb-4 ${
      multiline ? "h-32 py-4" : "h-16 items-center"
    }`}
  >
    <View className={`mr-4 opacity-70 ${multiline ? "mt-1" : ""}`}>{icon}</View>
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
    className="flex-1 flex-row items-center bg-white/5 border border-white/10 rounded-2xl px-4 h-16 mb-4"
  >
    <View className="mr-4 opacity-70">{icon}</View>
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
const ALL_TIMES = Array.from({ length: 48 }).map((_, i) => {
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

// --- TYPES ---
type TicketTier = {
  name: string;
  price: string;
  quantity: string;
  active: boolean;
};

const CreateEventScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  // Tickets State
  const [tickets, setTickets] = useState<TicketTier[]>([
    { name: "General Admission", price: "150", quantity: "100", active: true },
  ]);

  // Ticket Modal State
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [editingTicketIndex, setEditingTicketIndex] = useState<number | null>(
    null
  );
  const [tempTicket, setTempTicket] = useState<TicketTier>({
    name: "",
    price: "",
    quantity: "",
    active: true,
  });

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

  // --- LOGIC: Filter Past Times ---
  const todayDateString = new Date().toISOString().split("T")[0];

  const availableTimes = useMemo(() => {
    if (activeTimeModal === "start" && startDate === todayDateString) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      return ALL_TIMES.filter((t) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m > currentMinutes;
      });
    }
    return ALL_TIMES;
  }, [activeTimeModal, startDate]);

  // --- HANDLERS ---

  const handlePickMedia = async (replaceIndex?: number) => {
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
      const newItem: { uri: string; type: "image" | "video" } = {
        uri: newAsset.uri,
        type: newAsset.type === "video" ? "video" : "image",
      };

      if (replaceIndex !== undefined) {
        const updated = [...mediaItems];
        updated[replaceIndex] = newItem;
        setMediaItems(updated);
      } else {
        setMediaItems([...mediaItems, newItem]);
      }
    }
  };

  const removeMedia = (index: number) => {
    const updated = [...mediaItems];
    updated.splice(index, 1);
    setMediaItems(updated);
  };

  // --- TICKET HANDLERS ---
  const openTicketModal = (index?: number) => {
    if (index !== undefined) {
      setEditingTicketIndex(index);
      setTempTicket({ ...tickets[index] });
    } else {
      setEditingTicketIndex(null);
      setTempTicket({ name: "", price: "", quantity: "", active: true });
    }
    setShowTicketModal(true);
  };

  const saveTicket = () => {
    if (!tempTicket.name || !tempTicket.price) {
      Alert.alert("Missing Info", "Please enter a ticket name and price.");
      return;
    }

    const updated = [...tickets];
    if (editingTicketIndex !== null) {
      updated[editingTicketIndex] = tempTicket;
    } else {
      updated.push(tempTicket);
    }
    setTickets(updated);
    setShowTicketModal(false);
  };

  const deleteTicket = () => {
    if (editingTicketIndex !== null) {
      const updated = [...tickets];
      updated.splice(editingTicketIndex, 1);
      setTickets(updated);
      setShowTicketModal(false);
    }
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
        ticket_tiers: tickets, // Save full ticket object
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
        {/* ✅ MAIN SCREEN SCROLLER: Increased extraScrollHeight & tuned props */}
        <KeyboardAwareScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 120, paddingBottom: 140 }}
          enableOnAndroid={true}
          extraScrollHeight={120} // Slightly increased to push Description higher
          keyboardShouldPersistTaps="handled"
          enableAutomaticScroll={true}
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
              onPress={() => handlePickMedia()}
              className="w-32 h-40 bg-white/5 border-2 border-dashed border-white/20 rounded-2xl items-center justify-center mr-3"
            >
              <View className="bg-purple-500/20 p-3 rounded-full mb-2">
                <ImagePlus color="#D087FF" size={24} />
              </View>
              <Text className="text-gray-400 text-xs font-bold">Add Media</Text>
            </TouchableOpacity>

            {mediaItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                onPress={() => handlePickMedia(index)}
                className="relative mr-3"
              >
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
                  className="absolute top-2 right-2 bg-red-500/80 p-1.5 rounded-full z-10"
                >
                  <X color="white" size={12} />
                </TouchableOpacity>
                <View className="absolute bottom-2 right-2 bg-black/60 p-1.5 rounded-full">
                  <Pencil color="white" size={12} />
                </View>
                {index === 0 && (
                  <View className="absolute bottom-2 left-2 bg-purple-600 px-2 py-0.5 rounded">
                    <Text className="text-white text-[10px] font-bold">
                      COVER
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
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

          {/* 3. TICKET TIERS SECTION */}
          <View className="mb-8">
            <View className="flex-row justify-between items-end mb-4">
              <Text className="text-white text-xl font-bold">Ticket Tiers</Text>
              <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                {tickets.length} Types
              </Text>
            </View>

            {/* Ticket Cards List */}
            {tickets.map((ticket, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => openTicketModal(index)}
                activeOpacity={0.7}
                // ✅ CONDITIONAL STYLING: Green highlight if Active, else Standard dark
                className={`rounded-2xl p-5 mb-3 flex-row items-center justify-between border ${
                  ticket.active
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    {/* Icon Changes Color too */}
                    <Ticket
                      color={ticket.active ? "#4ade80" : "white"}
                      size={20}
                      className="mr-3"
                    />

                    <Text
                      className={`text-xl font-bold mr-3 ml-2 ${
                        ticket.active ? "text-white" : "text-gray-400"
                      }`}
                    >
                      {ticket.name}
                    </Text>

                    {!ticket.active && (
                      <View className="bg-red-500/20 px-2 py-0.5 ml-2 rounded border border-red-500/50">
                        <Text className="text-red-400 text-[10px] font-bold uppercase">
                          Inactive
                        </Text>
                      </View>
                    )}
                  </View>
                  <View className="flex-row items-center pl-8">
                    <Tag color="#666" size={14} className="mr-1" />
                    <Text className="text-gray-400 text-sm font-medium mr-4 ml-1">
                      {ticket.quantity
                        ? `${ticket.quantity} Left`
                        : "Unlimited"}
                    </Text>
                  </View>
                </View>

                {/* Price Badge */}
                <View
                  className={`px-4 py-2 rounded-xl border ml-3 ${
                    ticket.active
                      ? "bg-black/40 border-green-500/20"
                      : "bg-black/40 border-white/5"
                  }`}
                >
                  <Text
                    className={`text-lg font-bold ${
                      ticket.active ? "text-green-400" : "text-white"
                    }`}
                  >
                    R {ticket.price}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Add New Button */}
            <TouchableOpacity
              onPress={() => openTicketModal()}
              className="flex-row items-center justify-center bg-white/5 border border-dashed border-white/30 rounded-2xl py-5 mt-2"
            >
              <View className="bg-purple-500/20 p-2 rounded-full mr-3">
                <Plus color="#D087FF" size={20} />
              </View>
              <Text className="text-purple-300 font-bold text-lg">
                Add Ticket Tier
              </Text>
            </TouchableOpacity>
          </View>

          {/* PUBLIC SWITCH */}
          <View className="flex-row justify-between items-center bg-white/5 p-5 rounded-2xl mb-8 border border-white/5">
            <View>
              <Text className="text-white font-bold text-lg">Public Event</Text>
              <Text className="text-gray-400 text-xs mt-1">
                Visible to everyone on the map
              </Text>
            </View>
            <CustomSwitch value={isPublic} onValueChange={setIsPublic} />
          </View>
        </KeyboardAwareScrollView>

        {/* PUBLISH BUTTON */}
        <View className="absolute bottom-0 left-0 right-0 p-6 bg-[#121212]/95 border-t border-white/10 blur-xl">
          <TouchableOpacity
            activeOpacity={0.8}
            className="w-full shadow-lg shadow-purple-500/30"
            onPress={handlePublish}
            disabled={loading}
          >
            <LinearGradient
              {...electricGradient}
              className="w-full py-5 rounded-full items-center justify-center"
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

      {/* --- TICKET MODAL --- */}
      <Modal visible={showTicketModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/60">
          {/* Main Modal Container */}
          <View className="h-[85%] bg-[#121212] rounded-t-[40px] overflow-hidden border-t border-white/20 shadow-2xl shadow-purple-500/20">
            {/* 1. GRADIENT HEADER */}
            <LinearGradient
              colors={["#240b36", "#121212"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              className="px-6 pt-8 pb-6 border-b border-white/5"
            >
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-white text-3xl font-bold mb-1">
                    {editingTicketIndex !== null ? "Edit Ticket" : "New Ticket"}
                  </Text>
                  <Text className="text-purple-300 font-medium">
                    Configure availability & pricing
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowTicketModal(false)}
                  className="bg-white/10 p-3 rounded-full backdrop-blur-md"
                >
                  <X color="white" size={24} />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* 2. FORM CONTENT - ✅ REPLACED ScrollView WITH KeyboardAwareScrollView */}
            <KeyboardAwareScrollView
              className="flex-1 px-6 pt-8"
              contentContainerStyle={{ paddingBottom: 100 }}
              enableOnAndroid={true}
              extraScrollHeight={100}
              keyboardShouldPersistTaps="handled"
            >
              {/* Name Input */}
              <View className="mb-6">
                <Text className="text-gray-400 font-bold mb-3 ml-2 uppercase tracking-wide text-xs">
                  Ticket Name
                </Text>
                <View className="flex-row items-center bg-[#1E1E1E] border border-white/10 rounded-3xl px-5 h-20 shadow-lg">
                  <View className="bg-purple-500/20 p-3 rounded-full mr-4">
                    <Ticket color="#D087FF" size={24} />
                  </View>
                  <TextInput
                    placeholder="e.g. Early Bird, VIP Access"
                    placeholderTextColor="#555"
                    value={tempTicket.name}
                    onChangeText={(t) =>
                      setTempTicket({ ...tempTicket, name: t })
                    }
                    className="flex-1 text-white text-xl font-bold h-full mb-1"
                  />
                </View>
              </View>

              {/* Price & Quantity Grid */}
              <View className="flex-row gap-4 mb-6">
                {/* Price */}
                <View className="flex-1">
                  <Text className="text-gray-400 font-bold mb-3 ml-2 uppercase tracking-wide text-xs">
                    Price
                  </Text>
                  <View className="flex-row items-center bg-[#1E1E1E] border border-white/10 rounded-3xl px-4 h-20 shadow-lg">
                    <Text className="text-gray-500 text-2xl font-bold mr-2">
                      R
                    </Text>
                    <TextInput
                      placeholder="0"
                      placeholderTextColor="#555"
                      keyboardType="numeric"
                      value={tempTicket.price}
                      onChangeText={(t) =>
                        setTempTicket({ ...tempTicket, price: t })
                      }
                      className="flex-1 text-white text-2xl font-bold h-full mb-1"
                    />
                  </View>
                </View>

                {/* Quantity */}
                <View className="flex-1">
                  <Text className="text-gray-400 font-bold mb-3 ml-2 uppercase tracking-wide text-xs">
                    Quantity
                  </Text>
                  <View className="flex-row items-center bg-[#1E1E1E] border border-white/10 rounded-3xl px-4 h-20 shadow-lg">
                    <View className="bg-orange-500/20 p-2 rounded-full mr-3">
                      <Hash color="#FFA500" size={18} />
                    </View>
                    <TextInput
                      placeholder="∞"
                      placeholderTextColor="#555"
                      keyboardType="numeric"
                      value={tempTicket.quantity}
                      onChangeText={(t) =>
                        setTempTicket({ ...tempTicket, quantity: t })
                      }
                      className="flex-1 text-white text-xl font-bold h-full mb-2"
                    />
                  </View>
                </View>
              </View>

              {/* Status Card */}
              <View className="mb-8">
                <Text className="text-gray-400 font-bold mb-3 ml-2 uppercase tracking-wide text-xs">
                  Availability
                </Text>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() =>
                    setTempTicket({ ...tempTicket, active: !tempTicket.active })
                  }
                  className={`p-1 rounded-3xl border ${
                    tempTicket.active
                      ? "border-green-500/30 bg-green-900/10"
                      : "border-red-500/30 bg-red-900/10"
                  }`}
                >
                  <LinearGradient
                    colors={
                      tempTicket.active
                        ? ["rgba(34, 197, 94, 0.1)", "rgba(34, 197, 94, 0.05)"]
                        : ["rgba(239, 68, 68, 0.1)", "rgba(239, 68, 68, 0.05)"]
                    }
                    className="p-5 rounded-[20px] flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center">
                      <View
                        className={`p-3 rounded-full mr-4 ${
                          tempTicket.active
                            ? "bg-green-500/20"
                            : "bg-red-500/20"
                        }`}
                      >
                        <Sparkles
                          color={tempTicket.active ? "#4ade80" : "#f87171"}
                          size={24}
                          fill={tempTicket.active ? "#4ade80" : "none"}
                        />
                      </View>
                      <View>
                        <Text
                          className={`text-xl font-bold ${
                            tempTicket.active
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {tempTicket.active
                            ? "Ticket is Active"
                            : "Ticket Paused"}
                        </Text>
                        <Text className="text-gray-400 text-xs">
                          {tempTicket.active
                            ? "Attendees can purchase this ticket."
                            : "Hidden from attendees."}
                        </Text>
                      </View>
                    </View>
                    <CustomSwitch
                      value={tempTicket.active}
                      onValueChange={(v) =>
                        setTempTicket({ ...tempTicket, active: v })
                      }
                    />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </KeyboardAwareScrollView>

            {/* 3. FOOTER ACTIONS */}
            <View className="absolute bottom-0 left-0 right-0 p-6 bg-[#121212] border-t border-white/10">
              <View className="flex-row gap-4">
                {/* Delete Button (Only if editing) */}
                {editingTicketIndex !== null && (
                  <TouchableOpacity
                    onPress={deleteTicket}
                    className="flex-1 bg-red-500/10 border border-red-500/30 rounded-3xl items-center justify-center h-16"
                  >
                    <Trash2 color="#f87171" size={24} />
                  </TouchableOpacity>
                )}

                {/* Main Save Button */}
                <TouchableOpacity
                  onPress={saveTicket}
                  className={`${
                    editingTicketIndex !== null ? "flex-[3]" : "flex-1"
                  } shadow-lg shadow-purple-500/40`}
                >
                  <LinearGradient
                    {...electricGradient}
                    className="w-full h-16 rounded-3xl flex-row items-center justify-center"
                  >
                    <Check
                      color="white"
                      size={24}
                      strokeWidth={3}
                      className="mr-2"
                    />
                    <Text className="text-white text-xl font-bold">
                      Save Ticket
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- CATEGORY PICKER --- */}
      <Modal visible={showCategoryPicker} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-[#1E1E1E] rounded-t-3xl h-[80%] overflow-hidden">
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-white/10">
              <Text className="text-white text-xl font-bold">Categories</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Text className="text-purple-400 font-bold text-lg">Done</Text>
              </TouchableOpacity>
            </View>
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

      {/* --- DATE/TIME MODALS --- */}
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
              minDate={todayDateString}
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
                textDisabledColor: "#444",
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
              data={availableTimes}
              keyExtractor={(item) => item}
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

      {/* --- LOCATION PICKER --- */}
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
