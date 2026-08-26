import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const is_transferred = searchParams.get('is_transferred');

  const client = getSupabaseClient();
  let query = client.from('conversations').select('*');

  if (status) {
    query = query.eq('status', status);
  }
  if (is_transferred !== null && is_transferred !== undefined) {
    query = query.eq('is_transferred', is_transferred === 'true');
  }

  const { data, error } = await query.order('created_at', { ascending: false }).limit(50);
  if (error) throw new Error(`查询失败: ${error.message}`);
  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('conversations')
    .insert({
      customer_id: body.customer_id,
      customer_name: body.customer_name || '',
      status: body.status || 'active',
      is_transferred: body.is_transferred || false,
    })
    .select()
    .maybeSingle();

  if (error) throw new Error(`插入失败: ${error.message}`);
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const client = getSupabaseClient();

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status !== undefined) updateData.status = body.status;
  if (body.is_transferred !== undefined) updateData.is_transferred = body.is_transferred;
  if (body.transferred_to !== undefined) updateData.transferred_to = body.transferred_to;

  const { data, error } = await client
    .from('conversations')
    .update(updateData)
    .eq('id', body.id)
    .select()
    .maybeSingle();

  if (error) throw new Error(`更新失败: ${error.message}`);
  return NextResponse.json(data);
}
