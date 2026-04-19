import { TableSkeleton } from "@/components/admin/TableSkeleton";

export default function AdminOrdersLoading() {
  return (
    <TableSkeleton
      title="Orders"
      subtitle="Loading recent orders..."
      columns={["Order", "Customer", "Date", "Status", "Total", "Actions"]}
      rowCount={6}
      minTableWidth="1000px"
    />
  );
}
