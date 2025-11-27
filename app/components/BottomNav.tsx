import React from "react";
import { TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import { cssInterop } from "nativewind";
import { House, Search, Map, User } from "lucide-react-native";

// Styles
import { fireGradient } from "../styles/colours";

cssInterop(LinearGradient, {
  className: {
    target: "style",
  },
});

const BottomNav = () => {
  const navigation = useNavigation<NavigationProp<any>>();

  return (
    <LinearGradient
      {...fireGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      // 👇 FIX: Reduced height to h-20 (80 units) and padding to pb-2
      className="absolute bottom-0 left-0 right-0 h-20 flex-row justify-around items-center z-50 pb-2"
    >
      <TouchableOpacity
        className="items-center p-4"
        onPress={() => navigation.navigate("Home")}
      >
        <House color="white" size={26} strokeWidth={2.5} />
      </TouchableOpacity>

      <TouchableOpacity
        className="items-center p-4"
        onPress={() => navigation.navigate("Search")}
      >
        <Search color="white" size={26} strokeWidth={2.5} />
      </TouchableOpacity>

      <TouchableOpacity
        className="items-center p-4"
        onPress={() => navigation.navigate("Map")}
      >
        <Map color="white" size={26} strokeWidth={2.5} />
      </TouchableOpacity>

      <TouchableOpacity
        className="items-center p-4"
        onPress={() => navigation.navigate("AccountSettings")}
      >
        <User color="white" size={26} strokeWidth={2.5} />
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default BottomNav;
