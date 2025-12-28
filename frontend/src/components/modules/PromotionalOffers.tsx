import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gift, Percent, Package, TrendingUp, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PromotionForm } from "@/components/forms/PromotionForm";

const promotions = [
  {
    id: "PROMO-001",
    name: "Summer Sale - Electronics",
    type: "Percentage Discount",
    discountValue: 20,
    startDate: "2024-06-01",
    endDate: "2024-06-30",
    status: "active",
    usageCount: 45,
    maxUsage: 100,
    totalSavings: 125000,
    applicableProducts: ["Smartphones", "Laptops", "Headphones"]
  },
  {
    id: "PROMO-002",
    name: "Buy 1 Get 1 - Office Supplies",
    type: "BOGO",
    discountValue: 0,
    startDate: "2024-06-15",
    endDate: "2024-07-15",
    status: "active",
    usageCount: 23,
    maxUsage: 50,
    totalSavings: 45000,
    applicableProducts: ["Office Chairs", "Desk Lamps"]
  },
  {
    id: "PROMO-003",
    name: "Flat ₹500 Off on Orders Above ₹5000",
    type: "Fixed Amount",
    discountValue: 500,
    startDate: "2024-05-01",
    endDate: "2024-05-31",
    status: "expired",
    usageCount: 67,
    maxUsage: 200,
    totalSavings: 33500,
    applicableProducts: ["All Products"]
  },
  {
    id: "PROMO-004",
    name: "Bundle Deal - Laptop + Mouse + Bag",
    type: "Bundle Offer",
    discountValue: 15000,
    startDate: "2024-06-10",
    endDate: "2024-07-10",
    status: "active",
    usageCount: 8,
    maxUsage: 25,
    totalSavings: 18000,
    applicableProducts: ["Laptop Bundle"]
  }
];

const promotionTypes = [
  { value: "all", label: "All Types" },
  { value: "percentage", label: "Percentage Discount" },
  { value: "fixed", label: "Fixed Amount" },
  { value: "bogo", label: "Buy One Get One" },
  { value: "bundle", label: "Bundle Offers" }
];

export const PromotionalOffers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showPromotionForm, setShowPromotionForm] = useState(false);

  const filteredPromotions = promotions.filter(promo => {
    const matchesSearch = promo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         promo.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || promo.type.toLowerCase().includes(selectedType);
    const matchesStatus = selectedStatus === "all" || promo.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "expired":
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case "paused":
        return <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "percentage discount":
        return <Percent className="w-4 h-4" />;
      case "bogo":
        return <Gift className="w-4 h-4" />;
      case "bundle offer":
        return <Package className="w-4 h-4" />;
      default:
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  const totalActivePromotions = promotions.filter(p => p.status === "active").length;
  const totalSavingsThisMonth = promotions.reduce((sum, p) => sum + p.totalSavings, 0);
  const totalUsageThisMonth = promotions.reduce((sum, p) => sum + p.usageCount, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">OfferFlow</h1>
          <p className="text-gray-500 mt-1">Manage promotional offers and boost sales</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Analytics
          </Button>
          <Button 
            className="flex items-center gap-2"
            onClick={() => setShowPromotionForm(true)}
          >
            <Plus className="w-4 h-4" />
            Create Promotion
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Promotions</CardTitle>
            <Gift className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalActivePromotions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <TrendingUp className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalSavingsThisMonth.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usage Count</CardTitle>
            <Package className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsageThisMonth}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Discount</CardTitle>
            <Percent className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15.2%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="promotions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="promotions">All Promotions</TabsTrigger>
          <TabsTrigger value="active">Active Offers</TabsTrigger>
          <TabsTrigger value="analytics">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="promotions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search promotions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {promotionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Promotion Details</TableHead>
                    <TableHead>Type & Value</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Savings</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPromotions.map((promotion) => (
                    <TableRow key={promotion.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{promotion.name}</div>
                          <div className="text-sm text-gray-500">{promotion.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(promotion.type)}
                          <div>
                            <div className="font-medium">{promotion.type}</div>
                            <div className="text-sm text-gray-600">
                              {promotion.type === "Percentage Discount" ? `${promotion.discountValue}%` :
                               promotion.type === "Fixed Amount" ? `₹${promotion.discountValue}` :
                               promotion.type === "Bundle Offer" ? `Save ₹${promotion.discountValue}` : 
                               "1+1 Free"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{promotion.startDate}</div>
                          to <div>{promotion.endDate}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{promotion.usageCount}/{promotion.maxUsage}</div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(promotion.usageCount / promotion.maxUsage) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>₹{promotion.totalSavings.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {promotion.applicableProducts.slice(0, 2).map(product => (
                            <Badge key={product} variant="outline" className="mr-1 mb-1 text-xs">
                              {product}
                            </Badge>
                          ))}
                          {promotion.applicableProducts.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{promotion.applicableProducts.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(promotion.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline">View</Button>
                          <Button size="sm" variant="outline">Edit</Button>
                          {promotion.status === "active" && (
                            <Button size="sm" variant="outline" className="text-red-600">
                              Pause
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Currently Active Promotions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {promotions.filter(p => p.status === "active").map((promotion) => (
                  <Card key={promotion.id} className="border-2 border-green-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(promotion.type)}
                        <CardTitle className="text-lg">{promotion.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Type:</span>
                          <span className="text-sm font-medium">{promotion.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Usage:</span>
                          <span className="text-sm font-medium">{promotion.usageCount}/{promotion.maxUsage}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Savings:</span>
                          <span className="text-sm font-medium">₹{promotion.totalSavings.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Expires:</span>
                          <span className="text-sm font-medium">{promotion.endDate}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Promotion Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Performance analytics and insights will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PromotionForm 
        isOpen={showPromotionForm} 
        onClose={() => setShowPromotionForm(false)} 
      />
    </div>
  );
};
