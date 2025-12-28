import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import apiService from '@/services/api';

// Types
interface ContactPoint {
  contact_point_id: number;
  party_id: number;
  contact_point_type: 'PHONE' | 'EMAIL' | 'FAX' | 'WEB' | 'MOBILE';
  contact_point_value: string;
  contact_point_purpose?: string;
  is_primary: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

interface ContactFormProps {
  partyId?: number;
  onClose: () => void;
  onSuccess: () => void;
  contactToEdit?: ContactPoint | null;
}

export const ContactForm: React.FC<ContactFormProps> = ({ partyId, onClose, onSuccess, contactToEdit }) => {
  const [formData, setFormData] = useState({
    contact_point_type: contactToEdit?.contact_point_type || 'PHONE',
    contact_point_value: contactToEdit?.contact_point_value || '',
    contact_point_purpose: contactToEdit?.contact_point_purpose || '',
    is_primary: contactToEdit?.is_primary || false,
    status: contactToEdit?.status || 'ACTIVE'
  });

  // Update form data when contactToEdit changes
  useEffect(() => {
    if (contactToEdit) {
      setFormData({
        contact_point_type: contactToEdit.contact_point_type,
        contact_point_value: contactToEdit.contact_point_value,
        contact_point_purpose: contactToEdit.contact_point_purpose || '',
        is_primary: contactToEdit.is_primary || false,
        status: contactToEdit.status || 'ACTIVE'
      });
    } else {
      setFormData({
        contact_point_type: 'PHONE',
        contact_point_value: '',
        contact_point_purpose: '',
        is_primary: false,
        status: 'ACTIVE'
      });
    }
  }, [contactToEdit]);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyId) {
      toast.error('Party ID is required');
      return;
    }

    if (!formData.contact_point_type) {
      toast.error('Contact Type is required');
      return;
    }

    if (!formData.contact_point_value.trim()) {
      toast.error('Contact Value is required');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔍 Submitting contact form with data:', formData);
      console.log('🔍 Party ID:', partyId);
      
      if (contactToEdit) {
        await apiService.updateContactPoint(contactToEdit.contact_point_id, formData);
        toast.success('Contact updated successfully');
      } else {
        await apiService.createContactPoint(partyId, formData);
        toast.success('Contact created successfully');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving contact:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save contact';
      toast.error(`Failed to save contact: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contact Information Section */}
      <div className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
          <p className="text-sm text-gray-600">Add a new contact point for this party</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Contact Type <span className="text-red-500">*</span>
            </label>
            <Select value={formData.contact_point_type} onValueChange={(value: 'PHONE' | 'EMAIL' | 'FAX' | 'WEB' | 'MOBILE') => setFormData({ ...formData, contact_point_type: value })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PHONE">Phone</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="FAX">Fax</SelectItem>
                <SelectItem value="WEB">Website</SelectItem>
                <SelectItem value="MOBILE">Mobile</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Contact Value <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.contact_point_value}
              onChange={(e) => setFormData({ ...formData, contact_point_value: e.target.value })}
              required
              type={formData.contact_point_type === 'EMAIL' ? 'email' : formData.contact_point_type === 'WEB' ? 'url' : 'text'}
              placeholder={
                formData.contact_point_type === 'PHONE' || formData.contact_point_type === 'MOBILE' 
                  ? '+1-555-0123' 
                  : formData.contact_point_type === 'EMAIL' 
                  ? 'contact@example.com' 
                  : formData.contact_point_type === 'WEB' 
                  ? 'https://www.example.com' 
                  : 'Contact value'
              }
              className="w-full"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Purpose</label>
          <Input
            value={formData.contact_point_purpose}
            onChange={(e) => setFormData({ ...formData, contact_point_purpose: e.target.value })}
            placeholder="e.g., General, Billing, Support, Sales"
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            Optional: Describe the purpose of this contact point
          </p>
        </div>
      </div>

      {/* Settings Section */}
      <div className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
          <p className="text-sm text-gray-600">Contact configuration options</p>
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
                id="is_primary_contact"
                checked={formData.is_primary}
                onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_primary_contact" className="text-sm font-medium text-gray-700">
                Set as Primary Contact
              </label>
            </div>
            <p className="text-xs text-gray-500 ml-7">
              Primary contacts are used as default for communications
            </p>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose} className="px-6">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="px-6">
          {loading ? 'Saving...' : (contactToEdit ? 'Update Contact' : 'Create Contact')}
        </Button>
      </div>
    </form>
  );
};

export default ContactForm;
