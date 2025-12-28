
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, X } from "lucide-react";

interface IntercompanyTransactionFormProps {
  onClose: () => void;
}

export const IntercompanyTransactionForm = ({ onClose }: IntercompanyTransactionFormProps) => {
  const [formData, setFormData] = useState({
    transactionNumber: `IC-${Date.now()}`,
    transactionDate: new Date().toISOString().split('T')[0],
    fromEntity: "",
    toEntity: "",
    transactionType: "",
    description: "",
    amount: "",
    currency: "USD",
    referenceNumber: "",
    invoiceNumber: "",
    status: "pending"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Intercompany transaction submitted:", formData);
    onClose();
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Create Intercompany Transaction
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transactionNumber">Transaction Number</Label>
                <Input
                  id="transactionNumber"
                  value={formData.transactionNumber}
                  onChange={(e) => updateFormData('transactionNumber', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="transactionDate">Transaction Date</Label>
                <Input
                  id="transactionDate"
                  type="date"
                  value={formData.transactionDate}
                  onChange={(e) => updateFormData('transactionDate', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fromEntity">From Entity</Label>
                <Select value={formData.fromEntity} onValueChange={(value) => updateFormData('fromEntity', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entity1">Entity 1 - Main Office</SelectItem>
                    <SelectItem value="entity2">Entity 2 - Branch A</SelectItem>
                    <SelectItem value="entity3">Entity 3 - Branch B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="toEntity">To Entity</Label>
                <Select value={formData.toEntity} onValueChange={(value) => updateFormData('toEntity', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entity1">Entity 1 - Main Office</SelectItem>
                    <SelectItem value="entity2">Entity 2 - Branch A</SelectItem>
                    <SelectItem value="entity3">Entity 3 - Branch B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transactionType">Transaction Type</Label>
                <Select value={formData.transactionType} onValueChange={(value) => updateFormData('transactionType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOAN">Loan</SelectItem>
                    <SelectItem value="RECHARGE">Recharge</SelectItem>
                    <SelectItem value="SERVICE">Service</SelectItem>
                    <SelectItem value="SALE">Sale</SelectItem>
                    <SelectItem value="TRANSFER">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => updateFormData('amount', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Transaction description..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="referenceNumber">Reference Number</Label>
                <Input
                  id="referenceNumber"
                  value={formData.referenceNumber}
                  onChange={(e) => updateFormData('referenceNumber', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={(e) => updateFormData('invoiceNumber', e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                <Building2 className="w-4 h-4 mr-2" />
                Create Transaction
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
