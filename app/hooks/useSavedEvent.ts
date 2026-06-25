import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";
import { useGlobalSavedEvents } from "../context/SavedEventsContext";

export const useSavedEvent = (eventId: string) => {
  const { savedEventIds, toggleEvent } = useGlobalSavedEvents();

  // 1. LOCAL STATE: This makes the UI instant for the specific card you tapped
  const [isSavedLocal, setIsSavedLocal] = useState(savedEventIds.has(eventId));

  // 2. SYNC: If the global memory changes from another screen (like the Wishlist), update this card
  useEffect(() => {
    setIsSavedLocal(savedEventIds.has(eventId));
  }, [savedEventIds, eventId]);

  const toggleSave = async () => {
    // 🔥 FIRE HAPTIC FEEDBACK INSTANTLY
    // 'Medium' gives a nice, premium physical pop. You can also try 'Light' or 'Heavy'.
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // ⚡ INSTANT UI UPDATE (Bypasses React's global re-render queue)
    setIsSavedLocal((prev) => !prev);

    // 🌍 toggleEvent is the SINGLE source of truth: it adds/removes the SAVED row
    // in the database (and updates the global wishlist). We intentionally do NOT
    // also call trackEventInteraction here — doing both wrote the row twice on a
    // like and inserted a stray row on an un-like.
    await toggleEvent(eventId);
  };

  return { isSaved: isSavedLocal, toggleSave };
};
