import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Receipt, CreditCard, Package, Database, DollarSign, HardDrive } from "lucide-react";
import { LoadForm } from "@/components/forms/LoadForm";
import { BinCardForm } from "@/components/forms/BinCardForm";
import { PaymentForm } from "@/components/forms/PaymentForm";
import { InvoiceForm } from "@/components/forms/InvoiceForm";
import { ExpenseForm } from "@/components/forms/ExpenseForm";
import { JournalEntryForm } from "@/components/forms/JournalEntryForm";
import { AssetForm } from "@/components/forms/AssetForm";

export const QuickActions = () => {
  const [activeForm, setActiveForm] = useState<string | null>(null);

  const actions = [
    {
      id: "invoice",
      title: "Create Invoice",
      description: "Generate a new customer invoice",
      icon: FileText,
      color: "bg-blue-500",
    },
    {
      id: "expense",
      title: "Add Expense",
      description: "Record a new business expense",
      icon: Receipt,
      color: "bg-green-500",
    },
    {
      id: "payment",
      title: "Process Payment",
      description: "Handle vendor or customer payments",
      icon: CreditCard,
      color: "bg-purple-500",
    },
    {
      id: "load",
      title: "Data Load",
      description: "Import data from external sources",
      icon: Database,
      color: "bg-orange-500",
    },
    {
      id: "bincard",
      title: "Bin Card",
      description: "Manage inventory bin cards",
      icon: Package,
      color: "bg-indigo-500",
    },
    {
      id: "journal",
      title: "Journal Entry",
      description: "Create new journal entries",
      icon: DollarSign,
      color: "bg-red-500",
    },
    {
      id: "asset",
      title: "Create Asset",
      description: "Add new fixed asset to register",
      icon: HardDrive,
      color: "bg-gray-500",
    },
  ];

  const handleActionClick = (actionId: string) => {
    setActiveForm(actionId);
  };

  const closeForm = () => {
    setActiveForm(null);
  };

  if (activeForm === "load") {
    return <LoadForm onClose={closeForm} />;
  }

  if (activeForm === "bincard") {
    return <BinCardForm onClose={closeForm} />;
  }

  if (activeForm === "payment") {
    return <PaymentForm onClose={closeForm} />;
  }

  if (activeForm === "invoice") {
    return <InvoiceForm onClose={closeForm} />;
  }

  if (activeForm === "expense") {
    return <ExpenseForm onClose={closeForm} />;
  }

  if (activeForm === "journal") {
    return <JournalEntryForm onClose={closeForm} />;
  }

  if (activeForm === "asset") {
    return <AssetForm onClose={closeForm} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start text-left"
                onClick={() => handleActionClick(action.id)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${action.color}`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium">{action.title}</span>
                </div>
                <p className="text-sm text-gray-500">{action.description}</p>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
