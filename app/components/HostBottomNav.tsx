import React from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { cssInterop } from "nativewind";
import { 
  LayoutDashboard, 
  Calendar, 
  QrCode, 
  BarChart3, 
  User 
} from 'lucide-react-native';

// Styles
import { electricGradient } from '../styles/colours';

cssInterop(LinearGradient, {
  className: {
    target: "style",
  },
});

const HostBottomNav = () => {
  const navigation = useNavigation<NavigationProp<any>>();

  const navigateTo = (screen: string) => {
    // Safety check: We haven't built EventStats yet, so we prevent the crash
  
    
    // ✅ FIX: Uncommented this line so navigation actually happens
    navigation.navigate(screen);
  };

  return (
    <LinearGradient
      {...electricGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      className="absolute bottom-0 left-0 right-0 h-24 flex-row justify-around items-center z-50 pb-6"
    >
      {/* 1. Dashboard */}
      <TouchableOpacity 
        className="items-center p-4" 
        onPress={() => navigateTo("HostDashboard")}
      >
        <LayoutDashboard color="white" size={28} strokeWidth={2} />
      </TouchableOpacity>

      {/* 2. My Events */}
      <TouchableOpacity 
        className="items-center p-4" 
        onPress={() => navigateTo("MyEventsList")}
      >
        <Calendar color="white" size={28} strokeWidth={2} />
      </TouchableOpacity>

      {/* 3. SCANNER */}
      <TouchableOpacity 
        className="items-center p-4" 
        onPress={() => navigateTo("ScanTickets")}
      >
        <QrCode color="white" size={36} strokeWidth={2.5} />
      </TouchableOpacity>

      {/* 4. Stats (Placeholder for now) */}
      <TouchableOpacity 
        className="items-center p-4" 
        onPress={() => navigateTo("EventStats")}
      >
        <BarChart3 color="white" size={28} strokeWidth={2} />
      </TouchableOpacity>

      {/* 5. Profile */}
      <TouchableOpacity 
        className="items-center p-4" 
        onPress={() => navigateTo("HostSettings")}
      >
        <User color="white" size={28} strokeWidth={2} />
      </TouchableOpacity>

    </LinearGradient>
  );
};

export default HostBottomNav;