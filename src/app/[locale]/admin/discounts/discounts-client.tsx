"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

type DiscountRecord = {
  id: string;
  name: string;
  description: string | null;
  value: number;
  type: "PERCENTAGE" | "FIXED";
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  _count: { products: number };
};

type FormState = {
  id?: string;
  name: string;
  description: string;
  value: number | "";
  type: "PERCENTAGE" | "FIXED";
  isActive: boolean;
  startsAt: string;
  endsAt: string;
};

function toDatetimeLocal(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const emptyForm: FormState = {
  name: "",
  description: "",
  value: "",
  type: "PERCENTAGE",
  isActive: true,
  startsAt: "",
  endsAt: "",
};

export function DiscountsClient({ initialDiscounts }: { initialDiscounts: DiscountRecord[] }) {
  const { toast } = useToast();
  const [discounts, setDiscounts] = useState<DiscountRecord[]>(initialDiscounts);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(form.id);

  const sortedDiscounts = useMemo(() => {
    return [...discounts].sort((a, b) => Number(b.isActive) - Number(a.isActive));
  }, [discounts]);

  const resetForm = () => {
    setForm(emptyForm);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Validation Error", description: "Discount name is required.", variant: "destructive" });
      return;
    }
    if (form.value === "") {
      toast({ title: "Validation Error", description: "Discount value is required.", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...(isEditing ? { id: form.id } : {}),
        name: form.name,
        description: form.description || null,
        value: Number(form.value),
        type: form.type,
        isActive: form.isActive,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      };

      const response = await fetch("/api/admin/discounts", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Failed to save discount");
      }

      if (isEditing) {
        setDiscounts((prev) => prev.map((item) => (item.id === data.id ? data : item)));
      } else {
        setDiscounts((prev) => [data, ...prev]);
      }

      toast({
        title: isEditing ? "Discount Updated" : "Discount Created",
        description: isEditing ? "Discount changes were saved." : "New discount campaign created.",
      });
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Request failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (discount: DiscountRecord) => {
    setForm({
      id: discount.id,
      name: discount.name,
      description: discount.description ?? "",
      value: discount.value,
      type: discount.type,
      isActive: discount.isActive,
      startsAt: toDatetimeLocal(discount.startsAt),
      endsAt: toDatetimeLocal(discount.endsAt),
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this discount?")) return;

    setLoading(true);
    try {
      const response = await fetch("/api/admin/discounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete discount");
      }

      setDiscounts((prev) => prev.filter((item) => item.id !== id));
      toast({ title: "Discount Deleted", description: "Discount removed successfully." });
      if (form.id === id) resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Request failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#1F1720]">Discount Management</h1>
        <p className="text-[#6B5A64] mt-2">Create reusable campaigns and apply them to products.</p>
      </div>

      <Card className="p-6 border-0 shadow-sm bg-white">
        <h2 className="text-xl font-semibold text-[#1F1720] mb-6">{isEditing ? "Edit Discount" : "Create Discount"}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold text-[#1F1720]">Name</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Valentine 20% Off" className="h-11 border-brand-border focus:ring-[#315243]" />
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold text-[#1F1720]">Description</Label>
            <Input id="description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Optional campaign notes" className="h-11 border-brand-border focus:ring-[#315243]" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="value" className="text-sm font-semibold text-[#1F1720]">Value</Label>
            <Input
              id="value"
              type="number"
              min="0"
              step="0.01"
              value={form.value}
              onChange={(e) => setForm((p) => ({ ...p, value: e.target.value ? Number(e.target.value) : "" }))}
              className="h-11 border-brand-border focus:ring-[#315243]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm font-semibold text-[#1F1720]">Type</Label>
            <select
              id="type"
              className="flex h-11 w-full rounded-xl border border-brand-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#315243]"
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as FormState["type"] }))}
            >
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED">Fixed Amount</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startsAt" className="text-sm font-semibold text-[#1F1720]">Starts At</Label>
            <Input id="startsAt" type="datetime-local" value={form.startsAt} onChange={(e) => setForm((p) => ({ ...p, startsAt: e.target.value }))} className="h-11 border-brand-border focus:ring-[#315243]" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endsAt" className="text-sm font-semibold text-[#1F1720]">Ends At</Label>
            <Input id="endsAt" type="datetime-local" value={form.endsAt} onChange={(e) => setForm((p) => ({ ...p, endsAt: e.target.value }))} className="h-11 border-brand-border focus:ring-[#315243]" />
          </div>

          <div className="md:col-span-2 flex items-center gap-3 pt-1">
            <Switch checked={form.isActive} onCheckedChange={(checked) => setForm((p) => ({ ...p, isActive: Boolean(checked) }))} />
            <span className="text-sm text-[#1F1720]">Active campaign</span>
          </div>

          <div className="md:col-span-2 flex gap-3 pt-3">
            <Button disabled={loading} type="submit" className="bg-[#315243] hover:bg-[#1A3026] text-white">
              {loading ? "Saving..." : isEditing ? "Update Discount" : "Create Discount"}
            </Button>
            {isEditing ? (
              <Button type="button" variant="outline" onClick={resetForm} disabled={loading}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <Card className="p-0 border-0 shadow-sm bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-brand-border">
          <h2 className="text-lg font-semibold text-[#1F1720]">All Discounts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FAFAFA] text-left text-[#6B5A64]">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Value</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Linked Products</th>
                <th className="px-6 py-3">Date Range</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedDiscounts.map((discount) => (
                <tr key={discount.id} className="border-t border-brand-border">
                  <td className="px-6 py-3">
                    <p className="font-medium text-[#1F1720]">{discount.name}</p>
                    {discount.description ? <p className="text-xs text-[#6B5A64]">{discount.description}</p> : null}
                  </td>
                  <td className="px-6 py-3">{discount.type === "PERCENTAGE" ? "Percentage" : "Fixed"}</td>
                  <td className="px-6 py-3">{discount.type === "PERCENTAGE" ? `${discount.value}%` : `LKR ${discount.value.toLocaleString()}`}</td>
                  <td className="px-6 py-3">{discount.isActive ? "Active" : "Inactive"}</td>
                  <td className="px-6 py-3">{discount._count.products}</td>
                  <td className="px-6 py-3 text-xs text-[#6B5A64]">
                    {discount.startsAt ? new Date(discount.startsAt).toLocaleString() : "Any"} - {discount.endsAt ? new Date(discount.endsAt).toLocaleString() : "No End"}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(discount)} disabled={loading}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(discount.id)} disabled={loading}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {sortedDiscounts.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-center text-[#6B5A64]" colSpan={7}>
                    No discounts created yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
