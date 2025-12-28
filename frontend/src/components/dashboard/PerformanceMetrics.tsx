
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Target, Calendar } from "lucide-react";

export const PerformanceMetrics = () => {
  const metrics = [
    {
      title: "Revenue Goal",
      current: 845000,
      target: 1000000,
      percentage: 84.5,
      trend: "up",
      period: "This Quarter"
    },
    {
      title: "Expense Control",
      current: 320000,
      target: 400000,
      percentage: 80,
      trend: "up",
      period: "Monthly Budget"
    },
    {
      title: "Collection Rate",
      current: 92,
      target: 95,
      percentage: 96.8,
      trend: "up",
      period: "Last 30 Days"
    },
    {
      title: "Profit Margin",
      current: 18.5,
      target: 20,
      percentage: 92.5,
      trend: "down",
      period: "Current Month"
    }
  ];

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => {
            const TrendIcon = metric.trend === "up" ? TrendingUp : TrendingDown;
            const trendColor = metric.trend === "up" ? "text-green-600" : "text-red-600";
            
            return (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">{metric.title}</h3>
                  <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{metric.percentage}%</span>
                  </div>
                  <Progress 
                    value={metric.percentage} 
                    className="h-2"
                  />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current</span>
                    <span className="font-medium">
                      {metric.title.includes("Rate") || metric.title.includes("Margin") 
                        ? `${metric.current}%` 
                        : `$${metric.current.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Target</span>
                    <span className="font-medium">
                      {metric.title.includes("Rate") || metric.title.includes("Margin") 
                        ? `${metric.target}%` 
                        : `$${metric.target.toLocaleString()}`}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  {metric.period}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
