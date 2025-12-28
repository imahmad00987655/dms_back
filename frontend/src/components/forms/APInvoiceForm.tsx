import { useState, useEffect, useRef } from "react";
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
import { X, Plus, ArrowLeft, ChevronsUpDown, Check } from "lucide-react";
import apiService from "@/services/api";
import { toast } from "sonner";
import { generateNextInvoiceNumber } from "@/utils/numberGenerator";

interface APSupplier {
  supplier_id: number;
  supplier_number: string;
  supplier_name: string;
  supplier_type: 'VENDOR' | 'CONTRACTOR' | 'SERVICE_PROVIDER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

interface APSupplierSite {
  site_id: number;
  supplier_id: number;
  site_name: string;
  site_type: 'INVOICING' | 'PURCHASING' | 'BOTH';
  address_line1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  is_primary: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

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

interface InvoiceLine {
  line_number: number;
  item_code?: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  line_amount: number;
  tax_rate: number;
  tax_amount: number;
}

interface APInvoiceFormProps {
  onClose: () => void;
  onSuccess: () => void;
  suppliers: APSupplier[];
  invoiceToEdit?: APInvoice | null;
}

interface APInvoice {
  invoice_id: number;
  invoice_number: string;
  supplier_id: number;
  bill_to_site_id: number;
  receipt_id?: number | null;
  invoice_date: string;
  due_date: string;
  payment_terms_id: number;
  currency_code: string;
  exchange_rate: number;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status?: 'DRAFT' | 'PENDING' | 'OPEN' | 'PAID' | 'CANCELLED' | 'VOID';
  approval_status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
  lines?: InvoiceLine[];
}

interface GRNHeaderForInvoice {
  receipt_id: number;
  receipt_number: string;
  header_id: number;
  po_number?: string;
  supplier_id?: number;
  supplier_site_id?: number;
  supplier_name?: string;
  currency_code?: string;
  exchange_rate?: number;
  total_amount?: number;
}

interface GRNLineForInvoice {
  line_id: number;
  line_number: number;
  item_code?: string;
  item_name: string;
  description?: string;
  quantity_accepted: number | string;
  unit_price: number | string;
  line_amount: number | string;
  tax_rate?: number | string;
  tax_amount?: number | string;
}

export const APInvoiceForm = ({ onClose, onSuccess, suppliers, invoiceToEdit }: APInvoiceFormProps) => {
  const [formData, setFormData] = useState<{
    supplier_id: string;
    bill_to_site_id: string;
    receipt_id: string;
    invoice_number: string;
    invoice_date: string;
    due_date: string;
    payment_terms_id: number;
    currency_code: string;
    exchange_rate: number;
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
    status: 'DRAFT' | 'PENDING' | 'OPEN' | 'PAID' | 'CANCELLED' | 'VOID';
    notes: string;
  }>({
    supplier_id: "",
    bill_to_site_id: "",
    receipt_id: "",
    invoice_number: "",
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: "",
    payment_terms_id: 30,
    currency_code: "USD",
    exchange_rate: 1.0,
    subtotal: 0,
    tax_amount: 0,
    total_amount: 0,
    approval_status: "PENDING",
    status: "DRAFT",
    notes: ""
  });

  const [lines, setLines] = useState<InvoiceLine[]>([
    {
      line_number: 1,
      item_name: "",
      description: "",
      quantity: 1,
      unit_price: 0,
      line_amount: 0,
      tax_rate: 0,
      tax_amount: 0
    }
  ]);

  const [supplierSites, setSupplierSites] = useState<APSupplierSite[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<APSupplier | null>(null);
  const [supplierSearchOpen, setSupplierSearchOpen] = useState(false);
  const [supplierSearchValue, setSupplierSearchValue] = useState("");
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [itemSearchOpen, setItemSearchOpen] = useState<{ [key: number]: boolean }>({});
  const [itemSearchValue, setItemSearchValue] = useState<{ [key: number]: string }>({});
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const invoiceNumberGenerated = useRef(false);
  const lastChangedField = useRef<'payment_terms' | 'due_date' | 'invoice_date' | null>(null);
  const [grns, setGrns] = useState<GRNHeaderForInvoice[]>([]);
  const [grnLoading, setGrnLoading] = useState(false);

  // Fetch inventory items and tax rates on mount
  useEffect(() => {
    loadInventoryItems();
    loadTaxRates();
    loadGRNs();
  }, []);

  const loadGRNs = async () => {
    setGrnLoading(true);
    try {
      // Load all GRNs regardless of status so user can always see available receipts
      const response = await apiService.getGRNs();
      const data =
        (response as { data?: GRNHeaderForInvoice[] })?.data ??
        (Array.isArray(response) ? response : []);

      const mapped: GRNHeaderForInvoice[] = data.map((grn: GRNHeaderForInvoice & { [key: string]: unknown }) => ({
        receipt_id: grn.receipt_id,
        receipt_number: grn.receipt_number,
        header_id: grn.header_id,
        po_number: grn.po_number,
        supplier_id: grn.supplier_id,
        supplier_site_id: grn.supplier_site_id,
        supplier_name: grn.supplier_name,
        currency_code: grn.currency_code,
        exchange_rate:
          typeof grn.exchange_rate === "number"
            ? grn.exchange_rate
            : parseFloat(String(grn.exchange_rate ?? "1")) || 1,
        total_amount:
          typeof grn.total_amount === "number"
            ? grn.total_amount
            : parseFloat(String(grn.total_amount ?? "0")) || 0,
      }));

      setGrns(mapped);

      console.log("GRNs loaded for AP Invoice:", {
        total: mapped.length,
        sample: mapped[0]
          ? {
              receipt_id: mapped[0].receipt_id,
              receipt_number: mapped[0].receipt_number,
              po_number: mapped[0].po_number,
              supplier_name: mapped[0].supplier_name,
            }
          : null,
      });
    } catch (error) {
      console.error("Error loading GRNs for AP Invoice:", error);
    } finally {
      setGrnLoading(false);
    }
  };

  // Auto-generate invoice number when creating a new invoice
  useEffect(() => {
    if (!invoiceToEdit && !invoiceNumberGenerated.current) {
      invoiceNumberGenerated.current = true;
      generateNextInvoiceNumber().then((nextNumber) => {
        setFormData(prev => {
          // Only update if still empty (user hasn't manually entered one)
          if (!prev.invoice_number) {
            return { ...prev, invoice_number: nextNumber };
          }
          return prev;
        });
      }).catch((error) => {
        console.error('Failed to generate invoice number:', error);
        invoiceNumberGenerated.current = false; // Reset on error so it can retry
      });
    }
  }, [invoiceToEdit]);

  // Sync Due Date when Payment Terms or Invoice Date changes
  useEffect(() => {
    // Skip if due_date was just manually changed by user
    if (lastChangedField.current === 'due_date') {
      // Reset flag after a delay to allow second useEffect to process
      setTimeout(() => {
        lastChangedField.current = null;
      }, 100);
      return;
    }
    
    // Only auto-calculate due_date if invoice_date and payment_terms_id are valid
    if (formData.invoice_date && formData.payment_terms_id > 0) {
      const invoiceDate = new Date(formData.invoice_date);
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + formData.payment_terms_id);
      
      const calculatedDueDate = dueDate.toISOString().split('T')[0];
      
      // Only update if the calculated due date is different from current
      if (calculatedDueDate !== formData.due_date) {
        setFormData(prev => ({ ...prev, due_date: calculatedDueDate }));
      }
    }
    
    // Reset flag after processing (for payment_terms or invoice_date changes)
    if (lastChangedField.current === 'payment_terms' || lastChangedField.current === 'invoice_date') {
      setTimeout(() => {
        lastChangedField.current = null;
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.invoice_date, formData.payment_terms_id]);

  // Sync Payment Terms when Due Date changes
  useEffect(() => {
    // Only auto-calculate payment_terms if due_date was manually changed by user
    const wasDueDateChanged = lastChangedField.current === 'due_date';
    
    if (!wasDueDateChanged) {
      return;
    }
    
    if (formData.invoice_date && formData.due_date) {
      const invoiceDate = new Date(formData.invoice_date);
      const dueDate = new Date(formData.due_date);
      
      // Calculate difference in days
      const diffTime = dueDate.getTime() - invoiceDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      // Only update if the calculated payment terms is different and positive
      if (diffDays > 0 && diffDays !== formData.payment_terms_id) {
        setFormData(prev => ({ ...prev, payment_terms_id: diffDays }));
      }
    }
    
    // Reset flag after processing
    setTimeout(() => {
      lastChangedField.current = null;
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.due_date]);

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
      
      // Debug: Log loaded tax rates
      console.log('Tax rates loaded:', {
        total: rates.length,
        active: activeRates.length,
        rateCodes: activeRates.map(r => `${r.rate_code} (${r.tax_percentage}%)`)
      });
    } catch (error) {
      console.error('Error loading tax rates:', error);
    }
  };

  // Auto-select primary site when supplierSites are loaded
  useEffect(() => {
    if (supplierSites.length > 0 && formData.supplier_id) {
      // Check if the currently selected site belongs to the current supplier
      const currentSiteBelongsToSupplier = formData.bill_to_site_id && supplierSites.some(
        site => site.site_id.toString() === formData.bill_to_site_id
      );
      
      // Auto-select if:
      // 1. No site is currently selected, OR
      // 2. The currently selected site doesn't belong to the current supplier (supplier was changed)
      if (!formData.bill_to_site_id || !currentSiteBelongsToSupplier) {
        // Find primary site (handle boolean, number, string, or Buffer from MySQL)
        const primarySite = supplierSites.find(site => {
          const isPrimary: unknown = site.is_primary;
          // Handle different types: boolean true, number 1, string '1'/'true', or Buffer
          if (isPrimary === null || isPrimary === undefined) return false;
          if (typeof isPrimary === 'boolean') return isPrimary === true;
          if (typeof isPrimary === 'number') return isPrimary === 1 || isPrimary === 1.0;
          if (typeof isPrimary === 'string') {
            const normalized = isPrimary.trim().toLowerCase();
            return normalized === '1' || normalized === 'true' || normalized === 'yes';
          }
          // Handle Buffer (MySQL sometimes returns BOOLEAN as Buffer)
          if (Buffer.isBuffer(isPrimary)) {
            return isPrimary[0] === 1;
          }
          return false;
        });
        
        console.log('🔍 Auto-selection check:', {
          supplier_id: formData.supplier_id,
          sites_count: supplierSites.length,
          has_primary: !!primarySite,
          primary_site: primarySite ? { id: primarySite.site_id, name: primarySite.site_name, is_primary: primarySite.is_primary } : null,
          all_sites: supplierSites.map(s => ({ 
            id: s.site_id, 
            name: s.site_name, 
            is_primary: s.is_primary,
            is_primary_type: typeof s.is_primary,
            is_primary_value: s.is_primary
          }))
        });
        
        if (primarySite) {
          // Primary site found - auto-select it
          setFormData(prev => ({ 
            ...prev, 
            bill_to_site_id: primarySite.site_id.toString() 
          }));
          console.log('✅ Auto-selected primary site:', primarySite.site_id, primarySite.site_name, 'is_primary:', primarySite.is_primary);
        } else {
          // No primary site - DO NOT auto-select, show all sites for manual selection
          setFormData(prev => ({ 
            ...prev, 
            bill_to_site_id: "" 
          }));
          console.log('ℹ️ No primary site found, showing all', supplierSites.length, 'sites for manual selection');
        }
      }
    } else if (supplierSites.length === 0 && formData.supplier_id) {
      // If supplier has no sites, clear the selection
      setFormData(prev => ({ 
        ...prev, 
        bill_to_site_id: "" 
      }));
    }
  }, [supplierSites, formData.supplier_id, formData.bill_to_site_id]);

  // Set selectedSupplier when formData.supplier_id or suppliers change
  useEffect(() => {
    if (formData.supplier_id && suppliers.length > 0) {
      const supplier = suppliers.find(s => s.supplier_id.toString() === formData.supplier_id);
      if (supplier) {
        setSelectedSupplier(supplier);
      }
    }
  }, [formData.supplier_id, suppliers]);

  // Fetch supplier sites when editing an invoice (programmatic change)
  useEffect(() => {
    if (invoiceToEdit && invoiceToEdit.supplier_id) {
      fetchSupplierSites(invoiceToEdit.supplier_id);
    }
  }, [invoiceToEdit]);

  // Helper function to format date for input field (YYYY-MM-DD)
  // Backend now returns dates as YYYY-MM-DD strings, so this mainly handles edge cases
  const formatDateForInput = (dateString: string | undefined | null): string => {
    if (!dateString) return '';
    
    try {
      // If already in YYYY-MM-DD format, return as is (most common case now)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }
      
      // Handle date strings that might have time components (fallback for old data)
      // Extract just the date part (YYYY-MM-DD) to avoid timezone issues
      const dateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dateMatch) {
        // Return the date part directly without timezone conversion
        return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
      }
      
      // If it's a different format, try parsing but use local date methods to avoid timezone shift
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString);
        return '';
      }
      
      // Use local date methods instead of toISOString() to avoid timezone conversion
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return '';
    }
  };

  // Load invoice data when editing
  useEffect(() => {
    if (invoiceToEdit) {
      console.log('Loading invoice data for editing:', invoiceToEdit);
      
      // Populate form with existing invoice data
      setFormData({
        supplier_id: invoiceToEdit.supplier_id.toString(),
        bill_to_site_id: invoiceToEdit.bill_to_site_id.toString(),
        receipt_id: invoiceToEdit.receipt_id ? invoiceToEdit.receipt_id.toString() : "",
        invoice_number: invoiceToEdit.invoice_number || '',
        invoice_date: formatDateForInput(invoiceToEdit.invoice_date),
        due_date: formatDateForInput(invoiceToEdit.due_date),
        payment_terms_id: invoiceToEdit.payment_terms_id || 30,
        currency_code: invoiceToEdit.currency_code || 'USD',
        exchange_rate: invoiceToEdit.exchange_rate || 1.0,
        subtotal: Number(invoiceToEdit.subtotal) || 0,
        tax_amount: Number(invoiceToEdit.tax_amount) || 0,
        total_amount: Number(invoiceToEdit.total_amount) || 0,
        approval_status: (invoiceToEdit.approval_status || 'PENDING') as 'PENDING' | 'APPROVED' | 'REJECTED',
        status: (invoiceToEdit.status || 'DRAFT') as 'DRAFT' | 'PENDING' | 'OPEN' | 'PAID' | 'CANCELLED' | 'VOID',
        notes: invoiceToEdit.notes || ""
      });

      console.log('Form data set:', {
        invoice_date: formatDateForInput(invoiceToEdit.invoice_date),
        due_date: formatDateForInput(invoiceToEdit.due_date),
        total_amount: Number(invoiceToEdit.total_amount) || 0
      });

      // Populate lines
      if (invoiceToEdit.lines && invoiceToEdit.lines.length > 0) {
        const formattedLines = invoiceToEdit.lines.map(line => ({
          line_number: line.line_number,
          item_code: line.item_code,
          item_name: line.item_name || '',
          description: line.description || '',
          quantity: Number(line.quantity) || 0,
          unit_price: Number(line.unit_price) || 0,
          line_amount: Number(line.line_amount) || 0,
          tax_rate: Number(line.tax_rate) || 0,
          tax_amount: Number(line.tax_amount) || 0
        }));
        setLines(formattedLines);
        console.log('Lines loaded:', formattedLines.length);
        
        // Calculate totals from loaded lines (useEffect will also do this, but ensure it's correct)
        const subtotal = formattedLines.reduce((sum, line) => sum + (Number(line.line_amount) || 0), 0);
        const taxAmount = formattedLines.reduce((sum, line) => sum + (Number(line.tax_amount) || 0), 0);
        const totalAmount = subtotal + taxAmount;
        
        setFormData(prev => ({
          ...prev,
          subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount
        }));
        
        console.log('Totals calculated from lines:', { subtotal, taxAmount, totalAmount });
      } else {
        // If no lines, use the invoice totals directly
        setFormData(prev => ({
          ...prev,
          subtotal: Number(invoiceToEdit.subtotal) || 0,
          tax_amount: Number(invoiceToEdit.tax_amount) || 0,
          total_amount: Number(invoiceToEdit.total_amount) || 0
        }));
      }

      // Supplier sites will be fetched by the useEffect above
    }
  }, [invoiceToEdit]);

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
      
      // Debug: Check if items have tax_status
      const itemsWithTax = items.filter(item => item.tax_status);
      console.log('Inventory items loaded:', {
        total: items.length,
        withTaxStatus: itemsWithTax.length,
        sampleItem: items[0] ? {
          code: items[0].item_code,
          name: items[0].item_name,
          tax_status: items[0].tax_status
        } : null
      });
    } catch (error) {
      console.error('Error loading inventory items:', error);
      toast.error('Failed to load inventory items');
    } finally {
      setInventoryLoading(false);
    }
  };

  // Calculate totals when lines change
  useEffect(() => {
    const subtotal = lines.reduce((sum, line) => sum + line.line_amount, 0);
    const taxAmount = lines.reduce((sum, line) => sum + line.tax_amount, 0);
    const totalAmount = subtotal + taxAmount;

    setFormData(prev => ({
      ...prev,
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount
    }));
  }, [lines]);

  const fetchSupplierSites = async (supplierId: number) => {
    try {
      const response = await apiService.getAPSupplierSites(supplierId);
      // Handle both array and object with data property
      const sites = Array.isArray(response) ? response : (response.data || []);
      
      console.log('🔍 Fetched supplier sites (ALL):', sites);
      console.log('🔍 Number of sites found (ALL):', sites.length);
      console.log('🔍 Sites breakdown:', sites.map((s: APSupplierSite) => ({
        id: s.site_id,
        name: s.site_name,
        type: s.site_type,
        status: s.status,
        is_primary: s.is_primary
      })));
      
      // Filter to only show ACTIVE sites
      const activeSites = sites.filter((site: APSupplierSite) => 
        site.status === 'ACTIVE'
      );
      
      console.log('🔍 Active sites (before type filter):', activeSites.length);
      
      // For AP Invoices, prefer INVOICING or BOTH type sites
      // But if none exist, show all active sites to allow user selection
      let invoicingSites = activeSites.filter((site: APSupplierSite) => 
        site.site_type === 'INVOICING' || site.site_type === 'BOTH'
      );
      
      // If no INVOICING/BOTH sites, show all active sites (user can still select)
      if (invoicingSites.length === 0 && activeSites.length > 0) {
        console.warn('⚠️ No INVOICING/BOTH sites found, showing all active sites');
        invoicingSites = activeSites;
      }
      
      console.log('🔍 Final sites to display:', invoicingSites.length);
      console.log('🔍 Filtered invoicing sites:', invoicingSites);
      
      // If no sites after filtering, log why
      if (invoicingSites.length === 0 && sites.length > 0) {
        console.warn('⚠️ No sites available! Reasons:');
        sites.forEach((site: APSupplierSite) => {
          const statusMatch = site.status === 'ACTIVE';
          console.warn(`  - Site "${site.site_name}": type=${site.site_type}, status=${site.status} (${statusMatch ? '✓' : '✗'})`);
        });
      }
      
      // Set sites - the useEffect will handle auto-selection
      setSupplierSites(invoicingSites);
    } catch (error) {
      console.error('Error fetching supplier sites:', error);
      toast.error('Failed to fetch supplier sites');
      setSupplierSites([]);
    }
  };

  const handleSupplierChange = async (supplierId: string) => {
    const supplier = suppliers.find(s => s.supplier_id.toString() === supplierId);
    setSelectedSupplier(supplier || null);
    
    // Clear sites first to ensure clean state
    setSupplierSites([]);
    
    // Reset site selection when supplier changes
    setFormData(prev => ({ 
      ...prev, 
      supplier_id: supplierId,
      bill_to_site_id: "" // Reset site selection when supplier changes
    }));
    
    // Fetch sites and auto-select primary if available
    if (supplierId) {
      await fetchSupplierSites(parseInt(supplierId));
    } else {
      setSupplierSites([]);
    }
  };

  const addLine = () => {
    const newLineNumber = Math.max(...lines.map(l => l.line_number), 0) + 1;
    setLines([...lines, {
      line_number: newLineNumber,
      item_name: "",
      description: "",
      quantity: 1,
      unit_price: 0,
      line_amount: 0,
      tax_rate: 0,
      tax_amount: 0
    }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      const newLines = lines.filter((_, i) => i !== index);
      // Renumber lines
      const renumberedLines = newLines.map((line, i) => ({
        ...line,
        line_number: i + 1
      }));
      setLines(renumberedLines);
    }
  };

  const updateLine = (index: number, field: keyof InvoiceLine, value: string | number) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    // Calculate line amount and tax
    const line = newLines[index];
    line.line_amount = line.quantity * line.unit_price;
    line.tax_amount = line.line_amount * (line.tax_rate / 100);
    
    setLines(newLines);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplier_id || !formData.bill_to_site_id) {
      toast.error('Please select a supplier and billing site');
      return;
    }

    if (lines.some(line => !line.item_name || line.quantity <= 0 || line.unit_price <= 0)) {
      toast.error('Please fill in all required line item fields');
      return;
    }

    setLoading(true);
    try {
      const invoiceData = {
        supplier_id: parseInt(formData.supplier_id),
        bill_to_site_id: parseInt(formData.bill_to_site_id), // Backend expects bill_to_site_id
        receipt_id: formData.receipt_id ? parseInt(formData.receipt_id) : null,
        invoice_number: formData.invoice_number,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date,
        payment_terms_id: parseInt(formData.payment_terms_id.toString()),
        currency_code: formData.currency_code,
        exchange_rate: formData.exchange_rate,
        subtotal: formData.subtotal,
        tax_amount: formData.tax_amount,
        total_amount: formData.total_amount,
        notes: formData.notes || null,
        line_items: lines.map(line => ({
          line_number: line.line_number,
          item_code: line.item_code || null,
          item_name: line.item_name,
          description: line.description || null,
          quantity: line.quantity,
          unit_price: line.unit_price,
          line_amount: line.line_amount,
          tax_rate: line.tax_rate,
          tax_amount: line.tax_amount
        }))
      };

      console.log('Submitting invoice data:', invoiceData);
      
      if (invoiceToEdit) {
        // Update existing invoice
        await apiService.updateAPInvoice(invoiceToEdit.invoice_id, invoiceData);
        toast.success('Invoice updated successfully');
      } else {
        // Create new invoice
        await apiService.createAPInvoice(invoiceData);
        toast.success('Invoice created successfully');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error creating invoice:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create invoice';
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
              <h2 className="text-xl font-semibold">{invoiceToEdit ? 'Edit AP Invoice' : 'Create AP Invoice'}</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Header Information */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Header</CardTitle>
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
                      {selectedSupplier
                        ? `${selectedSupplier.supplier_name} (${selectedSupplier.supplier_number})`
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
                <Label htmlFor="grn">Goods Receipt (GRN)</Label>
                <Select
                  value={formData.receipt_id}
                  onValueChange={async (value) => {
                    setFormData(prev => ({ ...prev, receipt_id: value }));
                    const selected = grns.find(g => g.receipt_id.toString() === value);
                    if (!selected) return;

                    // Auto-fill supplier, currency, rate
                    if (selected.supplier_id) {
                      await handleSupplierChange(selected.supplier_id.toString());
                    }

                    setFormData(prev => ({
                      ...prev,
                      supplier_id: selected.supplier_id ? selected.supplier_id.toString() : prev.supplier_id,
                      currency_code: selected.currency_code || prev.currency_code,
                      exchange_rate: selected.exchange_rate || prev.exchange_rate
                    }));

                    // If supplier site present, set it after sites load
                    if (selected.supplier_id) {
                      await fetchSupplierSites(selected.supplier_id);
                      if (selected.supplier_site_id) {
                        setFormData(prev => ({
                          ...prev,
                          bill_to_site_id: selected.supplier_site_id!.toString()
                        }));
                      }
                    }

                    // Fetch GRN lines and populate invoice lines
                    try {
                      const grn = await apiService.getGRN(parseInt(value));
                      const grnLines: GRNLineForInvoice[] = Array.isArray(grn.lines) ? grn.lines : [];
                      const invoiceLines: InvoiceLine[] = grnLines
                        .map((line, index) => {
                          const qty = Number(line.quantity_accepted) || 0;
                          if (qty <= 0) return null;
                          const unitPrice = Number(line.unit_price) || 0;
                          const baseAmount = Number(line.line_amount) || qty * unitPrice;
                          const taxRate = line.tax_rate !== undefined ? Number(line.tax_rate) || 0 : 0;
                          const taxAmount = line.tax_amount !== undefined ? Number(line.tax_amount) || 0 : baseAmount * (taxRate / 100);
                          return {
                            line_number: index + 1,
                            item_code: line.item_code,
                            item_name: line.item_name || '',
                            description: line.description || '',
                            quantity: qty,
                            unit_price: unitPrice,
                            line_amount: baseAmount,
                            tax_rate: taxRate,
                            tax_amount: taxAmount
                          } as InvoiceLine;
                        })
                        .filter((l): l is InvoiceLine => l !== null);

                      if (invoiceLines.length > 0) {
                        setLines(invoiceLines);
                      }
                    } catch (error) {
                      console.error('Error loading GRN lines for invoice:', error);
                      toast.error('Failed to load GRN lines for invoice');
                    }
                  }}
                  disabled={grnLoading || !!invoiceToEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={grnLoading ? "Loading GRNs..." : "Select GRN"} />
                  </SelectTrigger>
                  <SelectContent>
                    {grns.map(grn => (
                      <SelectItem key={grn.receipt_id} value={grn.receipt_id.toString()}>
                        {grn.receipt_number} {grn.po_number ? `- ${grn.po_number}` : ''} {grn.supplier_name ? `- ${grn.supplier_name}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bill_to_site">Billing Site *</Label>
                <Select value={formData.bill_to_site_id} onValueChange={(value) => setFormData(prev => ({ ...prev, bill_to_site_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select billing site" />
                  </SelectTrigger>
                  <SelectContent>
                    {supplierSites.map(site => {
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice_number">Invoice Number *</Label>
                <Input
                  id="invoice_number"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoice_number: e.target.value }))}
                  placeholder="Enter invoice number"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice_date">Invoice Date *</Label>
                <Input
                  id="invoice_date"
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => {
                    lastChangedField.current = 'invoice_date';
                    setFormData(prev => ({ ...prev, invoice_date: e.target.value }));
                  }}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date *</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => {
                    lastChangedField.current = 'due_date';
                    setFormData(prev => ({ ...prev, due_date: e.target.value }));
                  }}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_terms">Payment Terms (Days)</Label>
                <Input
                  id="payment_terms"
                  type="number"
                  min="0"
                  value={formData.payment_terms_id}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    lastChangedField.current = 'payment_terms';
                    setFormData(prev => ({ ...prev, payment_terms_id: value }));
                  }}
                  placeholder="30"
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

          {/* Line Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Line Items</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addLine}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Line
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lines.map((line, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-start border p-4 rounded-lg">
                    <div className="col-span-1">
                      <Label className="text-xs">Line</Label>
                      <Input
                        value={line.line_number}
                        disabled
                        className="text-xs"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Item Code</Label>
                      <Popover 
                        open={itemSearchOpen[index] || false} 
                        onOpenChange={(open) => setItemSearchOpen(prev => ({ ...prev, [index]: open }))}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between text-xs h-9 overflow-hidden",
                              !line.item_code && "text-muted-foreground"
                            )}
                          >
                            <span className="truncate flex-1 text-left">{line.item_code || "Search item..."}</span>
                            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50 flex-shrink-0" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput 
                              placeholder="Search by item code or name..." 
                              value={itemSearchValue[index] || ""}
                              onValueChange={(value) => setItemSearchValue(prev => ({ ...prev, [index]: value }))}
                            />
                            <CommandEmpty>No item found.</CommandEmpty>
                            <CommandGroup>
                              {inventoryItems
                                .filter(item => 
                                  !itemSearchValue[index] || 
                                  item.item_code?.toLowerCase().includes(itemSearchValue[index].toLowerCase()) ||
                                  item.item_name?.toLowerCase().includes(itemSearchValue[index].toLowerCase())
                                )
                                .map((item) => (
                                  <CommandItem
                                    key={item.id}
                                    value={`${item.item_code} ${item.item_name}`}
                                    onSelect={() => {
                                      // Update all fields in a single state update
                                      const newLines = [...lines];
                                      const line = { ...newLines[index] };
                                      
                                      line.item_code = item.item_code;
                                      line.item_name = item.item_name;
                                      if (item.description) {
                                        line.description = item.description;
                                      }
                                      if (item.item_purchase_rate) {
                                        line.unit_price = item.item_purchase_rate;
                                      }
                                      
                                      // Auto-populate tax rate from item's tax_status
                                      if (item.tax_status && taxRates.length > 0) {
                                        // Try exact match first
                                        let taxRate = taxRates.find(rate => 
                                          rate.rate_code === item.tax_status || 
                                          rate.rate_code === item.tax_status.trim()
                                        );
                                        
                                        // If no exact match, try case-insensitive
                                        if (!taxRate) {
                                          taxRate = taxRates.find(rate => 
                                            rate.rate_code.toLowerCase() === item.tax_status.toLowerCase()
                                          );
                                        }
                                        
                                        if (taxRate) {
                                          line.tax_rate = taxRate.tax_percentage;
                                          console.log(`Tax rate found: ${taxRate.rate_code} = ${taxRate.tax_percentage}%`);
                                        } else {
                                          console.warn(`Tax rate not found for tax_status: "${item.tax_status}"`, {
                                            availableRates: taxRates.map(r => r.rate_code),
                                            itemTaxStatus: item.tax_status
                                          });
                                        }
                                      } else if (item.tax_status) {
                                        console.warn('Tax rates not loaded yet or item has no tax_status', {
                                          hasTaxStatus: !!item.tax_status,
                                          taxStatusValue: item.tax_status,
                                          taxRatesCount: taxRates.length
                                        });
                                      }
                                      
                                      // Recalculate line amount and tax
                                      line.line_amount = line.quantity * line.unit_price;
                                      line.tax_amount = line.line_amount * (line.tax_rate / 100);
                                      
                                      newLines[index] = line;
                                      setLines(newLines);
                                      
                                      setItemSearchOpen(prev => ({ ...prev, [index]: false }));
                                      setItemSearchValue(prev => ({ ...prev, [index]: '' }));
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        line.item_code === item.item_code ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium">{item.item_code}</span>
                                      <span className="text-sm text-gray-500">{item.item_name}</span>
                                    </div>
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">Item Name *</Label>
                      <Input
                        value={line.item_name}
                        onChange={(e) => updateLine(index, 'item_name', e.target.value)}
                        placeholder="Enter item name"
                        required
                        disabled={!!line.item_code}
                        className="text-xs"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Quantity</Label>
                      <Input
                        type="number"
                        value={line.quantity}
                        onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value) || 0)}
                        placeholder="1"
                        className="text-xs"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Unit Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={line.unit_price}
                        onChange={(e) => updateLine(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        disabled={!!line.item_code}
                        className="text-xs"
                      />
                    </div>
                    <div className="col-span-1">
                      <Label className="text-xs">Tax %</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={line.tax_rate}
                        onChange={(e) => updateLine(index, 'tax_rate', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        disabled={!!line.item_code}
                        className="text-xs"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLine(index)}
                        disabled={lines.length === 1}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="col-span-12 mt-2">
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        value={line.description || ""}
                        onChange={(e) => updateLine(index, 'description', e.target.value)}
                        placeholder="Optional description"
                        disabled={!!line.item_code}
                        className="text-xs"
                        rows={2}
                      />
                    </div>
                    
                    <div className="col-span-12 grid grid-cols-3 gap-2 mt-2">
                      <div>
                        <Label className="text-xs">Line Amount</Label>
                        <Input
                          value={(Number(line.line_amount) || 0).toFixed(2)}
                          disabled
                          className="text-xs font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Tax Amount</Label>
                        <Input
                          value={(Number(line.tax_amount) || 0).toFixed(2)}
                          disabled
                          className="text-xs font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Total</Label>
                        <Input
                          value={((Number(line.line_amount) || 0) + (Number(line.tax_amount) || 0)).toFixed(2)}
                          disabled
                          className="text-xs font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
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
                  <div className="text-lg font-mono">${(Number(formData.subtotal) || 0).toFixed(2)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tax Amount</Label>
                  <div className="text-lg font-mono">${(Number(formData.tax_amount) || 0).toFixed(2)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Amount</Label>
                  <div className="text-xl font-mono font-bold">${(Number(formData.total_amount) || 0).toFixed(2)}</div>
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
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (invoiceToEdit ? "Updating..." : "Creating...") : (invoiceToEdit ? "Update Invoice" : "Create Invoice")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}; 