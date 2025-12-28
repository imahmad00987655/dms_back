import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  Calculator, 
  Users,
  Gift,
  AlertTriangle,
  Settings,
  UserCheck,
  CreditCard,
  Receipt,
  Building2,
  HardDrive,
  TrendingUp,
  DollarSign,
  PieChart,
  Banknote,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShoppingCart
} from "lucide-react";

interface SidebarProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar = ({ activeModule, setActiveModule, isCollapsed, setIsCollapsed }: SidebarProps) => {
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

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      description: "Overview & Analytics",
      color: "text-blue-600"
    },
    {
      id: "general-accounting", 
      label: "General Accounting",
      icon: Calculator,
      description: "Journal Entries & GL",
      color: "text-emerald-600"
    },
    {
      id: "inventory",
      label: "Inventory",
      icon: Package,
      description: "Stock Management",
      color: "text-purple-600"
    },
    {
      id: "procurement",
      label: "Procurement",
      icon: ShoppingCart,
      description: "Purchase Orders & Agreements",
      color: "text-blue-700"
    },
    {
      id: "receivables",
      label: "Receivables", 
      icon: Receipt,
      description: "Customer Invoices & Payments",
      color: "text-green-600"
    },
    {
      id: "payables",
      label: "Payables",
      icon: CreditCard, 
      description: "Vendor Bills & Payments",
      color: "text-red-600"
    },
    {
      id: "cash-management",
      label: "Cash Management",
      icon: Banknote,
      description: "Bank & Cash Accounts",
      color: "text-yellow-600"
    },
    {
      id: "fixed-assets",
      label: "Fixed Assets",
      icon: HardDrive,
      description: "Asset Management",
      color: "text-gray-600"
    },
    {
      id: "intercompany",
      label: "Intercompany",
      icon: Building2,
      description: "Inter-entity Transactions",
      color: "text-indigo-600"
    },
    {
      id: "budgetary-control",
      label: "Budgetary Control",
      icon: PieChart,
      description: "Budget Management",
      color: "text-pink-600"
    },
    {
      id: "post-accounting",
      label: "Post Accounting",
      icon: TrendingUp,
      description: "Period End Processing",
      color: "text-cyan-600"
    },
    {
      id: "receipt-accounting",
      label: "Receipt Accounting", 
      icon: DollarSign,
      description: "Receipt Processing",
      color: "text-teal-600"
    },
    {
      id: "expenses",
      label: "Expenses",
      icon: FileText,
      description: "Expense Management",
      color: "text-orange-600"
    },
    {
      id: "reports",
      label: "Reports",
      icon: FileText,
      description: "Financial Reports",
      color: "text-slate-600"
    },
    {
      id: "dsr-management",
      label: "DSR Management",
      icon: UserCheck,
      description: "Sales Rep Management",
      color: "text-violet-600"
    },
    {
      id: "payroll",
      label: "PayMaster Pro",
      icon: Users,
      description: "Payroll Management",
      color: "text-blue-500"
    },
    {
      id: "promotions",
      label: "OfferFlow",
      icon: Gift,
      description: "Promotional Offers",
      color: "text-rose-600"
    },
    {
      id: "claims",
      label: "ClaimTracker", 
      icon: AlertTriangle,
      description: "Claim Management",
      color: "text-amber-600"
    },
    {
      id: "customer-supplier",
      label: "Customer/Supplier",
      icon: Users,
      description: "Party Management",
      color: "text-emerald-500"
    },
    {
      id: "sales-process",
      label: "Sales Process",
      icon: TrendingUp,
      description: "Sales Management Hub",
      color: "text-blue-500"
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      description: "Application Settings",
      color: "text-gray-600"
    }
  ];

  const handleItemClick = (itemId: string) => {
    setActiveModule(itemId);
    // Auto-collapse on mobile after selection
    if (window.innerWidth < 1024) {
      setIsCollapsed(true);
    }
  };

  return (
    <>
      <div className={`${
        isCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0 w-80'
      } fixed lg:relative top-0 left-0 h-full transition-all duration-300 ease-in-out z-40 lg:z-auto`}>
        <div className="h-full bg-white/95 backdrop-blur-xl shadow-2xl border-r border-gray-200/50 flex flex-col">
          {/* Collapsed sidebar open button at the top */}
          {isCollapsed && (
            <div className="flex flex-col items-center pt-6 gap-6">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleSidebar}
                className="bg-white/90 backdrop-blur-sm shadow-lg border-gray-200 hover:bg-white mb-4"
              >
                <Menu className="w-6 h-6 text-blue-600" />
              </Button>
            </div>
          )}
          {/* Header */}
          <div className="p-4 lg:p-6 border-b border-gray-100 flex-shrink-0">
            <div className={`${isCollapsed ? 'lg:hidden' : 'block'} min-w-0 flex-1 mb-4 lg:mb-0`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <LayoutDashboard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      AccuFlow DMS
                    </h1>
                    <p className="text-xs text-gray-500">Distribution Management</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className={`p-2 hover:bg-gray-100 rounded-xl transition-colors ${
                    isCollapsed ? 'lg:w-full lg:justify-center' : ''
                  }`}
                >
                  {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 lg:px-4">
            <nav className="py-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={`w-full ${
                      isCollapsed ? 'lg:justify-center lg:px-2' : 'justify-start px-3'
                    } h-auto py-3 text-left transition-all duration-200 group relative overflow-hidden ${
                      isActive
                        ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 shadow-md border border-blue-100"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    onClick={() => handleItemClick(item.id)}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className={`flex items-center w-full ${isCollapsed ? 'lg:justify-center' : ''}`}>
                      <div className={`relative ${isActive ? item.color : 'text-gray-500 group-hover:text-gray-700'}`}>
                        <Icon className="w-5 h-5 transition-colors" />
                        {isActive && (
                          <div className="absolute -inset-1 bg-blue-100 rounded-lg -z-10 animate-pulse" />
                        )}
                      </div>
                      
                      {!isCollapsed && (
                        <div className="text-left min-w-0 flex-1 ml-3">
                          <div className="font-medium text-sm truncate flex items-center justify-between">
                            {item.label}
                            {isActive && <ChevronRight className="w-4 h-4 text-blue-500" />}
                          </div>
                          <div className="text-xs opacity-75 truncate">{item.description}</div>
                        </div>
                      )}
                    </div>
                    
                    {isActive && (
                      <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 rounded-r" />
                    )}
                  </Button>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="p-3 lg:p-4 border-t border-gray-100 space-y-2 flex-shrink-0">
            <Button 
              variant="ghost" 
              className={`w-full ${
                isCollapsed ? 'lg:justify-center lg:px-2' : 'justify-start'
              } text-sm hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200`}
              onClick={handleLogout}
              title={isCollapsed ? "Logout" : undefined}
            >
              <LogOut className="w-4 h-4 flex-shrink-0 text-gray-500" />
              {!isCollapsed && <span className="ml-3 truncate">Logout</span>}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
