import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

type SavedEventsContextType = {
  savedEventIds: Set<string>;
  toggleEvent: (eventId: string) => Promise<void>;
};

const SavedEventsContext = createContext<SavedEventsContextType>({} as any);

export const SavedEventsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth();
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(new Set());

  // 1. Fetch all saved events ONCE when the app loads
  useEffect(() => {
    if (!user) return;

    const fetchSavedEvents = async () => {
      // The wishlist (hearts) now lives in its own idempotent table.
      const { data, error } = await supabase
        .from("saved_events")
        .select("event_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching saves:", error);
      } else if (data) {
        // Store them in a highly optimized JavaScript Set
        setSavedEventIds(new Set(data.map((d) => d.event_id)));
      }
    };

    fetchSavedEvents();
  }, [user]);

  // 2. The master toggle function (Optimistic UI)
  const toggleEvent = async (eventId: string) => {
    if (!user) return;

    const isCurrentlySaved = savedEventIds.has(eventId);

    // 🔥 OPTIMISTIC UPDATE: Instantly change the heart color
    setSavedEventIds((prev) => {
      const newSet = new Set(prev);
      if (isCurrentlySaved) newSet.delete(eventId);
      else newSet.add(eventId);
      return newSet;
    });

    // Background Database Sync
    try {
      if (isCurrentlySaved) {
        // Remove it from the wishlist (delete by composite primary key).
        const { error } = await supabase
          .from("saved_events")
          .delete()
          .eq("user_id", user.id)
          .eq("event_id", eventId);

        if (error) throw error;
      } else {
        // Add to wishlist. The PK makes this naturally idempotent — a stray
        // double-tap can't create duplicate rows.
        const { error } = await supabase
          .from("saved_events")
          .upsert(
            { user_id: user.id, event_id: eventId },
            { onConflict: "user_id,event_id" },
          );

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error syncing save:", error);

      // 🛡️ REVERT UI: If DB fails, undo the optimistic update so the user knows!
      setSavedEventIds((prev) => {
        const revertSet = new Set(prev);
        if (isCurrentlySaved) revertSet.add(eventId);
        else revertSet.delete(eventId);
        return revertSet;
      });
    }
  };

  return (
    <SavedEventsContext.Provider value={{ savedEventIds, toggleEvent }}>
      {children}
    </SavedEventsContext.Provider>
  );
};

export const useGlobalSavedEvents = () => useContext(SavedEventsContext);
