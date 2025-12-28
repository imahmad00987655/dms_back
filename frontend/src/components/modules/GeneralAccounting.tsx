import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JournalEntryForm } from "@/components/forms/JournalEntryForm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import apiService from "@/services/api";

// Simple modal for viewing details
function Modal({ open, onClose, children }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[350px] max-w-lg">
        <div className="flex justify-end mb-2">
          <button onClick={onClose} className="text-gray-500 hover:text-black">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const GeneralAccounting = () => {
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [editEntry, setEditEntry] = useState<any | null>(null);
  const [viewEntry, setViewEntry] = useState<any | null>(null);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const fetchEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getJournalEntries();
      setJournalEntries(response.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load journal entries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this journal entry?")) return;
    setDeletingId(id);
    setDeleteError(null);
    try {
      await apiService.request(`/journal-entries/${id}`, { method: "DELETE" });
      await fetchEntries();
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete entry");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = async (id: string) => {
    setEditLoading(true);
    try {
      const response = await apiService.getJournalEntry(id);
      setEditEntry(response.data);
    } catch (err) {
      // Optionally show a toast or error
    } finally {
      setEditLoading(false);
    }
  };

  const totalPosted = journalEntries.filter(je => je.status === "posted").length;
  const totalDraft = journalEntries.filter(je => je.status === "draft").length;
  const totalAmount = journalEntries
    .filter(je => je.status === "posted")
    .reduce((sum, je) => sum + Number(je.total_debit || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "posted":
        return <Badge className="bg-green-100 text-green-800">Posted</Badge>;
      case "draft":
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>;
      case "reversed":
        return <Badge className="bg-red-100 text-red-800">Reversed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (showJournalForm || editEntry) {
    return (
      <JournalEntryForm
        entry={editEntry}
        onClose={() => {
          setShowJournalForm(false);
          setEditEntry(null);
          fetchEntries();
        }}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">General Accounting</h1>
          <p className="text-gray-500 mt-1">Manage journal entries and general ledger</p>
        </div>
        <Button onClick={() => setShowJournalForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Journal Entry
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posted Entries</CardTitle>
            <BookOpen className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalPosted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Entries</CardTitle>
            <BookOpen className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{totalDraft}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <BookOpen className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <BookOpen className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{journalEntries.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Journal Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-600 py-8">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entry Details</TableHead>
                  <TableHead>Reference & Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journalEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{entry.entry_id}</div>
                        <div className="text-sm text-gray-600">{entry.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{entry.reference}</div>
                        <div className="text-sm text-gray-600">Created: {entry.entry_date}</div>
                        {entry.posted_at && (
                          <div className="text-sm text-gray-600">Posted: {entry.posted_at.split('T')[0]}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-green-700">Dr: ${entry.total_debit?.toLocaleString()}</div>
                      <div className="font-medium text-blue-700">Cr: ${entry.total_credit?.toLocaleString()}</div>
                    </TableCell>
                    <TableCell>
                      <div>{entry.created_by_name || "-"}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(entry.status)}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => setViewEntry(entry)}><Eye className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(entry.id)} disabled={editLoading}><Edit className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(entry.id)} disabled={deletingId === entry.id}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {deleteError && <div className="text-red-600 text-center mt-2">{deleteError}</div>}
        </CardContent>
      </Card>

      {/* View Modal */}
      <Modal open={!!viewEntry} onClose={() => setViewEntry(null)}>
        {viewEntry && (
          <div>
            <h2 className="text-xl font-bold mb-2">Journal Entry Details</h2>
            <div><b>ID:</b> {viewEntry.entry_id}</div>
            <div><b>Description:</b> {viewEntry.description}</div>
            <div><b>Reference:</b> {viewEntry.reference}</div>
            <div><b>Date:</b> {viewEntry.entry_date}</div>
            <div><b>Status:</b> {getStatusBadge(viewEntry.status)}</div>
            <div><b>Total Debit:</b> ${viewEntry.total_debit}</div>
            <div><b>Total Credit:</b> ${viewEntry.total_credit}</div>
            <div><b>Created By:</b> {viewEntry.created_by_name || "-"}</div>
            {viewEntry.posted_at && <div><b>Posted At:</b> {viewEntry.posted_at}</div>}
            <div className="mt-2">
              <b>Line Items:</b>
              <ul className="list-disc ml-6">
                {viewEntry.line_items && viewEntry.line_items.length > 0 ? (
                  viewEntry.line_items.map((li: any, idx: number) => (
                    <li key={idx}>
                      {li.account_code} - {li.account_name}: Dr ${li.debit_amount} | Cr ${li.credit_amount}
                    </li>
                  ))
                ) : (
                  <li>No line items available.</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
