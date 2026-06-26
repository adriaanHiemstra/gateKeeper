import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera'; // 🚨 NEW: Real Camera Integration
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
  ScanLine,
  Camera as CameraIcon
} from 'lucide-react-native';

// Backend
import { supabase } from '../../lib/supabase'; 

// Styles
import { electricGradient } from '../../styles/colours';

const { width } = Dimensions.get('window');
const SCAN_SIZE = width * 0.7;

const ScanTicketsScreen = () => {
  const navigation = useNavigation();
  
  // --- Camera Permissions ---
  const [permission, requestPermission] = useCameraPermissions();

  // --- State ---
  const [scanned, setScanned] = useState(false);
  const [flashMode, setFlashMode] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [ticketCode, setTicketCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Scanned Ticket Details From Supabase
  const [attendeeName, setAttendeeName] = useState('');
  const [ticketTier, setTicketTier] = useState('');
  const [scanResult, setScanResult] = useState<'valid' | 'invalid' | 'duplicate' | null>(null);

  // --- Animation: Scanning Line ---
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(SCAN_SIZE, { duration: 1500, easing: Easing.linear }),
        withTiming(0, { duration: 1500, easing: Easing.linear })
      ),
      -1, 
      true 
    );
  }, []);

  const animatedLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

// --- 💡 REAL SUPABASE VALIDATION LOGIC ---
  const handleValidateTicket = async (codeToVerify: string) => {
    let cleanCode = codeToVerify.trim().toUpperCase();
  
    if (cleanCode.startsWith('#')) {
        cleanCode = cleanCode.substring(1); // Strips the hashtag if it's there
    }
    if (!cleanCode) {
      Alert.alert("Missing Code", "Please enter or scan a ticket code.");
      return;
    }

    setLoading(true);
    setScanned(true); // Lock scanner loop

    try {
      // 🚨 FIX: Select 'status' instead of 'scanned'. 
      // Relationally pull 'ticket_tiers(name)' to get the tier name safely.
      const { data: ticket, error } = await supabase
        .from('tickets')
        .select('id, qr_code, status, ticket_tiers ( name )')
        .eq('qr_code', cleanCode)
        .maybeSingle();

      if (error) throw error;

      // Case A: Ticket code doesn't exist at all
      if (!ticket) {
        setScanResult('invalid');
        resetScannerWithDelay();
        return;
      }

      // Case B: Ticket status is already marked as 'scanned' or 'used'
      if (ticket.status === 'scanned' || ticket.status === 'used') {
        setAttendeeName("Guest Pass");
        setTicketTier((ticket.ticket_tiers as any)?.name || "Event Ticket");
        setScanResult('duplicate');
        resetScannerWithDelay();
        return;
      }

      // Case C: Valid ticket! Update its 'status' column to 'scanned'
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ 
          status: 'scanned' // 🌟 Updates status column to prevent re-entry
        })
        .eq('id', ticket.id);

      if (updateError) throw updateError;

      // Populate interface with live ticket info
      setAttendeeName("Holder");
      setTicketTier((ticket.ticket_tiers as any)?.name || "General Admission");
      setScanResult('valid');
      setTicketCode(''); // Clear manual text field input
      
      resetScannerWithDelay();

    } catch (error: any) {
      Alert.alert("Database Error", error.message || "Could not check ticket info.");
      setScanned(false);
      setScanResult(null);
    } finally {
      setLoading(false);
    }
  };

  const resetScannerWithDelay = () => {
    setTimeout(() => {
      setScanned(false);
      setScanResult(null);
    }, 3000); // 3 seconds before ready for the next person
  };

  // Triggered when the physical camera reads a QR code
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned || manualEntry) return;
    setTicketCode(data);
    handleValidateTicket(data);
  };

  const handleManualSubmit = () => {
    handleValidateTicket(ticketCode);
  };

  // --- Render Permission Screen if needed ---
  if (!permission) {
    return <View className="flex-1 bg-black items-center justify-center"><ActivityIndicator color="white" /></View>;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-6">
        <CameraIcon color="white" size={60} className="mb-4 opacity-50" />
        <Text className="text-white text-2xl font-bold mb-4 text-center">Camera Access Required</Text>
        <Text className="text-gray-400 text-center mb-8">
          We need access to your camera to scan attendee QR codes at the door.
        </Text>
        <TouchableOpacity onPress={requestPermission}>
          <LinearGradient {...electricGradient} className="px-8 py-4 rounded-full">
             <Text className="text-white font-bold text-lg">Grant Permission</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  const ResultBanner = () => {
    if (!scanResult) return null;

    let bgClass = "bg-green-500";
    let text = "Valid Ticket";
    let subtext = `${ticketTier} • ${attendeeName}`;
    let icon = <CheckCircle color="white" size={40} />;

    if (scanResult === 'invalid') {
        bgClass = "bg-red-600";
        text = "Invalid Ticket";
        subtext = "Code not recognized";
        icon = <X color="white" size={40} />;
    } else if (scanResult === 'duplicate') {
        bgClass = "bg-yellow-500";
        text = "Already Scanned";
        subtext = `Used Entry • ${attendeeName}`;
        icon = <AlertCircle color="white" size={40} />;
    }

    return (
        <View className={`absolute top-1/2 left-6 right-6 -mt-20 rounded-2xl p-6 items-center justify-center shadow-2xl ${bgClass} z-50`}>
            <View className="mb-3">{icon}</View>
            <Text className="text-white text-3xl font-bold mb-1" style={{ fontFamily: 'Jost-Medium' }}>{text}</Text>
            <Text className="text-white/90 text-lg text-center">{subtext}</Text>
        </View>
    );
  };

  return (
    <View className="flex-1 bg-black">
      {/* 🚨 LIVE CAMERA FEED */}
      {!manualEntry && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={flashMode}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        />
      )}
      
      {/* Dim overlay when doing manual entry */}
      {manualEntry && <View style={StyleSheet.absoluteFill} className="bg-gray-900" />}

      {/* UI Overlay */}
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 justify-between"
        >
            {/* HEADER */}
            <View className="flex-row justify-between items-center px-6 pt-4">
                <TouchableOpacity 
                    onPress={() => navigation.goBack()} 
                    className="bg-black/60 p-3 rounded-full"
                >
                    <X color="white" size={24} />
                </TouchableOpacity>

                <View className="bg-black/60 px-4 py-2 rounded-full">
                    <Text className="text-white font-bold">
                      {loading ? "Checking Database..." : (scanned ? "Processing..." : "Scanning Ready...")}
                    </Text>
                </View>

                <TouchableOpacity 
                    onPress={() => setFlashMode(!flashMode)} 
                    className={`p-3 rounded-full ${flashMode ? 'bg-yellow-400' : 'bg-black/60'}`}
                >
                    <Zap color={flashMode ? 'black' : 'white'} size={24} fill={flashMode ? 'black' : 'none'} />
                </TouchableOpacity>
            </View>

            {/* CENTRAL SCANNING ZONE */}
            <View className="items-center justify-center flex-1 relative">
                <ResultBanner />

                {!scanResult && !manualEntry && (
                    <View style={{ width: SCAN_SIZE, height: SCAN_SIZE }} className="relative">
                        <View className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-2xl" />
                        <View className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-2xl" />
                        <View className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-2xl" />
                        <View className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white rounded-tr-2xl" />

                        <Animated.View 
                            style={[{ width: '100%', height: 2, backgroundColor: '#D087FF', shadowColor: '#D087FF', shadowOpacity: 1, shadowRadius: 10 }, animatedLineStyle]} 
                        />
                        
                        <Text className="text-white/80 text-center mt-[110%] font-bold bg-black/50 px-4 py-1 rounded-full overflow-hidden">
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
                                placeholder="Enter Ticket ID (e.g. GK-882910)" 
                                placeholderTextColor="#999"
                                className="flex-1 text-white text-lg font-medium h-full ml-4 mb-1"
                                autoFocus
                                value={ticketCode}
                                onChangeText={setTicketCode}
                                autoCapitalize="characters"
                                autoCorrect={false}
                                editable={!loading}
                            />
                            <TouchableOpacity onPress={() => setManualEntry(false)} className="p-2">
                                <X color="#ccc" size={20} />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity 
                            className="w-full"
                            onPress={handleManualSubmit}
                            disabled={loading}
                        >
                            <LinearGradient
                                {...electricGradient}
                                className="w-full py-4 rounded-xl items-center justify-center flex-row"
                            >
                                {loading ? (
                                  <ActivityIndicator color="white" className="mr-2" />
                                ) : (
                                  <Text className="text-white font-bold text-lg">CHECK TICKET</Text>
                                )}
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