import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Mail, ArrowLeft, Send } from 'lucide-react-native';

// Backend
import { supabase } from '../lib/supabase';

// Styles
import { bannerGradient, fireGradient } from '../styles/colours';

const ForgotPassword = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
        Alert.alert("Error", "Please enter your email address.");
        return;
    }

    setLoading(true);

    // 👇 SUPABASE RESET LOGIC
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'gatekeeper://reset-password', // Deep link to your app
    });

    setLoading(false);

    if (error) {
        Alert.alert("Error", error.message);
    } else {
        Alert.alert("Check your email", "We sent a password reset link to " + email);
        navigation.goBack();
    }
  };

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
                
                <TouchableOpacity onPress={() => navigation.goBack()} className="mb-6 bg-white/10 self-start p-2 rounded-full">
                    <ArrowLeft color="white" size={24} />
                </TouchableOpacity>

                <Text className="text-white text-3xl font-bold mb-2" style={{ fontFamily: 'Jost-Medium' }}>Forgot Password?</Text>
                <Text className="text-gray-400 text-lg mb-10">Don't worry! It happens. Please enter the address associated with your account.</Text>

                <View className="mb-8">
                    <Text className="text-gray-400 text-xs font-bold uppercase mb-2 ml-1">Email Address</Text>
                    <View className="flex-row items-center bg-white/10 border border-white/20 rounded-2xl px-4 h-14">
                        <Mail color="white" size={20} className="mr-3 opacity-70" />
                        <TextInput 
                            placeholder="Enter your email"
                            placeholderTextColor="#666"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            className="flex-1 text-white text-lg font-medium h-full"
                            style={{ fontFamily: 'Jost-Medium' }}
                        />
                    </View>
                </View>

                <TouchableOpacity 
                    onPress={handleReset}
                    activeOpacity={0.9}
                    disabled={loading}
                    className={`w-full shadow-lg shadow-orange-500/30 ${loading ? 'opacity-50' : 'opacity-100'}`}
                >
                    <LinearGradient
                        {...fireGradient}
                        className="w-full py-4 rounded-2xl flex-row items-center justify-center"
                    >
                        <Text className="text-white text-xl font-bold tracking-wide mr-2" style={{ fontFamily: 'Jost-Medium' }}>
                            {loading ? "SENDING..." : "SEND LINK"}
                        </Text>
                        {!loading && <Send color="white" size={20} />}
                    </LinearGradient>
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default ForgotPassword;
