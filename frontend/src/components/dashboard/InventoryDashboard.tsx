import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Package, AlertTriangle } from "lucide-react";
import { InventoryItemForm } from "@/components/forms/InventoryItemForm";
import { useState } from "react";

export interface InventoryItem {
  id?: number;
  item_code: string;
  item_name: string;
  description?: string;
  category?: string;
  location?: string;
  brand?: string;
  supplier_id?: number;
  barcode?: string;
  item_purchase_rate?: number;
  item_sell_price?: number;
  tax_status?: string;
  uom_type?: string;
  box_quantity?: number;
  packet_quantity?: number;
  uom_type_detail?: number;
  income_account_segment_id?: number;
  cogs_account_segment_id?: number;
  inventory_account_segment_id?: number;
}

type LocationSummary = {
  totalValue: number;
};

type GroupedData = {
  [category: string]: {
    [location: string]: LocationSummary;
  };
};

export const InventoryDashboard = ({
  items,
  loading,
  error,
}: {
  items: InventoryItem[];
  loading: boolean;
  error: string | null;
}) => {
  const [showForm, setShowForm] = useState(false);

  // Group by category, then by location
  const grouped: GroupedData = {};
  items.forEach((item) => {
    const category = item.category || "Uncategorized";
    const location = item.location || "Unknown";
    const value = Number(item.item_sell_price) || 0;

    if (!grouped[category]) grouped[category] = {};
    if (!grouped[category][location]) {
      grouped[category][location] = { totalValue: 0 };
    }
    grouped[category][location].totalValue += value;
  });

  const totalValue = items.reduce(
    (sum, item) => sum + (Number(item.item_sell_price) || 0),
    0
  );

  if (showForm) {
  return (
      <div className="p-4">
        <InventoryItemForm
          onClose={() => setShowForm(false)}
          onSave={() => setShowForm(false)}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading inventory summary...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-600 text-center">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <Package className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(grouped).map(([category, locations]) => (
          <Card key={category} className="shadow-lg">
            <CardHeader>
              <CardTitle>
                <Badge variant="outline" className="text-base px-3 py-1">{category}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(locations).map(([location, data]) => (
                  <div
                    key={location}
                    className="flex items-center justify-between border-b last:border-b-0 pb-2 last:pb-0"
                  >
                    <div>
                      <div className="font-medium">{location}</div>
                      <div className="text-xs text-gray-500">Total Value</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-blue-700 font-bold">
                        ${data.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
    </div>
  );
}; 