import Link from "next/link";
import Image from "next/image";
import { Gift, Phone, Mail, MapPin, Facebook, Instagram, Twitter } from "lucide-react";
import packageJson from "../../../package.json";


const footerLinks = {
  shop: [
    { name: "Menswear", href: "/categories" },
    { name: "Womenswear", href: "/categories" },
    { name: "Kids Fashion", href: "/categories" },
    { name: "Accessories", href: "/categories" },
    { name: "Footwear", href: "/categories" },
    { name: "Style Bundles", href: "/box-builder" },
  ],
  occasions: [
    { name: "Casual", href: "/occasion/casual" },
    { name: "Office", href: "/occasion/office" },
    { name: "Party", href: "/occasion/party" },
    { name: "Vacation", href: "/occasion/vacation" },
    { name: "Weddings", href: "/occasion/weddings" },
    { name: "Gym & Active", href: "/occasion/gym" },
  ],
  company: [
    { name: "About Us", href: "#" },
    { name: "Contact", href: "#" },
    { name: "FAQs", href: "#" },
    { name: "Delivery Info", href: "#" },
    { name: "Returns Policy", href: "#" },
    { name: "Terms & Conditions", href: "/terms-of-conditions", external: true },
    { name: "Privacy Policy", href: "/privacy-policy", external: true },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[#1F1720] text-white mt-auto">
      {/* Main Footer */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-10 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center mb-6 group">
              <Image 
                src="/logo/logo.png?v=1.2" 
                alt="Skyish & Earthly Logo" 
                width={220}
                height={60}
                className="object-contain h-14 md:h-16 w-auto drop-shadow-[0_0_12px_rgba(155,133,74,0.3)] group-hover:drop-shadow-[0_0_15px_rgba(155,133,74,0.5)] transition-all"
                unoptimized
              />
            </Link>
            <p className="text-[#B8A4B0] text-sm mb-6">
              Sri Lanka&apos;s premier fashion destination. Elevate your style with curated collections and personalized lookbooks.
            </p>
            <div className="space-y-3">
              <a href="tel:+94123456789" className="flex items-center gap-3 text-sm text-[#B8A4B0] hover:text-white transition-colors">
                <Phone className="w-4 h-4" />
                +94 123 456 789
              </a>
              <a href="mailto:hello@skyishearthly.com" className="flex items-center gap-3 text-sm text-[#B8A4B0] hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
                hello@skyishearthly.com
              </a>
              <div className="flex items-start gap-3 text-sm text-[#B8A4B0]">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Colombo, Sri Lanka</span>
              </div>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 text-white">Shop</h3>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} prefetch={false} className="text-sm text-[#B8A4B0] hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Occasions Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 text-white">Occasions</h3>
            <ul className="space-y-3">
              {footerLinks.occasions.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} prefetch={false} className="text-sm text-[#B8A4B0] hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 text-white">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href} 
                    prefetch={false} 
                    target={(link as any).external ? "_blank" : undefined}
                    rel={(link as any).external ? "noopener noreferrer" : undefined}
                    className="text-sm text-[#B8A4B0] hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social & Bottom */}
        <div className="mt-12 pt-8 border-t border-[#3D2F38]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-[#3D2F38] flex items-center justify-center hover:bg-[#315243] transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-[#3D2F38] flex items-center justify-center hover:bg-[#315243] transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-[#3D2F38] flex items-center justify-center hover:bg-[#315243] transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
            <p className="text-sm text-[#B8A4B0] flex items-center gap-2">
              <span>© {new Date().getFullYear()} Skyish & Earthly. All rights reserved.</span>
              <span className="text-[#3D2F38]">|</span>
              <span>v{packageJson.version}</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
