"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useDashboard } from "@/components/DashboardProvider";
import { TopBar } from "@/components/TopBar";
import { UploadZone } from "@/components/UploadZone";
import { aggregatePipeline, filterOpportunities } from "@/lib/aggregations";
import { format } from "date-fns";
import {
  PoundSterling,
  Target,
  TrendingUp,
  FileBox,
  TrendingDown,
  AlertTriangle,
  Building2,
  PieChart as PieChartIcon,
  Info
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList
} from 'recharts';

export default function DashboardPage() {
  const router = useRouter();
  const { isLoaded, opportunities, filters, currentSnapshot, previousSnapshot, report } = useDashboard();
  const [geoView, setGeoView] = useState<'region' | 'country'>('region');

  if (!isLoaded) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC]">
        <TopBar title="Executive Overview" />
        <div className="flex-1 flex items-center justify-center w-full">
          <UploadZone />
        </div>
      </div>
    );
  }

  // Active aggregated values based on filters (strictly Open Pipeline)
  const activeOpps = filterOpportunities(opportunities, filters);
  const metrics = aggregatePipeline(activeOpps, filters);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(val);
  };

  const budget2026 = 15000000; // Hardcoded example 15M budget roughly
  const budgetRatio = (metrics.openPipelineValueGbp / budget2026) * 100;

  const PIE_COLORS = ['#3B4A54', '#F37021', '#ECA338', '#4B5563', '#10B981'];

  // Calculate Pie Chart safely with 'Other' slice to ensure 100% representation
  const topClasses = metrics.byClass.slice(0, 4);
  const otherClassValue = metrics.byClass.slice(4).reduce((sum, c) => sum + c.value, 0);
  const pieData = [...topClasses];
  if (otherClassValue > 0) {
    pieData.push({ name: 'Other', value: otherClassValue });
  }

  // Calculate geographic chart data with percentage labels
  const regionData = metrics.byRegion.map(r => ({
    ...r,
    labelStr: `${r.count} Deals (${metrics.weightedPipelineValue > 0 ? ((r.value / metrics.weightedPipelineValue) * 100).toFixed(1) : 0}%)`
  }));
  const countryData = metrics.byCountry.slice(0, 15).map(c => ({
    ...c,
    labelStr: `${c.count} Deals (${metrics.weightedPipelineValue > 0 ? ((c.value / metrics.weightedPipelineValue) * 100).toFixed(1) : 0}%)`
  }));
  const activeGeoData = geoView === 'region' ? regionData : countryData;

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] min-h-screen">
      <TopBar title="Executive Overview" />

      <div className="p-8 space-y-8 max-w-[1600px] w-full mx-auto">

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            title="Open Pipeline"
            helpText="Sum of all opportunities where Status is exactly 'New' or 'Open'. Closed, Won, or Lost deals are strictly excluded from calculation."
            value={formatCurrency(metrics.openPipelineValueGbp)}
            icon={PoundSterling}
            trend={currentSnapshot ? `+${currentSnapshot.createdLast7DaysCount} last 7d` : undefined}
            positive={true}
            subtitle={previousSnapshot ? `vs ${formatCurrency(previousSnapshot.openPipelineValueGbp)} on ${format(new Date(previousSnapshot.timestamp), 'MMM d')}` : undefined}
          />
          <KpiCard
            title="Weighted Value"
            helpText={`Applies the formula: [Value (GBP)] * [Probability]. Currently using mode: ${filters.mode}.`}
            value={formatCurrency(metrics.weightedPipelineValue)}
            icon={Target}
            subtitle={`Mode: ${filters.mode}`}
          />
          <KpiCard
            title="Active Opportunities"
            helpText="Count of rows where Status is exactly 'New' or 'Open'."
            value={metrics.openOpportunityCount.toString()}
            icon={FileBox}
          />
          <KpiCard
            title="Budget 2026 Coverage"
            helpText="Calculated as (Open Pipeline / £15,000,000 Annual Budget) * 100."
            value={`${budgetRatio.toFixed(1)}%`}
            icon={TrendingUp}
            trend={budgetRatio >= 50 ? "On Track" : "Action Required"}
            positive={budgetRatio >= 50}
            subtitle="Annual Target: £15,000,000"
          />
        </div>

        {/* Chart Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm relative flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Pipeline by {geoView === 'region' ? 'Region' : 'Country'}</h3>
              <div className="bg-slate-100 p-1 rounded-lg flex text-sm font-semibold">
                <button onClick={() => setGeoView('region')} className={`px-4 py-1.5 rounded-md transition-all ${geoView === 'region' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Regions</button>
                <button onClick={() => setGeoView('country')} className={`px-4 py-1.5 rounded-md transition-all ${geoView === 'country' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Countries</button>
              </div>
            </div>
            <div className="h-[300px] w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeGeoData} layout="vertical" margin={{ left: 40, right: 120 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                  <XAxis type="number" tickFormatter={(val) => `£${(val / 1000000).toFixed(1)}M`} stroke="#94A3B8" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} width={120} />
                  <Tooltip
                    cursor={{ fill: '#F1F5F9' }}
                    formatter={(val: number) => [
                      `${formatCurrency(val)}`,
                      "Weighted Pipeline"
                    ]}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#F37021"
                    radius={[0, 4, 4, 0]}
                    barSize={geoView === 'country' ? 16 : 24}
                    className="cursor-pointer hover:brightness-110 transition-all"
                    onClick={(data) => router.push(`/explorer?region=${encodeURIComponent(data.name)}`)}
                  >
                    <LabelList dataKey="labelStr" position="right" fill="#64748B" fontSize={11} fontWeight="bold" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
            <div className="flex items-center mb-6">
              <PieChartIcon className="w-5 h-5 mr-2 text-vjtech-accent" />
              <h3 className="text-lg font-bold text-slate-800">Customer Classes</h3>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData.length > 0 ? pieData : [{ name: 'Empty', value: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => formatCurrency(val)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {pieData.map((c, i) => (
                <div key={c.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}></div>
                    <span className="text-slate-600 truncate max-w-[120px]">{c.name}</span>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {metrics.weightedPipelineValue > 0 ? ((c.value / metrics.weightedPipelineValue) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Row - Data Quality & Top Countries */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-vjtech-accent" /> Pipeline Velocity
            </h3>

            <div className="space-y-6 flex-1">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Generated Last 7 Days</p>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-slate-500">{currentSnapshot?.createdLast7DaysCount || 0} Deals</span>
                  <span className="text-xl font-bold text-slate-900 text-emerald-600">{formatCurrency(currentSnapshot?.createdLast7DaysValue || 0)}</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Generated Last 30 Days</p>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-slate-500">{currentSnapshot?.createdLast30DaysCount || 0} Deals</span>
                  <span className="text-xl font-bold text-slate-900 text-emerald-600">{formatCurrency(currentSnapshot?.createdLast30DaysValue || 0)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center"><AlertTriangle className="w-4 h-4 mr-1 text-amber-500" /> Data Audit</p>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-500">Account Match Rate</span>
                  <span className="text-xs font-bold text-slate-700">{report?.joinMatchRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3"><div className="bg-vjtech-primary h-1.5 rounded-full" style={{ width: `${report?.joinMatchRate || 0}%` }}></div></div>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Invalid Calculation Rows:</span>
                  <span className="font-bold text-rose-500">{report ? (report.invalidStageProbRows.length + report.invalidDateRows.length) : 0} Rows omitted</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
            <div className="flex items-center group/tooltip w-max mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-vjtech-accent" /> Top Countries by Value
              </h3>
              <div className="ml-2 relative flex items-center">
                <Info className="w-4 h-4 text-slate-300 hover:text-vjtech-accent cursor-help transition-colors" />
                <div className="absolute left-1/2 -top-2 -translate-y-full -translate-x-1/2 w-56 bg-slate-800 text-white text-xs rounded-lg p-2.5 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-10 shadow-lg pointer-events-none">
                  Calculated exclusively from Active Open Pipeline value sums grouped by Customer Country logic.
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="text-left py-3 px-4 bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider rounded-l-lg">Country</th>
                    <th className="text-right py-3 px-4 bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">Opps</th>
                    <th className="text-right py-3 px-4 bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider rounded-r-lg">Pipeline Value</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.byCountry.slice(0, 5).map((ctry) => (
                    <tr key={ctry.name} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 border-b border-slate-100 text-sm font-medium text-slate-800">{ctry.name}</td>
                      <td className="py-3 px-4 border-b border-slate-100 text-sm font-medium text-slate-600 text-right">{ctry.count}</td>
                      <td className="py-3 px-4 border-b border-slate-100 text-sm font-bold text-slate-900 text-right">{formatCurrency(ctry.value)}</td>
                    </tr>
                  ))}
                  {metrics.byCountry.length === 0 && (
                    <tr><td colSpan={3} className="py-4 text-center text-slate-500 text-sm">No valid countries found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function KpiCard({ title, value, icon: Icon, trend, positive, subtitle, helpText }: { title: string, value: string, icon: any, trend?: string, positive?: boolean, subtitle?: string, helpText?: string }) {
  return (
    <div className="bg-white flex flex-col justify-between rounded-2xl p-6 border border-slate-200/60 shadow-sm transition-shadow hover:shadow-md relative overflow-hidden group">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center group/tooltip">
            <h3 className="text-sm font-semibold text-slate-500 tracking-wide">{title}</h3>
            {helpText && (
              <div className="ml-2 relative flex items-center">
                <Info className="w-4 h-4 text-slate-300 hover:text-vjtech-accent cursor-help transition-colors" />
                <div className="absolute left-6 -top-2 -translate-y-full w-56 bg-slate-800 text-white text-xs rounded-lg p-2.5 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-10 shadow-xl pointer-events-none">
                  {helpText}
                  <div className="absolute -bottom-1 left-4 w-2 h-2 bg-slate-800 rotate-45"></div>
                </div>
              </div>
            )}
          </div>
          <div className="bg-vjtech-accent/10 p-2.5 rounded-xl text-vjtech-accent group-hover:bg-vjtech-accent group-hover:text-white transition-colors">
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
        </div>
      </div>
      <div>
        {trend && (
          <p className={`text-xs font-semibold mt-4 flex items-center ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {positive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {trend}
          </p>
        )}

        {subtitle && (
          <p className="text-xs font-medium text-slate-400 mt-4 uppercase tracking-wider">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
