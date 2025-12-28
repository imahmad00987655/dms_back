
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Truck, Plus, Minus, FileText, Printer } from "lucide-react";

interface LoadFormGenerationProps {
  onClose: () => void;
  selectedDSR?: any;
}

export const LoadFormGeneration = ({ onClose, selectedDSR }: LoadFormGenerationProps) => {
  const [formData, setFormData] = useState({
    loadFormId: `LF-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    dsrId: selectedDSR?.id || "",
    dsrName: selectedDSR?.name || "",
    area: selectedDSR?.area || "",
    vehicle: selectedDSR?.vehicle || "",
    transportDetails: "",
    items: [
      {
        itemName: "",
        quantity: 0,
        primaryPrice: 0,
        secondaryPrice: 0,
        totalValue: 0
      }
    ]
  });

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        itemName: "",
        quantity: 0,
        primaryPrice: 0,
        secondaryPrice: 0,
        totalValue: 0
      }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'secondaryPrice') {
            updatedItem.totalValue = updatedItem.quantity * updatedItem.secondaryPrice;
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const getTotalValue = () => {
    return formData.items.reduce((sum, item) => sum + item.totalValue, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Load form generated:", formData);
    onClose();
  };

  const handlePrint = () => {
    console.log("Printing load form:", formData);
    // Implement PDF generation logic here
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Generate Load Form
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* DSR and Transport Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="loadFormId">Load Form ID</Label>
                <Input
                  id="loadFormId"
                  value={formData.loadFormId}
                  onChange={(e) => setFormData(prev => ({ ...prev, loadFormId: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dsrName">DSR Name</Label>
                <Input
                  id="dsrName"
                  value={formData.dsrName}
                  onChange={(e) => setFormData(prev => ({ ...prev, dsrName: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="area">Area</Label>
                <Input
                  id="area"
                  value={formData.area}
                  onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicle">Vehicle</Label>
                <Input
                  id="vehicle"
                  value={formData.vehicle}
                  onChange={(e) => setFormData(prev => ({ ...prev, vehicle: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="transportDetails">Transport Details</Label>
                <Input
                  id="transportDetails"
                  value={formData.transportDetails}
                  onChange={(e) => setFormData(prev => ({ ...prev, transportDetails: e.target.value }))}
                  placeholder="Route, special instructions, etc."
                />
              </div>
            </div>

            {/* Items Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Load Items</h3>
                <Button type="button" onClick={addItem} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      {formData.items.length > 1 && (
                        <Button 
                          type="button" 
                          onClick={() => removeItem(index)} 
                          variant="outline" 
                          size="sm"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <div>
                        <Label>Item Name</Label>
                        <Select 
                          value={item.itemName} 
                          onValueChange={(value) => updateItem(index, 'itemName', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select item" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="product-a">Product A</SelectItem>
                            <SelectItem value="product-b">Product B</SelectItem>
                            <SelectItem value="product-c">Product C</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </div>

                      <div>
                        <Label>Primary Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.primaryPrice}
                          onChange={(e) => updateItem(index, 'primaryPrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      <div>
                        <Label>Secondary Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.secondaryPrice}
                          onChange={(e) => updateItem(index, 'secondaryPrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      <div>
                        <Label>Total Value</Label>
                        <Input
                          type="number"
                          value={item.totalValue.toFixed(2)}
                          readOnly
                          className="bg-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-end">
                  <div className="text-lg font-semibold">
                    Total Load Value: ${getTotalValue().toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                <FileText className="w-4 h-4 mr-2" />
                Generate Load Form
              </Button>
              <Button type="button" onClick={handlePrint} variant="outline">
                <Printer className="w-4 h-4 mr-2" />
                Print/PDF
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
