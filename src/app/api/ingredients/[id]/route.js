import { errorStatus, publicError, readJson, validateBody, validateId } from "@/lib/security/request.mjs";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request, { params }) {
  let { id } = await params;

  try {
    await requireAuth();
    validateId(id);

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("ingredients")
      .select(
        `
          name,
          quantity,
          price,
          memo,
          supplier,

          unit:unit!ingredients_quantity_unit_fkey (
            unit_value
          ),

          currency:unit!ingredients_currency_unit_fkey (
            unit_value
          ),

          category:unit!ingredients_category_fkey (
            unit_value
          ),

          menus:menu_ingredients (
            amount,
            amount_unit:unit(
              unit_value
            ),
            menu:menus (
              id,
              name
            )
          )
        `,
      )
      .eq("id", id)
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

    const result = {
      ...data,
      unit: data.unit?.unit_value ?? null,
      currency: data.currency?.unit_value ?? null,
      category: data.category?.unit_value ?? null,
    };

    return NextResponse.json({
      success: true,
      message: "Success",
      data: result,
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

export async function PATCH(request, { params }) {
  const { id } = await params;

  try {
    await requireAuth();
    validateId(id);
    const body = validateBody(await readJson(request), "ingredients", true);

    const supabase = createAdminClient();

    const { data: unitData, error: unitError } = await supabase
      .from("unit")
      .select("id, unit_value")
      .in("unit_value", [body.unit, body.currency, body.category]);

    if (unitError) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to get unit data",
          error: "요청 처리 중 오류가 발생했습니다.",
        },
        { status: 500 },
      );
    }

    const unit = unitData.find((item) => item.unit_value === body.unit);

    const currency = unitData.find((item) => item.unit_value === body.currency);

    const category = unitData.find((item) => item.unit_value === body.category);

    if (!unit || !currency || !category) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid unit, currency or category",
        },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("ingredients")
      .update({
        name: body.name,
        quantity: body.quantity,
        price: body.price,
        memo: body.memo ?? null,
        supplier: body.supplier ?? null,
        quantity_unit: unit.id,
        currency_unit: currency.id,
        category: category.id,
      })
      .eq("id", id)
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
      data: {},
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
