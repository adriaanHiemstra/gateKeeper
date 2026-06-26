// Shared CORS headers for all Edge Functions. The app calls these functions
// from a different origin (the Expo runtime), so every response must carry them.
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
