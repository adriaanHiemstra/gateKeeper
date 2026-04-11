import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

type SavedEventsContextType = {
  savedEventIds: Set<string>;
  toggleEvent: (eventId: string) => Promise<void>;
};

const SavedEventsContext = createContext<SavedEventsContextType>({} as any);

export const SavedEventsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(new Set());

  // 1. Fetch all saved events ONCE when the app loads
  useEffect(() => {
    if (!user) return;

    const fetchSavedEvents = async () => {
      const { data } = await supabase
        .from('event_interactions')
        .select('event_id')
        .eq('user_id', user.id)
        .in('intent', ['SAVED', 'GOING']);

      if (data) {
        // Store them in a highly optimized JavaScript Set
        setSavedEventIds(new Set(data.map(d => d.event_id)));
      }
    };

    fetchSavedEvents();
  }, [user]);

  // 2. The master toggle function (Optimistic UI)
  const toggleEvent = async (eventId: string) => {
    if (!user) return;

    const isCurrentlySaved = savedEventIds.has(eventId);

    // 🔥 OPTIMISTIC UPDATE: Instantly change the heart color before the DB even responds
    setSavedEventIds(prev => {
      const newSet = new Set(prev);
      if (isCurrentlySaved) newSet.delete(eventId);
      else newSet.add(eventId);
      return newSet;
    });

    // Background Database Sync
    try {
      if (isCurrentlySaved) {
        // Remove it
        await supabase
          .from('event_interactions')
          .delete()
          .eq('user_id', user.id)
          .eq('event_id', eventId)
          .eq('intent', 'SAVED'); 
      } else {
        // Add it
        await supabase
          .from('event_interactions')
          .upsert({ user_id: user.id, event_id: eventId, intent: 'SAVED' });
      }
    } catch (error) {
      console.error("Error syncing save:", error);
    }
  };

  return (
    <SavedEventsContext.Provider value={{ savedEventIds, toggleEvent }}>
      {children}
    </SavedEventsContext.Provider>
  );
};

export const useGlobalSavedEvents = () => useContext(SavedEventsContext);
