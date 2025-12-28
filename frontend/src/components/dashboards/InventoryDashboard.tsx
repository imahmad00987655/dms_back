
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, AlertTriangle, DollarSign, BarChart3 } from "lucide-react";

export const InventoryDashboard = () => {
  const inventoryMetrics = {
    totalItems: 1250,
    totalValue: 185000,
    lowStockItems: 15,
    outOfStockItems: 3,
    reorderPending: 8,
    turnoverRate: 4.2
  };

  const topMovingItems = [
    { name: "Wireless Headphones", moved: 45, value: 2025 },
    { name: "Office Chair", moved: 32, value: 6400 },
    { name: "Laptop Stand", moved: 28, value: 840 }
  ];

  const categoryBreakdown = [
    { category: "Electronics", count: 450, value: 85000 },
    { category: "Furniture", count: 320, value: 65000 },
    { category: "Accessories", count: 280, value: 25000 },
    { category: "Supplies", count: 200, value: 10000 }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryMetrics.totalItems.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Active inventory items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${inventoryMetrics.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Current inventory value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{inventoryMetrics.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Items below reorder level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turnover Rate</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{inventoryMetrics.turnoverRate}x</div>
            <p className="text-xs text-muted-foreground">Annual turnover rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Top Moving Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topMovingItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500">{item.moved} units moved</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${item.value.toLocaleString()}</div>
                    <Badge variant="secondary">#{index + 1}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryBreakdown.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{category.category}</div>
                    <div className="text-sm text-gray-500">{category.count} items</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${category.value.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
