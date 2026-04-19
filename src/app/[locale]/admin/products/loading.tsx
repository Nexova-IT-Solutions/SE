import { TableSkeleton } from "@/components/admin/TableSkeleton";

export default function AdminProductsLoading() {
  return (
    <TableSkeleton
      title="Catalogue Inventory"
      subtitle="Loading products..."
      columns={["Identity", "Placement", "Valuation", "Availability", "Attributes", "Actions"]}
      rowCount={7}
      minTableWidth="1120px"
    />
  );
}
