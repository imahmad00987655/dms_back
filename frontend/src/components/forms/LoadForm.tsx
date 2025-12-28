
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, FileText, Database } from "lucide-react";

interface LoadFormProps {
  onClose: () => void;
}

export const LoadForm = ({ onClose }: LoadFormProps) => {
  const [formData, setFormData] = useState({
    loadType: "",
    sourceFile: null as File | null,
    dataSource: "",
    mapping: "",
    batchSize: "1000",
    validateData: true,
    description: "",
    scheduledDate: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Load form submitted:", formData);
    // Here you would typically send the data to your backend
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, sourceFile: file }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Load Configuration
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="loadType">Load Type</Label>
                <Select value={formData.loadType} onValueChange={(value) => setFormData(prev => ({ ...prev, loadType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select load type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="journal-entries">Journal Entries</SelectItem>
                    <SelectItem value="chart-of-accounts">Chart of Accounts</SelectItem>
                    <SelectItem value="vendors">Vendors</SelectItem>
                    <SelectItem value="customers">Customers</SelectItem>
                    <SelectItem value="inventory">Inventory Items</SelectItem>
                    <SelectItem value="transactions">Transactions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dataSource">Data Source</Label>
                <Select value={formData.dataSource} onValueChange={(value) => setFormData(prev => ({ ...prev, dataSource: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select data source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV File</SelectItem>
                    <SelectItem value="excel">Excel File</SelectItem>
                    <SelectItem value="json">JSON File</SelectItem>
                    <SelectItem value="database">External Database</SelectItem>
                    <SelectItem value="api">API Endpoint</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="sourceFile">Source File</Label>
              <div className="mt-1">
                <input
                  type="file"
                  id="sourceFile"
                  onChange={handleFileChange}
                  accept=".csv,.xlsx,.xls,.json"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {formData.sourceFile && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4" />
                    {formData.sourceFile.name}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="batchSize">Batch Size</Label>
                <Input
                  id="batchSize"
                  type="number"
                  value={formData.batchSize}
                  onChange={(e) => setFormData(prev => ({ ...prev, batchSize: e.target.value }))}
                  placeholder="1000"
                />
              </div>

              <div>
                <Label htmlFor="scheduledDate">Scheduled Date</Label>
                <Input
                  id="scheduledDate"
                  type="datetime-local"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="mapping">Field Mapping</Label>
              <Textarea
                id="mapping"
                value={formData.mapping}
                onChange={(e) => setFormData(prev => ({ ...prev, mapping: e.target.value }))}
                placeholder="JSON field mapping configuration..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description of the data load operation..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="validateData"
                checked={formData.validateData}
                onChange={(e) => setFormData(prev => ({ ...prev, validateData: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="validateData">Validate data before loading</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                <Upload className="w-4 h-4 mr-2" />
                Start Load
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
