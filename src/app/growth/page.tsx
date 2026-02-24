"use client";

import { useDashboard } from "@/components/DashboardProvider";
import { TopBar } from "@/components/TopBar";
import { UploadZone } from "@/components/UploadZone";
import { ArrowDownRight, ArrowUpRight, CalendarDays, History, Activity } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export default function GrowthMetricsPage() {
    const router = useRouter();
    const { isLoaded, currentSnapshot, previousSnapshot, opportunities } = useDashboard();

    if (!isLoaded || !currentSnapshot) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC]">
                <TopBar title="Growth Metrics" />
                <div className="flex-1 flex items-center justify-center w-full">
                    <UploadZone />
                </div>
            </div>
        );
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(val);
    };

    const getWowPercentage = (current: number, previous: number) => {
        if (!previous || previous === 0) return 0;
        return ((current / previous) - 1) * 100;
    };

    const hasPrevious = !!previousSnapshot;
    const growthWow = getWowPercentage(currentSnapshot.openPipelineValueGbp, previousSnapshot?.openPipelineValueGbp || 0);

    // Calendar Year Aggregation
    const yearStats = new Map<number, {
        createdCount: number; createdValue: number;
        wonCount: number; wonValue: number;
        lostCount: number; lostValue: number;
    }>();

    if (opportunities) {
        for (const o of opportunities) {
            const yr = new Date(o.createdOn).getFullYear();
            if (!yearStats.has(yr)) {
                yearStats.set(yr, { createdCount: 0, createdValue: 0, wonCount: 0, wonValue: 0, lostCount: 0, lostValue: 0 });
            }
            const s = yearStats.get(yr)!;

            s.createdCount++;
            s.createdValue += o.valueGbp;

            if (o.status === 'Won') {
                s.wonCount++;
                s.wonValue += o.valueGbp;
            } else if (o.status === 'Lost') {
                s.lostCount++;
                s.lostValue += o.valueGbp;
            }
        }
    }

    const sortedYears = Array.from(yearStats.keys()).sort((a, b) => b - a); // descending

    return (
        <div className="flex-1 flex flex-col bg-[#F8FAFC] min-h-screen">
            <TopBar title="Growth & Snapshots" />

            <div className="p-8 space-y-8 max-w-[1200px] w-full mx-auto">

                {/* WoW Pipeline Container */}
                <div className="bg-vjtech-primary rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-10">
                        <Activity className="w-64 h-64 text-vjtech-accent" />
                    </div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-slate-300 mb-1 flex items-center">
                                <History className="w-5 h-5 mr-3 text-vjtech-accent" /> Week-over-Week Pipeline Growth
                            </h3>
                            <p className="text-slate-400 text-sm">Deterministic progression against last snapshot.</p>
                        </div>

                        <div className="text-right">
                            {hasPrevious ? (
                                <>
                                    <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-1">WoW Ratio</p>
                                    <div className={`flex items-center text-4xl font-bold ${growthWow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {growthWow >= 0 ? <ArrowUpRight className="w-8 h-8 mr-2" /> : <ArrowDownRight className="w-8 h-8 mr-2" />}
                                        {growthWow > 0 ? '+' : ''}{growthWow.toFixed(1)}%
                                    </div>
                                </>
                            ) : (
                                <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
                                    <span className="text-sm text-slate-400 font-medium tracking-wide">First Snapshot Logged</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Current vs Previous Comparison */}
                    {hasPrevious && (
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm flex flex-col justify-center">
                            <h3 className="text-md font-bold text-slate-800 mb-6 uppercase tracking-wider text-center">Open Value Deviation</h3>
                            <div className="flex items-center justify-between">
                                <div className="text-center w-full">
                                    <p className="text-sm font-semibold text-slate-400 uppercase">Previous</p>
                                    <p className="text-2xl font-bold text-slate-700 mt-1">{formatCurrency(previousSnapshot.openPipelineValueGbp)}</p>
                                </div>
                                <div className="mx-6 w-full text-center">
                                    <div className={`h-1 w-24 mx-auto rounded-full ${growthWow >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                </div>
                                <div className="text-center w-full">
                                    <p className="text-sm font-semibold text-slate-400 uppercase">Current</p>
                                    <p className="text-3xl font-black text-vjtech-accent mt-1">{formatCurrency(currentSnapshot.openPipelineValueGbp)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 7-Day Velocity */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm lg:col-span-1">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                            <CalendarDays className="w-5 h-5 mr-3 text-vjtech-accent" /> 7-Day Velocity
                        </h3>

                        <div className="space-y-4">
                            <VelocityBar
                                label="New Generated"
                                count={currentSnapshot.createdLast7DaysCount}
                                value={currentSnapshot.createdLast7DaysValue}
                                color="indigo"
                            />
                            <VelocityBar
                                label="Won (Closed)"
                                count={currentSnapshot.wonLast7DaysCount}
                                value={currentSnapshot.wonLast7DaysValue}
                                color="emerald"
                            />
                            <VelocityBar
                                label="Lost (Closed)"
                                count={currentSnapshot.lostLast7DaysCount}
                                value={currentSnapshot.lostLast7DaysValue}
                                color="rose"
                            />
                        </div>
                    </div>

                    {/* Regional Historical Context */}
                    {hasPrevious && currentSnapshot.byRegionCount && previousSnapshot.byRegionCount && Object.keys(currentSnapshot.byRegionCount).length > 0 && (
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm lg:col-span-2">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                                <History className="w-5 h-5 mr-3 text-vjtech-accent" /> Regional Pipeline Averages
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                        <tr>
                                            <th className="py-3 px-4 rounded-tl-lg">Region</th>
                                            <th className="py-3 px-4 text-center">Past Volume<br /><span className="text-[10px] font-normal tracking-normal text-slate-400 capitalize bg-white/50 px-1 py-0.5 rounded mt-1 inline-block border border-slate-200">{format(new Date(previousSnapshot.timestamp), 'MMM d')}</span></th>
                                            <th className="py-3 px-4 text-center">Current Volume<br /><span className="text-[10px] font-normal tracking-normal text-emerald-600/70 capitalize bg-emerald-50 px-1 py-0.5 rounded mt-1 inline-block border border-emerald-100">{format(new Date(currentSnapshot.timestamp), 'MMM d')}</span></th>
                                            <th className="py-3 px-4 text-right">Avg Deal Value (Past)</th>
                                            <th className="py-3 px-4 text-right rounded-tr-lg">Avg Deal Value (Current)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.keys(currentSnapshot.byRegionCount).sort().map(region => {
                                            const pastCount = previousSnapshot.byRegionCount[region] || 0;
                                            const currCount = currentSnapshot.byRegionCount[region] || 0;
                                            const pastValue = previousSnapshot.byRegionValue[region] || 0;
                                            const currValue = currentSnapshot.byRegionValue[region] || 0;

                                            const pastAvg = pastCount > 0 ? (pastValue / pastCount) : 0;
                                            const currAvg = currCount > 0 ? (currValue / currCount) : 0;

                                            return (
                                                <tr key={region} className="border-b border-slate-100 hover:bg-slate-50">
                                                    <td className="py-3 px-4 font-bold text-slate-800">{region}</td>
                                                    <td className="py-3 px-4 text-center font-medium text-slate-600">{pastCount}</td>
                                                    <td className={`py-3 px-4 text-center font-bold ${currCount > pastCount ? 'text-emerald-600' : (currCount < pastCount ? 'text-rose-600' : 'text-slate-900')}`}>
                                                        {currCount}
                                                    </td>
                                                    <td className="py-3 px-4 text-right text-slate-600 font-medium">{formatCurrency(pastAvg)}</td>
                                                    <td className={`py-3 px-4 text-right font-bold ${currAvg > pastAvg ? 'text-emerald-600' : (currAvg < pastAvg ? 'text-rose-600' : 'text-slate-900')}`}>
                                                        {formatCurrency(currAvg)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Calendar Year Historical Analysis */}
                    {sortedYears.length > 0 && (
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm lg:col-span-2">
                            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center">
                                <CalendarDays className="w-5 h-5 mr-3 text-vjtech-accent" /> Annual Pipeline Conversions (Sales Director Review)
                            </h3>
                            <p className="text-sm text-slate-500 mb-6 italic">
                                *Note: Conversion ratios may appear skewed as direct-to-order distributor sales often bypass CRM opportunity creation.
                            </p>
                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-[#1E293B] text-slate-300 text-xs font-bold uppercase tracking-wider">
                                        <tr>
                                            <th className="py-4 px-4 border-r border-slate-700 w-1/5 whitespace-nowrap">Creation Year</th>
                                            <th className="py-4 px-4 text-center">Created Vol</th>
                                            <th className="py-4 px-4 text-center">Won Vol</th>
                                            <th className="py-4 px-4 text-center">Lost Vol</th>
                                            <th className="py-4 px-4 text-center text-vjtech-accent bg-slate-800">Win Rate %</th>
                                            <th className="py-4 px-4 text-right">Created Val (GBP)</th>
                                            <th className="py-4 px-4 text-right min-w-[140px]">Won Val (GBP)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedYears.map(yr => {
                                            const s = yearStats.get(yr)!;
                                            const winRatio = s.wonCount + s.lostCount > 0 ? (s.wonCount / (s.wonCount + s.lostCount)) * 100 : 0;
                                            return (
                                                <tr
                                                    key={yr}
                                                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer hover:ring-2 hover:ring-vjtech-accent/50 hover:ring-inset"
                                                    onClick={() => router.push(`/explorer?createdAfter=${yr}-01-01T00:00:00.000Z&createdBefore=${yr}-12-31T23:59:59.999Z`)}
                                                    title={`View all opportunities created in ${yr}`}
                                                >
                                                    <td className="py-4 px-4 font-black text-slate-800 border-r border-slate-100 text-base">{yr}</td>
                                                    <td className="py-4 px-4 text-center font-medium text-slate-600">{s.createdCount.toLocaleString()}</td>
                                                    <td className="py-4 px-4 text-center font-bold text-emerald-600">{s.wonCount.toLocaleString()}</td>
                                                    <td className="py-4 px-4 text-center font-bold text-rose-600">{s.lostCount.toLocaleString()}</td>
                                                    <td className="py-4 px-4 text-center font-black text-vjtech-accent bg-vjtech-accent/5">{winRatio.toFixed(1)}%</td>
                                                    <td className="py-4 px-4 text-right text-slate-600 font-medium tracking-tight">{formatCurrency(s.createdValue)}</td>
                                                    <td className="py-4 px-4 text-right font-bold text-emerald-600 tracking-tight">{formatCurrency(s.wonValue)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

function VelocityBar({ label, count, value, color }: { label: string, count: number, value: number, color: string }) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(val);
    };

    const bgMap: Record<string, string> = {
        indigo: 'bg-vjtech-accent/10 border-vjtech-accent/20 text-vjtech-accent',
        emerald: 'bg-emerald-50 border-emerald-100 text-emerald-900',
        rose: 'bg-rose-50 border-rose-100 text-rose-900'
    };

    const countBadgeMap: Record<string, string> = {
        indigo: 'bg-vjtech-accent/20 text-vjtech-accent',
        emerald: 'bg-emerald-200 text-emerald-800',
        rose: 'bg-rose-200 text-rose-800'
    };

    return (
        <div className={`p-4 rounded-xl border flex items-center justify-between ${bgMap[color]}`}>
            <div className="flex items-center space-x-3">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${countBadgeMap[color]}`}>
                    {count} opps
                </span>
                <span className="font-semibold text-sm uppercase tracking-wide">{label}</span>
            </div>
            <div className="font-bold text-lg">
                {formatCurrency(value)}
            </div>
        </div>
    );
}
