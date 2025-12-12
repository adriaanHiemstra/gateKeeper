// app/types/types.ts

export type RootStackParamList = {
  Home: undefined;
  Map: undefined;
  Search: undefined;
  // Profile: undefined; ❌ REMOVED

  // Auth screens
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;

  // Settings screens
  AccountSettings: undefined;
  EditUserProfile: undefined;
  ChangePassword: undefined;
  PrivacySecuritySettings: undefined;
  NotificationsSettings: undefined;
  FriendsSocialSettings: undefined;
  LocationSettings: undefined;
  TicketsPaymentsSettings: undefined;
  DataSyncSettings: undefined;
  SupportFeedbackSettings: undefined;
  MyTicketsScreen: undefined;
  Wishlist: undefined;
  GetConnected: undefined;
  AddPayment: undefined;
  AddCardScreen: undefined;
  DeleteAccount: undefined;
  FriendsSocialCircle: undefined;
  FindFriends: undefined;

  // Event screens
  EventProfile: {
    eventId: string;
    eventName: string;
    attendees: number;
    logo: any;
    banner: any;
    description?: string;
    time?: string;
    location?: string;
    ticketUrl?: string;
    images?: any[];
    tags?: string[]; // ✅ Added this (you already had it)
    ticket_tiers?: any[]; // ✅ ADDED THIS (Required for price calculation)
  };
  TicketDisplay: {
    eventId: string;
    eventTitle: string;
    ticketId?: string;
    eventImage?: any;
    eventLocation?: string;
    eventTime?: string;
    // ✅ ADD THESE TWO LINES:
    ticketTierName?: string;
    ticketPrice?: string;
  };
  EventHostProfile: undefined;
  PurchaseTicket: {
    eventId: string;
    eventName: string;
    ticket_tiers: any[]; // The list of real prices
    banner?: any;
    logo?: any;
    time?: string;
    location?: string;
  };
  VenueProfile: { venueId: string; venueName: string };
  VenueReviews: { venueId: string; venueName: string };
  EventDiscussion: { eventId: string; eventName: string };

  // Host Screens
  HostDashboard: undefined;
  MyEventsList: undefined;
  ManageEvent: { eventId: string };
  CreateEvent: undefined;
  ScanTickets: undefined;
  EditEvent: { eventId: string };
  PostContent: { eventId: string };
  HostProfileEdit: undefined;
  EventStats: undefined;
  PayoutsSetup: undefined;
  HostSettings: undefined;
  HostNotifications: undefined;
  HostSecurity: undefined;
  HostSupport: undefined;
  GuestList: undefined;
  TeamAccess: undefined;
  PromoteEvent: { eventId: string };
};
