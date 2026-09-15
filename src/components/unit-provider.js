"use client"

import * as React from "react"

const UnitContext = React.createContext(null)

export function UnitProvider({ children }) {
  const [unit, setUnit] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  /**
   * API 호출만 담당
   * setState 하지 않음
   */
  const fetchUnit = React.useCallback(async () => {
    const response = await fetch("/api/unit");

    if (!response.ok) {
        alert('실패하였습니다.\n\n잠시 후 다시 시도하세요.')
    }

    const data = await response.json();

    return data.data ?? [];
  }, []);

  /**
   * 최초 로딩
   */
  React.useEffect(() => {
    let ignore = false;

    const loadUnit = async () => {
      try {
        const data = await fetchUnit();

        if (!ignore) {
          setUnit(data);
        }
      } catch (error) {
        console.error(error);

        if (!ignore) {
          setUnit([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadUnit();

    return () => {
      ignore = true;
    };
  }, [fetchUnit]);

  /**
   * 외부에서 수동 새로고침할 때 사용
   */
  const refreshUnit = React.useCallback(async () => {
    setLoading(true);

    try {
      const data = await fetchUnit();
      setUnit(data);

      return data;
    } catch (error) {
      console.error(error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [fetchUnit]);

  return (
    <UnitContext.Provider
      value={{
        unit,
        loading,
        refreshUnit,
      }}
    >
      {children}
    </UnitContext.Provider>
  );
}

export function useUnit() {
  const context = React.useContext(UnitContext)

  if (!context) {
    throw new Error("useUnit must be used within UnitProvider");
  }

  return context
}