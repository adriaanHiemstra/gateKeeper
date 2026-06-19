// app/screens/EditEventsScreen.tsx
import React, { useState, useEffect, useMemo } from "react";
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
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  ImagePlus,
  Clock,
  Type,
  X,
  Search,
  Check,
  Tag,
  Ticket,
  Plus,
  Hash,
  Sparkles,
  Star,
  Trash2,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Calendar as RNCalendar } from "react-native-calendars";
import { Video, ResizeMode } from "expo-av";

// Google Places
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";

// Backend
import { supabase } from "../../lib/supabase";
import { uploadImage } from "../../lib/upload";

// Components
import HostTopBanner from "../../components/HostTopBanner";
import { bannerGradient, electricGradient } from "../../styles/colours";
import { RootStackParamList } from "../../types/types";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ✅ HELPER: Generate UUID for new tickets (Fixes the Not-Null Error)
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// --- REUSABLE COMPONENTS ---
const CustomSwitch = ({ value, onValueChange }: any) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      onValueChange(!value);
    }}
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
    {/* 🚨 FIX: Added `flex-1` here so long text strictly stays inside the box and truncates cleanly! */}
    <Text
      className={`flex-1 text-lg font-medium ${
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

type EditEventRouteProp = RouteProp<RootStackParamList, "EditEvent">;

const EditEventScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<EditEventRouteProp>();
  const { eventId } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  // Location States (Added Lat/Lng logic)
  const [location, setLocation] = useState("");
  const [locationLat, setLocationLat] = useState<number>(0);
  const [locationLng, setLocationLng] = useState<number>(0);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]); // Dynamic Categories

  // Date/Time State
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");

  // Media
  const [mediaItems, setMediaItems] = useState<
    { uri: string; type: "video" | "image" }[]
  >([]);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(
    null
  );

  // Tickets
  const [tickets, setTickets] = useState<any[]>([]);
  const [deletedTicketIds, setDeletedTicketIds] = useState<string[]>([]);

  // Modals
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [editingTicketIndex, setEditingTicketIndex] = useState<number | null>(
    null
  );
  const [tempTicket, setTempTicket] = useState({
    id: null,
    name: "",
    price: "",
    quantity: "",
    active: true,
  });

  const [activeDateModal, setActiveDateModal] = useState<
    "start" | "end" | null
  >(null);
  const [activeTimeModal, setActiveTimeModal] = useState<
    "start" | "end" | null
  >(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [tagQuery, setTagQuery] = useState("");

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

  // --- 1. FETCH DATA ---
  useEffect(() => {
    fetchEventData();
    fetchCategories();
  }, []);

  // ✅ NEW: Fetch dynamic categories from Supabase
  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("name")
      .order("name", { ascending: true });
    if (data) setAvailableTags(data.map((cat: any) => cat.name));
  };

const fetchEventData = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select(`*, tier_data:ticket_tiers (*)`)
        .eq("id", eventId)
        .single();

      if (error) throw error;

      setTitle(data.title);
      setDescription(data.description);

      // ✅ Handle Coordinates safely
      setLocation(data.location_text || "");
      setLocationLat(data.lat || 0);
      setLocationLng(data.lng || 0);

      setIsPublic(data.is_public);
      
      // 🚨 FIX: Load from the 'categories' DB column, not 'tags'!
      setSelectedTags(data.categories || []);

      const start = new Date(data.date);
      setStartDate(start.toISOString().split("T")[0]);
      setStartTime(
        start.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );

      if (data.end_date) {
        const end = new Date(data.end_date);
        setEndDate(end.toISOString().split("T")[0]);
        setEndTime(
          end.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
        );
      }

      if (data.images && data.images.length > 0) {
        setMediaItems(
          data.images.map((url: string) => ({
            uri: url,
            type: (url.includes(".mp4") || url.includes(".mov")
              ? "video"
              : "image") as "video" | "image",
          }))
        );
      } else if (data.banner_url) {
        setMediaItems([{ uri: data.banner_url, type: "image" }]);
      }

      if (data.tier_data) {
        const formattedTiers = data.tier_data.map((t: any) => ({
          id: t.id,
          name: t.name,
          price: t.price.toString(),
          quantity: t.quantity_total.toString(),
          active: t.is_active,
        }));
        setTickets(formattedTiers);
      }
    } catch (error: any) {
      Alert.alert("Error", "Could not load event.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS (Media) ---
  const handlePickMedia = async (indexToReplace?: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 5],
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const newItem = {
        uri: asset.uri,
        type: (asset.type === "video" ? "video" : "image") as "video" | "image",
      };

      if (indexToReplace !== undefined) {
        const updated = [...mediaItems];
        updated[indexToReplace] = newItem;
        setMediaItems(updated);
        setShowMediaOptions(false);
      } else {
        setMediaItems([...mediaItems, newItem]);
      }
    }
  };

  const handleMediaPress = (index: number) => {
    setSelectedMediaIndex(index);
    setShowMediaOptions(true);
  };

  const setAsBanner = () => {
    if (selectedMediaIndex === null) return;
    const updated = [...mediaItems];
    const [selectedItem] = updated.splice(selectedMediaIndex, 1);
    updated.unshift(selectedItem);
    setMediaItems(updated);
    setShowMediaOptions(false);
  };

  const removeMedia = () => {
    if (selectedMediaIndex === null) return;
    const updated = [...mediaItems];
    updated.splice(selectedMediaIndex, 1);
    setMediaItems(updated);
    setShowMediaOptions(false);
  };

  // --- HANDLERS (Tickets & Tags) ---
  const openTicketModal = (index?: number) => {
    if (index !== undefined) {
      setEditingTicketIndex(index);
      setTempTicket({ ...tickets[index] });
    } else {
      setEditingTicketIndex(null);
      setTempTicket({
        id: null,
        name: "",
        price: "",
        quantity: "",
        active: true,
      });
    }
    setShowTicketModal(true);
  };

  const saveTicketToState = () => {
    if (!tempTicket.name || !tempTicket.price) {
      Alert.alert("Missing Info", "Please add a name and price.");
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

  const deleteTicketFromState = () => {
    if (editingTicketIndex !== null) {
      const ticketToDelete = tickets[editingTicketIndex];
      if (ticketToDelete.id) {
        setDeletedTicketIds([...deletedTicketIds, ticketToDelete.id]);
      }
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

  // --- MAIN SAVE HANDLER ---
// --- MAIN SAVE HANDLER ---
  const handleSave = async () => {
    // 🚨 FIX: Mirrors the Create screen's safety validation checks
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

    setSaving(true);
    try {
      // 1. Process Images
      const processedImages = await Promise.all(
        mediaItems.map(async (item) => {
          if (item.uri.startsWith("http")) return item.uri;
          return await uploadImage(item.uri, "event-banners");
        })
      );

      // 2. Prep Dates
      const startISO = new Date(`${startDate}T${startTime}:00`).toISOString();
      const endISO =
        endDate && endTime
          ? new Date(`${endDate}T${endTime}:00`).toISOString()
          : null;

      // 3. Update DB
      const { error: eventError } = await supabase
        .from("events")
        .update({
          title,
          description,
          location_text: location,
          lat: locationLat,
          lng: locationLng,
          date: startISO,
          end_date: endISO,
          is_public: isPublic,
          // 🚨 FIX: Removes non-existent tags/category columns and saves cleanly to the 'categories' array!
          categories: selectedTags.length > 0 ? selectedTags : ["Other"], 
          images: processedImages,
          banner_url: processedImages[0] || null,
        })
        .eq("id", eventId);

      if (eventError) throw eventError;

      // 4. Ticket Deletions
      if (deletedTicketIds.length > 0) {
        const { error: deleteError } = await supabase
          .from("ticket_tiers")
          .delete()
          .in("id", deletedTicketIds);
        if (deleteError) throw deleteError;
      }

      // 5. Ticket Updates/Inserts
      if (tickets.length > 0) {
        const tiersData = tickets.map((t) => ({
          event_id: eventId,
          name: t.name,
          // 🚨 FIX: Added default fallback numbers so empty fields don't crash Supabase!
          price: parseFloat(t.price) || 0,
          quantity_total: parseInt(t.quantity) || 100,
          is_active: t.active,
          id: t.id || generateUUID(),
        }));

        const { error: tierError } = await supabase
          .from("ticket_tiers")
          .upsert(tiersData);
        if (tierError) throw tierError;
      }

      Alert.alert("Success", "Event updated successfully!");
      navigation.goBack();
    } catch (error: any) {
      // 🚨 FIX: Logs the exact database error in your terminal if it fails!
      console.error("SAVE ERROR:", error);
      Alert.alert("Error", error.message);
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
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 120, paddingBottom: 140 }}
          enableOnAndroid={true}
          extraScrollHeight={120}
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
              Edit Event
            </Text>
          </View>

          {/* MEDIA GALLERY */}
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
              <ImagePlus color="#D087FF" size={24} />
              <Text className="text-gray-400 text-xs font-bold mt-2">
                Add Media
              </Text>
            </TouchableOpacity>

            {mediaItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                onPress={() => handleMediaPress(index)}
                className="relative mr-3"
              >
                {index === 0 && (
                  <View className="absolute top-2 left-2 z-20 bg-orange-500 px-2 py-1 rounded-md flex-row items-center shadow-md">
                    <Star
                      size={10}
                      color="white"
                      fill="white"
                      className="mr-1"
                    />
                    <Text className="text-white text-[10px] font-bold">
                      BANNER
                    </Text>
                  </View>
                )}
                <View className="absolute top-2 right-2 z-20 bg-black/50 p-1.5 rounded-full">
                  <MoreHorizontal color="white" size={14} />
                </View>
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
                    className={`w-32 h-40 rounded-2xl bg-gray-800 ${
                      index === 0 ? "border-2 border-orange-500" : ""
                    }`}
                    resizeMode="cover"
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* BASIC INFO */}
          <Text className="text-white text-xl font-bold mb-4">Details</Text>
          <InputField
            icon={<Type color="white" size={20} />}
            placeholder="Title"
            value={title}
            onChange={setTitle}
          />

          <View className="flex-row gap-4">
            <View className="flex-1">
              <SelectorButton
                icon={<Calendar color="white" size={20} />}
                value={startDate}
                onPress={() => setActiveDateModal("start")}
                placeholder="Start Date"
              />
            </View>
            <View className="flex-1">
              <SelectorButton
                icon={<Clock color="white" size={20} />}
                value={startTime}
                onPress={() => setActiveTimeModal("start")}
                placeholder="Start Time"
              />
            </View>
          </View>

          <View className="flex-row gap-4">
            <View className="flex-1">
              <SelectorButton
                icon={<Calendar color="#999" size={20} />}
                value={endDate}
                onPress={() => setActiveDateModal("end")}
                placeholder="End Date (Opt)"
              />
            </View>
            <View className="flex-1">
              <SelectorButton
                icon={<Clock color="#999" size={20} />}
                value={endTime}
                onPress={() => setActiveTimeModal("end")}
                placeholder="End Time (Opt)"
              />
            </View>
          </View>

          <SelectorButton
            icon={<MapPin color="white" size={20} />}
            value={location}
            onPress={() => setShowLocationPicker(true)}
            placeholder="Search Location"
          />
          <SelectorButton
            icon={<Tag color="white" size={20} />}
            value={selectedTags.length > 0 ? selectedTags.join(", ") : ""}
            placeholder="Categories"
            onPress={() => setShowCategoryPicker(true)}
          />

          <InputField
            icon={<Type color="white" size={20} />}
            placeholder="Description"
            value={description}
            onChange={setDescription}
            multiline
          />

          {/* TICKETS */}
          <View className="mb-8">
            <View className="flex-row justify-between items-end mb-4">
              <Text className="text-white text-xl font-bold">Ticket Tiers</Text>
              <TouchableOpacity onPress={() => openTicketModal()}>
                <Text className="text-purple-400 font-bold">Add New</Text>
              </TouchableOpacity>
            </View>

            {tickets.map((t, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => openTicketModal(i)}
                className={`rounded-2xl p-5 mb-3 flex-row items-center justify-between border ${
                  t.active
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <Ticket
                      color={t.active ? "#4ade80" : "white"}
                      size={20}
                      className="mr-3"
                    />
                    <Text
                      className={`text-xl font-bold mr-3 ml-2 ${
                        t.active ? "text-white" : "text-gray-400"
                      }`}
                    >
                      {t.name}
                    </Text>
                  </View>
                  <View className="flex-row items-center pl-8">
                    <Tag color="#666" size={14} className="mr-1" />
                    <Text className="text-gray-400 text-sm font-medium mr-4 ml-1">
                      {t.quantity} Available
                    </Text>
                  </View>
                </View>
                <View
                  className={`px-4 py-2 rounded-xl border ml-3 ${
                    t.active
                      ? "bg-black/40 border-green-500/20"
                      : "bg-black/40 border-white/5"
                  }`}
                >
                  <Text
                    className={`text-lg font-bold ${
                      t.active ? "text-green-400" : "text-white"
                    }`}
                  >
                    R {t.price}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* PUBLIC TOGGLE */}
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

        {/* SAVE BUTTON */}
        <View className="absolute bottom-0 left-0 right-0 p-6 bg-[#121212]/95 border-t border-white/10 blur-xl">
          <TouchableOpacity
            activeOpacity={0.8}
            className="w-full shadow-lg shadow-purple-500/30"
            onPress={handleSave}
            disabled={saving}
          >
            <LinearGradient
              {...electricGradient}
              className="w-full py-5 rounded-full items-center justify-center"
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

      {/* --- MODALS --- */}

      {/* Media Options Modal */}
      <Modal visible={showMediaOptions} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-[#1E1E1E] rounded-t-3xl p-6 pb-10">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white text-xl font-bold">
                Media Options
              </Text>
              <TouchableOpacity
                onPress={() => setShowMediaOptions(false)}
                className="bg-white/10 p-2 rounded-full"
              >
                <X color="white" size={20} />
              </TouchableOpacity>
            </View>
            {selectedMediaIndex !== 0 && (
              <TouchableOpacity
                onPress={setAsBanner}
                className="flex-row items-center p-4 bg-white/5 rounded-xl mb-3 border border-white/10"
              >
                <Star
                  color="#FFA500"
                  size={24}
                  className="mr-4"
                  fill="#FFA500"
                />
                <View>
                  <Text className="text-white font-bold text-lg">
                    Set as Banner
                  </Text>
                  <Text className="text-gray-400 text-xs">
                    Display this image first on the feed
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => handlePickMedia(selectedMediaIndex!)}
              className="flex-row items-center p-4 bg-white/5 rounded-xl mb-3 border border-white/10"
            >
              <RefreshCw color="#D087FF" size={24} className="mr-4" />
              <View>
                <Text className="text-white font-bold text-lg">
                  Replace Media
                </Text>
                <Text className="text-gray-400 text-xs">
                  Upload a different photo or video
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={removeMedia}
              className="flex-row items-center p-4 bg-red-500/10 rounded-xl border border-red-500/30"
            >
              <Trash2 color="#EF4444" size={24} className="mr-4" />
              <View>
                <Text className="text-red-400 font-bold text-lg">Remove</Text>
                <Text className="text-red-500/60 text-xs">
                  Delete this item from the gallery
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Google Places Location Modal */}
      <Modal visible={showLocationPicker} transparent animationType="slide">
        <View className="flex-1 bg-[#1E1E1E]">
          <SafeAreaView className="flex-1 pt-6 px-4">
            <View className="flex-row items-center mb-4">
              <TouchableOpacity
                onPress={() => setShowLocationPicker(false)}
                className="bg-white/10 p-2 rounded-full mr-4"
              >
                <ArrowLeft color="white" size={24} />
              </TouchableOpacity>
              <Text className="text-white text-xl font-bold">
                Update Location
              </Text>
            </View>
            <GooglePlacesAutocomplete
              placeholder="Search for a new venue or address..."
              minLength={2}
              fetchDetails={true}
              keyboardShouldPersistTaps="handled"
              onPress={(data, details = null) => {
                setLocation(data.description);
                if (details?.geometry?.location) {
                  setLocationLat(details.geometry.location.lat);
                  setLocationLng(details.geometry.location.lng);
                }
                setShowLocationPicker(false);
              }}
              query={{
                key: "AIzaSyC8OxMEXIbnZoXRf2fwUMtBGLWqqkB7lgQ", // Uses the valid key
                language: "en",
                components: "country:za",
              }}
              styles={{
                container: { flex: 1 },
                textInputContainer: {
                  backgroundColor: "rgba(0,0,0,0.4)",
                  borderRadius: 12,
                  marginBottom: 10,
                },
                textInput: {
                  backgroundColor: "transparent",
                  color: "#fff",
                  fontSize: 16,
                  fontFamily: "Jost-Medium",
                },
                listView: { backgroundColor: "#1E1E1E", zIndex: 1000 },
                row: {
                  backgroundColor: "#1E1E1E",
                  padding: 16,
                  borderBottomWidth: 1,
                  borderColor: "rgba(255,255,255,0.05)",
                },
                description: { color: "#fff", fontSize: 16 },
                separator: { backgroundColor: "transparent" },
              }}
              textInputProps={{ placeholderTextColor: "#666", autoFocus: true }}
            />
          </SafeAreaView>
        </View>
      </Modal>

      {/* Categories Modal */}
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
              data={availableTags.filter((t) =>
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

      {/* Ticket Modal */}
      <Modal visible={showTicketModal} transparent animationType="slide">
        {/* Same UI block as CreateEventScreen */}
        <View className="flex-1 justify-end bg-black/60">
          <View className="h-[85%] bg-[#121212] rounded-t-[40px] overflow-hidden border-t border-white/20 shadow-2xl shadow-purple-500/20">
            <LinearGradient
              colors={["#240b36", "#121212"]}
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
            <KeyboardAwareScrollView
              className="flex-1 px-6 pt-8"
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              <View className="mb-6">
                <Text className="text-gray-400 font-bold mb-3 ml-2 uppercase tracking-wide text-xs">
                  Ticket Name
                </Text>
                <View className="flex-row items-center bg-[#1E1E1E] border border-white/10 rounded-3xl px-5 h-20 shadow-lg">
                  <View className="bg-purple-500/20 p-3 rounded-full mr-4">
                    <Ticket color="#D087FF" size={24} />
                  </View>
                  <TextInput
                    placeholder="e.g. VIP Access"
                    placeholderTextColor="#555"
                    value={tempTicket.name}
                    onChangeText={(t) =>
                      setTempTicket({ ...tempTicket, name: t })
                    }
                    className="flex-1 text-white text-xl font-bold h-full mb-1"
                  />
                </View>
              </View>
              <View className="flex-row gap-4 mb-6">
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
                      </View>
                    </View>
                    <CustomSwitch
                      value={tempTicket.active}
                      onValueChange={(v: boolean) =>
                        setTempTicket({ ...tempTicket, active: v })
                      }
                    />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </KeyboardAwareScrollView>
            <View className="absolute bottom-0 left-0 right-0 p-6 bg-[#121212] border-t border-white/10">
              <View className="flex-row gap-4">
                {editingTicketIndex !== null && (
                  <TouchableOpacity
                    onPress={deleteTicketFromState}
                    className="flex-1 bg-red-500/10 border border-red-500/30 rounded-3xl items-center justify-center h-16"
                  >
                    <Trash2 color="#f87171" size={24} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={saveTicketToState}
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

      {/* Date/Time Modals */}
      <Modal visible={!!activeDateModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-[#1E1E1E] rounded-t-3xl p-4 h-[60%]">
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
              // 🚨 FIX: Added key so it properly re-renders when data changes
              key={`${activeTimeModal}-${availableTimes.length}`}
              data={availableTimes}
              keyExtractor={(item) => item}
              // 🚨 FIX: Automatically scrolls down to 12:00 when opened!
              initialScrollIndex={
                availableTimes.indexOf("12:00") !== -1 
                  ? Math.max(0, availableTimes.indexOf("12:00") - 2) 
                  : 0
              }
              // 🚨 FIX: Tells the list exactly how tall each item is to calculate the jump
              getItemLayout={(data, index) => ({
                length: 56,
                offset: 56 * index,
                index,
              })}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    if (activeTimeModal === "start") setStartTime(item);
                    else setEndTime(item);
                    setActiveTimeModal(null);
                  }}
                  // 🚨 FIX: Exact height inline style matching the length layout above
                  style={{ height: 56 }}
                  className="px-4 border-b border-white/5 flex-row items-center justify-between"
                >
                  <Text className="text-white text-lg font-bold">{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default EditEventScreen;
