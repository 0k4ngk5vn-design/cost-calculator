import * as React from "react"

function Loading({
  className,
  ...props
}) {
  return (
    <div className="flex items-center justify-center mt-10 h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-gray-300 border-t-black" />

        <span className="text-sm text-gray-500">
          데이터를 불러오는 중입니다.
        </span>
      </div>
    </div>
  );
}

export { Loading }
