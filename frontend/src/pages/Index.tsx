
import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { GeneralAccounting } from "@/components/modules/GeneralAccounting";
import { InventoryManagement } from "@/components/modules/InventoryManagement";
import { DSRManagement } from "@/components/modules/DSRManagement";
import { PayrollManagement } from "@/components/modules/PayrollManagement";
import { PromotionalOffers } from "@/components/modules/PromotionalOffers";
import { ClaimManagement } from "@/components/modules/ClaimManagement";
import { Receivables } from "@/components/modules/Receivables";
import { Payables } from "@/components/modules/Payables";
import { CashManagement } from "@/components/modules/CashManagement";
import { FixedAssets } from "@/components/modules/FixedAssets";
import { IntercompanyAccounting } from "@/components/modules/IntercompanyAccounting";
import { BudgetaryControl } from "@/components/modules/BudgetaryControl";
import { PostAccounting } from "@/components/modules/PostAccounting";
import { ReceiptAccounting } from "@/components/modules/ReceiptAccounting";
import { Expenses } from "@/components/modules/Expenses";
import { Reports } from "@/components/modules/Reports";
import { CustomerSupplierManagement } from "@/components/modules/CustomerSupplierManagement";
import ProcurementManager from "@/components/modules/ProcurementManager";
import Settings from "@/components/modules/Settings";
import { SalesProcess } from "@/components/modules/SalesProcess";

const Index = () => {
  const [activeModule, setActiveModule] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderActiveModule = () => {
    switch (activeModule) {
      case "dashboard":
        return <DashboardContent />;
      case "general-accounting":
        return <GeneralAccounting />;
      case "inventory":
        return <InventoryManagement />;
      case "procurement":
        return <ProcurementManager />;
      case "receivables":
        return <Receivables />;
      case "payables":
        return <Payables />;
      case "cash-management":
        return <CashManagement />;
      case "fixed-assets":
        return <FixedAssets />;
      case "intercompany":
        return <IntercompanyAccounting />;
      case "budgetary-control":
        return <BudgetaryControl />;
      case "post-accounting":
        return <PostAccounting />;
      case "receipt-accounting":
        return <ReceiptAccounting />;
      case "expenses":
        return <Expenses />;
      case "reports":
        return <Reports />;
      case "dsr-management":
        return <DSRManagement />;
      case "payroll":
        return <PayrollManagement />;
      case "promotions":
        return <PromotionalOffers />;
      case "claims":
        return <ClaimManagement />;
      case "customer-supplier":
        return <CustomerSupplierManagement />;
      case "sales-process":
        return <SalesProcess />;
      case "settings":
        return <Settings />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 overflow-hidden">
      <Sidebar 
        activeModule={activeModule} 
        setActiveModule={setActiveModule}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />
      
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile overlay when sidebar is open */}
        {!sidebarCollapsed && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
            onClick={() => setSidebarCollapsed(true)}
          />
        )}
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="min-h-full">
            {renderActiveModule()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
