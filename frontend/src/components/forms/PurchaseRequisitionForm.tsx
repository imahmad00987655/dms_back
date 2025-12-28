import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import apiService from '../../services/api.js';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface PurchaseRequisition {
  requisition_id?: number;
  requisition_number?: string;
  requester_id?: number;
  buyer_id?: number;
  department_id?: number;
  need_by_date?: string;
  urgency?: string;
  currency_code?: string;
  exchange_rate?: number;
  total_amount?: number;
  description?: string;
  justification?: string;
  notes?: string;
  status?: string;
  approval_status?: string;
  lines?: RequisitionLine[];
}

interface PurchaseRequisitionFormProps {
  requisition?: PurchaseRequisition | null;
  users: User[];
  onSave: () => void;
  onCancel: () => void;
}

interface RequisitionLine {
  line_number: number;
  item_id?: number;
  item_name: string;
  item_code?: string;
  description: string;
  quantity: number;
  uom: string;
  unit_price: number;
  line_amount: number;
  need_by_date: string;
  suggested_supplier: string;
}

export const PurchaseRequisitionForm: React.FC<PurchaseRequisitionFormProps> = ({
  requisition,
  users,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    requisition_number: '',
    requester_id: '',
    buyer_id: '',
    department_id: '',
    need_by_date: '',
    urgency: 'MEDIUM',
    currency_code: 'USD',
    exchange_rate: '1.0',
    total_amount: '0',
    description: '',
    justification: '',
    notes: '',
    status: 'DRAFT',
    approval_status: 'PENDING'
  });
  const [lines, setLines] = useState<RequisitionLine[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Mock inventory items - in a real app, this would come from props or API
  const inventoryItems = [
    { item_id: 1, item_code: 'ITEM001', item_name: 'Laptop Computer', uom: 'EA' },
    { item_id: 2, item_code: 'ITEM002', item_name: 'Office Chair', uom: 'EA' },
    { item_id: 3, item_code: 'ITEM003', item_name: 'Printer Paper', uom: 'BOX' },
    { item_id: 4, item_code: 'ITEM004', item_name: 'Ink Cartridges', uom: 'EA' },
    { item_id: 5, item_code: 'ITEM005', item_name: 'Desk Lamp', uom: 'EA' },
  ];

  const uomOptions = ['EA', 'BOX', 'KG', 'L', 'M', 'PCS', 'SET', 'ROLL', 'BAG', 'CAN'];

  useEffect(() => {
    if (requisition) {
      setFormData({
        requisition_number: requisition.requisition_number || '',
        requester_id: requisition.requester_id?.toString() || '',
        buyer_id: requisition.buyer_id?.toString() || '',
        department_id: requisition.department_id?.toString() || '',
        need_by_date: requisition.need_by_date ? requisition.need_by_date.split('T')[0] : '',
        urgency: requisition.urgency || 'MEDIUM',
        currency_code: requisition.currency_code || 'USD',
        exchange_rate: requisition.exchange_rate?.toString() || '1.0',
        total_amount: requisition.total_amount?.toString() || '0',
        description: requisition.description || '',
        justification: requisition.justification || '',
        notes: requisition.notes || '',
        status: requisition.status || 'DRAFT',
        approval_status: requisition.approval_status || 'PENDING'
      });
      setLines(requisition.lines || []);
    }
  }, [requisition]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addLine = () => {
    const newLine: RequisitionLine = {
      line_number: lines.length + 1,
      item_id: undefined,
      item_name: '',
      item_code: `ITEM${String(lines.length + 1).padStart(3, '0')}`,
      description: '',
      quantity: 1,
      uom: 'EA',
      unit_price: 0,
      line_amount: 0,
      need_by_date: '',
      suggested_supplier: ''
    };
    setLines([...lines, newLine]);
  };

  const removeLine = (index: number) => {
    const newLines = lines.filter((_, i) => i !== index);
    // Renumber lines
    const renumberedLines = newLines.map((line, i) => ({
      ...line,
      line_number: i + 1
    }));
    setLines(renumberedLines);
  };

  const updateLine = (index: number, field: keyof RequisitionLine, value: string | number) => {
    const newLines = [...lines];
    newLines[index] = {
      ...newLines[index],
      [field]: value
    };
    
    // Calculate line amount
    if (field === 'quantity' || field === 'unit_price') {
      const quantity = field === 'quantity' ? Number(value) : newLines[index].quantity;
      const unitPrice = field === 'unit_price' ? Number(value) : newLines[index].unit_price;
      newLines[index].line_amount = quantity * unitPrice;
    }
    
    setLines(newLines);
    
    // Calculate total amount
    const total = newLines.reduce((sum, line) => sum + (line.line_amount || 0), 0);
    setFormData(prev => ({
      ...prev,
      total_amount: total.toString()
    }));
  };

  const validateForm = () => {
    if (!formData.requisition_number.trim()) {
      toast({
        title: "Validation Error",
        description: "Requisition number is required",
        variant: "destructive"
      });
      return false;
    }
    if (!formData.requester_id) {
      toast({
        title: "Validation Error",
        description: "Requester is required",
        variant: "destructive"
      });
      return false;
    }
    if (!formData.need_by_date) {
      toast({
        title: "Validation Error",
        description: "Need by date is required",
        variant: "destructive"
      });
      return false;
    }
    if (lines.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one line item is required",
        variant: "destructive"
      });
      return false;
    }
    
    // Validate line items
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.item_name.trim()) {
        toast({
          title: "Validation Error",
          description: `Item name is required for line ${i + 1}`,
          variant: "destructive"
        });
        return false;
      }
      if (line.quantity <= 0) {
        toast({
          title: "Validation Error",
          description: `Quantity must be greater than 0 for line ${i + 1}`,
          variant: "destructive"
        });
        return false;
      }
      if (line.unit_price < 0) {
        toast({
          title: "Validation Error",
          description: `Unit price cannot be negative for line ${i + 1}`,
          variant: "destructive"
        });
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        total_amount: parseFloat(formData.total_amount),
        exchange_rate: parseFloat(formData.exchange_rate),
        requester_id: parseInt(formData.requester_id),
        buyer_id: formData.buyer_id ? parseInt(formData.buyer_id) : null,
        department_id: formData.department_id ? parseInt(formData.department_id) : null,
        lines: lines.map(line => ({
          ...line,
          quantity: parseFloat(line.quantity.toString()),
          unit_price: parseFloat(line.unit_price.toString()),
          line_amount: parseFloat(line.line_amount.toString())
        }))
      };

      if (requisition) {
        await apiService.updatePurchaseRequisition(requisition.requisition_id, payload);
        toast({
          title: "Success",
          description: "Purchase requisition updated successfully"
        });
      } else {
        await apiService.createPurchaseRequisition(payload);
        toast({
          title: "Success",
          description: "Purchase requisition created successfully"
        });
      }
      
      onSave();
    } catch (error: unknown) {
      console.error('Error saving requisition:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save requisition";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Basic Information */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="requisition_number" className="text-sm">Requisition Number *</Label>
              <Input
                id="requisition_number"
                value={formData.requisition_number}
                onChange={(e) => handleInputChange('requisition_number', e.target.value)}
                placeholder="Enter requisition number"
                required
                className="h-9"
              />
            </div>

            <div>
              <Label htmlFor="requester_id" className="text-sm">Requester *</Label>
              <Select value={formData.requester_id} onValueChange={(value) => handleInputChange('requester_id', value)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select requester" />
                </SelectTrigger>
                <SelectContent>
                  {users && users.length > 0 ? (
                    users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.first_name} {user.last_name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-users" disabled>No users available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="buyer_id" className="text-sm">Buyer</Label>
              <Select value={formData.buyer_id} onValueChange={(value) => handleInputChange('buyer_id', value)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select buyer (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {users && users.length > 0 ? (
                    users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.first_name} {user.last_name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-users" disabled>No users available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="need_by_date" className="text-sm">Need By Date *</Label>
              <Input
                id="need_by_date"
                type="date"
                value={formData.need_by_date}
                onChange={(e) => handleInputChange('need_by_date', e.target.value)}
                required
                className="h-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="urgency" className="text-sm">Urgency *</Label>
              <Select value={formData.urgency} onValueChange={(value) => handleInputChange('urgency', value)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="currency_code" className="text-sm">Currency</Label>
              <Select value={formData.currency_code} onValueChange={(value) => handleInputChange('currency_code', value)}>
                <SelectTrigger className="h-9">
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

            <div>
              <Label htmlFor="exchange_rate" className="text-sm">Exchange Rate</Label>
              <Input
                id="exchange_rate"
                type="number"
                step="0.01"
                min="0"
                value={formData.exchange_rate}
                onChange={(e) => handleInputChange('exchange_rate', e.target.value)}
                placeholder="1.00"
                className="h-9"
              />
            </div>

            <div>
              <Label htmlFor="total_amount" className="text-sm">Total Amount</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.total_amount}
                onChange={(e) => handleInputChange('total_amount', e.target.value)}
                placeholder="0.00"
                readOnly
                className="h-9 bg-gray-50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="status" className="text-sm">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="approval_status" className="text-sm">Approval Status</Label>
              <Select value={formData.approval_status} onValueChange={(value) => handleInputChange('approval_status', value)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select approval status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description and Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Description & Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="description" className="text-sm">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter requisition description"
              rows={2}
              className="resize-none"
            />
          </div>

          <div>
            <Label htmlFor="justification" className="text-sm">Justification</Label>
            <Textarea
              id="justification"
              value={formData.justification}
              onChange={(e) => handleInputChange('justification', e.target.value)}
              placeholder="Enter justification for the requisition"
              rows={2}
              className="resize-none"
            />
          </div>

          <div>
            <Label htmlFor="notes" className="text-sm">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Enter additional notes"
              rows={2}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Line Items</CardTitle>
          <CardDescription className="text-sm">
            Add items to be purchased
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button type="button" variant="outline" onClick={addLine} className="w-full h-9">
              <Plus className="h-4 w-4 mr-2" />
              Add Line Item
            </Button>

            {lines.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16 text-xs">Line</TableHead>
                        <TableHead className="w-48 text-xs">Item *</TableHead>
                        <TableHead className="w-48 text-xs">Description</TableHead>
                        <TableHead className="w-20 text-xs">Qty *</TableHead>
                        <TableHead className="w-20 text-xs">UOM</TableHead>
                        <TableHead className="w-32 text-xs">Unit Price</TableHead>
                        <TableHead className="w-32 text-xs">Amount</TableHead>
                        <TableHead className="w-32 text-xs">Need By</TableHead>
                        <TableHead className="w-48 text-xs">Supplier</TableHead>
                        <TableHead className="w-16 text-xs">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((line, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-xs">{line.line_number}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Input
                                value={line.item_code || `ITEM${String(index + 1).padStart(3, '0')}`}
                                placeholder="Item Code"
                                className="h-9 text-sm min-w-[100px]"
                                readOnly
                              />
                              <Input
                                value={line.item_name}
                                onChange={(e) => updateLine(index, 'item_name', e.target.value)}
                                placeholder="Enter item name"
                                className="h-9 text-sm min-w-[180px]"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={line.description}
                              onChange={(e) => updateLine(index, 'description', e.target.value)}
                              placeholder="Description"
                              className="h-9 text-sm min-w-[180px]"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={line.quantity}
                              onChange={(e) => updateLine(index, 'quantity', parseInt(e.target.value) || 0)}
                              required
                              className="h-9 text-sm min-w-[80px]"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={line.uom}
                              onValueChange={(value) => updateLine(index, 'uom', value)}
                            >
                              <SelectTrigger className="h-9 text-sm min-w-[80px]">
                                <SelectValue placeholder="UOM" />
                              </SelectTrigger>
                              <SelectContent>
                                {uomOptions.map((uom) => (
                                  <SelectItem key={uom} value={uom}>
                                    {uom}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={line.unit_price}
                              onChange={(e) => updateLine(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="h-9 text-sm min-w-[100px]"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={line.line_amount}
                              readOnly
                              className="h-9 text-sm min-w-[100px] bg-gray-50"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={line.need_by_date}
                              onChange={(e) => updateLine(index, 'need_by_date', e.target.value)}
                              className="h-9 text-sm min-w-[120px]"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={line.suggested_supplier}
                              onChange={(e) => updateLine(index, 'suggested_supplier', e.target.value)}
                              placeholder="Suggested supplier"
                              className="h-9 text-sm min-w-[180px]"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeLine(index)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
        <Button type="button" variant="outline" onClick={onCancel} className="h-9">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="h-9">
          {loading ? 'Saving...' : (requisition ? 'Update Requisition' : 'Create Requisition')}
        </Button>
      </div>
    </form>
  );
}; 