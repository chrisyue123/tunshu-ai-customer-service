import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversation_id');
  if (!conversationId) return NextResponse.json({ error: 'Missing conversation_id' }, { status: 400 });

  const client = getSupabaseClient();
  const { data, error } = await client
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`查询失败: ${error.message}`);
  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('messages')
    .insert({
      conversation_id: body.conversation_id,
      role: body.role,
      content: body.content,
      is_manual: body.is_manual || false,
    })
    .select()
    .maybeSingle();

  if (error) throw new Error(`插入失败: ${error.message}`);
  return NextResponse.json(data);
}
