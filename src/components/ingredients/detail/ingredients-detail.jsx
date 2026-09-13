'use client'

import * as React from "react"
import { useRouter } from "next/navigation";
import { MoveLeft, Ellipsis } from "lucide-react"
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
import { useUnit } from "@/components/unit-provider";
import { Loading } from "@/components/common/loading";

function IngredientsDetail({
  className,
  type,
  ingredientId,
  ...props
}) {

  const router = useRouter()
  const [form, setForm] = React.useState({})
  const [ingredientLoading, setIngredientLoading] = React.useState(true)

  const { unit, loading: unitLoading } = useUnit()

  const isLoading = ingredientLoading || unitLoading

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

  React.useEffect(() => {
    const getIngredient = async () => {
      setIngredientLoading(true)

      try {
        const response = await fetch(`/api/ingredients/${ingredientId}`)

        if (!response.ok) {
          throw new Error("Failed to fetch ingredient")
        }

        const data = await response.json()
        setForm(data.data)
      } catch (error) {
        console.error(error)
      } finally {
        setIngredientLoading(false)
      }
    }

    getIngredient()
  }, [ingredientId])

  const handlePatchData = async () => {
    try {
      const response = await fetch(`/api/ingredients/${ingredientId}`, {
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

  return (
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
            
          </DropdownMenu>
        </div>
      </section>
      <section>
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
                <p className="whitespace-nowrap">구매한 양</p>
                <Input
                  className="text-end border-0 outline-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                  value={form?.quantity ?? "0"}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      quantity: e.target.value,
                    }))
                  }
                  placeholder="0" />
                <Select
                  className="flex-0"
                  items={quantityUnitItems}
                  value={form?.unit ?? ""} onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      unit: value,
                    }))
                  }>
                  <SelectTrigger className="w-full max-w-48">
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
                  value={form?.price ?? "0"}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                  placeholder="0" />
                <Select
                  className="flex-0"
                  items={currencyUnitItems}
                  value={form.currency ?? ""}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      currency: value,
                    }))
                  }>
                  <SelectTrigger className="w-full max-w-48">
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
              <hr />
              <div className="flex justify-between items-center">
                <p className="whitespace-nowrap">구매처</p>
                <Input
                  className="text-end border-0 outline-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                  value={form.supplier ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      supplier: e.target.value,
                    }))
                  }
                  placeholder="구매처(선택)" />
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <Button onClick={handlePatchData}>수정</Button>
            </div>
          </div>
          <div>
            <span className="font-semibold">단가</span>
            <div className="border py-3 px-3 mt-2 text-end">
              <span className="text-md text-blue-600">
                {form?.price != null && form?.quantity > 0
                  ? `${(form.price / form.quantity).toLocaleString()}${
                      currencyUnitItems?.find(
                        (item) => item.value === (form?.currency ?? "")
                      )?.label ?? ""
                    } / ${
                      quantityUnitItems?.find(
                        (item) => item.value === (form?.unit ?? "")
                      )?.label ?? ""
                    }`
                  : ""}
                </span>
            </div>
          </div>
          <div>
            <span className="font-semibold">적용 레시피 ()</span>
            <div className="border py-3 px-3 mt-2 text-end">
              <span className="text-md text-blue-600">
                {form?.price != null && form?.quantity > 0
                  ? `${(form.price / form.quantity).toLocaleString()}${
                      currencyUnitItems?.find(
                        (item) => item.value === (form?.currency ?? "")
                      )?.label ?? ""
                    } / ${
                      quantityUnitItems?.find(
                        (item) => item.value === (form?.unit ?? "")
                      )?.label ?? ""
                    }`
                  : ""}
                </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export { IngredientsDetail }
