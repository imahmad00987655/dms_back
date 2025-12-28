
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, HardDrive, Save } from "lucide-react";
import apiService from "@/services/api";
import { toast } from "sonner";

interface AssetFormProps {
  onClose: () => void;
}

export const AssetForm = ({ onClose }: AssetFormProps) => {
  const [formData, setFormData] = useState({
    assetId: `AST-${Date.now()}`,
    name: "",
    category: "",
    subCategory: "",
    value: "",
    purchaseDate: new Date().toISOString().split('T')[0],
    location: "",
    department: "",
    depreciationMethod: "",
    usefulLife: "",
    salvageValue: "",
    vendor: "",
    serialNumber: "",
    warrantyExpiry: "",
    condition: "excellent",
    description: "",
    insuranceValue: "",
    maintenanceSchedule: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createAsset({
        asset_id: formData.assetId,
        name: formData.name,
        category: formData.category,
        sub_category: formData.subCategory,
        value: Number(formData.value),
        purchase_date: formData.purchaseDate,
        location: formData.location,
        department: formData.department,
        depreciation_method: formData.depreciationMethod,
        useful_life: Number(formData.usefulLife) || null,
        salvage_value: Number(formData.salvageValue) || null,
        vendor: formData.vendor,
        serial_number: formData.serialNumber,
        warranty_expiry: formData.warrantyExpiry,
        condition: formData.condition,
        description: formData.description,
        insurance_value: Number(formData.insuranceValue) || null,
        maintenance_schedule: formData.maintenanceSchedule
      });
      toast.success('Asset created successfully!');
      onClose();
    } catch (err) {
      console.error('Failed to save asset:', err);
      toast.error('Failed to save asset. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Create Asset
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assetId">Asset ID</Label>
                  <Input
                    id="assetId"
                    value={formData.assetId}
                    onChange={(e) => setFormData(prev => ({ ...prev, assetId: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="name">Asset Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="building">Building & Structure</SelectItem>
                      <SelectItem value="machinery">Machinery & Equipment</SelectItem>
                      <SelectItem value="vehicle">Vehicles</SelectItem>
                      <SelectItem value="furniture">Furniture & Fixtures</SelectItem>
                      <SelectItem value="technology">Technology Equipment</SelectItem>
                      <SelectItem value="land">Land</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subCategory">Sub Category</Label>
                  <Input
                    id="subCategory"
                    value={formData.subCategory}
                    onChange={(e) => setFormData(prev => ({ ...prev, subCategory: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Financial Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="value">Purchase Value</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="depreciationMethod">Depreciation Method</Label>
                  <Select value={formData.depreciationMethod} onValueChange={(value) => setFormData(prev => ({ ...prev, depreciationMethod: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="straight-line">Straight Line</SelectItem>
                      <SelectItem value="declining-balance">Declining Balance</SelectItem>
                      <SelectItem value="sum-of-years">Sum of Years Digits</SelectItem>
                      <SelectItem value="units-of-production">Units of Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="usefulLife">Useful Life (Years)</Label>
                  <Input
                    id="usefulLife"
                    type="number"
                    value={formData.usefulLife}
                    onChange={(e) => setFormData(prev => ({ ...prev, usefulLife: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="salvageValue">Salvage Value</Label>
                  <Input
                    id="salvageValue"
                    type="number"
                    step="0.01"
                    value={formData.salvageValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, salvageValue: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Location & Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Location & Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select value={formData.department} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="administration">Administration</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="it">IT</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vendor">Vendor/Supplier</Label>
                  <Input
                    id="vendor"
                    value={formData.vendor}
                    onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="condition">Condition</Label>
                  <Select value={formData.condition} onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
                  <Input
                    id="warrantyExpiry"
                    type="date"
                    value={formData.warrantyExpiry}
                    onChange={(e) => setFormData(prev => ({ ...prev, warrantyExpiry: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Asset description and specifications..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Create Asset
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
