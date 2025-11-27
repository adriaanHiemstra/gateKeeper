import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, AlertTriangle } from 'lucide-react-native';

// Components
import TopBanner from '../../components/TopBanner';
import BottomNav from '../../components/BottomNav';

// Styles
import { bannerGradient, fireGradient } from '../../styles/colours';

const DeleteAccountScreen = () => {
  const navigation = useNavigation();

  const handleDelete = () => {
    // Logic to actually delete the account
    Alert.alert(
      "Final Confirmation",
      "Are you absolutely sure? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => console.log("Account Deleted") }
      ]
    );
  };

  return (
    <View className="flex-1">
      {/* Background Gradient */}
      <LinearGradient
        {...bannerGradient}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Banner */}
      <TopBanner />

      <SafeAreaView className="flex-1" edges={['left', 'right']}>
        <View className="flex-1 pt-32 px-6">
          
          {/* Header */}
          <View className="flex-row items-center mb-12">
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <LinearGradient
                {...fireGradient}
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
              >
                <ArrowLeft color="black" size={28} strokeWidth={2.5} />
              </LinearGradient>
            </TouchableOpacity>
            
            <Text 
              className="text-white text-4xl font-medium pt-2" 
              style={{ fontFamily: 'Jost-Medium' }}
            >
              Delete Account
            </Text>
          </View>

          {/* Central Content */}
          <View className="flex-1 items-center px-4">
            
            {/* Warning Icon - Glassmorphism Style */}
            <View className="bg-white/10 p-8 rounded-full border border-white/10 mb-8 shadow-lg shadow-black/50">
              <AlertTriangle color="#FA8900" size={64} />
            </View>

            <Text 
              className="text-white text-3xl font-bold text-center mb-4"
              style={{ fontFamily: 'Jost-Medium' }}
            >
              We're sorry to see you go
            </Text>

            <Text 
              className="text-gray-300 text-lg text-center leading-7 mb-12"
              style={{ fontFamily: 'Jost-Medium' }}
            >
              If you delete your account, you will permanently lose your profile, tickets, and friend connections. This action cannot be undone.
            </Text>

            {/* DELETE BUTTON */}
            <TouchableOpacity 
              onPress={handleDelete}
              activeOpacity={0.8}
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
                  DELETE ACCOUNT
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Cancel Option */}
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              className="mt-6 p-4"
            >
              <Text 
                className="text-gray-400 text-lg font-medium"
                style={{ fontFamily: 'Jost-Medium' }}
              >
                Cancel and keep my account
              </Text>
            </TouchableOpacity>

          </View>

        </View>
      </SafeAreaView>

      {/* Bottom Nav */}
      <BottomNav />
    </View>
  );
};

export default DeleteAccountScreen;
