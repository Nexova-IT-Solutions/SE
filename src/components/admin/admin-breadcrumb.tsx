"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function titleize(segment: string) {
  return segment
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

export function AdminBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const locale = segments[0] || "en";
  const adminIndex = segments.indexOf("admin");

  const adminSegments = adminIndex >= 0 ? segments.slice(adminIndex + 1) : [];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={`/${locale}/admin`}>Admin</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {adminSegments.length === 0 ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : (
          adminSegments.map((segment, idx) => {
            const href = `/${locale}/admin/${adminSegments.slice(0, idx + 1).join("/")}`;
            const isLast = idx === adminSegments.length - 1;

            return (
              <div key={href} className="inline-flex items-center gap-1.5">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{titleize(segment)}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={href}>{titleize(segment)}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            );
          })
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
