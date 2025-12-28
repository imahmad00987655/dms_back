import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export interface ReceiptFormData {
  receiptNumber: string;
  receiptDate: string;
  customer: string;
  invoiceNumber: string;
  amount: string;
  paymentMethod: string;
  bankAccount: string;
  checkNumber: string;
  reference: string;
  description: string;
  currency: string;
  status: string;
}

interface ReceiptFormFieldsProps {
  formData: ReceiptFormData;
  setFormData: (updater: (prev: ReceiptFormData) => ReceiptFormData) => void;
  mode?: 'create' | 'view';
}

export const ReceiptFormFields = ({ formData, setFormData, mode = 'create' }: ReceiptFormFieldsProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="receiptNumber">Receipt Number</Label>
          {mode === 'view' ? (
            <div className="p-3 border rounded-md bg-gray-50 text-gray-900">
              {formData.receiptNumber}
            </div>
          ) : (
          <Input
            id="receiptNumber"
            value={formData.receiptNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, receiptNumber: e.target.value }))}
            required
          />
          )}
        </div>

        <div>
          <Label htmlFor="receiptDate">Receipt Date</Label>
          {mode === 'view' ? (
            <div className="p-3 border rounded-md bg-gray-50 text-gray-900">
              {formData.receiptDate}
            </div>
          ) : (
          <Input
            id="receiptDate"
            type="date"
            value={formData.receiptDate}
            onChange={(e) => setFormData(prev => ({ ...prev, receiptDate: e.target.value }))}
            required
          />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="customer">Customer</Label>
          {mode === 'view' ? (
            <div className="p-3 border rounded-md bg-gray-50 text-gray-900">
              {formData.customer}
            </div>
          ) : (
          <Input
            id="customer"
            value={formData.customer}
            onChange={(e) => setFormData(prev => ({ ...prev, customer: e.target.value }))}
            placeholder="Enter customer name"
            required
          />
          )}
        </div>

        <div>
          <Label htmlFor="invoiceNumber">Invoice Number</Label>
          {mode === 'view' ? (
            <div className="p-3 border rounded-md bg-gray-50 text-gray-900">
              {formData.invoiceNumber}
            </div>
          ) : (
          <Input
            id="invoiceNumber"
            value={formData.invoiceNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
            placeholder="INV-2024-001"
          />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Amount Received</Label>
          {mode === 'view' ? (
            <div className="p-3 border rounded-md bg-gray-50 text-gray-900">
              ${Number(formData.amount || 0).toFixed(2)}
            </div>
          ) : (
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            placeholder="0.00"
            required
          />
          )}
        </div>

        <div>
          <Label htmlFor="currency">Currency</Label>
          {mode === 'view' ? (
            <div className="p-3 border rounded-md bg-gray-50 text-gray-900">
              {formData.currency}
            </div>
          ) : (
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
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="paymentMethod">Payment Method</Label>
          {mode === 'view' ? (
            <div className="p-3 border rounded-md bg-gray-50 text-gray-900">
              {formData.paymentMethod === 'BANK_TRANSFER' ? 'Bank Transfer' :
               formData.paymentMethod === 'CREDIT_CARD' ? 'Credit Card' :
               formData.paymentMethod === 'CHECK' ? 'Check' :
               formData.paymentMethod === 'CASH' ? 'Cash' :
               formData.paymentMethod === 'ACH' ? 'ACH' :
               formData.paymentMethod === 'WIRE' ? 'Wire Transfer' :
               formData.paymentMethod}
            </div>
          ) : (
          <Select value={formData.paymentMethod} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
              <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
              <SelectItem value="CHECK">Check</SelectItem>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="ACH">ACH</SelectItem>
              <SelectItem value="WIRE">Wire Transfer</SelectItem>
            </SelectContent>
          </Select>
          )}
        </div>

        <div>
          <Label htmlFor="bankAccount">Bank Account</Label>
          {mode === 'view' ? (
            <div className="p-3 border rounded-md bg-gray-50 text-gray-900">
              {formData.bankAccount === 'checking-main' ? 'Main Checking (****1234)' :
               formData.bankAccount === 'savings' ? 'Savings Account (****5678)' :
               formData.bankAccount === 'merchant' ? 'Merchant Account (****9012)' :
               formData.bankAccount}
            </div>
          ) : (
          <Select value={formData.bankAccount} onValueChange={(value) => setFormData(prev => ({ ...prev, bankAccount: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select bank account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="checking-main">Main Checking (****1234)</SelectItem>
              <SelectItem value="savings">Savings Account (****5678)</SelectItem>
              <SelectItem value="merchant">Merchant Account (****9012)</SelectItem>
            </SelectContent>
          </Select>
          )}
        </div>
      </div>

      {formData.paymentMethod === "CHECK" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="checkNumber">Check Number</Label>
            {mode === 'view' ? (
              <div className="p-3 border rounded-md bg-gray-50 text-gray-900">
                {formData.checkNumber}
              </div>
            ) : (
            <Input
              id="checkNumber"
              value={formData.checkNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, checkNumber: e.target.value }))}
              placeholder="Check number"
            />
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="reference">Reference Number</Label>
          {mode === 'view' ? (
            <div className="p-3 border rounded-md bg-gray-50 text-gray-900">
              {formData.reference}
            </div>
          ) : (
          <Input
            id="reference"
            value={formData.reference}
            onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
            placeholder="Payment reference"
          />
          )}
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          {mode === 'view' ? (
            <div className="p-3 border rounded-md bg-gray-50 text-gray-900">
              {formData.status === 'DRAFT' ? 'Draft' :
               formData.status === 'CONFIRMED' ? 'Confirmed' :
               formData.status === 'CLEARED' ? 'Cleared' :
               formData.status === 'REVERSED' ? 'Reversed' :
               formData.status === 'CANCELLED' ? 'Cancelled' :
               formData.status}
            </div>
          ) : (
          <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="CLEARED">Cleared</SelectItem>
              <SelectItem value="REVERSED">Reversed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="description">Notes</Label>
        {mode === 'view' ? (
          <div className="p-3 border rounded-md bg-gray-50 text-gray-900 min-h-[80px]">
            {formData.description}
          </div>
        ) : (
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Payment notes or description..."
          rows={3}
        />
        )}
      </div>
    </div>
  );
};
