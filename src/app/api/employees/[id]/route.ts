import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

// PUT: 更新员工
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { email, password, name, role, is_active } = await request.json();

    const client = getSupabaseClient();

    const updateData: any = { email, name, role, is_active };
    if (password) {
      updateData.password = password;
    }

    const { data, error } = await client
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Update employee error:", error);
    return NextResponse.json({ error: "更新员工失败" }, { status: 500 });
  }
}

// DELETE: 删除员工
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const client = getSupabaseClient();

    const { error } = await client.from("users").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete employee error:", error);
    return NextResponse.json({ error: "删除员工失败" }, { status: 500 });
  }
}
