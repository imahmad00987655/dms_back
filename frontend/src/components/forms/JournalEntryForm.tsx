import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Save, BookOpen } from "lucide-react";
import apiService from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface JournalLineItem {
  id: string;
  accountCode: string;
  accountName: string;
  accountId?: number;
  description: string;
  debitAmount: number | string;
  creditAmount: number | string;
}

interface Account {
  id: number;
  account_code: string;
  account_name: string;
  account_type: string;
}

interface JournalEntryFormProps {
  onClose: () => void;
  entry?: any;
}

export const JournalEntryForm = ({ onClose, entry }: JournalEntryFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [entryData, setEntryData] = useState({
    entryId: `JE-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    description: "",
    reference: "",
    status: "draft"
  });

  const [lineItems, setLineItems] = useState<JournalLineItem[]>([
    {
      id: "1",
      accountCode: "",
      accountName: "",
      description: "",
      debitAmount: "",
      creditAmount: ""
    }
  ]);

  // Load accounts from API
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const response = await apiService.getChartOfAccounts();
        setAccounts(response.data);
      } catch (error) {
        console.error('Error loading accounts:', error);
        toast({
          title: "Error",
          description: "Failed to load accounts",
          variant: "destructive"
        });
      }
    };
    loadAccounts();
  }, [toast]);

  // If editing, initialize state from entry
  useEffect(() => {
    if (entry) {
      setEntryData({
        entryId: entry.entry_id,
        date: (entry.entry_date || '').slice(0, 10),
        description: entry.description,
        reference: entry.reference,
        status: entry.status || "draft"
      });
      setLineItems(
        (entry.line_items || []).map((li: any, idx: number) => ({
          id: String(idx + 1),
          accountCode: li.account_code,
          accountName: li.account_name,
          accountId: li.account_id,
          description: li.description,
          debitAmount: li.debit_amount,
          creditAmount: li.credit_amount
        }))
      );
    }
  }, [entry]);

  const addLineItem = () => {
    const newItem: JournalLineItem = {
      id: Date.now().toString(),
      accountCode: "",
      accountName: "",
      description: "",
      debitAmount: "",
      creditAmount: ""
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof JournalLineItem, value: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        if (field === "accountCode") {
          const account = accounts.find(acc => acc.account_code === value);
          return { 
            ...item, 
            accountCode: value,
            accountName: account ? account.account_name : "",
            accountId: account ? account.id : undefined
          };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleSave = async (status: string) => {
    // Filter out line items with no account selected
    const validLineItems = lineItems.filter(item => item.accountId);

    if (validLineItems.length < 1) {
      toast({
        title: "Error",
        description: "At least one valid line item with an account is required.",
        variant: "destructive"
      });
      return;
    }

    // Check if balanced
    const totalDebit = validLineItems.reduce((sum, item) => sum + Number(item.debitAmount || 0), 0);
    const totalCredit = validLineItems.reduce((sum, item) => sum + Number(item.creditAmount || 0), 0);
    const isBalanced = totalDebit === totalCredit && totalDebit > 0;
    if (!isBalanced) {
      toast({
        title: "Error",
        description: "Journal entry must balance before saving",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const journalEntry = {
        entry_id: entryData.entryId,
        entry_date: (entryData.date || '').slice(0, 10),
        description: entryData.description,
        reference: entryData.reference,
        status,
        line_items: validLineItems.map(item => ({
          account_id: item.accountId,
          description: item.description,
          debit_amount: Number(item.debitAmount) || 0,
          credit_amount: Number(item.creditAmount) || 0
        }))
      };

      if (entry && entry.id) {
        await apiService.updateJournalEntry(entry.id, journalEntry);
        toast({
          title: "Success",
          description: "Journal entry updated successfully",
        });
      } else {
        await apiService.createJournalEntry(journalEntry);
        toast({
          title: "Success",
          description: "Journal entry saved successfully",
        });
      }
      onClose();
    } catch (error: any) {
      console.error("Error saving journal entry:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save journal entry",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Use validLineItems for totals and balance in render
  const validLineItems = lineItems.filter(item => item.accountId);
  const totalDebit = validLineItems.reduce((sum, item) => sum + Number(item.debitAmount || 0), 0);
  const totalCredit = validLineItems.reduce((sum, item) => sum + Number(item.creditAmount || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  return (
    <Card className="max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Journal Entry
          <Badge variant="outline" className="ml-auto">
            {entryData.status.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="entryId">Entry ID</Label>
            <Input
              id="entryId"
              value={entryData.entryId}
              onChange={(e) => setEntryData({...entryData, entryId: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={entryData.date}
              onChange={(e) => setEntryData({...entryData, date: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="reference">Reference</Label>
            <Input
              id="reference"
              placeholder="Reference number"
              value={entryData.reference}
              onChange={(e) => setEntryData({...entryData, reference: e.target.value})}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Journal entry description"
            value={entryData.description}
            onChange={(e) => setEntryData({...entryData, description: e.target.value})}
            rows={2}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Line Items</h3>
            <Button onClick={addLineItem} size="sm" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Line
            </Button>
          </div>
          
          <div className="space-y-4">
            {lineItems.map((item, index) => (
              <Card key={item.id} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div>
                    <Label>Account</Label>
                    <Select
                      value={item.accountCode}
                      onValueChange={(value) => updateLineItem(item.id, "accountCode", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map(account => (
                          <SelectItem key={account.account_code} value={account.account_code}>
                            {account.account_code} - {account.account_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="Line description"
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Debit</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.debitAmount}
                      onChange={(e) => updateLineItem(item.id, "debitAmount", e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Credit</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.creditAmount}
                      onChange={(e) => updateLineItem(item.id, "creditAmount", e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex items-end">
                    {lineItems.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeLineItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <div className="w-80 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between mb-2">
              <span>Total Debit:</span>
              <span className="font-semibold">${totalDebit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Total Credit:</span>
              <span className="font-semibold">${totalCredit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Difference:</span>
              <span className={`${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(totalDebit - totalCredit).toFixed(2)}
              </span>
            </div>
            {!isBalanced && (
              <p className="text-sm text-red-600 mt-2">Entry must balance to save</p>
            )}
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleSave("draft")}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? "Saving..." : "Save Draft"}
            </Button>
            <Button 
              onClick={() => handleSave("posted")}
              disabled={!isBalanced || loading}
              className="flex items-center gap-2"
            >
              {loading ? "Posting..." : "Post Entry"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
