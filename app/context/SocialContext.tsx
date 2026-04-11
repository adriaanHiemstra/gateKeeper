// Add these to your Context State
const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());

const fetchBlocks = async () => {
  const { data } = await supabase
    .from('blocked_users')
    .select('blocked_id')
    .eq('blocker_id', user.id);
  
  setBlockedIds(new Set(data?.map(r => r.blocked_id) || []));
};

const blockUser = async (targetId: string) => {
  await supabase.from('blocked_users').insert({ blocker_id: user.id, blocked_id: targetId });
  setBlockedIds(prev => new Set(prev).add(targetId));
  // Trigger friendship deletion in background
};
