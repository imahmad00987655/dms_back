
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Building2, AlertTriangle } from "lucide-react";
import { IntercompanyTransactionForm } from "@/components/forms/IntercompanyTransactionForm";

const intercompanyData = [
  {
    id: "IC-2024-001",
    transactionNumber: "IC-2024-001",
    date: "2024-06-01",
    fromEntity: "Main Office",
    toEntity: "Branch A",
    type: "RECHARGE",
    description: "Shared service costs allocation",
    amount: 25000,
    status: "pending",
    currency: "USD"
  },
  {
    id: "IC-2024-002",
    transactionNumber: "IC-2024-002",
    date: "2024-05-28",
    fromEntity: "Branch A",
    toEntity: "Branch B",
    type: "LOAN",
    description: "Inter-branch loan facility",
    amount: 50000,
    status: "matched",
    currency: "USD"
  },
  {
    id: "IC-2024-003",
    transactionNumber: "IC-2024-003",
    date: "2024-05-25",
    fromEntity: "Branch B",
    toEntity: "Main Office",
    type: "SERVICE",
    description: "IT support services",
    amount: 15000,
    status: "reconciled",
    currency: "USD"
  }
];

export const IntercompanyAccounting = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  const filteredTransactions = intercompanyData.filter(transaction =>
    transaction.transactionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.fromEntity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.toEntity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalTransactions = intercompanyData.reduce((sum, t) => sum + t.amount, 0);
  const pendingTransactions = intercompanyData.filter(t => t.status === "pending").length;
  const reconciledTransactions = intercompanyData.filter(t => t.status === "reconciled").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "matched":
        return <Badge className="bg-yellow-100 text-yellow-800">Matched</Badge>;
      case "reconciled":
        return <Badge className="bg-green-100 text-green-800">Reconciled</Badge>;
      case "disputed":
        return <Badge variant="destructive">Disputed</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  if (showTransactionForm) {
    return <IntercompanyTransactionForm onClose={() => setShowTransactionForm(false)} />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Intercompany Accounting</h1>
          <p className="text-gray-500 mt-1">Manage transactions between related entities</p>
        </div>
        <Button onClick={() => setShowTransactionForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Transaction
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Building2 className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalTransactions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Transactions</CardTitle>
            <AlertTriangle className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingTransactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reconciled Transactions</CardTitle>
            <Building2 className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{reconciledTransactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entities</CardTitle>
            <Building2 className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Transaction</th>
                  <th className="text-left py-3 px-4 font-semibold">From Entity</th>
                  <th className="text-left py-3 px-4 font-semibold">To Entity</th>
                  <th className="text-left py-3 px-4 font-semibold">Type</th>
                  <th className="text-left py-3 px-4 font-semibold">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{transaction.transactionNumber}</div>
                        <div className="text-sm text-gray-500">{transaction.description}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{transaction.fromEntity}</td>
                    <td className="py-3 px-4">{transaction.toEntity}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{transaction.type}</Badge>
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      ${transaction.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">{transaction.date}</td>
                    <td className="py-3 px-4">{getStatusBadge(transaction.status)}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        {transaction.status === "pending" && (
                          <Button size="sm" variant="outline">
                            Match
                          </Button>
                        )}
                        {transaction.status === "matched" && (
                          <Button size="sm">
                            Reconcile
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
