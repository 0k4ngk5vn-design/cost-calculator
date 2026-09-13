'use client'

import {
  Package,
  CookingPot,
  ChartNoAxesColumnIncreasing,
  TriangleAlert,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const dashboardData = [
  {
    title: "등록된 재료",
    value: "28개",
    description: "등록된 전체 재료",
    icon: Package,
  },
  {
    title: "등록된 메뉴",
    value: "12개",
    description: "원가 계산을 위해 등록된 메뉴",
    icon: CookingPot,
  },
  {
    title: "평균 원가율",
    value: "31.4%",
    description: "전체 메뉴 평균",
    icon: ChartNoAxesColumnIncreasing,
  },
  {
    title: "최고 원가율",
    value: "43.2%",
    description: "부대찌개",
    icon: TriangleAlert,
  },
];

export function DashboardSummary() {

  const router = useRouter()
  const handleLogout =
    async () => {
      await fetch(
        "/api/auth/logout",
        {
          method: "POST",
        }
      )

      router.replace(
        "/login"
      )
    }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* {dashboardData.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.title}>
            <CardHeader className="flex flex-row justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {item.title}
              </CardTitle>

              <div className="flex size-9 items-center justify-center rounded-md border bg-muted/40">
                <Icon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>

            <CardContent>
              <div className="text-2xl font-bold">
                {item.value}
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                {item.description}
              </p>
            </CardContent>
          </Card>
        );
      })} */}
      대시보드

      <Button variant="outline" onClick={handleLogout}>
        로그아웃
      </Button>
    </div>
  );
}