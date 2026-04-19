"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Edit2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

const ALLOWED_BANNER_KEYS = ["promo_1", "promo_2"] as const;

interface PromoBanner {
  id: string;
  key: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BannersClientProps {
  initialBanners: PromoBanner[];
}

export function BannersClient({ initialBanners }: BannersClientProps) {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [banners, setBanners] = useState<PromoBanner[]>(initialBanners);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    key: "",
    imageUrl: "",
    isActive: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const resetForm = useCallback(() => {
    setFormData({ key: "", imageUrl: "", isActive: true });
    setEditingId(null);
  }, []);

  const handleCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create banner");
      }

      const newBanner = await response.json();
      setBanners((prev) => [newBanner, ...prev]);
      toast({ title: "Success", description: "Banner created successfully!" });
      resetForm();
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to create banner",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, resetForm, toast]);

  const handleUpdate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/banners/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: formData.imageUrl,
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update banner");
      }

      const updatedBanner = await response.json();
      setBanners((prev) =>
        prev.map((b) => (b.id === editingId ? updatedBanner : b))
      );
      toast({ title: "Success", description: "Banner updated successfully!" });
      resetForm();
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to update banner",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [editingId, formData, resetForm, toast]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/banners/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete banner");
      }

      setBanners((prev) => prev.filter((b) => b.id !== id));
      toast({ title: "Success", description: "Banner deleted successfully!" });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to delete banner",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleEdit = useCallback((banner: PromoBanner) => {
    setFormData({
      key: banner.key,
      imageUrl: banner.imageUrl,
      isActive: banner.isActive,
    });
    setEditingId(banner.id);
  }, []);

  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData((prev) => ({
        ...prev,
        imageUrl: e.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#1F1720]">Promotional Banners</h1>
        <p className="text-[#6B5A64] mt-2">
          Manage promotional banners displayed on the home page
        </p>
      </div>

      {/* Create/Edit Form */}
      <Card className="p-6 border-0 shadow-sm bg-white">
        <h2 className="text-xl font-semibold text-[#1F1720] mb-6">
          {editingId ? "Edit Banner" : "Create New Banner"}
        </h2>

        <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-6">
          {!editingId && (
            <div>
              <Label htmlFor="key" className="text-[#1F1720]">
                Banner Key *
              </Label>
              <select
                id="key"
                value={formData.key}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, key: e.target.value }))
                }
                disabled={isLoading}
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select banner slot</option>
                {ALLOWED_BANNER_KEYS.map((key) => {
                  const alreadyExists = banners.some((b) => b.key === key);
                  return (
                    <option key={key} value={key} disabled={alreadyExists}>
                      {key === "promo_1" ? "Promo Banner 1 (between Trending Now & Categories)" : "Promo Banner 2 (between Chocolates & Discounted Items)"}
                      {alreadyExists ? " - already created" : ""}
                    </option>
                  );
                })}
              </select>
              <p className="text-sm text-[#6B5A64] mt-2">
                Homepage only supports promo_1 and promo_2.
              </p>
            </div>
          )}

          <div>
            <Label className="text-[#1F1720]">Banner Image *</Label>
            <div className="mt-2 space-y-4">
              <div className="border-2 border-dashed border-[#315243]/20 rounded-lg p-6 text-center hover:border-[#315243]/40 transition-colors cursor-pointer"
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <Upload className="w-8 h-8 text-[#315243]/60 mx-auto mb-2" />
                <p className="text-[#1F1720] font-medium">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-[#6B5A64]">
                  PNG, JPG, GIF up to 10MB
                </p>
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  className="hidden"
                />
              </div>

              {formData.imageUrl && (
                <div className="relative w-full h-32 rounded-lg overflow-hidden border border-[#315243]/20">
                  <Image
                    src={formData.imageUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  isActive: checked as boolean,
                }))
              }
            />
            <Label htmlFor="isActive" className="text-[#1F1720]">
              Banner is Active
            </Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading || !formData.key || !formData.imageUrl}
              className="bg-[#315243] text-white hover:bg-[#315243]/90"
            >
              {editingId ? "Update Banner" : "Create Banner"}
            </Button>
            {editingId && (
              <Button
                type="button"
                onClick={resetForm}
                disabled={isLoading}
                className="bg-[#E0E0E0] text-[#1F1720] hover:bg-[#D0D0D0]"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Banners List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[#1F1720]">
          All Banners ({banners.length})
        </h2>

        {banners.length === 0 ? (
          <Card className="p-12 text-center border-0 shadow-sm bg-white">
            <p className="text-[#6B5A64]">No banners created yet</p>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {banners.map((banner) => (
              <Card
                key={banner.id}
                className="overflow-hidden border-0 shadow-sm bg-white hover:shadow-md transition-shadow"
              >
                <div className="relative w-full h-40 bg-gray-100">
                  {banner.imageUrl && (
                    <Image
                      src={banner.imageUrl}
                      alt={banner.key}
                      fill
                      className="object-cover"
                    />
                  )}
                  {!banner.isActive && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-gray-800/80 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Inactive
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-sm text-[#6B5A64]">Key</p>
                    <p className="font-semibold text-[#1F1720]">{banner.key}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#E0E0E0]">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          banner.isActive ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                      <span className="text-sm text-[#6B5A64]">
                        {banner.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(banner)}
                        disabled={isLoading}
                        className="text-[#315243] hover:bg-[#315243]/10"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(banner.id)}
                        disabled={isLoading}
                        className="text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
