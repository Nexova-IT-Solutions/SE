import { Header, Footer, SectionHeading, CartDrawer } from "@/components/giftbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Twitter } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FDF9E8]/30">
      <Header />
      <CartDrawer />
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 md:px-8 lg:px-10 py-12 lg:py-20">
        <SectionHeading 
          title="Contact Us" 
          subtitle="Whether you have a question about our collections or need assistance with an order, our team is here to help." 
        />

        <div className="mt-12 lg:mt-20 grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left: Contact Info */}
          <div className="space-y-10 lg:pr-10">
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#315243]/10 flex items-center justify-center text-[#315243]">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1F1720]">Call Us</h3>
                  <p className="text-[#6B5A64] text-sm mt-1">General Inquiries & Orders</p>
                  <a href="tel:+94112345678" className="text-[#315243] font-medium block mt-2 hover:underline">+94 11 234 5678</a>
                </div>
              </div>

              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#315243]/10 flex items-center justify-center text-[#315243]">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1F1720]">Email Us</h3>
                  <p className="text-[#6B5A64] text-sm mt-1">Support & Collaborations</p>
                  <a href="mailto:hello@skyishearthly.com" className="text-[#315243] font-medium block mt-2 hover:underline">hello@skyishearthly.com</a>
                </div>
              </div>

              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#315243]/10 flex items-center justify-center text-[#315243]">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1F1720]">Visit Our Boutique</h3>
                  <p className="text-[#6B5A64] text-sm mt-1">Visit us in the heart of Colombo</p>
                  <address className="text-[#315243] not-italic font-medium block mt-2">
                    123 Luxury Lane, Colombo 07, <br />
                    Sri Lanka
                  </address>
                </div>
              </div>

              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#315243]/10 flex items-center justify-center text-[#315243]">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1F1720]">Business Hours</h3>
                  <p className="text-[#6B5A64] text-sm mt-1">When we are available</p>
                  <p className="text-[#315243] font-medium block mt-2">Mon - Sat: 9:00 AM - 7:00 PM</p>
                  <p className="text-[#315243] font-medium">Sunday: 10:00 AM - 4:00 PM</p>
                </div>
              </div>
            </div>

            <div className="pt-10 border-t border-[#D1E2DB]">
              <h4 className="text-[#1F1720] font-semibold mb-4">Follow Our Journey</h4>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full border border-[#D1E2DB] flex items-center justify-center text-[#315243] hover:bg-[#315243] hover:text-white transition-all">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full border border-[#D1E2DB] flex items-center justify-center text-[#315243] hover:bg-[#315243] hover:text-white transition-all">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full border border-[#D1E2DB] flex items-center justify-center text-[#315243] hover:bg-[#315243] hover:text-white transition-all">
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-[#315243]/5 border border-[#D1E2DB]">
            <h3 className="text-2xl font-bold text-[#1F1720] mb-2">Send us a Message</h3>
            <p className="text-[#6B5A64] mb-8">Fill out the form below and we&apos;ll get back to you within 24 hours.</p>

            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-[#1F1720]">Full Name</label>
                  <Input 
                    id="name" 
                    placeholder="John Doe" 
                    className="h-12 border-[#D1E2DB] focus:border-[#315243] focus:ring-[#315243]/20 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-[#1F1720]">Email Address</label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john@example.com" 
                    className="h-12 border-[#D1E2DB] focus:border-[#315243] focus:ring-[#315243]/20 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium text-[#1F1720]">Subject</label>
                <Input 
                  id="subject" 
                  placeholder="How can we help?" 
                  className="h-12 border-[#D1E2DB] focus:border-[#315243] focus:ring-[#315243]/20 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-[#1F1720]">Your Message</label>
                <Textarea 
                  id="message" 
                  placeholder="Describe your inquiry in detail..." 
                  className="min-h-[150px] border-[#D1E2DB] focus:border-[#315243] focus:ring-[#315243]/20 rounded-[1.5rem] p-4"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 bg-[#315243] hover:bg-[#1A3026] text-white text-lg font-bold rounded-2xl transition-all shadow-lg shadow-[#315243]/20"
              >
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
