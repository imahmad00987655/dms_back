import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Package, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import apiService from '../../services/api.js';

interface PurchaseOrder {
  header_id: number;
  po_number: string;
  supplier_name: string;
  po_date: string;
  total_amount: number;
  status: string;
  currency_code?: string;
  exchange_rate?: number;
}

interface POLine {
  line_id: number;
  line_number: number;
  item_code: string;
  item_name: string;
  description: string;
  quantity: number;
  uom: string;
  unit_price: number;
  line_amount: number;
  // Optional tax fields coming from the Purchase Order line
  tax_rate?: number;
  tax_amount?: number;
  quantity_received: number;
  quantity_remaining: number;
}

interface GRNLine {
  line_id: number;
  line_number: number;
  item_code: string;
  item_name: string;
  description: string;
  uom: string;
  quantity_ordered: number;
  quantity_received: number;
  quantity_accepted: number;
  quantity_rejected: number;
  unit_price: number;
  line_amount: number;
  // Tax fields carried over from PO and re-calculated based on accepted quantity
  tax_rate?: number;
  tax_amount?: number;
  lot_number: string;
  serial_number: string;
  expiration_date: string;
  rejection_reason: string;
  notes: string;
  status?: string;
}

interface GRN {
  receipt_id?: number;
  receipt_number?: string;
  header_id?: number;
  receipt_date?: string;
  receipt_type?: string;
  currency_code?: string;
  exchange_rate?: number;
  total_amount?: number;
  status?: string;
  notes?: string;
  lines?: GRNLine[];
}

interface GRNFormProps {
  grn?: GRN | null;
  purchaseOrders: PurchaseOrder[];
  onSave: () => void;
  onCancel: () => void;
}

export const GRNForm: React.FC<GRNFormProps> = ({
  grn,
  purchaseOrders,
  onSave,
  onCancel
}) => {
  // Normalize date strings coming from the backend for use in <input type="date">
  const normalizeDateForInput = (dateStr?: string) => {
    if (!dateStr) return '';
    if (!dateStr.includes('T')) return dateStr;
    return dateStr.split('T')[0];
  };
  // Helper function to safely convert values to numbers
  const safeNumber = (value: string | number | undefined | null): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    return 0;
  };
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    header_id: '',
    receipt_date: '',
    receipt_type: 'STANDARD',
    currency_code: 'USD',
    exchange_rate: '1.0',
    total_amount: '0',
    status: 'DRAFT',
    notes: ''
  });

  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [poLines, setPOLines] = useState<POLine[]>([]);
  const [grnLines, setGRNLines] = useState<GRNLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [alreadyAcceptedByLine, setAlreadyAcceptedByLine] = useState<{ [lineId: number]: number }>({});
  const [hasPreviousGRNs, setHasPreviousGRNs] = useState(false);

  useEffect(() => {
    if (grn) {
      setFormData({
        header_id: grn.header_id?.toString() || '',
        receipt_date: normalizeDateForInput(grn.receipt_date) || '',
        receipt_type: grn.receipt_type || 'STANDARD',
        currency_code: grn.currency_code || 'USD',
        exchange_rate: grn.exchange_rate?.toString() || '1.0',
        total_amount: grn.total_amount?.toString() || '0',
        status: grn.status || 'DRAFT',
        notes: grn.notes || ''
      });
      if (grn.lines) {
        setGRNLines(
          grn.lines.map(line => ({
            ...line,
            expiration_date: normalizeDateForInput(line.expiration_date),
          }))
        );
      }
    } else {
      setFormData({
        header_id: '',
        receipt_date: new Date().toISOString().split('T')[0],
        receipt_type: 'STANDARD',
        currency_code: 'USD',
        exchange_rate: '1.0',
        total_amount: '0',
        status: 'DRAFT',
        notes: ''
      });
    }
  }, [grn]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePOChange = async (poId: string) => {
    if (!poId || poId === 'none') {
      setSelectedPO(null);
      setPOLines([]);
      setGRNLines([]);
      setFormData(prev => ({ ...prev, header_id: '' }));
      return;
    }

    const po = purchaseOrders.find(p => p.header_id.toString() === poId);
    if (po) {
      setSelectedPO(po);
      // Update form data with PO information
      setFormData(prev => ({ 
        ...prev, 
        header_id: poId,
        currency_code: po.currency_code || 'USD', // Use PO currency or default to USD
        exchange_rate: (po.exchange_rate || 1.0).toString(), // Use PO exchange rate or default to 1.0
        receipt_date: new Date().toISOString().split('T')[0] // Set today's date
      }));
      
      try {
        // Fetch full purchase order so we have access to tax fields on lines
        const fullOrder = await apiService.getPurchaseOrder(parseInt(poId));
        const orderLines = Array.isArray((fullOrder as { lines?: unknown }).lines)
          ? (fullOrder as { lines: POLine[] }).lines
          : [];
        const lines: POLine[] = orderLines;
        console.log('PO Lines fetched for GRN:', lines);
        
        // Ensure lines is an array
        if (!Array.isArray(lines)) {
          console.error('Invalid response format - lines is not an array:', lines);
          toast({
            title: "Error",
            description: "Invalid response format from server",
            variant: "destructive"
          });
          setPOLines([]);
          setGRNLines([]);
          return;
        }
        
        setPOLines(lines);
        
        if (lines.length === 0) {
          toast({
            title: "No Lines Available",
            description: "This purchase order has no lines available for receiving (all items may have been fully received).",
            variant: "default"
          });
          setGRNLines([]);
          return;
        }
        
        // Fetch previous GRNs for this PO to calculate already accepted quantities
        const alreadyAcceptedMap: { [lineId: number]: number } = {};
        let hasPrevious = false;
        try {
          const previousGRNs = await apiService.getGRNs({ header_id: poId });
          console.log('Previous GRNs fetched:', previousGRNs);
          
          if (Array.isArray(previousGRNs) && previousGRNs.length > 0) {
            // Filter out current GRN if editing
            const otherGRNs = previousGRNs.filter(grnItem => !grn?.receipt_id || grnItem.receipt_id !== grn.receipt_id);
            
            if (otherGRNs.length > 0) {
              hasPrevious = true;
              
              // Fetch all GRN lines in parallel for efficiency
              const grnLinePromises = otherGRNs.map(grnItem => 
                apiService.getGRN(grnItem.receipt_id).catch(err => {
                  console.error(`Error fetching GRN ${grnItem.receipt_id}:`, err);
                  return null;
                })
              );
              
              const grnResults = await Promise.all(grnLinePromises);
              
              // Sum up accepted quantities per line_id
              grnResults.forEach((grnWithLines) => {
                const grnData = grnWithLines as GRN | null;
                if (grnData && Array.isArray(grnData.lines)) {
                  grnData.lines.forEach((line) => {
                    const lineId = line.line_id;
                    const acceptedQty = safeNumber(line.quantity_accepted);
                    if (lineId && acceptedQty > 0) {
                      alreadyAcceptedMap[lineId] = (alreadyAcceptedMap[lineId] || 0) + acceptedQty;
                    }
                  });
                }
              });
            }
          }
        } catch (error) {
          console.error('Error fetching previous GRNs:', error);
          // Continue even if we can't fetch previous GRNs
        }
        
        setAlreadyAcceptedByLine(alreadyAcceptedMap);
        setHasPreviousGRNs(hasPrevious);
        console.log('Already accepted quantities by line:', alreadyAcceptedMap);
        console.log('Has previous GRNs:', hasPrevious);
        
        // Initialize GRN lines from PO lines with proper type conversion and fallbacks
        const initialGRNLines: GRNLine[] = lines.map(line => {
          const unitPrice = safeNumber(line.unit_price);
          const taxRate = safeNumber(line.tax_rate);

          return {
          line_id: line.line_id || 0,
          line_number: line.line_number || 1,
          item_code: line.item_code || `ITEM${line.line_number || 1}`,
          item_name: line.item_name || 'Unknown Item',
          description: line.description || '',
          uom: line.uom || 'EA',
          quantity_ordered: safeNumber(line.quantity),
          quantity_received: 0,
          quantity_accepted: 0,
          quantity_rejected: 0,
            unit_price: unitPrice,
          line_amount: 0,
            // Carry tax metadata from the PO so we can calculate GRN tax based on accepted quantity
            tax_rate: taxRate,
            tax_amount: 0,
          lot_number: '',
          serial_number: '',
          expiration_date: '',
          status: 'DRAFT',
          rejection_reason: '',
          notes: ''
          };
        });
        
        console.log('Initial GRN Lines:', initialGRNLines);
        setGRNLines(initialGRNLines);
      } catch (error) {
        console.error('Error fetching PO lines:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch purchase order lines",
          variant: "destructive"
        });
        setPOLines([]);
        setGRNLines([]);
      }
    }
  };

  const updateGRNLine = (index: number, field: keyof GRNLine, value: string | number) => {
    const updatedLines = [...grnLines];
    updatedLines[index] = { ...updatedLines[index], [field]: value };
    const line = updatedLines[index];

    // If the user explicitly changed the status, don't auto-adjust anything else here
    if (field === 'status') {
      setGRNLines(updatedLines);
      return;
    }

    // Auto-calculate rejected quantity when received or accepted changes
    if (field === 'quantity_received' || field === 'quantity_accepted') {
      const receivedQty = safeNumber(line.quantity_received);
      const acceptedQty = safeNumber(line.quantity_accepted);
      // Rejected = Received - Accepted
      line.quantity_rejected = Math.max(0, receivedQty - acceptedQty);
    }

    // Auto-calculate received quantity if rejected changes (when user manually enters rejected)
    if (field === 'quantity_rejected') {
      const acceptedQty = safeNumber(line.quantity_accepted);
      const rejectedQty = safeNumber(line.quantity_rejected);
      // Received = Accepted + Rejected
      line.quantity_received = acceptedQty + rejectedQty;
    }

    // Calculate line amount (excluding tax) and tax amount based on accepted quantity
    if (field === 'quantity_accepted' || field === 'quantity_rejected' || field === 'quantity_received') {
      const acceptedQty = safeNumber(line.quantity_accepted);
      const unitPrice = safeNumber(line.unit_price);
      const taxRate = safeNumber(line.tax_rate);

      // Base line amount (without tax)
      line.line_amount = acceptedQty * unitPrice;
      // Tax amount based on accepted quantity and tax rate
      line.tax_amount = line.line_amount * (taxRate / 100);

      // Auto-update status based on quantities when still in Draft
      if (line.status === 'DRAFT') {
        if (acceptedQty > 0 && safeNumber(line.quantity_rejected) === 0) {
          line.status = 'ACCEPTED';
        } else if (acceptedQty === 0 && safeNumber(line.quantity_rejected) > 0) {
          line.status = 'REJECTED';
        }
      }
    }

    // Update total amount (including tax)
    const totalAmount = updatedLines.reduce((sum, line) => {
      const amount = safeNumber(line.line_amount);
      const tax = safeNumber(line.tax_amount);
      return sum + amount + tax;
    }, 0);

    setFormData(prev => ({ ...prev, total_amount: totalAmount.toString() }));
    setGRNLines(updatedLines);
  };

  const validateForm = () => {
    if (!formData.header_id) {
      toast({
        title: "Validation Error",
        description: "Please select a purchase order",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.receipt_date) {
      toast({
        title: "Validation Error",
        description: "Please enter a receipt date",
        variant: "destructive"
      });
      return false;
    }

    if (grnLines.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one line item",
        variant: "destructive"
      });
      return false;
    }

    for (const line of grnLines) {
      if (line.quantity_accepted < 0 || line.quantity_rejected < 0) {
        toast({
          title: "Validation Error",
          description: "Quantities cannot be negative",
          variant: "destructive"
        });
        return false;
      }

      const totalQty = line.quantity_accepted + line.quantity_rejected;
      if (totalQty > line.quantity_ordered) {
        toast({
          title: "Validation Error",
          description: `Total received quantity cannot exceed ordered quantity for item ${line.item_name}`,
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
      const grnData = {
        ...formData,
        header_id: parseInt(formData.header_id),
        exchange_rate: parseFloat(formData.exchange_rate),
        total_amount: parseFloat(formData.total_amount),
        lines: grnLines.map(line => ({
          ...line,
          quantity_ordered: typeof line.quantity_ordered === 'number' ? line.quantity_ordered : parseFloat(String(line.quantity_ordered)),
          quantity_received: typeof line.quantity_received === 'number' ? line.quantity_received : parseFloat(String(line.quantity_received)),
          quantity_accepted: typeof line.quantity_accepted === 'number' ? line.quantity_accepted : parseFloat(String(line.quantity_accepted)),
          quantity_rejected: typeof line.quantity_rejected === 'number' ? line.quantity_rejected : parseFloat(String(line.quantity_rejected)),
          unit_price: typeof line.unit_price === 'number' ? line.unit_price : parseFloat(String(line.unit_price)),
          line_amount: typeof line.line_amount === 'number' ? line.line_amount : parseFloat(String(line.line_amount))
        }))
      };

      if (grn?.receipt_id) {
        await apiService.updateGRN(grn.receipt_id, grnData);
        toast({
          title: "Success",
          description: "GRN updated successfully"
        });
      } else {
        await apiService.createGRN(grnData);
        toast({
          title: "Success",
          description: "GRN created successfully"
        });
      }

      onSave();
    } catch (error) {
      console.error('Error saving GRN:', error);
      toast({
        title: "Error",
        description: "Failed to save GRN",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Goods Received Note Information
          </CardTitle>
          <CardDescription>
            Create a new goods received note for purchase order items
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="header_id">Purchase Order *</Label>
            <Select value={formData.header_id} onValueChange={handlePOChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select Purchase Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select Purchase Order</SelectItem>
                {purchaseOrders.map(po => (
                  <SelectItem key={po.header_id} value={po.header_id.toString()}>
                    {po.po_number} - {po.supplier_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>



          <div className="space-y-2">
            <Label htmlFor="receipt_date">Received Date *</Label>
            <Input
              id="receipt_date"
              type="date"
              value={formData.receipt_date}
              onChange={(e) => handleInputChange('receipt_date', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receipt_type">Receipt Type</Label>
            <Select value={formData.receipt_type} onValueChange={(value) => handleInputChange('receipt_type', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STANDARD">Standard</SelectItem>
                <SelectItem value="RETURN">Return</SelectItem>
                <SelectItem value="CORRECTION">Correction</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency_code">Currency</Label>
            <Select value={formData.currency_code} onValueChange={(value) => handleInputChange('currency_code', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exchange_rate">Exchange Rate</Label>
            <Input
              id="exchange_rate"
              type="number"
              step="0.000001"
              value={formData.exchange_rate}
              onChange={(e) => handleInputChange('exchange_rate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Selected PO Information */}
      {selectedPO && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Purchase Order Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">PO Number</Label>
                <p className="text-sm mt-1 font-medium">{selectedPO.po_number}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Supplier</Label>
                <p className="text-sm mt-1">{selectedPO.supplier_name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">PO Date</Label>
                <p className="text-sm mt-1">{new Date(selectedPO.po_date).toLocaleDateString()}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Total Amount</Label>
                <p className="text-sm mt-1 font-semibold">${safeNumber(selectedPO.total_amount).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* GRN Lines */}
      {grnLines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Received Items</CardTitle>
            <CardDescription>
              Enter the quantities received, accepted, and rejected for each item
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Line</TableHead>
                    <TableHead className="w-48">Item</TableHead>
                    <TableHead className="w-32">UOM</TableHead>
                    <TableHead className="w-24">Ordered</TableHead>
                    <TableHead className="w-24">Received</TableHead>
                    <TableHead className="w-24">Accepted</TableHead>
                    {hasPreviousGRNs && (
                      <TableHead className="w-24">Already Accepted</TableHead>
                    )}
                    <TableHead className="w-24">Rejected</TableHead>
                    <TableHead className="w-32">Unit Price</TableHead>
                    <TableHead className="w-24">Tax %</TableHead>
                    <TableHead className="w-32">Tax Amount</TableHead>
                    <TableHead className="w-32">Line Total</TableHead>
                    <TableHead className="w-32">Lot Number</TableHead>
                    <TableHead className="w-32">Expiration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grnLines.map((line, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-sm">{line.line_number}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{line.item_code}</p>
                          <p className="text-xs text-gray-600">{line.item_name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{line.uom}</TableCell>
                      <TableCell className="text-sm">{line.quantity_ordered}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max={line.quantity_ordered}
                          value={line.quantity_received}
                          onChange={(e) => updateGRNLine(index, 'quantity_received', parseFloat(e.target.value) || 0)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max={line.quantity_received}
                          value={line.quantity_accepted}
                          onChange={(e) => updateGRNLine(index, 'quantity_accepted', parseFloat(e.target.value) || 0)}
                          className="w-20"
                        />
                      </TableCell>
                      {hasPreviousGRNs && (
                        <TableCell className="text-sm text-gray-600 font-medium">
                          {alreadyAcceptedByLine[line.line_id] || 0}
                        </TableCell>
                      )}
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.quantity_rejected}
                          onChange={(e) => updateGRNLine(index, 'quantity_rejected', parseFloat(e.target.value) || 0)}
                          className="w-20"
                          readOnly
                        />
                      </TableCell>
                      <TableCell className="text-sm">
                        ${safeNumber(line.unit_price).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {safeNumber(line.tax_rate).toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-sm">
                        ${safeNumber(line.tax_amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm font-semibold">
                        ${(() => {
                          const base = safeNumber(line.line_amount);
                          const tax = safeNumber(line.tax_amount);
                          return (base + tax).toFixed(2);
                        })()}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={line.lot_number}
                          onChange={(e) => updateGRNLine(index, 'lot_number', e.target.value)}
                          className="w-24"
                          placeholder="Lot #"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={line.expiration_date}
                          onChange={(e) => updateGRNLine(index, 'expiration_date', e.target.value)}
                          className="w-28"
                          placeholder="dd/mm/yyyy"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejection Reasons */}
      {grnLines.some(line => Number(line.quantity_rejected) > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Rejection Reasons
            </CardTitle>
            <CardDescription>
              Provide reasons for rejected items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {grnLines.map((line, index) => (
                Number(line.quantity_rejected) > 0 && (
                  <div key={index} className="space-y-2">
                    <Label className="text-sm font-medium">
                      {line.item_code} - {line.item_name}
                    </Label>
                    <Textarea
                      value={line.rejection_reason}
                      onChange={(e) => updateGRNLine(index, 'rejection_reason', e.target.value)}
                      placeholder="Enter rejection reason..."
                      className="min-h-[80px]"
                    />
                  </div>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notes</CardTitle>
          <CardDescription>
            Additional notes or comments about this goods received note
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Enter any additional notes..."
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Total Items</Label>
              <p className="text-2xl font-bold">{grnLines.length}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Total Accepted</Label>
              <p className="text-2xl font-bold text-green-600">
                {grnLines.reduce((sum, line) => sum + (line.quantity_accepted || 0), 0)}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Total Amount</Label>
              <p className="text-2xl font-bold text-blue-600">
                ${safeNumber(formData.total_amount).toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Package className="w-4 h-4" />
              {grn?.receipt_id ? 'Update GRN' : 'Create GRN'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
