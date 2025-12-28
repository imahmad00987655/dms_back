
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const transactions = [
  {
    id: "TXN-001",
    description: "Sale to ABC Corp",
    amount: 15000,
    type: "income",
    date: "2024-06-01",
    status: "completed"
  },
  {
    id: "TXN-002",
    description: "Office Supplies Purchase",
    amount: -2500,
    type: "expense",
    date: "2024-06-01",
    status: "pending"
  },
  {
    id: "TXN-003",
    description: "Consulting Services",
    amount: 8500,
    type: "income",
    date: "2024-05-31",
    status: "completed"
  },
  {
    id: "TXN-004",
    description: "Equipment Lease",
    amount: -3200,
    type: "expense",
    date: "2024-05-31",
    status: "completed"
  },
  {
    id: "TXN-005",
    description: "Product Sales",
    amount: 22000,
    type: "income",
    date: "2024-05-30",
    status: "completed"
  },
];

export const RecentTransactions = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-500">{transaction.id} • {transaction.date}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={transaction.status === "completed" ? "default" : "secondary"}>
                  {transaction.status}
                </Badge>
                <div className={`text-right font-semibold ${
                  transaction.amount > 0 ? "text-green-600" : "text-red-600"
                }`}>
                  ${Math.abs(transaction.amount).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
