import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InvoiceForm } from "../forms/InvoiceForm";
import { ReceiptForm } from "../forms/ReceiptForm";
import { Search, Plus, CreditCard, Filter, Download, Mail, Receipt, Eye, Edit, CheckCircle, XCircle, FilePenLine, Upload } from "lucide-react";
import apiService from "@/services/api";
import * as XLSX from 'xlsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, FileText } from "lucide-react";
import type { ReceiptFormData } from "../forms/receipt/ReceiptFormFields";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface InvoiceLine {
  line_id: number;
  line_number: number;
  item_code?: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  line_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_line_amount: number;
}

// Interface for form handling - matches InvoiceForm expectations
interface InvoiceLineItem {
  id: string;
  item_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_line_amount: number;
}

interface ReceiptApplication {
  application_id: number;
  receipt_id?: number;
  invoice_id: number;
  invoice_number?: string;
  applied_amount: number;
  unapplied_amount?: number;
  applied_date?: string;
  application_date?: string;
  status?: string;
  notes?: string;
}

interface Invoice {
  invoice_id: number;
  invoice_number: string;
  customer_name: string;
  customer_number: string;
  subtotal?: string | number;
  tax_amount?: string | number;
  total_amount: string | number;
  amount_paid: string | number;
  amount_due: string | number;
  due_date: string;
  status: string;
  approval_status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  invoice_date: string;
  notes?: string;
  payment_terms_id: number;
  currency_code?: string;
  exchange_rate?: number;
  line_items?: InvoiceLine[];
}

// Interface for form handling - matches InvoiceForm expectations
interface InvoiceForForm {
  invoice_id: number;
  invoice_number: string;
  customer_name: string;
  customer_number: string;
  total_amount: string | number;
  amount_paid: string | number;
  amount_due: string | number;
  due_date: string;
  status: string;
  invoice_date: string;
  notes?: string;
  payment_terms_id: number;
  line_items?: InvoiceLineItem[];
}

interface Receipt {
  receipt_id: number;
  receipt_number: string;
  receipt_date: string;
  customer_id: number;
  customer_name: string;
  customer_number?: string;
  total_amount: string | number;
  amount_applied: string | number;
  amount_unapplied: string | number;
  currency_code: string;
  exchange_rate?: number;
  payment_method?: string;
  bank_account?: string;
  reference_number?: string;
  status: string;
  notes?: string;
  applications?: ReceiptApplication[];
}

interface ImportHeaderRow {
  'Invoice Number'?: string;
  'Customer Name'?: string;
  'Customer Number'?: string;
  'Invoice Date'?: string;
  'Due Date'?: string;
  'Subtotal'?: number;
  'Tax Amount'?: number;
  'Total Amount'?: number;
  'Amount Paid'?: number;
  'Amount Due'?: number;
  'Status'?: string;
  'Payment Terms'?: number;
  'Currency'?: string;
  'Exchange Rate'?: number;
  'Notes'?: string;
  [key: string]: unknown;
}

interface ImportLineRow {
  'Invoice Number'?: string;
  'Line Number'?: number;
  'Item Code'?: string;
  'Item Name'?: string;
  'Description'?: string;
  'Quantity'?: number;
  'Unit Price'?: number;
  'Line Amount'?: number;
  'Tax Rate'?: number;
  'Tax Amount'?: number;
  'Total Line Amount'?: number;
  [key: string]: unknown;
}

interface Customer {
  customer_id?: number;
  profile_id?: number;
  customer_number: string;
  customer_name: string;
  customer_type?: string;
  status?: string;
}

export const Receivables = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState<Invoice | null>(null);
  const [invoiceToView, setInvoiceToView] = useState<InvoiceForForm | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceForForm | null>(null);
  const [receiptToView, setReceiptToView] = useState<ReceiptFormData | null>(null);
  const [showReceiptView, setShowReceiptView] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReceipts, setLoadingReceipts] = useState(true);
  const [updatingInvoiceId, setUpdatingInvoiceId] = useState<number | null>(null);
  const [approvingInvoiceId, setApprovingInvoiceId] = useState<number | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [invoiceToMarkAsPaid, setInvoiceToMarkAsPaid] = useState<Invoice | null>(null);
  const [receiptApplications, setReceiptApplications] = useState<ReceiptApplication[]>([]);
  const [loadingReceiptApplications, setLoadingReceiptApplications] = useState(false);

  useEffect(() => {
    async function fetchInvoices() {
      setLoading(true);
      try {
        const data = await apiService.getInvoices();
        setInvoices(data);
      } catch (error) {
        console.error('Error fetching invoices:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, []);

  useEffect(() => {
    async function fetchReceipts() {
      setLoadingReceipts(true);
      try {
        const data = await apiService.getReceipts();
        setReceipts(data);
      } catch (error) {
        console.error('Error fetching receipts:', error);
      } finally {
        setLoadingReceipts(false);
      }
    }
    fetchReceipts();
  }, []);

  const filteredReceivables = invoices.filter(item => {
    const matchesSearch = (item.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredReceipts = receipts.filter(item => {
    const matchesStatus = statusFilter === "all" || item.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesStatus;
  });

  // Debug logging to understand the data
  console.log('Invoices data:', invoices);
  
  const totalOutstanding = invoices.filter(r => {
    const isOutstanding = r.status !== "PAID" && Number(r.amount_due || 0) > 0;
    console.log(`Invoice ${r.invoice_number}: status=${r.status}, amount_due=${r.amount_due}, isOutstanding=${isOutstanding}`);
    return isOutstanding;
  }).reduce((sum, r) => {
    const amountDue = Number(r.amount_due || 0);
    return sum + amountDue;
  }, 0);
  
  const overdueAmount = invoices.filter(r => {
    const dueDate = new Date(r.due_date);
    const now = new Date();
    const isOverdue = dueDate < now;
    console.log(`Invoice ${r.invoice_number}: due_date=${r.due_date}, parsed_due_date=${dueDate}, now=${now}, isOverdue=${isOverdue}`);
    return isOverdue;
  }).reduce((sum, r) => {
    // For overdue invoices, use total_amount if amount_due is 0 (paid late)
    const amount = r.status === "PAID" ? Number(r.total_amount || 0) : Number(r.amount_due || 0);
    console.log(`Overdue invoice ${r.invoice_number}: status=${r.status}, total_amount=${r.total_amount}, amount_due=${r.amount_due}, calculated_amount=${amount}`);
    return sum + amount;
  }, 0);
  
  const overdueCount = invoices.filter(r => {
    const dueDate = new Date(r.due_date);
    const now = new Date();
    return dueDate < now;
  }).length;
  const avgDaysToPayment = 23; // Placeholder, can be calculated from data if available

  const handleMarkAsPaid = async (invoice: Invoice) => {
    if (updatingInvoiceId === invoice.invoice_id) return; // Prevent double-clicking
    
    setUpdatingInvoiceId(invoice.invoice_id);
    try {
      console.log(`Marking invoice ${invoice.invoice_number} as paid...`);
      
      // Update the invoice status to PAID
      await apiService.updateInvoiceStatus(invoice.invoice_id, 'PAID');
      
      // Update the local state immediately for better UX
      setInvoices(prevInvoices => 
        prevInvoices.map(inv => 
          inv.invoice_id === invoice.invoice_id 
            ? { 
                ...inv, 
                status: 'PAID',
                amount_paid: inv.total_amount,
                amount_due: 0
              }
            : inv
        )
      );
      
      console.log(`Invoice ${invoice.invoice_number} marked as paid successfully`);
      
      // Show success message
      toast.success(`Invoice ${invoice.invoice_number} marked as paid successfully`);
      
    } catch (err) {
      console.error('Failed to mark invoice as paid:', err);
      toast.error(`Failed to mark invoice ${invoice.invoice_number} as paid. Please try again.`);
      
      // Refresh the data to ensure consistency
      try {
        const data = await apiService.getInvoices();
        setInvoices(data);
      } catch (refreshErr) {
        console.error('Failed to refresh invoices after error:', refreshErr);
      }
    } finally {
      setUpdatingInvoiceId(null);
    }
  };

  const getStatusBadge = (invoice: Invoice) => {
    return (
      <Badge variant={
        invoice.status === "PAID" ? "default" :
        invoice.status === "OPEN" && new Date(invoice.due_date) < new Date() ? "destructive" :
        invoice.status === "OPEN" ? "secondary" :
        invoice.status === "DRAFT" ? "outline" : "secondary"
      }>
        {invoice.status}
      </Badge>
    );
  };

  const handleSendReminder = (invoice: Invoice) => {
    console.log(`Sending reminder for ${invoice.invoice_number} to ${invoice.customer_name}`);
    // Simulate sending email reminder
  };

  const handleExportData = async () => {
    try {
      // Fetch full invoice details with line items
      const invoicesWithLines = await Promise.all(
        invoices.map(async (inv) => {
          try {
            const fullInvoice = await apiService.getInvoice(inv.invoice_id);
            return fullInvoice;
          } catch (error) {
            console.error(`Error fetching invoice ${inv.invoice_id}:`, error);
            return inv;
          }
        })
      );

      // Prepare header data for export
      const headerData = invoicesWithLines.map(inv => ({
        'Invoice Number': inv.invoice_number,
        'Customer Name': inv.customer_name,
        'Customer Number': inv.customer_number,
        'Invoice Date': inv.invoice_date,
        'Due Date': inv.due_date,
        'Subtotal': Number(inv.subtotal || 0),
        'Tax Amount': Number(inv.tax_amount || 0),
        'Total Amount': Number(inv.total_amount || 0),
        'Amount Paid': Number(inv.amount_paid || 0),
        'Amount Due': Number(inv.amount_due || 0),
        'Status': inv.status,
        'Payment Terms': inv.payment_terms_id,
        'Currency': inv.currency_code || 'USD',
        'Exchange Rate': Number(inv.exchange_rate || 1),
        'Notes': inv.notes || ''
      }));

      // Prepare line items data for export
      const lineItemsData: ImportLineRow[] = [];
      invoicesWithLines.forEach(inv => {
        if (inv.line_items && Array.isArray(inv.line_items)) {
          inv.line_items.forEach((line: InvoiceLine, index: number) => {
            lineItemsData.push({
              'Invoice Number': inv.invoice_number,
              'Line Number': line.line_number || index + 1,
              'Item Code': line.item_code || '',
              'Item Name': line.item_name,
              'Description': line.description || '',
              'Quantity': Number(line.quantity || 0),
              'Unit Price': Number(line.unit_price || 0),
              'Line Amount': Number(line.line_amount || 0),
              'Tax Rate': Number(line.tax_rate || 0),
              'Tax Amount': Number(line.tax_amount || 0),
              'Total Line Amount': Number(line.total_line_amount || (line.line_amount || 0) + (line.tax_amount || 0))
            });
          });
        }
      });

      // Create workbook with two sheets
      const workbook = XLSX.utils.book_new();
      const headerWorksheet = XLSX.utils.json_to_sheet(headerData);
      const lineItemsWorksheet = XLSX.utils.json_to_sheet(lineItemsData);
      
      XLSX.utils.book_append_sheet(workbook, headerWorksheet, 'Invoice Headers');
      XLSX.utils.book_append_sheet(workbook, lineItemsWorksheet, 'Invoice Lines');
      
      XLSX.writeFile(workbook, `ar_invoices_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Invoices exported successfully');
    } catch (error) {
      console.error('Error exporting invoices:', error);
      toast.error('Failed to export invoices');
    }
  };

  // Helper function to format date to YYYY-MM-DD for MySQL DATE column
  const formatDateForDB = (dateValue: string | Date | null | undefined): string => {
    if (!dateValue) {
      return new Date().toISOString().split('T')[0];
    }
    
    // If already in YYYY-MM-DD format, return as is
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    
    // If it's a Date object, format it
    if (dateValue instanceof Date) {
      const year = dateValue.getFullYear();
      const month = String(dateValue.getMonth() + 1).padStart(2, '0');
      const day = String(dateValue.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // If it's an ISO string or date string, extract just the date part
    if (typeof dateValue === 'string') {
      // Extract YYYY-MM-DD from ISO string (e.g., "2025-12-19T19:00:00.000Z" -> "2025-12-19")
      const dateMatch = dateValue.match(/^(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        return dateMatch[1];
      }
      
      // Try parsing as Date
      try {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
      } catch (e) {
        // If parsing fails, return today's date as fallback
        console.warn('Failed to parse date:', dateValue, e);
      }
    }
    
    // Fallback to today's date
    return new Date().toISOString().split('T')[0];
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Read invoice headers sheet
      const headerSheet = workbook.Sheets['Invoice Headers'] || workbook.Sheets[workbook.SheetNames[0]];
      const headers = XLSX.utils.sheet_to_json(headerSheet) as ImportHeaderRow[];
      
      // Read invoice lines sheet
      const linesSheet = workbook.Sheets['Invoice Lines'] || workbook.Sheets[workbook.SheetNames[1]];
      const lines = XLSX.utils.sheet_to_json(linesSheet) as ImportLineRow[];

      if (!headers || headers.length === 0) {
        toast.error('No invoice headers found in the file');
        return;
      }

      // Group lines by invoice number
      const linesByInvoice: { [key: string]: ImportLineRow[] } = {};
      lines.forEach((line: ImportLineRow) => {
        const invoiceNum = line['Invoice Number'];
        if (invoiceNum) {
          if (!linesByInvoice[invoiceNum]) {
            linesByInvoice[invoiceNum] = [];
          }
          linesByInvoice[invoiceNum].push(line);
        }
      });

      // Process each invoice
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const header of headers) {
        try {
          const invoiceNum = header['Invoice Number'];
          const customerName = header['Customer Name'];
          const customerNumber = header['Customer Number'];

          if (!customerName && !customerNumber) {
            errors.push(`Invoice ${invoiceNum}: Customer name or number is required`);
            errorCount++;
            continue;
          }

          // Get customer ID
          const customersResponse = await apiService.getCustomers();
          const customers = Array.isArray(customersResponse) ? customersResponse : (customersResponse.data || []);
          const customer = customers.find((c: Customer) => 
            c.customer_name === customerName || c.customer_number === customerNumber
          );

          if (!customer) {
            errors.push(`Invoice ${invoiceNum}: Customer not found (${customerName || customerNumber})`);
            errorCount++;
            continue;
          }

          // Get customer sites
          const customerId = customer.customer_id || customer.profile_id;
          if (!customerId) {
            errors.push(`Invoice ${invoiceNum}: Invalid customer ID`);
            errorCount++;
            continue;
          }
          const customerSitesResponse = await apiService.getCustomerSites(customerId);
          const customerSites = Array.isArray(customerSitesResponse) ? customerSitesResponse : (customerSitesResponse.data || []);
          const billToSite = customerSites.find((s: { site_type: string }) => 
            s.site_type === 'BILL_TO' || s.site_type === 'BOTH'
          );

          if (!billToSite) {
            errors.push(`Invoice ${invoiceNum}: No billing site found for customer`);
            errorCount++;
            continue;
          }

          // Prepare line items
          const invoiceLines = (linesByInvoice[invoiceNum || ''] || []).map((line: ImportLineRow) => ({
            line_number: line['Line Number'] || 1,
            item_code: line['Item Code'] || null,
            item_name: line['Item Name'] || 'Item',
            description: line['Description'] || '',
            quantity: Number(line['Quantity'] || 1),
            unit_price: Number(line['Unit Price'] || 0),
            line_amount: Number(line['Line Amount'] || 0),
            tax_rate: Number(line['Tax Rate'] || 0),
            tax_amount: Number(line['Tax Amount'] || 0)
          }));

          // Calculate totals
          const subtotal = invoiceLines.reduce((sum, line) => sum + Number(line.line_amount || 0), 0);
          const taxAmount = invoiceLines.reduce((sum, line) => sum + Number(line.tax_amount || 0), 0);
          const totalAmount = subtotal + taxAmount;

          // Create invoice payload
          const invoicePayload = {
            invoice_number: invoiceNum || undefined,
            customer_id: customerId,
            customer_site_id: billToSite.site_id,
            invoice_date: formatDateForDB(header['Invoice Date']),
            due_date: formatDateForDB(header['Due Date']),
            payment_terms: header['Payment Terms'] || 30,
            currency_code: header['Currency'] || 'USD',
            exchange_rate: Number(header['Exchange Rate'] || 1),
            subtotal: subtotal,
            tax_amount: taxAmount,
            total: totalAmount,
            status: header['Status'] || 'DRAFT',
            notes: header['Notes'] || '',
            line_items: invoiceLines
          };

          await apiService.createInvoice(invoicePayload);
          successCount++;
        } catch (error: unknown) {
          const invoiceNum = header['Invoice Number'] || 'Unknown';
          const errorMessage = error instanceof Error ? error.message : 'Failed to import';
          errors.push(`Invoice ${invoiceNum}: ${errorMessage}`);
          errorCount++;
          console.error(`Error importing invoice ${invoiceNum}:`, error);
        }
      }

      // Reset file input
      event.target.value = '';

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} invoice(s)`);
        // Refresh invoice list
        const data = await apiService.getInvoices();
        setInvoices(data);
      }

      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} invoice(s). Check console for details.`);
        console.error('Import errors:', errors);
      }
    } catch (error: unknown) {
      console.error('Error importing invoices:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to import invoices: ${errorMessage}`);
    }
  };

  const handleExportReceiptsData = () => {
    // Prepare receipt data for export
    const exportData = receipts.map(rec => ({
      'Receipt Number': rec.receipt_number,
      'Date': rec.receipt_date,
      'Customer Name': rec.customer_name,
      'Customer Number': rec.customer_number,
      'Total Amount': Number(rec.total_amount || 0),
      'Amount Applied': Number(rec.amount_applied || 0),
      'Amount Unapplied': Number(rec.amount_unapplied || 0),
      'Currency': rec.currency_code,
      'Payment Method': rec.payment_method,
      'Bank Account': rec.bank_account,
      'Reference': rec.reference_number,
      'Status': rec.status,
      'Notes': rec.notes
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Receipts');
    XLSX.writeFile(workbook, 'receipts.xlsx');
  };

  const handleCreateReceipt = (receivable: Invoice) => {
    setSelectedReceivable(receivable);
    setShowReceiptForm(true);
  };

  const closeReceiptForm = () => {
    setShowReceiptForm(false);
    setSelectedReceivable(null);
  };

  const handleViewInvoice = async (invoice: Invoice) => {
    try {
      // Fetch detailed invoice data including line items
      const detailedInvoice = await apiService.getInvoice(invoice.invoice_id);
      setViewingInvoice(detailedInvoice);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      toast.error('Failed to load invoice details');
      // Fallback to using the basic invoice data
      setViewingInvoice(invoice);
    }
  };

  const handleEditInvoice = async (invoice: Invoice) => {
    try {
      // Fetch full invoice details with line items
      const detailedInvoice = await apiService.getInvoice(invoice.invoice_id);
      
      // Transform the invoice data to match form expectations
      const transformedInvoice: InvoiceForForm = {
        ...detailedInvoice,
        line_items: detailedInvoice.line_items?.map((item, index) => ({
          id: String(index + 1),
          item_code: item.item_code || undefined,
          item_name: item.item_name || '',
          description: item.description || '',
          quantity: Number(item.quantity || 0),
          unit_price: Number(item.unit_price || 0),
          line_amount: Number(item.line_amount || 0),
          tax_rate: Number(item.tax_rate || 0),
          tax_amount: Number(item.tax_amount || 0),
          total_line_amount: Number(item.total_line_amount || 0)
        }))
      };
      
      setEditingInvoice(transformedInvoice);
      setViewingInvoice(null); // Close view dialog
      setShowInvoiceForm(true);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      toast.error('Failed to load invoice for editing');
    }
  };

  const handleApproveInvoice = async (invoice: Invoice, action: 'APPROVED' | 'REJECTED') => {
    const actionText = action === 'APPROVED' ? 'approve' : 'reject';
    
    if (!confirm(`Are you sure you want to ${actionText} invoice ${invoice.invoice_number}?`)) {
      return;
    }

    try {
      setApprovingInvoiceId(invoice.invoice_id);
      
      // Only update approval_status, not status
      // Status is automatically determined by amount_due
      await apiService.updateInvoiceStatus(invoice.invoice_id, undefined, action);
      toast.success(`Invoice ${actionText}ed successfully`);
      
      // Refresh invoices list
      const data = await apiService.getInvoices();
      setInvoices(data);
    } catch (error) {
      console.error(`Error ${actionText}ing invoice:`, error);
      const errorMessage = (error as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || 
                          (error as { message?: string })?.message || 
                          `Failed to ${actionText} invoice`;
      toast.error(errorMessage);
    } finally {
      setApprovingInvoiceId(null);
    }
  };

  const handleInvoiceFormSuccess = () => {
    setShowInvoiceForm(false);
    setEditingInvoice(null);
    // Refresh invoices list
    apiService.getInvoices().then(data => {
      setInvoices(data);
    }).catch(error => {
      console.error('Error refreshing invoices:', error);
    });
  };

  const handleViewReceipt = async (receipt: Receipt) => {
    try {
      // Fetch full receipt details from API
      const fullReceipt = await apiService.getReceipt(receipt.receipt_id);
      setViewingReceipt(fullReceipt);
      
      // Fetch receipt applications (invoices applied to this receipt)
      setLoadingReceiptApplications(true);
      try {
        // Try to get applications from the receipt object, or fetch separately
        if (fullReceipt.applications && Array.isArray(fullReceipt.applications)) {
          setReceiptApplications(fullReceipt.applications);
        } else {
          // If applications not included, try to fetch them
          // For now, use empty array if not available
          setReceiptApplications([]);
        }
      } catch (error) {
        console.error('Error fetching receipt applications:', error);
        setReceiptApplications([]);
      } finally {
        setLoadingReceiptApplications(false);
      }
    } catch (error) {
      console.error('Error fetching receipt details:', error);
      toast.error('Failed to load receipt details');
      // Fallback to using the basic receipt data
      setViewingReceipt(receipt);
      setReceiptApplications([]);
    }
  };

  const handleEditReceipt = async (receipt: Receipt) => {
    try {
      // Fetch full receipt details from API
      const fullReceipt = await apiService.getReceipt(receipt.receipt_id);
      setEditingReceipt(fullReceipt);
      setShowReceiptForm(true);
    } catch (error) {
      console.error('Error fetching receipt details:', error);
      toast.error('Failed to load receipt for editing');
    }
  };

  const closeReceiptView = () => {
    setShowReceiptView(false);
    setReceiptToView(null);
  };

  const handleCreateReceiptSubmit = async (receiptData: ReceiptFormData & { applications?: Array<{ invoice_id: number; application_amount: number; application_date?: string }>; customerId?: string; receiptId?: number }) => {
    // Map frontend fields to backend fields
    const backendData: {
      receipt_number: string;
      receipt_date: string;
      customer_id?: string;
      customer_name: string;
      total_amount: number;
      amount_received: number;
      currency: string;
      payment_method: string;
      bank_account: string;
      reference_number: string;
      status: string;
      description: string;
      applications?: Array<{ invoice_id: number; application_amount: number; application_date?: string }>;
    } = {
      receipt_number: receiptData.receiptNumber,
      receipt_date: receiptData.receiptDate,
      customer_id: receiptData.customerId,
      customer_name: receiptData.customer, // Fallback for backward compatibility
      total_amount: Number(receiptData.amount),
      amount_received: Number(receiptData.amount), // Also send for backward compatibility
      currency: receiptData.currency,
      payment_method: receiptData.paymentMethod,
      bank_account: receiptData.bankAccount,
      reference_number: receiptData.reference,
      status: receiptData.status || 'DRAFT', // Default to DRAFT if not provided
      description: receiptData.description,
    };
    
    // Add applications array if provided
    if (receiptData.applications && Array.isArray(receiptData.applications)) {
      backendData.applications = receiptData.applications;
      console.log('Receivables: Sending applications to backend:', JSON.stringify(receiptData.applications));
    } else {
      console.log('Receivables: No applications found in receiptData');
    }
    
    console.log('Receivables: Sending receipt data to backend:', JSON.stringify(backendData));
    try {
      let response;
      // Check if we're editing an existing receipt (receiptId passed from form)
      if (receiptData.receiptId) {
        // Update existing receipt
        response = await apiService.updateReceipt(receiptData.receiptId, backendData);
        console.log('Receivables: Receipt updated successfully:', response);
      } else {
        // Create new receipt
        response = await apiService.createReceipt(backendData);
        console.log('Receivables: Receipt created successfully:', response);
      }
      // Refresh receipts and invoices
      const data = await apiService.getReceipts();
      setReceipts(data);
      const invoiceData = await apiService.getInvoices();
      setInvoices(invoiceData);
      setShowReceiptForm(false);
      setEditingReceipt(null);
      // Don't show toast here - let handleReceiptFormSuccess handle it
    } catch (error) {
      console.error('Receivables: Error saving receipt:', error);
      const errorMessage = (error as { message?: string })?.message || 'Failed to save receipt';
      toast.error(errorMessage);
    }
  };

  if (showInvoiceForm) {
    return (
      <InvoiceForm 
        onClose={() => {
          setShowInvoiceForm(false);
          setEditingInvoice(null);
        }} 
        invoiceToView={editingInvoice}
        mode={editingInvoice ? 'edit' : 'create'}
        onSuccess={handleInvoiceFormSuccess}
      />
    );
  }

  const handleReceiptFormSuccess = async (options?: { mode?: 'draft' | 'final' }) => {
    setShowReceiptForm(false);
    setEditingReceipt(null);
    setSelectedReceivable(null);
    // Refresh receipts list
    try {
      const data = await apiService.getReceipts();
      setReceipts(data);
      // Also refresh invoices to update their status and amounts
      const invoiceData = await apiService.getInvoices();
      setInvoices(invoiceData);
    } catch (error) {
      console.error('Error refreshing receipts:', error);
    }
    if (options?.mode === 'draft') {
      toast.success('Receipt saved as draft');
    } else {
      toast.success('Receipt created successfully');
    }
  };

  if (showReceiptForm) {
    return <ReceiptForm 
      onClose={() => {
        setShowReceiptForm(false);
        setEditingReceipt(null);
        setSelectedReceivable(null);
      }} 
      selectedReceivable={selectedReceivable} 
      onSubmit={handleCreateReceiptSubmit}
      receiptToEdit={editingReceipt ? {
        receipt_id: editingReceipt.receipt_id,
        receipt_number: editingReceipt.receipt_number,
        customer_id: editingReceipt.customer_id,
        customer_name: editingReceipt.customer_name,
        receipt_date: editingReceipt.receipt_date,
        currency_code: editingReceipt.currency_code,
        total_amount: Number(editingReceipt.total_amount) || 0,
        amount_applied: Number(editingReceipt.amount_applied) || 0,
        amount_unapplied: Number(editingReceipt.amount_unapplied) || 0,
        payment_method: editingReceipt.payment_method,
        bank_account: editingReceipt.bank_account,
        reference_number: editingReceipt.reference_number,
        status: editingReceipt.status as 'DRAFT' | 'PAID',
        notes: editingReceipt.notes,
        applications: editingReceipt.applications?.map(app => ({
          application_id: app.application_id,
          invoice_id: app.invoice_id,
          invoice_number: app.invoice_number || String(app.invoice_id),
          applied_amount: Number(app.applied_amount) || 0,
          unapplied_amount: Number(app.unapplied_amount) || 0,
          applied_date: app.applied_date || app.application_date || editingReceipt.receipt_date
        })) || []
      } : null}
      onSuccess={handleReceiptFormSuccess}
    />;
  }

  if (showReceiptView && receiptToView) {
    return <ReceiptForm onClose={closeReceiptView} receiptToView={receiptToView} mode="view" />;
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accounts Receivable</h1>
          <p className="text-gray-500 mt-1">Manage customer invoices and payments</p>
        </div>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <CreditCard className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalOutstanding.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Across {invoices.filter(r => r.status !== "PAID" && Number(r.amount_due || 0) > 0).length} unpaid invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
            <Mail className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${overdueAmount.toLocaleString()}</div>
            <p className="text-xs text-red-500 mt-1">Requires immediate attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Count</CardTitle>
            <Receipt className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{overdueCount}</div>
            <p className="text-xs text-gray-500 mt-1">Invoices overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Days to Payment</CardTitle>
            <BarChart3 className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{avgDaysToPayment}</div>
            <p className="text-xs text-green-500 mt-1">On track</p>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="invoice" className="space-y-6">
        <TabsList>
          <TabsTrigger value="invoice" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Invoice
          </TabsTrigger>
          <TabsTrigger value="receipt" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Receipt
          </TabsTrigger>
        </TabsList>
        <TabsContent value="invoice">
          <div className="flex justify-end mb-4 gap-2">
            <Button 
              variant="outline" 
              onClick={handleExportData}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.xlsx,.xls';
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.files) {
                    handleImportData({ target } as React.ChangeEvent<HTMLInputElement>);
                  }
                };
                input.click();
              }}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import
            </Button>
            <Button 
              onClick={() => setShowInvoiceForm(true)}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Create Invoice
            </Button>
          </div>
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search invoices or customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">AR Invoices</h3>
                <p className="text-sm text-gray-500">
                  Showing {filteredReceivables.length} of {invoices.length} invoices
                </p>
              </div>
              {loading ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Loading invoices...</div>
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">No invoices found</div>
                  <Button 
                    onClick={() => setShowInvoiceForm(true)} 
                    className="mt-4"
                    variant="outline"
                  >
                    Create your first invoice
                  </Button>
                </div>
              ) : filteredReceivables.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">No invoices match your search criteria</div>
                  <Button 
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                    }} 
                    className="mt-4"
                    variant="outline"
                  >
                    Clear filters
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Invoice #</th>
                        <th className="text-left py-3 px-4 font-semibold">Customer</th>
                        <th className="text-left py-3 px-4 font-semibold">Invoice Date</th>
                        <th className="text-left py-3 px-4 font-semibold">Due Date</th>
                        <th className="text-left py-3 px-4 font-semibold">Total Amount</th>
                        <th className="text-left py-3 px-4 font-semibold">Amount Due</th>
                        <th className="text-left py-3 px-4 font-semibold">Status</th>
                        <th className="text-left py-3 px-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReceivables.map((item) => {
                        const currencyCode = item.currency_code || 'USD';
                        return (
                          <tr key={item.invoice_id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{item.invoice_number}</td>
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium">{item.customer_name}</div>
                                {item.notes && (
                                  <div className="text-sm text-gray-500">{item.notes}</div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">{new Date(item.invoice_date).toLocaleDateString()}</td>
                            <td className="py-3 px-4">
                              {item.due_date ? new Date(item.due_date).toLocaleDateString() : '-'}
                            </td>
                            <td className="py-3 px-4 font-semibold">
                              ${Number(item.total_amount || 0).toLocaleString()} {currencyCode}
                            </td>
                            <td className="py-3 px-4 font-semibold">
                              ${Number(item.amount_due || 0).toLocaleString()} {currencyCode}
                            </td>
                            <td className="py-3 px-4">
                              {getStatusBadge(item)}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewInvoice(item)}
                                  className="h-8 w-8 p-0"
                                  title="View Invoice"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {(item.status === "DRAFT" || item.status === "OPEN") && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditInvoice(item)}
                                    className="h-8 w-8 p-0"
                                    title="Edit Invoice"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                                {item.approval_status === "PENDING" && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                        title="Approve/Reject Invoice"
                                        disabled={approvingInvoiceId === item.invoice_id}
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() => handleApproveInvoice(item, 'APPROVED')}
                                        className={item.status === 'OPEN' ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 focus:text-green-700'}
                                        disabled={item.status === 'OPEN'}
                                        title={item.status === 'OPEN' ? 'Invoice must be PAID before approval' : 'Approve Invoice'}
                                      >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Approve
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleApproveInvoice(item, 'REJECTED')}
                                        className="text-red-600 focus:text-red-700"
                                      >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Reject
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="receipt">
          <div className="flex justify-end mb-4 gap-2">
            <Button 
              variant="outline" 
              onClick={handleExportReceiptsData}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button 
              onClick={() => setShowReceiptForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Receipt
            </Button>
          </div>
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search receipts or customers..."
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Customer Receipts</h3>
                <p className="text-sm text-gray-500">
                  Showing {filteredReceipts.length} of {receipts.length} receipts
                </p>
              </div>
              {loadingReceipts ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Loading receipts...</div>
                </div>
              ) : receipts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">No receipts found</div>
                  <Button 
                    onClick={() => setShowReceiptForm(true)} 
                    className="mt-4"
                    variant="outline"
                  >
                    Create your first receipt
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Receipt #</th>
                        <th className="text-left py-3 px-4 font-semibold">Customer</th>
                        <th className="text-right py-3 px-4 font-semibold">Amount</th>
                        <th className="text-right py-3 px-4 font-semibold">Applied</th>
                        <th className="text-right py-3 px-4 font-semibold">Unapplied</th>
                        <th className="text-center py-3 px-4 font-semibold">Date</th>
                        <th className="text-center py-3 px-4 font-semibold">Status</th>
                        <th className="text-center py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReceipts.map((item) => (
                        <tr key={item.receipt_id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{item.receipt_number}</td>
                        <td className="py-3 px-4">{item.customer_name}</td>
                          <td className="py-3 px-4 text-right font-semibold">${Number(item.total_amount || 0).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-semibold">${Number(item.amount_applied || 0).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-semibold">${Number(item.amount_unapplied || 0).toFixed(2)}</td>
                          <td className="py-3 px-4 text-center">
                            {item.receipt_date ? new Date(item.receipt_date).toLocaleDateString() : '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                              <Badge variant={
                                item.status === "PAID" ? "default" :
                                item.status === "DRAFT" ? "outline" : "secondary"
                              }>
                                {item.status}
                              </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewReceipt(item)}
                                className="h-8 w-8 p-0"
                                title="View Receipt"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {item.status === "DRAFT" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditReceipt(item)}
                                  className="h-8 w-8 p-0"
                                  title="Edit Draft Receipt"
                                >
                                  <FilePenLine className="h-4 w-4" />
                                </Button>
                              )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Invoice Dialog */}
      <Dialog open={!!viewingInvoice} onOpenChange={(open) => !open && setViewingInvoice(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details - {viewingInvoice?.invoice_number}</DialogTitle>
          </DialogHeader>
          {viewingInvoice && (
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{viewingInvoice.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Invoice Date</p>
                  <p className="font-medium">{new Date(viewingInvoice.invoice_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Due Date</p>
                  <p className="font-medium">{new Date(viewingInvoice.due_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge variant={
                    viewingInvoice.status === "PAID" ? "default" :
                    viewingInvoice.status === "OPEN" && new Date(viewingInvoice.due_date) < new Date() ? "destructive" :
                    viewingInvoice.status === "OPEN" ? "secondary" :
                    viewingInvoice.status === "DRAFT" ? "outline" : "secondary"
                  }>
                    {viewingInvoice.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Approval Status</p>
                  <Badge variant={
                    viewingInvoice.approval_status === "APPROVED" ? "default" :
                    viewingInvoice.approval_status === "PENDING" ? "secondary" : "destructive"
                  }>
                    {viewingInvoice.approval_status || "PENDING"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Terms</p>
                  <p className="font-medium">{viewingInvoice.payment_terms_id} days</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Currency</p>
                  <p className="font-medium">{viewingInvoice.currency_code || 'USD'}</p>
                </div>
              </div>

              {/* Line Items */}
              {viewingInvoice.line_items && viewingInvoice.line_items.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Line Items</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4">Line</th>
                          <th className="text-left py-2 px-4">Item Code</th>
                          <th className="text-left py-2 px-4">Item Name</th>
                          <th className="text-right py-2 px-4">Quantity</th>
                          <th className="text-right py-2 px-4">Unit Price</th>
                          <th className="text-right py-2 px-4">Tax %</th>
                          <th className="text-right py-2 px-4">Line Amount</th>
                          <th className="text-right py-2 px-4">Tax Amount</th>
                          <th className="text-right py-2 px-4">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingInvoice.line_items.map((line) => (
                          <tr key={line.line_id || line.line_number} className="border-b">
                            <td className="py-2 px-4">{line.line_number}</td>
                            <td className="py-2 px-4">{line.item_code || '-'}</td>
                            <td className="py-2 px-4">{line.item_name}</td>
                            <td className="py-2 px-4 text-right">{line.quantity}</td>
                            <td className="py-2 px-4 text-right">${(Number(line.unit_price) || 0).toFixed(2)}</td>
                            <td className="py-2 px-4 text-right">{line.tax_rate}%</td>
                            <td className="py-2 px-4 text-right">${(Number(line.line_amount) || 0).toFixed(2)}</td>
                            <td className="py-2 px-4 text-right">${(Number(line.tax_amount) || 0).toFixed(2)}</td>
                            <td className="py-2 px-4 text-right font-semibold">${((Number(line.line_amount) || 0) + (Number(line.tax_amount) || 0)).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="border-t pt-4">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">${(Number(viewingInvoice.subtotal) || viewingInvoice.line_items?.reduce((sum, line) => sum + (Number(line.line_amount) || 0), 0) || 0).toFixed(2)} {viewingInvoice.currency_code || 'USD'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax Amount:</span>
                      <span className="font-medium">${(Number(viewingInvoice.tax_amount) || viewingInvoice.line_items?.reduce((sum, line) => sum + (Number(line.tax_amount) || 0), 0) || 0).toFixed(2)} {viewingInvoice.currency_code || 'USD'}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Total Amount:</span>
                      <span className="font-bold text-lg">${(Number(viewingInvoice.total_amount) || 0).toFixed(2)} {viewingInvoice.currency_code || 'USD'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount Paid:</span>
                      <span className="font-medium">${(Number(viewingInvoice.amount_paid) || 0).toFixed(2)} {viewingInvoice.currency_code || 'USD'}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Amount Due:</span>
                      <span className="font-bold text-lg text-red-600">${(Number(viewingInvoice.amount_due) || 0).toFixed(2)} {viewingInvoice.currency_code || 'USD'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {viewingInvoice.notes && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Notes</p>
                  <p className="text-sm">{viewingInvoice.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Receipt Dialog */}
      <Dialog open={!!viewingReceipt} onOpenChange={(open) => {
        if (!open) {
          setViewingReceipt(null);
          setReceiptApplications([]);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Receipt Details - {viewingReceipt?.receipt_number}</DialogTitle>
          </DialogHeader>
          {viewingReceipt && (
            <div className="space-y-6">
              {/* Receipt Header */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Receipt Number</p>
                  <p className="font-medium">{viewingReceipt.receipt_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Receipt Date</p>
                  <p className="font-medium">{new Date(viewingReceipt.receipt_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{viewingReceipt.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge variant={
                    viewingReceipt.status === "PAID" ? "default" :
                    viewingReceipt.status === "DRAFT" ? "outline" : "secondary"
                  }>
                    {viewingReceipt.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Currency</p>
                  <p className="font-medium">{viewingReceipt.currency_code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Exchange Rate</p>
                  <p className="font-medium">{viewingReceipt.exchange_rate || 1.0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium">{viewingReceipt.payment_method || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bank Account</p>
                  <p className="font-medium">{viewingReceipt.bank_account || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reference Number</p>
                  <p className="font-medium">{viewingReceipt.reference_number || '-'}</p>
                </div>
              </div>

              {/* Receipt Applications (Invoices) */}
              {loadingReceiptApplications ? (
                <div className="text-center py-4">
                  <div className="text-gray-500">Loading invoice applications...</div>
                </div>
              ) : receiptApplications.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Applied Invoices</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4">Invoice Number</th>
                          <th className="text-right py-2 px-4">Amount Due</th>
                          <th className="text-right py-2 px-4">Applied Amount</th>
                          <th className="text-right py-2 px-4">Unapplied Amount</th>
                          <th className="text-left py-2 px-4">Application Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receiptApplications.map((app, index) => {
                          const appliedAmount = Number(app.applied_amount) || 0;
                          const unappliedAmount = Number(app.unapplied_amount) || 0;
                          const amountDue = appliedAmount + unappliedAmount;
                          
                          return (
                            <tr key={app.application_id || index} className="border-b hover:bg-gray-50">
                              <td className="py-2 px-4 font-medium">{app.invoice_number || app.invoice_id}</td>
                              <td className="py-2 px-4 text-right font-medium">${amountDue.toFixed(2)}</td>
                              <td className="py-2 px-4 text-right font-semibold">${appliedAmount.toFixed(2)}</td>
                              <td className="py-2 px-4 text-right">${unappliedAmount.toFixed(2)}</td>
                              <td className="py-2 px-4">
                                {app.applied_date || app.application_date ? new Date(app.applied_date || app.application_date).toLocaleDateString() : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No invoices applied to this receipt
                </div>
              )}

              {/* Receipt Amounts */}
              <div className="border-t pt-4">
                <div className="flex justify-end">
                  <div className="w-80">
                    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-lg p-5 border border-indigo-200 shadow-sm">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-gray-700">Receipt Amount:</span>
                          <span className="text-lg font-bold text-gray-900 whitespace-nowrap">${(Number(viewingReceipt.total_amount) || 0).toFixed(2)} {viewingReceipt.currency_code}</span>
                        </div>
                        <div className="border-t border-indigo-200 pt-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">Amount Applied:</span>
                            <span className="text-lg font-bold text-blue-600 whitespace-nowrap">${(Number(viewingReceipt.amount_applied) || 0).toFixed(2)} {viewingReceipt.currency_code}</span>
                          </div>
                        </div>
                        <div className="border-t border-indigo-200 pt-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">Unapplied Amount:</span>
                            <span className="text-lg font-bold text-red-600 whitespace-nowrap">${(Number(viewingReceipt.amount_unapplied) || 0).toFixed(2)} {viewingReceipt.currency_code}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {viewingReceipt.notes && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Notes</p>
                  <p className="text-sm">{viewingReceipt.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}