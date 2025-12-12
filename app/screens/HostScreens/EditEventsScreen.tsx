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
    <Text
      className={`text-lg font-medium ${
        value ? "text-white" : "text-gray-500"
      }`}
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
  "Sports",
  "Outdoors",
  "Beach",
  "Festival",
  "Comedy",
  "Theatre",
  "Gaming",
  "Networking",
];

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
  const [location, setLocation] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Date/Time State
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");

  // Media
  const [mediaItems, setMediaItems] = useState<
    { uri: string; type: "image" | "video" }[]
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
  const [locQuery, setLocQuery] = useState("");
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
  }, []);

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
      setLocation(data.location_text);
      setIsPublic(data.is_public);
      setSelectedTags(data.tags || []);

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
          data.images.map((url: string) => ({ uri: url, type: "image" }))
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
      console.log(error);
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
      const newItem = { uri: result.assets[0].uri, type: "image" as const };

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

  // --- HANDLERS (Tickets) ---
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

  const handleLocationSearch = (text: string) => {
    setLocQuery(text);
  };

  // --- MAIN SAVE HANDLER ---
  const handleSave = async () => {
    setSaving(true);
    try {
      const processedImages = await Promise.all(
        mediaItems.map(async (item) => {
          if (item.uri.startsWith("http")) return item.uri;
          return await uploadImage(item.uri, "event-banners");
        })
      );

      const startISO = new Date(`${startDate}T${startTime}:00`).toISOString();
      const endISO =
        endDate && endTime
          ? new Date(`${endDate}T${endTime}:00`).toISOString()
          : null;

      const { error: eventError } = await supabase
        .from("events")
        .update({
          title,
          description,
          location_text: location,
          date: startISO,
          end_date: endISO,
          is_public: isPublic,
          tags: selectedTags,
          images: processedImages,
          banner_url: processedImages[0],
        })
        .eq("id", eventId);

      if (eventError) throw eventError;

      if (deletedTicketIds.length > 0) {
        const { error: deleteError } = await supabase
          .from("ticket_tiers")
          .delete()
          .in("id", deletedTicketIds);
        if (deleteError) throw deleteError;
      }

      if (tickets.length > 0) {
        const tiersData = tickets.map((t) => ({
          id: t.id,
          event_id: eventId,
          name: t.name,
          price: parseFloat(t.price),
          quantity_total: parseInt(t.quantity),
          is_active: t.active,
        }));

        const { error: tierError } = await supabase
          .from("ticket_tiers")
          .upsert(tiersData);
        if (tierError) throw tierError;
      }

      Alert.alert("Success", "Event updated successfully!");
      navigation.goBack();
    } catch (error: any) {
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
          contentContainerStyle={{ paddingTop: 120, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
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
                <Image
                  source={{ uri: item.uri }}
                  className={`w-32 h-40 rounded-2xl bg-gray-800 ${
                    index === 0 ? "border-2 border-orange-500" : ""
                  }`}
                  resizeMode="cover"
                />
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
            value={selectedTags.join(", ")}
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

      {/* --- MEDIA OPTIONS MODAL --- */}
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

      {/* --- TICKET MODAL --- */}
      <Modal visible={showTicketModal} transparent animationType="slide">
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
                    onChangeText={(t: string) =>
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
                      onChangeText={(t: string) =>
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
                      onChangeText={(t: string) =>
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

      {/* --- DATE/TIME MODALS (With Done Button & Validation) --- */}
      <Modal visible={!!activeDateModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-[#1E1E1E] rounded-t-3xl p-4 h-[60%]">
            <View className="flex-row justify-between items-center mb-6 px-2">
              <Text className="text-white text-2xl font-bold">
                {activeDateModal === "start" ? "Start Date" : "End Date"}
              </Text>
              <TouchableOpacity onPress={() => setActiveDateModal(null)}>
                <Text className="text-purple-400 font-bold text-lg">Done</Text>
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
                calendarBackground: "#1E1E1E",
                dayTextColor: "#fff",
                todayTextColor: "#D087FF",
              }}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={!!activeTimeModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-[#1E1E1E] rounded-t-3xl p-4 h-[50%]">
            <View className="flex-row justify-between items-center mb-4 px-2">
              <Text className="text-white text-2xl font-bold">
                {activeTimeModal === "start" ? "Start Time" : "End Time"}
              </Text>
              <TouchableOpacity onPress={() => setActiveTimeModal(null)}>
                <Text className="text-purple-400 font-bold text-lg">Done</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={availableTimes}
              keyExtractor={(i) => i}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    if (activeTimeModal === "start") setStartTime(item);
                    else setEndTime(item);
                    setActiveTimeModal(null);
                  }}
                  className="p-4 border-b border-white/5"
                >
                  <Text className="text-white text-center text-lg">{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* --- LOCATION & CATEGORY MODALS (With Done Button) --- */}
      <Modal visible={showLocationPicker} transparent animationType="slide">
        <View className="flex-1 bg-[#1E1E1E]">
          <SafeAreaView className="flex-1">
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-white/10">
              <Text className="text-white text-xl font-bold">Location</Text>
              <TouchableOpacity onPress={() => setShowLocationPicker(false)}>
                <Text className="text-purple-400 font-bold text-lg">Done</Text>
              </TouchableOpacity>
            </View>
            <View className="px-4 py-2">
              <View className="flex-row items-center bg-black/40 rounded-xl px-4 h-12">
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
              data={MOCK_LOCATIONS}
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

      <Modal visible={showCategoryPicker} transparent animationType="slide">
        <View className="flex-1 bg-[#1E1E1E] mt-24">
          <SafeAreaView className="flex-1">
            <View className="flex-row items-center justify-between px-4  py-4 border-b border-white/10">
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
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
};

export default EditEventScreen;
