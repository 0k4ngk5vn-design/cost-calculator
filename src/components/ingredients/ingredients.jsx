'use client'

import * as React from "react"
import { Plus } from "lucide-react"
import { IngredientsList } from "@/components/ingredients/ingredients-list";
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DialogAddIngredients } from "./dialog-add-ingredients";
import { DialogAddCategory } from "./dialog-add-category";
import { useUnit } from "../unit-provider";
import { InputSearch } from "../common/input-search";



function Ingredients({
  className,
  type,
  ...props
}) {
  const [addIngredientOpen, setAddIngredientOpen] = React.useState(false)
  const [addCategoryOpen, setAddCategoryOpen] = React.useState(false)

  const {unit, loading} = useUnit();

  const [refreshKey, setRefreshKey] = React.useState(0)

  const refreshIngredients = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const [search, setSearch] = React.useState("")

  return (
    <>
      <section className="mb-3">
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button size="icon"><Plus /></Button>} />
            <DropdownMenuContent className="w-40" align="start">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setAddIngredientOpen(true)}>
                  재료 추가
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAddCategoryOpen(true)}>
                  카테고리 추가
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </section>
      <section>
        <InputSearch placeholder={"재료 검색..."} value={search} onChange={(value) => setSearch(value ?? "")} />
      </section>
      <section>
        <IngredientsList search={search} refreshKey={refreshKey} />
      </section>
      <DialogAddIngredients unit={unit} open={addIngredientOpen} setOpen={setAddIngredientOpen}
        onSuccess={refreshIngredients} />
      <DialogAddCategory open={addCategoryOpen} setOpen={setAddCategoryOpen}
        onSuccess={refreshIngredients} />
    </>
  );
}

export { Ingredients }
