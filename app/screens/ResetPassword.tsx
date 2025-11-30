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
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react-native';

// Backend
import { supabase } from '../lib/supabase';

// Styles
import { bannerGradient, fireGradient } from '../styles/colours';

const ResetPassword = () => {
  const navigation = useNavigation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!password || !confirmPassword) {
        Alert.alert("Error", "Please fill in both fields.");
        return;
    }
    if (password !== confirmPassword) {
        Alert.alert("Error", "Passwords do not match.");
        return;
    }

    setLoading(true);

    // 👇 SUPABASE UPDATE LOGIC
    const { error } = await supabase.auth.updateUser({ password: password });

    setLoading(false);

    if (error) {
        Alert.alert("Update Failed", error.message);
    } else {
        Alert.alert("Success", "Your password has been updated. Please log in.");
        // @ts-ignore
        navigation.replace('Login');
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
            <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>
                
                <View className="items-center mb-10">
                    <View className="bg-green-500/20 p-4 rounded-full mb-4 border border-green-500/50">
                        <CheckCircle color="#4ade80" size={40} />
                    </View>
                    <Text className="text-white text-3xl font-bold text-center" style={{ fontFamily: 'Jost-Medium' }}>Reset Password</Text>
                    <Text className="text-gray-400 text-center mt-2">Create a new strong password for your account.</Text>
                </View>

                {/* NEW PASSWORD */}
                <View className="mb-4">
                    <Text className="text-gray-400 text-xs font-bold uppercase mb-2 ml-1">New Password</Text>
                    <View className="flex-row items-center bg-white/10 border border-white/20 rounded-2xl px-4 h-14">
                        <Lock color="white" size={20} className="mr-3 opacity-70" />
                        <TextInput 
                            placeholder="New Password"
                            placeholderTextColor="#666"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            className="flex-1 text-white text-lg font-medium h-full"
                            style={{ fontFamily: 'Jost-Medium' }}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff color="#999" size={20} /> : <Eye color="#999" size={20} />}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* CONFIRM PASSWORD */}
                <View className="mb-8">
                    <Text className="text-gray-400 text-xs font-bold uppercase mb-2 ml-1">Confirm Password</Text>
                    <View className="flex-row items-center bg-white/10 border border-white/20 rounded-2xl px-4 h-14">
                        <Lock color="white" size={20} className="mr-3 opacity-70" />
                        <TextInput 
                            placeholder="Confirm Password"
                            placeholderTextColor="#666"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showPassword}
                            className="flex-1 text-white text-lg font-medium h-full"
                            style={{ fontFamily: 'Jost-Medium' }}
                        />
                    </View>
                </View>

                <TouchableOpacity 
                    onPress={handleUpdate}
                    activeOpacity={0.9}
                    disabled={loading}
                    className={`w-full shadow-lg shadow-orange-500/30 ${loading ? 'opacity-50' : 'opacity-100'}`}
                >
                    <LinearGradient
                        {...fireGradient}
                        className="w-full py-4 rounded-2xl flex-row items-center justify-center"
                    >
                        <Text className="text-white text-xl font-bold tracking-wide" style={{ fontFamily: 'Jost-Medium' }}>
                            {loading ? "UPDATING..." : "UPDATE PASSWORD"}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default ResetPassword;
