
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Receipt, DollarSign, BarChart3 } from "lucide-react";
import { ReceiptAccountingDashboard } from "@/components/dashboards/ReceiptAccountingDashboard";

const receiptsData = [
  {
    id: "RCP-001",
    date: "2024-06-01",
    customer: "ABC Corporation",
    invoiceId: "INV-2024-001",
    amount: 15000,
    paymentMethod: "Bank Transfer",
    status: "processed"
  },
  {
    id: "RCP-002",
    date: "2024-06-01",
    customer: "StartupCo",
    invoiceId: "INV-2024-004",
    amount: 3200,
    paymentMethod: "Credit Card",
    status: "processed"
  },
  {
    id: "RCP-003",
    date: "2024-05-31",
    customer: "Tech Solutions Ltd",
    invoiceId: "INV-2024-003",
    amount: 11000,
    paymentMethod: "Check",
    status: "pending"
  }
];

export const ReceiptAccounting = () => {
  const totalReceipts = receiptsData.reduce((sum, r) => sum + r.amount, 0);
  const processedReceipts = receiptsData.filter(r => r.status === "processed").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Receipt Accounting</h1>
          <p className="text-gray-500 mt-1">Track and manage customer payments and receipts</p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="receipts" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Receipts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <ReceiptAccountingDashboard />
        </TabsContent>

        <TabsContent value="receipts" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
                <Receipt className="w-4 h-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalReceipts.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Processed</CardTitle>
                <DollarSign className="w-4 h-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{processedReceipts}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <DollarSign className="w-4 h-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{receiptsData.length - processedReceipts}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Receipts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Receipt ID</th>
                      <th className="text-left py-3 px-4 font-semibold">Date</th>
                      <th className="text-left py-3 px-4 font-semibold">Customer</th>
                      <th className="text-left py-3 px-4 font-semibold">Invoice</th>
                      <th className="text-left py-3 px-4 font-semibold">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold">Payment Method</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptsData.map((receipt) => (
                      <tr key={receipt.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{receipt.id}</td>
                        <td className="py-3 px-4">{receipt.date}</td>
                        <td className="py-3 px-4">{receipt.customer}</td>
                        <td className="py-3 px-4">{receipt.invoiceId}</td>
                        <td className="py-3 px-4 font-semibold text-green-600">${receipt.amount.toLocaleString()}</td>
                        <td className="py-3 px-4">{receipt.paymentMethod}</td>
                        <td className="py-3 px-4">
                          <Badge variant={receipt.status === "processed" ? "default" : "secondary"}>
                            {receipt.status}
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
