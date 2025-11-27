import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { bannerGradient } from '../styles/colours';
import { textStyles } from '../styles/typography';
import { User, Shield, Bell, Users, MapPin, Ticket, RefreshCcw, HelpCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

type listItems = {
  label: string;
  icon?: React.ReactNode;
  screen: string;
};

const filterOptions: listItems[] = [
  { label: 'Account', icon: <User size={28} color="white" />, screen: 'AccountSettings' },
  { label: 'Privacy & Security', icon: <Shield size={28} color="white" />, screen: 'PrivacySecuritySettings' },
  { label: 'Notifications', icon: <Bell size={28} color="white" />, screen: 'NotificationsSettings' },
  { label: 'Friends & Social', icon: <Users size={28} color="white" />, screen: 'FriendsSocialSettings' },
  { label: 'Location', icon: <MapPin size={28} color="white" />, screen: 'LocationSettings' },
  { label: 'Tickets & Payments', icon: <Ticket size={28} color="white" />, screen: 'TicketsPaymentsSettings' },
  { label: 'Data & Sync', icon: <RefreshCcw size={28} color="white" />, screen: 'DataSyncSettings' },
  { label: 'Support & Feedback', icon: <HelpCircle size={28} color="white" />, screen: 'SupportFeedbackSettings' },
];

const SettingsList = () => {
  const navigation = useNavigation();

  return (
    <LinearGradient {...bannerGradient} className="w-full h-full">
      <View className="flex h-full px-6 py-6 space-y-6 mt-10">
        <Text style={[textStyles.header2, { color: 'white' }]}>Settings</Text>
        {filterOptions.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => navigation.navigate(item.screen as never)}
            className="flex flex-row items-center gap-x-4 mt-6"
            activeOpacity={0.7}
          >
            {item.icon}
            <Text style={[textStyles.paragraph2, { color: 'white' }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </LinearGradient>
  );
};

export default SettingsList;
