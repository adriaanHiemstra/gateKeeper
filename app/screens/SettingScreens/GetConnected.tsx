import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Users } from 'lucide-react-native';

// Components
import TopBanner from '../../components/TopBanner';
import BottomNav from '../../components/BottomNav';

// Styles
import { bannerGradient, fireGradient } from '../../styles/colours';

const GetConnected = () => {
  const navigation = useNavigation();

  const handleSync = () => {
    // Logic to request permissions and sync contacts
    console.log("Syncing contacts...");
  };

  const handleSkip = () => {
    navigation.goBack();
  };

  return (
    <View className="flex-1">
      {/* 1. Background Gradient (Dark Blue Theme) */}
      <LinearGradient
        {...bannerGradient}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Banner */}
      <TopBanner />

      <SafeAreaView className="flex-1">
        {/* Main Content Container - Centered */}
        <View className="flex-1 justify-center items-center px-8 pt-24">
          
          {/* Icon Circle - Changed bg to semi-transparent white for glass effect */}
          <View className="mb-8 bg-white/10 p-6 rounded-full border border-white/20">
            <Users size={64} color="#FA8900" />
          </View>

          {/* Main Headline - Changed to White */}
          <Text 
            className="text-4xl text-center font-bold mb-4 text-white"
            style={{ fontFamily: 'Jost-Medium' }}
          >
            Find Your Crew
          </Text>

          {/* Subtext - Changed to Light Gray for contrast against dark blue */}
          <Text 
            className="text-xl text-center text-gray-300 mb-12 leading-8"
            style={{ fontFamily: 'Jost-Medium' }}
          >
            Sync your contacts to see where your friends are going and never miss a moment!
          </Text>

          {/* Primary Action: SYNC Button with Fire Gradient */}
          <TouchableOpacity 
            onPress={handleSync}
            activeOpacity={0.8}
            // Removed shadow-orange-200 as it doesn't look good on dark bg
            className="w-full shadow-lg shadow-black/50" 
          >
            <LinearGradient
              {...fireGradient}
              className="w-full py-5 rounded-full items-center justify-center"
            >
              <Text 
                className="text-white text-2xl font-bold tracking-wide"
                style={{ fontFamily: 'Jost-Medium' }}
              >
                SYNC CONTACTS
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Secondary Action: "Don't Sync" - Gray text */}
          <TouchableOpacity 
            onPress={handleSkip}
            className="mt-6 p-2"
          >
            <Text 
              className="text-gray-400 text-lg font-medium"
              style={{ fontFamily: 'Jost-Medium' }}
            >
              I don't want to sync
            </Text>
          </TouchableOpacity>

        </View>
      </SafeAreaView>

      {/* Bottom Navigation */}
      <BottomNav />
    </View>
  );
};

export default GetConnected;