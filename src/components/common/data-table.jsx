'use client'

import * as React from "react"

function DataTable({
  className,
  type,
  data,
  searchData,
  ...props
}) {

  const [search, setSearch] = React.useState("")
  const [sortKey, setSortKey] = React.useState("")
  const [sortOrder, setSortOrder] = React.useState("asc")
  const [page, setPage] = React.useState(1)

  const pageSize = 10

  const filteredData = React.useMemo(() => {
    let result = [...data]

    if (search && searchData) {
      result = result.filter((item) =>
        String(item[searchData] ?? "")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    }

    if (sortKey) {
      result.sort((a, b) => {
        if (a[sortKey] < b[sortKey]) {
          return sortOrder === "asc" ? -1 : 1
        }

        if (a[sortKey] > b[sortKey]) {
          return sortOrder === "asc" ? 1 : -1
        }

        return 0
      })
    }

    return result
  }, [data, search, searchData, sortKey, sortOrder])

  const totalPages = Math.ceil(filteredData.length / pageSize)

  const paginatedData = filteredData.slice(
    (page - 1) * pageSize,
    page * pageSize
  )

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortOrder("asc")
    }
  }

  return (
    <div className="w-full text-sm">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th
                className="cursor-pointer px-4 py-2 text-left"
                onClick={() => handleSort("name")}
              >
                이름
              </th>

              <th
                className="cursor-pointer px-4 py-2 text-left"
                onClick={() => handleSort("category")}
              >
                카테고리
              </th>

              <th
                className="cursor-pointer px-4 py-2 text-right"
                onClick={() => handleSort("price")}
              >
                가격
              </th>
            </tr>
          </thead>

          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3">{item.category}</td>
                  <td className="px-4 py-3 text-right">
                    {item.price.toLocaleString()}원
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="py-10 text-center text-gray-500">
                  데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className="rounded border px-3 py-2 disabled:opacity-50"
        >
          이전
        </button>

        <span>
          {page} / {totalPages || 1}
        </span>

        <button
          onClick={() =>
            setPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={page >= totalPages}
          className="rounded border px-3 py-2 disabled:opacity-50"
        >
          다음
        </button>
      </div>
    </div>
  )
}

export { DataTable }
