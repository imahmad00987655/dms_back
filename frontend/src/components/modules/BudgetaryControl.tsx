
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";

const budgetData = [
  {
    category: "Revenue",
    budgeted: 1000000,
    actual: 850000,
    variance: -150000,
    percentUsed: 85
  },
  {
    category: "Operating Expenses",
    budgeted: 600000,
    actual: 520000,
    variance: -80000,
    percentUsed: 87
  },
  {
    category: "Marketing",
    budgeted: 150000,
    actual: 165000,
    variance: 15000,
    percentUsed: 110
  },
  {
    category: "Technology",
    budgeted: 200000,
    actual: 180000,
    variance: -20000,
    percentUsed: 90
  }
];

export const BudgetaryControl = () => {
  const totalBudgeted = budgetData.reduce((sum, b) => sum + b.budgeted, 0);
  const totalActual = budgetData.reduce((sum, b) => sum + b.actual, 0);
  const totalVariance = totalActual - totalBudgeted;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Budgetary Control</h1>
          <p className="text-gray-500 mt-1">Monitor budget performance and variance analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <Target className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBudgeted.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actual Spending</CardTitle>
            <Target className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalActual.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variance</CardTitle>
            <Target className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalVariance >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${Math.abs(totalVariance).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget vs Actual Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {budgetData.map((budget) => (
              <div key={budget.category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{budget.category}</h3>
                  <span className="text-sm text-gray-500">
                    {budget.percentUsed}% of budget used
                  </span>
                </div>
                <Progress value={budget.percentUsed} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span>Budgeted: ${budget.budgeted.toLocaleString()}</span>
                  <span>Actual: ${budget.actual.toLocaleString()}</span>
                  <span className={budget.variance >= 0 ? "text-red-600" : "text-green-600"}>
                    Variance: ${Math.abs(budget.variance).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
