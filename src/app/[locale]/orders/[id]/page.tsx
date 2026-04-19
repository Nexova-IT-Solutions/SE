import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { Header, Footer } from "@/components/giftbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Clock, 
  Truck, 
  MapPin, 
  Phone, 
  Mail,
  ArrowLeft 
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface OrderDetailsPageProps {
  params: Promise<{ locale: string; id: string }>;
}

const getOrderStatusColor = (status: string) => {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "PROCESSING":
      return "bg-blue-100 text-blue-800";
    case "SHIPPED":
      return "bg-purple-100 text-purple-800";
    case "DELIVERED":
      return "bg-green-100 text-green-800";
    case "CANCELLED":
      return "bg-red-100 text-red-800";
    case "REFUNDED":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "PAID":
      return "bg-green-100 text-green-800";
    case "FAILED":
      return "bg-red-100 text-red-800";
    case "REFUNDED":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "DELIVERED":
      return <CheckCircle className="w-5 h-5" />;
    case "SHIPPED":
      return <Truck className="w-5 h-5" />;
    default:
      return <Clock className="w-5 h-5" />;
  }
};

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { locale, id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/${locale}/sign-in`);
  }

  try {
    // Fetch order from database
    const order = await db.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return (
        <div className="min-h-screen flex flex-col bg-background">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-[#1F1720]">Order Not Found</h1>
              <p className="text-[#6B5A64] mt-2">The order you're looking for doesn't exist.</p>
              <Button asChild className="mt-4 bg-[#A7066A]">
                <Link href={`/${locale}/orders`}>Back to Orders</Link>
              </Button>
            </div>
          </main>
          <Footer />
        </div>
      );
    }

    // Verify user owns this order
    if (order.userId !== session.user.id) {
      redirect(`/${locale}`);
    }

    const formatPrice = (price: number) => `LKR ${price.toLocaleString()}`;
    const formatDate = (date: Date) => new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 md:px-8 lg:px-10 py-6">
            {/* Back Button */}
            <Link href={`/${locale}`} className="inline-flex items-center gap-2 text-[#6B5A64] hover:text-[#A7066A] mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>

            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-[#1F1720]">Order Confirmation</h1>
                  <p className="text-[#6B5A64] mt-1">Order Number: <span className="font-mono font-semibold text-[#1F1720]">{order.orderNumber}</span></p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(order.orderStatus)}
                  <Badge className={`${getOrderStatusColor(order.orderStatus)}`}>
                    {order.orderStatus}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-[#6B5A64] mt-2">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Order Status Timeline */}
                <Card className="border-brand-border">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#1F1720]">Order Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#A7066A] flex items-center justify-center text-white">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-medium text-[#1F1720]">Order Placed</p>
                          <p className="text-sm text-[#6B5A64]">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>
                      
                      {order.orderStatus !== "PENDING" && (
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                            order.orderStatus === "DELIVERED" ? "bg-[#A7066A]" : "bg-[#E0E0E0]"
                          }`}>
                            <Truck className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-medium text-[#1F1720]">In Transit</p>
                            <p className="text-sm text-[#6B5A64]">Your order is on the way</p>
                          </div>
                        </div>
                      )}

                      {order.orderStatus === "DELIVERED" && (
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#A7066A] flex items-center justify-center text-white">
                            <CheckCircle className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-medium text-[#1F1720]">Delivered</p>
                            <p className="text-sm text-[#6B5A64]">Your order has been delivered</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Order Items */}
                <Card className="border-brand-border">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#1F1720]">Order Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex gap-4 pb-4 border-b border-brand-border last:border-0 last:pb-0">
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-[#FCEAF4] flex-shrink-0">
                            {item.productImage && (
                              <Image
                                src={item.productImage}
                                alt={item.productName}
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-[#1F1720]">{item.productName}</p>
                            <p className="text-sm text-[#6B5A64]">Quantity: {item.quantity}</p>
                            {item.discountName && (
                              <p className="text-sm text-green-600">Discount: {item.discountName}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-[#1F1720]">{formatPrice(item.subtotal)}</p>
                            <p className="text-sm text-[#6B5A64]">{formatPrice(item.salePrice || item.unitPrice)}/item</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Information */}
                <Card className="border-brand-border">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#1F1720]">Delivery Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-3">
                      <MapPin className="w-5 h-5 text-[#A7066A] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-[#1F1720]">Shipping Address</p>
                        <p className="text-sm text-[#6B5A64] mt-1">
                          {(order.shippingAddress as any).addressLine1}
                          {(order.shippingAddress as any).addressLine2 && <>, {(order.shippingAddress as any).addressLine2}</>}
                          <br />
                          {(order.shippingAddress as any).city}, {(order.shippingAddress as any).postalCode}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Phone className="w-5 h-5 text-[#A7066A] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-[#1F1720]">Contact Phone</p>
                        <p className="text-sm text-[#6B5A64]">{order.customerPhone}</p>
                      </div>
                    </div>

                    {order.giftMessage && (
                      <div>
                        <p className="font-medium text-[#1F1720]">Gift Message</p>
                        <p className="text-sm text-[#6B5A64] mt-1 italic">{order.giftMessage}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Order Summary Card */}
                <Card className="border-brand-border">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#1F1720]">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B5A64]">Subtotal</span>
                      <span className="font-medium text-[#1F1720]">{formatPrice(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B5A64]">Delivery Fee</span>
                      <span className="font-medium text-[#1F1720]">
                        {order.deliveryFee === 0 ? "FREE" : formatPrice(order.deliveryFee)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-semibold text-[#1F1720]">Total</span>
                      <span className="font-semibold text-[#A7066A]">{formatPrice(order.total)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Status Card */}
                <Card className="border-brand-border">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#1F1720]">Payment Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Badge className={`${getPaymentStatusColor(order.paymentStatus)} w-full justify-center`}>
                      {order.paymentStatus}
                    </Badge>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-[#6B5A64]">Payment Method</p>
                        <p className="font-medium text-[#1F1720]">{order.paymentMethod}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Card */}
                <Card className="border-brand-border">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#1F1720]">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-[#6B5A64]">Name</p>
                      <p className="font-medium text-[#1F1720]">{order.customerName}</p>
                    </div>
                    {order.customerEmail && (
                      <div>
                        <p className="text-sm text-[#6B5A64]">Email</p>
                        <p className="font-medium text-[#1F1720]">{order.customerEmail}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  } catch (error) {
    console.error("[order-details] Error:", error);
    
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#1F1720]">Error Loading Order</h1>
            <p className="text-[#6B5A64] mt-2">An error occurred while loading your order.</p>
            <Button asChild className="mt-4 bg-[#A7066A]">
              <Link href={`/${locale}`}>Back to Home</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
}
