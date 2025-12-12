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
  Trash2,
  X,
  Search,
  Check,
  Tag,
  Ticket,
  Plus,
  Hash,
  Sparkles,
  Star,
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

// Enable LayoutAnimation
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- REUSABLE COMPONENTS (Same as CreateEvent) ---
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

  // Tickets
  const [tickets, setTickets] = useState<any[]>([]);

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

  // --- 1. FETCH DATA ---
  useEffect(() => {
    fetchEventData();
  }, []);

  const fetchEventData = async () => {
    try {
      // Fetch Event + Tiers (Using the Alias we set up earlier: tier_data)
      const { data, error } = await supabase
        .from("events")
        .select(
          `
          *,
          ticket_tiers (*)
        `
        )
        .eq("id", eventId)
        .single();

      if (error) throw error;

      setTitle(data.title);
      setDescription(data.description);
      setLocation(data.location_text);
      setIsPublic(data.is_public);
      setSelectedTags(data.tags || []);

      // Dates
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

      // Media (Convert existing URLs to objects)
      if (data.images && data.images.length > 0) {
        setMediaItems(
          data.images.map((url: string) => ({ uri: url, type: "image" }))
        );
      } else if (data.banner_url) {
        setMediaItems([{ uri: data.banner_url, type: "image" }]);
      }

      // Tickets
      if (data.ticket_tiers) {
        const formattedTiers = data.ticket_tiers.map((t: any) => ({
          id: t.id, // Save ID so we update, not create duplicates
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
  const handlePickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 5],
    });

    if (!result.canceled) {
      setMediaItems([
        ...mediaItems,
        { uri: result.assets[0].uri, type: "image" },
      ]);
    }
  };

  const removeMedia = (index: number) => {
    const updated = [...mediaItems];
    updated.splice(index, 1);
    setMediaItems(updated);
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

  // --- MAIN SAVE HANDLER ---
  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Process Images (Upload new ones, keep existing URLs)
      const processedImages = await Promise.all(
        mediaItems.map(async (item) => {
          if (item.uri.startsWith("http")) return item.uri; // Already uploaded
          return await uploadImage(item.uri, "event-banners"); // Upload new
        })
      );

      // 2. Update Event Table
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
          banner_url: processedImages[0], // Ensure index 0 is banner
        })
        .eq("id", eventId);

      if (eventError) throw eventError;

      // 3. Upsert Ticket Tiers (Update existing, Insert new)
      if (tickets.length > 0) {
        const tiersData = tickets.map((t) => ({
          id: t.id, // If null, Supabase will generate new UUID
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

          {/* 1. MEDIA GALLERY */}
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
              <ImagePlus color="#D087FF" size={24} />
              <Text className="text-gray-400 text-xs font-bold mt-2">
                Add Media
              </Text>
            </TouchableOpacity>

            {mediaItems.map((item, index) => (
              <View key={index} className="relative mr-3">
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
                <Image
                  source={{ uri: item.uri }}
                  className={`w-32 h-40 rounded-2xl bg-gray-800 ${
                    index === 0 ? "border-2 border-orange-500" : ""
                  }`}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => removeMedia(index)}
                  className="absolute top-2 right-2 bg-red-500/80 p-1.5 rounded-full z-10"
                >
                  <X color="white" size={12} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {/* 2. BASIC INFO */}
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
              />
            </View>
            <View className="flex-1">
              <SelectorButton
                icon={<Clock color="white" size={20} />}
                value={startTime}
                onPress={() => setActiveTimeModal("start")}
              />
            </View>
          </View>

          <SelectorButton
            icon={<MapPin color="white" size={20} />}
            value={location}
            onPress={() => setShowLocationPicker(true)}
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

          {/* 3. TICKETS */}
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
                className={`flex-row justify-between items-center p-4 mb-3 rounded-2xl border ${
                  t.active
                    ? "bg-white/5 border-white/10"
                    : "bg-red-900/10 border-red-500/20"
                }`}
              >
                <View>
                  <Text
                    className={`text-lg font-bold ${
                      t.active ? "text-white" : "text-gray-500"
                    }`}
                  >
                    {t.name}
                  </Text>
                  <Text className="text-gray-400 text-xs">
                    {t.quantity} Available
                  </Text>
                </View>
                <Text className="text-white font-bold text-lg">
                  R {t.price}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 4. PUBLIC TOGGLE */}
          <View className="flex-row justify-between items-center bg-white/5 p-5 rounded-2xl mb-8 border border-white/5">
            <Text className="text-white font-bold text-lg">Public Event</Text>
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

      {/* --- MODALS (Reusing simplified versions for brevity) --- */}
      {/* TICKET MODAL */}
      <Modal visible={showTicketModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-[#1E1E1E] rounded-t-3xl p-6 h-[70%]">
            <View className="flex-row justify-between mb-6">
              <Text className="text-white text-2xl font-bold">
                {editingTicketIndex !== null ? "Edit" : "New"} Ticket
              </Text>
              <TouchableOpacity onPress={() => setShowTicketModal(false)}>
                <X color="white" />
              </TouchableOpacity>
            </View>
            <InputField
              icon={<Ticket color="white" />}
              placeholder="Name"
              value={tempTicket.name}
              onChange={(t: string) =>
                setTempTicket({ ...tempTicket, name: t })
              }
            />
            <View className="flex-row gap-4">
              <View className="flex-1">
                <InputField
                  icon={<Hash color="white" />}
                  placeholder="Price"
                  value={tempTicket.price}
                  onChange={(t: string) =>
                    setTempTicket({ ...tempTicket, price: t })
                  }
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1">
                <InputField
                  icon={<Hash color="white" />}
                  placeholder="Qty"
                  value={tempTicket.quantity}
                  onChange={(t: string) =>
                    setTempTicket({ ...tempTicket, quantity: t })
                  }
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View className="flex-row justify-between items-center mb-8 mt-4">
              <Text className="text-gray-400">Active</Text>
              <CustomSwitch
                value={tempTicket.active}
                onValueChange={(v: boolean) =>
                  setTempTicket({ ...tempTicket, active: v })
                }
              />
            </View>
            <TouchableOpacity
              onPress={saveTicketToState}
              className="bg-purple-600 p-4 rounded-xl items-center"
            >
              <Text className="text-white font-bold">Save Ticket</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* DATE MODAL */}
      <Modal visible={!!activeDateModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-[#1E1E1E] rounded-t-3xl p-4 h-[60%]">
            <RNCalendar
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

      {/* TIME MODAL */}
      <Modal visible={!!activeTimeModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-[#1E1E1E] rounded-t-3xl p-4 h-[50%]">
            <FlatList
              data={ALL_TIMES}
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

      {/* LOCATION & CATEGORY MODALS (Simplified) */}
      <Modal visible={showLocationPicker} transparent>
        <View className="flex-1 bg-[#121212] pt-20 px-4">
          <TouchableOpacity onPress={() => setShowLocationPicker(false)}>
            <Text className="text-white mb-4">Close</Text>
          </TouchableOpacity>
          <FlatList
            data={MOCK_LOCATIONS}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setLocation(item);
                  setShowLocationPicker(false);
                }}
                className="p-4 border-b border-white/10"
              >
                <Text className="text-white">{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      <Modal visible={showCategoryPicker} transparent>
        <View className="flex-1 bg-[#121212] pt-20 px-4">
          <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
            <Text className="text-white mb-4">Close</Text>
          </TouchableOpacity>
          <FlatList
            data={AVAILABLE_TAGS}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setSelectedTags([item]);
                  setShowCategoryPicker(false);
                }}
                className="p-4 border-b border-white/10"
              >
                <Text className="text-white">{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
};

export default EditEventScreen;
