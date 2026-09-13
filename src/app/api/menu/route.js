import { requireAuth } from "@/lib/auth/session";
import { errorStatus, publicError, readJson, validateBody } from "@/lib/security/request.mjs";
import { NextResponse } from "next/server";
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

          menus:menus!menus_category_fkey (
            id,
            name,
            amount,
            price,
            memo,

            amount_unit_data:unit!menus_amount_unit_fkey (
              id,
              unit_name,
              unit_value
            ),

            currency_unit_data:unit!menus_currency_unit_fkey (
              id,
              unit_name,
              unit_value
            ),

            category_data:unit!menus_category_fkey (
              id,
              unit_name,
              unit_value
            )
          )
        `,
      )
      .eq("unit_type", "category_menu")
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

    console.log(data);

    return NextResponse.json({
      success: true,
      message: "Success",
      data,
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

export async function POST(request) {
  try {
    await requireAuth();
    const supabase = createAdminClient();
    const body = validateBody(await readJson(request), "menu");

    const { name, amount, unit, price, currency, category, memo, ingredients } =
      body;

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "재료가 빈 배열입니다.",
        },
        { status: 400 },
      );
    }

    // 1. 필요한 unit 데이터 한 번에 조회
    const { data: units, error: unitError } = await supabase
      .from("unit")
      .select("id, unit_type, unit_value");

    if (unitError) {
      return NextResponse.json(
        {
          success: false,
          message: "단위 정보를 불러오지 못했습니다.",
          error: "요청 처리 중 오류가 발생했습니다.",
        },
        { status: 500 },
      );
    }

    // 빠른 검색용 Map 생성
    const unitMap = new Map(
      units.map((item) => [`${item.unit_type}:${item.unit_value}`, item.id]),
    );

    const getUnitId = (type, value) => unitMap.get(`${type}:${value}`) ?? null;

    // Reject unknown ingredient units before any database mutation.
    if (ingredients.some((item) => !getUnitId("quantity", item.amount_unit))) {
      return NextResponse.json(
        { success: false, message: "재료의 단위를 찾을 수 없습니다." },
        { status: 400 },
      );
    }

    // 2. 메뉴에 필요한 FK
    const amountUnitId = getUnitId("quantity", unit);
    const currencyUnitId = getUnitId("currency", currency);
    const categoryUnitId = getUnitId("category", category);

    if (!amountUnitId || !currencyUnitId || !categoryUnitId) {
      return NextResponse.json(
        {
          success: false,
          message: "단위 또는 카테고리를 찾을 수 없습니다.",
        },
        { status: 400 },
      );
    }

    // 3. 메뉴 생성
    const { data: menu, error: menuError } = await supabase
      .from("menus")
      .insert({
        name,
        amount: Number(amount),
        amount_unit: amountUnitId,
        price: Number(price),
        currency_unit: currencyUnitId,
        category: categoryUnitId,
        memo: memo || null,
      })
      .select("id")
      .single();

    if (menuError) {
      return NextResponse.json(
        {
          success: false,
          message: "메뉴 등록에 실패했습니다.",
          error: "요청 처리 중 오류가 발생했습니다.",
        },
        { status: 500 },
      );
    }

    // 4. menu_ingredients 데이터 생성
    const menuIngredients = ingredients.map((ingredient) => ({
      menu_id: menu.id,
      ingredient_id: ingredient.ingredient_id,
      amount: Number(ingredient.amount),
      amount_unit: getUnitId("quantity", ingredient.amount_unit),
    }));

    // 잘못된 단위가 있는지 INSERT 전에 확인
    const invalidUnit = menuIngredients.some(
      (ingredient) => !ingredient.amount_unit,
    );

    if (invalidUnit) {
      return NextResponse.json(
        {
          success: false,
          message: "재료의 단위를 찾을 수 없습니다.",
        },
        { status: 400 },
      );
    }

    // 5. 재료 일괄 INSERT
    const { error: ingredientError } = await supabase
      .from("menu_ingredients")
      .insert(menuIngredients);

    if (ingredientError) {
      return NextResponse.json(
        {
          success: false,
          message: "메뉴 재료 등록에 실패했습니다.",
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
