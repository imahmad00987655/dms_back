import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Search, Edit, Eye, Users, Building2, UserCheck, Truck, X, ChevronsUpDown, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import apiService from '@/services/api';

// Import form components
import PartyForm from '@/components/forms/PartyForm';
import CustomerForm from '@/components/forms/CustomerForm';
import SupplierForm from '@/components/forms/SupplierForm';
import SiteForm from '@/components/forms/SiteForm';
import ContactForm from '@/components/forms/ContactForm';

// Types
interface Party {
  party_id: number;
  party_number: string;
  party_name: string;
  party_type: 'PERSON' | 'ORGANIZATION' | 'GROUP';
  tax_id?: string;
  website?: string;
  industry?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
  site_count: number;
  customer_profile_count: number;
  supplier_profile_count: number;
  created_at: string;
}

interface PartySite {
  site_id: number;
  party_id: number;
  site_name: string;
  site_type: 'BILL_TO' | 'SHIP_TO' | 'BOTH';
  address_line1?: string;
  address_line2?: string;
  address_line3?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  country_code?: string;
  phone?: string;
  fax?: string;
  email?: string;
  website?: string;
  contact_person?: string;
  contact_title?: string;
  contact_phone?: string;
  contact_email?: string;
  is_primary: boolean;
  is_active: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

interface SupplierSite {
  site_id: number;
  supplier_id: number;
  site_name: string;
  site_type: 'INVOICING' | 'PURCHASING' | 'BOTH';
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  contact_person?: string;
  is_primary: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

interface CustomerProfile {
  profile_id: number;
  party_id: number;
  party_no?: string;
  customer_number: string;
  customer_name: string; // Add customer_name field
  customer_type: 'INDIVIDUAL' | 'CORPORATE' | 'GOVERNMENT' | 'NON_PROFIT';
  customer_class?: string;
  customer_category?: string;
  credit_limit: number;
  credit_hold_flag: boolean;
  payment_terms_id: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  party_name: string;
  party_type: string;
  tax_id?: string;
  party_tax_id?: string;
  website?: string;
  industry?: string;
}

interface SupplierProfile {
  supplier_id: number;
  party_id: number;
  supplier_number: string;
  supplier_name: string; // Add supplier_name field
  supplier_type: 'VENDOR' | 'CONTRACTOR' | 'SERVICE_PROVIDER' | 'GOVERNMENT';
  supplier_class?: string;
  supplier_category?: string;
  credit_limit: number;
  hold_flag: boolean;
  payment_terms_id: number;
  currency_code: string;
  payment_method?: string;
  bank_account?: string;
  tax_id?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  created_at: string;
  updated_at: string;
  party_name?: string;
  party_type?: string;
  party_tax_id?: string;
  website?: string;
  industry?: string;
  party_no?: string;
}

interface ContactPoint {
  contact_point_id: number;
  party_id: number;
  contact_point_type: 'PHONE' | 'EMAIL' | 'FAX' | 'WEB' | 'MOBILE';
  contact_point_value: string;
  contact_point_purpose?: string;
  is_primary: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

export const CustomerSupplierManagement: React.FC = () => {
  // State
  const [parties, setParties] = useState<Party[]>([]);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierProfile[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierProfile | null>(null);
  const [partySites, setPartySites] = useState<PartySite[]>([]);
  const [customerSites, setCustomerSites] = useState<PartySite[]>([]); // Add customer sites state
  const [supplierSites, setSupplierSites] = useState<SupplierSite[]>([]); // Add supplier sites state
  const [contactPoints, setContactPoints] = useState<ContactPoint[]>([]);
  
  // Form states
  const [showPartyForm, setShowPartyForm] = useState(false);
  const [showSiteForm, setShowSiteForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  
  // Full-page form states
  const [currentView, setCurrentView] = useState<'list' | 'customer-form' | 'supplier-form'>('list');
  const [partyToEdit, setPartyToEdit] = useState<Party | null>(null);
  const [selectedSite, setSelectedSite] = useState<PartySite | SupplierSite | null>(null);
  const [selectedContact, setSelectedContact] = useState<ContactPoint | null>(null);
  const [customerToEdit, setCustomerToEdit] = useState<CustomerProfile | null>(null);
  const [supplierToEdit, setSupplierToEdit] = useState<SupplierProfile | null>(null);
  const [siteFormContext, setSiteFormContext] = useState<'party' | 'customer' | 'supplier'>('party'); // Add supplier to site form context
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingSites, setLoadingSites] = useState(false);
  const [loadingCustomerSites, setLoadingCustomerSites] = useState(false); // Add customer sites loading state
  const [loadingSupplierSites, setLoadingSupplierSites] = useState(false); // Add supplier sites loading state
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [partiesLoading, setPartiesLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Load data
  useEffect(() => {
    loadParties();
    loadCustomers();
    loadSuppliers();
  }, []);

  // Load customer sites when selectedCustomer changes
  useEffect(() => {
    if (selectedCustomer) {
      loadCustomerSites(selectedCustomer.profile_id);
    }
  }, [selectedCustomer]);

  // Load supplier sites when selectedSupplier changes
  useEffect(() => {
    if (selectedSupplier) {
      loadSupplierSites(selectedSupplier.supplier_id);
    }
  }, [selectedSupplier]);

  const loadParties = async () => {
    try {
      setPartiesLoading(true);
      const data = await apiService.getParties();
      // Ensure data is an array and handle different response formats
      if (Array.isArray(data)) {
        setParties(data);
      } else if (data && Array.isArray(data.data)) {
        setParties(data.data);
      } else {
        console.warn('Unexpected parties data format:', data);
        setParties([]);
      }
    } catch (error) {
      console.error('Error loading parties:', error);
      toast.error('Failed to load parties');
      setParties([]);
    } finally {
      setPartiesLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await apiService.getCustomers();
      console.log('🔍 Customers API response:', response);
      setCustomers(response || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
      setCustomers([]);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await apiService.getSuppliers();
      setSuppliers(response || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      toast.error('Failed to load suppliers');
      setSuppliers([]);
    }
  };

  const loadPartySites = async (partyId: number) => {
    try {
      setLoadingSites(true);
      const response = await apiService.getPartySites(partyId);
      if (response && response.data) {
        setPartySites(response.data || []);
      } else {
        setPartySites([]);
      }
    } catch (error) {
      console.error('Error loading party sites:', error);
      setPartySites([]);
    } finally {
      setLoadingSites(false);
    }
  };

  const loadCustomerSites = async (customerId: number) => {
    try {
      setLoadingCustomerSites(true);
      const response = await apiService.getCustomerSites(customerId);
      if (response && response.data) {
        setCustomerSites(response.data || []);
      } else {
        setCustomerSites([]);
      }
    } catch (error) {
      console.error('Error loading customer sites:', error);
      setCustomerSites([]);
    } finally {
      setLoadingCustomerSites(false);
    }
  };

  const loadSupplierSites = async (supplierId: number) => {
    try {
      setLoadingSupplierSites(true);
      const response = await apiService.getSupplierSites(supplierId);
      if (response && response.data) {
        setSupplierSites(response.data || []);
      } else {
        setSupplierSites([]);
      }
    } catch (error) {
      console.error('Error loading supplier sites:', error);
      setSupplierSites([]);
    } finally {
      setLoadingSupplierSites(false);
    }
  };

  const loadContactPoints = async (partyId: number) => {
    try {
      setLoadingContacts(true);
      const response = await apiService.getPartyContacts(partyId);
      console.log('🔍 Contacts API response:', response);
      setContactPoints(response.data || []);
    } catch (error) {
      console.error('Error loading contact points:', error);
      toast.error('Failed to load contact points');
      setContactPoints([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleEditParty = (party: Party) => {
    setPartyToEdit(party);
    setShowPartyForm(true);
  };



  const handleEditCustomer = (customer: CustomerProfile) => {
    setCustomerToEdit(customer);
    setCurrentView('customer-form');
  };



  const handleEditSupplier = (supplier: SupplierProfile) => {
    setSupplierToEdit(supplier);
    setCurrentView('supplier-form');
  };



  // Filter functions
  const filteredParties = parties.filter(party => {
    const matchesSearch = party.party_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         party.party_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (party.tax_id && party.tax_id.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || party.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || party.party_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.customer_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Helper function to get supplier display name
  const getSupplierDisplayName = (supplier: SupplierProfile) => {
    // Use supplier_name if available, otherwise fallback to supplier number
    return supplier.supplier_name || supplier.supplier_number;
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.supplier_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || supplier.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Status badge component
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      INACTIVE: { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800' },
      SUSPENDED: { variant: 'destructive' as const, className: 'bg-red-100 text-red-800' },
      PENDING: { variant: 'outline' as const, className: 'bg-yellow-100 text-yellow-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.INACTIVE;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    );
  };

  // Type badge component
  const getTypeBadge = (type: string) => {
    const typeConfig = {
      ORGANIZATION: { className: 'bg-blue-100 text-blue-800' },
      PERSON: { className: 'bg-purple-100 text-purple-800' },
      GROUP: { className: 'bg-orange-100 text-orange-800' }
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.ORGANIZATION;
    
    return (
      <Badge variant="outline" className={config.className}>
        {type}
      </Badge>
    );
  };

  // Handle full-page form views
  if (currentView === 'customer-form') {
    return (
      <CustomerForm 
        onClose={() => {
          setCurrentView('list');
          setCustomerToEdit(null);
        }} 
        onSuccess={() => {
          setCurrentView('list');
          setCustomerToEdit(null);
          loadCustomers();
          toast.success(customerToEdit ? 'Customer profile updated successfully' : 'Customer profile created successfully');
        }}
        customerToEdit={customerToEdit}
      />
    );
  }

  if (currentView === 'supplier-form') {
    return (
      <SupplierForm 
        onClose={() => {
          setCurrentView('list');
          setSupplierToEdit(null);
        }} 
        onSuccess={() => {
          setCurrentView('list');
          setSupplierToEdit(null);
          loadSuppliers();
          toast.success(supplierToEdit ? 'Supplier profile updated successfully' : 'Supplier profile created successfully');
        }}
        supplierToEdit={supplierToEdit}
      />
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer & Supplier Management</h1>
          <p className="text-muted-foreground">
            Manage customer and supplier parties, profiles, and contact information
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => {
            setPartyToEdit(null);
            setShowPartyForm(true);
          }} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            New Party
          </Button>
          <Button onClick={() => {
            setCustomerToEdit(null);
            setCurrentView('customer-form');
          }} variant="outline">
            <UserCheck className="w-4 h-4 mr-2" />
            New Customer
          </Button>
          <Button onClick={() => {
            setSupplierToEdit(null);
            setCurrentView('supplier-form');
          }} variant="outline">
            <Truck className="w-4 h-4 mr-2" />
            New Supplier
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name, number, or tax ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
                      <Select value={statusFilter} onValueChange={(value: string) => setStatusFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(value: string) => setTypeFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="ORGANIZATION">Organization</SelectItem>
              <SelectItem value="PERSON">Person</SelectItem>
              <SelectItem value="GROUP">Group</SelectItem>
            </SelectContent>
          </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="parties" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="parties" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Parties
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Suppliers
          </TabsTrigger>
        </TabsList>

        {/* Parties Tab */}
        <TabsContent value="parties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Party Profiles 
              </CardTitle>
            </CardHeader>
            <CardContent>
              {partiesLoading ? (
                <div className="text-center py-8">Loading parties...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Party Number</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Tax ID</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Profiles</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredParties.map((party) => (
                      <TableRow key={party.party_id}>
                        <TableCell className="font-medium">{party.party_number}</TableCell>
                        <TableCell>{party.party_name}</TableCell>
                        <TableCell>{getTypeBadge(party.party_type)}</TableCell>
                        <TableCell>{party.tax_id || '-'}</TableCell>
                        <TableCell>{party.industry || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {(() => {
                              const customerCount = party.customer_profile_count ?? customers.filter(c => c.party_id === party.party_id).length;
                              const supplierCount = party.supplier_profile_count ?? suppliers.filter(s => s.party_id === party.party_id).length;
                              return (
                                <>
                                  {customerCount > 0 && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700">C: {customerCount}</Badge>
                                  )}
                                  {supplierCount > 0 && (
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700">S: {supplierCount}</Badge>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(party.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedParty(party);
                                loadPartySites(party.party_id);
                                loadContactPoints(party.party_id);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditParty(party)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>

                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Customer Profiles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Credit Limit</TableHead>
                    <TableHead>Payment Terms</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.profile_id}>
                      <TableCell className="font-medium">{customer.customer_number}</TableCell>
                      <TableCell>{customer.customer_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {customer.customer_type}
                        </Badge>
                      </TableCell>
                      <TableCell>${customer.credit_limit.toLocaleString()}</TableCell>
                      <TableCell>{customer.payment_terms_id} days</TableCell>
                      <TableCell>{getStatusBadge(customer.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditCustomer(customer)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>

                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Supplier Profiles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Credit Limit</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.supplier_id}>
                      <TableCell className="font-medium">{supplier.supplier_number}</TableCell>
                      <TableCell>{getSupplierDisplayName(supplier)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {supplier.supplier_type}
                        </Badge>
                      </TableCell>
                      <TableCell>${supplier.credit_limit.toLocaleString()}</TableCell>
                      <TableCell>{supplier.payment_method || '-'}</TableCell>
                      <TableCell>{getStatusBadge(supplier.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedSupplier(supplier)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditSupplier(supplier)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>

                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Party Details Dialog */}
      {selectedParty && (
        <Dialog open={!!selectedParty} onOpenChange={() => setSelectedParty(null)}>
                  <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Party Details: {selectedParty.party_name}</DialogTitle>
            <p className="text-sm text-gray-600">
              View and manage details for {selectedParty.party_name} including sites and contact information.
            </p>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 min-h-0">
              {/* Party Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Party Number</label>
                    <p className="text-sm text-gray-600">{selectedParty.party_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <p className="text-sm text-gray-600">{selectedParty.party_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tax ID</label>
                    <p className="text-sm text-gray-600">{selectedParty.tax_id || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Industry</label>
                    <p className="text-sm text-gray-600">{selectedParty.industry || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Website</label>
                    <p className="text-sm text-gray-600">{selectedParty.website || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <div className="text-sm text-gray-600">{getStatusBadge(selectedParty.status)}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Party Sites */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Addresses & Sites
                    <Button size="sm" onClick={() => {
                      setSelectedSite(null);
                      setSiteFormContext('party');
                      setShowSiteForm(true);
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Site
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingSites ? (
                    <div className="text-center py-4">Loading sites...</div>
                  ) : partySites.length > 0 ? (
                    <div className="space-y-4">
                      {partySites.map((site) => (
                        <div key={site.site_id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{site.site_name}</h4>
                            <div className="flex items-center gap-2">
                              {site.is_primary && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  Primary
                                </Badge>
                              )}
                              <Badge variant="outline">{site.site_type}</Badge>
                              {getStatusBadge(site.status)}
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSite(site);
                                    setSiteFormContext('party');
                                    setShowSiteForm(true);
                                  }}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            {site.address_line1 && <p>{site.address_line1}</p>}
                            {site.address_line2 && <p>{site.address_line2}</p>}
                            {site.city && site.state && (
                              <p>{site.city}, {site.state} {site.postal_code}</p>
                            )}
                            {site.country && <p>{site.country}</p>}
                            {site.phone && <p>Phone: {site.phone}</p>}
                            {site.email && <p>Email: {site.email}</p>}
                            {site.contact_person && <p>Contact: {site.contact_person}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">No sites found</div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Points */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Contact Information
                    <Button size="sm" onClick={() => {
                      setSelectedContact(null);
                      setShowContactForm(true);
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Contact
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingContacts ? (
                    <div className="text-center py-4">Loading contacts...</div>
                  ) : contactPoints.length > 0 ? (
                    <div className="space-y-2">
                      {contactPoints.map((contact) => (
                        <div key={contact.contact_point_id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <span className="font-medium">{contact.contact_point_type}:</span>
                            <span className="ml-2">{contact.contact_point_value}</span>
                            {contact.contact_point_purpose && (
                              <span className="ml-2 text-sm text-gray-500">({contact.contact_point_purpose})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {contact.is_primary && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                Primary
                              </Badge>
                            )}
                            {getStatusBadge(contact.status)}
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedContact(contact);
                                  setShowContactForm(true);
                                }}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>

                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">No contact points found</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Customer Details Dialog */}
      {selectedCustomer && (
        <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
                  <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Customer Details: {selectedCustomer.customer_name}</DialogTitle>
            <p className="text-sm text-gray-600">
              View customer profile details for {selectedCustomer.customer_name}.
            </p>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 min-h-0">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Customer Name</label>
                    <p className="text-sm text-gray-600">{selectedCustomer.customer_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Customer Number</label>
                    <p className="text-sm text-gray-600">{selectedCustomer.customer_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Customer Type</label>
                    <p className="text-sm text-gray-600">{selectedCustomer.customer_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Customer Class</label>
                    <p className="text-sm text-gray-600">{selectedCustomer.customer_class || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Customer Category</label>
                    <p className="text-sm text-gray-600">{selectedCustomer.customer_category || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Credit Limit</label>
                    <p className="text-sm text-gray-600">${selectedCustomer.credit_limit.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Credit Hold Flag</label>
                    <p className="text-sm text-gray-600">{selectedCustomer.credit_hold_flag ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Payment Terms</label>
                    <p className="text-sm text-gray-600">{selectedCustomer.payment_terms_id} days</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tax ID</label>
                    <p className="text-sm text-gray-600">{selectedCustomer.tax_id || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <p className="text-sm text-gray-600">{getStatusBadge(selectedCustomer.status)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Party Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Party Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Party Name</label>
                    <p className="text-sm text-gray-600">{selectedCustomer.party_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Party Type</label>
                    <p className="text-sm text-gray-600">{selectedCustomer.party_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Party Tax ID</label>
                    <p className="text-sm text-gray-600">{selectedCustomer.party_tax_id || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Website</label>
                    <p className="text-sm text-gray-600">{selectedCustomer.website || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Industry</label>
                    <p className="text-sm text-gray-600">{selectedCustomer.industry || '-'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Sites */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Addresses & Sites
                    <Button size="sm" onClick={() => {
                      setSelectedSite(null);
                      setSiteFormContext('customer');
                      setShowSiteForm(true);
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Site
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingCustomerSites ? (
                    <div className="text-center py-4">Loading sites...</div>
                  ) : customerSites.length > 0 ? (
                    <div className="space-y-4">
                      {customerSites.map((site) => (
                        <div key={site.site_id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{site.site_name}</h4>
                            <div className="flex items-center gap-2">
                              {site.is_primary && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  Primary
                                </Badge>
                              )}
                              <Badge variant="outline">{site.site_type}</Badge>
                              {getStatusBadge(site.status)}
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSite(site);
                                    setSiteFormContext('customer');
                                    setShowSiteForm(true);
                                  }}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            {site.address_line1 && <p>{site.address_line1}</p>}
                            {site.address_line2 && <p>{site.address_line2}</p>}
                            {site.city && site.state && (
                              <p>{site.city}, {site.state} {site.postal_code}</p>
                            )}
                            {site.country && <p>{site.country}</p>}
                            {site.phone && <p>Phone: {site.phone}</p>}
                            {site.email && <p>Email: {site.email}</p>}
                            {site.contact_person && <p>Contact: {site.contact_person}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">No sites found</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Supplier Details Dialog */}
      {selectedSupplier && (
        <Dialog open={!!selectedSupplier} onOpenChange={() => setSelectedSupplier(null)}>
                  <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Supplier Details: {getSupplierDisplayName(selectedSupplier)}</DialogTitle>
            <p className="text-sm text-gray-600">
              View supplier profile details for {getSupplierDisplayName(selectedSupplier)}.
            </p>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 min-h-0">
              {/* Supplier Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Supplier Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Supplier Number</label>
                    <p className="text-sm text-gray-600">{selectedSupplier.supplier_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Supplier Name</label>
                    <p className="text-sm text-gray-600">{selectedSupplier.supplier_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Supplier Type</label>
                    <p className="text-sm text-gray-600">{selectedSupplier.supplier_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Supplier Class</label>
                    <p className="text-sm text-gray-600">{selectedSupplier.supplier_class || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Supplier Category</label>
                    <p className="text-sm text-gray-600">{selectedSupplier.supplier_category || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Credit Limit</label>
                    <p className="text-sm text-gray-600">${selectedSupplier.credit_limit.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Hold Flag</label>
                    <p className="text-sm text-gray-600">{selectedSupplier.hold_flag ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Payment Terms</label>
                    <p className="text-sm text-gray-600">{selectedSupplier.payment_terms_id} days</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Currency</label>
                    <p className="text-sm text-gray-600">{selectedSupplier.currency_code}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Payment Method</label>
                    <p className="text-sm text-gray-600">{selectedSupplier.payment_method || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Bank Account</label>
                    <p className="text-sm text-gray-600">{selectedSupplier.bank_account || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tax ID</label>
                    <p className="text-sm text-gray-600">{selectedSupplier.tax_id || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <p className="text-sm text-gray-600">{getStatusBadge(selectedSupplier.status)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Party Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Party Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Party Name</label>
                    <p className="text-sm text-gray-600">{selectedSupplier.party_name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Party Type</label>
                    <p className="text-sm text-gray-600">{selectedSupplier.party_type || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Party Tax ID</label>
                    <p className="text-sm text-gray-600">{selectedSupplier.party_tax_id || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Website</label>
                    <p className="text-sm text-gray-600">{selectedSupplier.website || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Industry</label>
                    <p className="text-sm text-gray-600">{selectedSupplier.industry || '-'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Supplier Sites */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Addresses & Sites
                    <Button size="sm" onClick={() => {
                      setSelectedSite(null);
                      setSiteFormContext('supplier');
                      setShowSiteForm(true);
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Site
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingSupplierSites ? (
                    <div className="text-center py-4">Loading sites...</div>
                  ) : supplierSites.length > 0 ? (
                    <div className="space-y-4">
                      {supplierSites.map((site) => (
                        <div key={site.site_id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{site.site_name}</h4>
                            <div className="flex items-center gap-2">
                              {site.is_primary && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  Primary
                                </Badge>
                              )}
                              <Badge variant="outline">{site.site_type}</Badge>
                              {getStatusBadge(site.status)}
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSite(site);
                                    setSiteFormContext('supplier');
                                    setShowSiteForm(true);
                                  }}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            {site.address_line1 && <p>{site.address_line1}</p>}
                            {site.address_line2 && <p>{site.address_line2}</p>}
                            {site.city && site.state && (
                              <p>{site.city}, {site.state} {site.postal_code}</p>
                            )}
                            {site.country && <p>{site.country}</p>}
                            {site.phone && <p>Phone: {site.phone}</p>}
                            {site.email && <p>Email: {site.email}</p>}
                            {site.contact_person && <p>Contact: {site.contact_person}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">No sites found</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Party Form Dialog */}
      <Dialog open={showPartyForm} onOpenChange={(open) => {
        setShowPartyForm(open);
        if (!open) {
          setPartyToEdit(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{partyToEdit ? 'Edit Party' : 'Create New Party (Customer/Supplier)'}</DialogTitle>
          </DialogHeader>
          <PartyForm 
            key={partyToEdit ? `edit-party-${partyToEdit.party_id}` : 'create-party'}
            onClose={() => {
              setShowPartyForm(false);
              setPartyToEdit(null);
            }} 
            onSuccess={() => {
              setShowPartyForm(false);
              setPartyToEdit(null);
              loadParties();
              toast.success(partyToEdit ? 'Party updated successfully' : 'Party created successfully');
            }}
            partyToEdit={partyToEdit}
          />
        </DialogContent>
      </Dialog>


      {/* Site Form Dialog */}
      <Dialog open={showSiteForm} onOpenChange={setShowSiteForm}>
        <DialogContent className="max-w-3xl" aria-describedby="site-form-description">
          <DialogHeader>
            <DialogTitle>{selectedSite ? 'Edit Site' : 'Add New Site'}</DialogTitle>
            <p id="site-form-description" className="text-sm text-gray-600">
              {selectedSite ? 'Edit existing site' : `Add a new address or location for this ${siteFormContext}`}
            </p>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            <SiteForm 
              key={selectedSite ? `edit-site-${selectedSite.site_id}` : `create-site-${siteFormContext}-${selectedParty?.party_id || selectedCustomer?.profile_id || selectedSupplier?.supplier_id || 'new'}`}
              partyId={siteFormContext === 'party' ? selectedParty?.party_id : undefined}
              customerId={siteFormContext === 'customer' ? selectedCustomer?.profile_id : undefined}
              supplierId={siteFormContext === 'supplier' ? selectedSupplier?.supplier_id : undefined}
              siteToEdit={selectedSite}
              onClose={() => {
                setShowSiteForm(false);
                setSelectedSite(null);
              }} 
              onSuccess={() => {
                setShowSiteForm(false);
                setSelectedSite(null);
                if (siteFormContext === 'party' && selectedParty) {
                  // Refresh party sites after update
                  setTimeout(() => {
                    loadPartySites(selectedParty.party_id);
                  }, 100);
                } else if (siteFormContext === 'customer' && selectedCustomer) {
                  // Refresh customer sites after update
                  setTimeout(() => {
                    loadCustomerSites(selectedCustomer.profile_id);
                  }, 100);
                } else if (siteFormContext === 'supplier' && selectedSupplier) {
                  // Refresh supplier sites after update
                  setTimeout(() => {
                    loadSupplierSites(selectedSupplier.supplier_id);
                  }, 100);
                }
                toast.success(selectedSite ? 'Site updated successfully' : 'Site added successfully');
              }} 
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Form Dialog */}
      <Dialog open={showContactForm} onOpenChange={setShowContactForm}>
        <DialogContent className="max-w-2xl" aria-describedby="contact-form-description">
          <DialogHeader>
            <DialogTitle>{selectedContact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
            <p id="contact-form-description" className="text-sm text-gray-600">
              {selectedContact ? 'Edit existing contact point for this party' : 'Add a new contact point for this party'}
            </p>
          </DialogHeader>
          <ContactForm 
            key={selectedContact ? `edit-contact-${selectedContact.contact_point_id}` : `create-contact-${selectedParty?.party_id || 'new'}`}
            partyId={selectedParty?.party_id}
            contactToEdit={selectedContact}
            onClose={() => {
              setShowContactForm(false);
              setSelectedContact(null);
            }} 
            onSuccess={() => {
              setShowContactForm(false);
              setSelectedContact(null);
              if (selectedParty) {
                loadContactPoints(selectedParty.party_id);
              }
              toast.success(selectedContact ? 'Contact updated successfully' : 'Contact added successfully');
            }} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};