
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Package, Users } from "lucide-react";

export const MetricsCards = () => {
  const metrics = [
    {
      title: "Total Revenue",
      value: "$1,234,567",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
    },
    {
      title: "Accounts Receivable",
      value: "$345,678",
      change: "-3.2%",
      trend: "down",
      icon: CreditCard,
    },
    {
      title: "Inventory Value",
      value: "$567,890",
      change: "+8.7%",
      trend: "up",
      icon: Package,
    },
    {
      title: "Active Customers",
      value: "2,456",
      change: "+15.3%",
      trend: "up",
      icon: Users,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const TrendIcon = metric.trend === "up" ? TrendingUp : TrendingDown;
        
        return (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {metric.title}
              </CardTitle>
              <Icon className="w-4 h-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
              <div className="flex items-center text-sm mt-1">
                <TrendIcon 
                  className={`w-4 h-4 mr-1 ${
                    metric.trend === "up" ? "text-green-600" : "text-red-600"
                  }`} 
                />
                <span className={metric.trend === "up" ? "text-green-600" : "text-red-600"}>
                  {metric.change}
                </span>
                <span className="text-gray-500 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
