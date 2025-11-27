import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Search, X, Plus } from 'lucide-react-native';

// Components
import TopBanner from '../components/TopBanner';
import BottomNav from '../components/BottomNav';

// Styles
import { bannerGradient, fireGradient } from '../styles/colours';

// Enable LayoutAnimation for Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Placeholder Image Path
const PLACEHOLDER_IMG = require('../assets/event-placeholder.png');

// Dummy Data
const socialCircleData = [
  { id: 's1', name: 'Sarah Jenkins' },
  { id: 's2', name: 'Mike Thompson' },
  { id: 's3', name: 'Jessie Reed' },
];

const friendsData = [
  { id: 'f1', name: 'David Chen' },
  { id: 'f2', name: 'Amanda Cole' },
  { id: 'f3', name: 'Ryan Ziglar' },
  { id: 'f4', name: 'Lisa Ray' },
  { id: 'f5', name: 'Kevin O\'Connell' },
  { id: 'f6', name: 'Maria Garcia' },
];

// --- Internal Component: Dual-Mode Expandable Header ---
type HeaderProps = {
  title: string;
  onSearch: (text: string) => void;
  onAdd: (text: string) => void;
};

const SearchableSectionHeader = ({ title, onSearch, onAdd }: HeaderProps) => {
  const [mode, setMode] = useState<'default' | 'search' | 'add'>('default');
  const [inputText, setInputText] = useState('');

  const toggleMode = (newMode: 'default' | 'search' | 'add') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMode(newMode);
    setInputText(''); // Clear text on mode switch
    if (newMode === 'default') {
      onSearch(''); // Reset search filter
    }
  };

  const handleSubmit = () => {
    if (mode === 'add' && inputText.trim().length > 0) {
        onAdd(inputText);
        setInputText('');
        Alert.alert("Success", `Added "${inputText}" to ${title}`);
        toggleMode('default');
    }
  };

  return (
    <View className="mb-4 h-14 justify-center">
      {mode === 'default' ? (
        // DEFAULT VIEW: Title + Plus Icon + Search Icon
        <View className="flex-row items-center justify-between">
          <Text 
            className="text-white text-2xl font-bold"
            style={{ fontFamily: 'Jost-Medium' }}
          >
            {title}
          </Text>
          
          <View className="flex-row gap-3">
            {/* ADD BUTTON */}
            <TouchableOpacity 
              onPress={() => toggleMode('add')} 
              className="bg-white/10 p-3 rounded-full"
            >
              <Plus color="#FA8900" size={24} />
            </TouchableOpacity>

            {/* SEARCH BUTTON */}
            <TouchableOpacity 
              onPress={() => toggleMode('search')} 
              className="bg-white/10 p-3 rounded-full"
            >
              <Search color="#FA8900" size={24} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // EXPANDED INPUT VIEW (Shared for both Search and Add)
        <View className="flex-row items-center bg-white/20 rounded-xl px-4 h-full w-full">
          {/* Icon changes based on mode */}
          {mode === 'search' ? (
             <Search color="white" size={20} className="mr-3 opacity-70" />
          ) : (
             <Plus color="white" size={20} className="mr-3 opacity-70" />
          )}

          <TextInput
            placeholder={mode === 'search' ? `Search ${title}...` : `Add new person...`}
            placeholderTextColor="#ccc"
            value={inputText}
            onChangeText={(text) => {
                setInputText(text);
                if (mode === 'search') onSearch(text); // Live search
            }}
            onSubmitEditing={handleSubmit} // Handle "Add" on enter
            autoFocus={true}
            className="flex-1 text-white text-lg font-medium h-full"
            style={{ fontFamily: 'Jost-Medium' }}
          />
          
           {/* CLOSE BUTTON */}
           <TouchableOpacity onPress={() => toggleMode('default')} className="p-2">
              <X color="white" size={24} />
           </TouchableOpacity>
        </View>
      )}
    </View>
  );
};


// --- Main Screen Component ---
const FriendsSocialCircleScreen = () => {
  const navigation = useNavigation();

  const [socialSearch, setSocialSearch] = useState('');
  const [friendSearch, setFriendSearch] = useState('');

  const filteredSocialCircle = socialCircleData.filter(p => p.name.toLowerCase().includes(socialSearch.toLowerCase()));
  const filteredFriends = friendsData.filter(p => p.name.toLowerCase().includes(friendSearch.toLowerCase()));

  // Mock Add Function
  const handleAddPerson = (name: string, listName: string) => {
      console.log(`Adding ${name} to ${listName}`);
      // Here you would add logic to update the state or make an API call
  };

  const renderPersonItem = (item: any) => (
    <View key={item.id} className="flex-row items-center mb-3 bg-white/10 p-3 rounded-2xl border border-white/10">
      <Image
        source={PLACEHOLDER_IMG}
        className="w-14 h-14 rounded-full mr-4 border border-white/30"
        resizeMode="cover"
      />
      <Text 
        className="text-white text-xl font-medium"
        style={{ fontFamily: 'Jost-Medium' }}
      >
        {item.name}
      </Text>
    </View>
  );

  return (
    <View className="flex-1">
      <LinearGradient
        {...bannerGradient}
        style={StyleSheet.absoluteFill}
      />

      <TopBanner />

      <SafeAreaView className="flex-1" edges={['left', 'right']}>
        <ScrollView 
          className="flex-1 pt-32 px-6" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          
          {/* HEADER SECTION (User Profile) */}
          <View className="mb-10">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mb-6 self-start">
              <LinearGradient
                {...fireGradient}
                className="w-12 h-12 rounded-full items-center justify-center"
              >
                <ArrowLeft color="black" size={28} strokeWidth={2.5} />
              </LinearGradient>
            </TouchableOpacity>

            <View className="flex-row items-center">
              <View className="shadow-lg shadow-black/50 mr-6">
                 <Image 
                  source={PLACEHOLDER_IMG} 
                  className="w-24 h-24 rounded-full border-2 border-white"
                  resizeMode="cover"
                />
              </View>
              <View>
                <Text 
                  className="text-white text-3xl font-bold"
                  style={{ fontFamily: 'Jost-Medium' }}
                >
                  Adriaan
                </Text>
                <Text 
                  className="text-orange-500 text-lg font-medium"
                  style={{ fontFamily: 'Jost-Medium' }}
                >
                  @adriaan_za
                </Text>
              </View>
            </View>
          </View>

          {/* SECTION: Your social circle */}
          <View className="mb-8">
            <SearchableSectionHeader 
                title="Your social circle" 
                onSearch={setSocialSearch} 
                onAdd={(name) => handleAddPerson(name, "Social Circle")}
            />
            <View className="mt-2">
                {filteredSocialCircle.map(renderPersonItem)}
                {filteredSocialCircle.length === 0 && (
                    <Text className="text-gray-400 italic ml-2">No close friends found.</Text>
                )}
            </View>
            <Text className="text-gray-400 text-sm mt-2 ml-2">
                Get notified when they buy tickets.
            </Text>
          </View>

          {/* SECTION: Your Friends */}
          <View>
             <SearchableSectionHeader 
                title="Your Friends" 
                onSearch={setFriendSearch} 
                onAdd={(name) => handleAddPerson(name, "Friends")}
            />
             <View className="mt-2">
                {filteredFriends.map(renderPersonItem)}
                {filteredFriends.length === 0 && (
                    <Text className="text-gray-400 italic ml-2">No friends found.</Text>
                )}
            </View>
             <Text className="text-gray-400 text-sm mt-2 ml-2">
                Events they like appear first for you.
            </Text>
          </View>

        </ScrollView>
      </SafeAreaView>

      <BottomNav />
    </View>
  );
};

export default FriendsSocialCircleScreen;