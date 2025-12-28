
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Save, Upload, Receipt } from "lucide-react";

interface ExpenseLineItem {
  id: string;
  categoryId: string;
  description: string;
  amount: number;
  expenseDate: string;
  receiptUrl?: string;
  billableToCustomer: boolean;
  customerId?: string;
}

export const ExpenseForm = ({ onClose }: { onClose: () => void }) => {
  const [expenseData, setExpenseData] = useState({
    reportNumber: `EXP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    employeeId: "current_user",
    reportDate: new Date().toISOString().split('T')[0],
    description: "",
    status: "draft"
  });

  const [lineItems, setLineItems] = useState<ExpenseLineItem[]>([
    {
      id: "1",
      categoryId: "",
      description: "",
      amount: 0,
      expenseDate: new Date().toISOString().split('T')[0],
      billableToCustomer: false
    }
  ]);

  const categories = [
    { id: "1", name: "Travel & Transportation", requiresReceipt: true },
    { id: "2", name: "Meals & Entertainment", requiresReceipt: true },
    { id: "3", name: "Office Supplies", requiresReceipt: false },
    { id: "4", name: "Software & Subscriptions", requiresReceipt: true },
    { id: "5", name: "Marketing & Advertising", requiresReceipt: false },
    { id: "6", name: "Professional Services", requiresReceipt: true }
  ];

  const customers = [
    { id: "1", name: "ABC Corporation" },
    { id: "2", name: "XYZ Industries" },
    { id: "3", name: "Tech Solutions Ltd" }
  ];

  const addLineItem = () => {
    const newItem: ExpenseLineItem = {
      id: Date.now().toString(),
      categoryId: "",
      description: "",
      amount: 0,
      expenseDate: new Date().toISOString().split('T')[0],
      billableToCustomer: false
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof ExpenseLineItem, value: any) => {
    setLineItems(lineItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);

  const handleSave = (status: string) => {
    const expense = {
      ...expenseData,
      status,
      lineItems,
      totalAmount
    };
    console.log("Saving expense:", expense);
    onClose();
  };

  const handleReceiptUpload = (itemId: string, file: File) => {
    // Simulate file upload
    const url = URL.createObjectURL(file);
    updateLineItem(itemId, "receiptUrl", url);
  };

  return (
    <Card className="max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          Expense Report
          <Badge variant="outline" className="ml-auto">
            {expenseData.status.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Header Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="reportNumber">Report Number</Label>
            <Input
              id="reportNumber"
              value={expenseData.reportNumber}
              onChange={(e) => setExpenseData({...expenseData, reportNumber: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="reportDate">Report Date</Label>
            <Input
              id="reportDate"
              type="date"
              value={expenseData.reportDate}
              onChange={(e) => setExpenseData({...expenseData, reportDate: e.target.value})}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Report Description</Label>
          <Input
            id="description"
            placeholder="Business trip, client meeting, etc."
            value={expenseData.description}
            onChange={(e) => setExpenseData({...expenseData, description: e.target.value})}
          />
        </div>

        {/* Expense Line Items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Expense Items</h3>
            <Button onClick={addLineItem} size="sm" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Expense
            </Button>
          </div>
          
          <div className="space-y-4">
            {lineItems.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={item.categoryId}
                      onValueChange={(value) => updateLineItem(item.id, "categoryId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Expense Date</Label>
                    <Input
                      type="date"
                      value={item.expenseDate}
                      onChange={(e) => updateLineItem(item.id, "expenseDate", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.amount}
                      onChange={(e) => updateLineItem(item.id, "amount", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex items-end">
                    {lineItems.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeLineItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="mt-4">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Description of the expense..."
                    value={item.description}
                    onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.billableToCustomer}
                        onChange={(e) => updateLineItem(item.id, "billableToCustomer", e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Billable to customer</span>
                    </label>
                    
                    {item.billableToCustomer && (
                      <Select
                        value={item.customerId || ""}
                        onValueChange={(value) => updateLineItem(item.id, "customerId", value)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id={`receipt-${item.id}`}
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleReceiptUpload(item.id, file);
                      }}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById(`receipt-${item.id}`)?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      {item.receiptUrl ? "Update Receipt" : "Upload Receipt"}
                    </Button>
                    {item.receiptUrl && (
                      <Badge variant="outline" className="text-green-600">
                        Attached
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-end">
          <div className="w-64 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-lg font-bold">
              <span>Total Amount:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleSave("draft")}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Draft
            </Button>
            <Button 
              onClick={() => handleSave("submitted")}
              className="flex items-center gap-2"
            >
              Submit for Approval
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
