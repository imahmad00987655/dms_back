import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Package, BarChart3 } from "lucide-react";
import apiService from '@/services/api';
import type { BinCard } from "@/components/dashboard/BinCardDashboard";

interface BinCardFormProps {
  onClose: () => void;
  onSave?: (formData: BinCard) => void;
}

const mapTransactionType = (type: string) => {
  switch (type) {
    case "In":
      return "IN";
    case "Out":
      return "OUT";
    case "adjustment":
      return "ADJUSTMENT";
    default:
      return "ADJUSTMENT";
  }
};

export const BinCardForm = ({ onClose, onSave }: BinCardFormProps) => {
  const [formData, setFormData] = useState<BinCard>({
    item_code: "",
    item_name: "",
    bin_location: "",
    warehouse: "",
    unit_of_measure: "",
    current_stock: 0,
    minimum_level: 0,
    reorder_level: 0,
    maximum_level: 0,
    transaction_type: "",
    transaction_quantity: 0,
    reference_number: "",
    notes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const mappedFormData = {
        ...formData,
        transaction_type: mapTransactionType(formData.transaction_type)
      };
      await apiService.createBinCard(mappedFormData);
      if (onSave) {
        onSave(mappedFormData);
      } else {
        onClose();
      }
    } catch (err) {
      // Show error
    }
  };

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Bin Card Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="itemCode">Item Code</Label>
                <Input
                  id="itemCode"
                  value={formData.item_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, item_code: e.target.value }))}
                  placeholder="ITM-001"
                  required
                />
              </div>

              <div>
                <Label htmlFor="itemName">Item Name</Label>
                <Input
                  id="itemName"
                  value={formData.item_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))}
                  placeholder="Enter item name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="binLocation">Bin Location</Label>
                <Input
                  id="binLocation"
                  value={formData.bin_location}
                  onChange={(e) => setFormData(prev => ({ ...prev, bin_location: e.target.value }))}
                  placeholder="A-01-001"
                  required
                />
              </div>

              <div>
                <Label htmlFor="warehouse">Warehouse</Label>
                <Select value={formData.warehouse} onValueChange={(value) => setFormData(prev => ({ ...prev, warehouse: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main Warehouse</SelectItem>
                    <SelectItem value="secondary">Secondary Warehouse</SelectItem>
                    <SelectItem value="staging">Staging Area</SelectItem>
                    <SelectItem value="finished-goods">Finished Goods</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unitOfMeasure">Unit of Measure</Label>
                <Select value={formData.unit_of_measure} onValueChange={(value) => setFormData(prev => ({ ...prev, unit_of_measure: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select UOM" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pieces">Pieces</SelectItem>
                    <SelectItem value="kg">Kilograms</SelectItem>
                    <SelectItem value="liters">Liters</SelectItem>
                    <SelectItem value="boxes">Boxes</SelectItem>
                    <SelectItem value="sets">Sets</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="currentStock">Current Stock</Label>
                <Input
                  id="currentStock"
                  type="number"
                  value={formData.current_stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, current_stock: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="minimumLevel">Minimum Level</Label>
                <Input
                  id="minimumLevel"
                  type="number"
                  value={formData.minimum_level}
                  onChange={(e) => setFormData(prev => ({ ...prev, minimum_level: Number(e.target.value) }))}
                  placeholder="10"
                />
              </div>

              <div>
                <Label htmlFor="reorderLevel">Reorder Level</Label>
                <Input
                  id="reorderLevel"
                  type="number"
                  value={formData.reorder_level}
                  onChange={(e) => setFormData(prev => ({ ...prev, reorder_level: Number(e.target.value) }))}
                  placeholder="25"
                />
              </div>

              <div>
                <Label htmlFor="maximumLevel">Maximum Level</Label>
                <Input
                  id="maximumLevel"
                  type="number"
                  value={formData.maximum_level}
                  onChange={(e) => setFormData(prev => ({ ...prev, maximum_level: Number(e.target.value) }))}
                  placeholder="100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transactionType">Transaction Type</Label>
                <Select value={formData.transaction_type} onValueChange={(value) => setFormData(prev => ({ ...prev, transaction_type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select transaction type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receipt">In</SelectItem>
                    <SelectItem value="issue">Issue</SelectItem>
                    <SelectItem value="adjustment">Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">Transaction Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.transaction_quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, transaction_quantity: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="reference">Reference Number</Label>
              <Input
                id="reference"
                value={formData.reference_number}
                onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                placeholder="PO-001, SO-001, etc."
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes or comments..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                <BarChart3 className="w-4 h-4 mr-2" />
                Update Bin Card
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
