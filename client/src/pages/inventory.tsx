import Sidebar from "@/components/layout/sidebar";
import InventoryTable from "@/components/inventory/inventory-table";

export default function Inventory() {
  return (
    <div className="flex h-screen">
      <div className="w-64 h-full">
        <Sidebar />
      </div>
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <InventoryTable />
        </div>
      </main>
    </div>
  );
}
