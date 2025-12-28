
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, FileText, Download, Filter, Plus, Calendar } from "lucide-react";
import { CustomReportBuilder } from "@/components/reports/CustomReportBuilder";

const standardReports = [
  {
    id: "balance-sheet",
    name: "Balance Sheet",
    description: "Statement of financial position",
    category: "Financial",
    lastRun: "2024-06-01"
  },
  {
    id: "income-statement",
    name: "Income Statement",
    description: "Profit and loss statement",
    category: "Financial",
    lastRun: "2024-06-01"
  },
  {
    id: "cash-flow",
    name: "Cash Flow Statement",
    description: "Cash receipts and payments",
    category: "Financial",
    lastRun: "2024-05-30"
  },
  {
    id: "aged-receivables",
    name: "Aged Receivables",
    description: "Customer aging analysis",
    category: "AR",
    lastRun: "2024-06-02"
  },
  {
    id: "aged-payables",
    name: "Aged Payables",
    description: "Vendor aging analysis",
    category: "AP",
    lastRun: "2024-06-02"
  },
  {
    id: "inventory-valuation",
    name: "Inventory Valuation",
    description: "Current inventory values",
    category: "Inventory",
    lastRun: "2024-06-01"
  }
];

const customReports = [
  {
    id: "custom-1",
    name: "Monthly Sales by Region",
    description: "Custom sales analysis by geographical region",
    category: "Sales",
    createdBy: "John Doe",
    lastRun: "2024-06-01"
  },
  {
    id: "custom-2",
    name: "Expense Analysis by Department",
    description: "Departmental expense breakdown",
    category: "Expenses",
    createdBy: "Jane Smith",
    lastRun: "2024-05-28"
  }
];

export const Reports = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showReportBuilder, setShowReportBuilder] = useState(false);

  const allReports = [...standardReports, ...customReports];
  const filteredReports = allReports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || report.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleRunReport = (reportId: string) => {
    console.log(`Running report: ${reportId}`);
    // Implement report generation logic
  };

  const handleExportReport = (reportId: string) => {
    console.log(`Exporting report: ${reportId}`);
    // Implement report export logic
  };

  if (showReportBuilder) {
    return <CustomReportBuilder onClose={() => setShowReportBuilder(false)} />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Generate standard and custom reports for business insights</p>
        </div>
        <Button onClick={() => setShowReportBuilder(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Custom Report
        </Button>
      </div>

      <Tabs defaultValue="all-reports" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all-reports" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            All Reports
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Financial Reports
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Custom Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all-reports" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1">
                  <Input
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Financial">Financial</SelectItem>
                      <SelectItem value="AR">Receivables</SelectItem>
                      <SelectItem value="AP">Payables</SelectItem>
                      <SelectItem value="Inventory">Inventory</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Expenses">Expenses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReports.map((report) => (
                  <Card key={report.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{report.name}</CardTitle>
                        <Badge variant="outline">{report.category}</Badge>
                      </div>
                      <p className="text-sm text-gray-500">{report.description}</p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                        <span>Last run: {report.lastRun}</span>
                        {'createdBy' in report && <span>By: {String(report.createdBy)}</span>}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleRunReport(report.id)} className="flex-1">
                          <BarChart3 className="w-4 h-4 mr-1" />
                          Run
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleExportReport(report.id)}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {standardReports.filter(r => r.category === 'Financial').map((report) => (
                  <Card key={report.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{report.name}</CardTitle>
                      <p className="text-sm text-gray-500">{report.description}</p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                        <span>Last run: {report.lastRun}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleRunReport(report.id)} className="flex-1">
                          <BarChart3 className="w-4 h-4 mr-1" />
                          Run
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleExportReport(report.id)}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Custom Reports</CardTitle>
                <Button onClick={() => setShowReportBuilder(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customReports.map((report) => (
                  <Card key={report.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{report.name}</CardTitle>
                        <Badge variant="outline">{report.category}</Badge>
                      </div>
                      <p className="text-sm text-gray-500">{report.description}</p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                        <span>Last run: {report.lastRun}</span>
                        <span>By: {report.createdBy}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleRunReport(report.id)} className="flex-1">
                          <BarChart3 className="w-4 h-4 mr-1" />
                          Run
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleExportReport(report.id)}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
