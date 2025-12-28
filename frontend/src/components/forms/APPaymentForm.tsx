import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { X, ArrowLeft, Check, ChevronsUpDown } from "lucide-react";
import apiService from "@/services/api";
import { toast } from "sonner";
import { generateNextPaymentNumber } from "@/utils/numberGenerator";

interface APInvoice {
  invoice_id: number;
  invoice_number: string;
  supplier_id: number;
  supplier_name: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  status: 'DRAFT' | 'PENDING' | 'OPEN' | 'PAID' | 'CANCELLED' | 'VOID';
}

interface APSupplier {
  supplier_id: number;
  supplier_number: string;
  supplier_name: string;
  supplier_type: 'VENDOR' | 'CONTRACTOR' | 'SERVICE_PROVIDER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

interface PaymentApplication {
  invoice_id: number;
  invoice_number: string;
  amount_due: number;
  application_amount: number;
}

interface APPayment {
  payment_id: number;
  payment_number: string;
  supplier_id: number;
  supplier_name: string;
  payment_date: string;
  currency_code: string;
  exchange_rate: number;
  payment_amount: number;
  amount_applied: number;
  unapplied_amount: number;
  payment_method?: string;
  bank_account?: string;
  reference_number?: string;
  status: 'DRAFT' | 'PAID';
  notes?: string;
}

interface APPaymentFormProps {
  onClose: () => void;
  onSuccess: (options?: { mode?: 'draft' | 'final' }) => void;
  selectedInvoice?: APInvoice | null;
  paymentToEdit?: APPayment | null;
}

export const APPaymentForm = ({ onClose, onSuccess, selectedInvoice, paymentToEdit }: APPaymentFormProps) => {
  // Helper to normalize dates coming from the backend (which may include time component)
  const normalizeDateForInput = (dateStr?: string) => {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    // Accept both pure DATE ('2025-01-01') and DATETIME/ISO ('2025-01-01T00:00:00.000Z')
    return dateStr.split('T')[0];
  };

  const [formData, setFormData] = useState({
    supplier_id: paymentToEdit?.supplier_id.toString() || selectedInvoice?.supplier_id.toString() || "",
    payment_number: paymentToEdit?.payment_number || "",
    payment_date: paymentToEdit ? normalizeDateForInput(paymentToEdit.payment_date) : new Date().toISOString().split('T')[0],
    currency_code: paymentToEdit?.currency_code || "USD",
    exchange_rate: paymentToEdit?.exchange_rate || 1.0,
    payment_amount: paymentToEdit?.payment_amount || 0,
    payment_method: paymentToEdit?.payment_method || "",
    bank_account: paymentToEdit?.bank_account || "",
    reference_number: paymentToEdit?.reference_number || "",
    status: (paymentToEdit?.status || "DRAFT") as 'DRAFT' | 'PAID',
    notes: paymentToEdit?.notes || ""
  });

  const [suppliers, setSuppliers] = useState<APSupplier[]>([]);
  const [invoices, setInvoices] = useState<APInvoice[]>([]);
  const [applications, setApplications] = useState<PaymentApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [supplierSearchOpen, setSupplierSearchOpen] = useState(false);
  const [supplierSearchValue, setSupplierSearchValue] = useState("");
  const paymentNumberGenerated = useRef(false);

  const loadSupplierInvoices = async (supplierId: number) => {
    try {
      const invoicesData = await apiService.getAPInvoices({ supplier_id: supplierId });
      console.log('Fetched invoices for supplier:', supplierId, invoicesData);
      
      // Filter for invoices that can be paid:
      // - Must have amount_due > 0 (this is the primary criteria)
      // - Status should be PENDING, DRAFT, OPEN, or APPROVED (not PAID, CANCELLED, or VOID)
      // - Approval status MUST be APPROVED (only approved invoices can be paid)
      // - Should not be CANCELLED or VOID
      // - REJECTED invoices should not appear
      const payableInvoices = invoicesData.filter(inv => {
        const hasAmountDue = Number(inv.amount_due) > 0;
        const isPayableStatus = inv.status === 'PENDING' || inv.status === 'DRAFT' || inv.status === 'OPEN' || inv.status === 'APPROVED';
        const isNotCancelled = inv.status !== 'CANCELLED' && inv.status !== 'VOID';
        const isNotPaid = inv.status !== 'PAID';
        const isApproved = inv.approval_status === 'APPROVED';
        
        // Show invoice only if it's APPROVED, has amount due, and is in a payable status
        // PENDING and REJECTED invoices should not appear in payment form
        const shouldShow = hasAmountDue && isPayableStatus && isNotCancelled && isNotPaid && isApproved;
        
        console.log('Invoice filter check:', {
          invoice_number: inv.invoice_number,
          status: inv.status,
          approval_status: inv.approval_status,
          amount_due: inv.amount_due,
          total_amount: inv.total_amount,
          amount_paid: inv.amount_paid,
          hasAmountDue,
          isPayableStatus,
          isNotCancelled,
          isNotPaid,
          isApproved,
          shouldShow
        });
        
        return shouldShow;
      });
      
      console.log('Filtered payable invoices:', payableInvoices);
      setInvoices(payableInvoices);
      
      // Update applications with latest invoice amounts (remaining due amounts)
      setApplications(prevApplications => 
        prevApplications.map(app => {
          const updatedInvoice = payableInvoices.find(inv => inv.invoice_id === app.invoice_id);
          if (updatedInvoice) {
            // Update amount_due to reflect remaining amount
            // If application_amount exceeds new amount_due, cap it
            const newAmountDue = Number(updatedInvoice.amount_due) || 0;
            const currentApplicationAmount = Number(app.application_amount) || 0;
            return {
              ...app,
              amount_due: newAmountDue,
              application_amount: Math.min(currentApplicationAmount, newAmountDue)
            };
          }
          return app;
        }).filter(app => {
          // Remove applications for invoices that are no longer payable
          return payableInvoices.some(inv => inv.invoice_id === app.invoice_id);
        })
      );
    } catch (error) {
      console.error('Error loading supplier invoices:', error);
      toast.error('Failed to load supplier invoices');
    }
  };

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setLoadingData(true);
      
      // Load suppliers
      const suppliersData = await apiService.getAPSuppliers();
      setSuppliers(suppliersData);

      // If editing a payment, load its data from actual payment tables
      if (paymentToEdit) {
        await loadSupplierInvoices(paymentToEdit.supplier_id);

        try {
          const paymentApplications = await apiService.getAPPaymentApplications(paymentToEdit.payment_id);
          const apps: PaymentApplication[] = paymentApplications.map((app: {
            invoice_id: number;
            invoice_number?: string;
            amount_due?: number;
            applied_amount: number;
          }) => ({
            invoice_id: app.invoice_id,
            invoice_number: app.invoice_number || '',
            amount_due: app.amount_due || 0,
            application_amount: app.applied_amount || 0
          }));
          setApplications(apps);
        } catch (error) {
          console.error('Error loading payment applications:', error);
        }
      } else if (selectedInvoice) {
        // If we have a selected invoice, load its data
        setFormData(prev => ({
          ...prev,
          supplier_id: selectedInvoice.supplier_id.toString(),
          payment_amount: selectedInvoice.amount_due
        }));
        
        // Load invoices for this supplier
        await loadSupplierInvoices(selectedInvoice.supplier_id);
        
        // Check if the selected invoice is already in a draft payment
        try {
          const conflicts = await apiService.checkDraftPaymentConflicts(
            [selectedInvoice.invoice_id],
            null
          );
          
          if (conflicts && conflicts.length > 0) {
            const conflict = conflicts[0];
            toast.error(
              `Invoice ${conflict.invoice_number} is already in draft payment ${conflict.payment_number}`
            );
            // Don't pre-select the invoice if it's in a draft payment
            return;
          }
        } catch (error) {
          console.error('Error checking draft payment conflicts:', error);
          // Continue with pre-selection if the check fails
        }
        
        // Pre-select the invoice for payment
        setApplications([{
          invoice_id: selectedInvoice.invoice_id,
          invoice_number: selectedInvoice.invoice_number,
          amount_due: selectedInvoice.amount_due,
          application_amount: selectedInvoice.amount_due
        }]);
      } else {
        // Create mode - form will be empty as initialized
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoadingData(false);
    }
  }, [selectedInvoice, paymentToEdit]);

  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Auto-generate payment number when form loads (only if not already set and not editing)
  useEffect(() => {
    if (!paymentNumberGenerated.current && !paymentToEdit) {
      paymentNumberGenerated.current = true;
      generateNextPaymentNumber().then((nextNumber) => {
        setFormData(prev => {
          // Only update if still empty (user hasn't manually entered one)
          if (!prev.payment_number) {
            return { ...prev, payment_number: nextNumber };
          }
          return prev;
        });
      }).catch((error) => {
        console.error('Failed to generate payment number:', error);
        paymentNumberGenerated.current = false; // Reset on error so it can retry
      });
    }
  }, [paymentToEdit]);

  // Auto-update payment amount when invoices are selected or removed (only when creating, not editing)
  useEffect(() => {
    if (!paymentToEdit) {
      if (applications.length > 0) {
        // Calculate sum of all selected invoice amounts (use amount_due from invoices, not applications)
        const totalInvoiceAmount = applications.reduce((sum, app) => {
          const invoice = invoices.find(inv => inv.invoice_id === app.invoice_id);
          return sum + (Number(invoice?.amount_due) || Number(app.amount_due) || 0);
        }, 0);
        setFormData(prev => ({ ...prev, payment_amount: totalInvoiceAmount }));
      } else {
        // Reset to 0 if no invoices selected
        setFormData(prev => ({ ...prev, payment_amount: 0 }));
      }
    }
  }, [applications, invoices, paymentToEdit]); // Trigger when applications or invoices change

  const handleSupplierChange = async (supplierId: string) => {
    setFormData(prev => ({ ...prev, supplier_id: supplierId }));
    setApplications([]);
    
    if (supplierId) {
      await loadSupplierInvoices(parseInt(supplierId));
    } else {
      setInvoices([]);
    }
  };

  const addInvoiceApplication = async (invoice: APInvoice) => {
    const existingApp = applications.find(app => app.invoice_id === invoice.invoice_id);
    if (existingApp) {
      toast.error('This invoice is already selected for payment');
      return;
    }

    // Check if this invoice is already in a draft payment
    try {
      const conflicts = await apiService.checkDraftPaymentConflicts(
        [invoice.invoice_id],
        paymentToEdit?.payment_id || null
      );
      
      if (conflicts && conflicts.length > 0) {
        const conflict = conflicts[0];
        toast.error(
          `Invoice ${conflict.invoice_number} is already in draft payment ${conflict.payment_number}`
        );
        return;
      }
    } catch (error) {
      console.error('Error checking draft payment conflicts:', error);
      // Continue with adding the invoice if the check fails (don't block user)
    }

    const newApplication = {
      invoice_id: invoice.invoice_id,
      invoice_number: invoice.invoice_number,
      amount_due: invoice.amount_due,
      application_amount: invoice.amount_due // Default to full amount due
    };

    setApplications([...applications, newApplication]);
    
    // Update payment amount to sum of all selected invoices
    const updatedApplications = [...applications, newApplication];
    const totalAmount = updatedApplications.reduce((sum, app) => sum + (Number(app.amount_due) || 0), 0);
    setFormData(prev => ({ ...prev, payment_amount: totalAmount }));
  };

  const removeApplication = (invoiceId: number) => {
    const updatedApplications = applications.filter(app => app.invoice_id !== invoiceId);
    setApplications(updatedApplications);
    
    // Update payment amount to sum of remaining selected invoices
    if (updatedApplications.length > 0) {
      const totalAmount = updatedApplications.reduce((sum, app) => sum + (Number(app.amount_due) || 0), 0);
      setFormData(prev => ({ ...prev, payment_amount: totalAmount }));
    } else {
      setFormData(prev => ({ ...prev, payment_amount: 0 }));
    }
  };

  const updateApplicationAmount = (invoiceId: number, amount: number) => {
    const invoice = invoices.find(inv => inv.invoice_id === invoiceId);
    const maxAmount = invoice ? Number(invoice.amount_due) || 0 : 0;
    
    // Ensure amount doesn't exceed invoice amount due
    const validAmount = Math.min(Math.max(0, amount), maxAmount);
    
    setApplications(applications.map(app => 
      app.invoice_id === invoiceId 
        ? { ...app, application_amount: validAmount }
        : app
    ));
  };

  // Helper to determine if form is "complete" enough to save as a draft
  const canSaveDraft = () => {
    if (!formData.supplier_id) return false;
    if (!formData.payment_number) return false;
    if (!formData.payment_date) return false;
    if (!formData.payment_amount || Number(formData.payment_amount) <= 0) return false;
    if (applications.length === 0) return false;
    if (applications.some(app => app.application_amount <= 0)) return false;

    const invalidApplications = applications.filter(app => {
      const invoice = invoices.find(inv => inv.invoice_id === app.invoice_id);
      return invoice && Number(app.application_amount) > Number(invoice.amount_due);
    });

    if (invalidApplications.length > 0) return false;

    return true;
  };

  // Close button (X / Back): if form is fully filled for a new payment, save as DRAFT first
  const handleClose = async () => {
    // Only auto-save drafts for new payments, not when editing existing ones
    if (!paymentToEdit && canSaveDraft()) {
      setLoading(true);
      try {
        const validApplications = applications.map(app => {
          if (!app.invoice_id || app.application_amount === undefined || app.application_amount === null) {
            throw new Error(`Invalid application data: invoice_id=${app.invoice_id}, application_amount=${app.application_amount}`);
          }
          return {
            invoice_id: Number(app.invoice_id),
            application_amount: Number(app.application_amount),
            application_date: formData.payment_date || new Date().toISOString().split('T')[0]
          };
        });

        const paymentData = {
          ...formData,
          status: 'DRAFT' as const,
          supplier_id: parseInt(formData.supplier_id),
          total_amount: formData.payment_amount,
          payment_amount: formData.payment_amount,
          applications: validApplications
        };

        await apiService.createAPPayment(paymentData);
        onSuccess({ mode: 'draft' });
      } catch (error) {
        console.error('Error saving draft payment:', error);
        toast.error('Failed to save draft payment');
      } finally {
        setLoading(false);
      }
    }

    onClose();
  };

  // Cancel button - discard data without saving
  const handleCancel = () => {
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplier_id) {
      toast.error('Please select a supplier');
      return;
    }

    if (applications.length === 0) {
      toast.error('Please select at least one invoice for payment');
      return;
    }

    if (applications.some(app => app.application_amount <= 0)) {
      toast.error('All application amounts must be greater than zero');
      return;
    }

    // Validate that application amounts don't exceed invoice amounts due
    const invalidApplications = applications.filter(app => {
      const invoice = invoices.find(inv => inv.invoice_id === app.invoice_id);
      return invoice && Number(app.application_amount) > Number(invoice.amount_due);
    });

    if (invalidApplications.length > 0) {
      toast.error('Application amounts cannot exceed invoice amounts due');
      return;
    }

    // Check if any selected invoices are already in draft payments
    try {
      const invoiceIds = applications.map(app => app.invoice_id);
      const conflicts = await apiService.checkDraftPaymentConflicts(
        invoiceIds,
        paymentToEdit?.payment_id || null
      );
      
      if (conflicts && conflicts.length > 0) {
        const conflictMessages = conflicts.map(conflict => 
          `Invoice ${conflict.invoice_number} is already in draft payment ${conflict.payment_number}`
        );
        toast.error(conflictMessages.join(', '));
        return;
      }
    } catch (error) {
      console.error('Error checking draft payment conflicts:', error);
      // Continue with submission if the check fails (don't block user)
    }

    setLoading(true);
    try {
      if (paymentToEdit) {
        // Update existing payment
        const validApplications = applications.map(app => {
          if (!app.invoice_id || app.application_amount === undefined || app.application_amount === null) {
            throw new Error(`Invalid application data: invoice_id=${app.invoice_id}, application_amount=${app.application_amount}`);
          }
          return {
            invoice_id: Number(app.invoice_id),
            application_amount: Number(app.application_amount),
            application_date: formData.payment_date || new Date().toISOString().split('T')[0]
          };
        });

        const paymentData = {
          ...formData,
          status: (paymentToEdit.status === 'DRAFT' ? 'PAID' : paymentToEdit.status) as 'DRAFT' | 'PAID',
          supplier_id: parseInt(formData.supplier_id),
          total_amount: formData.payment_amount,
          payment_amount: formData.payment_amount,
          applications: validApplications
        };

        await apiService.updateAPPayment(paymentToEdit.payment_id, paymentData);
        // Don't show toast here - let the parent component handle it
      } else {
        // Create new payment (will set status to PAID)
        const validApplications = applications.map(app => {
          if (!app.invoice_id || app.application_amount === undefined || app.application_amount === null) {
            throw new Error(`Invalid application data: invoice_id=${app.invoice_id}, application_amount=${app.application_amount}`);
          }
          return {
            invoice_id: Number(app.invoice_id),
            application_amount: Number(app.application_amount),
            application_date: formData.payment_date || new Date().toISOString().split('T')[0]
          };
        });

        const paymentData = {
          ...formData,
          status: 'PAID' as const,
          supplier_id: parseInt(formData.supplier_id),
          total_amount: formData.payment_amount,
          payment_amount: formData.payment_amount,
          applications: validApplications
          // Status will be set to PAID by backend
        };

        await apiService.createAPPayment(paymentData);
        // Don't show toast here - let the parent component handle it
      }
      
      // Reload invoices to get updated amounts after payment
      if (formData.supplier_id) {
        await loadSupplierInvoices(parseInt(formData.supplier_id));
      }
      
      onSuccess({ mode: 'final' });
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Failed to create payment');
    } finally {
      setLoading(false);
    }
  };

  // Calculate Total Applied: sum of all application amounts
  const totalApplied = applications.reduce((sum, app) => sum + (Number(app.application_amount) || 0), 0);
  
  // Unapplied Amount: Payment Amount - Total Applied
  // If applied amount is less than invoice amount, the difference shows as unapplied
  const unappliedAmount = Number(formData.payment_amount) - totalApplied;

  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="text-center">Loading payment form...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-xl font-semibold">{paymentToEdit ? 'Edit AP Payment' : 'Create AP Payment'}</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Payment Header */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Header</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier *</Label>
                <Popover open={supplierSearchOpen} onOpenChange={setSupplierSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={supplierSearchOpen}
                      className="w-full justify-between"
                    >
                      {formData.supplier_id
                        ? suppliers.find(s => s.supplier_id.toString() === formData.supplier_id)
                          ? `${suppliers.find(s => s.supplier_id.toString() === formData.supplier_id)?.supplier_name} (${suppliers.find(s => s.supplier_id.toString() === formData.supplier_id)?.supplier_number})`
                          : "Select supplier..."
                        : "Select supplier..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search by supplier name or number..."
                        value={supplierSearchValue}
                        onValueChange={setSupplierSearchValue}
                      />
                      <CommandEmpty>No supplier found.</CommandEmpty>
                      <CommandGroup>
                        {suppliers
                          .filter(s => s.status === 'ACTIVE')
                          .filter(supplier =>
                            !supplierSearchValue ||
                            supplier.supplier_name.toLowerCase().includes(supplierSearchValue.toLowerCase()) ||
                            supplier.supplier_number.toLowerCase().includes(supplierSearchValue.toLowerCase())
                          )
                          .map((supplier) => (
                            <CommandItem
                              key={supplier.supplier_id}
                              value={`${supplier.supplier_name} ${supplier.supplier_number}`}
                              onSelect={() => {
                                handleSupplierChange(supplier.supplier_id.toString());
                                setSupplierSearchOpen(false);
                                setSupplierSearchValue("");
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.supplier_id === supplier.supplier_id.toString() ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{supplier.supplier_name}</span>
                                <span className="text-sm text-gray-500">Supplier #: {supplier.supplier_number}</span>
                              </div>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_number">Payment Number *</Label>
                <Input
                  id="payment_number"
                  value={formData.payment_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_number: e.target.value }))}
                  placeholder="Enter payment number"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_date">Payment Date *</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_amount">Payment Amount *</Label>
                <Input
                  id="payment_amount"
                  type="number"
                  step="0.01"
                  value={formData.payment_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="Enter payment amount"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency_code} onValueChange={(value) => setFormData(prev => ({ ...prev, currency_code: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method</Label>
                <Input
                  id="payment_method"
                  value={formData.payment_method}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                  placeholder="e.g., Bank Transfer, Check"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_account">Bank Account</Label>
                <Input
                  id="bank_account"
                  value={formData.bank_account}
                  onChange={(e) => setFormData(prev => ({ ...prev, bank_account: e.target.value }))}
                  placeholder="Bank account details"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference_number">Reference Number</Label>
                <Input
                  id="reference_number"
                  value={formData.reference_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                  placeholder="Transaction reference"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exchange_rate">Exchange Rate</Label>
                <Input
                  id="exchange_rate"
                  type="number"
                  step="0.000001"
                  value={formData.exchange_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, exchange_rate: parseFloat(e.target.value) }))}
                  placeholder="1.000000"
                />
              </div>
            </CardContent>
          </Card>

          {/* Invoice Selection and Applications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Available Invoices */}
            <Card>
              <CardHeader>
                <CardTitle>Available Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No payable invoices found for this supplier
                    <p className="text-xs mt-2">(Only APPROVED invoices with amount due &gt; 0 are available for payment)</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {invoices.map((invoice) => (
                      <div key={invoice.invoice_id} className="border p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{invoice.invoice_number}</div>
                            <div className="text-sm text-gray-500">
                              Due: {new Date(invoice.due_date).toLocaleDateString()}
                            </div>
                            <div className="text-sm font-mono">
                              Amount Due: ${(Number(invoice.amount_due) || 0).toFixed(2)}
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => addInvoiceApplication(invoice)}
                            disabled={applications.some(app => app.invoice_id === invoice.invoice_id)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Applications */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Applications</CardTitle>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No invoices selected for payment
                  </div>
                ) : (
                  <div className="space-y-3">
                    {applications.map((app) => (
                      <div key={app.invoice_id} className="border p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{app.invoice_number}</div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeApplication(app.invoice_id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <Label className="text-xs">Amount Due</Label>
                            <div className="font-mono">${(Number(app.amount_due) || 0).toFixed(2)}</div>
                          </div>
                          <div>
                            <Label className="text-xs">Apply Amount</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={app.application_amount}
                              onChange={(e) => updateApplicationAmount(app.invoice_id, parseFloat(e.target.value) || 0)}
                              className="text-xs"
                              max={Number(app.amount_due) || 0}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment Totals */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Total Applied</Label>
                  <div className="text-lg font-mono">${(Number(totalApplied) || 0).toFixed(2)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment Amount</Label>
                  <div className="text-lg font-mono">${(Number(formData.payment_amount) || 0).toFixed(2)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Unapplied Amount</Label>
                  <div className={`text-lg font-mono ${unappliedAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${(Number(unappliedAmount) || 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Enter any additional notes..."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || applications.length === 0}>
              {loading
                ? paymentToEdit
                  ? (paymentToEdit.status === 'DRAFT' ? "Creating..." : "Updating...")
                  : "Creating..."
                : paymentToEdit
                  ? (paymentToEdit.status === 'DRAFT' ? "Create Payment" : "Update Payment")
                  : "Create Payment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}; 