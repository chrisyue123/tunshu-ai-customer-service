import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET() {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('agent_config')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`查询失败: ${error.message}`);
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const client = getSupabaseClient();

  const { data: existing } = await client
    .from('agent_config')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { data, error } = await client
      .from('agent_config')
      .update({
        name: body.name,
        system_prompt: body.system_prompt,
        tone: body.tone,
        is_active: body.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .maybeSingle();

    if (error) throw new Error(`更新失败: ${error.message}`);
    return NextResponse.json(data);
  } else {
    const { data, error } = await client
      .from('agent_config')
      .insert({
        name: body.name,
        system_prompt: body.system_prompt,
        tone: body.tone,
        is_active: body.is_active ?? true,
      })
      .select()
      .maybeSingle();

    if (error) throw new Error(`插入失败: ${error.message}`);
    return NextResponse.json(data);
  }
}
