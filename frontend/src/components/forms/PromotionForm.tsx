
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Gift, Percent, Package, Calendar, Target, Tag } from "lucide-react";

interface PromotionFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PromotionForm = ({ isOpen, onClose }: PromotionFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    discountValue: "",
    startDate: "",
    endDate: "",
    maxUsage: "",
    description: "",
    applicableProducts: "",
    minimumOrderValue: "",
    promotionCode: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Promotion Form Data:", formData);
    // Handle form submission here
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <SheetTitle className="text-xl font-bold">Create New Promotion</SheetTitle>
              <SheetDescription>Set up a new promotional offer to boost sales</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Basic Information
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Promotion Name</Label>
                  <Input
                    id="name"
                    placeholder="Summer Sale - Electronics"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promotionCode">Promotion Code</Label>
                  <Input
                    id="promotionCode"
                    placeholder="SUMMER2024"
                    value={formData.promotionCode}
                    onChange={(e) => handleInputChange("promotionCode", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your promotional offer..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Discount Configuration */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Percent className="w-5 h-5" />
                Discount Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Promotion Type</Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage Discount</SelectItem>
                      <SelectItem value="fixed">Fixed Amount Off</SelectItem>
                      <SelectItem value="bogo">Buy One Get One</SelectItem>
                      <SelectItem value="bundle">Bundle Offer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountValue">
                    {formData.type === "percentage" ? "Discount Percentage (%)" : "Discount Amount (₹)"}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    placeholder={formData.type === "percentage" ? "20" : "500"}
                    value={formData.discountValue}
                    onChange={(e) => handleInputChange("discountValue", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumOrderValue">Minimum Order Value (₹)</Label>
                  <Input
                    id="minimumOrderValue"
                    type="number"
                    placeholder="5000"
                    value={formData.minimumOrderValue}
                    onChange={(e) => handleInputChange("minimumOrderValue", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxUsage">Maximum Usage Limit</Label>
                  <Input
                    id="maxUsage"
                    type="number"
                    placeholder="100"
                    value={formData.maxUsage}
                    onChange={(e) => handleInputChange("maxUsage", e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Duration & Products */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Duration & Products
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange("startDate", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange("endDate", e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="applicableProducts">Applicable Products</Label>
                  <Input
                    id="applicableProducts"
                    placeholder="Smartphones, Laptops, Headphones (comma separated)"
                    value={formData.applicableProducts}
                    onChange={(e) => handleInputChange("applicableProducts", e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
              Create Promotion
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
