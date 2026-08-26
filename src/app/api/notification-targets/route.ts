import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET() {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('notification_targets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`查询失败: ${error.message}`);
  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('notification_targets')
    .insert({
      name: body.name,
      wecom_userid: body.wecom_userid,
    })
    .select()
    .maybeSingle();

  if (error) throw new Error(`插入失败: ${error.message}`);
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const client = getSupabaseClient();
  const { error } = await client.from('notification_targets').delete().eq('id', id);
  if (error) throw new Error(`删除失败: ${error.message}`);
  return NextResponse.json({ success: true });
}
