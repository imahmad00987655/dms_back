import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ChevronsUpDown, Check } from 'lucide-react';
import apiService from '@/services/api';

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

interface SupplierProfile {
  supplier_id: number;
  party_id: number;
  supplier_number: string;
  supplier_name: string;
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

interface SupplierFormProps {
  onClose: () => void;
  onSuccess: () => void;
  supplierToEdit?: SupplierProfile | null;
}



export const SupplierForm: React.FC<SupplierFormProps> = ({ onClose, onSuccess, supplierToEdit }) => {
  const [formData, setFormData] = useState({
    party_id: supplierToEdit?.party_id || null,
    supplier_name: supplierToEdit?.supplier_name || '',
    supplier_type: supplierToEdit?.supplier_type || 'VENDOR',
    supplier_class: supplierToEdit?.supplier_class || '',
    supplier_category: supplierToEdit?.supplier_category || '',
    credit_limit: supplierToEdit?.credit_limit || 0,
    hold_flag: supplierToEdit?.hold_flag || false,
    payment_terms_id: supplierToEdit?.payment_terms_id || 30,
    currency_code: supplierToEdit?.currency_code || 'USD',
    payment_method: supplierToEdit?.payment_method || '',
    bank_account: supplierToEdit?.bank_account || '',
    tax_id: supplierToEdit?.tax_id || '',
    status: supplierToEdit?.status || 'ACTIVE'
  });

  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(false);
  const [partiesLoading, setPartiesLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  


  useEffect(() => {
    loadParties();
  }, []);



  // Update form data when supplierToEdit changes
  useEffect(() => {
    if (supplierToEdit) {
      setFormData({
        party_id: supplierToEdit.party_id || 0,
        supplier_name: supplierToEdit.supplier_name || '',
        supplier_type: supplierToEdit.supplier_type || 'VENDOR',
        supplier_class: supplierToEdit.supplier_class || '',
        supplier_category: supplierToEdit.supplier_category || '',
        credit_limit: supplierToEdit.credit_limit || 0,
        hold_flag: supplierToEdit.hold_flag || false,
        payment_terms_id: supplierToEdit.payment_terms_id || 30,
        currency_code: supplierToEdit.currency_code || 'USD',
        payment_method: supplierToEdit.payment_method || '',
        bank_account: supplierToEdit.bank_account || '',
        tax_id: supplierToEdit.tax_id || '',
        status: supplierToEdit.status || 'ACTIVE'
      });
    } else {
      setFormData({
        party_id: null,
        supplier_name: '',
        supplier_type: 'VENDOR',
        supplier_class: '',
        supplier_category: '',
        credit_limit: 0,
        hold_flag: false,
        payment_terms_id: 30,
        currency_code: 'USD',
        payment_method: '',
        bank_account: '',
        tax_id: '',
        status: 'ACTIVE'
      });
    }
  }, [supplierToEdit]);

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



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.party_id) {
      toast.error('Please select a party');
      return;
    }
    
    if (!formData.supplier_name || formData.supplier_name.trim() === '') {
      toast.error('Please enter a supplier name');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🔍 Frontend sending supplier data:', formData);
      if (supplierToEdit) {
        await apiService.updateSupplier(supplierToEdit.supplier_id, formData);
        toast.success('Supplier updated successfully');
      } else {
        await apiService.createSupplier(formData);
        toast.success('Supplier created successfully');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving supplier:', error);
      toast.error('Failed to save supplier');
    } finally {
      setLoading(false);
    }
  };

  const selectedParty = parties.find(party => party.party_id === formData.party_id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900">
              {supplierToEdit ? 'Edit Supplier Profile' : 'Create Supplier Profile'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {supplierToEdit ? 'Update supplier information and settings' : 'Add a new supplier to your system'}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Party *</label>
            {partiesLoading ? (
              <div className="w-full p-2 text-center text-sm text-gray-500">
                Loading parties...
              </div>
            ) : parties.length === 0 ? (
              <div className="w-full p-2 text-center text-sm text-red-500">
                No parties available. Please create a party first.
              </div>
            ) : (
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {formData.party_id && selectedParty
                      ? selectedParty.party_name
                      : "Select a party..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Search by party name..." 
                      value={searchValue}
                      onValueChange={setSearchValue}
                    />
                    <CommandEmpty>No party found.</CommandEmpty>
                    <CommandGroup>
                      {parties
                        .filter(party => 
                          !searchValue || 
                          party.party_name.toLowerCase().includes(searchValue.toLowerCase()) ||
                          party.party_number.toLowerCase().includes(searchValue.toLowerCase())
                        )
                        .map((party) => (
                          <CommandItem
                            key={party.party_id}
                            value={`${party.party_name} ${party.party_number}`}
                            onSelect={() => {
                              setFormData({ ...formData, party_id: party.party_id });
                              setOpen(false);
                              setSearchValue('');
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.party_id === party.party_id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{party.party_name}</span>
                              <span className="text-sm text-gray-500">Party #: {party.party_number}</span>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
            {selectedParty && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                <p><strong>Party Name:</strong> {selectedParty.party_name}</p>
                <p><strong>Party Type:</strong> {selectedParty.party_type}</p>
                {selectedParty.tax_id && <p><strong>Tax ID:</strong> {selectedParty.tax_id}</p>}
                {selectedParty.industry && <p><strong>Industry:</strong> {selectedParty.industry}</p>}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Supplier Name *</label>
            <Input
              value={formData.supplier_name}
              onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
              placeholder="Enter supplier name"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Supplier Type</label>
            <Select value={formData.supplier_type} onValueChange={(value: 'VENDOR' | 'CONTRACTOR' | 'SERVICE_PROVIDER' | 'GOVERNMENT') => setFormData({ ...formData, supplier_type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VENDOR">Vendor</SelectItem>
                <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                <SelectItem value="SERVICE_PROVIDER">Service Provider</SelectItem>
                <SelectItem value="GOVERNMENT">Government</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Supplier Class</label>
            <Input
              value={formData.supplier_class}
              onChange={(e) => setFormData({ ...formData, supplier_class: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Supplier Category</label>
            <Input
              value={formData.supplier_category}
              onChange={(e) => setFormData({ ...formData, supplier_category: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Credit Limit</label>
            <Input
              value={formData.credit_limit}
              onChange={(e) => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) || 0 })}
              type="number"
              step="0.01"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Payment Terms (days)</label>
            <Input
              value={formData.payment_terms_id}
              onChange={(e) => setFormData({ ...formData, payment_terms_id: parseInt(e.target.value) || 30 })}
              type="number"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Currency</label>
            <Select value={formData.currency_code} onValueChange={(value) => setFormData({ ...formData, currency_code: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Payment Method</label>
            <Input
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Bank Account</label>
            <Input
              value={formData.bank_account}
              onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tax ID</label>
            <Input
              value={formData.tax_id || ''}
              onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
              placeholder="Enter tax ID"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Hold Flag</label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hold_flag"
                checked={formData.hold_flag}
                onChange={(e) => setFormData({ ...formData, hold_flag: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <label htmlFor="hold_flag" className="text-sm text-gray-600">Hold supplier</label>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <Select value={formData.status} onValueChange={(value: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose} className="px-6">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="px-6">
                {loading ? 'Saving...' : (supplierToEdit ? 'Update Supplier' : 'Create Supplier')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
 };


export default SupplierForm;
