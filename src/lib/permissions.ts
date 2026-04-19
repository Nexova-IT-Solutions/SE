import { Role } from "@prisma/client";

export type PermissionValue = boolean;

export interface PermissionSection {
  [key: string]: PermissionValue;
}

export interface PermissionTree {
  [section: string]: PermissionSection;
}

export const PERMISSION_TREE_STRUCTURE = {
  customers: {
    label: "Customers",
    permissions: {
      add: "Add",
      update: "Update",
      delete: "Delete",
      search: "Search",
      editBalance: "Edit Store Account Balance",
      editPoints: "Edit Points/Sales for Discount",
      excelExport: "Excel Export",
      editTier: "Edit Tier",
    },
  },
  items: {
    label: "Items",
    permissions: {
      add: "Add",
      update: "Update",
      delete: "Delete",
      search: "Search",
      seeCostPrice: "See Cost Price",
      editQuantity: "Edit Quantity",
      countInventory: "Count Inventory",
      manageMetadata: "Manage Categories/Tags/Manufacturers",
      viewAllLocations: "View Inventory at ALL locations",
      editPrices: "Edit Prices",
    },
  },
  reports: {
    label: "Reports",
    permissions: {
      appointments: "Appointments",
      categories: "Categories",
      closeout: "Closeout",
      commission: "Commission (View all)",
      customers: "Customers",
      deletedSales: "Deleted Sales",
      expenses: "Expenses",
      inventory: "Inventory",
      profitAndLoss: "Profit and Loss",
      showCostProfit: "Show Cost/Profit in all reports",
      viewDashboard: "View Dashboard Statistics",
    },
  },
  sales: {
    label: "Sales & Receiving",
    permissions: {
      complete: "Complete Sale/Transfer",
      editPricesTaxes: "Edit Prices/Taxes",
      giveDiscount: "Give Discount",
      suspend: "Suspend Sale",
      returns: "Process Returns",
      editDelete: "Edit/Delete Sales or Receivings",
      search: "Search Sales",
    },
  },
  management: {
    label: "Management",
    permissions: {
      employees: "Employees (Add/Update/Delete/Search/Assign Locations)",
      locations: "Locations (Add/Update/Delete/Search)",
      expenses: "Expenses",
      deliveries: "Deliveries",
      workOrders: "Work Orders",
      giftCards: "Gift Cards",
      messages: "Messages",
    },
  },
};

export type PermissionKey = keyof typeof PERMISSION_TREE_STRUCTURE;

/**
 * Helper to check if a user has a specific permission.
 * @param user The user object (must include role and optionally template/privileges)
 * @param permissionPath Dot-separated path like 'customers.add'
 */
export function hasPermission(user: any, permissionPath: string): boolean {
  if (!user) return false;

  // Super Admin has all permissions
  if (user.role === "SUPER_ADMIN") return true;

  // Basic User typically has very few, handled by defaults or specific checks
  if (user.role === "USER") return false;

  const [section, action] = permissionPath.split(".");

  // 1. Check Custom Overrides (highest priority)
  if (user.customPermissions) {
    const customPerms = user.customPermissions as any;
    if (customPerms[section] && customPerms[section][action] !== undefined) {
      return customPerms[section][action] === true;
    }
  }

  // 2. Check Permission Template
  if (user.template?.permissions) {
    const templatePermissions = user.template.permissions as any;
    if (templatePermissions[section] && templatePermissions[section][action] === true) {
      return true;
    }
  }

  // 3. Fallback to legacy privileges array if exists
  if (user.privileges && Array.isArray(user.privileges)) {
    // Check for exact match or path-based match
    if (user.privileges.includes(permissionPath) || user.privileges.includes(section.toUpperCase())) {
      return true;
    }
  }

  return false;
}

export const DEFAULT_PERMISSIONS: PermissionTree = Object.keys(PERMISSION_TREE_STRUCTURE).reduce((acc, section) => {
  acc[section] = Object.keys((PERMISSION_TREE_STRUCTURE as any)[section].permissions).reduce((sAcc, perm) => {
    sAcc[perm] = false;
    return sAcc;
  }, {} as PermissionSection);
  return acc;
}, {} as PermissionTree);
