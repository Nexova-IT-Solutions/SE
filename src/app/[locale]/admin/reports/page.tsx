"use client"

import React from "react"
import { 
  TrendingUp, 
  Package, 
  Users as UsersIcon, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight,
  ShoppingBag,
  AlertTriangle,
  ChevronRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] px-4 md:px-8 lg:px-10 space-y-8 pb-12 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1F1720]">Business Insights</h1>
            <p className="text-[#6B5A64] mt-2">Comprehensive data analysis for your clothing boutique.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-brand-border rounded-xl">Last 30 Days</Button>
            <Button className="bg-[#315243] hover:bg-[#1A3026] text-white rounded-xl px-6">Export PDF</Button>
          </div>
        </div>

        {/* Primary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            title="Total Revenue" 
            value="Rs. 245,800" 
            change="+12.5%" 
            isPositive={true} 
            icon={CreditCard} 
          />
          <MetricCard 
            title="Orders" 
            value="184" 
            change="+8.2%" 
            isPositive={true} 
            icon={ShoppingBag} 
          />
          <MetricCard 
            title="Avg. Order Value" 
            value="Rs. 1,335" 
            change="-2.4%" 
            isPositive={false} 
            icon={TrendingUp} 
          />
          <MetricCard 
            title="Conversion Rate" 
            value="3.8%" 
            change="+0.6%" 
            isPositive={true} 
            icon={UsersIcon} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Report 1: Sales by Category */}
          <Card className="rounded-[2rem] border-brand-border shadow-sm overflow-hidden bg-white">
            <CardHeader className="border-b border-brand-border bg-[#FAFAFA]">
              <CardTitle className="text-lg font-bold text-[#1F1720] flex items-center gap-2">
                <Package className="w-5 h-5 text-[#315243]" />
                Sales by Category
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <CategoryUsage label="Womenswear" percentage={45} amount="Rs. 110.6k" color="bg-[#315243]" />
              <CategoryUsage label="Menswear" percentage={30} amount="Rs. 73.7k" color="bg-[#9B854A]" />
              <CategoryUsage label="Accessories" percentage={15} amount="Rs. 36.8k" color="bg-[#6B5A64]" />
              <CategoryUsage label="Kids Fashion" percentage={10} amount="Rs. 24.5k" color="bg-slate-300" />
            </CardContent>
          </Card>

          {/* Report 2: Monthly Revenue Trend */}
          <Card className="rounded-[2rem] border-brand-border shadow-sm overflow-hidden bg-white">
            <CardHeader className="border-b border-brand-border bg-[#FAFAFA]">
              <CardTitle className="text-lg font-bold text-[#1F1720] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#315243]" />
                Monthly Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
               <div className="h-[200px] flex items-end justify-between gap-4 pt-4">
                  <BarChartItem label="Jan" height="40%" />
                  <BarChartItem label="Feb" height="55%" />
                  <BarChartItem label="Mar" height="45%" />
                  <BarChartItem label="Apr" height="65%" active />
                  <BarChartItem label="May" height="85%" />
                  <BarChartItem label="Jun" height="75%" />
               </div>
            </CardContent>
          </Card>

          {/* Report 3: Inventory Health (Low Stock) */}
          <Card className="rounded-[2rem] border-brand-border shadow-sm overflow-hidden bg-white">
            <CardHeader className="border-b border-brand-border bg-[#FAFAFA] flex flex-row items-center justify-between py-4">
              <CardTitle className="text-lg font-bold text-[#1F1720] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Low Stock Alerts
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-[#315243] font-bold text-xs uppercase tracking-wider">Restock All</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-brand-border">
                <StockItem name="Classic White Linen Shirt" sku="SH-WL-001" stock={4} total={50} />
                <StockItem name="Floral Summer Dress" sku="DR-SS-042" stock={2} total={30} />
                <StockItem name="Urban Canvas Sneakers" sku="FT-SN-089" stock={1} total={40} />
                <StockItem name="Handcrafted Leather Belt" sku="AC-LB-102" stock={5} total={100} />
              </div>
            </CardContent>
          </Card>

          {/* Report 4: Customer Acquisition (Direct/Loyalty) */}
          <Card className="rounded-[2rem] border-brand-border shadow-sm overflow-hidden bg-white">
            <CardHeader className="border-b border-brand-border bg-[#FAFAFA]">
              <CardTitle className="text-lg font-bold text-[#1F1720] flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-[#315243]" />
                Customer Retention
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex flex-col sm:flex-row items-center justify-around gap-8">
                <div className="text-center space-y-2">
                  <div className="text-5xl font-black text-[#315243]">64%</div>
                  <div className="text-xs font-bold uppercase tracking-widest text-[#6B5A64]">Returning Customers</div>
                </div>
                <div className="w-px h-16 bg-brand-border hidden sm:block" />
                <div className="text-center space-y-2">
                  <div className="text-5xl font-black text-[#9B854A]">36%</div>
                  <div className="text-xs font-bold uppercase tracking-widest text-[#6B5A64]">New Customers</div>
                </div>
              </div>
              <div className="mt-10 p-4 bg-[#FDF9E8] rounded-2xl border border-[#9B854A]/20">
                <div className="text-sm font-bold text-[#315243] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Loyalty Impact
                </div>
                <p className="text-xs text-[#6B5A64] mt-1 italic">Returning customers spend 1.8x more per transaction on average.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, change, isPositive, icon: Icon }: any) {
  return (
    <Card className="rounded-2xl border-brand-border bg-white shadow-sm overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-[#6B5A64]">{title}</p>
            <div className="text-2xl font-black text-[#1F1720]">{value}</div>
          </div>
          <div className="p-2 bg-[#FDF9E8] rounded-xl text-[#315243]">
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-1">
          {isPositive ? (
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-rose-600" />
          )}
          <span className={`text-xs font-bold ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
            {change}
          </span>
          <span className="text-xs text-gray-400 font-medium">vs last month</span>
        </div>
      </CardContent>
    </Card>
  )
}

function CategoryUsage({ label, percentage, amount, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-bold text-[#1F1720]">{label}</span>
        <span className="font-mono text-[#6B5A64]">{amount}</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }} />
      </div>
      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
        {percentage}% of total inventory sold
      </div>
    </div>
  )
}

function BarChartItem({ label, height, active }: any) {
  return (
    <div className="flex-1 flex flex-col items-center gap-3 h-full">
      <div className="w-full flex-1 flex items-end">
        <div 
          className={`w-full rounded-t-lg transition-all duration-500 hover:brightness-90 cursor-help ${active ? 'bg-[#9B854A]' : 'bg-[#315243]/20'}`} 
          style={{ height }}
          title={`${label}: ${height}`}
        />
      </div>
      <span className="text-[10px] font-bold text-[#6B5A64] uppercase tracking-tighter">{label}</span>
    </div>
  )
}

function StockItem({ name, sku, stock, total }: any) {
  const percentage = (stock / total) * 100
  return (
    <div className="p-4 hover:bg-[#FAFAFA] transition-colors flex items-center justify-between group">
      <div className="space-y-0.5">
        <p className="text-sm font-bold text-[#1F1720] group-hover:text-[#315243] transition-colors">{name}</p>
        <p className="text-xs text-[#6B5A64] font-mono uppercase">{sku}</p>
      </div>
      <div className="text-right">
        <div className={`text-sm font-black ${percentage < 10 ? 'text-rose-600' : 'text-amber-600'}`}>
          {stock} left
        </div>
        <div className="text-[10px] text-gray-400 font-bold uppercase">Target: {total}</div>
      </div>
    </div>
  )
}
