import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { ensureShippingConfig } from "@/lib/shipping-config";
import type { PaymentMethod } from "@prisma/client";

interface CheckoutItem {
  productId?: string;
  id?: string;
  quantity: number;
  discountId?: string;
}

interface CheckoutPayload {
  items: CheckoutItem[];
  shippingAddress: {
    contactName: string;
    phoneNumber: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postalCode: string;
  };
  billingAddress?: {
    contactName: string;
    phoneNumber: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postalCode?: string;
  };
  customerPhone: string;
  isGift?: boolean;
  giftMessage?: string;
  giftWrapId?: string;
  noteStyle?: string;
  sender?: {
    name: string;
    phone: string;
  };
  recipient?: {
    name: string;
    phone: string;
  };
  revealSender?: boolean;
  suppressInvoice?: boolean;
  paymentMethod?: "COD" | "DIRECTPAY" | "MINTPAY";
}

/**
 * POST /api/checkout
 * Secure checkout endpoint - creates order with atomic transaction
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Auth Check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Step 2: Parse and validate request body
    const payload: CheckoutPayload = await request.json();

    if (!payload.items || payload.items.length === 0) {
      return NextResponse.json(
        { success: false, message: "No items in checkout" },
        { status: 400 }
      );
    }

    if (!payload.shippingAddress) {
      return NextResponse.json(
        { success: false, message: "Shipping address is required" },
        { status: 400 }
      );
    }

    if (!payload.customerPhone) {
      return NextResponse.json(
        { success: false, message: "Contact phone number is required" },
        { status: 400 }
      );
    }

    if (payload.isGift) {
      if (!payload.sender?.name?.trim() || !payload.sender?.phone?.trim()) {
        return NextResponse.json(
          { success: false, message: "Sender name and phone are required for gift orders" },
          { status: 400 }
        );
      }

      if (!payload.recipient?.name?.trim() || !payload.recipient?.phone?.trim()) {
        return NextResponse.json(
          { success: false, message: "Recipient name and phone are required for gift orders" },
          { status: 400 }
        );
      }
    }

    const resolvedItems = payload.items
      .map((item) => {
        const productId = item.productId || item.id;
        if (!productId) return null;

        return {
          productId,
          quantity: item.quantity,
          discountId: item.discountId,
        };
      })
      .filter((item): item is { productId: string; quantity: number; discountId?: string } => Boolean(item));

    const productIds = resolvedItems.map((item) => item.productId).filter(Boolean);

    if (productIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid cart items: Missing Product IDs" },
        { status: 400 }
      );
    }

    // Step 3: Atomic Transaction
    const order = await db.$transaction(async (tx) => {
      const normalizedPaymentMethod =
        (payload.paymentMethod?.toUpperCase() || "COD") as PaymentMethod;

      // 3a. Upsert & fetch ShippingConfig
      const config = await ensureShippingConfig(tx as any);

      // Check if delivery is enabled
      if (!config.isDeliveryEnabled) {
        throw new Error("Delivery is currently disabled");
      }

      // 3b. Fetch all products from DB
      const dbProducts = await tx.product.findMany({
        where: {
          id: { in: productIds },
          isActive: true,
        },
        include: { discount: true },
      });

      // Create a map for quick lookup
      const productMap = new Map(dbProducts.map((p) => [p.id, p]));

      // 3c. Validate all items exist
      for (const item of resolvedItems) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} not found or inactive`);
        }
      }

      // 3d. Validate stock before ANY writes
      for (const item of resolvedItems) {
        const product = productMap.get(item.productId)!;
        if (product.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
          );
        }
      }

      // 3e. Calculate subtotal using DB prices
      let subtotal = 0;
      const orderItems = [];

      for (const item of resolvedItems) {
        const product = productMap.get(item.productId)!;
        const unitPrice = product.price;
        const salePrice = product.salePrice || product.price;
        const itemSubtotal = salePrice * item.quantity;

        subtotal += itemSubtotal;

        orderItems.push({
          productId: item.productId,
          productName: product.name,
          productImage: product.productImages ? (product.productImages as any).thumbnail : null,
          quantity: item.quantity,
          unitPrice,
          salePrice,
          subtotal: itemSubtotal,
          discountId: item.discountId || null,
          discountName: product.discount?.name || null,
          discountValue: product.discount?.value || null,
        });
      }

      // 3f. Calculate delivery fee
      const deliveryFee =
        subtotal >= config.freeDeliveryThreshold ? 0 : config.deliveryFee;

      // 3f-2. Validate and resolve selected gift wrapping
      let wrapFee = 0;
      let wrapName: string | null = null;
      let wrapId: string | null = null;

      if (payload.giftWrapId) {
        const selectedWrap = await tx.giftWrap.findFirst({
          where: {
            id: payload.giftWrapId,
            isActive: true,
          },
        });

        if (!selectedWrap) {
          throw new Error("Selected gift wrapping option is unavailable");
        }

        wrapFee = selectedWrap.price;
        wrapName = selectedWrap.name;
        wrapId = selectedWrap.id;
      }

      const total = subtotal + deliveryFee + wrapFee;

      // 3g. Generate human-readable orderNumber
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      const orderNumber = `GBL-${new Date().getFullYear()}-${String(timestamp + random).slice(-6)}`;

      // 3h. Create Order with snapshots
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: session.user.id,
          customerName:
            payload.isGift && payload.recipient?.name
              ? payload.recipient.name
              : payload.shippingAddress.contactName,
          customerEmail: session.user.email || "",
          customerPhone:
            payload.isGift && payload.recipient?.phone
              ? payload.recipient.phone
              : payload.customerPhone,
          billingAddress: payload.billingAddress || null,
          shippingAddress: payload.shippingAddress,
          recipientName: payload.recipient?.name || null,
          recipientPhone: payload.recipient?.phone || null,
          senderName: payload.sender?.name || null,
          senderPhone: payload.sender?.phone || null,
          subtotal,
          deliveryFee,
          freeDeliveryThreshold: config.freeDeliveryThreshold,
          total,
          orderStatus: "PENDING",
          paymentMethod: normalizedPaymentMethod,
          paymentStatus: "PENDING",
          isGift: Boolean(payload.isGift),
          giftMessage: payload.giftMessage,
          giftWrapping: Boolean(wrapId),
          noteStyle: payload.noteStyle,
          revealSender: payload.revealSender ?? true,
          suppressInvoice: payload.suppressInvoice ?? false,
          giftWrapId: wrapId,
          giftWrapName: wrapName,
          giftWrapPrice: wrapFee,
          items: {
            create: orderItems,
          },
          statusHistory: {
            create: {
              status: "PENDING",
              note: "Order placed successfully",
              changedByUserId: session.user.id,
              changedByName: session.user.name || session.user.email || "Customer",
            },
          },
        },
        include: { items: true },
      });

      // 3i. Decrement stock for each product
      for (const item of resolvedItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return createdOrder;
    });

    return NextResponse.json(
      {
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        redirectUrl: null, // Future: Payment gateway integration
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[checkout] Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Checkout failed";

    return NextResponse.json(
      { success: false, message: errorMessage },
      {
        status:
          error instanceof Error && (errorMessage.includes("stock") || errorMessage.includes("unavailable"))
            ? 400
            : 500,
      }
    );
  }
}
