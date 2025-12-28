import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarIcon, Plus, Save, Edit, Eye } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import apiService from "@/services/api";
import { useToast } from "@/hooks/use-toast";

// Helper function to format date without timezone issues
const formatDateForDisplay = (dateString: string) => {
  if (!dateString || dateString === 'null' || dateString === 'undefined') return "N/A";
  
  try {
    // Handle different date formats
    let date;
    if (dateString.includes('T')) {
      // Already has time component
      date = new Date(dateString);
    } else {
      // Add time component to prevent timezone issues
      date = new Date(dateString + 'T00:00:00');
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }
    
    return format(date, 'dd-MM-yyyy');
  } catch (error) {
    console.error('Error formatting date:', error, 'Input:', dateString);
    return "Invalid Date";
  }
};

interface TaxRegime {
  id: number;
  code: string;
  name: string;
  type: string;
  taxAuthority: string;
  effectiveDate: string;
  endDate: string | null;
  status: string;
}

const TaxRegimeForm = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingTaxRegime, setEditingTaxRegime] = useState<TaxRegime | null>(null);
  const [viewingTaxRegime, setViewingTaxRegime] = useState<TaxRegime | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // State for tax regimes data - will be populated from API
  const [taxRegimes, setTaxRegimes] = useState<TaxRegime[]>([]);

  const loadTaxRegimes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getTaxRegimes();
      if (response.success) {
        // Transform the data to match frontend expectations
        const transformedData = response.data.map((regime: {
          id: number;
          regime_code: string;
          regime_name: string;
          regime_type: string;
          tax_authority: string;
          effective_date: string;
          end_date: string | null;
          status: string;
        }) => ({
          id: regime.id,
          code: regime.regime_code,
          name: regime.regime_name,
          type: regime.regime_type,
          taxAuthority: regime.tax_authority,
          effectiveDate: regime.effective_date,
          endDate: regime.end_date,
          status: regime.status
        }));
        setTaxRegimes(transformedData);
      }
    } catch (error) {
      console.error('Error loading tax regimes:', error);
      toast({
        title: "Error",
        description: "Failed to load tax regimes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load tax regimes on component mount
  useEffect(() => {
    loadTaxRegimes();
  }, [loadTaxRegimes]);

  const handleEdit = (taxRegime: TaxRegime) => {
    setEditingTaxRegime(taxRegime);
    setIsDialogOpen(true);
  };

  const handleView = (taxRegime: TaxRegime) => {
    setViewingTaxRegime(taxRegime);
    setIsViewDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingTaxRegime(null);
    setIsDialogOpen(true);
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Tax Regime Configuration</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} className="gap-2">
              <Plus className="h-4 w-4" />
              New Regime
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTaxRegime ? 'Edit Tax Regime' : 'Create New Tax Regime'}
              </DialogTitle>
            </DialogHeader>
            <TaxRegimeFormModal 
              taxRegime={editingTaxRegime}
              onClose={() => {
                setIsDialogOpen(false);
                setEditingTaxRegime(null);
              }}
              onSave={() => {
                setIsDialogOpen(false);
                setEditingTaxRegime(null);
                loadTaxRegimes();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tax Regime Details</DialogTitle>
          </DialogHeader>
          {viewingTaxRegime && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Code</Label>
                  <p className="text-sm font-medium">{viewingTaxRegime.code || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                  <p className="text-sm font-medium">{viewingTaxRegime.name || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                  <Badge variant="outline">{viewingTaxRegime.type || "N/A"}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tax Authority</Label>
                  <p className="text-sm font-medium">{viewingTaxRegime.taxAuthority || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Effective Date</Label>
                  <p className="text-sm font-medium">{formatDateForDisplay(viewingTaxRegime.effectiveDate || "")}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">End Date</Label>
                  <p className="text-sm font-medium">{formatDateForDisplay(viewingTaxRegime.endDate || "")}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge variant={viewingTaxRegime.status === 'Active' ? 'default' : 'secondary'}>
                    {viewingTaxRegime.status || "N/A"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Tax Regimes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Code</th>
                  <th className="text-left py-2 px-2">Name</th>
                  <th className="text-left py-2 px-2">Type</th>
                  <th className="text-left py-2 px-2">Tax Authority</th>
                  <th className="text-left py-2 px-2">Status</th>
                  <th className="text-left py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {taxRegimes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 px-4 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-4xl">🏛️</div>
                        <p>No tax regimes found</p>
                        <p className="text-sm">Click "New Regime" to create your first tax regime</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  taxRegimes.map((regime) => (
                    <tr key={regime.id} className="border-b">
                      <td className="py-3 px-2 font-medium">{regime.code}</td>
                      <td className="py-3 px-2">{regime.name}</td>
                      <td className="py-3 px-2">
                        <Badge variant="outline">{regime.type}</Badge>
                      </td>
                      <td className="py-3 px-2 max-w-xs truncate">{regime.taxAuthority}</td>
                      <td className="py-3 px-2">
                        <Badge variant={regime.status === 'Active' ? 'default' : 'secondary'}>
                          {regime.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleView(regime)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(regime)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Separate form component for the modal
const TaxRegimeFormModal = ({ taxRegime, onClose, onSave }: { taxRegime: TaxRegime | null, onClose: () => void, onSave: () => void }) => {
  const [effectiveDate, setEffectiveDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    code: taxRegime?.code || '',
    name: taxRegime?.name || '',
    type: taxRegime?.type || '',
    taxAuthority: taxRegime?.taxAuthority || '',
  });

  // Initialize form data when taxRegime changes (for editing)
  useEffect(() => {
    if (taxRegime) {
      setFormData({
        code: taxRegime.code || '',
        name: taxRegime.name || '',
        type: taxRegime.type || '',
        taxAuthority: taxRegime.taxAuthority || '',
      });
      setEffectiveDate(taxRegime.effectiveDate ? new Date(taxRegime.effectiveDate) : undefined);
      setEndDate(taxRegime.endDate ? new Date(taxRegime.endDate) : undefined);
    } else {
      // Reset form for new regime
      setFormData({
        code: '',
        name: '',
        type: '',
        taxAuthority: '',
      });
      setEffectiveDate(undefined);
      setEndDate(undefined);
    }
  }, [taxRegime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const submitData = {
        regime_code: formData.code,
        regime_name: formData.name,
        regime_type: formData.type,
        tax_authority: formData.taxAuthority,
        effective_date: effectiveDate ? format(effectiveDate, 'yyyy-MM-dd') : '',
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
        status: 'ACTIVE'
      };

      if (taxRegime) {
        // Update existing regime
        const response = await apiService.updateTaxRegime(taxRegime.id, submitData);
        if (response.success) {
          toast({
            title: "Success",
            description: "Tax regime updated successfully",
          });
          onSave();
        }
      } else {
        // Create new regime
        const response = await apiService.createTaxRegime(submitData);
        if (response.success) {
          toast({
            title: "Success",
            description: "Tax regime created successfully",
          });
          onSave();
        }
      }
    } catch (error) {
      console.error('Error saving tax regime:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save tax regime",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="regimeCode">Regime Code *</Label>
          <Input 
            id="regimeCode" 
            placeholder="e.g., IN_GST"
            value={formData.code}
            onChange={(e) => setFormData({...formData, code: e.target.value})}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="regimeName">Regime Name *</Label>
          <Input 
            id="regimeName" 
            placeholder="e.g., India GST"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="regimeType">Regime Type *</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select regime type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TRANSACTION_TAX">Transaction Tax</SelectItem>
              <SelectItem value="WITHHOLDING_TAX">Withholding Tax</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="taxAuthority">Tax Authority</Label>
          <Input 
            id="taxAuthority" 
            placeholder="e.g., CBIC - Central Board of Indirect Taxes"
            value={formData.taxAuthority}
            onChange={(e) => setFormData({...formData, taxAuthority: e.target.value})}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Effective Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !effectiveDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {effectiveDate ? format(effectiveDate, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={effectiveDate}
                onSelect={setEffectiveDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label>End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "Select date (optional)"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button type="submit" className="gap-2" disabled={submitting}>
          <Save className="h-4 w-4" />
          {submitting ? 'Saving...' : (taxRegime ? 'Update Regime' : 'Save Regime')}
        </Button>
      </div>
    </form>
  );
};

export default TaxRegimeForm;