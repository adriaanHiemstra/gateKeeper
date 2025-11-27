import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Search, UserPlus, Check } from 'lucide-react-native';

// Components
import TopBanner from '../../components/TopBanner';
import BottomNav from '../../components/BottomNav';

// Styles
import { bannerGradient, fireGradient } from '../../styles/colours';

// Mock Database
const MOCK_USERS = [
  { id: '1', name: 'Casey Frey', handle: '@casey_frey', image: require('../../assets/profile-pic-1.png'), status: 'none' },
  { id: '2', name: 'Sarah Jenkins', handle: '@sarah_j', image: require('../../assets/profile-pic-2.png'), status: 'none' },
  { id: '3', name: 'Mike Thompson', handle: '@miket', image: require('../../assets/imagePlaceHolder2.png'), status: 'none' },
  { id: '4', name: 'Jessica Lee', handle: '@jesslee', image: require('../../assets/imagePlaceHolder3.png'), status: 'friend' },
  { id: '5', name: 'David Miller', handle: '@dave_m', image: require('../../assets/imagePlaceHolder4.png'), status: 'none' },
];

const FindFriendsScreen = () => {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(MOCK_USERS);

  const handleSearch = (text: string) => {
    setQuery(text);
    if (text.trim() === '') {
      setResults(MOCK_USERS);
    } else {
      const filtered = MOCK_USERS.filter(u => 
        u.name.toLowerCase().includes(text.toLowerCase()) || 
        u.handle.toLowerCase().includes(text.toLowerCase())
      );
      setResults(filtered);
    }
  };

  const handleAddFriend = (id: string) => {
    setResults(current => 
      current.map(u => {
        if (u.id === id) return { ...u, status: 'requested' };
        return u;
      })
    );
    Alert.alert("Request Sent", "Friend request sent successfully!");
  };

  const renderUserItem = ({ item }: { item: any }) => (
    <View className="flex-row items-center justify-between bg-white/5 border border-white/10 p-4 mb-3 rounded-2xl">
      <View className="flex-row items-center flex-1">
        <Image 
          source={item.image} 
          className="w-12 h-12 rounded-full mr-4 border border-white/20"
        />
        <View>
          <Text className="text-white font-bold text-lg" style={{ fontFamily: 'Jost-Medium' }}>{item.name}</Text>
          <Text className="text-gray-400 text-sm">{item.handle}</Text>
        </View>
      </View>

      {item.status === 'friend' ? (
        <View className="bg-white/10 px-4 py-2 rounded-full">
          <Text className="text-gray-400 font-bold text-xs">Following</Text>
        </View>
      ) : item.status === 'requested' ? (
        <View className="bg-orange-500/20 border border-orange-500/50 px-4 py-2 rounded-full flex-row items-center">
          <Check color="#FA8900" size={14} className="mr-1" />
          <Text className="text-orange-500 font-bold text-xs">Sent</Text>
        </View>
      ) : (
        <TouchableOpacity 
          onPress={() => handleAddFriend(item.id)}
          className="bg-white px-4 py-2 rounded-full flex-row items-center"
        >
          <UserPlus color="black" size={16} className="mr-1" />
          <Text className="text-black font-bold text-xs">Add</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <TopBanner />

      <SafeAreaView className="flex-1" edges={['left', 'right']}>
        <View className="flex-1 pt-32 px-6">
          
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 bg-white/10 p-2 rounded-full">
               <ArrowLeft color="white" size={24} />
            </TouchableOpacity>
            <Text className="text-white text-3xl font-bold" style={{ fontFamily: 'Jost-Medium' }}>Find Friends</Text>
          </View>

          {/* Search Input */}
          <View className="flex-row items-center bg-white/10 border border-white/20 rounded-2xl px-4 h-14 mb-6">
            <Search color="#FA8900" size={24} className="mr-3" />
            <TextInput
              placeholder="Search username or name..."
              placeholderTextColor="#666"
              value={query}
              onChangeText={handleSearch}
              className="flex-1 text-white text-lg font-medium h-full"
              style={{ fontFamily: 'Jost-Medium' }}
            />
          </View>

          {/* Results List */}
          <FlatList
            data={results}
            renderItem={renderUserItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            ListEmptyComponent={
              <View className="items-center mt-10">
                <Text className="text-gray-500 font-medium">No users found matching "{query}"</Text>
              </View>
            }
          />

        </View>
      </SafeAreaView>
      <BottomNav />
    </View>
  );
};

export default FindFriendsScreen;
