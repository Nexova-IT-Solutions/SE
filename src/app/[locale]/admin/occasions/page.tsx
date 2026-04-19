import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { OccasionsClient } from "./occasions-client";

export default async function AdminOccasionsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !["SUPER_ADMIN", "STOREFRONT_ADMIN", "ADMIN"].includes(session.user.role as string)) {
    redirect("/"); 
  }

  const occasions = await db.occasion.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="w-full bg-[#FAFAFA] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-10">
        <OccasionsClient initialOccasions={occasions} />
      </div>
    </div>
  );
}
