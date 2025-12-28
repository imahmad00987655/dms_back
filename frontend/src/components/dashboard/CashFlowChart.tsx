
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Jan", inflow: 85000, outflow: 62000 },
  { month: "Feb", inflow: 92000, outflow: 68000 },
  { month: "Mar", inflow: 78000, outflow: 55000 },
  { month: "Apr", inflow: 105000, outflow: 75000 },
  { month: "May", inflow: 88000, outflow: 64000 },
  { month: "Jun", inflow: 112000, outflow: 82000 },
];

export const CashFlowChart = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Flow Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, ""]} />
            <Bar dataKey="inflow" fill="#10b981" name="Cash Inflow" />
            <Bar dataKey="outflow" fill="#f59e0b" name="Cash Outflow" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
