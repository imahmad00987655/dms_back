import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Plus, X, ArrowLeft, Check, ChevronsUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import apiService from '../../services/api.js';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface Company {
  id: number;
  name: string;
  legal_name?: string;
  company_code?: string;
  status?: string;
}

interface Supplier {
  supplier_id: number;
  supplier_name: string;
  supplier_number: string;
  supplier_type?: string;
  supplier_class?: string;
  supplier_category?: string;
  status?: string;
}

interface SupplierSite {
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

interface PurchaseRequisition {
  requisition_id: number;
  requisition_number: string;
  description: string;
  status: string;
}

interface PurchaseOrder {
  header_id?: number;
  po_number?: string;
  po_type?: string;
  supplier_id?: number;
  supplier_site_id?: number;
  supplier_site_name?: string; // Add supplier_site_name field
  party_id?: number; // Add party_id field
  buyer_id?: number;
  requisition_id?: number;
  po_date?: string;
  need_by_date?: string;
  currency_code?: string;
  exchange_rate?: number;
  total_amount?: number;
  description?: string;
  notes?: string;
  status?: string;
  approval_status?: string;
  lines?: POLine[];
}

interface PurchaseOrderFormProps {
  purchaseOrder?: PurchaseOrder | null;
  suppliers: Supplier[];
  users: User[];
  requisitions: PurchaseRequisition[];
  onSave: () => void;
  onCancel: () => void;
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
  box_quantity?: number;
  packet_quantity?: number;
  uom_type?: string;
  brand?: string; // This stores supplier_id as string
  supplier_id?: number;
}

interface TaxRate {
  id: number;
  rate_code: string;
  tax_percentage: number;
  status: string;
}

interface POLine {
  line_number: number;
  item_id?: number;
  item_name: string;
  item_code?: string;
  description: string;
  quantity: number;
  uom: string;
  box_quantity: number;
  packet_quantity: number;
  unit_price: number;
  line_amount: number;
  tax_rate: number;
  tax_amount: number;
  quantity_received?: number;
}

export const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({
  purchaseOrder,
  suppliers,
  users,
  requisitions,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    po_number: '',
    po_type: 'STANDARD',
    supplier_id: '',
    supplier_site_id: '',
    party_id: '', // Add party_id field
    buyer_id: '',
    requisition_id: 'none',
    po_date: new Date().toISOString().split('T')[0], // Auto-set to current date
    need_by_date: '',
    currency_code: 'USD',
    exchange_rate: '1.0',
    total_amount: '0',
    description: '',
    notes: '',
    status: 'DRAFT',
    approval_status: 'PENDING'
  });
  const [lines, setLines] = useState<POLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [supplierSites, setSupplierSites] = useState<SupplierSite[]>([]);
  const [loadingSupplierSites, setLoadingSupplierSites] = useState(false);
  const [selectedSiteName, setSelectedSiteName] = useState<string>('');
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [itemSearchOpen, setItemSearchOpen] = useState<{ [key: number]: boolean }>({});
  const [itemSearchValue, setItemSearchValue] = useState<{ [key: number]: string }>({});
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const { toast } = useToast();
  const lastFetchedSupplierId = useRef<number | null>(null);
  const initialSupplierIdWhenItemsAdded = useRef<string | null>(null);

  const uomOptions = ['PCS', 'Bottles'];

  // Helper function to get status value with proper fallback
  const getStatusValue = (value: string | undefined | null, fallback: string): string => {
    if (value === undefined || value === null || value === '') {
      return fallback;
    }
    return value;
  };

  const fetchSupplierSites = useCallback(async (supplierId: number) => {
    // Prevent duplicate API calls for the same supplier
    if (lastFetchedSupplierId.current === supplierId) {
      console.log('🔍 Already fetched sites for supplier ID:', supplierId, 'skipping API call');
      return;
    }
    
    try {
      console.log('🔍 Fetching supplier sites for supplier ID:', supplierId);
      setLoadingSupplierSites(true);
      lastFetchedSupplierId.current = supplierId;
      
      const response = await apiService.getProcurementSupplierSites(supplierId);
      console.log('🔍 Raw API response:', response);
      
      // Handle the response structure: { data: rows }
      const sites = response.data || response;
      console.log('🔍 Processed supplier sites (ALL):', sites);
      console.log('🔍 Number of sites found (ALL):', sites.length);
      console.log('🔍 Sites breakdown:', sites.map((s: SupplierSite) => ({
        id: s.site_id,
        name: s.site_name,
        type: s.site_type,
        status: s.status,
        is_primary: s.is_primary
      })));
      
      // Filter to only show ACTIVE sites
      const activeSites = sites.filter((site: SupplierSite) => 
        site.status === 'ACTIVE'
      );
      
      console.log('🔍 Active sites (before type filter):', activeSites.length);
      
      // For Purchase Orders, prefer PURCHASING or BOTH type sites
      // But if none exist, show all active sites to allow user selection
      let purchasingSites = activeSites.filter((site: SupplierSite) => 
        site.site_type === 'PURCHASING' || site.site_type === 'BOTH'
      );
      
      // If no PURCHASING/BOTH sites, show all active sites (user can still select)
      if (purchasingSites.length === 0 && activeSites.length > 0) {
        console.warn('⚠️ No PURCHASING/BOTH sites found, showing all active sites');
        purchasingSites = activeSites;
      }
      
      console.log('🔍 Final sites to display:', purchasingSites.length);
      console.log('🔍 Filtered purchasing sites:', purchasingSites);
      
      // If no sites after filtering, log why
      if (purchasingSites.length === 0 && sites.length > 0) {
        console.warn('⚠️ No sites available! Reasons:');
        sites.forEach((site: SupplierSite) => {
          const statusMatch = site.status === 'ACTIVE';
          console.warn(`  - Site "${site.site_name}": type=${site.site_type}, status=${site.status} (${statusMatch ? '✓' : '✗'})`);
        });
      }
      
      setSupplierSites(purchasingSites);
      console.log('🔍 Updated supplierSites state with:', purchasingSites);
    } catch (error) {
      console.error('❌ Error fetching supplier sites:', error);
      setSupplierSites([]);
      lastFetchedSupplierId.current = null; // Reset on error
      toast({
        title: "Error",
        description: "Failed to load supplier sites",
        variant: "destructive"
      });
    } finally {
      setLoadingSupplierSites(false);
    }
  }, [toast]);

  const fetchSiteNameById = useCallback(async (siteId: number) => {
    try {
      console.log('🔍 Fetching site name for site ID:', siteId);
      const site = await apiService.getSupplierSiteById(siteId);
      console.log('🔍 Site data:', site);
      if (site && site.site_name) {
        setSelectedSiteName(site.site_name);
        console.log('🔍 Set selectedSiteName to:', site.site_name);
      }
    } catch (error) {
      console.error('❌ Error fetching site name:', error);
    }
  }, []);

  useEffect(() => {
    console.log('🔍 useEffect triggered with purchaseOrder:', purchaseOrder);
    if (purchaseOrder) {
      // Debug: Log the actual purchase order data
      console.log('PurchaseOrderForm - Received purchaseOrder data:', purchaseOrder);
      console.log('PurchaseOrderForm - Status:', purchaseOrder.status);
      console.log('PurchaseOrderForm - Approval Status:', purchaseOrder.approval_status);
      console.log('PurchaseOrderForm - Supplier ID:', purchaseOrder.supplier_id);
      console.log('PurchaseOrderForm - Supplier Site ID:', purchaseOrder.supplier_site_id);
      console.log('PurchaseOrderForm - Supplier Site Name:', purchaseOrder.supplier_site_name);
      console.log('PurchaseOrderForm - Type of supplier_site_name:', typeof purchaseOrder.supplier_site_name);
      console.log('PurchaseOrderForm - Is supplier_site_name truthy:', !!purchaseOrder.supplier_site_name);
      
      const formDataToSet = {
        po_number: purchaseOrder.po_number || '',
        po_type: purchaseOrder.po_type || 'STANDARD',
        supplier_id: purchaseOrder.supplier_id?.toString() || '',
        supplier_site_id: purchaseOrder.supplier_site_id?.toString() || '', // Set the existing site ID
        party_id: purchaseOrder.party_id?.toString() || '', // Set party_id
        buyer_id: purchaseOrder.buyer_id?.toString() || '',
        requisition_id: purchaseOrder.requisition_id?.toString() || 'none',
        po_date: purchaseOrder.po_date ? purchaseOrder.po_date.split('T')[0] : new Date().toISOString().split('T')[0],
        need_by_date: purchaseOrder.need_by_date ? purchaseOrder.need_by_date.split('T')[0] : '',
        currency_code: purchaseOrder.currency_code || 'USD',
        exchange_rate: purchaseOrder.exchange_rate?.toString() || '1.0',
        total_amount: purchaseOrder.total_amount?.toString() || '0',
        description: purchaseOrder.description || '',
        notes: purchaseOrder.notes || '',
        status: getStatusValue(purchaseOrder.status, 'DRAFT'),
        approval_status: getStatusValue(purchaseOrder.approval_status, 'PENDING')
      };
      
      
      // Set the selected site name if available
      if (purchaseOrder.supplier_site_name) {
        setSelectedSiteName(purchaseOrder.supplier_site_name);
      } else if (purchaseOrder.supplier_site_id) {
        // If we have a site ID but no site name, fetch the site name
        console.log('🔍 No site name available, fetching site name for ID:', purchaseOrder.supplier_site_id);
        fetchSiteNameById(purchaseOrder.supplier_site_id);
      }
      
      // FORCE FIX: If supplier_site_id is missing, try to get it from the purchase order
      if (!formDataToSet.supplier_site_id && purchaseOrder.supplier_site_id) {
        console.log('🔍 FORCE FIX: Setting supplier_site_id from purchaseOrder:', purchaseOrder.supplier_site_id);
        formDataToSet.supplier_site_id = purchaseOrder.supplier_site_id.toString();
      }
      
      setFormData(formDataToSet);
      
      // Process lines - remove old fields and keep only the ones we need
      const processedLines = (purchaseOrder.lines || []).map(line => ({
        line_number: line.line_number,
        item_id: line.item_id,
        item_name: line.item_name || '',
        item_code: line.item_code || '',
        description: line.description || '',
        quantity: Number(line.quantity) || 0,
        uom: line.uom || 'PCS',
        box_quantity: Number(line.box_quantity ?? 0) || 0,
        packet_quantity: Number(line.packet_quantity ?? 0) || 0,
        unit_price: Number(line.unit_price) || 0,
        line_amount: Number(line.line_amount) || 0,
        tax_rate: Number(line.tax_rate) || 0,
        tax_amount: Number(line.tax_amount) || 0,
        quantity_received: Number(line.quantity_received ?? 0) || 0
      }));
      setLines(processedLines);
      
      // Set initial supplier if lines exist (for editing existing PO)
      if (processedLines.length > 0 && processedLines.some(line => line.item_code || line.item_name) && purchaseOrder.supplier_id) {
        initialSupplierIdWhenItemsAdded.current = purchaseOrder.supplier_id.toString();
      }
      
      // Fetch supplier sites immediately when editing existing PO
      if (purchaseOrder.supplier_id) {
        console.log('🔍 About to fetch supplier sites for supplier_id:', purchaseOrder.supplier_id);
        console.log('🔍 Current lastFetchedSupplierId:', lastFetchedSupplierId.current);
        // Reset the last fetched supplier ID to ensure we fetch fresh data
        lastFetchedSupplierId.current = null;
        // Fetch supplier sites - the site ID is already set in formData
        fetchSupplierSites(purchaseOrder.supplier_id);
      } else {
        console.log('🔍 No supplier_id found in purchase order data');
      }
    } else {
      // Auto-generate PO number for new purchase orders
      generatePONumber();
      // Add a default line item for new purchase orders
      setLines([{
        line_number: 1,
        item_id: undefined,
        item_name: '',
        item_code: '',
        description: '',
        quantity: 1,
        uom: 'PCS',
        box_quantity: 0,
        packet_quantity: 0,
        unit_price: 0,
        line_amount: 0,
        tax_rate: 0,
        tax_amount: 0
      }]);
    }
  }, [purchaseOrder, fetchSupplierSites, fetchSiteNameById]);

  // Load inventory items and tax rates on mount
  const loadInventoryItems = useCallback(async () => {
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
      toast({
        title: "Error",
        description: "Failed to load inventory items",
        variant: "destructive"
      });
    } finally {
      setInventoryLoading(false);
    }
  }, [toast]);

  const loadTaxRates = useCallback(async () => {
    try {
      const response = await apiService.getTaxRates();
      const rates = response?.data || (Array.isArray(response) ? response : []);
      setTaxRates(rates);
    } catch (error) {
      console.error('Error loading tax rates:', error);
    }
  }, []);

  const loadCompanies = useCallback(async () => {
    try {
      setLoadingCompanies(true);
      const response = await apiService.getCompanies({ status: 'Active' });
      const companiesList = response?.data || (Array.isArray(response) ? response : []);
      setCompanies(companiesList);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast({
        title: "Error",
        description: "Failed to load companies",
        variant: "destructive"
      });
    } finally {
      setLoadingCompanies(false);
    }
  }, [toast]);

  useEffect(() => {
    loadInventoryItems();
    loadTaxRates();
    loadCompanies();
  }, [loadInventoryItems, loadTaxRates, loadCompanies]);

  // Fetch supplier sites when supplier changes
  useEffect(() => {
    if (formData.supplier_id && formData.supplier_id !== '') {
      const supplierId = parseInt(formData.supplier_id);
      // Reset the last fetched supplier ID when supplier changes
      if (lastFetchedSupplierId.current !== supplierId) {
        lastFetchedSupplierId.current = null;
      }
      fetchSupplierSites(supplierId); // No existing site ID for new supplier selection
    } else {
      setSupplierSites([]);
      setFormData(prev => ({ ...prev, supplier_site_id: '' }));
      lastFetchedSupplierId.current = null;
    }
  }, [formData.supplier_id, fetchSupplierSites]);

  // Debug: Monitor supplierSites state changes
  useEffect(() => {
    console.log('🔍 supplierSites state changed:', supplierSites);
    console.log('🔍 supplierSites length:', supplierSites.length);
    
    // If we have a selected site ID but no sites loaded yet, and sites are now loaded,
    // ensure the site ID is still valid
    if (formData.supplier_site_id && supplierSites.length > 0) {
      const selectedSite = supplierSites.find(site => site.site_id.toString() === formData.supplier_site_id);
      if (!selectedSite) {
        console.log('🔍 Selected site ID not found in loaded sites, clearing selection');
        setFormData(prev => ({ ...prev, supplier_site_id: '' }));
      }
    }
  }, [supplierSites, formData.supplier_site_id]);


  // FORCE FIX: Set supplier_site_id if it's missing but we have it in purchaseOrder
  useEffect(() => {
    if (purchaseOrder && purchaseOrder.supplier_site_id && !formData.supplier_site_id) {
      console.log('🔍 FORCE FIX useEffect: Setting supplier_site_id from purchaseOrder:', purchaseOrder.supplier_site_id);
      setFormData(prev => ({
        ...prev,
        supplier_site_id: purchaseOrder.supplier_site_id.toString()
      }));
    }
  }, [purchaseOrder, formData.supplier_site_id]);

  // Auto-select primary site when supplierSites are loaded
  useEffect(() => {
    if (supplierSites.length > 0 && formData.supplier_id) {
      // Check if the currently selected site belongs to the current supplier
      const currentSiteBelongsToSupplier = formData.supplier_site_id && supplierSites.some(
        site => site.site_id.toString() === formData.supplier_site_id
      );
      
      // Auto-select if:
      // 1. No site is currently selected, OR
      // 2. The currently selected site doesn't belong to the current supplier (supplier was changed)
      if (!formData.supplier_site_id || !currentSiteBelongsToSupplier) {
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
            supplier_site_id: primarySite.site_id.toString() 
          }));
          setSelectedSiteName(primarySite.site_name);
          console.log('✅ Auto-selected primary site:', primarySite.site_id, primarySite.site_name, 'is_primary:', primarySite.is_primary);
        } else {
          // No primary site - DO NOT auto-select, show all sites for manual selection
          setFormData(prev => ({ 
            ...prev, 
            supplier_site_id: "" 
          }));
          setSelectedSiteName('');
          console.log('ℹ️ No primary site found, showing all', supplierSites.length, 'sites for manual selection');
        }
      }
    } else if (supplierSites.length === 0 && formData.supplier_id) {
      // If supplier has no sites, clear the selection
      setFormData(prev => ({ 
        ...prev, 
        supplier_site_id: "" 
      }));
      setSelectedSiteName('');
    }
  }, [supplierSites, formData.supplier_id, formData.supplier_site_id]);

  // Function to generate PO number - Smart logic
  const generatePONumber = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const response = await apiService.generatePONumber(currentYear);
      
      if (response.success && response.po_number) {
        setFormData(prev => ({
          ...prev,
          po_number: response.po_number
        }));
      }
    } catch (error) {
      console.error('Error generating PO number:', error);
      // Don't show error toast as this is not critical for form functionality
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // If supplier site is changed, update the selected site name
    if (field === 'supplier_site_id') {
      const selectedSite = supplierSites.find(site => site.site_id.toString() === value);
      if (selectedSite) {
        setSelectedSiteName(selectedSite.site_name);
      } else {
        setSelectedSiteName('');
      }
    }
  };

  const handleSupplierChange = async (supplierId: string) => {
    // Check if items have been added and supplier is being changed
    if (lines.length > 0 && lines.some(line => line.item_code || line.item_name)) {
      // Check if this is a different supplier than when items were added
      if (initialSupplierIdWhenItemsAdded.current && 
          initialSupplierIdWhenItemsAdded.current !== supplierId) {
        toast({
          title: "Warning",
          description: "Cannot change supplier after items have been added. Please remove all line items first or create a new purchase order.",
          variant: "destructive"
        });
        // Reset to the original supplier
        setFormData(prev => ({
          ...prev,
          supplier_id: initialSupplierIdWhenItemsAdded.current || ''
        }));
        return;
      }
    }
    
    // Clear sites first to ensure clean state
    setSupplierSites([]);
    
    // Clear selected site name when supplier changes
    setSelectedSiteName('');
    
    // Update the supplier and clear site selection
    setFormData(prev => ({
      ...prev,
      supplier_id: supplierId,
      supplier_site_id: '' // Clear supplier site when supplier changes
    }));
    
    // Fetch supplier sites for the selected supplier
    if (supplierId) {
      await fetchSupplierSites(parseInt(supplierId));
    } else {
      setSupplierSites([]);
    }
  };

  const addLine = () => {
    const newLineNumber = Math.max(...lines.map(l => l.line_number), 0) + 1;
    const newLine: POLine = {
      line_number: newLineNumber,
      item_id: undefined,
      item_name: '',
      item_code: '',
      description: '',
      quantity: 1,
      uom: 'PCS',
      box_quantity: 0,
      packet_quantity: 0,
      unit_price: 0,
      line_amount: 0,
      tax_rate: 0,
      tax_amount: 0
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
    
    // If all items are removed, reset the initial supplier tracking
    const hasItems = renumberedLines.some(line => line.item_code || line.item_name);
    if (!hasItems) {
      initialSupplierIdWhenItemsAdded.current = null;
    }
  };

  const updateLine = (index: number, field: keyof POLine, value: string | number) => {
    // Validate supplier is selected before allowing item name entry
    if (field === 'item_name' && value && typeof value === 'string' && value.trim() && !formData.supplier_id) {
      toast({
        title: "Validation Error",
        description: "Please select a supplier first before entering item name.",
        variant: "destructive"
      });
      return;
    }
    
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    // Track the supplier when item_name is manually entered (not from dropdown)
    if (field === 'item_name' && value && typeof value === 'string' && value.trim() && formData.supplier_id) {
      if (!initialSupplierIdWhenItemsAdded.current) {
        initialSupplierIdWhenItemsAdded.current = formData.supplier_id;
      }
    }
    
    // Calculate line amount and tax
    const line = newLines[index];
    // Calculate quantity from boxes × packets
    const calculatedQuantity = (line.box_quantity || 0) * (line.packet_quantity || 0);
    line.quantity = calculatedQuantity; // Keep quantity field for backend compatibility
    line.line_amount = calculatedQuantity * line.unit_price;
    line.tax_amount = line.line_amount * (line.tax_rate / 100);
    
    setLines(newLines);
    
    // Calculate total amount and remaining amount
    const total = newLines.reduce((sum, line) => sum + (line.line_amount || 0), 0);
    const received = newLines.reduce((sum, line) => sum + ((line.quantity_received || 0) * (line.unit_price || 0)), 0);
    const remaining = total - received;
    
    setFormData(prev => ({
      ...prev,
      total_amount: total.toString(),
    }));
  };

  const validateForm = () => {
    if (!formData.po_number.trim()) {
      toast({
        title: "Validation Error",
        description: "PO number is required",
        variant: "destructive"
      });
      return false;
    }
    if (!formData.supplier_id) {
      toast({
        title: "Validation Error",
        description: "Supplier is required",
        variant: "destructive"
      });
      return false;
    }
    if (!formData.supplier_site_id) {
      toast({
        title: "Validation Error",
        description: "Supplier site is required",
        variant: "destructive"
      });
      return false;
    }
    if (!formData.buyer_id) {
      toast({
        title: "Validation Error",
        description: "Buyer is required",
        variant: "destructive"
      });
      return false;
    }
    if (!formData.po_date) {
      toast({
        title: "Validation Error",
        description: "PO date is required",
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

    // Check if supplier was changed after items were added
    if (initialSupplierIdWhenItemsAdded.current && 
        initialSupplierIdWhenItemsAdded.current !== formData.supplier_id &&
        lines.some(line => line.item_code || line.item_name)) {
      toast({
        title: "Validation Error",
        description: "Cannot create purchase order. Supplier was changed after items were added. Please remove all line items first or create a new purchase order.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        total_amount: parseFloat(formData.total_amount),
        exchange_rate: parseFloat(formData.exchange_rate),
        supplier_id: parseInt(formData.supplier_id),
        supplier_site_id: parseInt(formData.supplier_site_id),
        buyer_id: parseInt(formData.buyer_id),
        requisition_id: formData.requisition_id && formData.requisition_id !== 'none' ? parseInt(formData.requisition_id) : null,
        agreement_id: null, // Add agreement_id (can be set if needed)
        po_date: formData.po_date || undefined, // Include po_date
        need_by_date: formData.need_by_date || undefined, // Include need_by_date
        payment_terms_id: undefined, // Will use existing value from backend if not provided
        lines: lines.map(line => ({
          line_number: line.line_number,
          item_code: line.item_code || null,
          item_name: line.item_name,
          description: line.description || null,
          category: null, // Add category field (backend expects it)
          quantity: Math.round((parseFloat(line.quantity.toString()) || 0) * 100) / 100,
          uom: line.uom,
          box_quantity: Math.round((parseFloat(line.box_quantity.toString()) || 0) * 100) / 100,
          packet_quantity: Math.round((parseFloat(line.packet_quantity.toString()) || 0) * 100) / 100,
          unit_price: Math.round((parseFloat(line.unit_price.toString()) || 0) * 100) / 100,
          line_amount: Math.round((parseFloat(line.line_amount.toString()) || 0) * 100) / 100,
          tax_rate: Math.round((parseFloat(line.tax_rate?.toString() || '0') || 0) * 100) / 100,
          tax_amount: Math.round((parseFloat(line.tax_amount?.toString() || '0') || 0) * 100) / 100,
          promised_date: null, // Add promised_date field (backend expects it)
          notes: null // Add notes field (backend expects it)
        }))
      };



      console.log('Complete payload being sent to API:', payload);
      console.log('Payload lines:', payload.lines);

      if (purchaseOrder) {
        console.log('Updating purchase order with ID:', purchaseOrder.header_id);
        await apiService.updatePurchaseOrder(purchaseOrder.header_id, payload);
        toast({
          title: "Success",
          description: "Purchase order updated successfully"
        });
      } else {
        await apiService.createPurchaseOrder(payload);
        toast({
          title: "Success",
          description: "Purchase order created successfully"
        });
      }
      
      onSave();
    } catch (error: unknown) {
      console.error('Error saving purchase order:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save purchase order";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals when lines change
  useEffect(() => {
    const subtotal = lines.reduce((sum, line) => sum + line.line_amount, 0);
    const taxAmount = lines.reduce((sum, line) => sum + line.tax_amount, 0);
    const totalAmount = subtotal + taxAmount;

    setFormData(prev => ({
      ...prev,
      total_amount: totalAmount.toString(),
    }));
  }, [lines]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" style={{ top: 0, margin: 0 }}>
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto" style={{ marginTop: 0 }}>
        <div className="p-6 border-b">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-xl font-semibold">{purchaseOrder ? 'Edit Purchase Order' : 'Create Purchase Order'}</h2>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Basic Information */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="po_number" className="text-sm">PO Number *</Label>
              <Input
                id="po_number"
                value={formData.po_number}
                onChange={(e) => handleInputChange('po_number', e.target.value)}
                placeholder="Enter PO number"
                required
                className="h-9"
              />
            </div>

            <div>
              <Label htmlFor="po_type" className="text-sm">PO Type *</Label>
              <Select value={formData.po_type} onValueChange={(value) => handleInputChange('po_type', value)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select PO type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD">Standard PO</SelectItem>
                  <SelectItem value="BLANKET_RELEASE">Blanket Release</SelectItem>
                  <SelectItem value="CONTRACT_RELEASE">Contract Release</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="po_date" className="text-sm">PO Date *</Label>
              <Input
                id="po_date"
                type="date"
                value={formData.po_date}
                onChange={(e) => handleInputChange('po_date', e.target.value)}
                required
                className="h-9"
              />
            </div>

            <div>
              <Label htmlFor="need_by_date" className="text-sm">Need By Date</Label>
              <Input
                id="need_by_date"
                type="date"
                value={formData.need_by_date}
                onChange={(e) => handleInputChange('need_by_date', e.target.value)}
                className="h-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Parties and References */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Parties & References</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="supplier_id" className="text-sm">Supplier *</Label>
              <Select value={formData.supplier_id} onValueChange={(value) => handleSupplierChange(value)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers && suppliers.length > 0 ? (
                    suppliers
                      .filter(supplier => 
                        supplier.supplier_type && 
                        supplier.supplier_type.toLowerCase() === 'vendor'
                      )
                      .map((supplier) => (
                      <SelectItem key={supplier.supplier_id} value={supplier.supplier_id.toString()}>
                        {supplier.supplier_name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-suppliers" disabled>No suppliers available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="supplier_site_id" className="text-sm">Supplier Site *</Label>
              <Select value={formData.supplier_site_id} onValueChange={(value) => handleInputChange('supplier_site_id', value)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select supplier site">
                    {(() => {
                      // If we have a selected site name, use it
                      if (selectedSiteName && formData.supplier_site_id) {
                        return selectedSiteName;
                      }
                      
                      // If we have a site name from the purchase order data, use it
                      if (purchaseOrder?.supplier_site_name && formData.supplier_site_id) {
                        return purchaseOrder.supplier_site_name;
                      }
                      
                      // Otherwise, look it up in the supplierSites array
                      if (formData.supplier_site_id && supplierSites.length > 0) {
                        const selectedSite = supplierSites.find(site => site.site_id.toString() === formData.supplier_site_id);
                        if (selectedSite) {
                          setSelectedSiteName(selectedSite.site_name);
                          return `${selectedSite.site_name}${selectedSite.is_primary ? ' (Primary)' : ''}`;
                        }
                      }
                      return 'Select supplier site';
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    if (loadingSupplierSites) {
                      return (
                        <SelectItem value="loading" disabled>
                          Loading supplier sites...
                        </SelectItem>
                      );
                    }
                    
                    if (!formData.supplier_id) {
                      return (
                        <SelectItem value="no-supplier" disabled>
                          Select a supplier first
                        </SelectItem>
                      );
                    }
                    
                    if (supplierSites && supplierSites.length > 0) {
                      return supplierSites.map((site) => {
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
                      });
                    } else {
                      return (
                        <SelectItem value="no-sites" disabled>
                          No sites available for this supplier
                        </SelectItem>
                      );
                    }
                  })()}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="buyer_id" className="text-sm">Buyer *</Label>
              <Select value={formData.buyer_id} onValueChange={(value) => handleInputChange('buyer_id', value)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select buyer" />
                </SelectTrigger>
                <SelectContent>
                  {loadingCompanies ? (
                    <SelectItem value="loading" disabled>Loading companies...</SelectItem>
                  ) : companies && companies.length > 0 ? (
                    companies.map((company) => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        {company.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-companies" disabled>No companies available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="requisition_id" className="text-sm">Requisition (Optional)</Label>
              <Select value={formData.requisition_id} onValueChange={(value) => handleInputChange('requisition_id', value)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select requisition (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Requisition</SelectItem>
                  {requisitions && requisitions.length > 0 ? (
                    requisitions.map((req) => (
                      <SelectItem key={req.requisition_id} value={req.requisition_id.toString()}>
                        {req.requisition_number} - {req.description}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-requisitions" disabled>No requisitions available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Financial Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
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
              placeholder="Enter PO description"
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

      {/* Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="status" className="text-sm">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="RELEASED">Released</SelectItem>
                  <SelectItem value="RECEIVED">Received</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
              <div key={index} className="relative space-y-3 border p-4 rounded-lg">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (lines.length > 1) {
                      const newLines = lines.filter((_, i) => i !== index);
                      const renumberedLines = newLines.map((line, i) => ({
                        ...line,
                        line_number: i + 1
                      }));
                      setLines(renumberedLines);
                    }
                  }}
                  disabled={lines.length === 1}
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
                {/* First Row */}
                <div className="grid grid-cols-12 gap-2 items-start">
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
                      onOpenChange={(open) => {
                        // Check if supplier is selected before allowing item selection
                        if (open && !formData.supplier_id) {
                          toast({
                            title: "Validation Error",
                            description: "Please select a supplier first before selecting items.",
                            variant: "destructive"
                          });
                          return;
                        }
                        setItemSearchOpen(prev => ({ ...prev, [index]: open }));
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between text-xs h-9 overflow-hidden",
                            !line.item_code && "text-muted-foreground"
                          )}
                          disabled={!formData.supplier_id}
                        >
                          <span className="truncate flex-1 text-left">{line.item_code || "Search item..."}</span>
                          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <CommandInput 
                            placeholder="Search by item code or name..." 
                            value={itemSearchValue[index] || ""}
                            onValueChange={(value) => setItemSearchValue(prev => ({ ...prev, [index]: value }))}
                          />
                          <CommandEmpty>
                            {formData.supplier_id 
                              ? "No items found for this supplier." 
                              : "Please select a supplier first to view available items."}
                          </CommandEmpty>
                          <CommandGroup>
                            {inventoryItems
                              .filter(item => {
                                // Filter by search term
                                const matchesSearch = !itemSearchValue[index] || 
                                  item.item_code?.toLowerCase().includes(itemSearchValue[index].toLowerCase()) ||
                                  item.item_name?.toLowerCase().includes(itemSearchValue[index].toLowerCase());
                                
                                // Filter by selected supplier
                                // brand field stores supplier_id as string, or we can use supplier_id field
                                const matchesSupplier = !formData.supplier_id || 
                                  (item.brand && item.brand.toString() === formData.supplier_id) ||
                                  (item.supplier_id && item.supplier_id.toString() === formData.supplier_id);
                                
                                return matchesSearch && matchesSupplier;
                              })
                              .map((item) => (
                                <CommandItem
                                  key={item.id}
                                  value={`${item.item_code} ${item.item_name}`}
                                  onSelect={() => {
                                    // Validate supplier is selected before allowing item selection
                                    if (!formData.supplier_id) {
                                      toast({
                                        title: "Validation Error",
                                        description: "Please select a supplier first before selecting items.",
                                        variant: "destructive"
                                      });
                                      setItemSearchOpen(prev => ({ ...prev, [index]: false }));
                                      return;
                                    }
                                    
                                    // Track the supplier when first item is added
                                    if (!initialSupplierIdWhenItemsAdded.current && formData.supplier_id) {
                                      initialSupplierIdWhenItemsAdded.current = formData.supplier_id;
                                    }
                                    
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
                                    if (item.uom_type) {
                                      line.uom = item.uom_type;
                                    }
                                    // Don't auto-populate box_quantity and packet_quantity - let user enter manually
                                    // line.box_quantity and line.packet_quantity remain at their default values (0)
                                    
                                    // Auto-populate tax rate from item's tax_status
                                    if (item.tax_status && taxRates.length > 0) {
                                      let taxRate = taxRates.find(rate => 
                                        rate.rate_code === item.tax_status || 
                                        rate.rate_code === item.tax_status.trim()
                                      );
                                      
                                      if (!taxRate) {
                                        taxRate = taxRates.find(rate => 
                                          rate.rate_code.toLowerCase() === item.tax_status.toLowerCase()
                                        );
                                      }
                                      
                                      if (taxRate) {
                                        line.tax_rate = taxRate.tax_percentage;
                                      }
                                    }
                                    
                                    // Recalculate line amount and tax
                                    // Calculate quantity from boxes × packets
                                    const calculatedQuantity = (line.box_quantity || 0) * (line.packet_quantity || 0);
                                    line.quantity = calculatedQuantity; // Keep quantity field for backend compatibility
                                    line.line_amount = calculatedQuantity * line.unit_price;
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
                      disabled={!!line.item_code || !formData.supplier_id}
                      className="text-xs"
                            />
                  </div>
                  <div className="col-span-1">
                    <Label className="text-xs">UOM</Label>
                            <Select 
                              value={line.uom} 
                              onValueChange={(value) => updateLine(index, 'uom', value)}
                            >
                      <SelectTrigger className="text-xs h-9">
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
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Number of Boxes</Label>
                            <Input
                              type="number"
                              min="0"
                      step="1"
                      value={line.box_quantity}
                      onChange={(e) => updateLine(index, 'box_quantity', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">
                      {line.uom === 'Bottles' ? 'Number of Bottles' : 'Number of Packets'}
                    </Label>
                            <Input
                              type="number"
                              min="0"
                      step="1"
                      value={line.packet_quantity}
                      onChange={(e) => updateLine(index, 'packet_quantity', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="text-xs"
                    />
                  </div>
                  <div className="col-span-1"></div>
                </div>

                {/* Second Row */}
                <div className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-4">
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
                  <div className="col-span-2">
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
                  <div className="col-span-4"></div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-2">
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
              <CardTitle>Purchase Order Totals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Subtotal</Label>
                  <div className="text-lg font-mono">${(lines.reduce((sum, line) => sum + (Number(line.line_amount) || 0), 0)).toFixed(2)}</div>
              </div>
                <div>
                  <Label className="text-sm font-medium">Tax Amount</Label>
                  <div className="text-lg font-mono">${(lines.reduce((sum, line) => sum + (Number(line.tax_amount) || 0), 0)).toFixed(2)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Amount</Label>
                  <div className="text-xl font-mono font-bold">${(Number(formData.total_amount) || 0).toFixed(2)}</div>
                </div>
          </div>
        </CardContent>
      </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (purchaseOrder ? "Updating..." : "Creating...") : (purchaseOrder ? "Update Purchase Order" : "Create Purchase Order")}
        </Button>
      </div>
    </form>
      </div>
    </div>
  );
}; 