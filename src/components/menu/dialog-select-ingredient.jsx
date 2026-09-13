'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function DialogSelectIngredient({
  className,
  type,
  ingredients,
  open,
  setOpen,
  value,
  setValue,
  ...props
}) {
  // Accordion 기본 펼침
  const accordionValues = React.useMemo(() => {
    return ingredients.map((category) => category.unit_value)
  }, [ingredients])

  // Dialog 내부에서 임시로 관리하는 선택된 ingredient ID
  const [selectedIngredients, setSelectedIngredients] =
    React.useState([])

  React.useEffect(() => {
    const initialize = () => {
      setSelectedIngredients(
        (value ?? []).map((item) => item.ingredientId)
      )
    }

    initialize()
  }, [value])

  /*
   * 재료 선택 / 선택 해제
   */
  const handleSelectIngredient = (id) => {
    setSelectedIngredients((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id)
      }

      return [...prev, id]
    })
  }

  /*
   * 선택 내용 적용
   *
   * 기존 value에 존재하던 재료:
   * → 기존 객체 그대로 사용
   * → amount 등 사용자가 수정했던 값 유지
   *
   * 새로 선택된 재료:
   * → ingredients 데이터로 새로운 객체 생성
   */
  const handleApplyIngredients = () => {
    const allIngredients = ingredients.flatMap(
      (category) => category.ingredients ?? []
    )

    const nextValue = selectedIngredients
      .map((id) => {
        /*
         * 기존에 이미 메뉴에 들어있던 재료
         */
        const existingItem = (value ?? []).find(
          (item) => item.ingredientId === id
        )

        if (existingItem) {
          return existingItem
        }

        /*
         * 새로 선택한 재료
         */
        const ingredient = allIngredients.find(
          (item) => item.id === id
        )

        if (!ingredient) return null

        return {
          ingredientId: ingredient.id,
          name: ingredient.name,

          // 메뉴에서 실제 사용할 양
          amount: "",

          // 사용 단위
          unit:
            ingredient.quantity_unit_data?.unit_value ?? "",

          unitName:
            ingredient.quantity_unit_data?.unit_name ?? "",

          // 구매 가격
          price:
            ingredient.price ?? 0,

          // 구매 수량
          purchaseQuantity:
            ingredient.quantity ?? 0,

          // 화폐
          currency:
            ingredient.currency_unit_data?.unit_value ?? "",

          currencyName:
            ingredient.currency_unit_data?.unit_name ?? "",
        }
      })
      .filter(Boolean)

    setValue(nextValue)

    setSelectedIngredients([])
    setOpen(false)
  }

  /*
   * Dialog 닫기
   *
   * 적용하지 않고 닫을 경우
   * selectedIngredients만 초기화
   * 부모 value는 건드리지 않음
   */
  const handleClose = () => {
    setOpen(false)
  }

  /*
   * ESC / 바깥 클릭 등으로 Dialog가 닫히는 경우
   */
  const handleOpenChange = (nextOpen) => {

    setOpen(nextOpen)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent
        className={className}
        {...props}
      >
        <DialogHeader>
          <DialogTitle>
            재료 선택
          </DialogTitle>

          <DialogDescription>
            메뉴에 사용할 재료를 선택합니다.
          </DialogDescription>
        </DialogHeader>

        {ingredients.length > 0 ? (
          <>
            <div className="max-h-72 overflow-y-auto pr-1 md:max-h-200">
              <Accordion
                multiple
                defaultValue={accordionValues}
              >
                {ingredients.map((category) => {
                  /*
                   * 카테고리에서 현재 선택된 재료 개수
                   */
                  const selectedCount =
                    category.ingredients.filter(
                      (ingredient) =>
                        selectedIngredients.includes(
                          ingredient.id
                        )
                    ).length

                  return (
                    <AccordionItem
                      key={category.unit_value}
                      value={category.unit_value}
                    >
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <span>
                            {category.unit_name}
                          </span>

                          <span className="text-xs text-gray-400">
                            {selectedCount}/
                            {category.ingredients.length}
                          </span>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent>
                        <div className="flex flex-col gap-2">
                          {category.ingredients.map(
                            (ingredient) => {
                              const selected =
                                selectedIngredients.includes(
                                  ingredient.id
                                )

                              const unitPrice =
                                ingredient.quantity > 0
                                  ? ingredient.price /
                                    ingredient.quantity
                                  : 0

                              return (
                                <button
                                  key={ingredient.id}
                                  type="button"
                                  onClick={() =>
                                    handleSelectIngredient(
                                      ingredient.id
                                    )
                                  }
                                  className={`
                                    flex w-full
                                    items-center
                                    justify-between
                                    rounded-md
                                    border
                                    px-3
                                    py-3
                                    text-left
                                    transition-colors

                                    ${
                                      selected
                                        ? "border-blue-500 bg-blue-50"
                                        : "hover:bg-gray-50"
                                    }
                                  `}
                                >
                                  <div className="flex items-center gap-3">
                                    <Checkbox
                                      checked={selected}
                                      onCheckedChange={() =>
                                        handleSelectIngredient(
                                          ingredient.id
                                        )
                                      }
                                      onClick={(e) =>
                                        e.stopPropagation()
                                      }
                                    />

                                    <div className="flex flex-col">
                                      <span className="text-sm font-medium">
                                        {ingredient.name}
                                      </span>

                                      {ingredient.memo && (
                                        <span className="text-xs text-gray-400">
                                          {
                                            ingredient.memo
                                          }
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-end">
                                    <span className="text-xs text-gray-400">
                                      {ingredient.price?.toLocaleString()}

                                      {
                                        ingredient
                                          .currency_unit_data
                                          ?.unit_name
                                      }

                                      {" / "}

                                      {ingredient.quantity}

                                      {
                                        ingredient
                                          .quantity_unit_data
                                          ?.unit_name
                                      }
                                    </span>

                                    <span className="text-xs text-blue-600">
                                      {unitPrice.toLocaleString()}

                                      {
                                        ingredient
                                          .currency_unit_data
                                          ?.unit_name
                                      }

                                      {" / "}

                                      {
                                        ingredient
                                          .quantity_unit_data
                                          ?.unit_name
                                      }
                                    </span>
                                  </div>
                                </button>
                              )
                            }
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </div>

            {/* 선택된 재료 */}
            {selectedIngredients.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs text-gray-500">
                  선택된 재료{" "}
                  {selectedIngredients.length}개
                </p>

                <div className="flex flex-wrap gap-2">
                  {selectedIngredients.map((id) => {
                    const ingredient =
                      ingredients
                        .flatMap(
                          (category) =>
                            category.ingredients ?? []
                        )
                        .find(
                          (ingredient) =>
                            ingredient.id === id
                        )

                    if (!ingredient) {
                      return null
                    }

                    return (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="gap-1"
                      >
                        {ingredient.name}

                        <button
                          type="button"
                          onClick={() =>
                            handleSelectIngredient(id)
                          }
                          className="ml-1 cursor-pointer"
                        >
                          ×
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-center">
            데이터가 존재하지 않습니다
          </p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
          >
            닫기
          </Button>

          <Button
            onClick={handleApplyIngredients}
          >
            적용
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { DialogSelectIngredient }