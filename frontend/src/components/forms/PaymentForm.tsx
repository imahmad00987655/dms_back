
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, CreditCard, DollarSign } from "lucide-react";
import apiService from "@/services/api";
import { toast } from "sonner";
import { generateNextPaymentNumber } from "@/utils/numberGenerator";

interface VendorInvoice {
  id: number;
  invoice_number: string;
  vendor_name: string;
  total: number;
  currency: string;
  notes?: string;
}

interface PaymentFormProps {
  onClose: () => void;
  selectedPayable?: VendorInvoice;
  onSuccess?: () => void;
}

export const PaymentForm = ({ onClose, selectedPayable, onSuccess }: PaymentFormProps) => {
  const [formData, setFormData] = useState({
    paymentType: "vendor-payment",
    paymentMethod: "",
    paymentDate: new Date().toISOString().split('T')[0],
    dueDate: "",
    vendor: selectedPayable?.vendor_name || "",
    customer: "",
    invoiceNumber: selectedPayable?.invoice_number || "",
    amount: selectedPayable?.total?.toString() || "",
    currency: selectedPayable?.currency || "USD",
    bankAccount: "",
    checkNumber: "",
    reference: "",
    description: selectedPayable ? `Payment for ${selectedPayable.invoice_number} - ${selectedPayable.notes || 'Vendor payment'}` : "",
    approver: "",
    status: "pending"
  });

  const paymentNumberGenerated = useRef(false);

  // Auto-generate payment number when form loads
  useEffect(() => {
    if (!paymentNumberGenerated.current) {
      paymentNumberGenerated.current = true;
      generateNextPaymentNumber().then((nextNumber) => {
        setFormData(prev => {
          // Only update if still empty (user hasn't manually entered one)
          if (!prev.reference) {
            return { ...prev, reference: nextNumber };
          }
          return prev;
        });
      }).catch((error) => {
        console.error('Failed to generate payment number:', error);
        paymentNumberGenerated.current = false; // Reset on error so it can retry
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const paymentData = {
        payment_number: formData.reference,
        payment_date: formData.paymentDate,
        vendor_name: formData.vendor,
        invoice_number: formData.invoiceNumber,
        amount_paid: parseFloat(formData.amount),
        currency: formData.currency,
        payment_method: formData.paymentMethod,
        bank_account: formData.bankAccount,
        reference_number: formData.reference,
        status: formData.status,
        description: formData.description,
        notes: formData.description
      };

      await apiService.createPayment(paymentData);
      
      toast.success('Payment created successfully');
      onClose();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Failed to create payment');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Processing
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentType">Payment Type</Label>
                <Select value={formData.paymentType} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendor-payment">Vendor Payment</SelectItem>
                    <SelectItem value="customer-refund">Customer Refund</SelectItem>
                    <SelectItem value="employee-reimbursement">Employee Reimbursement</SelectItem>
                    <SelectItem value="tax-payment">Tax Payment</SelectItem>
                    <SelectItem value="loan-payment">Loan Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={formData.paymentMethod} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="credit-card">Credit Card</SelectItem>
                    <SelectItem value="ach">ACH</SelectItem>
                    <SelectItem value="wire">Wire Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentDate">Payment Date</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>

            {formData.paymentType === "vendor-payment" && (
              <div>
                <Label htmlFor="vendor">Vendor</Label>
                <Select value={formData.vendor} onValueChange={(value) => setFormData(prev => ({ ...prev, vendor: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="acme-corp">ACME Corporation</SelectItem>
                    <SelectItem value="tech-solutions">Tech Solutions Ltd</SelectItem>
                    <SelectItem value="office-supplies">Office Supplies Inc</SelectItem>
                    <SelectItem value="consulting-firm">Consulting Firm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.paymentType === "customer-refund" && (
              <div>
                <Label htmlFor="customer">Customer</Label>
                <Select value={formData.customer} onValueChange={(value) => setFormData(prev => ({ ...prev, customer: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="abc-corp">ABC Corporation</SelectItem>
                    <SelectItem value="startup-co">StartupCo</SelectItem>
                    <SelectItem value="enterprise-ltd">Enterprise Ltd</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoiceNumber">Invoice/Reference Number</Label>
                <Input
                  id="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                  placeholder="INV-2024-001"
                />
              </div>

              <div>
                <Label htmlFor="reference">Payment Reference</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                  placeholder="PAY-2024-001"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bankAccount">Bank Account</Label>
                <Select value={formData.bankAccount} onValueChange={(value) => setFormData(prev => ({ ...prev, bankAccount: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking-main">Main Checking (****1234)</SelectItem>
                    <SelectItem value="savings">Savings Account (****5678)</SelectItem>
                    <SelectItem value="payroll">Payroll Account (****9012)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.paymentMethod === "check" && (
                <div>
                  <Label htmlFor="checkNumber">Check Number</Label>
                  <Input
                    id="checkNumber"
                    value={formData.checkNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, checkNumber: e.target.value }))}
                    placeholder="1001"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="approver">Approver</Label>
                <Select value={formData.approver} onValueChange={(value) => setFormData(prev => ({ ...prev, approver: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select approver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sarah-johnson">Sarah Johnson (CFO)</SelectItem>
                    <SelectItem value="mike-wilson">Mike Wilson (Controller)</SelectItem>
                    <SelectItem value="lisa-chen">Lisa Chen (AP Manager)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processed">Processed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Payment description or notes..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                <DollarSign className="w-4 h-4 mr-2" />
                Process Payment
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
