// app/hooks/useSavedEvent.ts
import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";
import { supabase } from "../lib/supabase";

export const useSavedEvent = (eventId: string | undefined) => {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Check if the user already saved this event when the screen loads
  useEffect(() => {
    if (!eventId) return;

    const checkSavedStatus = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Look for a 'SAVED' or 'GOING' intent in our new table
        const { data, error } = await supabase
          .from("event_interactions")
          .select("intent")
          .eq("user_id", user.id)
          .eq("event_id", eventId)
          .single();

        if (data && (data.intent === "SAVED" || data.intent === "GOING")) {
          setIsSaved(true);
        }
      } catch (error) {
        // We ignore the error here because Supabase throws one if 0 rows are found, which is normal!
      } finally {
        setLoading(false);
      }
    };

    checkSavedStatus();
  }, [eventId]);

  // 2. The function triggered when they tap the Heart icon
  const toggleSave = async () => {
    if (!eventId) return;

    // 🔥 Optimistic UI: Instantly change the heart color and trigger haptics
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const previousState = isSaved;
    setIsSaved(!isSaved);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsSaved(previousState); // Revert if not logged in
        return;
      }

      if (previousState) {
        // If it WAS saved, they are un-saving it. Delete the row.
        const { error } = await supabase
          .from("event_interactions")
          .delete()
          .eq("user_id", user.id)
          .eq("event_id", eventId);

        if (error) throw error;
      } else {
        // If it WAS NOT saved, they are saving it. Upsert the intent.
        // We use upsert so if they somehow double-tap, it doesn't crash the database.
        const { error } = await supabase.from("event_interactions").upsert(
          {
            user_id: user.id,
            event_id: eventId,
            intent: "SAVED",
          },
          { onConflict: "user_id,event_id" },
        );

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error saving event:", error);
      setIsSaved(previousState); // Revert the heart color if the database failed
    }
  };

  return { isSaved, toggleSave, loading };
};
