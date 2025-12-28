import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, HardDrive, MapPin, Building, Calendar, DollarSign, Shield } from "lucide-react";

interface Asset {
  id: number;
  asset_id: string;
  name: string;
  category: string;
  sub_category: string;
  value: number;
  purchase_date: string;
  location: string;
  department: string;
  depreciation_method: string;
  useful_life: number;
  salvage_value: number;
  vendor: string;
  serial_number: string;
  warranty_expiry: string;
  condition: string;
  description: string;
  insurance_value: number;
  maintenance_schedule: string;
  created_at: string;
  updated_at: string;
}

interface AssetDetailsModalProps {
  asset: Asset | null;
  onClose: () => void;
}

export const AssetDetailsModal = ({ asset, onClose }: AssetDetailsModalProps) => {
  if (!asset) return null;

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case "excellent":
        return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
      case "good":
        return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
      case "fair":
        return <Badge className="bg-yellow-100 text-yellow-800">Fair</Badge>;
      case "poor":
        return <Badge variant="destructive">Poor</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Asset Details
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Asset ID</label>
                <p className="text-lg">{asset.asset_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Asset Name</label>
                <p className="text-lg font-semibold">{asset.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Category</label>
                <p className="text-lg">{asset.category}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Sub Category</label>
                <p className="text-lg">{asset.sub_category || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Financial Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Purchase Value</label>
                <p className="text-lg font-semibold text-green-600">
                  ${asset.value.toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Insurance Value</label>
                <p className="text-lg font-semibold text-blue-600">
                  ${(asset.insurance_value || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Salvage Value</label>
                <p className="text-lg">
                  ${(asset.salvage_value || 0).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Depreciation Method</label>
                <p className="text-lg">{asset.depreciation_method || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Useful Life</label>
                <p className="text-lg">{asset.useful_life || 'N/A'} years</p>
              </div>
            </div>
          </div>

          {/* Location & Department */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location & Department
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Location</label>
                <p className="text-lg">{asset.location || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Department</label>
                <p className="text-lg">{asset.department || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Important Dates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Purchase Date</label>
                <p className="text-lg">{asset.purchase_date}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Warranty Expiry</label>
                <p className="text-lg">{asset.warranty_expiry || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Vendor & Serial Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Vendor & Serial Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Vendor</label>
                <p className="text-lg">{asset.vendor || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Serial Number</label>
                <p className="text-lg">{asset.serial_number || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Condition & Maintenance */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Condition & Maintenance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Condition</label>
                <div className="mt-1">{getConditionBadge(asset.condition)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Maintenance Schedule</label>
                <p className="text-lg">{asset.maintenance_schedule || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          {asset.description && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Description</h3>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                {asset.description}
              </p>
            </div>
          )}

          {/* System Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-sm text-gray-600">{new Date(asset.created_at).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-sm text-gray-600">{new Date(asset.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 