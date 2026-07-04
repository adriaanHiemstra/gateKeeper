import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Users } from 'lucide-react-native';
import * as Contacts from 'expo-contacts';

// Components
import TopBanner from '../../components/TopBanner';
import BottomNav from '../../components/BottomNav';

// Backend
import { supabase } from '../../lib/supabase';

// Styles
import { bannerGradient, fireGradient } from '../../styles/colours';

const GetConnected = () => {
  const navigation = useNavigation();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need contacts access to find your friends.');
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });

      // Normalise numbers to both 0xx and 27xx forms so we match either storage style.
      const cleaned = data
        .flatMap((c) => (c.phoneNumbers ? c.phoneNumbers.map((p) => p.number) : []))
        .filter(Boolean)
        .map((num) => num?.replace(/\D/g, ''))
        .flatMap((num) => {
          if (!num) return [];
          if (num.startsWith('27') && num.length === 11) return [num, '0' + num.substring(2)];
          if (num.startsWith('0') && num.length === 10) return [num, '27' + num.substring(1)];
          return [num];
        });
      const unique = Array.from(new Set(cleaned));

      const { data: matches, error } = await supabase.rpc('match_contacts', {
        phone_array: unique,
      });
      if (error) throw error;

      if (!matches || matches.length === 0) {
        Alert.alert('All synced', "None of your contacts are new to GateKeeper right now.");
        return;
      }

      // Send a request to each match. request_friend is idempotent — it returns
      // 'requested' for new asks, and already_friends/already_requested otherwise,
      // so we can safely fire them all and just count the new ones.
      const results = await Promise.all(
        matches.map((m: any) => supabase.rpc('request_friend', { target: m.id })),
      );
      const sent = results.filter(
        (r) => r.data === 'requested' || r.data === 'accepted',
      ).length;

      if (sent > 0) {
        Alert.alert(
          'Requests sent',
          `We sent ${sent} friend request${sent === 1 ? '' : 's'} to people from your contacts. They'll appear once accepted.`,
        );
      } else {
        Alert.alert('All caught up', "You've already connected with everyone we found.");
      }
    } catch (err: any) {
      console.log('Re-sync error:', err);
      Alert.alert('Error', "We couldn't sync your contacts. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const handleSkip = () => {
    navigation.goBack();
  };

  return (
    <View className="flex-1">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <TopBanner />

      <SafeAreaView className="flex-1">
        <View className="flex-1 justify-center items-center px-8 pt-24">
          <View className="mb-8 bg-white/10 p-6 rounded-full border border-white/20">
            <Users size={64} color="#FA8900" />
          </View>

          <Text
            className="text-4xl text-center font-bold mb-4 text-white"
            style={{ fontFamily: 'Jost-Medium' }}
          >
            Find Your Crew
          </Text>

          <Text
            className="text-xl text-center text-gray-300 mb-12 leading-8"
            style={{ fontFamily: 'Jost-Medium' }}
          >
            Sync your contacts to send friend requests and see where your friends are going.
          </Text>

          <TouchableOpacity
            onPress={handleSync}
            disabled={syncing}
            activeOpacity={0.8}
            className="w-full shadow-lg shadow-black/50"
          >
            <LinearGradient
              {...fireGradient}
              className="w-full py-5 rounded-full items-center justify-center"
            >
              {syncing ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text
                  className="text-white text-2xl font-bold tracking-wide"
                  style={{ fontFamily: 'Jost-Medium' }}
                >
                  SYNC CONTACTS
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} className="mt-6 p-2" disabled={syncing}>
            <Text
              className="text-gray-400 text-lg font-medium"
              style={{ fontFamily: 'Jost-Medium' }}
            >
              I don't want to sync
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <BottomNav />
    </View>
  );
};

export default GetConnected;
