import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type PremiumBoxCardProps = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  images: string[];
  inStock: boolean;
  includedItems: string[];
};

export function PremiumBoxCard({
  id,
  name,
  description,
  price,
  images,
  inStock,
  includedItems,
}: PremiumBoxCardProps) {
  const previewItems = includedItems.slice(0, 3);
  const remaining = Math.max(0, includedItems.length - previewItems.length);

  return (
    <Link
      href={`/products/${id}`}
      className="group block overflow-hidden rounded-3xl border border-[#EEF5F3] bg-gradient-to-br from-white to-[#F4FAF8] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#FDF9E8]">
        <Image
          src={images[0] || "/logo/logo.png"}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3">
          <Badge className="border-0 bg-[#CFB53B] text-white">Premium Collection</Badge>
        </div>
        {!inStock ? (
          <div className="absolute right-3 top-3">
            <Badge className="border-0 bg-red-600 text-white">Out of Stock</Badge>
          </div>
        ) : null}
      </div>

      <div className="space-y-3 p-5">
        <div>
          <h3 className="line-clamp-1 text-lg font-semibold text-[#1F1720] group-hover:text-[#49A389]">{name}</h3>
          <p className="mt-1 text-sm font-semibold text-[#CFB53B]">LKR {price.toLocaleString()}</p>
          <p className="mt-2 line-clamp-2 text-sm text-[#6B5A64]">
            {description || "Curated gift box with carefully selected premium items."}
          </p>
        </div>

        <div className="rounded-2xl border border-[#EEF5F3] bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6B5A64]">Included Preview</p>
          {previewItems.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-[#3A2B35]">
              {previewItems.map((itemName) => (
                <li key={itemName} className="line-clamp-1">
                  • {itemName}
                </li>
              ))}
              {remaining > 0 ? <li className="text-xs text-[#6B5A64]">+ {remaining} more items</li> : null}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-[#6B5A64]">Included items will appear here.</p>
          )}
        </div>
      </div>
    </Link>
  );
}
