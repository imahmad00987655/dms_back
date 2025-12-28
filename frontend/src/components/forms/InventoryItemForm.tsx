import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Save } from "lucide-react";
import apiService from '@/services/api';
import type { InventoryItem } from "@/components/dashboard/InventoryDashboard";

interface Supplier {
  supplier_id: number;
  supplier_name: string;
  supplier_number: string;
  supplier_type: string;
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

export const InventoryItemForm = ({
  onClose,
  onSave,
  initialData
}: { onClose: () => void, onSave?: (item: InventoryItem) => void, initialData?: InventoryItem }) => {
  const [itemData, setItemData] = useState<InventoryItem>(() => ({
    item_code: initialData?.item_code || "",
    item_name: initialData?.item_name || "",
    description: initialData?.description || "",
    category: initialData?.category || "",
    location: initialData?.location || "",
    brand: initialData?.brand || "",
    supplier_id: initialData?.supplier_id,
    barcode: initialData?.barcode || "",
    item_purchase_rate: Number(initialData?.item_purchase_rate) || 0,
    item_sell_price: Number(initialData?.item_sell_price) || 0,
    tax_status: initialData?.tax_status || "",
    uom_type: initialData?.uom_type || "",
    box_quantity: Number(initialData?.box_quantity) || 0,
    packet_quantity: Number(initialData?.packet_quantity) || 0,
    uom_type_detail: Number(initialData?.uom_type_detail) || 0,
    income_account_segment_id: initialData?.income_account_segment_id,
    cogs_account_segment_id: initialData?.cogs_account_segment_id,
    inventory_account_segment_id: initialData?.inventory_account_segment_id,
    id: initialData?.id
  }));
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [segments, setSegments] = useState<CoaSegment[]>([]);
  const [loadingSegments, setLoadingSegments] = useState(false);
  const [segmentsError, setSegmentsError] = useState<string | null>(null);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loadingTaxRates, setLoadingTaxRates] = useState(false);
  const isPrimary = (val: unknown) => val === 1 || val === true;

  const categories = [
    "Electronics",
    "Furniture", 
    "Accessories",
    "Office Supplies",
    "Equipment",
    "Software"
  ];

  const locations = [
    "Warehouse A",
    "Warehouse B", 
    "Warehouse C",
    "Main Store",
    "Storage Room"
  ];


  // Fetch suppliers on component mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoadingSuppliers(true);
      try {
        const suppliersData = await apiService.getSuppliers();
        // Filter suppliers to only show those with type "Vendor"
        const vendorSuppliers = suppliersData.filter(supplier => 
          supplier.supplier_type && supplier.supplier_type.toLowerCase() === 'vendor'
        );
        setSuppliers(vendorSuppliers);
        
        // If editing and we have a supplier_id but brand is empty or looks like an ID, set brand to supplier name
        if (initialData?.supplier_id && (!initialData.brand || initialData.brand === initialData.supplier_id.toString())) {
          const supplier = vendorSuppliers.find(s => s.supplier_id === initialData.supplier_id);
          if (supplier) {
            setItemData(prev => ({ ...prev, brand: supplier.supplier_name }));
          }
        }
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        setError('Failed to load suppliers');
      } finally {
        setLoadingSuppliers(false);
      }
    };

    fetchSuppliers();
  }, [initialData]);

  // Fetch tax rates on component mount
  useEffect(() => {
    const fetchTaxRates = async () => {
      setLoadingTaxRates(true);
      try {
        const response = await apiService.getTaxRates();
        if (response.success && response.data) {
          // Filter only active tax rates
          const activeRates = response.data.filter((rate: TaxRate) => 
            rate.status === 'ACTIVE'
          );
          setTaxRates(activeRates);
        } else if (Array.isArray(response)) {
          const activeRates = response.filter((rate: TaxRate) => 
            rate.status === 'ACTIVE'
          );
          setTaxRates(activeRates);
        } else if (response.data) {
          const rates = Array.isArray(response.data) ? response.data : [];
          const activeRates = rates.filter((rate: TaxRate) => 
            rate.status === 'ACTIVE'
          );
          setTaxRates(activeRates);
        }
      } catch (error) {
        console.error('Error fetching tax rates:', error);
        setError('Failed to load tax rates');
      } finally {
        setLoadingTaxRates(false);
      }
    };

    fetchTaxRates();
  }, []);

  useEffect(() => {
    const fetchSegments = async () => {
      setLoadingSegments(true);
      setSegmentsError(null);
      try {
        const response = await apiService.getAccountingSegments();
        // Handle both response structures: { success: true, data: [...] } or direct array
        const segmentsData = response?.data || (Array.isArray(response) ? response : []);
        setSegments(segmentsData);
        
        // Debug logging
        console.log('Accounting segments response:', segmentsData);
        console.log('Revenue segments:', segmentsData.filter((s: CoaSegment) => s.segment_type?.toUpperCase() === 'REVENUE'));
        console.log('Expense segments:', segmentsData.filter((s: CoaSegment) => s.segment_type?.toUpperCase() === 'EXPENSE'));
        console.log('Asset segments:', segmentsData.filter((s: CoaSegment) => s.segment_type?.toUpperCase() === 'ASSETS' || s.segment_type?.toUpperCase() === 'ASSET'));

        // Auto-select primary segments per type when none chosen yet
        const findPrimaryId = (type: 'REVENUE' | 'EXPENSE' | 'ASSETS') => {
          const match = segmentsData.find(
            (s: CoaSegment) => s.segment_type?.trim().toUpperCase() === type && isPrimary(s.is_primary ?? false)
          );
          return match?.id;
        };

        setItemData(prev => {
          const next = { ...prev };
          if (!prev.income_account_segment_id) {
            const revId = findPrimaryId('REVENUE');
            if (revId) next.income_account_segment_id = revId;
          }
          if (!prev.cogs_account_segment_id) {
            const expId = findPrimaryId('EXPENSE');
            if (expId) next.cogs_account_segment_id = expId;
          }
          if (!prev.inventory_account_segment_id) {
            const assetId = findPrimaryId('ASSETS');
            if (assetId) next.inventory_account_segment_id = assetId;
          }
          return next;
        });
      } catch (err) {
        console.error('Error fetching segments:', err);
        setSegmentsError('Failed to load chart of accounts segments');
      } finally {
        setLoadingSegments(false);
      }
    };

    fetchSegments();
  }, []);

  const incomeSegments = useMemo(() => {
    const list = segments
      .filter((segment) => segment.segment_type?.trim().toUpperCase() === 'REVENUE')
      .slice();
    list.sort((a, b) => Number(isPrimary(b.is_primary)) - Number(isPrimary(a.is_primary)));
    return list;
  }, [segments]);

  const cogsSegments = useMemo(() => {
    const list = segments
      .filter((segment) => segment.segment_type?.trim().toUpperCase() === 'EXPENSE')
      .slice();
    list.sort((a, b) => Number(isPrimary(b.is_primary)) - Number(isPrimary(a.is_primary)));
    return list;
  }, [segments]);

  const inventorySegments = useMemo(() => {
    const list = segments
      .filter((segment) => {
        const type = segment.segment_type?.trim().toUpperCase();
        return type === 'ASSETS' || type === 'ASSET';
      })
      .slice();
    list.sort((a, b) => Number(isPrimary(b.is_primary)) - Number(isPrimary(a.is_primary)));
    return list;
  }, [segments]);

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    setSaving(true);
    
    // Prepare the item data, storing supplier name as brand
    // Ensure all numeric values are proper numbers
    const newItem: InventoryItem = {
      ...itemData,
      brand: itemData.brand || '', // Store supplier name as brand (already set when supplier is selected)
      packet_quantity: typeof itemData.packet_quantity === 'number' 
        ? itemData.packet_quantity 
        : (itemData.packet_quantity ? parseFloat(String(itemData.packet_quantity)) : 0),
      box_quantity: typeof itemData.box_quantity === 'number' 
        ? itemData.box_quantity 
        : (itemData.box_quantity ? parseFloat(String(itemData.box_quantity)) : 0),
      item_purchase_rate: typeof itemData.item_purchase_rate === 'number' 
        ? itemData.item_purchase_rate 
        : (itemData.item_purchase_rate ? parseFloat(String(itemData.item_purchase_rate)) : 0),
      item_sell_price: typeof itemData.item_sell_price === 'number' 
        ? itemData.item_sell_price 
        : (itemData.item_sell_price ? parseFloat(String(itemData.item_sell_price)) : 0)
    };
    
    // Debug: Log the data being sent
    console.log('Saving item data:', newItem);
    console.log('packet_quantity value:', newItem.packet_quantity, 'Type:', typeof newItem.packet_quantity);
    console.log('Full itemData:', itemData);
    
    try {
      if (initialData?.id) {
        await apiService.updateInventoryItem(initialData.id, newItem);
        setSuccess("Item updated successfully!");
      } else {
        await apiService.createInventoryItem(newItem);
        setSuccess("Item saved successfully!");
      }
      if (onSave) {
        onSave(newItem);
      } else {
        onClose();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save item";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}
        {segmentsError && <div className="text-red-600">{segmentsError}</div>}
        
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Item Name</Label>
            <Input
              id="name"
              placeholder="Enter item name"
              value={itemData.item_name}
              onChange={(e) => setItemData({...itemData, item_name: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="supplier">Brand (Company Name)</Label>
            <Select
              value={itemData.supplier_id?.toString() || ""}
              onValueChange={(value) => {
                const selectedSupplier = suppliers.find(s => s.supplier_id.toString() === value);
                setItemData({
                  ...itemData, 
                  supplier_id: value ? parseInt(value) : undefined,
                  brand: selectedSupplier ? selectedSupplier.supplier_name : ''
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Brand" />
              </SelectTrigger>
              <SelectContent>
                {loadingSuppliers ? (
                  <SelectItem value="loading" disabled>
                    Loading suppliers...
                  </SelectItem>
                ) : suppliers.length > 0 ? (
                  suppliers.map(supplier => (
                    <SelectItem key={supplier.supplier_id} value={supplier.supplier_id.toString()}>
                      {supplier.supplier_name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-suppliers" disabled>
                    No Brands available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="itemCode">SKU</Label>
            <Input
              id="itemCode"
              placeholder="Enter SKU"
              value={itemData.item_code}
              onChange={(e) => setItemData({...itemData, item_code: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="barcode">Barcode (Company Product Code)</Label>
            <Input
              id="barcode"
              placeholder="Enter barcode"
              value={itemData.barcode}
              onChange={(e) => setItemData({...itemData, barcode: e.target.value})}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Enter item description"
            value={itemData.description}
            onChange={(e) => setItemData({...itemData, description: e.target.value})}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Category</Label>
            <Select
              value={itemData.category}
              onValueChange={(value) => setItemData({...itemData, category: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Location</Label>
            <Select
              value={itemData.location}
              onValueChange={(value) => setItemData({...itemData, location: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map(location => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Pricing Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="purchaseRate">Item Purchase Rate ($)</Label>
            <Input
              id="purchaseRate"
              type="number"
              min="0"
              step="0.01"
              value={itemData.item_purchase_rate}
              onChange={(e) => setItemData({...itemData, item_purchase_rate: parseFloat(e.target.value) || 0})}
            />
          </div>
          <div>
            <Label htmlFor="sellPrice">Item Sell Price ($)</Label>
            <Input
              id="sellPrice"
              type="number"
              min="0"
              step="0.01"
              value={itemData.item_sell_price}
              onChange={(e) => setItemData({...itemData, item_sell_price: parseFloat(e.target.value) || 0})}
            />
          </div>
          <div>
            <Label>Tax Status</Label>
            <Select
              value={itemData.tax_status}
              onValueChange={(value) => setItemData({...itemData, tax_status: value})}
              disabled={loadingTaxRates}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingTaxRates ? "Loading tax rates..." : "Select tax status"} />
              </SelectTrigger>
              <SelectContent>
                {loadingTaxRates ? (
                  <SelectItem value="loading" disabled>
                    Loading tax rates...
                  </SelectItem>
                ) : taxRates.length > 0 ? (
                  taxRates.map(rate => (
                    <SelectItem key={rate.id} value={rate.rate_code}>
                      {rate.rate_code} ({rate.tax_percentage}%)
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-rates" disabled>
                    No tax rates available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* UOM Section */}
        <div className="space-y-4">
          <Label>UOM (Unit of Measurement)</Label>
          
          {/* Boxes and Packets Input */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="boxes">Number of Boxes</Label>
              <Input
                id="boxes"
                type="number"
                min="0"
                step="1"
                placeholder="Enter number of boxes"
                value={itemData.box_quantity}
                onChange={(e) => setItemData({...itemData, box_quantity: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label htmlFor="packets">Number of Packets</Label>
              <Input
                id="packets"
                type="number"
                min="0"
                step="1"
                placeholder="Enter number of packets per box"
                value={itemData.packet_quantity ?? 0}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                  console.log('Updating packet_quantity to:', value);
                  setItemData({...itemData, packet_quantity: value});
                }}
              />
            </div>
            <div>
              <Label>UOM Type</Label>
              <Select
                value={itemData.uom_type}
                onValueChange={(value) => setItemData({...itemData, uom_type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select UOM type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PCS">PCS</SelectItem>
                  <SelectItem value="Bottles">Bottles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Conditional Input for UOM Type Detail */}
          {itemData.uom_type && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="uomTypeDetail">
                  Value ({itemData.uom_type === "PCS" ? "Kilograms" : "Liters"})
                </Label>
                <Input
                  id="uomTypeDetail"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={`Enter ${itemData.uom_type === "PCS" ? "kilograms" : "liters"}`}
                  value={itemData.uom_type_detail || 0}
                  onChange={(e) => setItemData({...itemData, uom_type_detail: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
          )}
        </div>

        {/* Accounting Mapping */}
        <Card className="bg-white/80 border border-gray-200/70 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              Accounting Links
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Income Account</Label>
              <Select
                value={itemData.income_account_segment_id ? String(itemData.income_account_segment_id) : ""}
                onValueChange={(value) => setItemData({ ...itemData, income_account_segment_id: value ? parseInt(value) : undefined })}
                disabled={loadingSegments}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingSegments ? "Loading accounts..." : "Select revenue account"} />
                </SelectTrigger>
                <SelectContent>
                  {loadingSegments ? (
                    <SelectItem value="loading" disabled>
                      Loading accounts...
                    </SelectItem>
                  ) : incomeSegments.length > 0 ? (
                    incomeSegments.map((segment) => (
                      <SelectItem key={segment.id} value={segment.id.toString()}>
                        {segment.segment_code} • {segment.segment_name}
                        {(segment.is_primary === 1 || segment.is_primary === true) && (
                          <span className="ml-2 text-xs text-green-600">Primary</span>
                        )}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-income" disabled>
                      No revenue accounts available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>COGS Account</Label>
              <Select
                value={itemData.cogs_account_segment_id ? String(itemData.cogs_account_segment_id) : ""}
                onValueChange={(value) => setItemData({ ...itemData, cogs_account_segment_id: value ? parseInt(value) : undefined })}
                disabled={loadingSegments}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingSegments ? "Loading accounts..." : "Select expense account"} />
                </SelectTrigger>
                <SelectContent>
                  {loadingSegments ? (
                    <SelectItem value="loading" disabled>
                      Loading accounts...
                    </SelectItem>
                  ) : cogsSegments.length > 0 ? (
                    cogsSegments.map((segment) => (
                      <SelectItem key={segment.id} value={segment.id.toString()}>
                        {segment.segment_code} • {segment.segment_name}
                        {(segment.is_primary === 1 || segment.is_primary === true) && (
                          <span className="ml-2 text-xs text-green-600">Primary</span>
                        )}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-cogs" disabled>
                      No expense accounts available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Inventory Account</Label>
              <Select
                value={itemData.inventory_account_segment_id ? String(itemData.inventory_account_segment_id) : ""}
                onValueChange={(value) => setItemData({ ...itemData, inventory_account_segment_id: value ? parseInt(value) : undefined })}
                disabled={loadingSegments}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingSegments ? "Loading accounts..." : "Select asset account"} />
                </SelectTrigger>
                <SelectContent>
                  {loadingSegments ? (
                    <SelectItem value="loading" disabled>
                      Loading accounts...
                    </SelectItem>
                  ) : inventorySegments.length > 0 ? (
                    inventorySegments.map((segment) => (
                      <SelectItem key={segment.id} value={segment.id.toString()}>
                        {segment.segment_code} • {segment.segment_name}
                        {(segment.is_primary === 1 || segment.is_primary === true) && (
                          <span className="ml-2 text-xs text-green-600">Primary</span>
                        )}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-inventory" disabled>
                      No asset accounts available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex items-center gap-2" disabled={saving}>
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Item"}
          </Button>
        </div>
      </div>
    );
};
