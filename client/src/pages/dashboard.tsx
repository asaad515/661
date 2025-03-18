import Sidebar from "@/components/layout/sidebar";
import StatsCards from "@/components/dashboard/stats-cards";
import {
  SalesTrendsChart,
  ProductPerformanceChart,
  CustomerGrowthChart
} from "@/components/dashboard/analytics-charts";
import ExchangeRateCard from "@/components/dashboard/exchange-rate";

export default function Dashboard() {
  return (
    <div className="flex h-screen">
      <div className="w-64 h-full">
        <Sidebar />
      </div>
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold">لوحة التحكم</h1>

          {/* إحصائيات سريعة */}
          <StatsCards />

          {/* الرسوم البيانية التفاعلية */}
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <ExchangeRateCard />
              <div className="md:col-span-3">
                <SalesTrendsChart />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProductPerformanceChart />
              <CustomerGrowthChart />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}