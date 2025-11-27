import React from 'react';
import { View, Text, ScrollView, SafeAreaView } from 'react-native';
import BottomNav from '../components/BottomNav';
import TopBanner from '../components/TopBanner';
import SettingsList from '../components/settingsList';




const Profile = () =>{
    return(
<SafeAreaView >
<TopBanner/>
<SettingsList/>
<BottomNav />
</SafeAreaView>
);};
export default Profile;