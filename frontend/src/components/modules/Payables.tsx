import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, AlertTriangle, Search, Filter, Download, Eye, Edit, CheckCircle, XCircle, FilePenLine } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { APPaymentForm } from "@/components/forms/APPaymentForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText } from "lucide-react";
import { APInvoiceForm } from "@/components/forms/APInvoiceForm";
import apiService from "@/services/api";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

interface APInvoiceLine {
  line_id: number;
  invoice_id: number;
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

interface APInvoice {
  invoice_id: number;
  invoice_number: string;
  supplier_id: number;
  supplier_name: string;
  bill_to_site_id: number;
  bill_to_site_name: string;
  invoice_date: string;
  due_date: string;
  payment_terms_id: number;
  currency_code: string;
  exchange_rate: number;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  status: 'DRAFT' | 'PENDING' | 'OPEN' | 'PAID' | 'CANCELLED' | 'VOID';
  notes?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  lines?: APInvoiceLine[];
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
  created_by: number;
  created_at: string;
  updated_at: string;
}

interface APSupplier {
  supplier_id: number;
  supplier_number: string;
  supplier_name: string;
  supplier_type: 'VENDOR' | 'CONTRACTOR' | 'SERVICE_PROVIDER';
  tax_id?: string;
  payment_terms_id: number;
  currency_code: string;
  credit_limit: number;
  hold_flag: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

interface PaymentApplication {
  application_id: number;
  payment_id: number;
  invoice_id: number;
  applied_amount: number;
  unapplied_amount: number;
  applied_date: string;
  application_date?: string;
  status: string;
  notes?: string;
  invoice_number?: string;
  invoice_date?: string;
  invoice_total?: number;
  amount_due?: number;
  amount_paid?: number;
}

export const Payables = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<APInvoice | null>(null);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<APInvoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<APInvoice | null>(null);
  const [invoices, setInvoices] = useState<APInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<APPayment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [suppliers, setSuppliers] = useState<APSupplier[]>([]);
  const [approvingInvoiceId, setApprovingInvoiceId] = useState<number | null>(null);
  const [editingPayment, setEditingPayment] = useState<APPayment | null>(null);
  const [viewingPayment, setViewingPayment] = useState<APPayment | null>(null);
  const [paymentApplications, setPaymentApplications] = useState<PaymentApplication[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);

  // Fetch invoices from backend
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAPInvoices();
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  // Fetch payments from backend
  const fetchPayments = async () => {
    try {
      setLoadingPayments(true);
      const data = await apiService.getAPPayments();
      console.log('Fetched payments:', data);
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to fetch payments');
      setPayments([]); // Set empty array on error
    } finally {
      setLoadingPayments(false);
    }
  };

  // Fetch suppliers from backend
  const fetchSuppliers = async () => {
    try {
      const data = await apiService.getAPSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Failed to fetch suppliers');
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchPayments();
    fetchSuppliers();
  }, []);

  const handleCreatePayment = (invoice: APInvoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentForm(true);
  };

  const closePaymentForm = () => {
    setShowPaymentForm(false);
    setSelectedInvoice(null);
  };

  const handleInvoiceCreated = () => {
    setShowInvoiceForm(false);
    setEditingInvoice(null);
    fetchInvoices(); // Refresh the list
    toast.success('Invoice created successfully');
  };

  const handleInvoiceUpdated = () => {
    setShowInvoiceForm(false);
    setEditingInvoice(null);
    fetchInvoices(); // Refresh the list
    toast.success('Invoice updated successfully');
  };

  const handleViewInvoice = async (invoice: APInvoice) => {
    try {
      // Fetch full invoice details with line items
      const fullInvoice = await apiService.getAPInvoice(invoice.invoice_id);
      setViewingInvoice(fullInvoice);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      toast.error('Failed to load invoice details');
    }
  };

  const handleEditInvoice = async (invoice: APInvoice) => {
    try {
      // Fetch full invoice details with line items
      const fullInvoice = await apiService.getAPInvoice(invoice.invoice_id);
      setEditingInvoice(fullInvoice);
      setShowInvoiceForm(true);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      toast.error('Failed to load invoice for editing');
    }
  };

  const handleApproveInvoice = async (invoice: APInvoice, action: 'APPROVED' | 'REJECTED') => {
    const actionText = action === 'APPROVED' ? 'approve' : 'reject';
    
    if (!confirm(`Are you sure you want to ${actionText} invoice ${invoice.invoice_number}?`)) {
      return;
    }

    try {
      setApprovingInvoiceId(invoice.invoice_id);
      
      // Only update approval_status, not status
      // Status is automatically determined by amount_due
      await apiService.updateAPInvoiceStatus(invoice.invoice_id, undefined, action);
      toast.success(`Invoice ${actionText}ed successfully`);
      fetchInvoices(); // Refresh the list
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

  const handlePaymentCreated = async (options?: { mode?: 'draft' | 'final' }) => {
    setShowPaymentForm(false);
    setEditingPayment(null);
    setSelectedInvoice(null);
    // Refresh the payments list and invoices
    await Promise.all([
      fetchPayments(),
      fetchInvoices()
    ]);
    if (options?.mode === 'draft') {
      toast.success('Payment saved as draft');
    } else {
      toast.success('Payment created successfully');
    }
  };

  const handlePaymentUpdated = async (options?: { mode?: 'draft' | 'final' }) => {
    setShowPaymentForm(false);
    setEditingPayment(null);
    setSelectedInvoice(null);
    // Refresh the payments list and invoices
    await Promise.all([
      fetchPayments(),
      fetchInvoices()
    ]);
    if (options?.mode === 'draft') {
      toast.success('Payment saved as draft');
    } else {
      toast.success('Payment created successfully');
    }
  };

  const handleViewPayment = async (payment: APPayment) => {
    try {
      // Fetch full payment details from actual payment table
      const fullPayment = await apiService.getAPPayment(payment.payment_id);
      setViewingPayment(fullPayment);
      
      // Fetch payment applications (invoices applied to this payment)
      setLoadingApplications(true);
      try {
        const applications = await apiService.getAPPaymentApplications(payment.payment_id);
        setPaymentApplications(applications);
      } catch (error) {
        console.error('Error fetching payment applications:', error);
        setPaymentApplications([]);
      } finally {
        setLoadingApplications(false);
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      toast.error('Failed to load payment details');
    }
  };

  const handleEditPayment = async (payment: APPayment) => {
    try {
      // Fetch full payment details from actual payment table
      const fullPayment = await apiService.getAPPayment(payment.payment_id);
      setEditingPayment(fullPayment);
      setShowPaymentForm(true);
    } catch (error) {
      console.error('Error fetching payment details:', error);
      toast.error('Failed to load payment for editing');
    }
  };

  const handleExportInvoices = () => {
    // Prepare invoice data for export
    const exportData = invoices.map(inv => ({
      'Invoice Number': inv.invoice_number,
      'Supplier Name': inv.supplier_name,
      'Invoice Date': inv.invoice_date,
      'Due Date': inv.due_date,
      'Payment Terms': inv.payment_terms_id,
      'Subtotal': inv.subtotal,
      'Tax Amount': inv.tax_amount,
      'Total Amount': inv.total_amount,
      'Amount Paid': inv.amount_paid,
      'Amount Due': inv.amount_due,
      'Currency': inv.currency_code,
      'Approval Status': inv.approval_status,
      'Status': inv.status,
      'Notes': inv.notes || '',
      'Created At': inv.created_at,
      'Updated At': inv.updated_at
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'AP Invoices');
    XLSX.writeFile(workbook, 'ap-invoices.xlsx');
    
    toast.success('Invoices exported successfully');
  };

  const handleExportPayments = () => {
    // Prepare payment data for export
    const exportData = payments.map(payment => ({
      'Payment Number': payment.payment_number,
      'Payment Date': payment.payment_date,
      'Supplier Name': payment.supplier_name,
      'Payment Amount': payment.payment_amount,
      'Amount Applied': payment.amount_applied,
      'Unapplied Amount': payment.unapplied_amount,
      'Currency': payment.currency_code,
      'Payment Method': payment.payment_method || '',
      'Bank Account': payment.bank_account || '',
      'Reference Number': payment.reference_number || '',
      'Status': payment.status,
      'Notes': payment.notes || '',
      'Created At': payment.created_at,
      'Updated At': payment.updated_at
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'AP Payments');
    XLSX.writeFile(workbook, 'ap-payments.xlsx');
    
    toast.success('Payments exported successfully');
  };

  const filteredInvoices = invoices.filter(item => {
    const matchesSearch = (item.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || item.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPayables = invoices
    .filter(p => p.status !== "PAID")
    .reduce((sum, p) => sum + (Number(p.amount_due) || 0), 0);
  const overduePayables = invoices
  .filter(p => {
    // Check if due date has passed
    const dueDate = new Date(p.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    dueDate.setHours(0, 0, 0, 0);
    const isOverdue = dueDate < today;
    
    // Check if invoice has amount due and is not fully paid
    const hasAmountDue = Number(p.amount_due || 0) > 0;
    
    // Exclude PAID, CANCELLED, and VOID invoices
    const isActive = p.status !== "PAID" && p.status !== "CANCELLED" && p.status !== "VOID";
    
    return isOverdue && hasAmountDue && isActive;
  })
  .reduce((sum, p) => sum + (Number(p.amount_due) || 0), 0);
  const pendingCount = invoices.filter(p => p.status === "OPEN").length;

  if (showPaymentForm) {
    return <APPaymentForm 
      onClose={() => {
        setShowPaymentForm(false);
        setEditingPayment(null);
        setSelectedInvoice(null);
      }} 
      selectedInvoice={selectedInvoice} 
      onSuccess={(options) => (editingPayment ? handlePaymentUpdated(options) : handlePaymentCreated(options))}
      paymentToEdit={editingPayment}
    />;
  }
  if (showInvoiceForm) {
    return (
      <APInvoiceForm 
        onClose={() => {
          setShowInvoiceForm(false);
          setEditingInvoice(null);
        }} 
        onSuccess={editingInvoice ? handleInvoiceUpdated : handleInvoiceCreated} 
        suppliers={suppliers}
        invoiceToEdit={editingInvoice}
      />
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accounts Payable</h1>
          <p className="text-gray-500 mt-1">Manage invoices and payments to suppliers</p>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold break-words overflow-hidden">${(Number(totalPayables) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-gray-500 mt-1">Across {filteredInvoices.filter(p => p.status !== "PAID").length} invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
            <AlertTriangle className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 break-words overflow-hidden">${(Number(overduePayables) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-red-500 mt-1">Requires immediate attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Invoices</CardTitle>
            <DollarSign className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <DollarSign className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{payments.length}</div>
            <p className="text-xs text-green-500 mt-1">Processed this period</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoice" className="space-y-6">
        <TabsList>
          <TabsTrigger value="invoice" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Payments
          </TabsTrigger>
        </TabsList>
        <TabsContent value="invoice">
          <div className="flex justify-end mb-4 gap-2">
            <Button 
              variant="outline" 
              onClick={handleExportInvoices}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button onClick={() => setShowInvoiceForm(true)} className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Create Invoice
            </Button>
          </div>
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search invoices or suppliers..."
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
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="void">Void</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">AP Invoices</h3>
                <p className="text-sm text-gray-500">
                  Showing {filteredInvoices.length} of {invoices.length} invoices
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
              ) : filteredInvoices.length === 0 ? (
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
                        <th className="text-left py-3 px-4 font-semibold">Supplier</th>
                        <th className="text-left py-3 px-4 font-semibold">Invoice Date</th>
                        <th className="text-left py-3 px-4 font-semibold">Due Date</th>
                        <th className="text-left py-3 px-4 font-semibold">Total Amount</th>
                        <th className="text-left py-3 px-4 font-semibold">Amount Due</th>
                        <th className="text-left py-3 px-4 font-semibold">Status</th>
                        <th className="text-left py-3 px-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.map((invoice) => (
                        <tr key={invoice.invoice_id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{invoice.invoice_number}</td>
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium">{invoice.supplier_name}</div>
                              {invoice.notes && (
                                <div className="text-sm text-gray-500">{invoice.notes}</div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                          <td className="py-3 px-4">
                            {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}
                          </td>
                          <td className="py-3 px-4 font-semibold">
                            ${invoice.total_amount.toLocaleString()} {invoice.currency_code}
                          </td>
                          <td className="py-3 px-4 font-semibold">
                            ${invoice.amount_due.toLocaleString()} {invoice.currency_code}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={
                              invoice.status === "PAID" ? "default" :
                              invoice.status === "OPEN" && new Date(invoice.due_date) < new Date() ? "destructive" :
                              invoice.status === "OPEN" ? "secondary" :
                              invoice.status === "DRAFT" ? "outline" : "secondary"
                            }>
                              {invoice.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewInvoice(invoice)}
                                className="h-8 w-8 p-0"
                                title="View Invoice"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {(invoice.status === "DRAFT" || invoice.status === "PENDING") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditInvoice(invoice)}
                                  className="h-8 w-8 p-0"
                                  title="Edit Invoice"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {invoice.approval_status === "PENDING" && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                      title="Approve/Reject Invoice"
                                      disabled={approvingInvoiceId === invoice.invoice_id}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => handleApproveInvoice(invoice, 'APPROVED')}
                                      className={invoice.status === 'OPEN' ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 focus:text-green-700'}
                                      disabled={invoice.status === 'OPEN'}
                                      title={invoice.status === 'OPEN' ? 'Invoice must be PAID before approval' : 'Approve Invoice'}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleApproveInvoice(invoice, 'REJECTED')}
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
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="payment">
          <div className="flex justify-end mb-4 gap-2">
            <Button 
              variant="outline" 
              onClick={handleExportPayments}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button 
              onClick={() => setShowPaymentForm(true)}
              className="flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              Create Payment
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>AP Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPayments ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Loading payments...</div>
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">No payments found</div>
                  <Button 
                    onClick={() => setShowPaymentForm(true)} 
                    className="mt-4"
                    variant="outline"
                  >
                    Create your first payment
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Payment #</th>
                        <th className="text-left py-3 px-4 font-semibold">Date</th>
                        <th className="text-left py-3 px-4 font-semibold">Supplier</th>
                        <th className="text-right py-3 px-4 font-semibold">Payment Amount</th>
                        <th className="text-right py-3 px-4 font-semibold">Applied</th>
                        <th className="text-right py-3 px-4 font-semibold">Unapplied</th>
                        <th className="text-left py-3 px-4 font-semibold">Currency</th>
                        <th className="text-left py-3 px-4 font-semibold">Payment Method</th>
                        <th className="text-left py-3 px-4 font-semibold">Status</th>
                        <th className="text-left py-3 px-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.payment_id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{payment.payment_number}</td>
                          <td className="py-3 px-4">{new Date(payment.payment_date).toLocaleDateString()}</td>
                          <td className="py-3 px-4">{payment.supplier_name}</td>
                          <td className="py-3 px-4 text-right font-semibold">
                            ${payment.payment_amount.toLocaleString()} {payment.currency_code}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold">
                            ${payment.amount_applied.toLocaleString()} {payment.currency_code}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold">
                            ${payment.unapplied_amount.toLocaleString()} {payment.currency_code}
                          </td>
                          <td className="py-3 px-4">{payment.currency_code}</td>
                          <td className="py-3 px-4">{payment.payment_method || '-'}</td>
                          <td className="py-3 px-4">
                            <Badge variant={
                              payment.status === "PAID" ? "default" :
                              payment.status === "DRAFT" ? "outline" : "secondary"
                            }>
                              {payment.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewPayment(payment)}
                                className="h-8 w-8 p-0"
                                title="View Payment"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {payment.status === "DRAFT" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditPayment(payment)}
                                  className="h-8 w-8 p-0"
                                  title="Edit Draft Payment"
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
                  <p className="text-sm text-gray-500">Supplier</p>
                  <p className="font-medium">{viewingInvoice.supplier_name}</p>
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
                    {viewingInvoice.approval_status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Currency</p>
                  <p className="font-medium">{viewingInvoice.currency_code}</p>
                </div>
              </div>

              {/* Line Items */}
              {viewingInvoice.lines && viewingInvoice.lines.length > 0 && (
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
                        {viewingInvoice.lines.map((line) => (
                          <tr key={line.line_id} className="border-b">
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
                      <span className="font-medium">${(Number(viewingInvoice.subtotal) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax Amount:</span>
                      <span className="font-medium">${(Number(viewingInvoice.tax_amount) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Total Amount:</span>
                      <span className="font-bold text-lg">${(Number(viewingInvoice.total_amount) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount Paid:</span>
                      <span className="font-medium">${(Number(viewingInvoice.amount_paid) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Amount Due:</span>
                      <span className="font-bold text-lg text-red-600">${(Number(viewingInvoice.amount_due) || 0).toFixed(2)}</span>
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

      {/* View Payment Dialog */}
      <Dialog open={!!viewingPayment} onOpenChange={(open) => {
        if (!open) {
          setViewingPayment(null);
          setPaymentApplications([]);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Details - {viewingPayment?.payment_number}</DialogTitle>
          </DialogHeader>
          {viewingPayment && (
            <div className="space-y-6">
              {/* Payment Header */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Payment Number</p>
                  <p className="font-medium">{viewingPayment.payment_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Date</p>
                  <p className="font-medium">{new Date(viewingPayment.payment_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Supplier</p>
                  <p className="font-medium">{viewingPayment.supplier_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge variant={
                    viewingPayment.status === "PAID" ? "default" :
                    viewingPayment.status === "DRAFT" ? "outline" : "secondary"
                  }>
                    {viewingPayment.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Currency</p>
                  <p className="font-medium">{viewingPayment.currency_code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Exchange Rate</p>
                  <p className="font-medium">{viewingPayment.exchange_rate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium">{viewingPayment.payment_method || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bank Account</p>
                  <p className="font-medium">{viewingPayment.bank_account || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reference Number</p>
                  <p className="font-medium">{viewingPayment.reference_number || '-'}</p>
                </div>
              </div>

              {/* Payment Applications (Invoices) */}
              {loadingApplications ? (
                <div className="text-center py-4">
                  <div className="text-gray-500">Loading invoice applications...</div>
                </div>
              ) : paymentApplications.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Applied Invoices</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4">Invoice Number</th>
                          <th className="text-right py-2 px-4">Amount Due</th>
                          <th className="text-right py-2 px-4">Applied Amount</th>
                          <th className="text-left py-2 px-4">Application Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentApplications.map((app, index) => {
                          const appliedAmount = Number(app.applied_amount) || 0;
                          const unappliedAmount = Number(app.unapplied_amount) || 0;
                          
                          return (
                            <tr key={app.application_id || index} className="border-b hover:bg-gray-50">
                              <td className="py-2 px-4 font-medium">{app.invoice_number || app.invoice_id}</td>
                              <td className="py-2 px-4 text-right font-medium">${unappliedAmount.toFixed(2)}</td>
                              <td className="py-2 px-4 text-right font-semibold">${appliedAmount.toFixed(2)}</td>
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
                  No invoices applied to this payment
                </div>
              )}

              {/* Payment Amounts */}
              <div className="border-t pt-4">
                <div className="flex justify-end">
                  <div className="w-80">
                    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-lg p-5 border border-indigo-200 shadow-sm">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-gray-700">Payment Amount:</span>
                          <span className="text-lg font-bold text-gray-900 whitespace-nowrap">${(Number(viewingPayment.payment_amount) || 0).toFixed(2)} {viewingPayment.currency_code}</span>
                        </div>
                        <div className="border-t border-indigo-200 pt-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">Amount Applied:</span>
                            <span className="text-lg font-bold text-blue-600 whitespace-nowrap">${(Number(viewingPayment.amount_applied) || 0).toFixed(2)} {viewingPayment.currency_code}</span>
                          </div>
                        </div>
                        <div className="border-t border-indigo-200 pt-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">Unapplied Amount:</span>
                            <span className="text-lg font-bold text-red-600 whitespace-nowrap">${(Number(viewingPayment.unapplied_amount) || 0).toFixed(2)} {viewingPayment.currency_code}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {viewingPayment.notes && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Notes</p>
                  <p className="text-sm">{viewingPayment.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
