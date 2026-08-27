import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { users } from "@/storage/database/shared/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "邮箱和密码不能为空" }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 查找用户
    const { data: user, error } = await client
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
    }

    // 验证密码（简单明文对比，生产环境应该用 bcrypt）
    if (user.password !== password) {
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
    }

    // 生成简单的 token（生产环境应该用 JWT）
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString("base64");

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "登录失败" }, { status: 500 });
  }
}
