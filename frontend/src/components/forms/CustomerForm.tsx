import React, { useState, useEffect } from 'react';
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

interface CustomerProfile {
  profile_id: number;
  party_id: number;
  party_no?: string;
  customer_number: string;
  customer_name: string;
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

interface CustomerFormProps {
  onClose: () => void;
  onSuccess: () => void;
  customerToEdit?: CustomerProfile | null;
}



export const CustomerForm: React.FC<CustomerFormProps> = ({ onClose, onSuccess, customerToEdit }) => {
  const [formData, setFormData] = useState({
    party_id: customerToEdit?.party_id || 0,
    customer_name: customerToEdit?.customer_name || '',
    customer_type: customerToEdit?.customer_type || 'CORPORATE',
    customer_class: customerToEdit?.customer_class || '',
    customer_category: customerToEdit?.customer_category || '',
    credit_limit: customerToEdit?.credit_limit || 0,
    credit_hold_flag: customerToEdit?.credit_hold_flag || false,
    payment_terms_id: customerToEdit?.payment_terms_id || 30,
    tax_id: customerToEdit?.tax_id || '',
    status: customerToEdit?.status || 'ACTIVE'
  });

  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(false);
  const [partiesLoading, setPartiesLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  


  useEffect(() => {
    loadParties();
  }, []);



  // Update form data when customerToEdit changes
  useEffect(() => {
    if (customerToEdit) {
      setFormData({
        party_id: customerToEdit.party_id,
        customer_name: customerToEdit.customer_name || '',
        customer_type: customerToEdit.customer_type,
        customer_class: customerToEdit.customer_class || '',
        customer_category: customerToEdit.customer_category || '',
        credit_limit: customerToEdit.credit_limit,
        credit_hold_flag: customerToEdit.credit_hold_flag,
        payment_terms_id: customerToEdit.payment_terms_id,
        tax_id: customerToEdit.tax_id || '',
        status: customerToEdit.status
      });
    } else {
      setFormData({
        party_id: null,
        customer_name: '',
        customer_type: 'CORPORATE',
        customer_class: '',
        customer_category: '',
        credit_limit: 0,
        credit_hold_flag: false,
        payment_terms_id: 30,
        tax_id: '',
        status: 'ACTIVE'
      });
    }
  }, [customerToEdit]);

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
    
    if (!formData.customer_name || formData.customer_name.trim() === '') {
      toast.error('Please enter a customer name');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🔍 Frontend sending customer data:', formData);
      if (customerToEdit) {
        await apiService.updateCustomer(customerToEdit.profile_id, formData);
        toast.success('Customer profile updated successfully');
      } else {
        await apiService.createCustomer(formData);
        toast.success('Customer profile created successfully');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error('Failed to save customer profile');
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
              {customerToEdit ? 'Edit Customer Profile' : 'Create Customer Profile'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {customerToEdit ? 'Update customer information and settings' : 'Add a new customer to your system'}
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
            <label className="text-sm font-medium text-gray-700">Customer Name *</label>
            <Input
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              placeholder="Enter customer name"
              required
              className="w-full transition-all duration-200 hover:border-gray-400 focus:border-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Customer Type</label>
            <Select value={formData.customer_type} onValueChange={(value: 'CORPORATE' | 'INDIVIDUAL' | 'GOVERNMENT' | 'NON_PROFIT') => setFormData({ ...formData, customer_type: value })}>
              <SelectTrigger className="w-full transition-all duration-200 hover:border-gray-400 focus:border-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CORPORATE">Corporate</SelectItem>
                <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                <SelectItem value="GOVERNMENT">Government</SelectItem>
                <SelectItem value="NON_PROFIT">Non-Profit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Customer Class</label>
            <Input
              value={formData.customer_class}
              onChange={(e) => setFormData({ ...formData, customer_class: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Customer Category</label>
            <Input
              value={formData.customer_category}
              onChange={(e) => setFormData({ ...formData, customer_category: e.target.value })}
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
                id="credit_hold_flag"
                checked={formData.credit_hold_flag}
                onChange={(e) => setFormData({ ...formData, credit_hold_flag: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <label htmlFor="credit_hold_flag" className="text-sm text-gray-600">
                Hold customer
              </label>
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
                {loading ? 'Saving...' : (customerToEdit ? 'Update Customer' : 'Create Customer')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
 };

export default CustomerForm;
