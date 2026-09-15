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
      .from("menus")
      .select(
        `
          id,
          name,
          amount,
          price,
          memo,
          recipe,

          amount_unit:unit!menus_amount_unit_fkey (
            unit_value
          ),

          currency_unit:unit!menus_currency_unit_fkey (
            unit_value
          ),

          category:unit!menus_category_fkey (
            unit_value
          ),

          ingredients:menu_ingredients (
            id,
            amount,

            amount_unit:unit!menu_ingredients_amount_unit_fkey (
              unit_value
            ),

            ingredient:ingredients!menu_ingredients_ingredient_id_fkey (
              id,
              name,
              quantity,
              price,

              quantity_unit:unit!ingredients_quantity_unit_fkey (
                unit_value
              ),

              currency_unit:unit!ingredients_currency_unit_fkey (
                unit_value
              )
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

      amount_unit: data.amount_unit?.unit_value ?? null,
      currency_unit: data.currency_unit?.unit_value ?? null,
      category: data.category?.unit_value ?? null,

      ingredients:
        data.ingredients?.map((item) => ({
          ingredientId: item.ingredient?.id ?? null,
          name: item.ingredient?.name ?? "",

          amount: item.amount,
          amount_unit: item.amount_unit?.unit_value ?? null,

          purchaseQuantity: item.ingredient?.quantity ?? null,
          quantity_unit: item.ingredient?.quantity_unit?.unit_value ?? null,
          price: item.ingredient?.price ?? null,
          currency_unit: item.ingredient?.currency_unit?.unit_value ?? null,
        })) ?? [],
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
    const body = validateBody(await readJson(request), "menu", true);

    const supabase = createAdminClient();

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
    if (body.ingredients.some((item) => !getUnitId("quantity", item.amount_unit || item.unit))) {
      return NextResponse.json(
        { success: false, message: "재료의 단위를 찾을 수 없습니다." },
        { status: 400 },
      );
    }

    // 2. 메뉴에 필요한 FK
    const amountUnitId = getUnitId("quantity", body.amount_unit);
    const currencyUnitId = getUnitId("currency", body.currency_unit);
    const categoryUnitId = getUnitId("category_menu", body.category);

    if (!amountUnitId || !currencyUnitId || !categoryUnitId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid unit, currency or category",
        },
        { status: 400 },
      );
    }

    const menusId = id === body.id ? id : "";
    if (!menusId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid unit, currency or category",
        },
        { status: 400 },
      );
    }

    const { data: menuData, error: menuError } = await supabase
      .from("menus")
      .update({
        name: body.name,
        amount: body.amount,
        price: body.price,
        memo: body.memo ?? null,
        recipe: body.recipe ?? null,
        amount_unit: amountUnitId,
        currency_unit: currencyUnitId,
        category: categoryUnitId,
      })
      .eq("id", menusId)
      .select()
      .single();

    if (menuError) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed",
          error: "요청 처리 중 오류가 발생했습니다.",
        },
        { status: 500 },
      );
    }

    const { data: deleteData, error: deleteError } = await supabase
      .from("menu_ingredients")
      .delete()
      .eq("menu_id", menusId);

    if (deleteError) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed",
          error: "요청 처리 중 오류가 발생했습니다.",
        },
        { status: 500 },
      );
    }

    const menuIngredients = body?.ingredients?.map((ingredient) => ({
      menu_id: menusId,
      ingredient_id: ingredient.ingredientId,
      amount: Number(ingredient.amount),
      amount_unit: getUnitId(
        "quantity",
        ingredient?.amount_unit || ingredient?.unit,
      ),
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
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: "Exception occurred",
        error: publicError(err),
      },
      { status: errorStatus(err) },
    );
  }
}
