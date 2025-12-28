import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Plus, 
  X,
  Eye,
  Edit,
  Loader2,
  FileText,
  Layers,
  Link2,
  ArrowLeft,
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Segment {
  id: string;
  name: string;
  value: string;
  length: number;
}

interface AccountingSegment {
  id: number;
  segment_id: string;
  segment_code: string;
  segment_name: string;
  segment_type: string;
  segment_use: string;
  is_primary?: boolean | number | null;
  status: string;
}

interface CoAInstance {
  id: number;
  coa_code: string;
  coa_name: string;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
  segments?: Segment[];
  assignedLedgers?: string[];
  usedBy?: string[];
}

interface LedgerConfiguration {
  id: number;
  ledger_name: string;
  ledger_type: string;
  currency: string;
  coa_instance_id: number;
  coa_code?: string;
  coa_name?: string;
}

interface HeaderAssignment {
  id: string;
  headerId: string;
  coaInstance: string;
  assignedLedgers: string[];
  financialModules: string[];
  validationRules: string[];
}

interface NewSegment {
  name: string;
}

interface CoAData {
  id: number;
  coa_name: string;
  description: string | null;
  segment_1_name: string | null;
  segment_1_value: string;
  segment_2_name: string | null;
  segment_2_value: string;
  segment_3_name: string | null;
  segment_3_value: string;
  segment_4_name: string | null;
  segment_4_value: string;
  segment_5_name: string | null;
  segment_5_value: string;
  segment_length: number;
  created_at: string;
}

// Use environment variable for API base URL, fallback based on environment
const PRODUCTION_BACKEND = 'https://skyblue-snake-491948.hostingersite.com';
const PRODUCTION_API_BASE = `${PRODUCTION_BACKEND}/api`;
const isProduction = import.meta.env.PROD || window.location.hostname.includes('hostingersite.com');
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (isProduction ? PRODUCTION_API_BASE : 'http://localhost:5000/api');

interface ChartOfAccountSetupRef {
  activeSection: 'structure-definition' | 'instances-assignments' | 'header-assignments' | null;
  setActiveSection: (section: 'structure-definition' | 'instances-assignments' | 'header-assignments' | null) => void;
}

interface ChartOfAccountSetupProps {
  onBackRef?: React.MutableRefObject<ChartOfAccountSetupRef | null>;
  onSectionChange?: (
    section: 'structure-definition' | 'instances-assignments' | 'header-assignments' | null
  ) => void;
}

const ChartOfAccountSetup = ({ onBackRef, onSectionChange }: ChartOfAccountSetupProps) => {
  const { toast } = useToast();
  
  // State for Structure Definition
  const [showForm, setShowForm] = useState(false);
  const [coaName, setCoaName] = useState("");
  const [description, setDescription] = useState("");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [coaList, setCoaList] = useState<CoAData[]>([]);
  const [viewingCoA, setViewingCoA] = useState<CoAData | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingCoA, setEditingCoA] = useState<CoAData | null>(null);
  
  // State for available accounting segments
  const [availableSegments, setAvailableSegments] = useState<AccountingSegment[]>([]);
  
  // State for new segment
  const [newSegment, setNewSegment] = useState<NewSegment>({
    name: ""
  });

  // State for segment creation
  const [segmentFormData, setSegmentFormData] = useState({
    id: "",
    code: "",
    name: "",
    type: "",
    description: "",
    is_primary: false
  });

  const [structureTab, setStructureTab] = useState<'chart-of-accounts' | 'segments'>('chart-of-accounts');
  const [activeSection, setActiveSection] = useState<'structure-definition' | 'instances-assignments' | 'header-assignments' | null>(null);

  // Expose state to parent via ref / callback
  useEffect(() => {
    if (onBackRef) {
      onBackRef.current = {
        activeSection,
        setActiveSection
      };
    }

    if (onSectionChange) {
      onSectionChange(activeSection);
    }
  }, [activeSection, onBackRef, onSectionChange]);

  // State for showing/hiding segment creation form
  const [showSegmentForm, setShowSegmentForm] = useState(false);

  // Fetch available accounting segments
  const fetchAccountingSegments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/chart-of-accounts/accounting-segments`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setAvailableSegments(result.data);
      }
    } catch (error) {
      console.error('Error fetching accounting segments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch accounting segments",
        variant: "destructive"
      });
    }
  };

  // Fetch all CoAs from API
  const fetchCoAs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/chart-of-accounts/segments`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setCoaList(result.data);
      }
    } catch (error) {
      console.error('Error fetching CoAs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch Chart of Accounts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch CoA instances
  const fetchCoAInstances = async () => {
    try {
      setInstancesLoading(true);
      const response = await fetch(`${API_BASE_URL}/chart-of-accounts/instances`);
      const result = await response.json();
      
      if (result.success && result.data) {
        // Fetch ledger assignments
        const ledgersResponse = await fetch(`${API_BASE_URL}/chart-of-accounts/ledgers`);
        const ledgersResult = await ledgersResponse.json();
        const allLedgers = ledgersResult.success ? ledgersResult.data : [];
        
        // Fetch segments and ledger assignments for each instance
        const instancesWithData = await Promise.all(
          result.data.map(async (instance: CoAInstance) => {
            // Fetch segments for this instance
            let instanceSegments: Segment[] = [];
            try {
              const segmentsResponse = await fetch(`${API_BASE_URL}/chart-of-accounts/instances/${instance.id}`);
              const segmentsResult = await segmentsResponse.json();
              if (segmentsResult.success && segmentsResult.data.segments) {
                instanceSegments = segmentsResult.data.segments.map((seg: { segment_name: string; segment_length: number }, idx: number) => ({
                  id: `${instance.id}-${idx}`,
                  name: seg.segment_name,
                  value: '',
                  length: seg.segment_length
                }));
              }
            } catch (err) {
              console.error(`Error fetching segments for instance ${instance.id}:`, err);
            }
            
            // Get assigned ledgers for this instance
            const assignedLedgers = allLedgers
              .filter((l: LedgerConfiguration) => l.coa_instance_id === instance.id)
              .map((l: LedgerConfiguration) => l.ledger_name);
            
            return {
              ...instance,
              segments: instanceSegments,
              assignedLedgers,
              usedBy: [] // Can be populated later from other modules
            };
          })
        );
        setCoaInstances(instancesWithData);
      }
    } catch (error) {
      console.error('Error fetching CoA instances:', error);
      toast({
        title: "Error",
        description: "Failed to fetch CoA instances",
        variant: "destructive"
      });
    } finally {
      setInstancesLoading(false);
    }
  };

  // Fetch ledgers
  const fetchLedgers = async () => {
    try {
      setLedgersLoading(true);
      const response = await fetch(`${API_BASE_URL}/chart-of-accounts/ledgers`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setLedgers(result.data);
      }
    } catch (error) {
      console.error('Error fetching ledgers:', error);
    } finally {
      setLedgersLoading(false);
    }
  };
  
  useEffect(() => {
    const loadData = async () => {
      await fetchAccountingSegments();
      await fetchCoAs();
      await fetchCoAInstances();
      await fetchLedgers();
      await fetchHeaderAssignments();
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // State for CoA Instances
  const [coaInstances, setCoaInstances] = useState<CoAInstance[]>([]);
  const [instancesLoading, setInstancesLoading] = useState(false);
  const [showInstanceForm, setShowInstanceForm] = useState(false);
  const [selectedCoAStructure, setSelectedCoAStructure] = useState<CoAData | null>(null);
  const [newInstanceData, setNewInstanceData] = useState({
    coa_code: "",
    coa_name: "",
    description: ""
  });
  const [ledgers, setLedgers] = useState<LedgerConfiguration[]>([]);
  const [ledgersLoading, setLedgersLoading] = useState(false);

  // State for Header Assignments
  const [headerAssignments, setHeaderAssignments] = useState<HeaderAssignment[]>([]);
  const [showHeaderAssignmentForm, setShowHeaderAssignmentForm] = useState(false);
  const [headerAssignmentSearchTerm, setHeaderAssignmentSearchTerm] = useState("");
  const [newHeaderAssignment, setNewHeaderAssignment] = useState({
    headerId: "HDR-001",
    coaInstance: "",
    assignedLedgers: [] as string[],
    financialModules: [] as string[],
    validationRules: [] as string[]
  });

  const handleAddSegment = async () => {
    // Check if already 5 segments
    if (segments.length >= 5) {
      toast({
        title: "Limit Reached",
        description: "Maximum 5 segments allowed",
        variant: "destructive"
      });
      return;
    }
    
    if (!newSegment.name) {
      toast({
        title: "Error",
        description: "Please select a segment",
        variant: "destructive"
      });
      return;
    }

    // Check if segment is already added
    if (segments.some(seg => seg.name === newSegment.name)) {
      toast({
        title: "Error",
        description: "This segment has already been added",
        variant: "destructive"
      });
      return;
    }

    // Find the selected segment from available segments to get its actual values
    const selectedSegment = availableSegments.find(seg => seg.segment_name === newSegment.name);
    
    if (!selectedSegment) {
      toast({
        title: "Error",
        description: "Selected segment not found",
        variant: "destructive"
      });
      return;
    }

    // Add segment locally without API call (we'll save all at once)
    const newSegmentData: Segment = {
      id: Date.now().toString(),
      name: selectedSegment.segment_name,
      value: selectedSegment.segment_code, // Use actual segment code from database
      length: 5 // Fixed length
    };
    
    setSegments([...segments, newSegmentData]);
    setNewSegment({ name: "" });
    
    toast({
      title: "Success",
      description: "Segment added successfully",
    });
  };

  const handleRemoveSegment = (id: string) => {
    setSegments(segments.filter(segment => segment.id !== id));
    toast({
      title: "Success",
      description: "Segment removed successfully",
    });
  };

  const handleCreateSegment = async () => {
    // Validate required fields
    if (!segmentFormData.id || !segmentFormData.code || !segmentFormData.name || !segmentFormData.type) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (ID, Code, Name, and Type)",
        variant: "destructive"
      });
      return;
    }

    // Validate code must be exactly 5 digits
    if (!/^\d{5}$/.test(segmentFormData.code)) {
      toast({
        title: "Error",
        description: "Code must be exactly 5 digits",
        variant: "destructive"
      });
      return;
    }

    // Check if trying to create a primary segment for a type that already has one
    if (segmentFormData.is_primary && segmentFormData.type) {
      const existingPrimarySegment = availableSegments.find(
        segment => 
          segment.segment_type === segmentFormData.type &&
          (segment.is_primary === true || segment.is_primary === 1)
      );
      
      if (existingPrimarySegment) {
        toast({
          title: "Error",
          description: `A primary segment already exists for type "${segmentFormData.type}". Only one primary segment is allowed per type.`,
          variant: "destructive"
        });
        return;
      }
    }

    try {
      const requestData = {
        segment_id: segmentFormData.id,
        segment_code: segmentFormData.code,
        segment_name: segmentFormData.name,
        segment_type: segmentFormData.type,
        segment_use: segmentFormData.description || null,
        is_primary: segmentFormData.is_primary,
        status: 'ACTIVE',
        created_by: 1 // TODO: Replace with actual user ID from auth context
      };

      const response = await fetch(`${API_BASE_URL}/chart-of-accounts/segments/instances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Segment created successfully",
        });

        // Reset form
        setSegmentFormData({
          id: "",
          code: "",
          name: "",
          type: "",
          description: "",
          is_primary: false
        });

        await fetchAccountingSegments();
      } else {
        throw new Error(result.error || 'Failed to create segment');
      }
    } catch (error) {
      console.error('Error creating segment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create segment",
        variant: "destructive"
      });
    }
  };

  const handleViewCoA = (coa: CoAData) => {
    setViewingCoA(coa);
    setShowViewModal(true);
  };

  const handleEditCoA = (coa: CoAData) => {
    setEditingCoA(coa);
    setCoaName(coa.coa_name);
    setDescription(coa.description || "");
    
    // Extract segments from the CoA data
    const coaSegments: Segment[] = [];
    [
      { name: coa.segment_1_name, value: coa.segment_1_value },
      { name: coa.segment_2_name, value: coa.segment_2_value },
      { name: coa.segment_3_name, value: coa.segment_3_value },
      { name: coa.segment_4_name, value: coa.segment_4_value },
      { name: coa.segment_5_name, value: coa.segment_5_value }
    ].forEach((seg, idx) => {
      if (seg.name && seg.name !== 'None') {
        coaSegments.push({
          id: `${coa.id}-${idx}`,
          name: seg.name,
          value: seg.value,
          length: coa.segment_length || 5
        });
      }
    });
    
    setSegments(coaSegments);
    setShowForm(true);
  };

  const handleCreateCoA = async () => {
    if (!coaName) {
      toast({
        title: "Error",
        description: "Please enter CoA Name",
        variant: "destructive"
      });
      return;
    }

    if (segments.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one segment",
        variant: "destructive"
      });
      return;
    }

    try {
      // Fill remaining segments with "None" if less than 5
      const allSegments = [...segments];
      while (allSegments.length < 5) {
        allSegments.push({
          id: `none-${allSegments.length}`,
          name: "None",
          value: "00000",
          length: 5
        });
      }

      // Prepare data for the new 5-column structure
      // Ensure all values are explicitly set (no undefined) - use null for missing values
      const requestData: {
        coa_name: string | null;
        description: string | null;
        segment_1_name: string | null;
        segment_1_value: string;
        segment_2_name: string | null;
        segment_2_value: string;
        segment_3_name: string | null;
        segment_3_value: string;
        segment_4_name: string | null;
        segment_4_value: string;
        segment_5_name: string | null;
        segment_5_value: string;
        segment_length: number;
        status?: string;
        created_by?: number;
      } = {
        coa_name: coaName || null,
        description: description || null,
        segment_1_name: (allSegments[0]?.name && allSegments[0].name !== 'None') ? allSegments[0].name : null,
        segment_1_value: allSegments[0]?.value || '00000',
        segment_2_name: (allSegments[1]?.name && allSegments[1].name !== 'None') ? allSegments[1].name : null,
        segment_2_value: allSegments[1]?.value || '00000',
        segment_3_name: (allSegments[2]?.name && allSegments[2].name !== 'None') ? allSegments[2].name : null,
        segment_3_value: allSegments[2]?.value || '00000',
        segment_4_name: (allSegments[3]?.name && allSegments[3].name !== 'None') ? allSegments[3].name : null,
        segment_4_value: allSegments[3]?.value || '00000',
        segment_5_name: (allSegments[4]?.name && allSegments[4].name !== 'None') ? allSegments[4].name : null,
        segment_5_value: allSegments[4]?.value || '00000',
        segment_length: 5
      };

      // Only add status for new entries, don't send it for updates
      if (!editingCoA) {
        requestData.status = 'ACTIVE';
        requestData.created_by = 1;
      }

      let url = `${API_BASE_URL}/chart-of-accounts/segments`;
      let method = 'POST';
      
      // If editing, use PUT method with ID
      if (editingCoA) {
        url = `${API_BASE_URL}/chart-of-accounts/segments/${editingCoA.id}`;
        method = 'PUT';
      }

      // Send request
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: editingCoA 
            ? "Chart of Accounts updated successfully" 
            : "Chart of Accounts created successfully with 5 segments",
        });
        
        // Reset form
        setCoaName("");
        setDescription("");
        setSegments([]);
        setEditingCoA(null);
        setShowForm(false);
        await fetchCoAs(); // Refresh to show all CoAs from database
        await fetchCoAInstances(); // Refresh instances in case any were affected
      } else {
        throw new Error(result.error || 'Failed to save CoA');
      }
    } catch (error) {
      console.error('Error saving CoA:', error);
      toast({
        title: "Error",
        description: editingCoA 
          ? "Failed to update Chart of Accounts" 
          : "Failed to create Chart of Accounts",
        variant: "destructive"
      });
    }
  };

  const handleCreateInstance = async () => {
    if (!newInstanceData.coa_code || !newInstanceData.coa_name) {
      toast({
        title: "Error",
        description: "Please fill in CoA Code and CoA Name",
        variant: "destructive"
      });
      return;
    }

    if (!selectedCoAStructure) {
      toast({
        title: "Error",
        description: "Please select a Chart of Accounts structure",
        variant: "destructive"
      });
      return;
    }

    try {
      // Extract segments from the selected structure
      const instanceSegments: Segment[] = [];
      [
        { name: selectedCoAStructure.segment_1_name, value: selectedCoAStructure.segment_1_value },
        { name: selectedCoAStructure.segment_2_name, value: selectedCoAStructure.segment_2_value },
        { name: selectedCoAStructure.segment_3_name, value: selectedCoAStructure.segment_3_value },
        { name: selectedCoAStructure.segment_4_name, value: selectedCoAStructure.segment_4_value },
        { name: selectedCoAStructure.segment_5_name, value: selectedCoAStructure.segment_5_value }
      ].forEach((seg, idx) => {
        if (seg.name && seg.name !== 'None') {
          instanceSegments.push({
            id: `${selectedCoAStructure.id}-${idx}`,
            name: seg.name,
            value: seg.value || '00000',
            length: selectedCoAStructure.segment_length || 5
          });
        }
      });

      const requestData = {
        coa_code: newInstanceData.coa_code,
        coa_name: newInstanceData.coa_name,
        description: newInstanceData.description || null,
        segments: instanceSegments.map((seg, idx) => ({
          name: seg.name,
          length: seg.length,
          display_order: idx
        })),
        created_by: 1
      };

      const response = await fetch(`${API_BASE_URL}/chart-of-accounts/instances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "CoA Instance created successfully",
        });
        
        // Reset form
        setNewInstanceData({ coa_code: "", coa_name: "", description: "" });
        setSelectedCoAStructure(null);
        setShowInstanceForm(false);
        await fetchCoAInstances();
      } else {
        throw new Error(result.error || 'Failed to create CoA instance');
      }
    } catch (error) {
      console.error('Error creating CoA instance:', error);
      toast({
        title: "Error",
        description: "Failed to create CoA Instance",
        variant: "destructive"
      });
    }
  };

  // Fetch header assignments from API
  const fetchHeaderAssignments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/chart-of-accounts/header-assignments`);
      const result = await response.json();
      
      if (result.success && result.data) {
        // Map backend data to frontend structure
        const mappedAssignments = result.data.map((ha: {
          id: number;
          header_id: string;
          coa_name?: string;
          coa_code?: string;
          ledgers?: { ledger_name: string }[];
          modules?: string[];
          validation_rules?: Record<string, boolean>;
        }) => ({
          id: ha.id.toString(),
          headerId: ha.header_id,
          coaInstance: ha.coa_name || ha.coa_code,
          assignedLedgers: ha.ledgers?.map((l: { ledger_name: string }) => l.ledger_name) || [],
          financialModules: ha.modules || [],
          validationRules: Object.keys(ha.validation_rules || {}).filter(key => ha.validation_rules?.[key])
        }));
        setHeaderAssignments(mappedAssignments);
      }
    } catch (error) {
      console.error('Error fetching header assignments:', error);
    }
  };

  const handleCreateHeaderAssignment = async () => {
    if (!newHeaderAssignment.headerId || !newHeaderAssignment.coaInstance) {
      toast({
        title: "Error",
        description: "Please fill in required fields (Header ID and CoA Instance)",
        variant: "destructive"
      });
      return;
    }

    try {
      // Find the CoA instance ID
      const selectedCoA = coaInstances.find(
        (instance) => instance.coa_name === newHeaderAssignment.coaInstance
      );

      if (!selectedCoA) {
        toast({
          title: "Error",
          description: "Selected CoA Instance not found",
          variant: "destructive"
        });
        return;
      }

      // Map module names to backend format
      const moduleMapping: { [key: string]: string } = {
        "Receivables (AR)": "AR",
        "Payables (AP)": "AP",
        "Journal Vouchers (JV)": "JV"
      };

      const module_types = newHeaderAssignment.financialModules.map(
        (m) => moduleMapping[m] || m
      );

      // Map validation rules to backend format
      const validation_rules = {
        enforce_segment_qualifiers: newHeaderAssignment.validationRules.includes("Enforce Segment Qualifiers"),
        allow_dynamic_inserts: newHeaderAssignment.validationRules.includes("Allow Dynamic Inserts")
      };

      // Get ledger IDs
      const ledger_ids = newHeaderAssignment.assignedLedgers.map((ledgerName) => {
        const ledger = ledgers.find((l) => l.ledger_name === ledgerName);
        return ledger?.id;
      }).filter((id): id is number => id !== undefined);

      const response = await fetch(`${API_BASE_URL}/chart-of-accounts/header-assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          header_id: newHeaderAssignment.headerId,
          header_name: `Header ${newHeaderAssignment.headerId}`,
          coa_instance_id: selectedCoA.id,
          ledger_ids,
          module_types,
          validation_rules,
          created_by: 1
        }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchHeaderAssignments(); // Refresh the list
        setNewHeaderAssignment({
          headerId: "",
          coaInstance: "",
          assignedLedgers: [],
          financialModules: [],
          validationRules: []
        });
        setShowHeaderAssignmentForm(false);
        toast({
          title: "Success",
          description: "Header assignment created successfully",
        });
      } else {
        throw new Error(result.error || 'Failed to create header assignment');
      }
    } catch (error) {
      console.error('Error creating header assignment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create header assignment",
        variant: "destructive"
      });
    }
  };

  const formatPreview = segments.map(s => s.name.substring(0, 3).toUpperCase()).join("-");

  return (
    <div className="space-y-6">
      {/* Tile Navigation (shown when no section is active) */}
      {!activeSection && (
        <div className="space-y-6">
          <div className="grid h-auto w-full gap-4 text-gray-900 sm:grid-cols-2 xl:grid-cols-3">
            {/* Structure Definition Tile */}
            <button
              onClick={() => setActiveSection('structure-definition')}
              className="group relative flex h-full w-full flex-col items-start gap-3 rounded-2xl border border-transparent bg-white/70 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors bg-blue-100 text-blue-600 group-data-[state=active]:bg-blue-500 group-data-[state=active]:text-white">
                <FileText className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-900">Structure Definition</p>
                <p className="text-xs text-gray-500">Configure Chart of Accounts structures and segments</p>
              </div>
            </button>

            {/* Instances & Assignments Tile */}
            <button
              onClick={() => setActiveSection('instances-assignments')}
              className="group relative flex h-full w-full flex-col items-start gap-3 rounded-2xl border border-transparent bg-white/70 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300 focus-visible:ring-offset-2"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors bg-emerald-100 text-emerald-600 group-data-[state=active]:bg-emerald-500 group-data-[state=active]:text-white">
                <Layers className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-900">Instances & Assignments</p>
                <p className="text-xs text-gray-500">Create CoA instances and manage ledger assignments</p>
              </div>
            </button>

            {/* Header Assignments Tile */}
            <button
              onClick={() => setActiveSection('header-assignments')}
              className="group relative flex h-full w-full flex-col items-start gap-3 rounded-2xl border border-transparent bg-white/70 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors bg-purple-100 text-purple-600 group-data-[state=active]:bg-purple-500 group-data-[state=active]:text-white">
                <Link2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-900">Header Assignments</p>
                <p className="text-xs text-gray-500">Assign Chart of Accounts headers to ledgers and modules</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Content Sections */}
      {activeSection && (
        <Card className="bg-white shadow-lg">
          <CardContent className="p-6">
            

            <div className="space-y-6">

            {/* Structure Definition Section */}
            {activeSection === 'structure-definition' && (
              <div className="space-y-6">
              <Tabs
                value={structureTab}
                onValueChange={(value) => setStructureTab(value as 'chart-of-accounts' | 'segments')}
                className="space-y-6"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="chart-of-accounts">Chart of Accounts</TabsTrigger>
                  <TabsTrigger value="segments">Segments</TabsTrigger>
                </TabsList>

                <TabsContent value="chart-of-accounts" className="space-y-6">
                  {!showForm && (
                    <div className="flex justify-end">
                      <Button
                        onClick={() => {
                          setEditingCoA(null);
                          setCoaName("");
                          setDescription("");
                          setSegments([]);
                          setShowForm(true);
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Chart of Account
                      </Button>
                    </div>
                  )}

                  <Dialog
                    open={showForm}
                    onOpenChange={(open) => {
                      if (!open) {
                        setShowForm(false);
                        setEditingCoA(null);
                        setCoaName("");
                        setDescription("");
                        setSegments([]);
                      } else {
                        setShowForm(true);
                      }
                    }}
                  >
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingCoA ? 'Edit Chart of Accounts' : 'Create Chart of Accounts'}</DialogTitle>
                        <DialogDescription>
                          {editingCoA
                            ? 'Update the structure of your Chart of Accounts'
                            : 'Define the structure of your Chart of Accounts by adding segments'}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="coa-name">CoA Name *</Label>
                            <Input
                              id="coa-name"
                              value={coaName}
                              onChange={(e) => setCoaName(e.target.value)}
                              placeholder="Enter CoA Name"
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor="description">Description</Label>
                            <textarea
                              id="description"
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder="Enter Description"
                              className="mt-1 w-full p-3 border border-gray-300 rounded-md resize-none"
                              rows={3}
                            />
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold mb-4">Segments</h3>
                            
                            {/* Current Segments */}
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-gray-700">
                                  {segments.length}/5 Segments Added
                                </p>
                              </div>
                              {segments.map((segment) => (
                                <div key={segment.id} className="flex items-center gap-2">
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    {segment.name}: {segment.value}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveSegment(segment.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                              {segments.length === 0 && (
                                <p className="text-sm text-gray-500 italic">No segments added yet. Add up to 5 segments.</p>
                              )}
                              {segments.length > 0 && (
                                <p className="text-sm text-gray-600">Preview: {formatPreview}</p>
                              )}
                            </div>

                            {/* Add New Segment */}
                            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                              <h4 className="font-medium">Add New Segment</h4>
                              <div className="flex gap-4 items-end">
                                <div className="flex-1">
                                  <Label htmlFor="segment-name">Select Segment *</Label>
                                  <Select
                                    value={newSegment.name}
                                    onValueChange={(value) => setNewSegment({ name: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a segment type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableSegments.map((segment) => (
                                        <SelectItem 
                                          key={segment.segment_id} 
                                          value={segment.segment_name}
                                          disabled={segments.some(s => s.name === segment.segment_name)}
                                        >
                                          <div className="flex flex-col">
                                            <span className="font-medium">{segment.segment_name}</span>
                                            <span className="text-xs text-gray-500">{segment.segment_type}</span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Button 
                                    onClick={handleAddSegment} 
                                    className="bg-green-600 hover:bg-green-700"
                                    disabled={segments.length >= 5 || !newSegment.name}
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add
                                  </Button>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600">
                                * Select accounting segments to include in your Chart of Accounts. Maximum 5 segments allowed.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowForm(false);
                            setEditingCoA(null);
                            setCoaName("");
                            setDescription("");
                            setSegments([]);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleCreateCoA} className="bg-green-600 hover:bg-green-700">
                          {editingCoA ? 'Update Chart of Accounts' : 'Create Chart of Accounts'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Chart of Accounts Table */}
                  <Card className="bg-white shadow-lg">
                    <CardHeader>
                      <CardTitle>Chart of Accounts</CardTitle>
                      <CardDescription>
                        View all created Chart of Accounts and their segments
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading...</div>
                      ) : coaList.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No Chart of Accounts created yet. Click "Create Chart of Account" to get started.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>CoA Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Segments</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {coaList.map((coa) => {
                                // Extract segments that are not "None"
                                const coaSegments = [
                                  { name: coa.segment_1_name, value: coa.segment_1_value },
                                  { name: coa.segment_2_name, value: coa.segment_2_value },
                                  { name: coa.segment_3_name, value: coa.segment_3_value },
                                  { name: coa.segment_4_name, value: coa.segment_4_value },
                                  { name: coa.segment_5_name, value: coa.segment_5_value }
                                ].filter(s => s.name && s.name !== 'None');
                                
                                return (
                                  <TableRow key={coa.id}>
                                    <TableCell className="font-medium">{coa.coa_name}</TableCell>
                                    <TableCell className="text-gray-600">
                                      {coa.description || '-'}
                                    </TableCell>
                                    <TableCell>
                                      {(() => {
                                        // Get all 5 segment values, using "00000" for empty/null ones
                                        const segmentCodes = [
                                          coa.segment_1_value || '00000',
                                          coa.segment_2_value || '00000',
                                          coa.segment_3_value || '00000',
                                          coa.segment_4_value || '00000',
                                          coa.segment_5_value || '00000'
                                        ];
                                        
                                        // Display codes separated by commas
                                        return (
                                          <span className="text-sm font-mono">
                                            {segmentCodes.join(', ')}
                                          </span>
                                        );
                                      })()}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleViewCoA(coa)}
                                          className="h-8 w-8 p-0 hover:bg-green-100"
                                          title="View Chart of Account"
                                        >
                                          <Eye className="w-4 h-4 text-green-600" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEditCoA(coa)}
                                          className="h-8 w-8 p-0 hover:bg-blue-100"
                                          title="Edit Chart of Account"
                                        >
                                          <Edit className="w-4 h-4 text-blue-600" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* View Chart of Account Dialog */}
                  <Dialog open={showViewModal} onOpenChange={(open) => {
                    if (!open) {
                      setShowViewModal(false);
                      setViewingCoA(null);
                    } else {
                      setShowViewModal(true);
                    }
                  }}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Chart of Account Details</DialogTitle>
                        <DialogDescription>
                          View complete information about this Chart of Account
                        </DialogDescription>
                      </DialogHeader>
                      {viewingCoA && (
                        <div className="space-y-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basic Information */}
                            <div className="space-y-4">
                              <div>
                                <Label className="text-sm font-medium text-gray-600">CoA Name</Label>
                                <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                                  <span className="text-gray-900 font-medium">{viewingCoA.coa_name}</span>
                                </div>
                              </div>
                              
                              <div>
                                <Label className="text-sm font-medium text-gray-600">Description</Label>
                                <div className="mt-1 p-3 bg-gray-50 rounded-md border min-h-[60px]">
                                  <span className="text-gray-900">
                                    {viewingCoA.description || 'No description provided'}
                                  </span>
                                </div>
                              </div>

                              <div>
                                <Label className="text-sm font-medium text-gray-600">Segment Length</Label>
                                <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                                  <span className="text-gray-900">{viewingCoA.segment_length}</span>
                                </div>
                              </div>
                            </div>

                            {/* Additional Information */}
                            <div className="space-y-4">
                              <div>
                                <Label className="text-sm font-medium text-gray-600">Created At</Label>
                                <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                                  <span className="text-gray-900">
                                    {new Date(viewingCoA.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Segments Section */}
                          <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold mb-4">Segments</h3>
                            <div className="space-y-3">
                              {[
                                { name: viewingCoA.segment_1_name, value: viewingCoA.segment_1_value, num: 1 },
                                { name: viewingCoA.segment_2_name, value: viewingCoA.segment_2_value, num: 2 },
                                { name: viewingCoA.segment_3_name, value: viewingCoA.segment_3_value, num: 3 },
                                { name: viewingCoA.segment_4_name, value: viewingCoA.segment_4_value, num: 4 },
                                { name: viewingCoA.segment_5_name, value: viewingCoA.segment_5_value, num: 5 }
                              ].map((seg, idx) => (
                                seg.name && seg.name !== 'None' && (
                                  <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-medium text-gray-900">
                                          Segment {seg.num}: {seg.name}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">Value: {seg.value}</p>
                                      </div>
                                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                                        Length: {viewingCoA.segment_length}
                                      </Badge>
                                    </div>
                                  </div>
                                )
                              ))}
                              {[
                                { name: viewingCoA.segment_1_name, value: viewingCoA.segment_1_value },
                                { name: viewingCoA.segment_2_name, value: viewingCoA.segment_2_value },
                                { name: viewingCoA.segment_3_name, value: viewingCoA.segment_3_value },
                                { name: viewingCoA.segment_4_name, value: viewingCoA.segment_4_value },
                                { name: viewingCoA.segment_5_name, value: viewingCoA.segment_5_value }
                              ].filter(s => s.name && s.name !== 'None').length === 0 && (
                                <div className="text-center py-8 text-gray-400">
                                  No segments defined
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      <DialogFooter>
                        <Button
                          onClick={() => setShowViewModal(false)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Close
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TabsContent>

                <TabsContent value="segments" className="space-y-6">
                  <div className="space-y-6">
                    <div className="flex justify-end">
                      <Button
                        onClick={() => setShowSegmentForm(true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Segment
                      </Button>
                    </div>

                    <Dialog open={showSegmentForm} onOpenChange={(open) => {
                      if (!open) {
                        setShowSegmentForm(false);
                        setSegmentFormData({
                          id: "",
                          code: "",
                          name: "",
                          type: "",
                          description: "",
                          is_primary: false
                        });
                      } else {
                        setShowSegmentForm(true);
                      }
                    }}>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Create Segment</DialogTitle>
                          <DialogDescription>
                            Define a new segment with its properties
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="segment-id">ID *</Label>
                              <Input
                                id="segment-id"
                                value={segmentFormData.id}
                                onChange={(e) => setSegmentFormData({ ...segmentFormData, id: e.target.value })}
                                placeholder="Enter segment ID"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="segment-code">Code * (5 digits only)</Label>
                              <Input
                                id="segment-code"
                                type="text"
                                value={segmentFormData.code}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  // Only allow digits and limit to 5 characters
                                  if (value === '' || /^\d{0,5}$/.test(value)) {
                                    setSegmentFormData({ ...segmentFormData, code: value });
                                  }
                                }}
                                placeholder="Enter 5-digit code"
                                className="mt-1"
                                maxLength={5}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="segment-name-field">Name *</Label>
                              <Input
                                id="segment-name-field"
                                value={segmentFormData.name}
                                onChange={(e) => setSegmentFormData({ ...segmentFormData, name: e.target.value })}
                                placeholder="Enter segment name"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="segment-type">Type *</Label>
                              <Select
                                value={segmentFormData.type}
                                onValueChange={(value) => setSegmentFormData({ ...segmentFormData, type: value })}
                              >
                                <SelectTrigger id="segment-type" className="mt-1">
                                  <SelectValue placeholder="Select segment type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ASSETS">Assets</SelectItem>
                                  <SelectItem value="LIABILITIES">Liabilities</SelectItem>
                                  <SelectItem value="EQUITY">Equity</SelectItem>
                                  <SelectItem value="REVENUE">Revenue</SelectItem>
                                  <SelectItem value="EXPENSE">Expense</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="segment-description">Use</Label>
                            <textarea
                              id="segment-description"
                              value={segmentFormData.description}
                              onChange={(e) => setSegmentFormData({ ...segmentFormData, description: e.target.value })}
                              placeholder="Enter use for this segment"
                              className="mt-1 w-full p-3 border border-gray-300 rounded-md resize-none"
                              rows={4}
                            />
                          </div>

                          <div className="flex items-center space-x-3">
                            <Checkbox
                              id="segment-primary"
                              checked={segmentFormData.is_primary}
                              disabled={
                                segmentFormData.type !== "" &&
                                availableSegments.some(
                                  segment =>
                                    segment.segment_type === segmentFormData.type &&
                                    (segment.is_primary === true || segment.is_primary === 1)
                                )
                              }
                              onCheckedChange={(checked) =>
                                setSegmentFormData({ ...segmentFormData, is_primary: Boolean(checked) })
                              }
                            />
                            <Label htmlFor="segment-primary" className="text-sm font-medium text-gray-700">
                              Set as Primary Segment
                            </Label>
                          </div>
                          {segmentFormData.type !== "" &&
                            availableSegments.some(
                              segment =>
                                segment.segment_type === segmentFormData.type &&
                                (segment.is_primary === true || segment.is_primary === 1)
                            ) ? (
                            <p className="text-xs text-red-600 ml-7">
                              A primary segment already exists for type "{segmentFormData.type}". Only one primary segment is allowed per type.
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500 ml-7">
                              Primary segments are used as default for account creation.
                            </p>
                          )}

                          <div className="flex justify-end">
                            <Button onClick={handleCreateSegment} className="bg-green-600 hover-bg-green-700">
                              Create Segment
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Card className="bg-white shadow-lg">
                      <CardHeader>
                        <CardTitle>Segment Library</CardTitle>
                        <CardDescription>All segments available for structure definitions</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {availableSegments.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            No segments created yet. Add your first segment using the button above.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Segment ID</TableHead>
                                  <TableHead>Code</TableHead>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Use</TableHead>
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {availableSegments.map((segment) => (
                                  <TableRow key={segment.segment_id}>
                                    <TableCell className="font-medium">{segment.segment_id}</TableCell>
                                    <TableCell>{segment.segment_code}</TableCell>
                                    <TableCell>{segment.segment_name}</TableCell>
                                    <TableCell>{segment.segment_type}</TableCell>
                                    <TableCell className="text-gray-600">{segment.segment_use || '-'}</TableCell>
                                    <TableCell>
                                      <Badge className={segment.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                        {segment.status}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
              </div>
            )}

            {/* Instances & Assignments Section */}
            {activeSection === 'instances-assignments' && (
              <div className="space-y-6">
                {/* Header with Create Button */}
                <div className="flex items-center justify-between">
                  <div>
              <h3 className="text-lg font-semibold">CoA Instances & Assignments</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Create instances from Chart of Accounts structures and manage ledger assignments
                    </p>
                  </div>
                  {!showInstanceForm && (
                    <Button 
                      onClick={() => {
                        if (coaList.length === 0) {
                          toast({
                            title: "No Structures Available",
                            description: "Please create a Chart of Accounts structure first",
                            variant: "destructive"
                          });
                          return;
                        }
                        setShowInstanceForm(true);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Instance
                    </Button>
                  )}
                </div>

                {/* Create Instance Form Dialog */}
                <Dialog open={showInstanceForm} onOpenChange={(open) => {
                  if (!open) {
                    setShowInstanceForm(false);
                    setNewInstanceData({ coa_code: "", coa_name: "", description: "" });
                    setSelectedCoAStructure(null);
                  } else {
                    setShowInstanceForm(true);
                  }
                }}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create CoA Instance</DialogTitle>
                      <DialogDescription>
                        Create a new instance from an existing Chart of Accounts structure
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="coa-structure">Select Chart of Accounts Structure *</Label>
                        <Select 
                          value={selectedCoAStructure?.id.toString() || ""}
                          onValueChange={(value) => {
                            const selected = coaList.find(coa => coa.id.toString() === value);
                            setSelectedCoAStructure(selected || null);
                            if (selected) {
                              setNewInstanceData({
                                ...newInstanceData,
                                coa_name: selected.coa_name || ""
                              });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a Chart of Accounts structure" />
                          </SelectTrigger>
                          <SelectContent>
                            {coaList.map((coa) => (
                              <SelectItem key={coa.id} value={coa.id.toString()}>
                                {coa.coa_name} {coa.description && `- ${coa.description}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedCoAStructure && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-md border">
                            <p className="text-sm text-gray-600 mb-2">Selected Structure Segments:</p>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { name: selectedCoAStructure.segment_1_name },
                                { name: selectedCoAStructure.segment_2_name },
                                { name: selectedCoAStructure.segment_3_name },
                                { name: selectedCoAStructure.segment_4_name },
                                { name: selectedCoAStructure.segment_5_name }
                              ].filter(s => s.name && s.name !== 'None').map((seg, idx) => (
                                <Badge key={idx} variant="secondary" className="bg-green-100 text-green-800">
                                  {seg.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="instance-code">CoA Instance Code *</Label>
                        <Input
                          id="instance-code"
                          value={newInstanceData.coa_code}
                          onChange={(e) => setNewInstanceData({ ...newInstanceData, coa_code: e.target.value })}
                          placeholder="e.g., COA-001"
                        />
                      </div>

                      <div>
                        <Label htmlFor="instance-name">CoA Instance Name *</Label>
                        <Input
                          id="instance-name"
                          value={newInstanceData.coa_name}
                          onChange={(e) => setNewInstanceData({ ...newInstanceData, coa_name: e.target.value })}
                          placeholder="e.g., Main Company CoA"
                        />
                      </div>

                      <div>
                        <Label htmlFor="instance-description">Description</Label>
                        <textarea
                          id="instance-description"
                          value={newInstanceData.description}
                          onChange={(e) => setNewInstanceData({ ...newInstanceData, description: e.target.value })}
                          placeholder="Enter description"
                          className="w-full p-3 border border-gray-300 rounded-md resize-none"
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setShowInstanceForm(false);
                          setNewInstanceData({ coa_code: "", coa_name: "", description: "" });
                          setSelectedCoAStructure(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleCreateInstance} className="bg-green-600 hover:bg-green-700">
                        Create Instance
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Available Chart of Accounts Structures */}
                <Card>
                  <CardHeader>
                    <CardTitle>Available Chart of Accounts Structures</CardTitle>
                    <CardDescription>
                      Structures available for creating instances
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8 text-gray-500">Loading...</div>
                    ) : coaList.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No Chart of Accounts structures available. Create one in the Structure Definition tab.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {coaList.map((coa) => {
                          const coaSegments = [
                            { name: coa.segment_1_name },
                            { name: coa.segment_2_name },
                            { name: coa.segment_3_name },
                            { name: coa.segment_4_name },
                            { name: coa.segment_5_name }
                          ].filter(s => s.name && s.name !== 'None');
                          
                          return (
                            <div key={coa.id} className="border rounded-lg p-4 bg-gray-50">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">{coa.coa_name}</h4>
                                  {coa.description && (
                                    <p className="text-sm text-gray-600 mt-1">{coa.description}</p>
                                  )}
                                </div>
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  ACTIVE
                                </Badge>
                              </div>
                              <div className="mt-3">
                                <p className="text-xs text-gray-500 mb-2">Segments ({coaSegments.length}):</p>
                                <div className="flex flex-wrap gap-1">
                                  {coaSegments.map((seg, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {seg.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Created CoA Instances */}
                <Card>
                  <CardHeader>
                    <CardTitle>Created CoA Instances</CardTitle>
                    <CardDescription>
                      Instances created from Chart of Accounts structures and their ledger assignments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {instancesLoading ? (
                      <div className="text-center py-8 text-gray-500">Loading instances...</div>
                    ) : coaInstances.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No instances created yet. Click "Create Instance" to create one from an available structure.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {coaInstances.map((instance) => {
                          const formatPreview = instance.segments 
                            ? instance.segments.map(s => s.name.substring(0, 3).toUpperCase()).join("-")
                            : "N/A";
                          
                          return (
                <Card key={instance.id} className="bg-gray-50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <CardTitle className="text-lg">{instance.coa_name}</CardTitle>
                                    <CardDescription>
                                      Code: {instance.coa_code} {instance.description && `• ${instance.description}`}
                                    </CardDescription>
                      </div>
                                  <Badge className={
                                    instance.status === 'ACTIVE' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-gray-100 text-gray-800'
                                  }>
                                    {instance.status}
                                  </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                                {instance.segments && instance.segments.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Segment Structure:</h4>
                      <div className="flex flex-wrap gap-2">
                                      {instance.segments.map((segment, idx) => (
                                        <Badge key={idx} variant="secondary" className="bg-green-100 text-green-800">
                                          {segment.name}: {segment.value}
                          </Badge>
                        ))}
                      </div>
                    </div>
                                )}
                    
                    <div>
                      <span className="font-medium">Format Preview: </span>
                                  <span className="text-gray-600">{formatPreview}</span>
                    </div>
                    
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="bg-white p-3 rounded-lg border">
                                    <p className="text-sm text-gray-600 mb-1">Assigned Ledgers</p>
                                    {instance.assignedLedgers && instance.assignedLedgers.length > 0 ? (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {instance.assignedLedgers.map((ledger, idx) => (
                                          <Badge key={idx} variant="outline" className="text-xs">
                                            {ledger}
                                          </Badge>
                                        ))}
                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-400">No ledgers assigned</p>
                                    )}
                      </div>
                                  <div className="bg-white p-3 rounded-lg border">
                                    <p className="text-sm text-gray-600 mb-1">Used By</p>
                                    {instance.usedBy && instance.usedBy.length > 0 ? (
                                      <p className="text-sm font-medium">{instance.usedBy.join(", ")}</p>
                                    ) : (
                                      <p className="text-sm text-gray-400">Not assigned to any modules</p>
                                    )}
                                  </div>
                                </div>

                                <div className="text-xs text-gray-500 pt-2 border-t">
                                  Created: {new Date(instance.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Header Assignments Section */}
            {activeSection === 'header-assignments' && (
              <div className="space-y-6">
                {/* Header with Search and Create Button */}
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search header assignments..."
                      value={headerAssignmentSearchTerm}
                      onChange={(e) => setHeaderAssignmentSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button 
                    onClick={() => setShowHeaderAssignmentForm(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Header Assignment
                  </Button>
              </div>

                {/* Header Assignments Table */}
                <Card className="bg-white shadow-lg">
                  <CardHeader>
                    <CardTitle>Header Assignments</CardTitle>
                    <CardDescription>
                      Assign Chart of Accounts headers to ledgers and financial modules
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      // Filter header assignments based on search term
                      const filteredAssignments = headerAssignments.filter((assignment) => {
                        const searchLower = headerAssignmentSearchTerm.toLowerCase();
                        return (
                          assignment.headerId.toLowerCase().includes(searchLower) ||
                          assignment.coaInstance.toLowerCase().includes(searchLower) ||
                          assignment.assignedLedgers.some(ledger => ledger.toLowerCase().includes(searchLower)) ||
                          assignment.financialModules.some(module => module.toLowerCase().includes(searchLower))
                        );
                      });

                      return filteredAssignments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          {headerAssignmentSearchTerm 
                            ? "No header assignments match your search criteria." 
                            : "No header assignments found. Create your first header assignment to get started."}
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Header ID</TableHead>
                                <TableHead>CoA Instance</TableHead>
                                <TableHead>Assigned Ledgers</TableHead>
                                <TableHead>Financial Modules</TableHead>
                                <TableHead>Validation Rules</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredAssignments.map((assignment) => (
                                <TableRow key={assignment.id}>
                                  <TableCell className="font-medium">{assignment.headerId}</TableCell>
                                  <TableCell>{assignment.coaInstance}</TableCell>
                                  <TableCell>
                                    {assignment.assignedLedgers.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {assignment.assignedLedgers.map((ledger, idx) => (
                                          <Badge key={idx} variant="outline" className="text-xs">
                                            {ledger}
                                          </Badge>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 text-sm">None</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {assignment.financialModules.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {assignment.financialModules.map((module, idx) => (
                                          <Badge key={idx} variant="secondary" className="text-xs">
                                            {module}
                                          </Badge>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 text-sm">None</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {assignment.validationRules.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {assignment.validationRules.map((rule, idx) => (
                                          <Badge key={idx} variant="outline" className="text-xs bg-blue-50">
                                            {rule}
                                          </Badge>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 text-sm">None</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Create Header Assignment Dialog */}
                <Dialog 
                  open={showHeaderAssignmentForm} 
                  onOpenChange={(open) => {
                    if (!open) {
                      setShowHeaderAssignmentForm(false);
                      setNewHeaderAssignment({
                        headerId: "",
                        coaInstance: "",
                        assignedLedgers: [],
                        financialModules: [],
                        validationRules: []
                      });
                    } else {
                      setShowHeaderAssignmentForm(true);
                    }
                  }}
                >
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create Header Assignment</DialogTitle>
                      <DialogDescription>
                        Assign Chart of Accounts headers to ledgers and financial modules
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                <div>
                  <Label htmlFor="header-id">Header ID *</Label>
                  <Input
                    id="header-id"
                    value={newHeaderAssignment.headerId}
                    onChange={(e) => setNewHeaderAssignment({ ...newHeaderAssignment, headerId: e.target.value })}
                    placeholder="HDR-001"
                          className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="coa-instance">CoA Instance *</Label>
                  <Select value={newHeaderAssignment.coaInstance} onValueChange={(value) => setNewHeaderAssignment({ ...newHeaderAssignment, coaInstance: value })}>
                          <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select CoA Instance" />
                    </SelectTrigger>
                    <SelectContent>
                      {coaInstances.map((instance) => (
                        <SelectItem key={instance.id} value={instance.coa_name}>{instance.coa_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Assign to Ledgers</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                    {ledgersLoading ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading ledgers...</span>
                      </div>
                    ) : ledgers.length === 0 ? (
                      <p className="text-sm text-gray-600">No ledgers available. Please create ledgers first.</p>
                    ) : (
                      <div className="space-y-2">
                        {ledgers.map((ledger) => (
                          <div key={ledger.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`ledger-${ledger.id}`}
                              checked={newHeaderAssignment.assignedLedgers.includes(ledger.ledger_name)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewHeaderAssignment({
                                    ...newHeaderAssignment,
                                    assignedLedgers: [...newHeaderAssignment.assignedLedgers, ledger.ledger_name]
                                  });
                                } else {
                                  setNewHeaderAssignment({
                                    ...newHeaderAssignment,
                                    assignedLedgers: newHeaderAssignment.assignedLedgers.filter(l => l !== ledger.ledger_name)
                                  });
                                }
                              }}
                            />
                            <Label htmlFor={`ledger-${ledger.id}`} className="cursor-pointer">
                              {ledger.ledger_name} ({ledger.ledger_type})
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                    <div>
                      <h4 className="font-medium mb-3">Financial Modules</h4>
                      <div className="flex gap-6">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="receivables"
                            checked={newHeaderAssignment.financialModules.includes("Receivables (AR)")}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNewHeaderAssignment({
                                  ...newHeaderAssignment,
                                  financialModules: [...newHeaderAssignment.financialModules, "Receivables (AR)"]
                                });
                              } else {
                                setNewHeaderAssignment({
                                  ...newHeaderAssignment,
                                  financialModules: newHeaderAssignment.financialModules.filter(m => m !== "Receivables (AR)")
                                });
                              }
                            }}
                          />
                          <Label htmlFor="receivables">Receivables (AR)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="payables"
                            checked={newHeaderAssignment.financialModules.includes("Payables (AP)")}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNewHeaderAssignment({
                                  ...newHeaderAssignment,
                                  financialModules: [...newHeaderAssignment.financialModules, "Payables (AP)"]
                                });
                              } else {
                                setNewHeaderAssignment({
                                  ...newHeaderAssignment,
                                  financialModules: newHeaderAssignment.financialModules.filter(m => m !== "Payables (AP)")
                                });
                              }
                            }}
                          />
                          <Label htmlFor="payables">Payables (AP)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="journal"
                            checked={newHeaderAssignment.financialModules.includes("Journal Vouchers (JV)")}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNewHeaderAssignment({
                                  ...newHeaderAssignment,
                                  financialModules: [...newHeaderAssignment.financialModules, "Journal Vouchers (JV)"]
                                });
                              } else {
                                setNewHeaderAssignment({
                                  ...newHeaderAssignment,
                                  financialModules: newHeaderAssignment.financialModules.filter(m => m !== "Journal Vouchers (JV)")
                                });
                              }
                            }}
                          />
                          <Label htmlFor="journal">Journal Vouchers (JV)</Label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Validation Rules</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="enforce-qualifiers"
                            checked={newHeaderAssignment.validationRules.includes("Enforce Segment Qualifiers")}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNewHeaderAssignment({
                                  ...newHeaderAssignment,
                                  validationRules: [...newHeaderAssignment.validationRules, "Enforce Segment Qualifiers"]
                                });
                              } else {
                                setNewHeaderAssignment({
                                  ...newHeaderAssignment,
                                  validationRules: newHeaderAssignment.validationRules.filter(r => r !== "Enforce Segment Qualifiers")
                                });
                              }
                            }}
                          />
                          <Label htmlFor="enforce-qualifiers">Enforce Segment Qualifiers</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="dynamic-inserts"
                            checked={newHeaderAssignment.validationRules.includes("Allow Dynamic Inserts")}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNewHeaderAssignment({
                                  ...newHeaderAssignment,
                                  validationRules: [...newHeaderAssignment.validationRules, "Allow Dynamic Inserts"]
                                });
                              } else {
                                setNewHeaderAssignment({
                                  ...newHeaderAssignment,
                                  validationRules: newHeaderAssignment.validationRules.filter(r => r !== "Allow Dynamic Inserts")
                                });
                              }
                            }}
                          />
                          <Label htmlFor="dynamic-inserts">Allow Dynamic Inserts</Label>
                        </div>
                      </div>
                    </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setShowHeaderAssignmentForm(false);
                          setNewHeaderAssignment({
                            headerId: "",
                            coaInstance: "",
                            assignedLedgers: [],
                            financialModules: [],
                            validationRules: []
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleCreateHeaderAssignment} className="bg-green-600 hover:bg-green-700">
                        Create Header Assignment
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

    export default ChartOfAccountSetup;
