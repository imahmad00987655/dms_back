import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  Eye,
  FileText,
  ShoppingCart,
  Package,
  Receipt,
  Calendar,
  DollarSign,
  User,
  Building2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  X,
  BarChart3
} from 'lucide-react';
import apiService from '../../services/api.js';
import { PurchaseAgreementForm } from '../forms/PurchaseAgreementForm';
import { PurchaseOrderForm } from '../forms/PurchaseOrderForm';
import { PurchaseRequisitionForm } from '../forms/PurchaseRequisitionForm';
import { GRNForm } from '../forms/GRNForm';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface Supplier {
  supplier_id: number;
  supplier_number: string;
  supplier_name: string;
  supplier_type?: string;
  supplier_class?: string;
  supplier_category?: string;
  party_id: number;
  status?: string;
  supplier_status?: string;
  sites_count?: number;
}

interface AgreementLine {
  line_number: number;
  item_id?: number;
  item_name: string;
  item_code?: string;
  description: string;
  category?: string;
  quantity: number;
  uom: string;
  unit_price: number;
  line_amount: number;
  tax_rate: number;
  tax_amount: number;
  gst_rate: number;
  gst_amount: number;
  max_quantity?: number;
  min_quantity?: number;
  need_by_date?: string;
  suggested_supplier?: string;
  suggested_supplier_id?: number;
  notes?: string;
}

interface POLine {
  line_number: number;
  item_id?: number;
  item_name: string;
  item_code?: string;
  description: string;
  quantity: number;
  box_quantity: number;
  packet_quantity: number;
  uom: string;
  unit_price: number;
  line_amount: number;
  tax_rate: number;
  tax_amount: number;
  gst_rate: number;
  gst_amount: number;
  quantity_received: number;
  quantity_remaining: number;
  need_by_date: string;
}

// Raw purchase order line shape coming from the backend
type RawPOLine = POLine & {
  quantity?: number | string;
  box_quantity?: number | string;
  packet_quantity?: number | string;
  unit_price?: number | string;
  line_amount?: number | string;
  tax_rate?: number | string;
  tax_amount?: number | string;
  gst_rate?: number | string;
  gst_amount?: number | string;
  quantity_received?: number | string;
  quantity_remaining?: number | string;
  need_by_date?: string | null;
};

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

interface PurchaseAgreement {
  agreement_id?: number;
  agreement_number?: string;
  agreement_type?: string;
  supplier_id?: number;
  supplier_site_id?: number; // Add missing supplier_site_id field
  supplier_name?: string;
  buyer_id?: number;
  buyer_name?: string;
  agreement_date?: string;
  effective_start_date?: string;
  effective_end_date?: string;
  currency_code?: string;
  exchange_rate?: number;
  total_amount?: number;
  amount_remaining?: number;
  description?: string;
  status?: string;
  approval_status?: string;
  lines?: AgreementLine[];
}

interface PurchaseOrder {
  header_id?: number;
  po_number?: string;
  po_type?: string;
  supplier_id?: number;
  supplier_name?: string;
  buyer_id?: number;
  requisition_id?: number;
  po_date?: string;
  need_by_date?: string;
  currency_code?: string;
  exchange_rate?: number;
  total_amount?: number;
  amount_remaining?: number;
  description?: string;
  notes?: string;
  status?: string;
  approval_status?: string;
  lines?: POLine[];
}

interface PurchaseRequisition {
  requisition_id: number;
  requisition_number: string;
  requester_id?: number;
  requester_name?: string;
  buyer_id?: number;
  department_id?: number;
  need_by_date?: string;
  urgency?: string;
  currency_code?: string;
  exchange_rate?: number;
  total_amount?: number;
  description: string;
  justification?: string;
  notes?: string;
  status?: string;
  approval_status?: string;
  requisition_date?: string;
  lines?: RequisitionLine[];
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
  // Optional tax fields if the backend provides them
  tax_rate?: number;
  tax_amount?: number;
  lot_number: string;
  serial_number: string;
  expiration_date: string;
  status: string;
  rejection_reason: string;
  notes: string;
}

// Raw GRN line shape coming from the backend
type RawGRNLine = GRNLine & {
  po_item_name?: string;
  po_quantity?: number | string;
  po_unit_price?: number | string;
};

interface GRN {
  receipt_id?: number;
  receipt_number?: string;
  header_id?: number;
  po_number?: string;
  supplier_name?: string;
  receipt_date?: string;
  receipt_type?: string;
  currency_code?: string;
  exchange_rate?: number;
  total_amount?: number;
  status?: string;
  notes?: string;
  lines?: GRNLine[];
}

type ProcurementType = 'agreements' | 'orders' | 'requisitions' | 'grns';

const ProcurementManager: React.FC = () => {
  {/*const [activeTab, setActiveTab] = useState<ProcurementType>('agreements');*/}    
  const [activeTab, setActiveTab] = useState<ProcurementType>('orders');
  const [showForm, setShowForm] = useState(false);
  const [showViewForm, setShowViewForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PurchaseAgreement | PurchaseOrder | PurchaseRequisition | GRN | null>(null);
  const [viewingItem, setViewingItem] = useState<PurchaseAgreement | PurchaseOrder | PurchaseRequisition | GRN | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  
  // Data states
  const [agreements, setAgreements] = useState<PurchaseAgreement[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [grns, setGRNs] = useState<GRN[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingOrderId, setApprovingOrderId] = useState<number | null>(null);

  // Helper function to properly handle date conversion without timezone issues
  const formatDateForForm = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    
    try {
      // If it's already a date string without time, return as is
      if (!dateString.includes('T')) {
        return dateString;
      }
      
      // Parse the date and convert to local date string to avoid timezone shifts
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString.split('T')[0] || '';
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch agreements
      const agreementsData = await apiService.getPurchaseAgreements();
      const validAgreements = Array.isArray(agreementsData) ? agreementsData.map(agreement => ({
        ...agreement,
        total_amount: typeof agreement.total_amount === 'number' ? agreement.total_amount : 
                     typeof agreement.total_amount === 'string' ? parseFloat(agreement.total_amount) || 0 : 0,
        amount_used: typeof agreement.amount_used === 'number' ? agreement.amount_used : 
                    typeof agreement.amount_used === 'string' ? parseFloat(agreement.amount_used) || 0 : 0,
        amount_remaining: typeof agreement.amount_remaining === 'number' ? agreement.amount_remaining : 
                         typeof agreement.amount_remaining === 'string' ? parseFloat(agreement.amount_remaining) || 0 : 0,
        exchange_rate: typeof agreement.exchange_rate === 'number' ? agreement.exchange_rate : 
                      typeof agreement.exchange_rate === 'string' ? parseFloat(agreement.exchange_rate) || 1.0 : 1.0
      })) : [];
      setAgreements(validAgreements);
      
      // Fetch orders
      const ordersData = await apiService.getPurchaseOrders();
      const validOrders = Array.isArray(ordersData) ? ordersData.map(order => ({
        ...order,
        total_amount: typeof order.total_amount === 'number' ? order.total_amount : 
                     typeof order.total_amount === 'string' ? parseFloat(order.total_amount) || 0 : 0
      })) : [];
      setOrders(validOrders);
      
      // Fetch requisitions
      const requisitionsData = await apiService.getPurchaseRequisitions();
      const validRequisitions = Array.isArray(requisitionsData) ? requisitionsData.map(requisition => ({
        ...requisition,
        total_amount: typeof requisition.total_amount === 'number' ? requisition.total_amount : 
                     typeof requisition.total_amount === 'string' ? parseFloat(requisition.total_amount) || 0 : 0
      })) : [];
      setRequisitions(validRequisitions);
      
      // Fetch GRNs
      const grnsData = await apiService.getGRNs();
      const validGRNs = Array.isArray(grnsData) ? grnsData.map(grn => ({
        ...grn,
        total_amount: typeof grn.total_amount === 'number' ? grn.total_amount : 
                     typeof grn.total_amount === 'string' ? parseFloat(grn.total_amount) || 0 : 0
      })) : [];
      setGRNs(validGRNs);
      
      // Fetch suppliers and parties for dropdowns
      const suppliersData = await apiService.getProcurementSuppliers();
      const validSuppliers = Array.isArray(suppliersData) ? suppliersData.filter(s => s && s.supplier_id) : [];
      setSuppliers(validSuppliers);
      
      const usersData = await apiService.getProcurementUsers();
      const validUsers = Array.isArray(usersData) ? usersData : [];
      setUsers(validUsers);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load procurement data');
      // Set empty arrays on error to prevent filter errors
      setAgreements([]);
      setOrders([]);
      setRequisitions([]);
      setGRNs([]);
      setSuppliers([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const itemType = activeTab === 'agreements' ? 'agreement' : activeTab === 'orders' ? 'purchase order' : activeTab === 'requisitions' ? 'requisition' : 'GRN';
    if (!confirm(`Are you sure you want to delete this ${itemType}?`)) return;
    
    try {
      if (activeTab === 'agreements') {
        await apiService.deletePurchaseAgreement(id);
      } else if (activeTab === 'orders') {
        await apiService.deletePurchaseOrder(id);
      } else if (activeTab === 'requisitions') {
        await apiService.deletePurchaseRequisition(id);
      } else if (activeTab === 'grns') {
        await apiService.deleteGRN(id);
      }
      fetchData();
    } catch (error) {
      console.error(`Error deleting ${itemType}:`, error);
    }
  };

  const handleApproveOrder = async (order: PurchaseOrder, approvalStatus: 'APPROVED' | 'REJECTED') => {
    if (!order.header_id) return;
    
    try {
      setApprovingOrderId(order.header_id);
      await apiService.updatePurchaseOrderStatus(order.header_id, undefined, approvalStatus);
      fetchData();
    } catch (error) {
      console.error('Error updating purchase order approval status:', error);
    } finally {
      setApprovingOrderId(null);
    }
  };

  const handleView = async (item: PurchaseAgreement | PurchaseOrder | PurchaseRequisition | GRN) => {
    // Transform the data to match the form's expected structure (same as edit)
    if (activeTab === 'agreements') {
      const agreementItem = item as PurchaseAgreement;
      
      // Fetch the complete agreement data including description and lines
      try {
        console.log('Fetching full agreement data for viewing ID:', agreementItem.agreement_id);
        const fullAgreement = await apiService.getPurchaseAgreement(agreementItem.agreement_id);
        console.log('Full agreement data for viewing:', fullAgreement);
        
        console.log('Fetching agreement lines for viewing ID:', agreementItem.agreement_id);
        const agreementLines = await apiService.getAgreementLines(agreementItem.agreement_id);
        console.log('Agreement lines data for viewing:', agreementLines);
        
        // Debug: Check the first line's need_by_date format
        if (Array.isArray(agreementLines) && agreementLines.length > 0) {
          console.log('First line need_by_date for viewing:', agreementLines[0].need_by_date);
          console.log('First line need_by_date type for viewing:', typeof agreementLines[0].need_by_date);
          console.log('First line need_by_date === null for viewing:', agreementLines[0].need_by_date === null);
          console.log('First line need_by_date === "null" for viewing:', agreementLines[0].need_by_date === 'null');
        }
        
        // Transform line items to match form expectations
        const transformedLines = Array.isArray(agreementLines) ? agreementLines.map(line => ({
          line_number: line.line_number,
          item_id: line.item_id,
          item_name: line.item_name || '',
          item_code: line.item_code || '',
          description: line.description || '',
          category: line.category || '',
          quantity: typeof line.quantity === 'number' ? line.quantity : parseFloat(line.quantity) || 1,
          uom: line.uom === 'EACH' ? 'EA' : line.uom || 'EA',
          unit_price: typeof line.unit_price === 'number' ? line.unit_price : parseFloat(line.unit_price) || 0,
          line_amount: typeof line.line_amount === 'number' ? line.line_amount : parseFloat(line.line_amount) || 0,
          max_quantity: line.max_quantity ? (typeof line.max_quantity === 'number' ? line.max_quantity : parseFloat(line.max_quantity)) : undefined,
          min_quantity: line.min_quantity ? (typeof line.min_quantity === 'number' ? line.min_quantity : parseFloat(line.min_quantity)) : undefined,
          need_by_date: line.need_by_date && line.need_by_date !== 'null' ? 
            (typeof line.need_by_date === 'string' ? 
              (line.need_by_date.includes('T') ? line.need_by_date.split('T')[0] : line.need_by_date) : 
              new Date(line.need_by_date).toISOString().split('T')[0]
            ) : '',
          suggested_supplier: line.suggested_supplier || '',
          suggested_supplier_id: line.suggested_supplier_id,
          notes: line.notes || ''
        })) : [];
        
        console.log('Transformed lines for viewing:', transformedLines);
        
        const transformedItem = {
          agreement_id: fullAgreement.agreement_id || agreementItem.agreement_id,
          agreement_number: fullAgreement.agreement_number || agreementItem.agreement_number,
          agreement_type: fullAgreement.agreement_type || agreementItem.agreement_type || 'Contract',
          supplier_id: fullAgreement.supplier_id || agreementItem.supplier_id,
          buyer_id: fullAgreement.buyer_id || agreementItem.buyer_id,
          agreement_date: formatDateForForm(fullAgreement.agreement_date || agreementItem.agreement_date),
          effective_start_date: formatDateForForm(fullAgreement.effective_start_date || agreementItem.effective_start_date),
          effective_end_date: formatDateForForm(fullAgreement.effective_end_date || agreementItem.effective_end_date),
          currency_code: fullAgreement.currency_code || agreementItem.currency_code,
          exchange_rate: fullAgreement.exchange_rate || agreementItem.exchange_rate || 1.0,
          total_amount: fullAgreement.total_amount || agreementItem.total_amount,
          amount_remaining: fullAgreement.amount_remaining || agreementItem.amount_remaining || agreementItem.total_amount,
          description: fullAgreement.description || agreementItem.description || 'Sample agreement description for testing',
          status: fullAgreement.status || agreementItem.status,
          approval_status: fullAgreement.approval_status || agreementItem.approval_status || 'Approved',
          lines: transformedLines || [
            // Sample line item for testing
            {
              line_number: 1,
              item_id: 1,
              item_name: 'Sample Agreement Item',
              item_code: 'ITEM001',
              description: 'Sample agreement item description',
              quantity: 1,
              uom: 'EA',
              unit_price: 100,
              line_amount: 100,
              max_quantity: 10,
              min_quantity: 1,
              need_by_date: '',
              suggested_supplier: 'Sample Supplier',
              suggested_supplier_id: 1,
              notes: 'Sample notes'
            }
          ]
        };
        setViewingItem(transformedItem as unknown as PurchaseAgreement | PurchaseOrder | PurchaseRequisition);
      } catch (error) {
        console.error('Error fetching full agreement data for viewing:', error);
        // Fallback to basic data if API call fails
        const transformedItem = {
          agreement_id: agreementItem.agreement_id,
          agreement_number: agreementItem.agreement_number,
          agreement_type: agreementItem.agreement_type || 'Contract',
          supplier_id: agreementItem.supplier_id,
          buyer_id: agreementItem.buyer_id,
          agreement_date: formatDateForForm(agreementItem.agreement_date),
          effective_start_date: formatDateForForm(agreementItem.effective_start_date),
          effective_end_date: formatDateForForm(agreementItem.effective_end_date),
          currency_code: agreementItem.currency_code,
          exchange_rate: agreementItem.exchange_rate || 1.0,
          total_amount: agreementItem.total_amount,
          amount_remaining: agreementItem.amount_remaining || agreementItem.total_amount,
          description: agreementItem.description || 'Sample agreement description for testing',
          status: agreementItem.status,
          approval_status: agreementItem.approval_status || 'Approved',
          lines: [
            // Sample line item for testing
            {
              line_number: 1,
              item_id: 1,
              item_name: 'Sample Agreement Item',
              item_code: 'ITEM001',
              description: 'Sample agreement item description',
              quantity: 1,
              uom: 'EA',
              unit_price: 100,
              line_amount: 100,
              max_quantity: 10,
              min_quantity: 1,
              need_by_date: '',
              suggested_supplier: 'Sample Supplier',
              suggested_supplier_id: 1,
              notes: 'Sample notes'
            }
          ]
        };
        setViewingItem(transformedItem as unknown as PurchaseAgreement | PurchaseOrder | PurchaseRequisition);
      }
    } else if (activeTab === 'orders') {
      const orderItem = item as PurchaseOrder;
      try {
        if (!orderItem.header_id) {
          setViewingItem(orderItem);
        } else {
          const fullOrder = await apiService.getPurchaseOrder(orderItem.header_id);

          const transformedLines: POLine[] = Array.isArray(fullOrder.lines)
            ? (fullOrder.lines as RawPOLine[]).map((line) => ({
                line_number: line.line_number,
                item_id: line.item_id,
                item_name: line.item_name || '',
                item_code: line.item_code || '',
                description: line.description || '',
                quantity:
                  typeof line.quantity === 'number'
                    ? line.quantity
                    : parseFloat(String(line.quantity)) || 0,
                box_quantity:
                  typeof line.box_quantity === 'number'
                    ? line.box_quantity
                    : parseFloat(String(line.box_quantity)) || 0,
                packet_quantity:
                  typeof line.packet_quantity === 'number'
                    ? line.packet_quantity
                    : parseFloat(String(line.packet_quantity)) || 0,
                uom: line.uom || 'PCS',
                unit_price:
                  typeof line.unit_price === 'number'
                    ? line.unit_price
                    : parseFloat(String(line.unit_price)) || 0,
                line_amount:
                  typeof line.line_amount === 'number'
                    ? line.line_amount
                    : parseFloat(String(line.line_amount)) || 0,
                tax_rate:
                  typeof line.tax_rate === 'number'
                    ? line.tax_rate
                    : line.tax_rate !== undefined
                    ? parseFloat(String(line.tax_rate)) || 0
                    : 0,
                tax_amount:
                  typeof line.tax_amount === 'number'
                    ? line.tax_amount
                    : line.tax_amount !== undefined
                    ? parseFloat(String(line.tax_amount)) || 0
                    : 0,
                gst_rate:
                  typeof line.gst_rate === 'number'
                    ? line.gst_rate
                    : line.gst_rate !== undefined
                    ? parseFloat(String(line.gst_rate)) || 0
                    : 0,
                gst_amount:
                  typeof line.gst_amount === 'number'
                    ? line.gst_amount
                    : line.gst_amount !== undefined
                    ? parseFloat(String(line.gst_amount)) || 0
                    : 0,
                quantity_received:
                  typeof line.quantity_received === 'number'
                    ? line.quantity_received
                    : parseFloat(String(line.quantity_received)) || 0,
                quantity_remaining:
                  typeof line.quantity_remaining === 'number'
                    ? line.quantity_remaining
                    : parseFloat(String(line.quantity_remaining)) || 0,
                need_by_date:
                  line.need_by_date && line.need_by_date !== 'null'
                    ? (typeof line.need_by_date === 'string'
                        ? (line.need_by_date.includes('T')
                            ? line.need_by_date.split('T')[0]
                            : line.need_by_date)
                        : new Date(line.need_by_date).toISOString().split('T')[0])
                    : '',
              }))
            : [];

          const transformedOrder: PurchaseOrder = {
            header_id: fullOrder.header_id || orderItem.header_id,
            po_number: fullOrder.po_number || orderItem.po_number,
            po_type: fullOrder.po_type || orderItem.po_type || 'STANDARD',
            supplier_id: fullOrder.supplier_id || orderItem.supplier_id,
            supplier_name: fullOrder.supplier_name || orderItem.supplier_name,
            buyer_id: fullOrder.buyer_id || orderItem.buyer_id,
            requisition_id: fullOrder.requisition_id || orderItem.requisition_id,
            po_date: formatDateForForm(fullOrder.po_date || orderItem.po_date),
            need_by_date: formatDateForForm(fullOrder.need_by_date || orderItem.need_by_date),
            currency_code: fullOrder.currency_code || orderItem.currency_code || 'USD',
            exchange_rate:
              typeof fullOrder.exchange_rate === 'number'
                ? fullOrder.exchange_rate
                : typeof fullOrder.exchange_rate === 'string'
                ? parseFloat(fullOrder.exchange_rate || '1.0') || orderItem.exchange_rate || 1.0
                : orderItem.exchange_rate || 1.0,
            total_amount:
              typeof fullOrder.total_amount === 'number'
                ? fullOrder.total_amount
                : typeof fullOrder.total_amount === 'string'
                ? parseFloat(fullOrder.total_amount || '0') || orderItem.total_amount || 0
                : orderItem.total_amount || 0,
            amount_remaining:
              typeof fullOrder.amount_remaining === 'number'
                ? fullOrder.amount_remaining
                : typeof fullOrder.amount_remaining === 'string'
                ? parseFloat(fullOrder.amount_remaining || '0') || orderItem.amount_remaining
                : orderItem.amount_remaining,
            description: fullOrder.description || orderItem.description,
            notes: fullOrder.notes || orderItem.notes,
            status: fullOrder.status || orderItem.status,
            approval_status: fullOrder.approval_status || orderItem.approval_status,
            lines: transformedLines,
          };

          setViewingItem(transformedOrder as unknown as PurchaseAgreement | PurchaseOrder | PurchaseRequisition | GRN);
        }
      } catch (error) {
        console.error('Error fetching full purchase order data for view:', error);
        setViewingItem(orderItem);
      }
    } else if (activeTab === 'requisitions') {
      const requisitionItem = item as PurchaseRequisition;
      const transformedItem = {
        requisition_id: requisitionItem.requisition_id,
        requisition_number: requisitionItem.requisition_number,
        requester_id: requisitionItem.requester_id,
        buyer_id: undefined, // Not in original data
        department_id: undefined, // Not in original data
        need_by_date: requisitionItem.need_by_date,
        urgency: 'MEDIUM', // Default value since not in original data
        currency_code: 'USD', // Default value since not in original data
        exchange_rate: 1.0, // Default value since not in original data
        total_amount: requisitionItem.total_amount,
        description: requisitionItem.description || 'Sample requisition description for testing',
        justification: 'Sample justification for testing', // Not in original data
        notes: 'Sample notes for testing', // Not in original data
        status: requisitionItem.status,
        approval_status: 'PENDING', // Default value since not in original data
        lines: [
          // Sample line item for testing
          {
            line_number: 1,
            item_id: 1,
            item_name: 'Sample Item',
            item_code: 'ITEM001',
            description: 'Sample item description',
            quantity: 1,
            uom: 'EA',
            unit_price: 100,
            line_amount: 100,
            need_by_date: '',
            suggested_supplier: 'Sample Supplier'
          }
        ]
      };
      setViewingItem(transformedItem as unknown as PurchaseAgreement | PurchaseOrder | PurchaseRequisition);
    } else if (activeTab === 'grns') {
      const grnItem = item as GRN;
      try {
        if (!grnItem.receipt_id) {
          setViewingItem(grnItem);
        } else {
          const fullGRN = await apiService.getGRN(grnItem.receipt_id);

          const transformedLines: GRNLine[] = Array.isArray(fullGRN.lines)
            ? fullGRN.lines.map((line: RawGRNLine) => ({
                line_id: line.line_id,
                line_number: line.line_number,
                item_code: line.item_code || '',
                item_name: line.item_name || line.po_item_name || '',
                description: line.description || '',
                uom: line.uom || 'EA',
                quantity_ordered:
                  typeof line.quantity_ordered === 'number'
                    ? line.quantity_ordered
                    : parseFloat(line.quantity_ordered) || 0,
                quantity_received:
                  typeof line.quantity_received === 'number'
                    ? line.quantity_received
                    : parseFloat(line.quantity_received) || 0,
                quantity_accepted:
                  typeof line.quantity_accepted === 'number'
                    ? line.quantity_accepted
                    : parseFloat(line.quantity_accepted) || 0,
                quantity_rejected:
                  typeof line.quantity_rejected === 'number'
                    ? line.quantity_rejected
                    : parseFloat(line.quantity_rejected) || 0,
                unit_price:
                  typeof line.unit_price === 'number'
                    ? line.unit_price
                    : parseFloat(line.unit_price) || 0,
                line_amount:
                  typeof line.line_amount === 'number'
                    ? line.line_amount
                    : parseFloat(line.line_amount) || 0,
                // Map optional tax fields if present so we can show tax in GRN view
                tax_rate:
                  typeof line.tax_rate === 'number'
                    ? line.tax_rate
                    : line.tax_rate !== undefined
                    ? parseFloat(String(line.tax_rate)) || 0
                    : undefined,
                tax_amount:
                  typeof line.tax_amount === 'number'
                    ? line.tax_amount
                    : line.tax_amount !== undefined
                    ? parseFloat(String(line.tax_amount)) || 0
                    : undefined,
                lot_number: line.lot_number || '',
                serial_number: line.serial_number || '',
                expiration_date: formatDateForForm(line.expiration_date),
                status: line.status || 'DRAFT',
                rejection_reason: line.rejection_reason || '',
                notes: line.notes || '',
              }))
            : [];

          const transformedGRN: GRN = {
            receipt_id: fullGRN.receipt_id || grnItem.receipt_id,
            receipt_number: fullGRN.receipt_number || grnItem.receipt_number,
            header_id: fullGRN.header_id || grnItem.header_id,
            po_number: fullGRN.po_number || grnItem.po_number,
            supplier_name: fullGRN.supplier_name || grnItem.supplier_name,
            receipt_date: formatDateForForm(fullGRN.receipt_date || grnItem.receipt_date),
            receipt_type: fullGRN.receipt_type || grnItem.receipt_type || 'STANDARD',
            currency_code: fullGRN.currency_code || grnItem.currency_code || 'USD',
            exchange_rate: fullGRN.exchange_rate || grnItem.exchange_rate || 1.0,
            total_amount: fullGRN.total_amount || grnItem.total_amount || 0,
            status: fullGRN.status || grnItem.status || 'DRAFT',
            notes: fullGRN.notes || grnItem.notes || '',
            lines: transformedLines,
          };

          setViewingItem(transformedGRN);
        }
      } catch (error) {
        console.error('Error fetching full GRN data for view:', error);
        setViewingItem(grnItem);
      }
    } else {
      setViewingItem(item);
    }
    setShowViewForm(true);
  };

  const handleEdit = async (item: PurchaseAgreement | PurchaseOrder | PurchaseRequisition | GRN) => {
    // Clear any existing editing state first
    setEditingItem(null);
    
    // Transform the data to match the form's expected structure
    if (activeTab === 'agreements') {
      const agreementItem = item as PurchaseAgreement;
      
      // Fetch the complete agreement data including description and lines
      try {
        console.log('Fetching full agreement data for ID:', agreementItem.agreement_id);
        const fullAgreement = await apiService.getPurchaseAgreement(agreementItem.agreement_id);
        console.log('Full agreement data:', fullAgreement);
        
        console.log('Fetching agreement lines for ID:', agreementItem.agreement_id);
        const agreementLines = await apiService.getAgreementLines(agreementItem.agreement_id);
        console.log('Agreement lines data:', agreementLines);
        
        // Debug: Check the first line's need_by_date format
        if (Array.isArray(agreementLines) && agreementLines.length > 0) {
          console.log('First line need_by_date:', agreementLines[0].need_by_date);
          console.log('First line need_by_date type:', typeof agreementLines[0].need_by_date);
          console.log('First line need_by_date === null:', agreementLines[0].need_by_date === null);
          console.log('First line need_by_date === "null":', agreementLines[0].need_by_date === 'null');
        }
        
        // Transform line items to match form expectations
        const transformedLines = Array.isArray(agreementLines) ? agreementLines.map(line => ({
          line_number: line.line_number,
          item_id: line.item_id,
          item_name: line.item_name || '',
          item_code: line.item_code || '',
          description: line.description || '',
          category: line.category || '',
          quantity: typeof line.quantity === 'number' ? line.quantity : parseFloat(line.quantity) || 1,
          uom: line.uom === 'EACH' ? 'EA' : line.uom || 'EA',
          unit_price: typeof line.unit_price === 'number' ? line.unit_price : parseFloat(line.unit_price) || 0,
          line_amount: typeof line.line_amount === 'number' ? line.line_amount : parseFloat(line.line_amount) || 0,
          max_quantity: line.max_quantity ? (typeof line.max_quantity === 'number' ? line.max_quantity : parseFloat(line.max_quantity)) : undefined,
          min_quantity: line.min_quantity ? (typeof line.min_quantity === 'number' ? line.min_quantity : parseFloat(line.min_quantity)) : undefined,
          need_by_date: line.need_by_date && line.need_by_date !== 'null' ? 
            (typeof line.need_by_date === 'string' ? 
              (line.need_by_date.includes('T') ? line.need_by_date.split('T')[0] : line.need_by_date) : 
              new Date(line.need_by_date).toISOString().split('T')[0]
            ) : '',
          suggested_supplier: line.suggested_supplier || '',
          suggested_supplier_id: line.suggested_supplier_id,
          notes: line.notes || ''
        })) : [];
        
        console.log('Transformed lines:', transformedLines);
        
        const transformedItem = {
          agreement_id: fullAgreement.agreement_id || agreementItem.agreement_id,
          agreement_number: fullAgreement.agreement_number || agreementItem.agreement_number,
          agreement_type: fullAgreement.agreement_type || agreementItem.agreement_type || 'Contract',
          supplier_id: fullAgreement.supplier_id || agreementItem.supplier_id,
          supplier_site_id: fullAgreement.supplier_site_id || agreementItem.supplier_site_id, // Add missing supplier_site_id
          buyer_id: fullAgreement.buyer_id || agreementItem.buyer_id,
          agreement_date: formatDateForForm(fullAgreement.agreement_date || agreementItem.agreement_date),
          effective_start_date: formatDateForForm(fullAgreement.effective_start_date || agreementItem.effective_start_date),
          effective_end_date: formatDateForForm(fullAgreement.effective_end_date || agreementItem.effective_end_date),
          currency_code: fullAgreement.currency_code || agreementItem.currency_code,
          exchange_rate: fullAgreement.exchange_rate || agreementItem.exchange_rate || 1.0,
          total_amount: fullAgreement.total_amount || agreementItem.total_amount,
          amount_remaining: fullAgreement.amount_remaining || agreementItem.amount_remaining || agreementItem.total_amount,
          description: fullAgreement.description || agreementItem.description || 'Sample agreement description for testing',
          status: fullAgreement.status || agreementItem.status,
          approval_status: fullAgreement.approval_status || agreementItem.approval_status || 'Approved',
          lines: transformedLines || [
            // Sample line item for testing
            {
              line_number: 1,
              item_id: 1,
              item_name: 'Sample Agreement Item',
              item_code: 'ITEM001',
              description: 'Sample agreement item description',
              quantity: 1,
              uom: 'EA',
              unit_price: 100,
              line_amount: 100,
              max_quantity: 10,
              min_quantity: 1,
              need_by_date: '',
              suggested_supplier: 'Sample Supplier',
              suggested_supplier_id: 1,
              notes: 'Sample notes'
            }
          ]
        };
        setEditingItem(transformedItem as unknown as PurchaseAgreement | PurchaseOrder | PurchaseRequisition);
      } catch (error) {
        console.error('Error fetching full agreement data:', error);
        // Fallback to basic data if API call fails
        const transformedItem = {
          agreement_id: agreementItem.agreement_id,
          agreement_number: agreementItem.agreement_number,
          agreement_type: agreementItem.agreement_type || 'Contract',
          supplier_id: agreementItem.supplier_id,
          supplier_site_id: agreementItem.supplier_site_id, // Add missing supplier_site_id
          buyer_id: agreementItem.buyer_id,
          agreement_date: formatDateForForm(agreementItem.agreement_date),
          effective_start_date: formatDateForForm(agreementItem.effective_start_date),
          effective_end_date: formatDateForForm(agreementItem.effective_end_date),
          currency_code: agreementItem.currency_code,
          exchange_rate: agreementItem.exchange_rate || 1.0,
          total_amount: agreementItem.total_amount,
          amount_remaining: agreementItem.amount_remaining || agreementItem.total_amount,
          description: agreementItem.description || 'Sample agreement description for testing',
          status: agreementItem.status,
          approval_status: agreementItem.approval_status || 'Approved',
          lines: [
            // Sample line item for testing
            {
              line_number: 1,
              item_id: 1,
              item_name: 'Sample Agreement Item',
              item_code: 'ITEM001',
              description: 'Sample agreement item description',
              quantity: 1,
              uom: 'EA',
              unit_price: 100,
              line_amount: 100,
              max_quantity: 10,
              min_quantity: 1,
              need_by_date: '',
              suggested_supplier: 'Sample Supplier',
              suggested_supplier_id: 1,
              notes: 'Sample notes'
            }
          ]
        };
        setEditingItem(transformedItem as unknown as PurchaseAgreement | PurchaseOrder | PurchaseRequisition);
      }
    } else if (activeTab === 'orders') {
      const orderItem = item as PurchaseOrder;
      
      // Fetch the complete purchase order data including lines
      try {
        const fullOrder = await apiService.getPurchaseOrder(orderItem.header_id);
        
        // Transform the data to match form expectations
        const transformedItem = {
          header_id: fullOrder.header_id || orderItem.header_id,
          po_number: fullOrder.po_number || orderItem.po_number,
          po_type: fullOrder.po_type || orderItem.po_type || 'STANDARD',
          supplier_id: fullOrder.supplier_id || orderItem.supplier_id,
          supplier_site_id: (fullOrder as Record<string, unknown>).supplier_site_id || (orderItem as Record<string, unknown>).supplier_site_id,
          supplier_site_name: (fullOrder as Record<string, unknown>).supplier_site_name || (orderItem as Record<string, unknown>).supplier_site_name,
          party_id: (fullOrder as Record<string, unknown>).party_id || (orderItem as Record<string, unknown>).party_id,
          buyer_id: fullOrder.buyer_id || orderItem.buyer_id,
          requisition_id: fullOrder.requisition_id || orderItem.requisition_id,
          po_date: formatDateForForm(fullOrder.po_date || orderItem.po_date),
          need_by_date: formatDateForForm(fullOrder.need_by_date || orderItem.need_by_date),
          currency_code: fullOrder.currency_code || orderItem.currency_code || 'USD',
          exchange_rate: fullOrder.exchange_rate || orderItem.exchange_rate || 1.0,
          total_amount: fullOrder.total_amount || orderItem.total_amount || 0,
          amount_remaining: fullOrder.amount_remaining || orderItem.amount_remaining || fullOrder.total_amount || orderItem.total_amount || 0,
          description: fullOrder.description || orderItem.description || '',
          notes: fullOrder.notes || orderItem.notes || '',
          status: fullOrder.status || orderItem.status || 'DRAFT',
          approval_status: fullOrder.approval_status || orderItem.approval_status || 'PENDING',
          lines: fullOrder.lines || []
        };
        
        setEditingItem(transformedItem as unknown as PurchaseAgreement | PurchaseOrder | PurchaseRequisition);
      } catch (error) {
        console.error('Error fetching full purchase order data:', error);
        // Fallback to basic data if API call fails
        const transformedItem = {
          header_id: orderItem.header_id,
          po_number: orderItem.po_number,
          po_type: orderItem.po_type || 'STANDARD',
          supplier_id: orderItem.supplier_id,
          supplier_site_id: (orderItem as Record<string, unknown>).supplier_site_id,
          party_id: (orderItem as Record<string, unknown>).party_id,
          buyer_id: orderItem.buyer_id,
          requisition_id: orderItem.requisition_id,
          po_date: formatDateForForm(orderItem.po_date),
          need_by_date: formatDateForForm(orderItem.need_by_date),
          currency_code: orderItem.currency_code || 'USD',
          exchange_rate: orderItem.exchange_rate || 1.0,
          total_amount: orderItem.total_amount || 0,
          amount_remaining: orderItem.amount_remaining || orderItem.total_amount || 0,
          description: orderItem.description || '',
          notes: orderItem.notes || '',
          status: orderItem.status || 'DRAFT',
          approval_status: orderItem.approval_status || 'PENDING',
          lines: []
        };
        setEditingItem(transformedItem as unknown as PurchaseAgreement | PurchaseOrder | PurchaseRequisition);
      }
    } else if (activeTab === 'requisitions') {
      const requisitionItem = item as PurchaseRequisition;
      const transformedItem = {
        requisition_id: requisitionItem.requisition_id,
        requisition_number: requisitionItem.requisition_number,
        requester_id: requisitionItem.requester_id,
        buyer_id: undefined, // Not in original data
        department_id: undefined, // Not in original data
        need_by_date: requisitionItem.need_by_date,
        urgency: 'MEDIUM', // Default value since not in original data
        currency_code: 'USD', // Default value since not in original data
        exchange_rate: 1.0, // Default value since not in original data
        total_amount: requisitionItem.total_amount,
        description: requisitionItem.description || 'Sample requisition description for testing',
        justification: 'Sample justification for testing', // Not in original data
        notes: 'Sample notes for testing', // Not in original data
        status: requisitionItem.status,
        approval_status: 'PENDING', // Default value since not in original data
        lines: [
          // Sample line item for testing
          {
            line_number: 1,
            item_id: 1,
            item_name: 'Sample Item',
            item_code: 'ITEM001',
            description: 'Sample item description',
            quantity: 1,
            uom: 'EA',
            unit_price: 100,
            line_amount: 100,
            need_by_date: '',
            suggested_supplier: 'Sample Supplier'
          }
        ]
      };
      setEditingItem(transformedItem as unknown as PurchaseAgreement | PurchaseOrder | PurchaseRequisition);
    } else if (activeTab === 'grns') {
      const grnItem = item as GRN;
      try {
        // Fetch full GRN details including lines
        if (!grnItem.receipt_id) {
          setEditingItem(grnItem);
        } else {
          const fullGRN = await apiService.getGRN(grnItem.receipt_id);

          // Transform lines to match GRNForm expectations
          const transformedLines: GRNLine[] = Array.isArray(fullGRN.lines)
            ? fullGRN.lines.map((line: RawGRNLine) => ({
                line_id: line.line_id,
                line_number: line.line_number,
                item_code: line.item_code || '',
                item_name: line.item_name || line.po_item_name || '',
                description: line.description || '',
                uom: line.uom || 'EA',
                quantity_ordered:
                  typeof line.quantity_ordered === 'number'
                    ? line.quantity_ordered
                    : parseFloat(line.quantity_ordered) || 0,
                quantity_received:
                  typeof line.quantity_received === 'number'
                    ? line.quantity_received
                    : parseFloat(line.quantity_received) || 0,
                quantity_accepted:
                  typeof line.quantity_accepted === 'number'
                    ? line.quantity_accepted
                    : parseFloat(line.quantity_accepted) || 0,
                quantity_rejected:
                  typeof line.quantity_rejected === 'number'
                    ? line.quantity_rejected
                    : parseFloat(line.quantity_rejected) || 0,
                unit_price:
                  typeof line.unit_price === 'number'
                    ? line.unit_price
                    : parseFloat(line.unit_price) || 0,
                line_amount:
                  typeof line.line_amount === 'number'
                    ? line.line_amount
                    : parseFloat(line.line_amount) || 0,
                // Preserve tax fields for editing if present
                tax_rate:
                  typeof line.tax_rate === 'number'
                    ? line.tax_rate
                    : line.tax_rate !== undefined
                    ? parseFloat(String(line.tax_rate)) || 0
                    : undefined,
                tax_amount:
                  typeof line.tax_amount === 'number'
                    ? line.tax_amount
                    : line.tax_amount !== undefined
                    ? parseFloat(String(line.tax_amount)) || 0
                    : undefined,
                lot_number: line.lot_number || '',
                serial_number: line.serial_number || '',
                expiration_date: formatDateForForm(line.expiration_date),
                status: line.status || 'DRAFT',
                rejection_reason: line.rejection_reason || '',
                notes: line.notes || '',
              }))
            : [];

          const transformedGRN: GRN = {
            receipt_id: fullGRN.receipt_id || grnItem.receipt_id,
            receipt_number: fullGRN.receipt_number || grnItem.receipt_number,
            header_id: fullGRN.header_id || grnItem.header_id,
            po_number: fullGRN.po_number || grnItem.po_number,
            supplier_name: fullGRN.supplier_name || grnItem.supplier_name,
            receipt_date: formatDateForForm(fullGRN.receipt_date || grnItem.receipt_date),
            receipt_type: fullGRN.receipt_type || grnItem.receipt_type || 'STANDARD',
            currency_code: fullGRN.currency_code || grnItem.currency_code || 'USD',
            exchange_rate: fullGRN.exchange_rate || grnItem.exchange_rate || 1.0,
            total_amount: fullGRN.total_amount || grnItem.total_amount || 0,
            status: fullGRN.status || grnItem.status || 'DRAFT',
            notes: fullGRN.notes || grnItem.notes || '',
            lines: transformedLines,
          };

          setEditingItem(transformedGRN);
        }
      } catch (error) {
        console.error('Error fetching full GRN data:', error);
        // Fallback to basic header-only data if full fetch fails
        setEditingItem(grnItem);
      }
    } else {
      setEditingItem(item);
    }
    setShowForm(true);
  };

  const resetForms = () => {
    // Clear all form-related state
    setEditingItem(null);
    setViewingItem(null);
    setShowForm(false);
    setShowViewForm(false);
  };

  const handleTabChange = (value: string) => {
    // Clear any open forms when switching tabs
    resetForms();
    setActiveTab(value as ProcurementType);
  };

  const getStatusBadge = (status?: string) => {
    if (!status) {
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Unknown</Badge>;
    }
    switch (status.toLowerCase()) {
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Draft</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case 'approved':
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case 'released':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Released</Badge>;
      case 'received':
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Received</Badge>;
      case 'closed':
        return <Badge className="bg-gray-200 text-gray-900 hover:bg-gray-200">Closed</Badge>;
      case 'rejected':
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{status}</Badge>;
    }
  };

  const getFilteredAgreements = () => {
    if (!Array.isArray(agreements)) return [];
    
    return agreements.filter(agreement => {
      const matchesSearch = agreement.agreement_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          agreement.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || agreement.status?.toLowerCase() === statusFilter.toLowerCase();
      const matchesSupplier = supplierFilter === 'all' || agreement.supplier_id?.toString() === supplierFilter;
      
      return matchesSearch && matchesStatus && matchesSupplier;
    });
  };

  // Ensure suppliers array is safe to map
  const safeSuppliers = Array.isArray(suppliers) ? suppliers.filter(s => s && s.supplier_id) : [];

  const getFilteredOrders = () => {
    if (!Array.isArray(orders)) return [];
    
    return orders.filter(order => {
      const matchesSearch = order.po_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || order.status?.toLowerCase() === statusFilter.toLowerCase();
      const matchesSupplier = supplierFilter === 'all' || order.supplier_id?.toString() === supplierFilter;
      
      return matchesSearch && matchesStatus && matchesSupplier;
    });
  };

  const getFilteredRequisitions = () => {
    if (!Array.isArray(requisitions)) return [];
    
    return requisitions.filter(requisition => {
      const matchesSearch = requisition.requisition_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          requisition.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || requisition.status?.toLowerCase() === statusFilter.toLowerCase();
      
      return matchesSearch && matchesStatus;
    });
  };

  const getFilteredGRNs = () => {
    if (!Array.isArray(grns)) return [];
    
    return grns.filter(grn => {
      const matchesSearch = grn.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          grn.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || grn.status?.toLowerCase() === statusFilter.toLowerCase();
      
      return matchesSearch && matchesStatus;
    });
  };

  const filteredAgreements = getFilteredAgreements();
  const filteredOrders = getFilteredOrders();
  const filteredRequisitions = getFilteredRequisitions();
  const filteredGRNs = getFilteredGRNs();

  // Add loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">Loading procurement data...</div>
        </div>
      </div>
    );
  }

  // Add error boundary for rendering
  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">Error loading procurement data: {error}</div>
          <Button onClick={fetchData} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Procurement Management</h1>
          <p className="text-gray-500 mt-1">Manage purchase agreements, orders, and requisitions</p>
        </div>
      </div>

        {/* Summary Cards */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
         {/* Temporarily hidden Total Agreements card */}
         {/* <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Total Agreements</CardTitle>
             <FileText className="w-4 h-4 text-gray-600" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{agreements.length}</div>
             <p className="text-xs text-gray-500 mt-1">Active purchase agreements</p>
           </CardContent>
         </Card> */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-gray-500 mt-1">Purchase orders created</p>
          </CardContent>
        </Card>
         {/* Temporarily hidden Total Requisitions card */}
         {/* <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Total Requisitions</CardTitle>
             <Receipt className="w-4 h-4 text-gray-600" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{requisitions.length}</div>
             <p className="text-xs text-gray-500 mt-1">Purchase requisitions</p>
           </CardContent>
         </Card> */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total GRNs</CardTitle>
            <Package className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{grns.length}</div>
            <p className="text-xs text-gray-500 mt-1">Goods received notes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
            <Building2 className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(suppliers) ? suppliers.length : 0}</div>
            <p className="text-xs text-gray-500 mt-1">Active suppliers</p>
          </CardContent>
        </Card>
      </div>

      {/*<Tabs defaultValue="agreements" value={activeTab} onValueChange={handleTabChange} className="space-y-6">*/}
      <Tabs defaultValue="orders" value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          {/*<TabsTrigger value="agreements" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Purchase Agreements
          </TabsTrigger>*/}
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Purchase Orders
          </TabsTrigger>
          {/*<TabsTrigger value="requisitions" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Purchase Requisitions
          </TabsTrigger>*/}   
          <TabsTrigger value="grns" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Goods Received Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agreements">
          <div className="flex justify-end mb-4 gap-2">
            <Button 
              variant="outline" 
              onClick={() => {/* Export functionality */}}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button 
              onClick={() => {
                setActiveTab('agreements');
                setShowForm(true);
                setEditingItem(null);
              }}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Create Agreement
            </Button>
          </div>
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search agreements or suppliers..."
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
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Suppliers</SelectItem>
                      {suppliers.map(supplier => (
                        <SelectItem key={supplier.supplier_id} value={supplier.supplier_id.toString()}>
                          {supplier.supplier_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Purchase Agreements</h3>
                <p className="text-sm text-gray-500">
                  Showing {filteredAgreements.length} of {agreements.length} agreements
                </p>
              </div>
              {loading ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Loading agreements...</div>
                </div>
              ) : agreements.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">No agreements found</div>
                  <Button 
                    onClick={() => {
                      setActiveTab('agreements');
                      setShowForm(true);
                      setEditingItem(null);
                    }} 
                    className="mt-4"
                    variant="outline"
                  >
                    Create your first agreement
                  </Button>
                </div>
              ) : filteredAgreements.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">No agreements match your search criteria</div>
                  <Button 
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setSupplierFilter("all");
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
                        <th className="text-left py-3 px-4 font-semibold">Agreement #</th>
                        <th className="text-left py-3 px-4 font-semibold">Supplier</th>
                        <th className="text-left py-3 px-4 font-semibold">Buyer</th>
                        <th className="text-center py-3 px-4 font-semibold">Start Date</th>
                        <th className="text-center py-3 px-4 font-semibold">End Date</th>
                        <th className="text-right py-3 px-4 font-semibold">Total Amount</th>
                        <th className="text-center py-3 px-4 font-semibold">Status</th>
                        <th className="text-center py-3 px-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                                              {filteredAgreements.map((agreement, index) => (
                          <tr key={agreement.agreement_id || index} className="border-b hover:bg-gray-50">
                                                      <td className="py-3 px-4 font-medium">{agreement.agreement_number || 'N/A'}</td>
                                                      <td className="py-3 px-4">{agreement.supplier_name || 'Unknown Supplier'}</td>
                          <td className="py-3 px-4">{agreement.buyer_name || 'Unknown Buyer'}</td>
                          <td className="py-3 px-4 text-center">
                            {agreement.effective_start_date ? new Date(agreement.effective_start_date).toLocaleDateString() : '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {agreement.effective_end_date ? new Date(agreement.effective_end_date).toLocaleDateString() : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold">${typeof agreement.total_amount === 'number' ? agreement.total_amount.toFixed(2) : '0.00'}</td>
                          <td className="py-3 px-4 text-center">{getStatusBadge(agreement.status)}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(agreement)}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(agreement)}
                                className="h-8 w-8 p-0"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(agreement.agreement_id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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

        <TabsContent value="orders">
          <div className="flex justify-end mb-4 gap-2">
            <Button 
              variant="outline" 
              onClick={() => {/* Export functionality */}}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button 
              onClick={() => {
                setActiveTab('orders');
                setShowForm(true);
                setEditingItem(null);
              }}
              className="flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              Create Purchase Order
            </Button>
          </div>
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search purchase orders or suppliers..."
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
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Suppliers</SelectItem>
                      {suppliers.map(supplier => (
                        <SelectItem key={supplier.supplier_id} value={supplier.supplier_id.toString()}>
                          {supplier.supplier_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Purchase Orders</h3>
                <p className="text-sm text-gray-500">
                  Showing {filteredOrders.length} of {orders.length} orders
                </p>
              </div>
              {loading ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Loading orders...</div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">No purchase orders found</div>
                  <Button 
                    onClick={() => {
                      setActiveTab('orders');
                      setShowForm(true);
                      setEditingItem(null);
                    }} 
                    className="mt-4"
                    variant="outline"
                  >
                    Create your first purchase order
                  </Button>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">No orders match your search criteria</div>
                  <Button 
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setSupplierFilter("all");
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
                        <th className="text-left py-3 px-4 font-semibold">PO #</th>
                        <th className="text-left py-3 px-4 font-semibold">Supplier</th>
                        <th className="text-center py-3 px-4 font-semibold">PO Date</th>
                        <th className="text-center py-3 px-4 font-semibold">Need By Date</th>
                        <th className="text-right py-3 px-4 font-semibold">Total Amount</th>
                        <th className="text-center py-3 px-4 font-semibold">Status</th>
                        <th className="text-center py-3 px-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => (
                        <tr key={order.header_id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{order.po_number}</td>
                          <td className="py-3 px-4">{order.supplier_name}</td>
                          <td className="py-3 px-4 text-center">
                            {new Date(order.po_date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {order.need_by_date ? new Date(order.need_by_date).toLocaleDateString() : '-'}
                          </td>
                                                      <td className="py-3 px-4 text-right font-semibold">${typeof order.total_amount === 'number' ? order.total_amount.toFixed(2) : '0.00'}</td>
                          <td className="py-3 px-4 text-center">{getStatusBadge(order.status)}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(order)}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(order)}
                                className="h-8 w-8 p-0"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {(order.approval_status || '').toUpperCase() === 'PENDING' && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                      title="Approve/Reject Purchase Order"
                                      disabled={approvingOrderId === order.header_id}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => handleApproveOrder(order, 'APPROVED')}
                                      className="text-green-600 focus:text-green-700"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleApproveOrder(order, 'REJECTED')}
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

        <TabsContent value="grns">
          <div className="flex justify-end mb-4 gap-2">
            <Button 
              variant="outline" 
              onClick={() => {/* Export functionality */}}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button 
              onClick={() => {
                setActiveTab('grns');
                setShowForm(true);
                setEditingItem(null);
              }}
              className="flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              Create GRN
            </Button>
          </div>
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search GRNs..."
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
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Goods Received Notes</h3>
                <p className="text-sm text-gray-500">
                  Showing {filteredGRNs.length} of {grns.length} GRNs
                </p>
              </div>
              {loading ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Loading GRNs...</div>
                </div>
              ) : grns.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">No GRNs found</div>
                  <Button 
                    onClick={() => {
                      setActiveTab('grns');
                      setShowForm(true);
                      setEditingItem(null);
                    }} 
                    className="mt-4"
                    variant="outline"
                  >
                    Create your first GRN
                  </Button>
                </div>
              ) : filteredGRNs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">No GRNs match your search criteria</div>
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
                        <th className="text-left py-3 px-4 font-semibold">GRN #</th>
                        <th className="text-left py-3 px-4 font-semibold">PO #</th>
                        <th className="text-center py-3 px-4 font-semibold">Receipt Date</th>
                        <th className="text-center py-3 px-4 font-semibold">Receipt Type</th>
                        <th className="text-right py-3 px-4 font-semibold">Total Amount</th>
                        <th className="text-center py-3 px-4 font-semibold">Status</th>
                        <th className="text-center py-3 px-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGRNs.map((grn) => (
                        <tr key={grn.receipt_id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{grn.receipt_number}</td>
                          <td className="py-3 px-4">
                            {grn.po_number ? grn.po_number : grn.header_id ?? '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {grn.receipt_date ? new Date(grn.receipt_date).toLocaleDateString() : '-'}
                          </td>
                          <td className="py-3 px-4 text-center">{grn.receipt_type}</td>
                          <td className="py-3 px-4 text-right font-semibold">
                            ${typeof grn.total_amount === 'number' ? grn.total_amount.toFixed(2) : '0.00'}
                          </td>
                          <td className="py-3 px-4 text-center">{getStatusBadge(grn.status)}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(grn)}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(grn)}
                                className="h-8 w-8 p-0"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(grn.receipt_id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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

        <TabsContent value="requisitions">
          <div className="flex justify-end mb-4 gap-2">
            <Button 
              variant="outline" 
              onClick={() => {/* Export functionality */}}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button 
              onClick={() => {
                setActiveTab('requisitions');
                setShowForm(true);
                setEditingItem(null);
              }}
              className="flex items-center gap-2"
            >
              <Receipt className="w-4 h-4" />
              Create Requisition
            </Button>
          </div>
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search requisitions..."
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
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Purchase Requisitions</h3>
                <p className="text-sm text-gray-500">
                  Showing {filteredRequisitions.length} of {requisitions.length} requisitions
                </p>
              </div>
              {loading ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Loading requisitions...</div>
                </div>
              ) : requisitions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">No requisitions found</div>
                  <Button 
                    onClick={() => {
                      setActiveTab('requisitions');
                      setShowForm(true);
                      setEditingItem(null);
                    }} 
                    className="mt-4"
                    variant="outline"
                  >
                    Create your first requisition
                  </Button>
                </div>
              ) : filteredRequisitions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">No requisitions match your search criteria</div>
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
                        <th className="text-left py-3 px-4 font-semibold">Requisition #</th>
                        <th className="text-left py-3 px-4 font-semibold">Description</th>
                        <th className="text-left py-3 px-4 font-semibold">Requester</th>
                        <th className="text-center py-3 px-4 font-semibold">Requisition Date</th>
                        <th className="text-center py-3 px-4 font-semibold">Need By Date</th>
                        <th className="text-right py-3 px-4 font-semibold">Total Amount</th>
                        <th className="text-center py-3 px-4 font-semibold">Status</th>
                        <th className="text-center py-3 px-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequisitions.map((requisition) => (
                        <tr key={requisition.requisition_id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{requisition.requisition_number}</td>
                          <td className="py-3 px-4">{requisition.description}</td>
                          <td className="py-3 px-4">{requisition.requester_name || '-'}</td>
                          <td className="py-3 px-4 text-center">
                            {requisition.requisition_date ? new Date(requisition.requisition_date).toLocaleDateString() : '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {requisition.need_by_date ? new Date(requisition.need_by_date).toLocaleDateString() : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold">
                            {typeof requisition.total_amount === 'number' ? `$${requisition.total_amount.toFixed(2)}` : '-'}
                          </td>
                          <td className="py-3 px-4 text-center">{getStatusBadge(requisition.status)}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(requisition)}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(requisition)}
                                className="h-8 w-8 p-0"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(requisition.requisition_id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ top: 0, margin: 0, padding: 0 }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto" style={{ marginTop: 0 }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingItem ? 'Edit' : 'Create'} {activeTab === 'agreements' ? 'Purchase Agreement' : activeTab === 'orders' ? 'Purchase Order' : 'Purchase Requisition'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                  resetForms();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            {activeTab === 'agreements' ? (
              loading ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Loading form data...</div>
                </div>
              ) : (
                <PurchaseAgreementForm
                  key={`agreement-${(editingItem as PurchaseAgreement)?.agreement_id || 'new'}`}
                  agreement={editingItem as PurchaseAgreement | null}
                  suppliers={suppliers || []}
                  users={users || []}
                  onSave={() => {
                    setShowForm(false);
                    setEditingItem(null);
                    resetForms();
                    fetchData();
                  }}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingItem(null);
                    resetForms();
                  }}
                />
              )
            ) : activeTab === 'orders' ? (
              loading ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Loading form data...</div>
                </div>
              ) : (
                <PurchaseOrderForm
                  key={`order-${(editingItem as PurchaseOrder)?.header_id || 'new'}`}
                  // Use unknown first to avoid explicit any while bypassing structural type mismatch
                  purchaseOrder={editingItem as unknown as PurchaseOrder | null}
                  suppliers={suppliers || []}
                  users={users || []}
                  requisitions={requisitions as unknown as Array<{requisition_id: number; requisition_number: string; description: string; status: string}>}
                  onSave={() => {
                    setShowForm(false);
                    setEditingItem(null);
                    resetForms();
                    fetchData();
                  }}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingItem(null);
                    resetForms();
                  }}
                />
              )
            ) : activeTab === 'grns' ? (
              <GRNForm
                key={`grn-${(editingItem as GRN)?.receipt_id || 'new'}`}
                grn={editingItem as GRN | null}
                purchaseOrders={orders
                  .filter(order => (order.approval_status || '').toUpperCase() === 'APPROVED')
                  .map(order => ({
                  header_id: order.header_id || 0,
                  po_number: order.po_number || '',
                  supplier_name: order.supplier_name || '',
                  po_date: order.po_date || '',
                  total_amount: order.total_amount || 0,
                  status: order.status || '',
                  currency_code: order.currency_code ?? 'USD',
                  exchange_rate: order.exchange_rate ?? 1.0
                }))}
                onSave={() => {
                  setShowForm(false);
                  setEditingItem(null);
                  resetForms();
                  fetchData();
                }}
                onCancel={() => {
                  setShowForm(false);
                  setEditingItem(null);
                  resetForms();
                }}
              />
            ) : (
              <PurchaseRequisitionForm
                key={`requisition-${activeTab === 'requisitions' ? (editingItem as PurchaseRequisition)?.requisition_id || 'new' : 'new'}`}
                requisition={editingItem as PurchaseRequisition | null}
                users={users}
                onSave={() => {
                  setShowForm(false);
                  setEditingItem(null);
                  resetForms();
                  fetchData();
                }}
                onCancel={() => {
                  setShowForm(false);
                  setEditingItem(null);
                  resetForms();
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ top: 0, margin: 0, padding: 0 }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto" style={{ marginTop: 0 }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {activeTab === 'agreements'
                  ? 'View Purchase Agreement Details'
                  : activeTab === 'orders'
                  ? 'View Purchase Order Details'
                  : activeTab === 'grns'
                  ? 'View Goods Received Note Details'
                  : 'View Purchase Requisition Details'}
              </h2>
              <button
                onClick={() => {
                  setShowViewForm(false);
                  setViewingItem(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            {activeTab === 'agreements' ? (
              <div className="space-y-6">
                {viewingItem && (
                  <>
                    {/* Basic Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Basic Information</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Agreement Number</Label>
                          <p className="text-sm mt-1">{(viewingItem as PurchaseAgreement).agreement_number}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Agreement Type</Label>
                          <p className="text-sm mt-1">{(viewingItem as PurchaseAgreement).agreement_type}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Agreement Date</Label>
                          <p className="text-sm mt-1">{(viewingItem as PurchaseAgreement).agreement_date}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Status</Label>
                          <p className="text-sm mt-1">{(viewingItem as PurchaseAgreement).status}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Approval Status</Label>
                          <p className="text-sm mt-1">{(viewingItem as PurchaseAgreement).approval_status}</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Parties */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Parties</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Supplier</Label>
                          <p className="text-sm mt-1">
                            {suppliers.find(s => s.supplier_id === (viewingItem as PurchaseAgreement).supplier_id)?.supplier_name || 'Unknown'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Buyer</Label>
                          <p className="text-sm mt-1">
                            {(viewingItem as PurchaseAgreement).buyer_name || 'Unknown'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Financial Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Financial Information</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Currency</Label>
                          <p className="text-sm mt-1">{(viewingItem as PurchaseAgreement).currency_code}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Exchange Rate</Label>
                          <p className="text-sm mt-1">{(viewingItem as PurchaseAgreement).exchange_rate}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Total Amount</Label>
                          <p className="text-sm mt-1 font-semibold">
                            ${(() => {
                              const amount = (viewingItem as PurchaseAgreement).total_amount;
                              if (typeof amount === 'number') return amount.toFixed(2);
                              if (typeof amount === 'string') return parseFloat(amount || '0').toFixed(2);
                              return '0.00';
                            })()}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Amount Remaining</Label>
                          <p className="text-sm mt-1">
                            ${(() => {
                              const amount = (viewingItem as PurchaseAgreement).amount_remaining;
                              if (typeof amount === 'number') return amount.toFixed(2);
                              if (typeof amount === 'string') return parseFloat(amount || '0').toFixed(2);
                              return '0.00';
                            })()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Dates */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Dates</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Effective Start Date</Label>
                          <p className="text-sm mt-1">{(viewingItem as PurchaseAgreement).effective_start_date}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Effective End Date</Label>
                          <p className="text-sm mt-1">{(viewingItem as PurchaseAgreement).effective_end_date}</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Description */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Description</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{(viewingItem as PurchaseAgreement).description || 'No description provided'}</p>
                      </CardContent>
                    </Card>

                    {/* Line Items */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Line Items</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(viewingItem as PurchaseAgreement).lines && (viewingItem as PurchaseAgreement).lines!.length > 0 ? (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-16 text-xs">Line</TableHead>
                                  <TableHead className="w-48 text-xs">Item</TableHead>
                                  <TableHead className="w-48 text-xs">Description</TableHead>
                                  <TableHead className="w-20 text-xs">Qty</TableHead>
                                  <TableHead className="w-20 text-xs">UOM</TableHead>
                                  <TableHead className="w-32 text-xs">Unit Price</TableHead>
                                  <TableHead className="w-32 text-xs">Amount</TableHead>
                                  <TableHead className="w-24 text-xs">Min Qty</TableHead>
                                  <TableHead className="w-24 text-xs">Max Qty</TableHead>
                                  <TableHead className="w-32 text-xs">Need By</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(viewingItem as PurchaseAgreement).lines!.map((line, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="text-xs">{line.line_number}</TableCell>
                                    <TableCell>
                                      <div className="space-y-1">
                                        <p className="text-xs font-medium">{line.item_code}</p>
                                        <p className="text-xs">{line.item_name}</p>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-xs">{line.description}</TableCell>
                                    <TableCell className="text-xs">{line.quantity}</TableCell>
                                    <TableCell className="text-xs">{line.uom}</TableCell>
                                    <TableCell className="text-xs">
                                      ${(() => {
                                        const price = line.unit_price;
                                        if (typeof price === 'number') return price.toFixed(2);
                                        if (typeof price === 'string') return parseFloat(price || '0').toFixed(2);
                                        return '0.00';
                                      })()}
                                    </TableCell>
                                    <TableCell className="text-xs font-semibold">
                                      ${(() => {
                                        const amount = line.line_amount;
                                        if (typeof amount === 'number') return amount.toFixed(2);
                                        if (typeof amount === 'string') return parseFloat(amount || '0').toFixed(2);
                                        return '0.00';
                                      })()}
                                    </TableCell>
                                    <TableCell className="text-xs">{line.min_quantity || '-'}</TableCell>
                                    <TableCell className="text-xs">{line.max_quantity || '-'}</TableCell>
                                    <TableCell className="text-xs">
                                      {(() => {
                                        const date = line.need_by_date;
                                        if (!date || date === 'null' || date === '') return '-';
                                        return date;
                                      })()}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No line items found</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Close Button */}
                    <div className="flex justify-end pt-4 border-t">
                      <Button onClick={() => setShowViewForm(false)} variant="outline">
                        Close
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : activeTab === 'orders' ? (
              <div className="space-y-6">
                {viewingItem && (
                  <>
                    {/* PO Header */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Purchase Order</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">PO Number</Label>
                          <p className="text-sm mt-1">{(viewingItem as PurchaseOrder).po_number}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Supplier</Label>
                          <p className="text-sm mt-1">{(viewingItem as PurchaseOrder).supplier_name || '-'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">PO Date</Label>
                          <p className="text-sm mt-1">
                            {(viewingItem as PurchaseOrder).po_date
                              ? new Date((viewingItem as PurchaseOrder).po_date as string).toLocaleDateString()
                              : '-'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Need By Date</Label>
                          <p className="text-sm mt-1">
                            {(viewingItem as PurchaseOrder).need_by_date
                              ? new Date((viewingItem as PurchaseOrder).need_by_date as string).toLocaleDateString()
                              : '-'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Status</Label>
                          <p className="text-sm mt-1">{(viewingItem as PurchaseOrder).status || '-'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Approval Status</Label>
                          <p className="text-sm mt-1">{(viewingItem as PurchaseOrder).approval_status || '-'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Currency</Label>
                          <p className="text-sm mt-1">{(viewingItem as PurchaseOrder).currency_code || 'USD'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Exchange Rate</Label>
                          <p className="text-sm mt-1">
                            {(() => {
                              const rate = (viewingItem as PurchaseOrder).exchange_rate;
                              if (typeof rate === 'number') return rate.toFixed(6);
                              if (typeof rate === 'string') return parseFloat(rate || '1').toFixed(6);
                              return '1.000000';
                            })()}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Total Amount</Label>
                          <p className="text-sm mt-1 font-semibold">
                            ${(() => {
                              const order = viewingItem as PurchaseOrder;
                              const lines = order.lines || [];
                              if (lines.length > 0) {
                                const subtotal = lines.reduce(
                                  (sum, l) => sum + (Number(l.line_amount) || 0),
                                  0
                                );
                                const taxAmount = lines.reduce(
                                  (sum, l) => sum + (Number(l.tax_amount) || 0),
                                  0
                                );
                                return (subtotal + taxAmount).toFixed(2);
                              }
                              const amount = order.total_amount;
                              if (typeof amount === 'number') return amount.toFixed(2);
                              if (typeof amount === 'string') return parseFloat(amount || '0').toFixed(2);
                              return '0.00';
                            })()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* PO Lines */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Line Items</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(viewingItem as PurchaseOrder).lines && (viewingItem as PurchaseOrder).lines!.length > 0 ? (() => {
                          const lines = (viewingItem as PurchaseOrder).lines || [];
                          return (
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-16 text-xs">Line</TableHead>
                                    <TableHead className="w-48 text-xs">Item</TableHead>
                                    <TableHead className="w-32 text-xs">Description</TableHead>
                                    <TableHead className="w-20 text-xs">Boxes</TableHead>
                                    <TableHead className="w-24 text-xs">Packets</TableHead>
                                    <TableHead className="w-24 text-xs">Qty</TableHead>
                                    <TableHead className="w-20 text-xs">UOM</TableHead>
                                    <TableHead className="w-32 text-xs">Unit Price</TableHead>
                                    <TableHead className="w-24 text-xs">Tax %</TableHead>
                                    <TableHead className="w-24 text-xs">Tax Amount</TableHead>
                                    <TableHead className="w-32 text-xs">Line Amount</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {lines.map((line: POLine, index) => (
                                    <TableRow key={index}>
                                      <TableCell className="text-xs">{line.line_number}</TableCell>
                                      <TableCell>
                                        <div className="space-y-1">
                                          <p className="text-xs font-medium">{line.item_code}</p>
                                          <p className="text-xs">{line.item_name}</p>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-xs">
                                        {line.description}
                                      </TableCell>
                                      <TableCell className="text-xs">{line.box_quantity}</TableCell>
                                      <TableCell className="text-xs">{line.packet_quantity}</TableCell>
                                      <TableCell className="text-xs">{line.quantity}</TableCell>
                                      <TableCell className="text-xs">{line.uom}</TableCell>
                                      <TableCell className="text-xs">
                                        ${(() => {
                                          const price = line.unit_price;
                                          if (typeof price === 'number') return price.toFixed(2);
                                          if (typeof price === 'string') return parseFloat(price || '0').toFixed(2);
                                          return '0.00';
                                        })()}
                                      </TableCell>
                                      <TableCell className="text-xs">
                                        {Number(line.tax_rate || 0).toFixed(2)}%
                                      </TableCell>
                                      <TableCell className="text-xs">
                                        ${Number(line.tax_amount || 0).toFixed(2)}
                                      </TableCell>
                                      <TableCell className="text-xs font-semibold">
                                        ${(() => {
                                          const base = Number(line.line_amount) || 0;
                                          const tax = Number(line.tax_amount) || 0;
                                          return (base + tax).toFixed(2);
                                        })()}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          );
                        })() : (
                          <p className="text-sm text-gray-500">No line items found</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Pricing Summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Pricing Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs text-gray-600">Total Items</p>
                            <p className="text-lg font-semibold">
                              {(viewingItem as PurchaseOrder).lines?.length || 0}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-gray-600">Subtotal</p>
                            <p className="text-lg font-semibold">
                              ${(() => {
                                const lines = (viewingItem as PurchaseOrder).lines || [];
                                const subtotal = lines.reduce(
                                  (sum, l) => sum + (Number(l.line_amount) || 0),
                                  0
                                );
                                return subtotal.toFixed(2);
                              })()}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-gray-600">Tax Amount</p>
                            <p className="text-lg font-semibold">
                              ${(() => {
                                const lines = (viewingItem as PurchaseOrder).lines || [];
                                const taxAmount = lines.reduce(
                                  (sum, l) => sum + (Number(l.tax_amount) || 0),
                                  0
                                );
                                return taxAmount.toFixed(2);
                              })()}
                            </p>
                          </div>
                          <div className="space-y-1 md:col-span-3">
                            <p className="text-xs text-gray-600">Total Amount</p>
                            <p className="text-lg font-semibold">
                              ${(() => {
                                const lines = (viewingItem as PurchaseOrder).lines || [];
                                const subtotal = lines.reduce(
                                  (sum, l) => sum + (Number(l.line_amount) || 0),
                                  0
                                );
                                const taxAmount = lines.reduce(
                                  (sum, l) => sum + (Number(l.tax_amount) || 0),
                                  0
                                );
                                return (subtotal + taxAmount).toFixed(2);
                              })()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Close Button */}
                    <div className="flex justify-end pt-4 border-t">
                  <Button onClick={() => setShowViewForm(false)} variant="outline">
                    Close
                  </Button>
                </div>
                  </>
                )}
              </div>
            ) : activeTab === 'grns' ? (
              <div className="space-y-6">
                {viewingItem && (
                  <>
                    {/* GRN Header */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Goods Received Note</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">GRN Number</Label>
                          <p className="text-sm mt-1">{(viewingItem as GRN).receipt_number}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Purchase Order</Label>
                          <p className="text-sm mt-1">
                            {(() => {
                              const grn = viewingItem as GRN;
                              if (grn.po_number && grn.supplier_name) {
                                return `${grn.po_number} - ${grn.supplier_name}`;
                              }
                              if (grn.po_number) return grn.po_number;
                              return grn.header_id ?? '-';
                            })()}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Receipt Date</Label>
                          <p className="text-sm mt-1">
                            {(viewingItem as GRN).receipt_date
                              ? new Date((viewingItem as GRN).receipt_date as string).toLocaleDateString()
                              : '-'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Receipt Type</Label>
                          <p className="text-sm mt-1">{(viewingItem as GRN).receipt_type}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Status</Label>
                          <p className="text-sm mt-1">{(viewingItem as GRN).status}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Total Amount</Label>
                          <p className="text-sm mt-1 font-semibold">
                            ${(() => {
                              const grn = viewingItem as GRN;
                              const lines = grn.lines || [];

                              // Prefer recomputing from lines (base + tax) when available
                              if (lines.length > 0) {
                                const total = lines.reduce((sum, l: GRNLine) => {
                                  const base = Number(l.line_amount) || 0;
                                  const tax = Number(l.tax_amount) || 0;
                                  return sum + base + tax;
                                }, 0);
                                return total.toFixed(2);
                              }

                              // Fallback to header total_amount from backend
                              const amount = grn.total_amount;
                              if (typeof amount === 'number') return amount.toFixed(2);
                              if (typeof amount === 'string') return parseFloat(amount || '0').toFixed(2);
                              return '0.00';
                            })()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* GRN Lines */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Received Items</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(viewingItem as GRN).lines && (viewingItem as GRN).lines!.length > 0 ? (() => {
                          const lines = (viewingItem as GRN).lines || [];
                          const hasRejectionNotes = lines.some(line => Number(line.quantity_rejected) > 0 && (line.rejection_reason || '').trim() !== '');

                          return (
                          <>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-16 text-xs">Line</TableHead>
                                    <TableHead className="w-48 text-xs">Item</TableHead>
                                    <TableHead className="w-32 text-xs">UOM</TableHead>
                                    <TableHead className="w-24 text-xs">Ordered</TableHead>
                                    <TableHead className="w-24 text-xs">Received</TableHead>
                                    <TableHead className="w-24 text-xs">Accepted</TableHead>
                                    <TableHead className="w-24 text-xs">Rejected</TableHead>
                                    <TableHead className="w-32 text-xs">Unit Price</TableHead>
                                    <TableHead className="w-24 text-xs">Tax %</TableHead>
                                    <TableHead className="w-24 text-xs">Tax Amount</TableHead>
                                    <TableHead className="w-32 text-xs">Line Amount</TableHead>
                                    <TableHead className="w-32 text-xs">Lot Number</TableHead>
                                    <TableHead className="w-32 text-xs">Expiration</TableHead>
                                    {hasRejectionNotes && <TableHead className="w-40 text-xs">Rejection Notes</TableHead>}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {lines.map((line, index) => (
                                    <TableRow key={index}>
                                      <TableCell className="text-xs">{line.line_number}</TableCell>
                                      <TableCell>
                                        <div className="space-y-1">
                                          <p className="text-xs font-medium">{line.item_code}</p>
                                          <p className="text-xs">{line.item_name}</p>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-xs">{line.uom}</TableCell>
                                      <TableCell className="text-xs">{line.quantity_ordered}</TableCell>
                                      <TableCell className="text-xs">{line.quantity_received}</TableCell>
                                      <TableCell className="text-xs">{line.quantity_accepted}</TableCell>
                                      <TableCell className="text-xs">{line.quantity_rejected}</TableCell>
                                      <TableCell className="text-xs">
                                        ${(() => {
                                          const price = line.unit_price;
                                          if (typeof price === 'number') return price.toFixed(2);
                                          if (typeof price === 'string') return parseFloat(price || '0').toFixed(2);
                                          return '0.00';
                                        })()}
                                      </TableCell>
                                      <TableCell className="text-xs">
                                        {(() => {
                                          const rate = (line as GRNLine).tax_rate;
                                          if (typeof rate === 'number') return `${rate.toFixed(2)}%`;
                                          if (typeof rate === 'string') return `${(parseFloat(rate || '0') || 0).toFixed(2)}%`;
                                          return '0.00%';
                                        })()}
                                      </TableCell>
                                      <TableCell className="text-xs">
                                        ${(() => {
                                          const taxValue = (line as GRNLine).tax_amount;
                                          if (typeof taxValue === 'number') return taxValue.toFixed(2);
                                          if (typeof taxValue === 'string') return parseFloat(taxValue || '0').toFixed(2);
                                          return '0.00';
                                        })()}
                                      </TableCell>
                                      <TableCell className="text-xs font-semibold">
                                        ${(() => {
                                          const base = (() => {
                                            const amount = (line as GRNLine).line_amount;
                                            if (typeof amount === 'number') return amount;
                                            if (typeof amount === 'string') return parseFloat(amount || '0') || 0;
                                            return 0;
                                          })();
                                          const tax = (() => {
                                            const t = (line as GRNLine).tax_amount;
                                            if (typeof t === 'number') return t;
                                            if (typeof t === 'string') return parseFloat(t || '0') || 0;
                                            return 0;
                                          })();
                                          return (base + tax).toFixed(2);
                                        })()}
                                      </TableCell>
                                      <TableCell className="text-xs">{line.lot_number || '-'}</TableCell>
                                      <TableCell className="text-xs">
                                        {line.expiration_date
                                          ? new Date(line.expiration_date).toLocaleDateString()
                                          : '-'}
                                      </TableCell>
                                      {hasRejectionNotes && (
                                        <TableCell className="text-xs">
                                          {(line.rejection_reason || '').trim() !== '' ? line.rejection_reason : '-'}
                                        </TableCell>
                                      )}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                            
                          </>
                          );
                        })() : (
                          <p className="text-sm text-gray-500">No line items found</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Pricing Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs text-gray-600">Total Items</p>
                            <p className="text-lg font-semibold">{(viewingItem as GRN).lines?.length || 0}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-gray-600">Total Accepted</p>
                            <p className="text-lg font-semibold">
                              {(() => {
                                const lines = (viewingItem as GRN).lines || [];
                                return lines.reduce((sum, l) => sum + (Number(l.quantity_accepted) || 0), 0);
                              })()}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-gray-600">Total Amount</p>
                            <p className="text-lg font-semibold">
                              ${(() => {
                                const lines = (viewingItem as GRN).lines || [];
                                const total = lines.reduce((sum, l: GRNLine) => {
                                  const base = Number(l.line_amount) || 0;
                                  const tax = Number(l.tax_amount) || 0;
                                  return sum + base + tax;
                                }, 0);
                                return total.toFixed(2);
                              })()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Notes */}
                    {(viewingItem as GRN).notes && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">{(viewingItem as GRN).notes}</p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Close Button */}
                    <div className="flex justify-end pt-4 border-t">
                      <Button onClick={() => setShowViewForm(false)} variant="outline">
                        Close
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-center text-gray-500">View functionality for Purchase Requisitions coming soon...</p>
                <div className="flex justify-end">
                  <Button onClick={() => setShowViewForm(false)} variant="outline">
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcurementManager; 