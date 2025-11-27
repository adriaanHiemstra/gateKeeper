export type RootStackParamList = {
  Home: undefined;
  Map: undefined;
  Search: undefined;
  // Profile: undefined; // ❌ REMOVED

  // Auth screens
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;

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

  // Event screens
  EventProfile: {
    eventName: string;
    attendees: number;
    logo: any;
    banner: any;
    description?: string;
    time?: string;
    location?: string;
  };
  VenueProfile: { venueId: string; venueName: string };
  TicketDisplay: {
    eventTitle: string;
    ticketId?: string;
    eventImage?: any;
    eventLocation?: string;
    eventTime?: string;
  };
  EventHostProfile: undefined;
  PurchaseTicket: { eventId: string };
  VenueReviews: { venueId: string; venueName: string };
  EventDiscussion: { eventId: string; eventName: string }; // 👈 Add this

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
  EventReviews: { eventId: string };
};
