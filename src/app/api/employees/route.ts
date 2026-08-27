import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

// GET: 获取员工列表
export async function GET() {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from("users")
      .select("id, email, name, role, is_active, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Get employees error:", error);
    return NextResponse.json({ error: "获取员工列表失败" }, { status: 500 });
  }
}

// POST: 创建员工
export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "邮箱、密码和姓名不能为空" }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 检查邮箱是否已存在
    const { data: existing } = await client
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "邮箱已存在" }, { status: 400 });
    }

    const { data, error } = await client
      .from("users")
      .insert({ email, password, name, role: role || "employee" })
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Create employee error:", error);
    return NextResponse.json({ error: "创建员工失败" }, { status: 500 });
  }
}
