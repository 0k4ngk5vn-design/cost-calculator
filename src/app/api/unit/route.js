import { errorStatus, publicError } from "@/lib/security/request.mjs";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/session";

export async function GET() {
  try {
    await requireAuth();

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("unit")
      .select("unit_type, unit_name, unit_value");

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
