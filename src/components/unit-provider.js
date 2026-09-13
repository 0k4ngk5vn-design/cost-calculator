"use client"

import * as React from "react"

const UnitContext = React.createContext(null)

export function UnitProvider({ children }) {
  const [unit, setUnit] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const getUnit = async () => {
      try {
        const response = await fetch("/api/unit")

        if (!response.ok) {
          throw new Error("Failed to fetch unit")
        }

        const data = await response.json()

        setUnit(data.data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    getUnit()
  }, [])

  return (
    <UnitContext.Provider
      value={{
        unit,
        setUnit,
        loading,
      }}
    >
      {children}
    </UnitContext.Provider>
  )
}

export function useUnit() {
  const context = React.useContext(UnitContext)

  if (!context) {
    throw new Error("useUnit must be used within UnitProvider")
  }

  return context
}