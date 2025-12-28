
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, BarChart3 } from "lucide-react";

interface CustomReportBuilderProps {
  onClose: () => void;
}

export const CustomReportBuilder = ({ onClose }: CustomReportBuilderProps) => {
  const [reportData, setReportData] = useState({
    name: "",
    description: "",
    category: "",
    dataSource: "",
    columns: [] as string[],
    filters: [] as { field: string; operator: string; value: string }[],
    groupBy: "",
    sortBy: "",
    chartType: ""
  });

  const availableColumns = [
    "Customer Name", "Invoice Number", "Amount", "Date", "Status",
    "Vendor Name", "Item Name", "Quantity", "Unit Price", "Total",
    "Account Name", "Debit", "Credit", "Department", "Cost Center"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Custom report created:", reportData);
    onClose();
  };

  const toggleColumn = (column: string) => {
    setReportData(prev => ({
      ...prev,
      columns: prev.columns.includes(column)
        ? prev.columns.filter(c => c !== column)
        : [...prev.columns, column]
    }));
  };

  const addFilter = () => {
    setReportData(prev => ({
      ...prev,
      filters: [...prev.filters, { field: "", operator: "", value: "" }]
    }));
  };

  const updateFilter = (index: number, field: string, value: string) => {
    setReportData(prev => ({
      ...prev,
      filters: prev.filters.map((filter, i) => 
        i === index ? { ...filter, [field]: value } : filter
      )
    }));
  };

  const removeFilter = (index: number) => {
    setReportData(prev => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Custom Report Builder
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reportName">Report Name</Label>
                  <Input
                    id="reportName"
                    value={reportData.name}
                    onChange={(e) => setReportData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter report name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={reportData.category} onValueChange={(value) => setReportData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Financial">Financial</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Inventory">Inventory</SelectItem>
                      <SelectItem value="AR">Receivables</SelectItem>
                      <SelectItem value="AP">Payables</SelectItem>
                      <SelectItem value="Expenses">Expenses</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={reportData.description}
                  onChange={(e) => setReportData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this report shows..."
                />
              </div>
            </div>

            {/* Data Source */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Data Source</h3>
              <div>
                <Label htmlFor="dataSource">Primary Data Source</Label>
                <Select value={reportData.dataSource} onValueChange={(value) => setReportData(prev => ({ ...prev, dataSource: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select data source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoices">Invoices</SelectItem>
                    <SelectItem value="payments">Payments</SelectItem>
                    <SelectItem value="expenses">Expenses</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="journal_entries">Journal Entries</SelectItem>
                    <SelectItem value="customers">Customers</SelectItem>
                    <SelectItem value="vendors">Vendors</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Columns Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Column Selection</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {availableColumns.map((column) => (
                  <div key={column} className="flex items-center space-x-2">
                    <Checkbox
                      id={column}
                      checked={reportData.columns.includes(column)}
                      onCheckedChange={() => toggleColumn(column)}
                    />
                    <Label htmlFor={column} className="text-sm">{column}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Filters</h3>
                <Button type="button" variant="outline" size="sm" onClick={addFilter}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Filter
                </Button>
              </div>
              {reportData.filters.map((filter, index) => (
                <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                  <Select value={filter.field} onValueChange={(value) => updateFilter(index, 'field', value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Field" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColumns.map((column) => (
                        <SelectItem key={column} value={column}>{column}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filter.operator} onValueChange={(value) => updateFilter(index, 'operator', value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="greater_than">Greater than</SelectItem>
                      <SelectItem value="less_than">Less than</SelectItem>
                      <SelectItem value="between">Between</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Value"
                    value={filter.value}
                    onChange={(e) => updateFilter(index, 'value', e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => removeFilter(index)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Grouping and Sorting */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="groupBy">Group By</Label>
                <Select value={reportData.groupBy} onValueChange={(value) => setReportData(prev => ({ ...prev, groupBy: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grouping field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Grouping</SelectItem>
                    {availableColumns.map((column) => (
                      <SelectItem key={column} value={column}>{column}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sortBy">Sort By</Label>
                <Select value={reportData.sortBy} onValueChange={(value) => setReportData(prev => ({ ...prev, sortBy: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sorting field" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColumns.map((column) => (
                      <SelectItem key={column} value={column}>{column}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Chart Type */}
            <div>
              <Label htmlFor="chartType">Chart Type (Optional)</Label>
              <Select value={reportData.chartType} onValueChange={(value) => setReportData(prev => ({ ...prev, chartType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select chart type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Chart</SelectItem>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                <BarChart3 className="w-4 h-4 mr-2" />
                Create Report
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
