
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MetricsCards } from "./MetricsCards";
import { RevenueChart } from "./RevenueChart";
import { RecentTransactions } from "./RecentTransactions";
import { CashFlowChart } from "./CashFlowChart";
import { QuickActions } from "./QuickActions";
import { AlertsPanel } from "./AlertsPanel";
import { PerformanceMetrics } from "./PerformanceMetrics";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, TrendingUp, AlertTriangle, Clock, LogOut, Filter, Download, RefreshCw } from "lucide-react";

export const DashboardContent = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("current_month");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: clear storage and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
      navigate('/login');
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const periods = [
    { value: "current_month", label: "Current Month" },
    { value: "last_month", label: "Last Month" },
    { value: "quarter", label: "This Quarter" },
    { value: "year", label: "This Year" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                Financial Dashboard
              </h1>
            </div>
            <p className="text-gray-600 text-base sm:text-lg font-medium">
              Welcome back! Here's your business performance overview.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-500">Live data • Last updated 2 mins ago</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="appearance-none px-4 py-2.5 pr-10 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-all duration-200"
              >
                {periods.map(period => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:border-gray-300 transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            
            <Button 
              size="sm"
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Generate Report</span>
              <span className="sm:hidden">Report</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-2 text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 rounded-xl"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Enhanced Alerts Panel */}
        <AlertsPanel />

        {/* Enhanced Metrics */}
        <MetricsCards />

        {/* Enhanced Performance Metrics */}
        <PerformanceMetrics />

        {/* Enhanced Quick Actions */}
        <QuickActions />

        {/* Enhanced Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          <RevenueChart />
          <CashFlowChart />
        </div>

        {/* Enhanced Recent Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          <div className="xl:col-span-2">
            <RecentTransactions />
          </div>
          
          <Card className="bg-gradient-to-br from-white to-gray-50/50 border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Financial Health Score
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                    85
                  </div>
                  <div className="absolute -inset-4 bg-green-100 rounded-full opacity-20 animate-pulse" />
                </div>
                <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200 font-medium">
                  Excellent Performance
                </Badge>
              </div>
              
              <div className="space-y-4">
                {[
                  { label: "Cash Flow", value: 92, color: "green" },
                  { label: "Profitability", value: 88, color: "green" },
                  { label: "Liquidity", value: 76, color: "yellow" },
                  { label: "Efficiency", value: 84, color: "green" }
                ].map((metric) => (
                  <div key={metric.label} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                      <span className={`text-sm font-bold ${
                        metric.color === 'green' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {metric.value}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          metric.color === 'green' 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                            : 'bg-gradient-to-r from-yellow-500 to-amber-500'
                        }`}
                        style={{ width: `${metric.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
