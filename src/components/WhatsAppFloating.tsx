"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";

export default function WhatsAppFloating() {
  return (
    <Link
      href="https://wa.me/94779911825"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 z-[9999] inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all hover:scale-110"
    >
      <MessageCircle className="h-6 w-6" />
    </Link>
  );
}