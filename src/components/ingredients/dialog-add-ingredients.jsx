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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

function DialogAddIngredients({
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
      ?.filter((item) => item.unit_type === "category")
      .map((item) => ({
        label: item.unit_name,
        value: item.unit_value,
      })) ?? []

  const createInitialForm = () => ({
    name: "",
    quantity: "",
    unit: quantityUnitItems[0]?.value ?? "",
    price: "",
    currency: currencyUnitItems[0]?.value ?? "",
    category: categoryItems[0]?.value ?? "",
    memo: "",
    supplier: "",
  })

  const [form, setForm] = React.useState(createInitialForm())

  const handleAddIngredient = async() => {
    try {
      const response = await fetch("/api/ingredients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Failed to add ingredient");
      }

      const data = await response.json();
    } catch (error) {
    } finally {
      setOpen(false);
      setForm(createInitialForm())
      onSuccess?.()
    }
  }

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen)

    if (!isOpen) {
      setForm(createInitialForm())
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>재료 추가</DialogTitle>
          <DialogDescription>
            새로운 재료를 추가합니다.
          </DialogDescription>
        </DialogHeader>
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
              placeholder="재료 이름" />
          </div>
          <hr />
          <div className="flex justify-between items-center">
            <p className="whitespace-nowrap">구매한 양</p>
            <Input
              className="text-end border-0 outline-0 focus-visible:ring-offset-0 focus-visible:ring-0"
              value={form.quantity}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  quantity: e.target.value,
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
              <SelectTrigger className="w-24 shrink-0">
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
              className="text-end flex-1 border-0 outline-0 focus-visible:ring-offset-0 focus-visible:ring-0"
              value={form.price}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  price: e.target.value,
                }))
              }
              placeholder="0" />
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
              <SelectTrigger className="w-24 shrink-0">
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
              value={form.memo}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  memo: e.target.value,
                }))
              }
              placeholder="메모(선택)" />
          </div>
          <hr />
          <div className="flex justify-between items-center">
            <p className="whitespace-nowrap">구매처</p>
            <Input
              className="text-end border-0 outline-0 focus-visible:ring-offset-0 focus-visible:ring-0"
              value={form.supplier}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  supplier: e.target.value,
                }))
              }
              placeholder="구매처(선택)" />
          </div>
        </div>
        <DialogFooter>
            <DialogClose render={<Button variant="outline">닫기</Button>} />
            <Button type="submit" onClick={handleAddIngredient}>
              추가
            </Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { DialogAddIngredients }
