import { useState, useEffect } from "react";
import apiService from "@/services/api";
import { BinCardForm } from "@/components/forms/BinCardForm";

export interface BinCard {
  id?: number;
  item_code: string;
  item_name: string;
  bin_location?: string;
  warehouse?: string;
  unit_of_measure?: string;
  current_stock?: number;
  minimum_level?: number;
  reorder_level?: number;
  maximum_level?: number;
  transaction_type: string;
  transaction_quantity?: number;
  reference_number?: string;
  notes?: string;
}

export const BinCardDashboard = () => {
  const [cards, setCards] = useState<BinCard[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch bin cards from backend
  const fetchCards = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getBinCards();
      setCards(res.data || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load bin cards";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  // Add new bin card and refresh list
  const handleAdd = async (formData: BinCard) => {
    await apiService.createBinCard(formData);
    setShowForm(false);
    fetchCards();
  };

  return (
    <div className="p-4 space-y-4">
      <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => setShowForm(true)}>
        Add Bin Card
      </button>
      {showForm && (
        <BinCardForm
          onClose={() => setShowForm(false)}
          onSave={handleAdd}
        />
      )}
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr>
                <th className="border px-2 py-1">Item Code</th>
                <th className="border px-2 py-1">Item Name</th>
                <th className="border px-2 py-1">Warehouse</th>
                <th className="border px-2 py-1">Current Stock</th>
                <th className="border px-2 py-1">Transaction Type</th>
                <th className="border px-2 py-1">Transaction Qty</th>
                <th className="border px-2 py-1">Reference</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => (
                <tr key={card.id}>
                  <td className="border px-2 py-1">{card.item_code}</td>
                  <td className="border px-2 py-1">{card.item_name}</td>
                  <td className="border px-2 py-1">{card.warehouse}</td>
                  <td className="border px-2 py-1">{card.current_stock}</td>
                  <td className="border px-2 py-1">{card.transaction_type}</td>
                  <td className="border px-2 py-1">{card.transaction_quantity}</td>
                  <td className="border px-2 py-1">{card.reference_number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}; 