"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/image-upload";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, CreditCard, RefreshCw, Trash2, Edit2, CheckCircle, XCircle } from "lucide-react";
import { uploadFile } from "@/utils/supabase";
import Image from "next/image";

type GiftCardData = {
  id: string;
  code: string;
  initialValue: number;
  balance: number;
  currency: string;
  image: string | null;
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
};

export function GiftCardsClient({ initialGiftCards }: { initialGiftCards: GiftCardData[] }) {
  const { toast } = useToast();
  const [giftCards, setGiftCards] = useState<GiftCardData[]>(initialGiftCards);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  const [code, setCode] = useState("");
  const [initialValue, setInitialValue] = useState("");
  const [balance, setBalance] = useState("");
  const [currency, setCurrency] = useState("LKR");
  const [stagedImages, setStagedImages] = useState<(string | File)[]>([]);
  const [expiresAt, setExpiresAt] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setCode("");
    setInitialValue("");
    setBalance("");
    setCurrency("LKR");
    setStagedImages([]);
    setExpiresAt("");
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Upload image if staged
      let imageUrl = stagedImages.length > 0 ? (typeof stagedImages[0] === 'string' ? stagedImages[0] as string : '') : '';
      if (stagedImages.length > 0 && typeof stagedImages[0] !== 'string') {
        imageUrl = await uploadFile(stagedImages[0], "gift-cards");
      }

      // 2. Submit to API
      const method = editingId ? "PATCH" : "POST";
      const payload = editingId 
        ? { id: editingId, code, balance: parseFloat(balance), image: imageUrl || null, expiresAt: expiresAt || null } 
        : { code, initialValue: parseFloat(initialValue), currency, image: imageUrl || null, expiresAt: expiresAt || null };

      const res = await fetch("/api/admin/gift-cards", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save gift card");
      }

      const savedGiftCard = await res.json();

      if (editingId) {
        setGiftCards(giftCards.map(o => o.id === editingId ? savedGiftCard : o));
        toast({ title: "Updated", description: "Gift Card saved successfully." });
      } else {
        setGiftCards([savedGiftCard, ...giftCards]);
        toast({ title: "Created", description: "Successfully added gift card to the system." });
      }

      resetForm();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this gift card?")) return;
    try {
      const res = await fetch("/api/admin/gift-cards", {
        method: "DELETE",
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setGiftCards(giftCards.filter(o => o.id !== id));
        toast({ title: "Deleted", description: "Gift card permanently removed." });
      }
    } catch { toast({ title: "Error", description: "Failed to delete" }); }
  };

  const handleToggle = async (id: string, currentValue: boolean) => {
    try {
      const res = await fetch("/api/admin/gift-cards", {
        method: "PATCH",
        body: JSON.stringify({ id, isActive: !currentValue })
      });
      if (res.ok) {
        setGiftCards(giftCards.map(o => o.id === id ? { ...o, isActive: !currentValue } : o));
      }
    } catch { }
  };

  const startEdit = (gc: GiftCardData) => {
    setEditingId(gc.id);
    setCode(gc.code);
    setInitialValue(gc.initialValue.toString());
    setBalance(gc.balance.toString());
    setCurrency(gc.currency);
    setStagedImages(gc.image ? [gc.image] : []);
    setExpiresAt(gc.expiresAt ? new Date(gc.expiresAt).toISOString().split('T')[0] : "");
    setIsAdding(true);
  };

  // Helper to generate a random code
  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
        if (i > 0 && i % 4 === 0) result += '-';
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(result);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1F1720]">Gift Cards Setup</h1>
          <p className="text-[#6B5A64] mt-2">Manage customer gift cards, balances, and vouchers.</p>
        </div>
        <Button
          onClick={() => { if (isAdding) resetForm(); else setIsAdding(true); }}
          className="bg-[#315243] hover:bg-[#1A3026] text-white shrink-0"
        >
          {isAdding ? <X className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
          {isAdding ? "Close Form" : "Add Gift Card"}
        </Button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-border mb-8 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-bold text-[#1F1720] mb-6 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#315243]" /> {editingId ? "Update Gift Card" : "New Gift Card"}
          </h2>
          <form onSubmit={handleCreateOrUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-[#1F1720]">Gift Card Code</label>
                <div className="flex gap-2 mt-1">
                  <Input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="XXXX-XXXX-XXXX" className="uppercase font-mono" />
                  {!editingId && (
                     <Button type="button" variant="outline" onClick={generateRandomCode} className="shrink-0">
                       Generate
                     </Button>
                  )}
                </div>
              </div>

              {!editingId && (
                <div>
                  <label className="text-sm font-medium text-[#1F1720]">Initial Value ({currency})</label>
                  <Input required type="number" min="0" step="0.01" value={initialValue} onChange={(e) => setInitialValue(e.target.value)} placeholder="0.00" className="mt-1" />
                </div>
              )}

              {editingId && (
                <div>
                  <label className="text-sm font-medium text-[#1F1720]">Current Balance ({currency})</label>
                  <Input required type="number" min="0" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0.00" className="mt-1" />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-[#1F1720]">Expiration Date (Optional)</label>
                <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="mt-1" />
              </div>

              <div>
                <label className="text-sm font-medium text-[#1F1720] mb-2 block">Gift Card Cover Image</label>
                <div className="bg-[#FAFAFA] p-4 rounded-xl border border-brand-border border-dashed">
                  <ImageUpload 
                     multiple={false} 
                     value={stagedImages} 
                     onChange={(vals) => setStagedImages(vals)} 
                  />
                  <p className="text-[10px] text-gray-500 mt-2 text-center">Images are uploaded only when saving.</p>
                </div>
              </div>

            </div>

            <div className="flex justify-end pt-4 border-t border-brand-border mt-4">
              <Button type="submit" disabled={loading} className="bg-[#315243] hover:bg-[#1A3026] text-white px-8">
                {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                {loading ? "Uploading & Saving..." : editingId ? "Save Changes" : "Create Gift Card"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#FAFAFA] border-b border-brand-border text-[#6B5A64]">
              <tr>
                <th className="px-6 py-4 font-semibold w-16">Image</th>
                <th className="px-6 py-4 font-semibold">Gift Card Code</th>
                <th className="px-6 py-4 font-semibold">Initial Value</th>
                <th className="px-6 py-4 font-semibold">Balance</th>
                <th className="px-6 py-4 font-semibold">Expiration</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {giftCards.map((gc) => (
                <tr key={gc.id} className="hover:bg-[#FAFAFA]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div
                      className="w-10 h-10 rounded-lg bg-cover bg-center shrink-0 bg-gray-100 flex items-center justify-center text-lg font-bold text-[#315243] overflow-hidden relative"
                    >
                      {gc.image ? (
                        <Image src={gc.image} alt={gc.code} fill className="object-cover" />
                      ) : (
                        <CreditCard className="w-5 h-5 opacity-50" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#1F1720] font-mono font-medium">{gc.code}</td>
                  <td className="px-6 py-4 text-[#6B5A64]">{gc.currency} {gc.initialValue.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`font-semibold ${gc.balance > 0 ? 'text-[#315243]' : 'text-gray-400'}`}>
                      {gc.currency} {gc.balance.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#6B5A64]">
                    {gc.expiresAt ? new Date(gc.expiresAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleToggle(gc.id, gc.isActive)} className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded border transition-colors ${gc.isActive ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                      {gc.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />} {gc.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <Button variant="ghost" size="icon" onClick={() => startEdit(gc)} className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                         <Edit2 className="w-4 h-4" />
                       </Button>
                       <Button variant="ghost" size="icon" onClick={() => handleDelete(gc.id)} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                         <Trash2 className="w-4 h-4" />
                       </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {giftCards.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#6B5A64]">
                    <CreditCard className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    No gift cards have been added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
