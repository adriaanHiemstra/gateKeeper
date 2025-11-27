import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { CreditCard, Wallet, ArrowLeft } from 'lucide-react-native';

// 👇 FIX 1: Import the navigation types
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/types';

// Components
import TopBanner from '../../components/TopBanner';
import BottomNav from '../../components/BottomNav';

// Styles
import { bannerGradient, fireGradient } from '../../styles/colours';

// 👇 FIX 2: Define the specific navigation prop type for this screen
type AddPaymentNavProp = NativeStackNavigationProp<RootStackParamList>;

const AddPayment = () => {
  // 👇 FIX 3: Apply the type to the hook
  const navigation = useNavigation<AddPaymentNavProp>();

  const handleAddCard = () => {
    // Now TypeScript knows 'AddCardScreen' exists!
    navigation.navigate('AddCardScreen'); 
  };

  const handleSetupDigitalWallet = () => {
    console.log("Setup Apple/Google Pay");
  };
  return (
    <View className="flex-1">
      {/* 1. Background Gradient (Dark Theme) */}
      <LinearGradient
        {...bannerGradient}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Banner */}
      <TopBanner />

      <SafeAreaView className="flex-1" edges={['left', 'right']}>
        <View className="flex-1 pt-32 px-6">
          
          {/* Header Section */}
          <View className="flex-row items-center mb-10">
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
              Payments
            </Text>
          </View>

          {/* Main Content - Scrollable if many options exist */}
          <ScrollView showsVerticalScrollIndicator={false}>
            
            <Text 
              className="text-gray-300 text-xl mb-8 leading-8"
              style={{ fontFamily: 'Jost-Medium' }}
            >
              Securely manage your payment methods for quick and easy checkout.
            </Text>

            {/* Option 1: Add Credit/Debit Card */}
            <TouchableOpacity 
              onPress={handleAddCard}
              activeOpacity={0.8}
              className="mb-6 w-full shadow-lg shadow-black/40"
            >
              <LinearGradient
                {...fireGradient}
                className="w-full py-5 px-6 rounded-2xl flex-row items-center"
              >
                <View className="bg-white/20 p-3 rounded-full mr-5">
                  <CreditCard color="white" size={32} />
                </View>
                <View>
                  <Text 
                    className="text-white text-2xl font-bold"
                    style={{ fontFamily: 'Jost-Medium' }}
                  >
                    Add Card
                  </Text>
                  <Text className="text-white/80 text-base">
                    Credit or Debit
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Option 2: Digital Wallets (Apple/Google Pay) */}
            {/* We use a dark glassmorphism style for the secondary option to let the main one pop */}
            <TouchableOpacity 
              onPress={handleSetupDigitalWallet}
              activeOpacity={0.8}
              className="w-full bg-white/10 border border-white/10 rounded-2xl p-6 flex-row items-center"
            >
              <View className="bg-white/10 p-3 rounded-full mr-5">
                <Wallet color="#FA8900" size={32} />
              </View>
              <View>
                <Text 
                  className="text-white text-2xl font-bold"
                  style={{ fontFamily: 'Jost-Medium' }}
                >
                  Apple Pay
                </Text>
                {/* Or Google Pay depending on platform */}
                <Text className="text-gray-400 text-base">
                  Faster checkout
                </Text>
              </View>
            </TouchableOpacity>

          </ScrollView>

        </View>
      </SafeAreaView>

      {/* Bottom Navigation */}
      <BottomNav />
    </View>
  );
};

export default AddPayment;