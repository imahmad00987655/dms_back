
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, Clock, AlertCircle, DollarSign } from "lucide-react";

export const PostAccountingDashboard = () => {
  const postingMetrics = {
    totalEntries: 1456,
    postedEntries: 1320,
    pendingEntries: 136,
    rejectedEntries: 12,
    totalAmount: 2450000
  };

  const recentPostings = [
    { id: "PE-001", description: "Monthly Depreciation", amount: 15000, status: "posted", date: "2024-06-01" },
    { id: "PE-002", description: "Accrued Expenses", amount: 8500, status: "pending", date: "2024-06-01" },
    { id: "PE-003", description: "Revenue Recognition", amount: 45000, status: "posted", date: "2024-05-31" }
  ];

  const accountCategories = [
    { category: "Assets", entries: 456, amount: 1200000 },
    { category: "Liabilities", entries: 234, amount: 650000 },
    { category: "Equity", entries: 123, amount: 400000 },
    { category: "Revenue", entries: 345, amount: 350000 },
    { category: "Expenses", entries: 298, amount: 280000 }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <FileText className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{postingMetrics.totalEntries.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posted</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{postingMetrics.postedEntries.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{postingMetrics.pendingEntries}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <AlertCircle className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{postingMetrics.rejectedEntries}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${postingMetrics.totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Postings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPostings.map((posting) => (
                <div key={posting.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{posting.id}</div>
                    <div className="text-sm text-gray-500">{posting.description}</div>
                    <div className="text-xs text-gray-400">{posting.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${posting.amount.toLocaleString()}</div>
                    <Badge variant={posting.status === "posted" ? "default" : "secondary"}>
                      {posting.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {accountCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{category.category}</div>
                    <div className="text-sm text-gray-500">{category.entries} entries</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${category.amount.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
