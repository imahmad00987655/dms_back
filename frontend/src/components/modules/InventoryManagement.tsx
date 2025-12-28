import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, Plus, Package, BarChart3, Filter, Eye } from "lucide-react";
import { InventoryItemForm } from "@/components/forms/InventoryItemForm";
import { BinCardForm } from "@/components/forms/BinCardForm";
import { InventoryDashboard } from "@/components/dashboard/InventoryDashboard";
import apiService from "@/services/api";

export interface InventoryItem {
  id?: number;
  item_code: string;
  item_name: string;
  description?: string;
  category?: string;
  quantity?: number; // May be calculated from bin_cards
  unit_price?: number; // Legacy field - use item_purchase_rate or item_sell_price
  item_purchase_rate?: number;
  item_sell_price?: number;
  location?: string;
  box_quantity?: number;
  packet_quantity?: number;
  brand?: string;
  supplier_id?: number;
  supplier_name?: string;
  barcode?: string;
  tax_status?: string;
  uom_type?: string;
  uom_type_detail?: number;
  income_account_segment_id?: number;
  cogs_account_segment_id?: number;
  inventory_account_segment_id?: number;
  effective_start_date?: string | null;
  effective_end_date?: string | null;
  is_active?: number | boolean;
  version?: number;
}

interface CoaSegment {
  id: number;
  segment_id: string;
  segment_code: string;
  segment_name: string;
  segment_type: string;
  is_primary?: boolean | number | null;
}

interface TaxRate {
  id: number;
  rate_code: string;
  tax_percentage: number;
  tax_type_id: number;
  tax_type_name?: string;
  status: string;
}

export const InventoryManagement = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBinCardForm, setShowBinCardForm] = useState(false);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [segments, setSegments] = useState<CoaSegment[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loadingViewData, setLoadingViewData] = useState(false);

  // Fetch inventory from backend
  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getInventoryItems();
      setInventory(res.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Fetch segments and tax rates when viewing an item
  useEffect(() => {
    const fetchViewData = async () => {
      if (viewingItem) {
        setLoadingViewData(true);
        try {
          // Fetch segments
          const segmentsRes = await apiService.getAccountingSegments();
          const segmentsData = segmentsRes?.data || (Array.isArray(segmentsRes) ? segmentsRes : []);
          setSegments(segmentsData);

          // Fetch tax rates
          const taxRatesRes = await apiService.getTaxRates();
          const taxRatesData = taxRatesRes?.data || (Array.isArray(taxRatesRes) ? taxRatesRes : []);
          setTaxRates(taxRatesData);
        } catch (err) {
          console.error('Error fetching view data:', err);
        } finally {
          setLoadingViewData(false);
        }
      }
    };

    fetchViewData();
  }, [viewingItem]);

  // Filtering logic
  const categories = Array.from(new Set(inventory.map(item => item.category).filter(Boolean)));
  const filteredInventory = inventory.filter(item => {
    const matchesSearch =
      item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Summary calculations
  const totalValue = inventory.reduce((sum, item) => {
    const unitPrice = Number(item.item_purchase_rate) || Number(item.item_sell_price) || Number(item.unit_price) || 0;
    const boxQty = Number(item.box_quantity) || 0;
    const packetQty = Number(item.packet_quantity) || 0;
    const quantity = boxQty * packetQty; // Calculate total quantity as boxes × packets
    return sum + (quantity * unitPrice);
  }, 0);
  
  // Low stock: quantity < 10 (items that need restocking, including out of stock)
  const lowStockItems = inventory.filter(item => {
    const boxQty = Number(item.box_quantity) || 0;
    const packetQty = Number(item.packet_quantity) || 0;
    const quantity = boxQty * packetQty;
    const isLowStock = quantity < 10; // Any quantity less than 10 is considered low stock
    
    return isLowStock;
  }).length;

  // Remove the conditional rendering - we'll use Dialog instead

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-500 mt-1">Manage and track your inventory items with tiered pricing</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowBinCardForm(true)} variant="outline" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Bin Card
          </Button>
          <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Inventory List
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <InventoryDashboard items={inventory} loading={loading} error={error} />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
                <Package className="w-4 h-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                <Package className="w-4 h-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredInventory.length}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {categoryFilter !== "all" ? `in ${categoryFilter}` : "total items"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                <Package className="w-4 h-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{lowStockItems}</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search inventory..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div>Loading...</div>
              ) : error ? (
                <div className="text-red-600">{error}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Item</th>
                        <th className="text-left py-3 px-4 font-semibold">SKU</th>
                        <th className="text-left py-3 px-4 font-semibold">Category</th>
                        <th className="text-left py-3 px-4 font-semibold">Quantity</th>
                        <th className="text-left py-3 px-4 font-semibold">Unit Price</th>
                        <th className="text-left py-3 px-4 font-semibold">Total Value</th>
                        <th className="text-left py-3 px-4 font-semibold">Location</th>
                        <th className="text-left py-3 px-4 font-semibold">Status</th>
                        <th className="text-left py-3 px-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.map((item) => {
                        // Use item_purchase_rate or item_sell_price, fallback to unit_price for legacy data
                        const unitPrice = Number(item.item_purchase_rate) || Number(item.item_sell_price) || Number(item.unit_price) || 0;
                        const boxQty = Number(item.box_quantity) || 0;
                        const packetQty = Number(item.packet_quantity) || 0;
                        const quantity = boxQty * packetQty; // Calculate total quantity as boxes × packets
                        const totalValue = quantity * unitPrice; // Total Value = Unit Price × Quantity
                        
                        // Determine status: Out of Stock (0), Low Stock (1-9), In Stock (>= 10)
                        let statusText = "In Stock";
                        let statusVariant: "destructive" | "default" | "secondary" = "default";
                        if (quantity === 0) {
                          statusText = "Out of Stock";
                          statusVariant = "secondary";
                        } else if (quantity >= 1 && quantity < 10) {
                          statusText = "Low Stock";
                          statusVariant = "destructive";
                        } else {
                          statusText = "In Stock";
                          statusVariant = "default";
                        }
                        
                        return (
                          <tr key={item.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium">{item.item_name}</div>
                                <div className="text-sm text-gray-500">{item.item_code}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4">{item.item_code}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline">{item.category || 'N/A'}</Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium">
                                {quantity.toLocaleString()}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm text-blue-600">
                                {unitPrice > 0 ? `$${unitPrice.toFixed(2)}` : '$0.00'}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4">{item.location || '-'}</td>
                            <td className="py-3 px-4">
                              <Badge variant={statusVariant}>
                                {statusText}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewingItem(item)}
                                className="flex items-center gap-2 w-auto"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Item Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Inventory Item</DialogTitle>
          </DialogHeader>
          <InventoryItemForm
            onClose={() => setShowAddForm(false)}
            onSave={() => {
              setShowAddForm(false);
              fetchInventory();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Bin Card Dialog */}
      <Dialog open={showBinCardForm} onOpenChange={setShowBinCardForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bin Card</DialogTitle>
          </DialogHeader>
          <BinCardForm onClose={() => setShowBinCardForm(false)} />
        </DialogContent>
      </Dialog>

      {/* View Item Dialog */}
      <Dialog open={!!viewingItem} onOpenChange={(open) => !open && setViewingItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Item Details - {viewingItem?.item_name}
            </DialogTitle>
            <DialogDescription>
              View complete information about this inventory item
            </DialogDescription>
          </DialogHeader>
          {viewingItem && (() => {
            const boxQty = Number(viewingItem.box_quantity) || 0;
            const packetQty = Number(viewingItem.packet_quantity) || 0;
            const quantity = boxQty * packetQty;
            const unitPrice = Number(viewingItem.item_purchase_rate) || Number(viewingItem.item_sell_price) || Number(viewingItem.unit_price) || 0;
            const totalValue = quantity * unitPrice;
            
            let statusText = "In Stock";
            let statusVariant: "destructive" | "default" | "secondary" = "default";
            if (quantity === 0) {
              statusText = "Out of Stock";
              statusVariant = "secondary";
            } else if (quantity >= 1 && quantity < 10) {
              statusText = "Low Stock";
              statusVariant = "destructive";
            } else {
              statusText = "In Stock";
              statusVariant = "default";
            }

            // Find tax rate details
            const taxRate = viewingItem.tax_status 
              ? taxRates.find(tr => tr.rate_code === viewingItem.tax_status)
              : null;

            // Find chart of account segments
            const incomeSegment = viewingItem.income_account_segment_id
              ? segments.find(s => s.id === viewingItem.income_account_segment_id)
              : null;
            const cogsSegment = viewingItem.cogs_account_segment_id
              ? segments.find(s => s.id === viewingItem.cogs_account_segment_id)
              : null;
            const inventorySegment = viewingItem.inventory_account_segment_id
              ? segments.find(s => s.id === viewingItem.inventory_account_segment_id)
              : null;

            return (
              <div className="space-y-6 py-4">
                {loadingViewData ? (
                  <div className="text-center py-8">Loading details...</div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Basic Information</h3>
                        <div>
                          <p className="text-sm text-gray-500">Item Code (SKU)</p>
                          <p className="font-medium">{viewingItem.item_code}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Item Name</p>
                          <p className="font-medium">{viewingItem.item_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Description</p>
                          <p className="font-medium">{viewingItem.description || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Category</p>
                          <Badge variant="outline">{viewingItem.category || 'N/A'}</Badge>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="font-medium">{viewingItem.location || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Brand (Company Name)</p>
                          <p className="font-medium">{viewingItem.supplier_name || viewingItem.brand || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Barcode (Company Product Code)</p>
                          <p className="font-medium">{viewingItem.barcode || '-'}</p>
                        </div>
                      </div>

                      {/* Quantity & Pricing */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Quantity & Pricing</h3>
                        <div>
                          <p className="text-sm text-gray-500">Number of Boxes</p>
                          <p className="font-medium">{boxQty.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Number of Packets</p>
                          <p className="font-medium">{packetQty.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Quantity</p>
                          <p className="font-medium text-lg">{quantity.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Purchase Rate</p>
                          <p className="font-medium text-blue-600">
                            ${Number(viewingItem.item_purchase_rate || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Sell Price</p>
                          <p className="font-medium text-blue-600">
                            ${Number(viewingItem.item_sell_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Value</p>
                          <p className="font-medium text-lg text-green-600">
                            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <Badge variant={statusVariant} className="mt-1">
                            {statusText}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Tax Status */}
                    {viewingItem.tax_status && (
                      <div className="space-y-4 border-t pt-4">
                        <h3 className="font-semibold text-lg">Tax Status</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Tax Status Code</p>
                            <p className="font-medium">{viewingItem.tax_status}</p>
                          </div>
                          {taxRate && (
                            <>
                              <div>
                                <p className="text-sm text-gray-500">Tax Percentage</p>
                                <p className="font-medium">{taxRate.tax_percentage}%</p>
                              </div>
                              {taxRate.tax_type_name && (
                                <div>
                                  <p className="text-sm text-gray-500">Tax Type</p>
                                  <p className="font-medium">{taxRate.tax_type_name}</p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* UOM Information */}
                    {(viewingItem.uom_type || viewingItem.uom_type_detail) && (
                      <div className="space-y-4 border-t pt-4">
                        <h3 className="font-semibold text-lg">Unit of Measurement (UOM)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {viewingItem.uom_type && (
                            <div>
                              <p className="text-sm text-gray-500">UOM Type</p>
                              <p className="font-medium">{viewingItem.uom_type}</p>
                            </div>
                          )}
                          {viewingItem.uom_type_detail !== undefined && viewingItem.uom_type_detail !== null && (
                            <div>
                              <p className="text-sm text-gray-500">
                                Value ({viewingItem.uom_type === "PCS" ? "Kilograms" : viewingItem.uom_type === "Bottles" ? "Liters" : "N/A"})
                              </p>
                              <p className="font-medium">
                                {Number(viewingItem.uom_type_detail).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Chart of Accounts */}
                    {(viewingItem.income_account_segment_id || viewingItem.cogs_account_segment_id || viewingItem.inventory_account_segment_id) && (
                      <div className="space-y-4 border-t pt-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <Package className="w-4 h-4 text-blue-600" />
                          Chart of Accounts (Accounting Links)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {incomeSegment && (
                            <div>
                              <p className="text-sm text-gray-500">Income Account</p>
                              <p className="font-medium">{incomeSegment.segment_code} • {incomeSegment.segment_name}</p>
                              {(incomeSegment.is_primary === 1 || incomeSegment.is_primary === true) && (
                                <Badge variant="outline" className="mt-1 text-xs">Primary</Badge>
                              )}
                            </div>
                          )}
                          {cogsSegment && (
                            <div>
                              <p className="text-sm text-gray-500">COGS Account</p>
                              <p className="font-medium">{cogsSegment.segment_code} • {cogsSegment.segment_name}</p>
                              {(cogsSegment.is_primary === 1 || cogsSegment.is_primary === true) && (
                                <Badge variant="outline" className="mt-1 text-xs">Primary</Badge>
                              )}
                            </div>
                          )}
                          {inventorySegment && (
                            <div>
                              <p className="text-sm text-gray-500">Inventory Account</p>
                              <p className="font-medium">{inventorySegment.segment_code} • {inventorySegment.segment_name}</p>
                              {(inventorySegment.is_primary === 1 || inventorySegment.is_primary === true) && (
                                <Badge variant="outline" className="mt-1 text-xs">Primary</Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2 border-t pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingItem(viewingItem);
                          setShowEditForm(true);
                        }}
                      >
                        Edit Item / Rates
                      </Button>
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog
        open={showEditForm}
        onOpenChange={(open) => {
          if (!open) {
            setShowEditForm(false);
            setEditingItem(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <InventoryItemForm
              initialData={editingItem}
              onClose={() => {
                setShowEditForm(false);
                setEditingItem(null);
              }}
              onSave={() => {
                setShowEditForm(false);
                setEditingItem(null);
                setViewingItem(null);
                fetchInventory();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
