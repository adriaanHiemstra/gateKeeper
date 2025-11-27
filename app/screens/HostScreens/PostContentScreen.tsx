import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { 
  ArrowLeft, 
  ImagePlus, 
  Send, 
  Bell,
  X
} from 'lucide-react-native';

// Components
import HostTopBanner from '../../components/HostTopBanner';

// Styles
import { bannerGradient, electricGradient } from '../../styles/colours';
import { RootStackParamList } from '../../types/types';

type PostContentRouteProp = RouteProp<RootStackParamList, 'PostContent'>;

const PostContentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<PostContentRouteProp>();
  const { eventId } = route.params || { eventId: '1' };

  // State
  const [caption, setCaption] = useState('');
  const [imageUri, setImageUri] = useState<any>(null); 
  const [sendNotification, setSendNotification] = useState(true);

  // Mock Image Picker
  const handlePickImage = () => {
    setImageUri(require('../../assets/imagePlaceHolder1.png')); 
  };

  const handleRemoveImage = () => {
    setImageUri(null);
  };

  const handlePost = () => {
    if (!caption && !imageUri) {
        Alert.alert("Empty Post", "Please add an image or a caption.");
        return;
    }
    
    Alert.alert(
        "Posted!", 
        sendNotification 
            ? "Your update is live and attendees have been notified." 
            : "Your update is live on the event feed.",
        [{ text: "Awesome", onPress: () => navigation.goBack() }]
    );
  };

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <View className="absolute inset-0 bg-black/40" />

      <HostTopBanner />

      <SafeAreaView className="flex-1" edges={['left', 'right']}>
        <ScrollView 
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 120, paddingBottom: 140 }}
        >
          
          {/* HEADER */}
          <View className="flex-row items-center mb-8">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 bg-white/10 p-2 rounded-full">
               <ArrowLeft color="white" size={24} />
            </TouchableOpacity>
            <View>
                <Text className="text-white/60 text-sm uppercase font-bold tracking-widest">Summer Slam 2025</Text>
                <Text className="text-white text-3xl font-bold" style={{ fontFamily: 'Jost-Medium' }}>New Update</Text>
            </View>
          </View>

          {/* 1. MEDIA UPLOAD AREA */}
          {imageUri ? (
            <View className="mb-6 relative rounded-2xl overflow-hidden shadow-lg shadow-purple-900/40">
                <Image 
                    source={imageUri} 
                    className="w-full h-64" 
                    resizeMode="cover"
                />
                <TouchableOpacity 
                    onPress={handleRemoveImage}
                    className="absolute top-3 right-3 bg-black/60 p-2 rounded-full border border-white/20"
                >
                    <X color="white" size={20} />
                </TouchableOpacity>
                
                <View className="absolute bottom-3 left-3 bg-purple-600/90 px-3 py-1 rounded-md">
                    <Text className="text-white text-xs font-bold">MEDIA ATTACHED</Text>
                </View>
            </View>
          ) : (
            <TouchableOpacity 
                onPress={handlePickImage}
                activeOpacity={0.8}
                className="w-full h-48 bg-white/5 border-2 border-dashed border-white/20 rounded-2xl items-center justify-center mb-6"
            >
                <View className="bg-purple-500/20 p-4 rounded-full mb-2">
                    <ImagePlus color="#D087FF" size={32} />
                </View>
                <Text className="text-gray-400 font-medium">Add a Photo or Video</Text>
            </TouchableOpacity>
          )}

          {/* 2. CAPTION INPUT */}
          <Text className="text-white text-lg font-bold mb-3">Caption</Text>
          <View className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 mb-6 h-40">
            <TextInput
                placeholder="What's happening? (e.g. Set times released!)"
                placeholderTextColor="#6b7280"
                value={caption}
                onChangeText={setCaption}
                multiline
                textAlignVertical="top"
                className="flex-1 text-white text-lg font-medium"
                style={{ fontFamily: 'Jost-Medium' }}
            />
          </View>

          {/* 3. NOTIFICATION TOGGLE */}
          {/* 👇 FIX: Added flex-1 to the inner text container to force wrapping */}
          <View className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4 flex-row items-center justify-between mb-8">
            <View className="flex-row items-center flex-1 mr-4">
                <View className="bg-purple-500/20 p-3 rounded-full mr-3">
                    <Bell color="#D087FF" size={24} />
                </View>
                <View className="flex-1"> 
                    <Text className="text-white font-bold text-lg">Notify Attendees</Text>
                    <Text className="text-gray-400 text-xs leading-4">Sends a push notification to everyone who liked or bought a ticket.</Text>
                </View>
            </View>
            <Switch 
                value={sendNotification} 
                onValueChange={setSendNotification}
                trackColor={{ false: '#333', true: '#D087FF' }}
                thumbColor={'#fff'}
            />
          </View>

        </ScrollView>

        {/* POST BUTTON */}
        <View className="absolute bottom-0 left-0 right-0 p-6 bg-[#121212]/90 border-t border-white/10">
            <TouchableOpacity 
                activeOpacity={0.8}
                className="w-full shadow-lg shadow-purple-500/30"
                onPress={handlePost}
            >
                <LinearGradient
                    {...electricGradient}
                    className="w-full py-4 rounded-full flex-row items-center justify-center"
                >
                    <Send color="white" size={20} className="mr-2" />
                    <Text className="text-white text-xl font-bold tracking-wide" style={{ fontFamily: 'Jost-Medium' }}>
                        POST UPDATE
                    </Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
};

export default PostContentScreen;