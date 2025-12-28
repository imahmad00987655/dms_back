import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import apiService from '@/services/api';

// Types
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

interface SiteFormProps {
  partyId?: number;
  customerId?: number;
  supplierId?: number;
  onClose: () => void;
  onSuccess: () => void;
  siteToEdit?: PartySite | SupplierSite | null;
}

export const SiteForm: React.FC<SiteFormProps> = ({ partyId, customerId, supplierId, onClose, onSuccess, siteToEdit }) => {
  const [formData, setFormData] = useState({
    site_name: siteToEdit?.site_name || '',
    site_type: siteToEdit?.site_type || 'BOTH',
    address_line1: siteToEdit?.address_line1 || '',
    address_line2: siteToEdit?.address_line2 || '',
    city: siteToEdit?.city || '',
    state: siteToEdit?.state || '',
    postal_code: siteToEdit?.postal_code || '',
    country: siteToEdit?.country || '',
    phone: siteToEdit?.phone || '',
    email: siteToEdit?.email || '',
    contact_person: siteToEdit?.contact_person || '',
    is_primary: siteToEdit?.is_primary || false,
    status: siteToEdit?.status || 'ACTIVE'
  });

  const [loading, setLoading] = useState(false);

  // Update form data when siteToEdit changes
  useEffect(() => {
    if (siteToEdit) {
      setFormData({
        site_name: siteToEdit.site_name,
        site_type: siteToEdit.site_type,
        address_line1: siteToEdit.address_line1 || '',
        address_line2: siteToEdit.address_line2 || '',
        city: siteToEdit.city || '',
        state: siteToEdit.state || '',
        postal_code: siteToEdit.postal_code || '',
        country: siteToEdit.country || '',
        phone: siteToEdit.phone || '',
        email: siteToEdit.email || '',
        contact_person: siteToEdit.contact_person || '',
        is_primary: siteToEdit.is_primary || false,
        status: siteToEdit.status || 'ACTIVE'
      });
    } else {
      setFormData({
        site_name: '',
        site_type: 'BOTH',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        phone: '',
        email: '',
        contact_person: '',
        is_primary: false,
        status: 'ACTIVE'
      });
    }
  }, [siteToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyId && !customerId && !supplierId) {
      toast.error('Party ID, Customer ID, or Supplier ID is required');
      return;
    }

    if (!formData.site_name.trim()) {
      toast.error('Site Name is required');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔍 Submitting site form with data:', formData);
      console.log('🔍 Party ID:', partyId, 'Customer ID:', customerId, 'Supplier ID:', supplierId);
      
      if (siteToEdit) {
        if (customerId) {
          await apiService.updateCustomerSite(siteToEdit.site_id, formData);
        } else if (supplierId) {
          await apiService.updateSupplierSite(siteToEdit.site_id, formData);
        } else {
          await apiService.updatePartySite(siteToEdit.site_id, formData);
        }
        toast.success('Site updated successfully');
      } else {
        if (customerId) {
          await apiService.createCustomerSite(customerId, formData);
        } else if (supplierId) {
          await apiService.createSupplierSite(supplierId, formData);
        } else {
          await apiService.createPartySite(partyId!, formData);
        }
        toast.success('Site created successfully');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving site:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save site';
      toast.error(`Failed to save site: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-4">
      {/* Site Information Section */}
      <div className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="text-lg font-semibold text-gray-900">Site Information</h3>
          <p className="text-sm text-gray-600">Basic details about the site</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Site Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.site_name}
              onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
              required
              placeholder="Enter site name"
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Site Type</label>
            <Select value={formData.site_type} onValueChange={(value: 'INVOICING' | 'PURCHASING' | 'BOTH') => setFormData({ ...formData, site_type: value })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {customerId ? (
                  // Customer sites only support these types
                  <>
                    <SelectItem value="BILL_TO">Bill To</SelectItem>
                    <SelectItem value="SHIP_TO">Ship To</SelectItem>
                    <SelectItem value="BOTH">Both</SelectItem>
                  </>
                ) : supplierId ? (
                  // Supplier sites support these types
                  <>
                    <SelectItem value="PURCHASING">Purchasing</SelectItem>
                    <SelectItem value="INVOICING">Invoicing</SelectItem>
                    <SelectItem value="BOTH">Both</SelectItem>
                  </>
                ) : (
                  // Party sites support all types
                  <>
                    <SelectItem value="BILL_TO">Bill To</SelectItem>
                    <SelectItem value="SHIP_TO">Ship To</SelectItem>
                    <SelectItem value="BOTH">Both</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Address Information Section */}
      <div className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="text-lg font-semibold text-gray-900">Address Information</h3>
          <p className="text-sm text-gray-600">Physical location details</p>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Address Line 1</label>
            <Input
              value={formData.address_line1}
              onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
              placeholder="Street address, P.O. box, company name"
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Address Line 2</label>
            <Input
              value={formData.address_line2}
              onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
              placeholder="Apartment, suite, unit, building, floor, etc."
              className="w-full"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">City</label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">State/Province</label>
              <Input
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="State or province"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Postal Code</label>
              <Input
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                placeholder="ZIP or postal code"
                className="w-full"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Country</label>
            <Input
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="Country"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
          <p className="text-sm text-gray-600">Contact details for this site</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Phone</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Phone number"
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <Input
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              type="email"
              placeholder="Email address"
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Contact Person</label>
            <Input
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              placeholder="Contact person name"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
          <p className="text-sm text-gray-600">Site configuration options</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <Select value={formData.status} onValueChange={(value: 'ACTIVE' | 'INACTIVE') => setFormData({ ...formData, status: value })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-3 pt-6">
              <input
                type="checkbox"
                id="is_primary"
                checked={formData.is_primary}
                onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_primary" className="text-sm font-medium text-gray-700">
                Set as Primary Site
              </label>
            </div>
            <p className="text-xs text-gray-500 ml-7">
              {supplierId
                ? 'Primary sites are used as default for purchasing and invoicing'
                : customerId
                ? 'Primary sites are used as default for billing and shipping'
                : 'Primary sites are used as default for billing and shipping'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-6 border-t mt-6">
        <Button type="button" variant="outline" onClick={onClose} className="px-6 py-2">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="px-6 py-2">
          {loading ? 'Saving...' : (siteToEdit ? 'Update Site' : 'Create Site')}
        </Button>
      </div>
    </form>
  );
};

export default SiteForm;
