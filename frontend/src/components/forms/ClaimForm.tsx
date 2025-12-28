
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, User, Package, DollarSign, FileText, Calendar } from "lucide-react";

interface ClaimFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClaimForm = ({ isOpen, onClose }: ClaimFormProps) => {
  const [formData, setFormData] = useState({
    claimNumber: "",
    customerName: "",
    customerContact: "",
    claimType: "",
    priority: "",
    claimAmount: "",
    expectedResolution: "",
    description: "",
    productItems: "",
    assignedTo: "",
    attachments: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Claim Form Data:", formData);
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
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <SheetTitle className="text-xl font-bold">Create New Claim</SheetTitle>
              <SheetDescription>Submit a new inventory claim for resolution</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Claim Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Claim Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="claimNumber">Claim Number</Label>
                  <Input
                    id="claimNumber"
                    placeholder="CLM-2024-005"
                    value={formData.claimNumber}
                    onChange={(e) => handleInputChange("claimNumber", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="claimType">Claim Type</Label>
                  <Select value={formData.claimType} onValueChange={(value) => handleInputChange("claimType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Claim Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="damaged">Damaged Product</SelectItem>
                      <SelectItem value="defective">Defective Product</SelectItem>
                      <SelectItem value="missing">Missing Items</SelectItem>
                      <SelectItem value="wrong_item">Wrong Item Delivered</SelectItem>
                      <SelectItem value="expired">Expired Products</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="claimAmount">Claim Amount (₹)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="claimAmount"
                      type="number"
                      placeholder="15000"
                      className="pl-10"
                      value={formData.claimAmount}
                      onChange={(e) => handleInputChange("claimAmount", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    placeholder="ABC Electronics Store"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange("customerName", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerContact">Contact Information</Label>
                  <Input
                    id="customerContact"
                    placeholder="Email or Phone"
                    value={formData.customerContact}
                    onChange={(e) => handleInputChange("customerContact", e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product & Assignment */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Product & Assignment
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="productItems">Product Items</Label>
                  <Input
                    id="productItems"
                    placeholder="iPhone 14, Samsung Galaxy S23 (comma separated)"
                    value={formData.productItems}
                    onChange={(e) => handleInputChange("productItems", e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assignedTo">Assign To</Label>
                    <Select value={formData.assignedTo} onValueChange={(value) => handleInputChange("assignedTo", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Team Member" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sarah_johnson">Sarah Johnson</SelectItem>
                        <SelectItem value="mike_wilson">Mike Wilson</SelectItem>
                        <SelectItem value="john_smith">John Smith</SelectItem>
                        <SelectItem value="lisa_chen">Lisa Chen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expectedResolution">Expected Resolution Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="expectedResolution"
                        type="date"
                        className="pl-10"
                        value={formData.expectedResolution}
                        onChange={(e) => handleInputChange("expectedResolution", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description & Attachments */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Details & Documentation
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Detailed Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide detailed information about the claim..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    required
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attachments">Supporting Documents</Label>
                  <Input
                    id="attachments"
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    onChange={(e) => handleInputChange("attachments", e.target.value)}
                  />
                  <p className="text-sm text-gray-500">Upload photos, receipts, or other supporting documents</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700">
              Submit Claim
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
