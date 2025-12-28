
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, HardDrive, TrendingDown, Edit, Trash2, Eye } from "lucide-react";
import { AssetForm } from "@/components/forms/AssetForm";
import { AssetDetailsModal } from "@/components/AssetDetailsModal";
import apiService from "@/services/api";
import { toast } from "sonner";

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

export const FixedAssets = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Fetch assets from API
  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAssets();
      setAssets(response.data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
      toast.error('Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  // Filter assets based on search term
  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.asset_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate statistics
  const totalAssetValue = assets.reduce((sum, asset) => sum + asset.value, 0);
  const totalInsuranceValue = assets.reduce((sum, asset) => sum + (asset.insurance_value || 0), 0);
  const activeAssets = assets.length;

  const getStatusBadge = (condition: string) => {
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

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setShowAssetForm(true);
  };

  const handleDeleteAsset = async (assetId: number) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await apiService.deleteAsset(assetId);
        toast.success('Asset deleted successfully');
        fetchAssets();
      } catch (error) {
        console.error('Error deleting asset:', error);
        toast.error('Failed to delete asset');
      }
    }
  };

  const handleAssetFormClose = () => {
    setShowAssetForm(false);
    setEditingAsset(null);
    fetchAssets(); // Refresh the list after form closes
  };

  const handleViewAsset = (asset: Asset) => {
    setSelectedAsset(asset);
  };

  const handleCloseDetails = () => {
    setSelectedAsset(null);
  };

  if (showAssetForm) {
    return <AssetForm onClose={handleAssetFormClose} />;
  }

  if (selectedAsset) {
    return <AssetDetailsModal asset={selectedAsset} onClose={handleCloseDetails} />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fixed Assets</h1>
          <p className="text-gray-500 mt-1">Manage and track fixed assets with depreciation</p>
        </div>
        <Button onClick={() => setShowAssetForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Asset
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Asset Value</CardTitle>
            <HardDrive className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAssetValue.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Current book value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insurance Value</CardTitle>
            <HardDrive className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalInsuranceValue.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Total insured value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <TrendingDown className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeAssets}</div>
            <p className="text-xs text-gray-500 mt-1">Assets in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <HardDrive className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Set(assets.map(asset => asset.category)).size}
            </div>
            <p className="text-xs text-gray-500 mt-1">Different categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Assets Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Asset</th>
                  <th className="text-left py-3 px-4 font-semibold">Category</th>
                  <th className="text-left py-3 px-4 font-semibold">Purchase Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Value</th>
                  <th className="text-left py-3 px-4 font-semibold">Insurance</th>
                  <th className="text-left py-3 px-4 font-semibold">Depreciation</th>
                  <th className="text-left py-3 px-4 font-semibold">Location</th>
                  <th className="text-left py-3 px-4 font-semibold">Condition</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-500">
                      Loading assets...
                    </td>
                  </tr>
                ) : filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-500">
                      No assets found
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => (
                  <tr key={asset.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{asset.name}</div>
                          <div className="text-sm text-gray-500">{asset.asset_id}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{asset.category}</Badge>
                    </td>
                      <td className="py-3 px-4">{asset.purchase_date}</td>
                    <td className="py-3 px-4 font-semibold">
                        ${asset.value.toLocaleString()}
                    </td>
                      <td className="py-3 px-4 font-semibold text-blue-600">
                        ${(asset.insurance_value || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                          <div className="text-sm">{asset.depreciation_method}</div>
                          <div className="text-xs text-gray-500">{asset.useful_life} years</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{asset.location}</td>
                      <td className="py-3 px-4">{getStatusBadge(asset.condition)}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewAsset(asset)}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditAsset(asset)}
                          >
                            <Edit className="w-3 h-3" />
                        </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteAsset(asset.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
