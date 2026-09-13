import { errorStatus, publicError, readJson, validateBody } from "@/lib/security/request.mjs";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request) {
  try {
    await requireAuth();

    const supabase = createAdminClient();

    const body = validateBody(await readJson(request), "category");

    const { category_name, category_value, unit_type } = body;

    const { data, error } = await supabase
      .from("unit")
      .insert({
        unit_name: category_name,
        unit_value: category_value,
        unit_type: unit_type,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed",
          error: "요청 처리 중 오류가 발생했습니다.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Success",
      data: data,
    });
  } catch (error) {
    console.error("Supabase connection error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Exception occurred",
        error: publicError(error),
      },
      { status: errorStatus(error) },
    );
  }
}
