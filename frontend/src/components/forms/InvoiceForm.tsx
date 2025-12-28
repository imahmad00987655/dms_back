import { useState, useEffect, useRef } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Save, Send, FileText, Eye, X, ChevronsUpDown, Check, ArrowLeft } from "lucide-react";
import apiService from '@/services/api';
import { generateNextARInvoiceNumber } from "@/utils/numberGenerator";
import { toast } from "sonner";

interface InventoryItem {
  id: number;
  item_code: string;
  item_name: string;
  description?: string;
  item_purchase_rate?: number;
  item_sell_price?: number;
  category?: string;
  tax_status?: string;
}

interface TaxRate {
  id: number;
  rate_code: string;
  tax_percentage: number;
  status: string;
}

interface InvoiceLineItem {
  id: string;
  item_code?: string;
  item_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_line_amount: number;
}

interface Customer {
  customer_id?: number;
  profile_id?: number; // API returns profile_id in list endpoint
  customer_number: string;
  customer_name: string;
  customer_type: string;
  status?: string;
  party_name?: string; // May come from joined party table
}

interface CustomerSite {
  site_id: number;
  customer_id: number;
  site_name: string;
  site_type: 'SHIP_TO' | 'BILL_TO' | 'BOTH';
  address_line1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  is_primary: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

interface Invoice {
  invoice_id: number;
  invoice_number: string;
  customer_id?: number;
  customer_name: string;
  customer_number: string;
  bill_to_site_id?: number;
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

interface InvoiceFormProps {
  onClose: () => void;
  invoiceToView?: Invoice | null;
  mode?: 'create' | 'view' | 'edit';
  onSuccess?: () => void;
}

export const InvoiceForm = ({ onClose, invoiceToView, mode = 'create', onSuccess }: InvoiceFormProps) => {
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: "",
    customerName: "",
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: "",
    paymentTerms: "30",
    currency_code: "USD",
    exchange_rate: 1.0,
    notes: "",
    status: "DRAFT"
  });

  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { 
      id: "1", 
      item_code: undefined,
      item_name: "", 
      description: "", 
      quantity: 1, 
      unit_price: 0, 
      line_amount: 0,
      tax_rate: 0,
      tax_amount: 0,
      total_line_amount: 0
    }
  ]);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const invoiceNumberGenerated = useRef(false);
  const lastChangedField = useRef<'payment_terms' | 'due_date' | 'invoice_date' | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [itemSearchOpen, setItemSearchOpen] = useState<{ [key: number]: boolean }>({});
  const [itemSearchValue, setItemSearchValue] = useState<{ [key: number]: string }>({});
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [customerSites, setCustomerSites] = useState<CustomerSite[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [customerSearchValue, setCustomerSearchValue] = useState("");
  const [customerId, setCustomerId] = useState<string>("");
  const [customerSiteId, setCustomerSiteId] = useState<string>("");

  // Load invoice data if in view or edit mode
  useEffect(() => {
    if ((mode === 'view' || mode === 'edit') && invoiceToView) {
      try {
        console.log('Invoice data for view:', invoiceToView);
        console.log('Invoice date:', invoiceToView.invoice_date);
        console.log('Due date:', invoiceToView.due_date);
        
        // Format dates properly for display
        const formatDateForDisplay = (dateString: string) => {
          if (!dateString) return '';
          try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString; // Return original if invalid
            return date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD for input
          } catch (error) {
            console.error('Error formatting date:', dateString, error);
            return dateString;
          }
        };

        setInvoiceData({
          invoiceNumber: invoiceToView.invoice_number || '',
          customerName: invoiceToView.customer_name || '',
          invoiceDate: formatDateForDisplay(invoiceToView.invoice_date),
          dueDate: formatDateForDisplay(invoiceToView.due_date),
          paymentTerms: String(invoiceToView.payment_terms_id || 30),
          currency_code: invoiceToView.currency_code || 'USD',
          exchange_rate: invoiceToView.exchange_rate || 1.0,
          notes: invoiceToView.notes || "",
          status: invoiceToView.status || 'DRAFT'
        });

        // Set customer and site IDs for view mode
        if (invoiceToView.customer_id) {
          setCustomerId(String(invoiceToView.customer_id));
          // Fetch customer sites to populate the dropdown
          fetchCustomerSites(invoiceToView.customer_id).then(() => {
            // Set the site ID after sites are loaded
            if (invoiceToView.bill_to_site_id) {
              setCustomerSiteId(String(invoiceToView.bill_to_site_id));
            }
          });
        }

        if (invoiceToView.line_items && invoiceToView.line_items.length > 0) {
          const transformedLineItems = invoiceToView.line_items.map((item, index) => ({
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
          }));
          setLineItems(transformedLineItems);
        } else {
          // Set default line item if none exist
          setLineItems([{
            id: "1",
            item_code: undefined,
            item_name: '',
            description: '',
            quantity: 0,
            unit_price: 0,
            line_amount: 0,
            tax_rate: 0,
            tax_amount: 0,
            total_line_amount: 0
          }]);
        }
      } catch (error) {
        console.error('Error loading invoice data:', error);
        // Set default data if there's an error
        setInvoiceData({
          invoiceNumber: 'Error loading invoice',
          customerName: '',
          invoiceDate: new Date().toISOString().split('T')[0],
          dueDate: '',
          paymentTerms: "30",
          currency_code: "USD",
          exchange_rate: 1.0,
          notes: "Error loading invoice data",
          status: "DRAFT"
        });
        setLineItems([{
          id: "1",
          item_code: undefined,
          item_name: 'Error loading line items',
          description: '',
          quantity: 0,
          unit_price: 0,
          line_amount: 0,
          tax_rate: 0,
          tax_amount: 0,
          total_line_amount: 0
        }]);
      }
    }
  }, [mode, invoiceToView]);

  // Fetch customers for dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await apiService.getCustomers();
        console.log('Fetched customers:', data);
        // Ensure we have an array and normalize the data structure
        const validCustomers = Array.isArray(data) 
          ? data
              .filter(c => {
                // Check for customer_id (could be customer_id or profile_id from API)
                const hasId = c && (c.customer_id || c.profile_id);
                // Check for customer_name (could be customer_name or party_name from API)
                const hasName = c && (c.customer_name || c.party_name);
                return hasId && hasName;
              })
              .map(c => ({
                // Normalize: use profile_id as customer_id if customer_id is missing
                customer_id: c.customer_id || c.profile_id,
                customer_number: c.customer_number || '',
                customer_name: c.customer_name || c.party_name || '',
                customer_type: c.customer_type || '',
                status: c.status
              }))
          : [];
        console.log('Valid customers after filtering:', validCustomers.length, validCustomers);
        setCustomers(validCustomers);
      } catch (error) {
        console.error('Error fetching customers:', error);
        toast.error('Failed to load customers');
        setCustomers([]);
      }
    };
    fetchCustomers();
  }, []);

  // Fetch customer sites when customer is selected
  const fetchCustomerSites = async (customerId: number) => {
    try {
      console.log('Fetching customer sites for customer ID:', customerId);
      const response = await apiService.getCustomerSites(customerId);
      console.log('Customer sites API response:', response);
      const sites = response?.data || response || [];
      console.log('Parsed sites:', sites);
      
      // Filter to only show ACTIVE sites
      const activeSites = sites.filter((site: CustomerSite) => 
        site.status === 'ACTIVE'
      );
      console.log('Active sites:', activeSites.length);
      
      // For AR Invoices, prefer BILL_TO or BOTH type sites (matching database enum)
      let billingSites = activeSites.filter((site: CustomerSite) => 
        site.site_type === 'BILL_TO' || site.site_type === 'BOTH'
      );
      
      // If no BILL_TO/BOTH sites, show all active sites
      if (billingSites.length === 0 && activeSites.length > 0) {
        console.log('No BILL_TO/BOTH sites found, showing all active sites');
        billingSites = activeSites;
      }
      
      console.log('Final billing sites to display:', billingSites.length, billingSites);
      setCustomerSites(billingSites);
    } catch (error) {
      console.error('Error fetching customer sites:', error);
      toast.error('Failed to fetch customer sites');
      setCustomerSites([]);
    }
  };

  const handleCustomerChange = async (customerIdValue: string) => {
    const customer = customers.find(c => c.customer_id.toString() === customerIdValue);
    
    if (!customer || !customerIdValue) {
      // Clear everything if no customer selected
      setSelectedCustomer(null);
      setCustomerId("");
      setCustomerSites([]);
      setCustomerSiteId("");
      setInvoiceData(prev => ({ ...prev, customerName: "" }));
      return;
    }
    
    setSelectedCustomer(customer);
    setCustomerId(customerIdValue);
    
    // Clear site selection when customer changes
    setCustomerSites([]);
    setCustomerSiteId("");
    
    // Update customer name in form data
    setInvoiceData(prev => ({ ...prev, customerName: customer.customer_name }));
    
    // Fetch customer sites
    await fetchCustomerSites(parseInt(customerIdValue));
  };

  // Set selectedCustomer when customerId changes
  useEffect(() => {
    if (customerId && customers.length > 0) {
      const customer = customers.find(c => c.customer_id.toString() === customerId);
      if (customer) {
        setSelectedCustomer(customer);
      }
    }
  }, [customerId, customers]);

  // Auto-select primary site when customerSites are loaded (same logic as AP Invoice)
  useEffect(() => {
    if (customerSites.length > 0 && customerId) {
      // Check if the currently selected site belongs to the current customer
      const currentSiteBelongsToCustomer = customerSiteId && customerSites.some(
        site => site.site_id.toString() === customerSiteId
      );
      
      // Auto-select if:
      // 1. No site is currently selected, OR
      // 2. The currently selected site doesn't belong to the current customer (customer was changed)
      if (!customerSiteId || !currentSiteBelongsToCustomer) {
        // Find primary site (handle boolean, number, string, or Buffer from MySQL)
        const primarySite = customerSites.find(site => {
          const isPrimary: unknown = site.is_primary;
          // Handle different types: boolean true, number 1, string '1'/'true', or Buffer
          if (isPrimary === null || isPrimary === undefined) return false;
          if (typeof isPrimary === 'boolean') return isPrimary === true;
          if (typeof isPrimary === 'number') return isPrimary === 1 || isPrimary === 1.0;
          if (typeof isPrimary === 'string') {
            const normalized = isPrimary.trim().toLowerCase();
            return normalized === '1' || normalized === 'true' || normalized === 'yes';
          }
          // Handle Buffer (MySQL sometimes returns BOOLEAN as Buffer) - only in Node.js environment
          if (typeof Buffer !== 'undefined' && Buffer.isBuffer && Buffer.isBuffer(isPrimary)) {
            return isPrimary[0] === 1;
          }
          return false;
        });
        
        if (primarySite) {
          // Primary site found - auto-select it
          setCustomerSiteId(primarySite.site_id.toString());
          console.log('✅ Auto-selected primary site:', primarySite.site_id, primarySite.site_name, 'is_primary:', primarySite.is_primary);
        } else {
          // No primary site - DO NOT auto-select, show all sites for manual selection
          setCustomerSiteId("");
          console.log('ℹ️ No primary site found, showing all', customerSites.length, 'sites for manual selection');
        }
      }
    } else if (customerSites.length === 0 && customerId) {
      // If customer has no sites, clear the selection
      setCustomerSiteId("");
    }
  }, [customerSites, customerId, customerSiteId]);

  // Fetch inventory items and tax rates on mount
  useEffect(() => {
    loadInventoryItems();
    loadTaxRates();
  }, []);

  const loadInventoryItems = async () => {
    setInventoryLoading(true);
    try {
      const response = await apiService.getInventoryItems();
      let items: InventoryItem[] = [];
      
      if (response.success && response.data) {
        items = response.data;
      } else if (Array.isArray(response)) {
        items = response;
      } else if (response.data) {
        items = Array.isArray(response.data) ? response.data : [];
      }
      
      setInventoryItems(items);
    } catch (error) {
      console.error('Error loading inventory items:', error);
      toast.error('Failed to load inventory items');
    } finally {
      setInventoryLoading(false);
    }
  };

  const loadTaxRates = async () => {
    try {
      const response = await apiService.getTaxRates();
      let rates: TaxRate[] = [];
      
      if (response.success && response.data) {
        rates = response.data;
      } else if (Array.isArray(response)) {
        rates = response;
      } else if (response.data) {
        rates = Array.isArray(response.data) ? response.data : [];
      }
      
      // Filter only active tax rates
      const activeRates = rates.filter((rate: TaxRate) => 
        rate.status === 'ACTIVE'
      );
      
      setTaxRates(activeRates);
    } catch (error) {
      console.error('Error loading tax rates:', error);
    }
  };

  // Auto-generate invoice number when creating a new invoice
  useEffect(() => {
    if (mode === 'create' && !invoiceToView && !invoiceNumberGenerated.current) {
      invoiceNumberGenerated.current = true;
      generateNextARInvoiceNumber().then((nextNumber) => {
        setInvoiceData(prev => {
          // Only update if still empty (user hasn't manually entered one)
          if (!prev.invoiceNumber) {
            return { ...prev, invoiceNumber: nextNumber };
          }
          return prev;
        });
      }).catch((error) => {
        console.error('Failed to generate invoice number:', error);
        invoiceNumberGenerated.current = false; // Reset on error so it can retry
      });
    }
  }, [mode, invoiceToView]);

  // Sync Due Date when Payment Terms or Invoice Date changes
  useEffect(() => {
    // Skip if due_date was just manually changed by user (let the second useEffect handle it)
    if (lastChangedField.current === 'due_date') {
      return;
    }
    
    // Only auto-calculate due_date if invoice_date and payment_terms are valid
    // and either payment_terms or invoice_date was just changed
    if ((lastChangedField.current === 'payment_terms' || lastChangedField.current === 'invoice_date') &&
        invoiceData.invoiceDate && Number(invoiceData.paymentTerms) > 0) {
      const invoiceDate = new Date(invoiceData.invoiceDate);
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + Number(invoiceData.paymentTerms));
      
      const calculatedDueDate = dueDate.toISOString().split('T')[0];
      
      // Only update if the calculated due date is different from current
      if (calculatedDueDate !== invoiceData.dueDate) {
        setInvoiceData(prev => ({ ...prev, dueDate: calculatedDueDate }));
      }
    }
    
    // Reset flag after processing (for payment_terms or invoice_date changes)
    if (lastChangedField.current === 'payment_terms' || lastChangedField.current === 'invoice_date') {
      setTimeout(() => {
        lastChangedField.current = null;
      }, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceData.invoiceDate, invoiceData.paymentTerms]);

  // Sync Payment Terms when Due Date changes
  useEffect(() => {
    // Only auto-calculate payment_terms if due_date was manually changed by user
    if (lastChangedField.current !== 'due_date') {
      return;
    }
    
    if (invoiceData.invoiceDate && invoiceData.dueDate) {
      const invoiceDate = new Date(invoiceData.invoiceDate);
      const dueDate = new Date(invoiceData.dueDate);
      
      // Calculate difference in days
      const diffTime = dueDate.getTime() - invoiceDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      // Only update if the calculated payment terms is different and positive
      if (diffDays > 0 && diffDays !== Number(invoiceData.paymentTerms)) {
        setInvoiceData(prev => ({ ...prev, paymentTerms: String(diffDays) }));
      }
    }
    
    // Reset flag after processing
    setTimeout(() => {
      lastChangedField.current = null;
    }, 200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceData.dueDate]);

  const addLineItem = () => {
    const newItem: InvoiceLineItem = {
      id: Date.now().toString(),
      item_code: undefined,
      item_name: "",
      description: "",
      quantity: 1,
      unit_price: 0,
      line_amount: 0,
      tax_rate: 0,
      tax_amount: 0,
      total_line_amount: 0
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
    setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof InvoiceLineItem, value: string | number) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === "quantity" || field === "unit_price") {
          updatedItem.line_amount = Number(updatedItem.quantity) * Number(updatedItem.unit_price);
          updatedItem.tax_amount = updatedItem.line_amount * (updatedItem.tax_rate / 100);
          updatedItem.total_line_amount = updatedItem.line_amount + updatedItem.tax_amount;
        }
        if (field === "tax_rate") {
          updatedItem.tax_amount = updatedItem.line_amount * (Number(value) / 100);
          updatedItem.total_line_amount = updatedItem.line_amount + updatedItem.tax_amount;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const getLineItemIndex = (id: string): number => {
    return lineItems.findIndex(item => item.id === id);
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.line_amount, 0);
  const taxAmount = lineItems.reduce((sum, item) => sum + item.tax_amount, 0);
  const total = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent, status: string) => {
    e.preventDefault();
    
    if (!customerId) {
      toast.error('Please select a customer');
      return;
    }

    if (customerSites.length > 0 && !customerSiteId) {
      toast.error('Please select a customer site');
      return;
    }

    if (lineItems.some(item => !item.item_name || item.quantity <= 0 || item.unit_price <= 0)) {
      toast.error('Please fill in all required line item fields');
      return;
    }

    setLoading(true);
    try {
      // Transform line items to match backend expectations
      const transformedLineItems = lineItems.map((item, index) => ({
        line_number: index + 1,
        item_code: item.item_code !== undefined && item.item_code !== null && item.item_code !== '' ? item.item_code : null,
        item_name: item.item_name || 'Item',
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_amount: item.line_amount,
        tax_rate: item.tax_rate,
        tax_amount: item.tax_amount
      }));

      const invoice = {
        invoice_number: invoiceData.invoiceNumber,
        customer_id: parseInt(customerId),
        customer_name: invoiceData.customerName,
        customer_site_id: customerSiteId ? parseInt(customerSiteId) : null,
        invoice_date: invoiceData.invoiceDate,
        due_date: invoiceData.dueDate,
        payment_terms: Number(invoiceData.paymentTerms),
        currency_code: invoiceData.currency_code,
        exchange_rate: invoiceData.exchange_rate,
        notes: invoiceData.notes,
        status: status.toUpperCase(),
        subtotal,
        tax_amount: taxAmount,
        total,
        line_items: transformedLineItems
      };

      if (mode === 'edit' && invoiceToView?.invoice_id) {
        // Update existing invoice
        await apiService.updateInvoice(invoiceToView.invoice_id, invoice);
        toast.success('Invoice updated successfully');
      } else {
        // Create new invoice
        await apiService.createInvoice(invoice);
        toast.success('Invoice created successfully');
      }
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Failed to save invoice:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create invoice';
      toast.error(`Failed to create invoice: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-xl font-semibold">
                {mode === 'view' ? 'View AR Invoice' : mode === 'edit' ? 'Edit AR Invoice' : 'Create AR Invoice'}
              </h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <form onSubmit={(e) => handleSubmit(e, invoiceData.status || 'DRAFT')} className="p-6 space-y-6">
          {/* Header Information */}
          <Card>
      <CardHeader>
              <CardTitle>Invoice Header</CardTitle>
      </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number *</Label>
            <Input
              id="invoiceNumber"
              value={invoiceData.invoiceNumber}
              onChange={(e) => setInvoiceData({...invoiceData, invoiceNumber: e.target.value})}
                  placeholder="Enter invoice number"
              readOnly={mode === 'view'}
              className={mode === 'view' ? 'bg-gray-50' : ''}
              disabled={mode === 'view'}
                  required
            />
          </div>
              <div className="space-y-2">
                <Label htmlFor="customer">Customer *</Label>
                {mode === 'view' ? (
            <Input
              id="customerName"
              value={invoiceData.customerName}
                    readOnly
                    className="bg-gray-50"
                  />
                ) : (
                  <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={customerSearchOpen}
                        className="w-full justify-between"
                      >
                        {selectedCustomer
                          ? `${selectedCustomer.customer_name} (${selectedCustomer.customer_number})`
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
                          {customers.length === 0 ? (
                            <div className="px-2 py-1.5 text-sm text-gray-500">No customers available</div>
                          ) : (
                            customers
                              .filter(c => c && c.customer_id && (c.status === 'ACTIVE' || !c.status || c.status === undefined))
                              .filter(customer =>
                                customer &&
                                (!customerSearchValue ||
                                (customer.customer_name && customer.customer_name.toLowerCase().includes(customerSearchValue.toLowerCase())) ||
                                (customer.customer_number && customer.customer_number.toLowerCase().includes(customerSearchValue.toLowerCase())))
                              )
                              .map((customer) => {
                                if (!customer || !customer.customer_id) return null;
                                const customerIdStr = String(customer.customer_id);
                                return (
                                  <CommandItem
                                    key={customer.customer_id}
                                    value={`${customer.customer_name || ''} ${customer.customer_number || ''}`}
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
                                      <span className="font-medium">{customer.customer_name || 'Unknown'}</span>
                                      <span className="text-sm text-gray-500">Customer #: {customer.customer_number || 'N/A'}</span>
          </div>
                                  </CommandItem>
                                );
                              })
                              .filter(item => item !== null)
                          )}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerSite">Billing Site *</Label>
                {mode === 'view' ? (
                  <Input
                    id="customerSite"
                    value={customerSites.find(s => s.site_id.toString() === customerSiteId)?.site_name || ''}
                    readOnly
                    className="bg-gray-50"
                  />
                ) : (
            <Select
                    value={customerSiteId} 
                    onValueChange={(value) => setCustomerSiteId(value)}
                    disabled={!selectedCustomer || !customerId || customerSites.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer site" />
              </SelectTrigger>
              <SelectContent>
                      {customerSites.map(site => {
                        // Check if site is primary (handle boolean, number, or string)
                        const isPrimary: unknown = site.is_primary;
                        let isPrimarySite = false;
                        if (isPrimary !== null && isPrimary !== undefined) {
                          if (typeof isPrimary === 'boolean') isPrimarySite = isPrimary === true;
                          else if (typeof isPrimary === 'number') isPrimarySite = isPrimary === 1;
                          else if (typeof isPrimary === 'string') {
                            const normalized = String(isPrimary).trim().toLowerCase();
                            isPrimarySite = normalized === '1' || normalized === 'true' || normalized === 'yes';
                          }
                        }
                        return (
                          <SelectItem key={site.site_id} value={site.site_id.toString()}>
                            {site.site_name} {isPrimarySite ? '(Primary)' : ''}
                          </SelectItem>
                        );
                      })}
              </SelectContent>
            </Select>
                )}
          </div>
              <div className="space-y-2">
            <Label htmlFor="paymentTerms">Payment Terms (Days)</Label>
            <Input
              id="paymentTerms"
              type="number"
              min="0"
              value={invoiceData.paymentTerms}
              onChange={(e) => {
                lastChangedField.current = 'payment_terms';
                setInvoiceData({...invoiceData, paymentTerms: e.target.value});
              }}
              disabled={mode === 'view'}
              className={mode === 'view' ? 'bg-gray-50' : ''}
              placeholder="30"
              readOnly={mode === 'view'}
            />
        </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select 
                  value={invoiceData.currency_code} 
                  onValueChange={(value) => setInvoiceData({...invoiceData, currency_code: value})}
                  disabled={mode === 'view'}
                >
                  <SelectTrigger className={mode === 'view' ? 'bg-gray-50' : ''}>
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
                <Label htmlFor="exchange_rate">Exchange Rate</Label>
                <Input
                  id="exchange_rate"
                  type="number"
                  step="0.000001"
                  value={invoiceData.exchange_rate}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setInvoiceData({...invoiceData, exchange_rate: isNaN(value) ? 1.0 : value});
                  }}
                  placeholder="1.000000"
                  disabled={mode === 'view'}
                  className={mode === 'view' ? 'bg-gray-50' : ''}
                  readOnly={mode === 'view'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoiceDate">Invoice Date *</Label>
            {mode === 'view' ? (
              <div className="py-2 px-3 bg-gray-50 rounded border">
                {invoiceData.invoiceDate ? (() => {
                  try {
                    const date = new Date(invoiceData.invoiceDate);
                    return isNaN(date.getTime()) ? invoiceData.invoiceDate : date.toLocaleDateString();
                  } catch (error) {
                    return invoiceData.invoiceDate || 'N/A';
                  }
                })() : 'N/A'}
              </div>
            ) : (
            <Input
              id="invoiceDate"
              type="date"
              value={invoiceData.invoiceDate}
              onChange={(e) => {
                lastChangedField.current = 'invoice_date';
                setInvoiceData({...invoiceData, invoiceDate: e.target.value});
              }}
              required
            />
            )}
          </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
            {mode === 'view' ? (
              <div className="py-2 px-3 bg-gray-50 rounded border">
                {invoiceData.dueDate ? (() => {
                  try {
                    const date = new Date(invoiceData.dueDate);
                    return isNaN(date.getTime()) ? invoiceData.dueDate : date.toLocaleDateString();
                  } catch (error) {
                    return invoiceData.dueDate || 'N/A';
                  }
                })() : 'N/A'}
              </div>
            ) : (
            <Input
              id="dueDate"
              type="date"
              value={invoiceData.dueDate}
              onChange={(e) => {
                lastChangedField.current = 'due_date';
                setInvoiceData({...invoiceData, dueDate: e.target.value});
              }}
              required
            />
            )}
          </div>
            </CardContent>
          </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Line Items</CardTitle>
            {(mode === 'create' || mode === 'edit') && (
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Line
            </Button>
            )}
          </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lineItems.map((item, index) => {
                const lineIndex = getLineItemIndex(item.id);
                return (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-start border p-4 rounded-lg">
                    <div className="col-span-1">
                      <Label className="text-xs">Line</Label>
                      <Input
                        value={index + 1}
                        disabled
                        className="text-xs"
                      />
                        </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Item Code</Label>
                      {mode === 'view' ? (
                      <Input
                          value={item.item_code || ''}
                          disabled
                          className="text-xs bg-gray-50"
                        />
                      ) : (
                        <Popover 
                          open={itemSearchOpen[lineIndex] || false} 
                          onOpenChange={(open) => setItemSearchOpen(prev => ({ ...prev, [lineIndex]: open }))}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between text-xs h-9 overflow-hidden",
                                !item.item_code && "text-muted-foreground"
                              )}
                            >
                              <span className="truncate flex-1 text-left">{item.item_code || "Search item..."}</span>
                              <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50 flex-shrink-0" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0">
                            <Command>
                              <CommandInput 
                                placeholder="Search by item code or name..." 
                                value={itemSearchValue[lineIndex] || ""}
                                onValueChange={(value) => setItemSearchValue(prev => ({ ...prev, [lineIndex]: value }))}
                              />
                              <CommandEmpty>No item found.</CommandEmpty>
                              <CommandGroup>
                                {inventoryItems
                                  .filter(invItem => 
                                    !itemSearchValue[lineIndex] || 
                                    invItem.item_code?.toLowerCase().includes(itemSearchValue[lineIndex].toLowerCase()) ||
                                    invItem.item_name?.toLowerCase().includes(itemSearchValue[lineIndex].toLowerCase())
                                  )
                                  .map((invItem) => (
                                    <CommandItem
                                      key={invItem.id}
                                      value={`${invItem.item_code} ${invItem.item_name}`}
                                      onSelect={() => {
                                        const newItems = [...lineItems];
                                        const lineItem = { ...newItems[lineIndex] };
                                        
                                        lineItem.item_code = invItem.item_code;
                                        lineItem.item_name = invItem.item_name;
                                        if (invItem.description) {
                                          lineItem.description = invItem.description;
                                        }
                                        if (invItem.item_sell_price) {
                                          lineItem.unit_price = invItem.item_sell_price;
                                        }
                                        
                                        // Auto-populate tax rate from item's tax_status
                                        if (invItem.tax_status && taxRates.length > 0) {
                                          let taxRate = taxRates.find(rate => 
                                            rate.rate_code === invItem.tax_status || 
                                            rate.rate_code === invItem.tax_status.trim()
                                          );
                                          
                                          if (!taxRate) {
                                            taxRate = taxRates.find(rate => 
                                              rate.rate_code.toLowerCase() === invItem.tax_status.toLowerCase()
                                            );
                                          }
                                          
                                          if (taxRate) {
                                            lineItem.tax_rate = taxRate.tax_percentage;
                                          }
                                        }
                                        
                                        // Recalculate line amount and tax
                                        lineItem.line_amount = lineItem.quantity * lineItem.unit_price;
                                        lineItem.tax_amount = lineItem.line_amount * (lineItem.tax_rate / 100);
                                        lineItem.total_line_amount = lineItem.line_amount + lineItem.tax_amount;
                                        
                                        newItems[lineIndex] = lineItem;
                                        setLineItems(newItems);
                                        
                                        setItemSearchOpen(prev => ({ ...prev, [lineIndex]: false }));
                                        setItemSearchValue(prev => ({ ...prev, [lineIndex]: '' }));
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          item.item_code === invItem.item_code ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <div className="flex flex-col">
                                        <span className="font-medium">{invItem.item_code}</span>
                                        <span className="text-sm text-gray-500">{invItem.item_name}</span>
                        </div>
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">Item Name *</Label>
                      {mode === 'view' ? (
                        <Input
                          value={item.item_name}
                          disabled
                          className="text-xs bg-gray-50"
                        />
                      ) : (
                      <Input
                          value={item.item_name}
                          onChange={(e) => updateLineItem(item.id, 'item_name', e.target.value)}
                          placeholder="Enter item name"
                          required
                          disabled={!!item.item_code}
                          className="text-xs"
                        />
                      )}
                        </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Quantity</Label>
                      {mode === 'view' ? (
                        <Input
                          type="number"
                          value={item.quantity}
                          disabled
                          className="text-xs bg-gray-50"
                        />
                      ) : (
                      <Input
                        type="number"
                        value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          placeholder="1"
                          className="text-xs"
                      />
                      )}
                        </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Unit Price</Label>
                      {mode === 'view' ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unit_price}
                          disabled
                          className="text-xs bg-gray-50"
                        />
                      ) : (
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                          onChange={(e) => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          disabled={!!item.item_code}
                          className="text-xs"
                        />
                      )}
                        </div>
                    <div className="col-span-1">
                      <Label className="text-xs">Tax %</Label>
                      {mode === 'view' ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={item.tax_rate}
                          disabled
                          className="text-xs bg-gray-50"
                        />
                      ) : (
                      <Input
                        type="number"
                          step="0.01"
                        value={item.tax_rate}
                          onChange={(e) => updateLineItem(item.id, 'tax_rate', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          disabled={!!item.item_code}
                          className="text-xs"
                        />
                      )}
                    </div>
                    <div className="col-span-1">
                      {(mode === 'create' || mode === 'edit') && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLineItem(item.id)}
                          disabled={lineItems.length === 1}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
          </div>
                    
                    <div className="col-span-12 mt-2">
                      <Label className="text-xs">Description</Label>
                      {mode === 'view' ? (
                        <Textarea
                          value={item.description || ""}
                          disabled
                          className="text-xs bg-gray-50"
                          rows={2}
                        />
                      ) : (
                        <Textarea
                          value={item.description || ""}
                          onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                          placeholder="Optional description"
                          disabled={!!item.item_code}
                          className="text-xs"
                          rows={2}
                        />
                      )}
        </div>

                    <div className="col-span-12 grid grid-cols-3 gap-2 mt-2">
        <div>
                        <Label className="text-xs">Line Amount</Label>
                        <Input
                          value={(Number(item.line_amount) || 0).toFixed(2)}
                          disabled
                          className="text-xs font-mono bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Tax Amount</Label>
                        <Input
                          value={(Number(item.tax_amount) || 0).toFixed(2)}
                          disabled
                          className="text-xs font-mono bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Total</Label>
                        <Input
                          value={((Number(item.line_amount) || 0) + (Number(item.tax_amount) || 0)).toFixed(2)}
                          disabled
                          className="text-xs font-mono font-bold bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

          {/* Totals */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Totals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Subtotal</Label>
                  <div className="text-lg font-mono">${(Number(subtotal) || 0).toFixed(2)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tax Amount</Label>
                  <div className="text-lg font-mono">${(Number(taxAmount) || 0).toFixed(2)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Amount</Label>
                  <div className="text-xl font-mono font-bold">${(Number(total) || 0).toFixed(2)}</div>
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
          {mode === 'view' ? (
            <div className="py-3 px-4 bg-gray-50 rounded border min-h-[80px]">
              {invoiceData.notes || 'No notes available'}
            </div>
          ) : (
          <Textarea
            id="notes"
                  placeholder="Enter any additional notes..."
            value={invoiceData.notes}
            onChange={(e) => setInvoiceData({...invoiceData, notes: e.target.value})}
            rows={3}
          />
          )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
          {mode === 'view' ? (
              <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
          ) : (
            <>
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
                <Button type="submit" disabled={loading}>
                  {loading 
                    ? (mode === 'edit' ? "Updating..." : "Creating...") 
                    : (mode === 'edit' ? "Update Invoice" : "Create Invoice")}
          </Button>
            </>
          )}
        </div>
        </form>
      </div>
    </div>
  );
};
