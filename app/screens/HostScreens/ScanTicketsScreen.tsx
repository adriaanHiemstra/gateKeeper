import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  Alert,
  KeyboardAvoidingView, // 👈 Import this
  Platform,             // 👈 Import this
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing
} from 'react-native-reanimated';
import { 
  X, 
  Zap, 
  Keyboard, 
  CheckCircle, 
  AlertCircle, 
  ScanLine
} from 'lucide-react-native';

// Styles
import { electricGradient } from '../../styles/colours';

const { width, height } = Dimensions.get('window');
const SCAN_SIZE = width * 0.7;

const ScanTicketsScreen = () => {
  const navigation = useNavigation();
  
  // --- State ---
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [flashMode, setFlashMode] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [ticketCode, setTicketCode] = useState('');
  
  // Mock Scan Result State
  const [scanResult, setScanResult] = useState<'valid' | 'invalid' | 'duplicate' | null>(null);

  // --- Animation: Scanning Line ---
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(SCAN_SIZE, { duration: 1500, easing: Easing.linear }),
        withTiming(0, { duration: 1500, easing: Easing.linear })
      ),
      -1, // Infinite
      true // Reverse
    );
  }, []);

  const animatedLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // --- Handlers ---
  const handleSimulateScan = () => {
    setScanned(true);
    const results: ('valid' | 'invalid' | 'duplicate')[] = ['valid', 'valid', 'invalid', 'duplicate'];
    const randomResult = results[Math.floor(Math.random() * results.length)];
    setScanResult(randomResult);

    setTimeout(() => {
        setScanned(false);
        setScanResult(null);
    }, 2500);
  };

  const ResultBanner = () => {
    if (!scanResult) return null;

    let bgClass = "bg-green-500";
    let text = "Valid Ticket";
    let subtext = "VIP Access • Sarah Jenkins";
    let icon = <CheckCircle color="white" size={40} />;

    if (scanResult === 'invalid') {
        bgClass = "bg-red-600";
        text = "Invalid Ticket";
        subtext = "Code not recognized";
        icon = <X color="white" size={40} />;
    } else if (scanResult === 'duplicate') {
        bgClass = "bg-yellow-500";
        text = "Already Scanned";
        subtext = "Scanned 10 mins ago";
        icon = <AlertCircle color="white" size={40} />;
    }

    return (
        <View className={`absolute top-1/2 left-6 right-6 -mt-20 rounded-2xl p-6 items-center justify-center shadow-2xl ${bgClass}`}>
            <View className="mb-3">{icon}</View>
            <Text className="text-white text-3xl font-bold mb-1" style={{ fontFamily: 'Jost-Medium' }}>{text}</Text>
            <Text className="text-white/90 text-lg">{subtext}</Text>
        </View>
    );
  };

  return (
    <View className="flex-1 bg-black">
      {/* Fake Camera View */}
      <View style={StyleSheet.absoluteFill} className="bg-gray-900 items-center justify-center">
         <Text className="text-gray-600 mb-2">Camera Preview</Text>
         <TouchableOpacity onPress={handleSimulateScan} className="bg-white/10 px-4 py-2 rounded-full">
            <Text className="text-white font-bold">Tap to Simulate Scan</Text>
         </TouchableOpacity>
      </View>

      {/* UI Overlay */}
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        
        {/* 👇 FIX: KeyboardAvoidingView pushes content up when keyboard opens */}
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 justify-between"
        >
            
            {/* HEADER */}
            <View className="flex-row justify-between items-center px-6 pt-4">
                <TouchableOpacity 
                    onPress={() => navigation.goBack()} 
                    className="bg-black/40 p-3 rounded-full"
                >
                    <X color="white" size={24} />
                </TouchableOpacity>

                <View className="bg-black/40 px-4 py-2 rounded-full">
                    <Text className="text-white font-bold">Scanning...</Text>
                </View>

                <TouchableOpacity 
                    onPress={() => setFlashMode(!flashMode)} 
                    className={`p-3 rounded-full ${flashMode ? 'bg-yellow-400' : 'bg-black/40'}`}
                >
                    <Zap color={flashMode ? 'black' : 'white'} size={24} fill={flashMode ? 'black' : 'none'} />
                </TouchableOpacity>
            </View>

            {/* CENTRAL SCANNING ZONE */}
            {/* We hide this when manual entry is active to make more room for keyboard if needed, 
                or keep it flexible. Here flex-1 allows it to shrink. */}
            <View className="items-center justify-center flex-1 relative">
                <ResultBanner />

                {!scanResult && !manualEntry && (
                    <View 
                        style={{ width: SCAN_SIZE, height: SCAN_SIZE }} 
                        className="relative"
                    >
                        <View className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-2xl" />
                        <View className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-2xl" />
                        <View className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-2xl" />
                        <View className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-2xl" />

                        <Animated.View 
                            style={[{ width: '100%', height: 2, backgroundColor: '#D087FF', shadowColor: '#D087FF', shadowOpacity: 1, shadowRadius: 10 }, animatedLineStyle]} 
                        />
                        
                        <Text className="text-white/70 text-center mt-[110%] font-medium">
                            Align QR Code within frame
                        </Text>
                    </View>
                )}
            </View>

            {/* FOOTER CONTROLS */}
            <View className="px-6 pb-8">
                {manualEntry ? (
                    <View className="w-full">
                        <View className="flex-row items-center bg-black/80 rounded-xl px-4 h-14 mb-4 border border-white/20">
                            <Keyboard color="#ccc" size={20} className="mr-3" />
                            <TextInput 
                                placeholder="Enter Ticket ID (e.g. GK-882)" 
                                placeholderTextColor="#999"
                                className="flex-1 text-white text-lg font-medium h-full ml-4 mb-1"
                                autoFocus
                                value={ticketCode}
                                onChangeText={setTicketCode}
                                // Ensure keyboard doesn't have auto-correct for codes
                                autoCapitalize="characters"
                                autoCorrect={false}
                            />
                            <TouchableOpacity onPress={() => setManualEntry(false)} className="p-2">
                                <X color="#ccc" size={20} />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity 
                            className="w-full"
                            onPress={handleSimulateScan}
                        >
                            <LinearGradient
                                {...electricGradient}
                                className="w-full py-4 rounded-xl items-center justify-center"
                            >
                                <Text className="text-white font-bold text-lg">CHECK TICKET</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity 
                        onPress={() => setManualEntry(true)}
                        className="self-center flex-row items-center bg-black/60 px-6 py-3 rounded-full border border-white/10"
                    >
                        <Keyboard color="white" size={20} className="mr-6" />
                        <Text className="text-white font-bold ml-4">Enter Code Manually</Text>
                    </TouchableOpacity>
                )}
            </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default ScanTicketsScreen;