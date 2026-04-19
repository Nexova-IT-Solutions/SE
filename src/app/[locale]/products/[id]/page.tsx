import type { Metadata } from "next";
import ProductPage, { generateMetadata as generateProductMetadata } from "../../product/[slug]/page";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return generateProductMetadata({ params: Promise.resolve({ slug: id }) });
}

export default async function ProductsByIdPage({ params }: PageProps) {
  const { id } = await params;
  return ProductPage({ params: Promise.resolve({ slug: id }) });
}
