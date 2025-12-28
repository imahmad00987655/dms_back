import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

// Use environment variable for API base URL, fallback based on environment
const PRODUCTION_BACKEND = 'https://skyblue-snake-491948.hostingersite.com';
const PRODUCTION_API_BASE = `${PRODUCTION_BACKEND}/api`;
const isProduction = import.meta.env.PROD || window.location.hostname.includes('hostingersite.com');
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (isProduction ? PRODUCTION_API_BASE : 'http://localhost:5000/api');

// Types
interface CompanyLocation {
  id: number;
  company_id: number;
  location_code: string;
  location_name: string;
  location_type: 'WAREHOUSE' | 'OFFICE' | 'RETAIL_STORE' | 'DISTRIBUTION_CENTER' | 'MANUFACTURING_PLANT' | 'OTHER';
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  is_primary: boolean;
  is_active: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  created_at: string;
  updated_at: string;
}

interface LocationFormProps {
  companyId: number;
  onClose: () => void;
  onSuccess: () => void;
  locationToEdit?: CompanyLocation | null;
}

export const LocationForm: React.FC<LocationFormProps> = ({ 
  companyId, 
  onClose, 
  onSuccess, 
  locationToEdit 
}) => {
  const [formData, setFormData] = useState({
    location_code: locationToEdit?.location_code || '',
    location_name: locationToEdit?.location_name || '',
    location_type: locationToEdit?.location_type || 'WAREHOUSE',
    address_line1: locationToEdit?.address_line1 || '',
    address_line2: locationToEdit?.address_line2 || '',
    city: locationToEdit?.city || '',
    state: locationToEdit?.state || '',
    postal_code: locationToEdit?.postal_code || '',
    country: locationToEdit?.country || '',
    is_primary: locationToEdit?.is_primary || false,
    status: locationToEdit?.status || 'ACTIVE'
  });

  const [loading, setLoading] = useState(false);

  // Update form data when locationToEdit changes
  useEffect(() => {
    if (locationToEdit) {
      setFormData({
        location_code: locationToEdit.location_code || '',
        location_name: locationToEdit.location_name || '',
        location_type: locationToEdit.location_type || 'WAREHOUSE',
        address_line1: locationToEdit.address_line1 || '',
        address_line2: locationToEdit.address_line2 || '',
        city: locationToEdit.city || '',
        state: locationToEdit.state || '',
        postal_code: locationToEdit.postal_code || '',
        country: locationToEdit.country || '',
        is_primary: locationToEdit.is_primary || false,
        status: locationToEdit.status || 'ACTIVE'
      });
    } else {
      setFormData({
        location_code: '',
        location_name: '',
        location_type: 'WAREHOUSE',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        is_primary: false,
        status: 'ACTIVE'
      });
    }
  }, [locationToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.location_name.trim()) {
      toast.error('Location Name is required');
      return;
    }

    setLoading(true);
    
    try {
      const locationData = {
        company_id: companyId,
        ...formData
      };

      if (locationToEdit) {
        // Update existing location
        const response = await fetch(`${API_BASE_URL}/company-locations/${locationToEdit.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(locationData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update location');
        }

        toast.success('Location updated successfully');
      } else {
        // Create new location
        const response = await fetch(`${API_BASE_URL}/company-locations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...locationData,
            created_by: 1 // Default user ID, should be from auth context
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create location');
        }

        toast.success('Location created successfully');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving location:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save location';
      toast.error(`Failed to save location: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-4">
      {/* Location Information Section */}
      <div className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="text-lg font-semibold text-gray-900">Location Information</h3>
          <p className="text-sm text-gray-600">Basic details about the location</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Location Code <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.location_code}
              onChange={(e) => setFormData({ ...formData, location_code: e.target.value })}
              required
              placeholder="e.g., WH-001"
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Location Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.location_name}
              onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
              required
              placeholder="e.g., Main Warehouse"
              className="w-full"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Location Type</label>
          <Select 
            value={formData.location_type} 
            onValueChange={(value: 'WAREHOUSE' | 'OFFICE' | 'RETAIL_STORE' | 'DISTRIBUTION_CENTER' | 'MANUFACTURING_PLANT' | 'OTHER') => 
              setFormData({ ...formData, location_type: value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="WAREHOUSE">Warehouse</SelectItem>
              <SelectItem value="OFFICE">Office</SelectItem>
              <SelectItem value="RETAIL_STORE">Retail Store</SelectItem>
              <SelectItem value="DISTRIBUTION_CENTER">Distribution Center</SelectItem>
              <SelectItem value="MANUFACTURING_PLANT">Manufacturing Plant</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
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
            <label className="text-sm font-medium text-gray-700">
              Address <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.address_line1}
              onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
              required
              placeholder="Street address, building name"
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Address Line 2</label>
            <Input
              value={formData.address_line2}
              onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
              placeholder="Suite, unit, floor, etc."
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
              <label className="text-sm font-medium text-gray-700">State</label>
              <Input
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="State or province"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Zip Code</label>
              <Input
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                placeholder="ZIP or postal code"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
          <p className="text-sm text-gray-600">Location configuration options</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <Select 
              value={formData.status} 
              onValueChange={(value: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => 
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
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
                Set as Primary Location
              </label>
            </div>
            <p className="text-xs text-gray-500 ml-7">
              Primary locations are used as default for operations
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
          {loading ? 'Saving...' : (locationToEdit ? 'Update Location' : 'Create Location')}
        </Button>
      </div>
    </form>
  );
};

export default LocationForm;
