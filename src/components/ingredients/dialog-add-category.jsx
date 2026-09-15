import * as React from "react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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

function DialogAddCategory({
  className,
  type,
  open,
  setOpen,
  onSuccess,
  ...props
}) {

  const createInitialForm = () => ({
    category_name: "",
    category_value: "",
    unit_type: "category"
  })

  const [form, setForm] = React.useState(createInitialForm())

  const handleAddCategory = async () => {
    try {
      const response = await fetch("/api/category", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        alert('실패하였습니다.\n\n잠시 후 다시 시도하세요.')
      }

      const data = await response.json();
    } catch (error) {
    } finally {
      setOpen(false)
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
          <DialogTitle>카테고리 추가</DialogTitle>
          <DialogDescription>
            새로운 카테고리를 추가합니다.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col border py-3 px-3 gap-3">
          <div className="flex justify-between items-center">
            <p className="whitespace-nowrap">이름</p>
            <Input
              className="text-end border-0 outline-0 focus-visible:ring-offset-0 focus-visible:ring-0"
              value={form.category_name}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  category_name: e.target.value,
                }))
              }
              placeholder="카테고리 이름" />
          </div>
          <div className="flex justify-between items-center">
            <p className="whitespace-nowrap">값</p>
            <Input
              className="text-end border-0 outline-0 focus-visible:ring-offset-0 focus-visible:ring-0"
              value={form.category_value}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  category_value: e.target.value,
                }))
              }
              placeholder="카테고리 값" />
          </div>
        </div>
        <DialogFooter>
            <DialogClose render={<Button variant="outline">닫기</Button>} />
            <Button type="submit" onClick={handleAddCategory}>추가</Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { DialogAddCategory }
