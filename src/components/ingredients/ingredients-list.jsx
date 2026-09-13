import * as React from "react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item"
import { Loading } from "../common/loading"

function IngredientsList({
  className,
  type,
  search,
  refreshKey,
  ...props
}) {
  const [items, setItems] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  async function fetchIngredients() {
    try {
      const response = await fetch("/api/ingredients")

      if (!response.ok) {
        throw new Error("Failed to fetch ingredients")
      }

      const data = await response.json()

      return data.data
    } catch (error) {
      return []
    }
  }

  React.useEffect(() => {
    const loadIngredients = async () => {
      setLoading(true)

      try {
        const categories = await fetchIngredients()

        const result = categories.map((category) => ({
          value: category.unit_value,
          categoryName: category.unit_name,

          contents: category.ingredients.map((ingredient) => ({
            uuid: ingredient.id,
            name: ingredient.name,

            quantity: ingredient.quantity,

            quantity_unit:
              ingredient.quantity_unit_data?.unit_name || "",

            currency_unit:
              ingredient.currency_unit_data?.unit_name || "",

            category:
              ingredient.category_data?.unit_name || "",

            price: ingredient.price,

            memo: ingredient.memo,
            supplier: ingredient.supplier,
          })),
        }))

        result.sort((a, b) => {
          if (a.value === "basic") return -1
          if (b.value === "basic") return 1

          return a.categoryName.localeCompare(
            b.categoryName,
            "ko"
          )
        })

        setItems(result)
      } finally {
        setLoading(false)
      }
    }

    loadIngredients()
  }, [refreshKey])

  const filteredItems = React.useMemo(() => {
    const keyword = search?.trim().toLowerCase()

    if (!keyword) {
      return items
    }

    return items
      .map((item) => ({
        ...item,
        contents: item.contents.filter((content) =>
          content.name?.toLowerCase().includes(keyword)
        ),
      }))
      .filter((item) => item.contents.length > 0)
  }, [items, search])

  if (loading) {
    return (
      <Loading />
    )
  }

  return (
    <Accordion type="multiple" defaultValue="basic">
      {filteredItems.map((item) => (
        <AccordionItem
          key={item.value}
          value={item.value}
          className="border-none"
          disabled={item.contents.length === 0}
        >
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <span>
                {item.categoryName}
              </span>

              <span className="text-xs text-gray-400">
                {item.contents.length}
              </span>
            </div>
          </AccordionTrigger>

          <AccordionContent>
            <div className="flex flex-col gap-2 mx-2">

              {item.contents.map((content) => (
                <Item
                  key={content.uuid}
                  variant="outline"
                  size="sm"
                  render={
                    <a
                      href={`/ingredients/${content.uuid}`}
                      className="px-4 py-3"
                      style={{
                        textDecoration: "none",
                      }}
                    >
                      <ItemContent>
                        <ItemTitle>
                          {content.name}
                        </ItemTitle>

                        {content.memo && (
                          <ItemDescription>
                            {`메모: ${content.memo}`}
                          </ItemDescription>
                        )}
                      </ItemContent>

                      <ItemActions>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-400">
                            {content.price?.toLocaleString()}
                            {content.currency_unit}
                            {" / "}
                            {content.quantity}
                            {content.quantity_unit}
                          </span>

                          <span className="text-md text-end text-blue-600">
                            {(
                              content.price /
                              content.quantity
                            ).toLocaleString()}
                            {content.currency_unit}
                            {" / "}
                            {content.quantity_unit}
                          </span>
                        </div>
                      </ItemActions>
                    </a>
                  }
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

export { IngredientsList }