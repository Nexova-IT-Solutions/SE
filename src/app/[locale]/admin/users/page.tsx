import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { UsersClient } from "./users-client";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/"); // unauthorized
  }

  // Fetch users securely on the server
  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      privileges: true,
      isActive: true,
      createdAt: true,
      templateId: true,
      template: {
        select: {
          name: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  const templates = await db.permissionTemplate.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="w-full bg-[#FAFAFA] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-10">
        <UsersClient initialUsers={users} templates={templates} />
      </div>
    </div>
  );
}
