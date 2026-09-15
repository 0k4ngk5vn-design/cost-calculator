import * as React from "react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, CircleX } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

import { truncate } from "@/lib/utils"
import { DialogSelectIngredient } from "./dialog-select-ingredient"

function DialogAddMenu({
  className,
  type,
  unit,
  open,
  setOpen,
  onSuccess,
  ...props
}) {
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

  const createInitialForm = () => ({
    name: "",
    amount: "",
    quantity: "",
    unit: quantityUnitItems[0]?.value || "",
    price: "",
    currency: currencyUnitItems[0]?.value || "",
    priceMode: "manual",
    category: categoryItems[0]?.value || "",
    memo: "",
  })

  const [loading, setLoading] = React.useState(true)
  const [ingredients, setIngredients] = React.useState([])
  React.useEffect(() => {
    if(!open) return

    const getIngredients = async () => {
      try {
        const response = await fetch("/api/ingredients")

        if (!response.ok) {
        alert('실패하였습니다.\n\n잠시 후 다시 시도하세요.')
        }

        const data = await response.json()

        setIngredients(data.data)
      } catch (error) {
        setIngredients([])
      } finally {
        setLoading(false)
      }
    }

    getIngredients()
  }, [open])

  const [form, setForm] = React.useState(createInitialForm())
  const [dialogAddIngredient, setDialogAddIngredient] = React.useState(false)
  const [addIngredientInitial, setAddIngredientInitial] = React.useState([])

  const handleAddMenu = async() => {
    const ingredients = addIngredientInitial.map((object) => ({
      ingredient_id: object.ingredientId,
      amount: Number(object.amount),
      amount_unit: object.unit,
    }))

    const requestBody = {
      name: form.name,
      amount: form.amount,
      unit: form.unit,
      price: form.price,
      currency: form.currency,
      category: form.category,
      memo: form.memo || "",
      ingredients
    }

    try {
      const response = await fetch("/api/menu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        alert('실패하였습니다.\n\n잠시 후 다시 시도하세요.')
      }

      const data = await response.json();

      alert('성공하였습니다.')
      setOpen(false);
      setForm(createInitialForm())
      onSuccess?.()
    } catch (error) {
      alert('실패하였습니다.\n\n잠시 후 다시 시도하세요.')
    }
  }

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen)

    if (!isOpen) {
      setForm(createInitialForm())
      setAddIngredientInitial([])
      setDialogAddIngredient(false)
    }
  }

  const handleIngredientRemove = (ingredientId) => {
    setAddIngredientInitial((prev) =>
      prev.filter(
        (item) => item.ingredientId !== ingredientId
      )
    )
  }

  const handleIngredientChange = (ingredientId, key, value) => {
    setAddIngredientInitial((prev) =>
      prev.map((item) =>
        item.ingredientId === ingredientId
          ? {
              ...item,
              [key]: value,
            }
          : item
      )
    )
  }

  const totalCost = addIngredientInitial.reduce((total, ingredient) => {
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
    form.unit || quantityUnitItems[0]?.value || ""

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

  return (
    <>
      <AlertDialog
        open={open}
        onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>메뉴 추가</AlertDialogTitle>
            <AlertDialogDescription>
              새로운 메뉴를 추가합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-96 overflow-y-auto pr-1 md:max-h-200 text-sm">
            <div className="flex flex-col border py-3 px-3 gap-3">
              <div className="flex justify-between items-center">
                <p className="whitespace-nowrap">이름</p>
                <Input
                  className="text-end border-0 outline-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="메뉴 이름" />
              </div>
              <hr />
              <div className="flex justify-between items-center">
                <p className="whitespace-nowrap">생산량</p>
                <Input
                  className="text-end border-0 outline-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  placeholder="0" />
                <Select
                  items={quantityUnitItems}
                  defaultValue={quantityUnitItems[0]?.value}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      unit: value,
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
                <p className="whitespace-nowrap">카테고리</p>
                <Select
                  items={categoryItems}
                  defaultValue={categoryItems[0]?.value}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      category: value,
                    }))
                  }>
                  <SelectTrigger className="w-36">
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
                <p className="whitespace-nowrap">재료</p>
                <Button variant="outline" size="icon" onClick={() => setDialogAddIngredient(true)} disabled={loading}>
                  {
                    loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-black" /> : <Plus data-icon="inline-start" />
                  }
                </Button>
              </div>
              {
                addIngredientInitial?.map((object, index) => {
                  return (
                    <div key={index} className="flex justify-between items-center px-2">
                      <p className="whitespace-nowrap text-sm">{truncate(object.name, 7)}</p>
                      <Input
                        className="text-end border-0 outline-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                        value={object.amount ?? ""}
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
                        value={object.unit ?? ""}
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
              }
              <hr />
              <div className="flex justify-between items-center">
                <p className="whitespace-nowrap">예상 원가</p>
                <div>
                  <p className="whitespace-nowrap text-end text-lg text-blue-600">{Math.round(totalCost).toLocaleString()} 동</p>
                  {productionQuantity > 0 && (
                    <p className="text-xs text-gray-500">
                      {productionQuantity.toLocaleString()}
                      {productionUnit} 생산 ·{" "}
                      {Math.round(costPerUnit).toLocaleString()} 동 / {productionUnit}
                    </p>
                  )}
                </div>
              </div>
              <hr />
              <div className="flex justify-between items-center">
                <p className="whitespace-nowrap">예상 판매가</p>
                <Tabs
                  value={form.priceMode}
                  onValueChange={(value) =>

                    setForm((prev) => ({
                      ...prev,
                      priceMode: value,
                      price: ""
                    }))
                  }>
                  <TabsList>
                    <TabsTrigger value="manual">직접 입력</TabsTrigger>
                    <TabsTrigger value="costRate">원가율 기준</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <hr />
              {form.priceMode === "manual" && (
                <>
                  <div className="flex justify-between items-center">
                    <p className="whitespace-nowrap">전체 판매가격</p>
                    <Input
                      className="text-end border-0 outline-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                      value={`${form.price}`}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          price: Math.round(e.target.value),
                        }))
                      }
                      placeholder="판매 가격" />
                    <Select
                      items={currencyUnitItems}
                      defaultValue={currencyUnitItems[0]?.value}
                      onValueChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          currency: value,
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
              )}

              {form.priceMode === "costRate" && (
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
                      defaultValue={currencyUnitItems[0]?.value}
                      onValueChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          currency: value,
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
              )}
              <div>
                <small className="text-gray-400">· 판매가격은 전체 생산량 기준으로 입력하세요.</small> <br />
                <small className="text-gray-400">· 또한 부가세 포함된 금액을 입력하세요.</small>
              </div>
              <hr />
              <div className="flex justify-between items-center">
                <p className="whitespace-nowrap">메모</p>
                <Input
                  className="text-end border-0 outline-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                  value={form.memo}
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
          <AlertDialogFooter>
            <AlertDialogCancel>닫기</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddMenu}>저장</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <DialogSelectIngredient ingredients={ingredients} open={dialogAddIngredient} setOpen={setDialogAddIngredient} value={addIngredientInitial} setValue={setAddIngredientInitial} />
    </>
  );
}

export { DialogAddMenu }