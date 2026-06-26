// app/lib/interactions.ts
import { supabase } from "./supabase";

export const trackEventInteraction = async (
  eventId: string, 
  intent: 'CLICKED' | 'SAVED' | 'GOING'
) => {
  try {
    // 1. Secretly grab the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // If they aren't logged in, do nothing

    // 2. Silently insert the log into the database
    const { error } = await supabase
      .from('event_interactions')
      .insert([
        { 
          user_id: user.id, 
          event_id: eventId, 
          intent: intent 
        }
      ]);

    if (error) console.warn("Failed to track interaction:", error);
  } catch (err) {
    console.warn("Tracking error:", err);
  }
};
