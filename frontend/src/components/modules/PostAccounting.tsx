
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle, Clock, AlertCircle, Plus, BarChart3 } from "lucide-react";
import { PostAccountingDashboard } from "@/components/dashboards/PostAccountingDashboard";
import { JournalEntryForm } from "@/components/forms/JournalEntryForm";

const postingData = [
  {
    id: "PE-001",
    date: "2024-06-01",
    description: "Monthly Depreciation Expense",
    reference: "DEP-001",
    amount: 15000,
    status: "posted",
    createdBy: "John Smith",
    approvedBy: "Sarah Johnson",
    postingDate: "2024-06-01"
  },
  {
    id: "PE-002",
    date: "2024-06-01", 
    description: "Accrued Salaries Expense",
    reference: "SAL-001",
    amount: 8500,
    status: "pending",
    createdBy: "Mike Wilson",
    approvedBy: null,
    postingDate: null
  },
  {
    id: "PE-003",
    date: "2024-05-31",
    description: "Revenue Recognition Adjustment",
    reference: "REV-001", 
    amount: 45000,
    status: "posted",
    createdBy: "Lisa Chen",
    approvedBy: "Sarah Johnson",
    postingDate: "2024-05-31"
  }
];

export const PostAccounting = () => {
  const [showJournalForm, setShowJournalForm] = useState(false);

  const totalEntries = postingData.length;
  const postedEntries = postingData.filter(p => p.status === "posted").length;
  const pendingEntries = postingData.filter(p => p.status === "pending").length;

  if (showJournalForm) {
    return <JournalEntryForm onClose={() => setShowJournalForm(false)} />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Post Accounting</h1>
          <p className="text-gray-500 mt-1">Manage journal entries and posting processes</p>
        </div>
        <Button onClick={() => setShowJournalForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Journal Entry
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="entries" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Journal Entries
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <PostAccountingDashboard />
        </TabsContent>

        <TabsContent value="entries" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                <FileText className="w-4 h-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalEntries}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Posted</CardTitle>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{postedEntries}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="w-4 h-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{pendingEntries}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Journal Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Entry ID</th>
                      <th className="text-left py-3 px-4 font-semibold">Date</th>
                      <th className="text-left py-3 px-4 font-semibold">Description</th>
                      <th className="text-left py-3 px-4 font-semibold">Reference</th>
                      <th className="text-left py-3 px-4 font-semibold">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold">Created By</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {postingData.map((entry) => (
                      <tr key={entry.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{entry.id}</td>
                        <td className="py-3 px-4">{entry.date}</td>
                        <td className="py-3 px-4">{entry.description}</td>
                        <td className="py-3 px-4">{entry.reference}</td>
                        <td className="py-3 px-4 font-semibold">${entry.amount.toLocaleString()}</td>
                        <td className="py-3 px-4">{entry.createdBy}</td>
                        <td className="py-3 px-4">
                          <Badge variant={entry.status === "posted" ? "default" : "secondary"}>
                            {entry.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
