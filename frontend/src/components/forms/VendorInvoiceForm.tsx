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
import { Plus, Trash2, Save, Send, FileText } from "lucide-react";
import apiService from '@/services/api';

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export const VendorInvoiceForm = ({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) => {
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: `VEND-INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    vendorName: "",
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: "",
    paymentTerms: "30",
    notes: "",
    status: "pending"
  });

  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { id: "1", description: "", quantity: 1, unitPrice: 0, lineTotal: 0 }
  ]);

  const addLineItem = () => {
    const newItem: InvoiceLineItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      unitPrice: 0,
      lineTotal: 0
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof InvoiceLineItem, value: string | number) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === "quantity" || field === "unitPrice") {
          updatedItem.lineTotal = Number(updatedItem.quantity) * Number(updatedItem.unitPrice);
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const taxAmount = subtotal * 0.08; // 8% tax
  const total = subtotal + taxAmount;

  const handleSave = async (status: string) => {
    const invoice = {
      invoice_number: invoiceData.invoiceNumber,
      vendor_name: invoiceData.vendorName,
      invoice_date: invoiceData.invoiceDate,
      due_date: invoiceData.dueDate,
      payment_terms: Number(invoiceData.paymentTerms),
      notes: invoiceData.notes,
      status: "pending",
      subtotal,
      tax_amount: taxAmount,
      total,
      line_items: lineItems
    };

    try {
      await apiService.createVendorInvoice(invoice);
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      alert('Failed to save vendor invoice');
    }
  };

  return (
    <Card className="max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Create Vendor Invoice
          <Badge variant="outline" className="ml-auto">
            {invoiceData.status.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Header Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="invoiceNumber">Invoice Number</Label>
            <Input
              id="invoiceNumber"
              value={invoiceData.invoiceNumber}
              onChange={(e) => setInvoiceData({...invoiceData, invoiceNumber: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="vendorName">Vendor Name</Label>
            <Input
              id="vendorName"
              placeholder="Enter vendor name"
              value={invoiceData.vendorName}
              onChange={(e) => setInvoiceData({ ...invoiceData, vendorName: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="paymentTerms">Payment Terms (Days)</Label>
            <Select
              value={invoiceData.paymentTerms}
              onValueChange={(value) => setInvoiceData({...invoiceData, paymentTerms: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">Net 15</SelectItem>
                <SelectItem value="30">Net 30</SelectItem>
                <SelectItem value="45">Net 45</SelectItem>
                <SelectItem value="60">Net 60</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="invoiceDate">Invoice Date</Label>
            <Input
              id="invoiceDate"
              type="date"
              value={invoiceData.invoiceDate}
              onChange={(e) => setInvoiceData({...invoiceData, invoiceDate: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={invoiceData.dueDate}
              onChange={(e) => setInvoiceData({...invoiceData, dueDate: e.target.value})}
            />
          </div>
        </div>

        {/* Line Items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Line Items</h3>
            <Button onClick={addLineItem} size="sm" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-medium">Description</th>
                  <th className="text-center p-3 font-medium w-24">Qty</th>
                  <th className="text-right p-3 font-medium w-32">Unit Price</th>
                  <th className="text-right p-3 font-medium w-32">Line Total</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, index) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-3">
                      <Input
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                        className="text-center"
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                        className="text-right"
                      />
                    </td>
                    <td className="p-3 text-right font-medium">
                      ${item.lineTotal.toFixed(2)}
                    </td>
                    <td className="p-3">
                      {lineItems.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLineItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-80 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (8%):</span>
              <span className="font-medium">${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Additional notes or payment instructions..."
            value={invoiceData.notes}
            onChange={(e) => setInvoiceData({...invoiceData, notes: e.target.value})}
            rows={3}
          />
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
              onClick={() => handleSave("sent")}
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send Invoice
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 