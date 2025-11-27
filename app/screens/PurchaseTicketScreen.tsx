import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ArrowLeft, Minus, Plus, CreditCard, Wallet, ShieldCheck } from 'lucide-react-native';

// Styles & Components
import { bannerGradient, fireGradient } from '../styles/colours';
import TopBanner from '../components/TopBanner';
import { RootStackParamList } from '../types/types';

// Types
type PurchaseRouteProp = RouteProp<RootStackParamList, 'PurchaseTicket'>;

const PurchaseTicketScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<PurchaseRouteProp>();
  const { eventId } = route.params || { eventId: '1' }; // Mock ID

  // Mock Ticket Data
  const [tickets, setTickets] = useState([
    { id: '1', name: 'General Access', price: 150, quantity: 0 },
    { id: '2', name: 'VIP', price: 350, quantity: 0 },
    { id: '3', name: 'Group Special (4x)', price: 500, quantity: 0 },
  ]);

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple'>('card');

  // Calculations
  const subtotal = tickets.reduce((acc, t) => acc + (t.price * t.quantity), 0);
  const fees = subtotal * 0.05; // 5% Platform fee
  const total = subtotal + fees;

  const updateQuantity = (id: string, change: number) => {
    setTickets(curr => curr.map(t => {
        if (t.id === id) {
            const newQty = Math.max(0, t.quantity + change);
            return { ...t, quantity: newQty };
        }
        return t;
    }));
  };

  const handleCheckout = () => {
    if (total === 0) {
        Alert.alert("Cart Empty", "Please select at least one ticket.");
        return;
    }
    Alert.alert("Processing", `Charging R ${total.toFixed(0)} to your ${paymentMethod}...`, [
        { text: "Confirm", onPress: () => {
            // Navigate to Success / My Tickets
            Alert.alert("Success!", "See you at the show.");
            // @ts-ignore
            navigation.navigate('MyTicketsScreen'); 
        }}
    ]);
  };

  return (
    <View className="flex-1 bg-[#121212]">
      {/* User Theme Background (Blue) */}
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <TopBanner />

      <SafeAreaView className="flex-1" edges={['left', 'right']}>
        <ScrollView 
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 120, paddingBottom: 140 }}
        >
          
          {/* HEADER */}
          <View className="flex-row items-center mb-8">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
               <LinearGradient {...fireGradient} className="w-10 h-10 rounded-full items-center justify-center">
                  <ArrowLeft color="white" size={24} />
               </LinearGradient>
            </TouchableOpacity>
            <View>
                <Text className="text-white/60 text-xs uppercase font-bold tracking-widest">Checkout</Text>
                <Text className="text-white text-3xl font-bold" style={{ fontFamily: 'Jost-Medium' }}>Secure Payment</Text>
            </View>
          </View>

          {/* EVENT RECAP CARD */}
          <View className="flex-row bg-white/10 border border-white/10 p-3 rounded-2xl mb-8">
             <Image 
                source={require('../assets/imagePlaceHolder1.png')}
                className="w-20 h-20 rounded-xl mr-4"
                resizeMode="cover"
             />
             <View className="flex-1 justify-center">
                <Text className="text-white font-bold text-xl mb-1">Summer Slam 2025</Text>
                <Text className="text-gray-300 text-sm">28 Oct • Clifton 4th Beach</Text>
             </View>
          </View>

          {/* 1. TICKET SELECTION */}
          <Text className="text-white text-xl font-bold mb-4">Select Tickets</Text>
          {tickets.map((t) => (
            <View key={t.id} className="flex-row items-center justify-between bg-white/5 border border-white/10 p-4 rounded-2xl mb-3">
                <View>
                    <Text className="text-white font-bold text-lg">{t.name}</Text>
                    <Text className="text-orange-400 font-bold">R {t.price}</Text>
                </View>
                
                {/* Counter */}
                <View className="flex-row items-center bg-black/40 rounded-lg p-1 border border-white/10">
                    <TouchableOpacity 
                        onPress={() => updateQuantity(t.id, -1)}
                        className={`p-2 rounded-md ${t.quantity === 0 ? 'opacity-30' : 'bg-white/10'}`}
                        disabled={t.quantity === 0}
                    >
                        <Minus color="white" size={16} />
                    </TouchableOpacity>
                    <Text className="text-white font-bold text-lg mx-4 w-4 text-center">{t.quantity}</Text>
                    <TouchableOpacity 
                        onPress={() => updateQuantity(t.id, 1)}
                        className="p-2 rounded-md bg-white/10"
                    >
                        <Plus color="white" size={16} />
                    </TouchableOpacity>
                </View>
            </View>
          ))}

          {/* 2. PAYMENT METHOD */}
          <Text className="text-white text-xl font-bold mb-4 mt-4">Payment Method</Text>
          <View className="flex-row gap-4 mb-8">
             <TouchableOpacity 
                onPress={() => setPaymentMethod('card')}
                className={`flex-1 p-4 rounded-2xl border items-center ${paymentMethod === 'card' ? 'bg-orange-500/20 border-orange-500' : 'bg-white/5 border-white/10'}`}
             >
                <CreditCard color={paymentMethod === 'card' ? '#FA8900' : 'white'} size={24} className="mb-2" />
                <Text className={`font-bold ${paymentMethod === 'card' ? 'text-orange-400' : 'text-white'}`}>Card</Text>
             </TouchableOpacity>

             <TouchableOpacity 
                onPress={() => setPaymentMethod('apple')}
                className={`flex-1 p-4 rounded-2xl border items-center ${paymentMethod === 'apple' ? 'bg-orange-500/20 border-orange-500' : 'bg-white/5 border-white/10'}`}
             >
                <Wallet color={paymentMethod === 'apple' ? '#FA8900' : 'white'} size={24} className="mb-2" />
                <Text className={`font-bold ${paymentMethod === 'apple' ? 'text-orange-400' : 'text-white'}`}>Apple Pay</Text>
             </TouchableOpacity>
          </View>

          {/* 3. ORDER SUMMARY */}
          <View className="bg-black/40 p-6 rounded-2xl border border-white/5 mb-8">
             <View className="flex-row justify-between mb-2">
                <Text className="text-gray-400">Subtotal</Text>
                <Text className="text-white font-bold">R {subtotal}</Text>
             </View>
             <View className="flex-row justify-between mb-4 pb-4 border-b border-white/10">
                <Text className="text-gray-400">Service Fees (5%)</Text>
                <Text className="text-white font-bold">R {fees.toFixed(0)}</Text>
             </View>
             <View className="flex-row justify-between items-center">
                <Text className="text-white text-xl font-bold">Total</Text>
                <Text className="text-white text-3xl font-bold">R {total.toFixed(0)}</Text>
             </View>
          </View>

          {/* Trust Badge */}
          <View className="flex-row justify-center items-center mb-4 opacity-60">
             <ShieldCheck color="#aaa" size={14} className="mr-2" />
             <Text className="text-gray-400 text-xs">Secure 256-bit SSL Encrypted Payment</Text>
          </View>

        </ScrollView>

        {/* PAY BUTTON */}
        <View className="absolute bottom-0 left-0 right-0 p-6 bg-[#121212]/90 border-t border-white/10">
            <TouchableOpacity 
                activeOpacity={0.8}
                className="w-full shadow-lg shadow-orange-500/20"
                onPress={handleCheckout}
            >
                <LinearGradient
                    {...fireGradient}
                    className="w-full py-4 rounded-full items-center justify-center"
                >
                    <Text className="text-white text-xl font-bold tracking-wide" style={{ fontFamily: 'Jost-Medium' }}>
                        PAY R {total.toFixed(0)}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
};

export default PurchaseTicketScreen;
