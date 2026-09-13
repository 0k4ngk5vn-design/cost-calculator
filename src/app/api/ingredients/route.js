import { errorStatus, publicError, readJson, validateBody } from "@/lib/security/request.mjs";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    await requireAuth();

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("unit")
      .select(
        `
          unit_type,
          unit_name,
          unit_value,

          ingredients:ingredients!ingredients_category_fkey (
            id,
            name,
            quantity,
            price,
            memo,
            supplier,

            quantity_unit_data:unit!ingredients_quantity_unit_fkey (
              id,
              unit_name,
              unit_value
            ),

            currency_unit_data:unit!ingredients_currency_unit_fkey (
              id,
              unit_name,
              unit_value
            ),

            category_data:unit!ingredients_category_fkey (
              id,
              unit_name,
              unit_value
            )
          )
        `,
      )
      .eq("unit_type", "category")
      .order("unit_name", { ascending: true });

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
      data,
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

export async function POST(request) {
  try {
    await requireAuth();

    const supabase = createAdminClient();
    const body = validateBody(await readJson(request), "ingredients");

    const { name, quantity, unit, price, currency, category, memo, supplier } =
      body;

    // 1. 단위검색
    const getUnitId = async (type, value) => {
      const { data, error } = await supabase
        .from("unit")
        .select("id")
        .eq("unit_type", type)
        .eq("unit_value", value)
        .single();

      if (error || !data) {
        return null;
      }

      return data.id;
    };

    const [quantityUnitId, currencyUnitId, categoryUnitId] = await Promise.all([
      getUnitId("quantity", unit),
      getUnitId("currency", currency),
      getUnitId("category", category),
    ]);

    if (!quantityUnitId || !currencyUnitId || !categoryUnitId) {
      return Response.json(
        {
          success: false,
          message: "단위 또는 카테고리를 찾을 수 없습니다.",
        },
        { status: 400 },
      );
    }

    // 2. 데이터 조합
    const { data, error } = await supabase
      .from("ingredients")
      .insert({
        name: name,
        quantity: Number(quantity),
        quantity_unit: quantityUnitId,
        price: Number(price),
        currency_unit: currencyUnitId,
        category: categoryUnitId,
        memo: memo || null,
        supplier: supplier || null,
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
