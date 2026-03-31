// app/hooks/useEventFriends.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useEventFriends = (eventId: string) => {
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;

    const fetchFriends = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Call the high-speed SQL function we built in Phase 1
        const { data, error } = await supabase.rpc('get_event_friends', {
          p_event_id: eventId,
          p_user_id: user.id
        });

        if (!error && data) {
          setFriends(data);
        }
      } catch (e) {
        console.log("Error fetching friends:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [eventId]);

  return { friends, loading };
};
