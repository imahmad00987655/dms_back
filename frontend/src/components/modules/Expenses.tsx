
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, ShoppingCart, Eye, Edit, Download } from "lucide-react";
import { ExpenseForm } from "@/components/forms/ExpenseForm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const expensesData = [
  {
    id: "EXP-001",
    date: "2024-06-01",
    category: "Office Supplies",
    description: "Monthly office supplies purchase",
    amount: 1250,
    vendor: "Office Depot",
    status: "approved",
    employee: "John Smith",
    department: "Administration",
    project: "General Operations",
    receipt: "Yes",
    paymentMethod: "Corporate Card",
    approvedBy: "Sarah Johnson",
    approvalDate: "2024-06-02",
    reimbursable: "No",
    taxAmount: 125,
    currency: "USD",
    exchangeRate: 1.0,
    businessPurpose: "Monthly office supplies for Q2 operations"
  },
  {
    id: "EXP-002",
    date: "2024-06-01",
    category: "Travel",
    description: "Business travel to client site",
    amount: 850,
    vendor: "Delta Airlines",
    status: "pending",
    employee: "Sarah Johnson",
    department: "Sales",
    project: "Client Acquisition",
    receipt: "Yes",
    paymentMethod: "Personal Card",
    approvedBy: null,
    approvalDate: null,
    reimbursable: "Yes",
    taxAmount: 0,
    currency: "USD",
    exchangeRate: 1.0,
    businessPurpose: "Client meeting for new contract negotiation"
  },
  {
    id: "EXP-003",
    date: "2024-05-31",
    category: "Software",
    description: "Software subscription renewal",
    amount: 299,
    vendor: "Adobe Inc",
    status: "approved",
    employee: "Mike Wilson",
    department: "Marketing",
    project: "Brand Development",
    receipt: "Yes",
    paymentMethod: "Corporate Card",
    approvedBy: "Lisa Chen",
    approvalDate: "2024-06-01",
    reimbursable: "No",
    taxAmount: 29.9,
    currency: "USD",
    exchangeRate: 1.0,
    businessPurpose: "Creative Cloud subscription for design work"
  },
  {
    id: "EXP-004",
    date: "2024-05-30",
    category: "Marketing",
    description: "Digital advertising campaign",
    amount: 2500,
    vendor: "Google Ads",
    status: "approved",
    employee: "Lisa Chen",
    department: "Marketing",
    project: "Q2 Campaign",
    receipt: "Yes",
    paymentMethod: "Corporate Card",
    approvedBy: "Sarah Johnson",
    approvalDate: "2024-05-31",
    reimbursable: "No",
    taxAmount: 250,
    currency: "USD",
    exchangeRate: 1.0,
    businessPurpose: "Digital marketing campaign for product launch"
  }
];

export const Expenses = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const filteredExpenses = expensesData.filter(expense =>
    expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.employee.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpenses = expensesData.reduce((sum, expense) => sum + expense.amount, 0);
  const pendingExpenses = expensesData.filter(e => e.status === "pending").length;
  const approvedExpenses = expensesData.filter(e => e.status === "approved").length;
  const reimbursableExpenses = expensesData.filter(e => e.reimbursable === "Yes").reduce((sum, e) => sum + e.amount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  if (showExpenseForm) {
    return <ExpenseForm onClose={() => setShowExpenseForm(false)} />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expense Management</h1>
          <p className="text-gray-500 mt-1">Track and manage business expenses</p>
        </div>
        <Button onClick={() => setShowExpenseForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <ShoppingCart className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalExpenses.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <ShoppingCart className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedExpenses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <ShoppingCart className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingExpenses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reimbursable</CardTitle>
            <ShoppingCart className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${reimbursableExpenses.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Count</CardTitle>
            <ShoppingCart className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expensesData.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Expense Details</TableHead>
                <TableHead>Employee & Department</TableHead>
                <TableHead>Financial Information</TableHead>
                <TableHead>Approval & Status</TableHead>
                <TableHead>Business Details</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{expense.id}</div>
                      <div className="text-sm text-gray-600">{expense.description}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {expense.category} • {expense.date}
                      </div>
                      <div className="text-xs text-gray-500">
                        Vendor: {expense.vendor}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{expense.employee}</div>
                      <div className="text-sm text-gray-600">{expense.department}</div>
                      <div className="text-xs text-gray-500">
                        Project: {expense.project}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-semibold">${expense.amount.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">
                        Tax: ${expense.taxAmount.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        Payment: {expense.paymentMethod}
                      </div>
                      <Badge variant={expense.reimbursable === "Yes" ? "default" : "secondary"}>
                        {expense.reimbursable === "Yes" ? "Reimbursable" : "Corporate"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      {getStatusBadge(expense.status)}
                      {expense.approvedBy && (
                        <div className="text-xs text-gray-600 mt-1">
                          By: {expense.approvedBy}
                        </div>
                      )}
                      {expense.approvalDate && (
                        <div className="text-xs text-gray-500">
                          Date: {expense.approvalDate}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-xs text-gray-600">
                        Purpose: {expense.businessPurpose}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Receipt: {expense.receipt}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline">
                        <Eye className="w-3 h-3" />
                      </Button>
                      {expense.status === "pending" && (
                        <Button size="sm" variant="outline">
                          <Edit className="w-3 h-3" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
