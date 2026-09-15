'use client'

import * as React from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUnit } from "../unit-provider";
import { InputSearch } from "../common/input-search"
import { MenuList } from "./menu-list"
import { DialogAddMenu } from "./dialog-add-menu"
import { DialogAddCategory } from "./dialog-add-category"



function Menu({
  className,
  type,
  ...props
}) {
  const [addMenuOpen, setAddMenuOpen] = React.useState(false)
  const [addCategoryOpen, setAddCategoryOpen] = React.useState(false)

  const {unit, loading, refreshUnit} = useUnit();

  const [refreshKey, setRefreshKey] = React.useState(0)

  const refreshMenu = async () => {
    await refreshUnit()

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
                <DropdownMenuItem onClick={() => setAddMenuOpen(true)}>
                  메뉴 추가
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
        <InputSearch placeholder={"메뉴 검색..."} value={search} onChange={(value) => setSearch(value ?? "")} />
      </section>
      <section>
        <MenuList search={search} refreshKey={refreshKey} />
      </section>
      {addMenuOpen && (
        <DialogAddMenu unit={unit} open={addMenuOpen} setOpen={setAddMenuOpen}
          onSuccess={refreshMenu} />
      )}
      <DialogAddCategory open={addCategoryOpen} setOpen={setAddCategoryOpen}
        onSuccess={refreshMenu}/>
    </>
  );
}

export { Menu }
