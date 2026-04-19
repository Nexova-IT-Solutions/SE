import { TableSkeleton } from "@/components/admin/TableSkeleton";

export default function AdminCategoriesLoading() {
  return (
    <TableSkeleton
      title="Categories"
      subtitle="Loading category hierarchy..."
      columns={["Category", "Hierarchy", "Status & Priority", "Settings"]}
      rowCount={8}
      minTableWidth="900px"
    />
  );
}
