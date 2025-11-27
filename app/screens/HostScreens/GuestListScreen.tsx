import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Search, CheckCircle, User } from 'lucide-react-native';

// Components
import HostTopBanner from '../../components/HostTopBanner';
import HostBottomNav from '../../components/HostBottomNav';

// Styles
import { bannerGradient, electricGradient } from '../../styles/colours';

// Mock Data
const initialGuests = [
  { id: '1', name: 'Sarah Jenkins', ticket: 'VIP Access', status: 'checked-in' },
  { id: '2', name: 'Mike Thompson', ticket: 'General Admission', status: 'pending' },
  { id: '3', name: 'Jessica Lee', ticket: 'General Admission', status: 'pending' },
  { id: '4', name: 'David Miller', ticket: 'VIP Access', status: 'pending' },
  { id: '5', name: 'Amanda Cole', ticket: 'General Admission', status: 'checked-in' },
  { id: '6', name: 'Ryan Ziglar', ticket: 'Early Bird', status: 'pending' },
  { id: '7', name: 'Lisa Ray', ticket: 'VIP Access', status: 'checked-in' },
];

const GuestListScreen = () => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');
  const [guests, setGuests] = useState(initialGuests);

  // Filter logic
  const filteredGuests = guests.filter(g => 
    g.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // Toggle Check-in Status
  const toggleCheckIn = (id: string) => {
    setGuests(current => 
      current.map(g => {
        if (g.id === id) {
          return { ...g, status: g.status === 'pending' ? 'checked-in' : 'pending' };
        }
        return g;
      })
    );
  };

  // Stats Calculation
  const total = guests.length;
  const checkedIn = guests.filter(g => g.status === 'checked-in').length;
  const remaining = total - checkedIn;

  const renderGuest = ({ item }: { item: any }) => {
    const isCheckedIn = item.status === 'checked-in';
    
    return (
      <View className="flex-row items-center justify-between bg-white/5 border border-white/10 p-4 mb-3 rounded-2xl">
        <View className="flex-row items-center flex-1">
            <View className="bg-white/10 p-3 rounded-full mr-4">
                <User color={isCheckedIn ? "#4ade80" : "white"} size={20} />
            </View>
            <View>
                <Text className="text-white text-lg font-bold" style={{ fontFamily: 'Jost-Medium' }}>
                    {item.name}
                </Text>
                <View className="flex-row items-center mt-1">
                    <View className={`w-2 h-2 rounded-full mr-2 ${item.ticket.includes('VIP') ? 'bg-purple-500' : 'bg-blue-400'}`} />
                    <Text className="text-gray-400 text-sm">{item.ticket}</Text>
                </View>
            </View>
        </View>

        <TouchableOpacity 
          onPress={() => toggleCheckIn(item.id)}
          activeOpacity={0.8}
          className={`flex-row items-center px-4 py-2 rounded-full border ${isCheckedIn ? 'bg-green-500/20 border-green-500/50' : 'bg-white/10 border-white/20'}`}
        >
          {isCheckedIn ? (
            <>
              <CheckCircle color="#4ade80" size={16} className="mr-2" />
              <Text className="text-green-400 font-bold text-xs uppercase">In</Text>
            </>
          ) : (
            <Text className="text-white font-bold text-xs uppercase">Check In</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#121212]">
      {/* Background */}
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <View className="absolute inset-0 bg-black/40" />

      <HostTopBanner />

      <SafeAreaView className="flex-1" edges={['left', 'right']}>
        <View className="flex-1 pt-32 px-6">
          
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 bg-white/10 p-2 rounded-full">
               <ArrowLeft color="white" size={24} />
            </TouchableOpacity>
            <Text className="text-white text-3xl font-bold" style={{ fontFamily: 'Jost-Medium' }}>Guest List</Text>
          </View>

          {/* Live Stats Row */}
          <View className="flex-row gap-3 mb-6">
             <View className="flex-1 bg-white/5 border border-white/10 p-3 rounded-xl items-center">
                <Text className="text-gray-400 text-xs uppercase font-bold mb-1">Total</Text>
                <Text className="text-white text-2xl font-bold">{total}</Text>
             </View>
             <View className="flex-1 bg-green-500/10 border border-green-500/30 p-3 rounded-xl items-center">
                <Text className="text-green-400 text-xs uppercase font-bold mb-1">Checked In</Text>
                <Text className="text-green-400 text-2xl font-bold">{checkedIn}</Text>
             </View>
             <View className="flex-1 bg-white/5 border border-white/10 p-3 rounded-xl items-center">
                <Text className="text-gray-400 text-xs uppercase font-bold mb-1">Pending</Text>
                <Text className="text-white text-2xl font-bold">{remaining}</Text>
             </View>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center bg-white/10 rounded-xl px-4 h-12 mb-6 border border-white/10">
            <Search color="#999" size={20} className="mr-3" />
            <TextInput 
              placeholder="Search by name or ticket number..." 
              placeholderTextColor="#666"
              value={searchText}
              onChangeText={setSearchText}
              className="flex-1 text-white font-medium h-full"
              style={{ fontFamily: 'Jost-Medium' }}
            />
          </View>

          {/* The List */}
          <FlatList 
            data={filteredGuests}
            renderItem={renderGuest}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            ListEmptyComponent={
                <View className="items-center mt-10">
                    <Text className="text-gray-500">No guests found matching "{searchText}"</Text>
                </View>
            }
          />

        </View>
      </SafeAreaView>
      <HostBottomNav />
    </View>
  );
};

export default GuestListScreen;
