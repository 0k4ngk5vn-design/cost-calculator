'use client'

import * as React from "react"
import { useRouter } from "next/navigation";
import { MoveLeft, Ellipsis, CirclePlus, CircleX } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useUnit } from "@/components/unit-provider";
import { Loading } from "@/components/common/loading";
import { DialogSelectIngredient } from "../dialog-select-ingredient";
import { truncate } from "@/lib/utils";
import { toPng } from "html-to-image"

function MenuDetail({
  className,
  type,
  menuId,
  ...props
}) {
  const captureRef = React.useRef(null)
  const router = useRouter()

  const [form, setForm] = React.useState([])
  const [menuLoading, setMenuLoading] = React.useState(true)
  const [ingredients, setIngredients] = React.useState([])
  const [openSelectIngredient, setOpenSelectIngredient] = React.useState(false)

  const {unit, loading: unitLoading} = useUnit()

  const isLoading = menuLoading || unitLoading

  const quantityUnitItems =
    unit
      ?.filter((item) => item.unit_type === "quantity")
      .map((item) => ({
        label: item.unit_name,
        value: item.unit_value,
      })) ?? []

  const currencyUnitItems =
    unit
      ?.filter((item) => item.unit_type === "currency")
      .map((item) => ({
        label: item.unit_name,
        value: item.unit_value,
      })) ?? []

  const categoryItems =
    unit
      ?.filter((item) => item.unit_type === "category_menu")
      .map((item) => ({
        label: item.unit_name,
        value: item.unit_value,
      })) ?? []

  React.useEffect(() => {
    const getIngredients = async () => {
      try {
        const response = await fetch("/api/ingredients")

        if (!response.ok) {
          throw new Error("Failed to fetch ingredients")
        }

        const data = await response.json()

        setIngredients(data.data)
      } catch (error) {
        setIngredients([])
      } finally {
        setMenuLoading(false)
      }
    }

    const getMenu = async () => {
      setMenuLoading(true)

      try {
        const response = await fetch(`/api/menu/${menuId}`)

        if (!response.ok) {
          throw new Error("Failed to fetch ingredient")
        }

        const data = await response.json()
        setForm({
          ...data.data,
          priceMode: "manual",
        })
        getIngredients()
      } catch (error) {
        setMenuLoading(false)
      }
    }

    getMenu()
      getIngredients()
  }, [menuId])

  const handlePatchData = async () => {
    try {
      const response = await fetch(`/api/menu/${menuId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch ingredient")
      }

      alert('성공하였습니다.')
      window.location.reload()
    } catch (error) {
      alert('실패하였습니다.')
    }
  }

  const handleScreenshot = async () => {
    if (!captureRef.current) return
    setMenuLoading(true)

    const element = captureRef.current

    // 기존 스타일 보관
    const originalBackground = element.style.backgroundColor
    const originalPadding = element.style.padding

    try {
      // 캡처할 때만 적용
      element.style.backgroundColor = "#ffffff"
      element.style.padding = "24px"

      const dataUrl = await toPng(element, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      })

      const link = document.createElement("a")
      link.download = "cost-calculation.png"
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error("Screenshot failed:", error)
    } finally {
      // 원래 스타일 복구
      element.style.backgroundColor = originalBackground
      element.style.padding = originalPadding
      setMenuLoading(false)
    }
  }

  const totalCost = form?.ingredients?.reduce((total, ingredient) => {
    const amount = Number(ingredient.amount) || 0
    const price = Number(ingredient.price) || 0
    const purchaseQuantity = Number(ingredient.purchaseQuantity) || 0

    if (purchaseQuantity <= 0) {
      return total
    }

    const unitCost = price / purchaseQuantity
    const ingredientCost = unitCost * amount

    return total + ingredientCost
  }, 0)

  const productionQuantity = Number(form.amount) || 0

  const currentProductionUnit =
    form.amount_unit || quantityUnitItems[0]?.value || ""

  const productionUnit =
    quantityUnitItems.find(
      (item) => item.value === currentProductionUnit
    )?.label ?? ""

  // 생산 단위당 원가
  const costPerUnit =
    productionQuantity > 0
      ? totalCost / productionQuantity
      : 0

  const sellingPrice = Number(form.price) || 0
  const vatRate = 0.08

  // 전체 판매가격은 VAT 포함 가격
  const priceWithoutVat =
    sellingPrice > 0
      ? sellingPrice / (1 + vatRate)
      : 0

  const vat =
    sellingPrice > 0
      ? sellingPrice - priceWithoutVat
      : 0

  // 전체 원가율
  const costRate =
    priceWithoutVat > 0
      ? (totalCost / priceWithoutVat) * 100
      : 0

  // 생산 단위당 판매가격
  const sellingPricePerUnit =
    productionQuantity > 0
      ? sellingPrice / productionQuantity
      : 0

  // 생산 단위당 공급가
  const priceWithoutVatPerUnit =
    productionQuantity > 0
      ? priceWithoutVat / productionQuantity
      : 0

  // 통화 표시명
  const currencyName =
    currencyUnitItems.find(
      (item) => item.value === form?.currency_unit
    )?.label ?? ""

  // 재료 개수
  const ingredientCount =
    form?.ingredients?.length ?? 0

  // 공급가 기준 원가 제외 금액
  // 인건비/임대료/플랫폼 수수료 등을 제외한 값이므로
  // '순이익'이 아니라 원재료 기준 마진
  const grossMargin =
    priceWithoutVat > 0
      ? priceWithoutVat - totalCost
      : 0

  // 원재료 기준 마진율
  const grossMarginRate =
    priceWithoutVat > 0
      ? (grossMargin / priceWithoutVat) * 100
      : 0

  // 생산 단위당 VAT 제외 판매가격
  const supplyPricePerUnit =
    productionQuantity > 0
      ? priceWithoutVat / productionQuantity
      : 0

  // 생산 단위당 VAT
  const vatPerUnit =
    productionQuantity > 0
      ? vat / productionQuantity
      : 0

  // 생산 단위당 원재료 마진
  const grossMarginPerUnit =
    productionQuantity > 0
      ? grossMargin / productionQuantity
      : 0

  const handleIngredientChange = (ingredientId, key, value) => {
    setForm((prev) => ({
      ...prev,
      ingredients: (prev.ingredients ?? []).map((ingredient) =>
        ingredient.ingredientId === ingredientId
          ? {
              ...ingredient,
              [key]: value,
            }
          : ingredient
      ),
    }))
  }

  const handleIngredientRemove = (ingredientId) => {
    setForm((prev) => ({
      ...prev,
      ingredients: (prev.ingredients ?? []).filter(
        (ingredient) =>
          ingredient.ingredientId !== ingredientId
      ),
    }))
  }

  const handleIngredientsReset = (newIngredients) => {
    setForm((prev) => ({
      ...prev,
      ingredients: newIngredients ?? [],
    }))
  }

  return (
    <>
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70">
            <Loading />
          </div>
        )}
        <section>
          <div className="flex justify-between items-center align-middle mb-5">
            <Button
              variant="link"
              size="icon"
              onClick={() => router.back()}
            >
                <MoveLeft size={20} />
            </Button>
            <span className="text-center font-semibold">{form.name}</span>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="link" size="icon"><Ellipsis size={28} /></Button>} />
              <DropdownMenuContent className="w-40" align="start">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={handleScreenshot}>
                    사진으로 공유
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </section>
        <section ref={captureRef}>
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex flex-col border py-3 px-3 gap-3">
                <div className="flex justify-between items-center">
                  <p className="whitespace-nowrap">이름</p>
                  <Input
                    className="text-end border-0 outline-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                    value={form?.name ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="재료 이름" />
                </div>
                <hr />
                <div className="flex justify-between items-center">
                  <p className="whitespace-nowrap">생산량</p>
                  <Input
                    className="text-end border-0 outline-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                    value={form?.amount ?? "0"}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    placeholder="0" />
                  <Select
                    className="flex-0"
                    items={quantityUnitItems}
                    value={form?.amount_unit ?? ""} onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        amount_unit: value,
                      }))
                    }>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>단위</SelectLabel>
                        {quantityUnitItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <hr />
                <div className="flex justify-between items-center">
                  <p className="whitespace-nowrap">가격</p>
                  <Input
                    className="text-end border-0 outline-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                    value={Number(form?.price ?? 0).toLocaleString()}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        price: Number(e.target.value),
                      }))
                    }
                    placeholder="가격"
                    readOnly />
                  <Select
                    className="flex-0"
                    items={currencyUnitItems}
                    value={form?.currency_unit ?? ""} onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        currency_unit: value,
                      }))
                    }
                    disabled>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>화폐단위</SelectLabel>
                        {currencyUnitItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <hr />
                <div className="flex justify-between items-center">
                  <p className="whitespace-nowrap">카테고리</p>
                  <Select
                    className="flex-0"
                    items={categoryItems}
                    value={form.category ?? ""}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        category: value,
                      }))
                    }>
                    <SelectTrigger className="w-full max-w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>카테고리</SelectLabel>
                        {categoryItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <hr />
                <div className="flex justify-between items-center">
                  <p className="whitespace-nowrap">메모</p>
                  <Input
                    className="text-end border-0 outline-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                    value={form.memo ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        memo: e.target.value,
                      }))
                    }
                    placeholder="메모(선택)" />
                </div>
              </div>
            </div>
            <div>
              <span className="font-semibold">재료</span>
              <div className="flex flex-col border py-3 px-3 gap-3 mt-2">
                <Button variant="outline" disabled={ingredients.length === 0} onClick={() => setOpenSelectIngredient(true)}>
                  <CirclePlus className="inline-start" /> 재료 추가하기
                </Button>
                <hr />
                <div className="flex flex-col gap-2">
                  {
                    form?.ingredients?.length > 0 && (
                      form.ingredients.map((object, index) => {
                        return (
                          <div key={index} className="flex justify-between items-center px-2">
                            <p className="whitespace-nowrap text-sm">{truncate(object.name, 7)}</p>
                            <Input
                              className="text-end border-0 outline-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                              value={object.amount ?? 0}
                              onChange={(e) =>
                                handleIngredientChange(
                                  object.ingredientId,
                                  "amount",
                                  e.target.value
                                )
                              }
                              placeholder="0"/>
                            <Select
                              items={quantityUnitItems}
                              value={object?.amount_unit ?? object?.unitName}
                              onValueChange={(value) =>
                                handleIngredientChange(
                                  object.ingredientId,
                                  "unit",
                                  value
                                )
                              }
                              disabled>
                              <SelectTrigger className="w-16 shrink-0">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>단위</SelectLabel>
                                  {quantityUnitItems.map((item) => (
                                    <SelectItem key={item.value} value={item.value}>
                                      {item.label}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            <Button variant="link" size="icon" onClick={() => handleIngredientRemove(object.ingredientId)}>
                              <CircleX />
                            </Button>
                          </div>
                        )
                      })
                    )
                  }
                </div>
              </div>
            </div>
            <div>
              <span className="font-semibold">판매정보</span>
              <div className="flex flex-col border py-3 px-3 gap-3 mt-2">
                <Tabs
                  className="justify-end"
                  value={form.priceMode ?? "manual"}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      priceMode: value,
                      price: 0
                    }))
                  }>
                  <TabsList className="w-full">
                    <TabsTrigger value="manual">직접 입력</TabsTrigger>
                    <TabsTrigger value="costRate">원가율 기준</TabsTrigger>
                  </TabsList>
                </Tabs>
                <hr />

                {
                  form.priceMode === "manual" && (
                    <>
                      <div className="flex justify-between items-center">
                        <p className="whitespace-nowrap">판매가격</p>
                        <Input
                          className="text-end border-0 outline-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                          value={Number(form?.price ?? 0)}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              price: Number(e.target.value),
                            }))
                          }
                          placeholder="가격"/>
                        <Select
                          className="flex-0"
                          items={currencyUnitItems}
                          value={form?.currency_unit ?? ""} onValueChange={(value) =>
                            setForm((prev) => ({
                              ...prev,
                              currency_unit: value,
                            }))
                          }>
                          <SelectTrigger className="w-24 shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>화폐단위</SelectLabel>
                              {currencyUnitItems.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col px-2 text-sm">
                        <div className="flex justify-between items-center">
                          <p className="whitespace-nowrap">
                            {productionUnit}당 판매가격
                          </p>
                          <Input
                            className="text-sm text-end p-0 border-0 outline-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                            value={
                              sellingPrice > 0 && productionQuantity > 0
                                ? `${Math.round(sellingPricePerUnit).toLocaleString()} 동`
                                : "0 동"
                            }
                            readOnly
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="whitespace-nowrap">공급가</p>
                          <Input
                            className="text-sm text-end p-0 border-0 outline-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                            value={`${Math.round(priceWithoutVat).toLocaleString()} 동`}
                            readOnly
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="whitespace-nowrap">부가세 (8%)</p>
                          <Input
                            className="text-sm text-end p-0 border-0 outline-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                            value={`${Math.round(vat).toLocaleString()} 동`}
                            readOnly />
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="whitespace-nowrap">예상 원가율</p>
                          <Input
                            className="text-sm text-end p-0 border-0 outline-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                            value={
                              sellingPrice > 0
                                ? `${costRate.toFixed(1)} %`
                                : "0 %"
                            }
                            readOnly
                          />
                        </div>
                      </div>
                    </>
                  )
                }

                {
                  form.priceMode === "costRate" && (
                    <>
                      <div className="flex justify-between items-center">
                        <p className="whitespace-nowrap">목표 원가율</p>
                        <div className="flex items-center">
                          <Input
                            className="w-24 text-end border-0 outline-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                            onChange={(e) => {
                              const value = e.target.value
                              const targetCostRate = Number(value) || 0

                              if (totalCost <= 0 || targetCostRate <= 0) {
                                setForm((prev) => ({
                                  ...prev,
                                  price: "",
                                }))
                                return
                              }

                              const vatRate = 0.08
                              const calculatedPriceWithoutVat =
                                totalCost / (targetCostRate / 100)
                              const calculatedVat =
                                calculatedPriceWithoutVat * vatRate
                              const calculatedSellingPrice =
                                Math.round(
                                  (calculatedPriceWithoutVat + calculatedVat) / 1000
                                ) * 1000

                              setForm((prev) => ({
                                ...prev,
                                price: calculatedSellingPrice,
                              }))
                            }}
                            placeholder="30"
                          />
                          <span className="text-sm">%</span>
                        </div>
                      </div>
                      <hr />
                      <div className="flex justify-between items-center">
                        <p className="whitespace-nowrap">전체 판매가격</p>
                        <Input
                          className="text-end border-0 outline-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                          value={`${form.price}`}
                          placeholder="원가율 입력" readOnly />
                        <Select
                          items={currencyUnitItems}
                          value={form.currency_unit ?? ""}
                          onValueChange={(value) =>
                            setForm((prev) => ({
                              ...prev,
                              currency_unit: value,
                            }))
                          }>
                          <SelectTrigger className="w-24 shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>화폐단위</SelectLabel>
                              {currencyUnitItems.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col px-2 text-sm">
                        <div className="flex justify-between items-center">
                          <p className="whitespace-nowrap">
                            {productionUnit}당 판매가격
                          </p>
                          <Input
                            className="text-sm text-end p-0 border-0 outline-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                            value={
                              sellingPrice > 0 && productionQuantity > 0
                                ? `${Math.round(sellingPricePerUnit).toLocaleString()} 동`
                                : "0 동"
                            }
                            readOnly
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="whitespace-nowrap">공급가</p>
                          <Input
                            className="text-sm text-end p-0 border-0 outline-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                            value={`${Math.round(priceWithoutVat).toLocaleString()} 동`}
                            readOnly
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="whitespace-nowrap">부가세 (8%)</p>
                          <Input
                            className="text-sm text-end p-0 border-0 outline-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                            value={`${Math.round(vat).toLocaleString()} 동`}
                            readOnly />
                        </div>
                      </div>
                    </>
                  )
                }
              </div>
            </div>
            <div>
              <span className="font-semibold">원가계산</span>

              <div className="flex flex-col border py-3 px-3 gap-3 mt-2">

                {/* 핵심 원가 */}
                <div className="flex justify-between items-center">
                  <p className="whitespace-nowrap">
                    총 원가
                  </p>

                  <p className="font-semibold text-blue-600">
                    {Math.round(totalCost).toLocaleString()}
                    {currencyName}
                  </p>
                </div>

                <hr />

                <div className="flex justify-between items-center">
                  <p className="whitespace-nowrap">
                    {productionUnit || "Unit"}당 원가
                  </p>

                  <p className="font-semibold text-blue-600">
                    {Math.round(costPerUnit).toLocaleString()}
                    {currencyName}
                  </p>
                </div>

                <hr />

                {/* 판매 / 원가 비교 */}
                <div className="flex flex-col gap-2 px-2 text-sm">

                  <div className="flex justify-between items-center">
                    <p className="text-gray-500">
                      재료 수
                    </p>

                    <p>
                      {ingredientCount}개
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-gray-500">
                      생산량
                    </p>

                    <p>
                      {productionQuantity.toLocaleString()}
                      {productionUnit}
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-gray-500">
                      전체 판매가격
                    </p>

                    <p>
                      {Math.round(sellingPrice).toLocaleString()}
                      {currencyName}
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-gray-500">
                      공급가
                    </p>

                    <p>
                      {Math.round(priceWithoutVat).toLocaleString()}
                      {currencyName}
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-gray-500">
                      VAT
                    </p>

                    <p>
                      {Math.round(vat).toLocaleString()}
                      {currencyName}
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-gray-500">
                      원가율
                    </p>

                    <p
                      className={
                        costRate >= 40
                          ? "font-semibold text-red-600"
                          : costRate >= 30
                            ? "font-semibold text-orange-500"
                            : "font-semibold text-green-600"
                      }
                    >
                      {costRate.toFixed(1)}%
                    </p>
                  </div>

                </div>

                <hr />

                {/* Unit 기준 */}
                <div className="flex flex-col gap-2 px-2 text-sm">

                  <p className="font-medium">
                    {productionUnit || "Unit"} 기준
                  </p>

                  <div className="flex justify-between items-center">
                    <p className="text-gray-500">
                      판매가격
                    </p>

                    <p>
                      {Math.round(
                        sellingPricePerUnit
                      ).toLocaleString()}
                      {currencyName}
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-gray-500">
                      공급가
                    </p>

                    <p>
                      {Math.round(
                        supplyPricePerUnit
                      ).toLocaleString()}
                      {currencyName}
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-gray-500">
                      VAT
                    </p>

                    <p>
                      {Math.round(
                        vatPerUnit
                      ).toLocaleString()}
                      {currencyName}
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-gray-500">
                      원가
                    </p>

                    <p>
                      {Math.round(
                        costPerUnit
                      ).toLocaleString()}
                      {currencyName}
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-gray-500">
                      원재료 마진
                    </p>

                    <p>
                      {Math.round(
                        grossMarginPerUnit
                      ).toLocaleString()}
                      {currencyName}
                    </p>
                  </div>

                </div>

                <hr />

                {/* 마진 */}
                <div className="flex flex-col gap-2 px-2 text-sm">

                  <div className="flex justify-between items-center">
                    <p className="text-gray-500">
                      원재료 마진
                    </p>

                    <p className="font-semibold">
                      {Math.round(
                        grossMargin
                      ).toLocaleString()}
                      {currencyName}
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-gray-500">
                      원재료 마진율
                    </p>

                    <p className="font-semibold">
                      {grossMarginRate.toFixed(1)}%
                    </p>
                  </div>

                </div>

              </div>
            </div>
          </div>
        </section>
        <section>
          <div className="flex justify-end mt-3">
            <Button onClick={handlePatchData}>수정</Button>
          </div>
        </section>
      </div>
      <DialogSelectIngredient ingredients={ingredients} value={form?.ingredients} setValue={handleIngredientsReset} open={openSelectIngredient} setOpen={setOpenSelectIngredient} />
    </>
  );
}

export { MenuDetail }
