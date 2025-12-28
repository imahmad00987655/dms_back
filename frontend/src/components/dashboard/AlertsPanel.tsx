
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, DollarSign, Package2, X } from "lucide-react";

export const AlertsPanel = () => {
  const alerts = [
    {
      id: 1,
      type: "overdue",
      icon: AlertTriangle,
      title: "Overdue Invoices",
      message: "5 invoices are overdue totaling $24,500",
      severity: "high",
      action: "View Overdue"
    },
    {
      id: 2,
      type: "low_stock",
      icon: Package2,
      title: "Low Stock Alert",
      message: "3 items are below reorder point",
      severity: "medium",
      action: "Reorder Items"
    },
    {
      id: 3,
      type: "cash_flow",
      icon: DollarSign,
      title: "Cash Flow Warning",
      message: "Cash balance projected to be low next week",
      severity: "medium",
      action: "View Forecast"
    },
    {
      id: 4,
      type: "pending",
      icon: Clock,
      title: "Pending Approvals",
      message: "2 expense reports awaiting approval",
      severity: "low",
      action: "Review"
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Card className="border-l-4 border-l-orange-400">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          System Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => {
            const Icon = alert.icon;
            return (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)} flex items-center justify-between`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <div>
                    <div className="font-medium">{alert.title}</div>
                    <div className="text-sm opacity-80">{alert.message}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    {alert.action}
                  </Button>
                  <Button size="sm" variant="ghost" className="p-1">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
