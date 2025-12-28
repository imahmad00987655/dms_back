
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const cashData = [
  { date: "Jan", balance: 250000 },
  { date: "Feb", balance: 280000 },
  { date: "Mar", balance: 320000 },
  { date: "Apr", balance: 290000 },
  { date: "May", balance: 340000 },
  { date: "Jun", balance: 380000 },
];

const bankAccounts = [
  {
    id: "ACC-001",
    bank: "Chase Business",
    accountNumber: "****1234",
    balance: 250000,
    type: "Operating",
    status: "active"
  },
  {
    id: "ACC-002",
    bank: "Wells Fargo",
    accountNumber: "****5678",
    balance: 100000,
    type: "Savings",
    status: "active"
  },
  {
    id: "ACC-003",
    bank: "Bank of America",
    accountNumber: "****9012",
    balance: 30000,
    type: "Payroll",
    status: "active"
  }
];

export const CashManagement = () => {
  const totalCash = bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const activeAccounts = bankAccounts.filter(acc => acc.status === "active").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cash Management</h1>
          <p className="text-gray-500 mt-1">Monitor cash balances and bank reconciliation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cash</CardTitle>
            <Wallet className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCash.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <Wallet className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAccounts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Growth</CardTitle>
            <TrendingUp className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+12.5%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cashData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Balance"]} />
                <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bank Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bankAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-medium">{account.bank}</div>
                    <div className="text-sm text-gray-500">{account.accountNumber} • {account.type}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${account.balance.toLocaleString()}</div>
                    <Badge variant="default">{account.status}</Badge>
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
