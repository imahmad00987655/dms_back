
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, DollarSign, CreditCard, TrendingUp, Clock } from "lucide-react";

export const ReceiptAccountingDashboard = () => {
  const receiptMetrics = {
    totalReceipts: 245,
    totalAmount: 485000,
    processedReceipts: 220,
    pendingReceipts: 25,
    avgReceiptValue: 1980
  };

  const paymentMethods = [
    { method: "Bank Transfer", count: 120, amount: 285000, percentage: 58.8 },
    { method: "Credit Card", count: 85, amount: 145000, percentage: 29.9 },
    { method: "Check", count: 30, amount: 45000, percentage: 9.3 },
    { method: "Cash", count: 10, amount: 10000, percentage: 2.0 }
  ];

  const recentReceipts = [
    { id: "RCP-001", customer: "ABC Corporation", amount: 15000, method: "Bank Transfer", status: "processed" },
    { id: "RCP-002", customer: "StartupCo", amount: 3200, method: "Credit Card", status: "processed" },
    { id: "RCP-003", customer: "Tech Solutions", amount: 11000, method: "Check", status: "pending" }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
            <Receipt className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{receiptMetrics.totalReceipts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${receiptMetrics.totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{receiptMetrics.processedReceipts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{receiptMetrics.pendingReceipts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Value</CardTitle>
            <CreditCard className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${receiptMetrics.avgReceiptValue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentMethods.map((method, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{method.method}</div>
                    <div className="text-sm text-gray-500">{method.count} transactions</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${method.amount.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">{method.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Receipts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentReceipts.map((receipt) => (
                <div key={receipt.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{receipt.id}</div>
                    <div className="text-sm text-gray-500">{receipt.customer}</div>
                    <div className="text-xs text-gray-400">{receipt.method}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${receipt.amount.toLocaleString()}</div>
                    <Badge variant={receipt.status === "processed" ? "default" : "secondary"}>
                      {receipt.status}
                    </Badge>
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
