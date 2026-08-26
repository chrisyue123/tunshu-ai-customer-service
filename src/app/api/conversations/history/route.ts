import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const is_transferred = searchParams.get('is_transferred');

  const client = getSupabaseClient();
  let query = client
    .from('conversations')
    .select('*');

  if (is_transferred !== null && is_transferred !== undefined) {
    query = query.eq('is_transferred', is_transferred === 'true');
  }

  const { data: conversations, error } = await query
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new Error(`查询失败: ${error.message}`);

  const convIds = (conversations || []).map((c: { id: string }) => c.id);
  let messageCounts: Record<string, number> = {};

  if (convIds.length > 0) {
    const { data: allMessages } = await client
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', convIds);

    if (allMessages) {
      for (const msg of allMessages) {
        const m = msg as { conversation_id: string };
        messageCounts[m.conversation_id] = (messageCounts[m.conversation_id] || 0) + 1;
      }
    }
  }

  const result = (conversations || []).map((conv: { id: string }) => ({
    ...conv,
    message_count: messageCounts[conv.id] || 0,
  }));

  return NextResponse.json(result);
}
