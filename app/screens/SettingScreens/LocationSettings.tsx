import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, MapPin, Navigation, Globe } from "lucide-react-native";

// Components
import TopBanner from "../../components/TopBanner";
import BottomNav from "../../components/BottomNav";

// Styles
import { bannerGradient, fireGradient } from "../../styles/colours";

const LocationSettings = () => {
  const navigation = useNavigation();

  // State
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [manualCity, setManualCity] = useState("Cape Town");
  const [radius, setRadius] = useState("50 km");

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <TopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingTop: 120, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View className="flex-row items-center mb-8">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mr-4 bg-white/10 p-2 rounded-full"
            >
              <ArrowLeft color="white" size={24} />
            </TouchableOpacity>
            <View>
              <Text
                className="text-white text-3xl font-bold"
                style={{ fontFamily: "Jost-Medium" }}
              >
                Location
              </Text>
              <Text className="text-gray-400 text-sm">
                Where should we look for events?
              </Text>
            </View>
          </View>

          {/* 1. CURRENT LOCATION */}
          <View className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-4">
              <View className="bg-orange-500/20 p-3 rounded-full mr-4">
                <Navigation color="#FA8900" size={24} fill="#FA8900" />
              </View>
              <View>
                <Text className="text-white font-bold text-lg">
                  Current Location
                </Text>
                <Text className="text-gray-400 text-xs">
                  Use GPS to find nearby events
                </Text>
              </View>
            </View>
            <Switch
              value={useCurrentLocation}
              onValueChange={setUseCurrentLocation}
              trackColor={{ false: "#333", true: "#FA8900" }}
              thumbColor={"#fff"}
            />
          </View>

          {/* 2. MANUAL CITY (Only if GPS is off) */}
          {!useCurrentLocation && (
            <View className="mb-6">
              <Text className="text-gray-500 font-bold text-xs uppercase mb-2 ml-2">
                Home City
              </Text>
              <View className="flex-row items-center bg-white/10 border border-white/20 rounded-xl px-4 h-14">
                <MapPin color="white" size={20} className="mr-3 opacity-70" />
                <TextInput
                  value={manualCity}
                  onChangeText={setManualCity}
                  placeholder="Enter City"
                  placeholderTextColor="#666"
                  className="flex-1 text-white text-lg font-medium h-full"
                  style={{ fontFamily: "Jost-Medium" }}
                />
              </View>
            </View>
          )}

          {/* 3. SEARCH RADIUS */}
          <Text className="text-gray-500 font-bold text-xs uppercase mb-3 ml-2">
            Search Radius
          </Text>
          <View className="flex-row flex-wrap gap-3 mb-8">
            {["10 km", "25 km", "50 km", "100 km", "Nationwide"].map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRadius(r)}
                className={`px-5 py-3 rounded-xl border ${
                  radius === r
                    ? "bg-orange-500/20 border-orange-500"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <Text
                  className={`font-bold ${
                    radius === r ? "text-orange-400" : "text-white"
                  }`}
                >
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* MAP PREVIEW (Visual Fluff) */}
          <View className="h-40 bg-white/5 rounded-2xl items-center justify-center border-2 border-dashed border-white/10">
            <Globe color="#333" size={64} />
            <Text className="text-gray-500 mt-2">Map Preview Region</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
      <BottomNav />
    </View>
  );
};

export default LocationSettings;
