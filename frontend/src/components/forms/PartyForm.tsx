import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
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

interface PartyFormProps {
  onClose: () => void;
  onSuccess: () => void;
  partyToEdit?: Party | null;
}

export const PartyForm: React.FC<PartyFormProps> = ({ onClose, onSuccess, partyToEdit }) => {
  const [formData, setFormData] = useState({
    party_name: partyToEdit?.party_name || '',
    party_type: partyToEdit?.party_type || 'ORGANIZATION',
    tax_id: partyToEdit?.tax_id || '',
    website: partyToEdit?.website || '',
    industry: partyToEdit?.industry || '',
    status: partyToEdit?.status || 'ACTIVE'
  });

  const [loading, setLoading] = useState(false);

  // Update form data when partyToEdit changes
  useEffect(() => {
    if (partyToEdit) {
      setFormData({
        party_name: partyToEdit.party_name,
        party_type: partyToEdit.party_type,
        tax_id: partyToEdit.tax_id || '',
        website: partyToEdit.website || '',
        industry: partyToEdit.industry || '',
        status: partyToEdit.status
      });
    } else {
      setFormData({
        party_name: '',
        party_type: 'ORGANIZATION',
        tax_id: '',
        website: '',
        industry: '',
        status: 'ACTIVE'
      });
    }
  }, [partyToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (partyToEdit) {
        await apiService.updateParty(partyToEdit.party_id, formData);
        toast.success('Party updated successfully');
      } else {
        await apiService.createParty(formData);
        toast.success('Party created successfully');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving party:', error);
      toast.error('Failed to save party');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Party Name *</label>
          <Input
            value={formData.party_name}
            onChange={(e) => setFormData({ ...formData, party_name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Party Type</label>
          <Select value={formData.party_type} onValueChange={(value: 'ORGANIZATION' | 'PERSON' | 'GROUP') => setFormData({ ...formData, party_type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ORGANIZATION">Organization</SelectItem>
              <SelectItem value="PERSON">Person</SelectItem>
              <SelectItem value="GROUP">Group</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Tax ID</label>
          <Input
            value={formData.tax_id}
            onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Website</label>
          <Input
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            type="url"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Industry</label>
          <Input
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Status</label>
          <Select value={formData.status} onValueChange={(value: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING') => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : (partyToEdit ? 'Update Party' : 'Create Party')}
        </Button>
      </div>
    </form>
  );
};

export default PartyForm;
