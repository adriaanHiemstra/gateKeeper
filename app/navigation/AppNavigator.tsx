import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Main Screens
import Map from "../screens/Map";
import HomeScreen from "../screens/HomeScreen";
import Search from "../screens/Search";
// import Profile from "../screens/Profile"; // ❌ REMOVED

// Auth
import SignUp from "../screens/SignUp";
import Login from "../screens/Login";
import ForgotPassword from "../screens/ForgotPassword";

// Event Screens
import EventProfileScreen from "../screens/EventProfileScreen";
import TicketDisplayScreen from "../screens/TicketDisplayScreen";
import EventHostProfileScreen from "../screens/EventHostProfileScreen";
import FriendsSocialCircleScreen from "../screens/FriendsSocialCircleScreen";
import PurchaseTicketScreen from "../screens/PurchaseTicketScreen";
import VenueProfileScreen from "../screens/VenueProfileScreen";
import VenueReviewsScreen from "../screens/VenueReviewsScreen";

// Settings screens
import MyTicketsScreen from "../screens/MyTicketsScreen";
import WishlistScreen from "../screens/SettingScreens/WishListScreen";
import GetConnected from "../screens/SettingScreens/GetConnected";
import AddPayment from "../screens/SettingScreens/AddPayment";
import AddCardScreen from "../screens/SettingScreens/AddCardScreen";
import DeleteAccountScreen from "../screens/SettingScreens/DeleteAccountScreen";
import AccountSettings from "../screens/SettingScreens/AccountSettings";
import EditUserProfile from "../screens/SettingScreens/EditUserProfile";
import ChangePassword from "../screens/SettingScreens/ChangePassword";
import PrivacySecuritySettings from "../screens/SettingScreens/PrivacySecuritySettings";
import NotificationsSettings from "../screens/SettingScreens/NotificationsSettings";
import FriendsSocialSettings from "../screens/SettingScreens/FriendsSocialSettings";
import LocationSettings from "../screens/SettingScreens/LocationSettings";
import TicketsPaymentsSettings from "../screens/SettingScreens/TicketsPaymentsSettings";
import DataSyncSettings from "../screens/SettingScreens/DataSyncSettings";
import SupportFeedbackSettings from "../screens/SettingScreens/SupportFeedbackSettings";

import type { RootStackParamList } from "../types/types";

// Host Screens
import HostDashboard from "../screens/HostScreens/HostDashboard";
import MyEventsList from "../screens/HostScreens/MyEventsList";
import ManageEventScreen from "../screens/HostScreens/ManageEventScreen";
import CreateEventScreen from "../screens/HostScreens/CreateEventScreen";
import ScanTicketsScreen from "../screens/HostScreens/ScanTicketsScreen";
import EditEventScreen from "../screens/HostScreens/EditEventsScreen";
import PostContentScreen from "../screens/HostScreens/PostContentScreen";
import HostProfileEditScreen from "../screens/HostScreens/HostProfileEditScreen";
import EventStatsScreen from "../screens/HostScreens/EventStatsScreen";
import PayoutsSetupScreen from "../screens/HostScreens/PayoutsSetupScreen";
import HostSettingsScreen from "../screens/HostScreens/HostSettingsScreen";
import HostNotificationsSettings from "../screens/HostScreens/HostNotificationsSettings";
import HostSecuritySettings from "../screens/HostScreens/HostSecuritySettings";
import HostSupportSettings from "../screens/HostScreens/HostSupportSettings";
import GuestListScreen from "../screens/HostScreens/GuestListScreen";
import TeamAccessScreen from "../screens/HostScreens/TeamAccessScreen";
import PromoteEventScreen from "../screens/HostScreens/PromoteEventScreen";
import EventDiscussionScreen from "../screens/EventDiscussionScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="VenueProfile"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Map" component={Map} />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen name="Search" component={Search} />
        {/* <Stack.Screen name="Profile" component={Profile} /> ❌ REMOVED */}

        <Stack.Screen
          name="FriendsSocialCircle"
          component={FriendsSocialCircleScreen}
        />
        <Stack.Screen
          name="EventProfile"
          component={EventProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="TicketDisplay" component={TicketDisplayScreen} />
        <Stack.Screen
          name="EventHostProfile"
          component={EventHostProfileScreen}
        />
        <Stack.Screen name="VenueProfile" component={VenueProfileScreen} />
        <Stack.Screen name="PurchaseTicket" component={PurchaseTicketScreen} />
        <Stack.Screen name="VenueReviews" component={VenueReviewsScreen} />

        {/* Settings screens */}
        <Stack.Screen name="MyTicketsScreen" component={MyTicketsScreen} />
        <Stack.Screen name="GetConnected" component={GetConnected} />
        <Stack.Screen name="AddPayment" component={AddPayment} />
        <Stack.Screen name="AddCardScreen" component={AddCardScreen} />
        <Stack.Screen name="AccountSettings" component={AccountSettings} />
        <Stack.Screen name="EditUserProfile" component={EditUserProfile} />
        <Stack.Screen name="ChangePassword" component={ChangePassword} />
        <Stack.Screen
          name="PrivacySecuritySettings"
          component={PrivacySecuritySettings}
        />
        <Stack.Screen name="Wishlist" component={WishlistScreen} />
        <Stack.Screen
          name="NotificationsSettings"
          component={NotificationsSettings}
        />
        <Stack.Screen
          name="FriendsSocialSettings"
          component={FriendsSocialSettings}
        />
        <Stack.Screen name="LocationSettings" component={LocationSettings} />
        <Stack.Screen
          name="TicketsPaymentsSettings"
          component={TicketsPaymentsSettings}
        />
        <Stack.Screen name="DataSyncSettings" component={DataSyncSettings} />
        <Stack.Screen
          name="SupportFeedbackSettings"
          component={SupportFeedbackSettings}
        />
        <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />

        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />

        {/* Host Screens */}
        <Stack.Screen name="HostDashboard" component={HostDashboard} />
        <Stack.Screen name="MyEventsList" component={MyEventsList} />
        <Stack.Screen name="ManageEvent" component={ManageEventScreen} />
        <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
        <Stack.Screen name="ScanTickets" component={ScanTicketsScreen} />
        <Stack.Screen name="EditEvent" component={EditEventScreen} />
        <Stack.Screen name="PostContent" component={PostContentScreen} />
        <Stack.Screen
          name="HostProfileEdit"
          component={HostProfileEditScreen}
        />
        <Stack.Screen name="EventStats" component={EventStatsScreen} />
        <Stack.Screen name="PayoutsSetup" component={PayoutsSetupScreen} />
        <Stack.Screen name="HostSettings" component={HostSettingsScreen} />
        <Stack.Screen
          name="HostNotifications"
          component={HostNotificationsSettings}
        />
        <Stack.Screen name="HostSecurity" component={HostSecuritySettings} />
        <Stack.Screen name="HostSupport" component={HostSupportSettings} />
        <Stack.Screen name="GuestList" component={GuestListScreen} />
        <Stack.Screen name="TeamAccess" component={TeamAccessScreen} />
        <Stack.Screen name="PromoteEvent" component={PromoteEventScreen} />
        <Stack.Screen
          name="EventDiscussion"
          component={EventDiscussionScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
