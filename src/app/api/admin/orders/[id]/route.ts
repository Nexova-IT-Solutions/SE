import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const ORDER_STATUS_VALUES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "READY_TO_SHIP",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

const PAYMENT_STATUS_VALUES = ["PENDING", "PAID", "FAILED", "CANCELLED", "REFUNDED"] as const;

const FULFILLMENT_PIPELINE = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "READY_TO_SHIP",
  "SHIPPED",
  "DELIVERED",
] as const;

const patchSchema = z
  .object({
    orderStatus: z.enum(ORDER_STATUS_VALUES).optional(),
    paymentStatus: z.enum(PAYMENT_STATUS_VALUES).optional(),
    internalNotes: z.string().trim().max(4000).optional().nullable(),
  })
  .refine((value) => value.orderStatus || value.paymentStatus || value.internalNotes !== undefined, {
    message: "At least one field must be provided",
    path: ["orderStatus"],
  });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !["SUPER_ADMIN", "ADMIN", "STOREFRONT_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const parsed = patchSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message || "Invalid payload",
        },
        { status: 400 }
      );
    }

    const existing = await db.order.findUnique({
      where: { id },
      select: {
        id: true,
        orderStatus: true,
        paymentStatus: true,
        internalNotes: true,
        statusHistory: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    const updateData: {
      orderStatus?: (typeof ORDER_STATUS_VALUES)[number];
      paymentStatus?: (typeof PAYMENT_STATUS_VALUES)[number];
      internalNotes?: string | null;
    } = {};

    if (parsed.data.orderStatus && parsed.data.orderStatus !== existing.orderStatus) {
      updateData.orderStatus = parsed.data.orderStatus;
    }

    if (parsed.data.paymentStatus && parsed.data.paymentStatus !== existing.paymentStatus) {
      updateData.paymentStatus = parsed.data.paymentStatus;
    }

    if (parsed.data.internalNotes !== undefined && parsed.data.internalNotes !== existing.internalNotes) {
      updateData.internalNotes = parsed.data.internalNotes || null;
    }

    if (!updateData.orderStatus && !updateData.paymentStatus && updateData.internalNotes === undefined) {
      return NextResponse.json({ success: true, message: "No status changes detected" });
    }

    const missingHistoryRecords: Array<{
      status: (typeof ORDER_STATUS_VALUES)[number];
      note: string;
      changedByUserId: string;
      changedByName: string;
    }> = [];

    if (updateData.orderStatus) {
      const existingStatuses = new Set(existing.statusHistory.map((entry) => entry.status));
      const targetIndex = FULFILLMENT_PIPELINE.indexOf(updateData.orderStatus as (typeof FULFILLMENT_PIPELINE)[number]);

      if (targetIndex >= 0) {
        for (let i = 0; i <= targetIndex; i += 1) {
          const step = FULFILLMENT_PIPELINE[i];
          if (!existingStatuses.has(step)) {
            missingHistoryRecords.push({
              status: step,
              note: step === "PENDING" ? "Order placed successfully" : `Order marked as ${step}`,
              changedByUserId: session.user.id,
              changedByName: session.user.name || session.user.email || "Admin",
            });
            existingStatuses.add(step);
          }
        }
      } else if (!existingStatuses.has(updateData.orderStatus)) {
        missingHistoryRecords.push({
          status: updateData.orderStatus,
          note: `Order marked as ${updateData.orderStatus}`,
          changedByUserId: session.user.id,
          changedByName: session.user.name || session.user.email || "Admin",
        });
      }
    }

    const updatedOrder = await db.order.update({
      where: { id },
      data: {
        ...updateData,
        ...(missingHistoryRecords.length > 0
          ? {
              statusHistory: {
                create: missingHistoryRecords,
              },
            }
          : {}),
      },
      select: {
        id: true,
        orderStatus: true,
        paymentStatus: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedOrder,
    });
  } catch {
    return NextResponse.json({ success: false, message: "Internal Error" }, { status: 500 });
  }
}
