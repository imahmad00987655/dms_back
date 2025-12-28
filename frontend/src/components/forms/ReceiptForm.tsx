import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import type { ReceiptFormData } from "./receipt/ReceiptFormFields";
import { generateNextReceiptNumber } from "@/utils/numberGenerator";

interface Customer {
  customer_id?: number;
  profile_id?: number;
  customer_number: string;
  customer_name: string;
  customer_type: string;
  status?: string;
}

interface ARInvoice {
  invoice_id: number;
  invoice_number: string;
  customer_id?: number;
  customer_name: string;
  customer_number: string;
  total_amount: string | number;
  amount_paid: string | number;
  amount_due: string | number;
  due_date: string;
  status: string;
  approval_status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  invoice_date: string;
  notes?: string;
  payment_terms_id: number;
}

interface PaymentApplication {
  invoice_id: number;
  invoice_number: string;
  amount_due: number;
  application_amount: number;
}

interface ExtendedReceiptFormData extends ReceiptFormData {
  applications?: Array<{ invoice_id: number; application_amount: number; application_date?: string }>;
  customerId?: string;
}

interface Receipt {
  receipt_id: number;
  receipt_number: string;
  customer_id: number;
  customer_name: string;
  receipt_date: string;
  currency_code: string;
  total_amount: number;
  amount_applied: number;
  amount_unapplied: number;
  payment_method?: string;
  bank_account?: string;
  reference_number?: string;
  status: 'DRAFT' | 'PAID';
  notes?: string;
  applications?: Array<{
    application_id: number;
    invoice_id: number;
    invoice_number: string;
    applied_amount: number;
    unapplied_amount: number;
    applied_date: string;
  }>;
}

interface ReceiptFormProps {
  onClose: () => void;
  onSuccess?: (options?: { mode?: 'draft' | 'final' }) => void;
  selectedReceivable?: ARInvoice | null;
  onSubmit?: (data: ReceiptFormData) => void;
  receiptToView?: ReceiptFormData | null;
  receiptToEdit?: Receipt | null;
  mode?: 'create' | 'view';
}

export const ReceiptForm = ({ onClose, onSuccess, selectedReceivable, onSubmit, receiptToView, receiptToEdit, mode = 'create' }: ReceiptFormProps) => {
  const [customerId, setCustomerId] = useState<string>(selectedReceivable?.customer_id?.toString() || receiptToEdit?.customer_id?.toString() || "");
  const [formData, setFormData] = useState(() => {
    if (mode === 'view' && receiptToView) {
      return receiptToView;
    }
    if (receiptToEdit) {
      // Load receipt data for editing
      return {
        receiptNumber: receiptToEdit.receipt_number || "",
        receiptDate: receiptToEdit.receipt_date ? receiptToEdit.receipt_date.split('T')[0] : new Date().toISOString().split('T')[0],
        customer: receiptToEdit.customer_name || "",
        invoiceNumber: "",
        amount: String(receiptToEdit.total_amount || 0),
        paymentMethod: receiptToEdit.payment_method || "",
        bankAccount: receiptToEdit.bank_account || "",
        checkNumber: "",
        reference: receiptToEdit.reference_number || "",
        description: receiptToEdit.notes || "",
        currency: receiptToEdit.currency_code || "USD",
        status: receiptToEdit.status || "DRAFT"
      };
    }
    return {
    receiptNumber: "",
    receiptDate: new Date().toISOString().split('T')[0],
    customer: selectedReceivable?.customer_name || "",
    invoiceNumber: selectedReceivable?.invoice_number || "",
    amount: selectedReceivable?.amount_due ? String(Number(selectedReceivable.amount_due || 0)) : "",
    paymentMethod: "",
    bankAccount: "",
    checkNumber: "",
    reference: "",
    description: "",
    currency: "USD",
    status: "DRAFT"
    };
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<ARInvoice[]>([]);
  const [applications, setApplications] = useState<PaymentApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [customerSearchValue, setCustomerSearchValue] = useState("");
  const receiptNumberGenerated = useRef(false);

  // Auto-generate receipt number when form loads (only if not already set and not editing)
  useEffect(() => {
    if (!receiptNumberGenerated.current && !receiptToEdit) {
      receiptNumberGenerated.current = true;
      generateNextReceiptNumber().then((nextNumber) => {
        setFormData(prev => {
          // Only update if still empty (user hasn't manually entered one)
          if (!prev.receiptNumber) {
            return { ...prev, receiptNumber: nextNumber };
          }
          return prev;
        });
      }).catch((error) => {
        console.error('Failed to generate receipt number:', error);
        receiptNumberGenerated.current = false; // Reset on error so it can retry
      });
    }
  }, [receiptToEdit]);

  const loadCustomerInvoices = async (customerId: number) => {
    try {
      const invoicesData = await apiService.getInvoices();
      console.log('Fetched invoices for customer:', customerId, invoicesData);
      
      // Filter for invoices that can be paid:
      // - Must have amount_due > 0 (this is the primary criteria)
      // - Status should be DRAFT, OPEN (not PAID, CANCELLED, or VOID)
      // - Approval status MUST be APPROVED (only approved invoices can be paid)
      // - Should not be CANCELLED or VOID
      // - REJECTED invoices should not appear
      // - Must belong to the selected customer
      const receivableInvoices = invoicesData.filter((inv: ARInvoice & { customer_id?: number }) => {
        const hasAmountDue = Number(inv.amount_due) > 0;
        const isReceivableStatus = inv.status === 'DRAFT' || inv.status === 'OPEN';
        const isNotCancelled = inv.status !== 'CANCELLED' && inv.status !== 'VOID';
        const isNotPaid = inv.status !== 'PAID';
        const isApproved = inv.approval_status === 'APPROVED';
        const belongsToCustomer = inv.customer_id === customerId;
        
        // Show invoice only if it's APPROVED, has amount due, belongs to customer, and is in a receivable status
        // PENDING and REJECTED invoices should not appear in receipt form
        const shouldShow = hasAmountDue && isReceivableStatus && isNotCancelled && isNotPaid && isApproved && belongsToCustomer;
        
        console.log('Invoice filter check:', {
          invoice_number: inv.invoice_number,
          status: inv.status,
          approval_status: inv.approval_status,
          amount_due: inv.amount_due,
          total_amount: inv.total_amount,
          amount_paid: inv.amount_paid,
          customer_id: inv.customer_id,
          selected_customer_id: customerId,
          hasAmountDue,
          isReceivableStatus,
          isNotCancelled,
          isNotPaid,
          isApproved,
          belongsToCustomer,
          shouldShow
        });
        
        return shouldShow;
      });
      
      console.log('Filtered receivable invoices:', receivableInvoices);
      setInvoices(receivableInvoices);
      
      // Update applications with latest invoice amounts
      setApplications(prevApplications => 
        prevApplications.map(app => {
          const updatedInvoice = receivableInvoices.find(inv => inv.invoice_id === app.invoice_id);
          if (updatedInvoice) {
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
          return receivableInvoices.some(inv => inv.invoice_id === app.invoice_id);
        })
      );
    } catch (error) {
      console.error('Error loading customer invoices:', error);
      toast.error('Failed to load customer invoices');
    }
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoadingData(true);
        
        // Load customers
        const customersData = await apiService.getCustomers();
        const validCustomers = Array.isArray(customersData) 
          ? customersData
              .filter(c => {
                const hasId = c && (c.customer_id || c.profile_id);
                const hasName = c && (c.customer_name || c.party_name);
                return hasId && hasName;
              })
              .map(c => ({
                customer_id: c.customer_id || c.profile_id,
                customer_number: c.customer_number || '',
                customer_name: c.customer_name || c.party_name || '',
                customer_type: c.customer_type || '',
                status: c.status
              }))
          : [];
        setCustomers(validCustomers);

        // If we have a receipt to edit, load its data
        if (receiptToEdit) {
          const custId = receiptToEdit.customer_id;
          if (custId) {
            setCustomerId(custId.toString());
            // Load invoices for this customer first
            await loadCustomerInvoices(custId);
            
            // Load applications from receipt after invoices are loaded
            if (receiptToEdit.applications && receiptToEdit.applications.length > 0) {
              // Get the fresh invoices list (it's set by loadCustomerInvoices)
              // We need to get it from the state, but since setState is async, we'll fetch it again
              // or better yet, get it from the loadCustomerInvoices return or use a ref
              // For now, let's fetch the invoices again to ensure we have the latest data
              const invoicesData = await apiService.getInvoices();
              const customerInvoices = invoicesData.filter((inv: ARInvoice & { customer_id?: number }) => {
                const hasAmountDue = Number(inv.amount_due) > 0;
                const isReceivableStatus = inv.status === 'DRAFT' || inv.status === 'OPEN';
                const isNotCancelled = inv.status !== 'CANCELLED' && inv.status !== 'VOID';
                const isNotPaid = inv.status !== 'PAID';
                const isApproved = inv.approval_status === 'APPROVED';
                const belongsToCustomer = inv.customer_id === custId;
                
                return hasAmountDue && isReceivableStatus && isNotCancelled && isNotPaid && isApproved && belongsToCustomer;
              });
              
              const receiptApplications = receiptToEdit.applications.map(app => {
                // For DRAFT receipts, use the current invoice amount_due (invoice hasn't been updated yet)
                // For PAID receipts, the invoice was already updated, so we need to calculate differently
                const invoice = customerInvoices.find((inv: ARInvoice) => inv.invoice_id === app.invoice_id);
                
                let currentAmountDue: number;
                if (receiptToEdit.status === 'DRAFT') {
                  // DRAFT receipt: invoice hasn't been updated, use current invoice amount_due
                  currentAmountDue = invoice 
                    ? Number(invoice.amount_due) || 0
                    : (app.unapplied_amount + app.applied_amount); // Fallback
                } else {
                  // PAID receipt: invoice was already updated, calculate original amount due
                  currentAmountDue = app.unapplied_amount + app.applied_amount;
                }
                
                return {
                  invoice_id: app.invoice_id,
                  invoice_number: app.invoice_number,
                  amount_due: currentAmountDue,
                  application_amount: app.applied_amount
                };
              });
              setApplications(receiptApplications);
            }
          }
        } else if (selectedReceivable) {
          // If we have a selected receivable, load its data
          const custId = selectedReceivable.customer_id;
          if (custId) {
            setCustomerId(custId.toString());
            setFormData(prev => ({
              ...prev,
              customer: selectedReceivable.customer_name,
              amount: String(Number(selectedReceivable.amount_due || 0))
            }));
            
            // Load invoices for this customer
            await loadCustomerInvoices(custId);
            
            // Check if the selected invoice is already in a draft receipt
            try {
              const conflicts = await apiService.checkDraftReceiptConflicts(
                [selectedReceivable.invoice_id],
                null
              );
              
              if (conflicts && conflicts.length > 0) {
                const conflict = conflicts[0];
                toast.error(
                  `Invoice ${conflict.invoice_number} is already in draft receipt ${conflict.receipt_number}`
                );
                // Don't pre-select the invoice if it's in a draft receipt
                return;
              }
            } catch (error) {
              console.error('Error checking draft receipt conflicts:', error);
              // Continue with pre-selection if the check fails
            }
            
            // Pre-select the invoice for payment
            setApplications([{
              invoice_id: selectedReceivable.invoice_id,
              invoice_number: selectedReceivable.invoice_number,
              amount_due: Number(selectedReceivable.amount_due || 0),
              application_amount: Number(selectedReceivable.amount_due || 0)
            }]);
          }
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoadingData(false);
      }
    };
    
    loadInitialData();
  }, [selectedReceivable, receiptToEdit]);

  // Track invoice IDs to detect when invoices are added/removed (not when application amounts change)
  const invoiceIdsRef = useRef<string>('');
  
  // Auto-update payment amount when invoices are selected or removed (not when application amounts change)
  useEffect(() => {
    const currentInvoiceIds = applications.map(app => app.invoice_id).sort().join(',');
    
    // Only recalculate if invoice IDs have changed (invoice added/removed)
    if (currentInvoiceIds !== invoiceIdsRef.current) {
      invoiceIdsRef.current = currentInvoiceIds;
      
      if (applications.length > 0) {
        // Calculate sum of all selected invoice amounts (use amount_due from invoices, not applications)
        const totalInvoiceAmount = applications.reduce((sum, app) => {
          const invoice = invoices.find(inv => inv.invoice_id === app.invoice_id);
          return sum + (Number(invoice?.amount_due) || Number(app.amount_due) || 0);
        }, 0);
        setFormData(prev => ({ ...prev, amount: String(totalInvoiceAmount) }));
      } else {
        // Reset to 0 if no invoices selected
        setFormData(prev => ({ ...prev, amount: "0" }));
      }
    }
  }, [applications, invoices]); // Trigger when applications or invoices change

  const handleCustomerChange = async (customerIdValue: string) => {
    const customer = customers.find(c => (c.customer_id || c.profile_id)?.toString() === customerIdValue);
    
    if (!customer || !customerIdValue) {
      setCustomerId("");
      setFormData(prev => ({ ...prev, customer: "" }));
      setInvoices([]);
      setApplications([]);
      return;
    }
    
    setCustomerId(customerIdValue);
    setFormData(prev => ({ 
      ...prev, 
      customer: customer.customer_name 
    }));
    
    setApplications([]);
    
    // Load customer invoices
    await loadCustomerInvoices(parseInt(customerIdValue));
  };

  const addInvoiceApplication = async (invoice: ARInvoice) => {
    const existingApp = applications.find(app => app.invoice_id === invoice.invoice_id);
    if (existingApp) {
      toast.error('This invoice is already selected for payment');
      return;
    }

    // Check if this invoice is already in a draft receipt
    try {
      const conflicts = await apiService.checkDraftReceiptConflicts(
        [invoice.invoice_id],
        receiptToEdit?.receipt_id || null
      );
      
      if (conflicts && conflicts.length > 0) {
        const conflict = conflicts[0];
        toast.error(
          `Invoice ${conflict.invoice_number} is already in draft receipt ${conflict.receipt_number}`
        );
        return;
      }
    } catch (error) {
      console.error('Error checking draft receipt conflicts:', error);
      // Continue with adding the invoice if the check fails (don't block user)
    }

    const newApplication = {
      invoice_id: invoice.invoice_id,
      invoice_number: invoice.invoice_number,
      amount_due: Number(invoice.amount_due || 0),
      application_amount: Number(invoice.amount_due || 0) // Default to full amount due
    };

    setApplications([...applications, newApplication]);
    
    // Update payment amount to sum of all selected invoices
    const updatedApplications = [...applications, newApplication];
    const totalAmount = updatedApplications.reduce((sum, app) => sum + (Number(app.amount_due) || 0), 0);
    setFormData(prev => ({ ...prev, amount: String(totalAmount) }));
  };

  const removeApplication = (invoiceId: number) => {
    const updatedApplications = applications.filter(app => app.invoice_id !== invoiceId);
    setApplications(updatedApplications);
    
    // Update payment amount to sum of remaining selected invoices
    if (updatedApplications.length > 0) {
      const totalAmount = updatedApplications.reduce((sum, app) => sum + (Number(app.amount_due) || 0), 0);
      setFormData(prev => ({ ...prev, amount: String(totalAmount) }));
    } else {
      setFormData(prev => ({ ...prev, amount: "0" }));
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
    if (!customerId) return false;
    if (!formData.receiptNumber) return false;
    if (!formData.receiptDate) return false;
    if (!formData.amount || Number(formData.amount) <= 0) return false;
    if (applications.length === 0) return false;
    if (applications.some(app => app.application_amount <= 0)) return false;

    const invalidApplications = applications.filter(app => {
      const invoice = invoices.find(inv => inv.invoice_id === app.invoice_id);
      return invoice && Number(app.application_amount) > Number(invoice.amount_due);
    });

    if (invalidApplications.length > 0) return false;

    return true;
  };

  // Close button (X / Back): if form is fully filled for a new receipt, save as DRAFT first
  const handleClose = async () => {
    // Only auto-save drafts for new receipts, not when editing existing ones
    if (!receiptToEdit && canSaveDraft()) {
      setLoading(true);
      try {
        const validApplications = applications.map(app => {
          if (!app.invoice_id || app.application_amount === undefined || app.application_amount === null) {
            throw new Error(`Invalid application data: invoice_id=${app.invoice_id}, application_amount=${app.application_amount}`);
          }
          return {
            invoice_id: Number(app.invoice_id),
            application_amount: Number(app.application_amount),
            application_date: formData.receiptDate || new Date().toISOString().split('T')[0]
          };
        });

        const receiptData = {
          receipt_number: formData.receiptNumber,
          receipt_date: formData.receiptDate,
          customer_id: customerId,
          total_amount: Number(formData.amount),
          currency: formData.currency,
          payment_method: formData.paymentMethod,
          bank_account: formData.bankAccount,
          reference_number: formData.reference,
          status: 'DRAFT',
          description: formData.description,
          applications: validApplications
        };

        await apiService.createReceipt(receiptData);
        if (onSuccess) {
          onSuccess({ mode: 'draft' });
        }
      } catch (error) {
        console.error('Error saving draft receipt:', error);
        toast.error('Failed to save draft receipt');
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
    
    if (!customerId) {
      toast.error('Please select a customer');
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

    // Check if any selected invoices are already in draft receipts
    try {
      const invoiceIds = applications.map(app => app.invoice_id);
      const conflicts = await apiService.checkDraftReceiptConflicts(
        invoiceIds,
        receiptToEdit?.receipt_id || null
      );
      
      if (conflicts && conflicts.length > 0) {
        const conflictMessages = conflicts.map(conflict => 
          `Invoice ${conflict.invoice_number} is already in draft receipt ${conflict.receipt_number}`
        );
        toast.error(conflictMessages.join(', '));
        return;
      }
    } catch (error) {
      console.error('Error checking draft receipt conflicts:', error);
      // Continue with submission if the check fails (don't block user)
    }

    setLoading(true);
    try {
      const validApplications = applications.map(app => {
        if (!app.invoice_id || app.application_amount === undefined || app.application_amount === null) {
          throw new Error(`Invalid application data: invoice_id=${app.invoice_id}, application_amount=${app.application_amount}`);
        }
        return {
          invoice_id: Number(app.invoice_id),
          application_amount: Number(app.application_amount),
          application_date: formData.receiptDate || new Date().toISOString().split('T')[0]
        };
      });

      if (receiptToEdit) {
        // Update existing receipt
        const receiptData = {
          receipt_number: formData.receiptNumber,
          receipt_date: formData.receiptDate,
          customer_id: customerId,
          total_amount: Number(formData.amount),
          currency: formData.currency,
          payment_method: formData.paymentMethod,
          bank_account: formData.bankAccount,
          reference_number: formData.reference,
          status: (receiptToEdit.status === 'DRAFT' ? 'PAID' : receiptToEdit.status) as 'DRAFT' | 'PAID',
          description: formData.description,
          applications: validApplications
        };

        if (onSubmit) {
          const extendedData = {
            receiptNumber: formData.receiptNumber,
            receiptDate: formData.receiptDate,
            customer: formData.customer,
            invoiceNumber: applications.map(app => app.invoice_number).join(', '),
            amount: formData.amount,
            paymentMethod: formData.paymentMethod,
            bankAccount: formData.bankAccount,
            checkNumber: formData.checkNumber,
            reference: formData.reference,
            description: formData.description,
            currency: formData.currency,
            status: receiptData.status,
            applications: validApplications,
            customerId: customerId,
            receiptId: receiptToEdit.receipt_id // Pass receipt ID for update
          } as ExtendedReceiptFormData & { receiptId?: number };
          await onSubmit(extendedData);
        } else {
          // Use updateReceipt API directly
          await apiService.updateReceipt(receiptToEdit.receipt_id, receiptData);
        }
        
        // Reload invoices to get updated amounts after receipt
        if (customerId) {
          await loadCustomerInvoices(parseInt(customerId));
        }
        
        if (onSuccess) {
          onSuccess({ mode: receiptToEdit.status === 'DRAFT' ? 'final' : 'final' });
        }
      } else {
        // Create new receipt (will set status to PAID)
        const receiptData = {
          receipt_number: formData.receiptNumber,
          receipt_date: formData.receiptDate,
          customer_id: customerId,
          total_amount: Number(formData.amount),
          currency: formData.currency,
          payment_method: formData.paymentMethod,
          bank_account: formData.bankAccount,
          reference_number: formData.reference,
          status: 'PAID' as const,
          description: formData.description,
          applications: validApplications
        };

        if (onSubmit) {
          const extendedData = {
            receiptNumber: formData.receiptNumber,
            receiptDate: formData.receiptDate,
            customer: formData.customer,
            invoiceNumber: applications.map(app => app.invoice_number).join(', '),
            amount: formData.amount,
            paymentMethod: formData.paymentMethod,
            bankAccount: formData.bankAccount,
            checkNumber: formData.checkNumber,
            reference: formData.reference,
            description: formData.description,
            currency: formData.currency,
            status: 'PAID',
            applications: validApplications,
            customerId: customerId
          } as ExtendedReceiptFormData;
          await onSubmit(extendedData);
        } else {
          await apiService.createReceipt(receiptData);
        }
        if (onSuccess) {
          onSuccess({ mode: 'final' });
        }
      }
    } catch (error) {
      console.error('Error saving receipt:', error);
      const errorMessage = (error as { message?: string })?.message || 'Failed to save receipt';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  // Calculate Total Applied: sum of all application amounts
  const totalApplied = applications.reduce((sum, app) => sum + (Number(app.application_amount) || 0), 0);
  
  // Unapplied Amount: Receipt Amount - Total Applied
  const unappliedAmount = (Number(formData.amount) || 0) - totalApplied;

  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="text-center">Loading receipt form...</div>
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
              <h2 className="text-xl font-semibold">
                {mode === 'view' ? 'View AR Receipt' : 'Create AR Receipt'}
              </h2>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {mode === 'view' ? (
          <div className="p-6 space-y-6">
            {/* Receipt Header */}
            <Card>
              <CardHeader>
                <CardTitle>Receipt Header</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{formData.customer || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Receipt Number</p>
                  <p className="font-medium">{formData.receiptNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Receipt Date</p>
                  <p className="font-medium">{formData.receiptDate ? new Date(formData.receiptDate).toLocaleDateString() : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount Received</p>
                  <p className="font-medium">${(Number(formData.amount) || 0).toFixed(2)} {formData.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium">
                    {formData.paymentMethod === 'BANK_TRANSFER' ? 'Bank Transfer' :
                     formData.paymentMethod === 'CREDIT_CARD' ? 'Credit Card' :
                     formData.paymentMethod === 'CHECK' ? 'Check' :
                     formData.paymentMethod === 'CASH' ? 'Cash' :
                     formData.paymentMethod === 'ACH' ? 'ACH' :
                     formData.paymentMethod === 'WIRE' ? 'Wire Transfer' :
                     formData.paymentMethod || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bank Account</p>
                  <p className="font-medium">
                    {formData.bankAccount === 'checking-main' ? 'Main Checking (****1234)' :
                     formData.bankAccount === 'savings' ? 'Savings Account (****5678)' :
                     formData.bankAccount === 'merchant' ? 'Merchant Account (****9012)' :
                     formData.bankAccount || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reference Number</p>
                  <p className="font-medium">{formData.reference || '-'}</p>
                </div>
                {formData.paymentMethod === "CHECK" && (
                  <div>
                    <p className="text-sm text-gray-500">Check Number</p>
                    <p className="font-medium">{formData.checkNumber || '-'}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Invoice Number</p>
                  <p className="font-medium">{formData.invoiceNumber || '-'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Receipt Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Receipt Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Amount Received</Label>
                    <div className="text-lg font-mono">${(Number(formData.amount) || 0).toFixed(2)} {formData.currency}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="text-lg font-medium">{formData.status}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {formData.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
        <CardContent>
                  <p className="text-sm">{formData.description}</p>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Receipt Header */}
            <Card>
              <CardHeader>
                <CardTitle>Receipt Header</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer *</Label>
                  <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={customerSearchOpen}
                        className="w-full justify-between"
                      >
                        {customerId
                          ? customers.find(c => (c.customer_id || c.profile_id)?.toString() === customerId)
                            ? `${customers.find(c => (c.customer_id || c.profile_id)?.toString() === customerId)?.customer_name} (${customers.find(c => (c.customer_id || c.profile_id)?.toString() === customerId)?.customer_number})`
                            : "Select customer..."
                          : "Select customer..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search by customer name or number..."
                          value={customerSearchValue}
                          onValueChange={setCustomerSearchValue}
                        />
                        <CommandEmpty>No customer found.</CommandEmpty>
                        <CommandGroup>
                          {customers
                            .filter(c => c.status === 'ACTIVE' || !c.status)
                            .filter(customer =>
                              !customerSearchValue ||
                              customer.customer_name.toLowerCase().includes(customerSearchValue.toLowerCase()) ||
                              customer.customer_number.toLowerCase().includes(customerSearchValue.toLowerCase())
                            )
                            .map((customer) => {
                              const customerIdStr = String(customer.customer_id || customer.profile_id);
                              return (
                                <CommandItem
                                  key={customerIdStr}
                                  value={`${customer.customer_name} ${customer.customer_number}`}
                                  onSelect={() => {
                                    handleCustomerChange(customerIdStr);
                                    setCustomerSearchOpen(false);
                                    setCustomerSearchValue("");
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      customerId === customerIdStr ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-medium">{customer.customer_name}</span>
                                    <span className="text-sm text-gray-500">Customer #: {customer.customer_number}</span>
                                  </div>
                                </CommandItem>
                              );
                            })}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receiptNumber">Receipt Number *</Label>
                  <Input
                    id="receiptNumber"
                    value={formData.receiptNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, receiptNumber: e.target.value }))}
                    placeholder="Enter receipt number"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receiptDate">Receipt Date *</Label>
                  <Input
                    id="receiptDate"
                    type="date"
                    value={formData.receiptDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, receiptDate: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount Received *</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
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
                  <Label htmlFor="paymentMethod">Payment Method</Label>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankAccount">Bank Account</Label>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference">Reference Number</Label>
                  <Input
                    id="reference"
                    value={formData.reference}
                    onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                    placeholder="Transaction reference"
                  />
                </div>

                {formData.paymentMethod === "CHECK" && (
                  <div className="space-y-2">
                    <Label htmlFor="checkNumber">Check Number</Label>
                    <Input
                      id="checkNumber"
                      value={formData.checkNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, checkNumber: e.target.value }))}
                      placeholder="Check number"
                    />
                  </div>
                )}

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
                      No receivable invoices found for this customer
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

              {/* Receipt Applications */}
              <Card>
                <CardHeader>
                  <CardTitle>Receipt Applications</CardTitle>
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

            {/* Receipt Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Receipt Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Total Applied</Label>
                    <div className="text-lg font-mono">${(Number(totalApplied) || 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Receipt Amount</Label>
                    <div className="text-lg font-mono">${(Number(formData.amount) || 0).toFixed(2)} {formData.currency}</div>
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
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
              <Button 
                type="submit" 
                disabled={loading || applications.length === 0}
              >
                {loading
                  ? receiptToEdit
                    ? (receiptToEdit.status === 'DRAFT' ? "Creating..." : "Updating...")
                    : "Creating..."
                  : receiptToEdit
                    ? (receiptToEdit.status === 'DRAFT' ? "Create Receipt" : "Update Receipt")
                    : "Create Receipt"}
              </Button>
            </div>
          </form>
          )}
      </div>
    </div>
  );
};
