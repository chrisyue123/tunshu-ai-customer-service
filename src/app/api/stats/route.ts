import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET() {
  const client = getSupabaseClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  const { count: todayCount } = await client
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStr);

  const { count: aiResolved } = await client
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStr)
    .eq('is_transferred', false);

  const { count: transferred } = await client
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStr)
    .eq('is_transferred', true);

  const { count: active } = await client
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { data: recentConversations } = await client
    .from('conversations')
    .select('id, customer_name, status, is_transferred, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  return NextResponse.json({
    todayConversations: todayCount || 0,
    aiResolved: aiResolved || 0,
    transferredToHuman: transferred || 0,
    activeConversations: active || 0,
    recentConversations: recentConversations || [],
  });
}
