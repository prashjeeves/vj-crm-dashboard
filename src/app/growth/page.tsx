"use client";

import { useDashboard } from "@/components/DashboardProvider";
import { TopBar } from "@/components/TopBar";
import { UploadZone } from "@/components/UploadZone";
import { ArrowDownRight, ArrowUpRight, CalendarDays, History, Activity, ChevronRight, ChevronDown, ExternalLink, Users } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import React, { useState, Fragment } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LabelList
} from 'recharts';

export default function GrowthMetricsPage() {
    const router = useRouter();
    const { isLoaded, currentSnapshot, previousSnapshot, opportunities } = useDashboard();
    const [expandedYear, setExpandedYear] = useState<number | null>(null);
    const [expandedAccountYear, setExpandedAccountYear] = useState<number | null>(null);
    const [chartYear, setChartYear] = useState<number | null>(null);

    // Set a default chart year on first render
    React.useEffect(() => {
        if (!chartYear && opportunities && opportunities.length > 0) {
            setChartYear(new Date().getFullYear());
        }
    }, [opportunities, chartYear]);

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
        countries: Map<string, { createdCount: number; createdValue: number; wonCount: number; wonValue: number; lostCount: number; lostValue: number }>;
    }>();

    if (opportunities) {
        for (const o of opportunities) {
            const yr = new Date(o.createdOn).getFullYear();
            if (!yearStats.has(yr)) {
                yearStats.set(yr, {
                    createdCount: 0, createdValue: 0, wonCount: 0, wonValue: 0, lostCount: 0, lostValue: 0,
                    countries: new Map()
                });
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

            // Country stats
            const country = o.country || 'Unknown';
            if (!s.countries.has(country)) {
                s.countries.set(country, { createdCount: 0, createdValue: 0, wonCount: 0, wonValue: 0, lostCount: 0, lostValue: 0 });
            }
            const cs = s.countries.get(country)!;
            cs.createdCount++;
            cs.createdValue += o.valueGbp;

            if (o.status === 'Won') {
                cs.wonCount++;
                cs.wonValue += o.valueGbp;
            } else if (o.status === 'Lost') {
                cs.lostCount++;
                cs.lostValue += o.valueGbp;
            }
        }
    }

    // New Customer Account Synthesis (Proxy = Earliest Opportunity Date per Account)
    const accountOriginDates = new Map<string, Date>();
    const accountCountries = new Map<string, string>();

    if (opportunities) {
        // First pass: Find earliest opportunity date for every account
        for (const o of opportunities) {
            if (!o.accountName) continue;

            const existingOrigin = accountOriginDates.get(o.accountName);
            if (!existingOrigin || o.createdOn < existingOrigin) {
                accountOriginDates.set(o.accountName, o.createdOn);
                accountCountries.set(o.accountName, o.country || 'Unknown');
            }
        }
    }

    // New Account Aggregation by Year -> Country
    const newAccountsByYear = new Map<number, {
        totalAccounts: number;
        countries: Map<string, number>;
    }>();

    for (const [acc, originDate] of Array.from(accountOriginDates.entries())) {
        const yr = originDate.getFullYear();
        const country = accountCountries.get(acc) || 'Unknown';

        if (!newAccountsByYear.has(yr)) {
            newAccountsByYear.set(yr, { totalAccounts: 0, countries: new Map() });
        }

        const s = newAccountsByYear.get(yr)!;
        s.totalAccounts++;
        s.countries.set(country, (s.countries.get(country) || 0) + 1);
    }

    const sortedAccountYears = Array.from(newAccountsByYear.keys()).sort((a, b) => b - a);

    // Top 5 Countries for the selected Chart Year
    let topChartCountries: { name: string, accounts: number }[] = [];
    if (chartYear && newAccountsByYear.has(chartYear)) {
        const yearData = newAccountsByYear.get(chartYear)!;
        topChartCountries = Array.from(yearData.countries.entries())
            .map(([name, accounts]) => ({ name, accounts }))
            .sort((a, b) => b.accounts - a.accounts)
            .slice(0, 5);
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
                                            const isExpanded = expandedYear === yr;
                                            const sortedCountries = Array.from(s.countries.entries()).sort((a, b) => b[1].createdCount - a[1].createdCount);

                                            return (
                                                <Fragment key={yr}>
                                                    <tr
                                                        className={`border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`}
                                                        onClick={() => setExpandedYear(expandedYear === yr ? null : yr)}
                                                        title={`Click to view country breakdown for ${yr}`}
                                                    >
                                                        <td className="py-4 px-4 font-black text-slate-800 border-r border-slate-100 text-base flex justify-between items-center group">
                                                            <div className="flex items-center">
                                                                {isExpanded ? <ChevronDown className="w-4 h-4 mr-2 text-vjtech-accent" /> : <ChevronRight className="w-4 h-4 mr-2 text-slate-400" />}
                                                                {yr}
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    router.push(`/explorer?createdAfter=${yr}-01-01T00:00:00.000Z&createdBefore=${yr}-12-31T23:59:59.999Z`);
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-vjtech-accent/10 rounded-md text-vjtech-accent transition-all"
                                                                title={`Explore all ${yr} deals`}
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                        <td className="py-4 px-4 text-center font-medium text-slate-600">{s.createdCount.toLocaleString()}</td>
                                                        <td className="py-4 px-4 text-center font-bold text-emerald-600">{s.wonCount.toLocaleString()}</td>
                                                        <td className="py-4 px-4 text-center font-bold text-rose-600">{s.lostCount.toLocaleString()}</td>
                                                        <td className="py-4 px-4 text-center font-black text-vjtech-accent bg-vjtech-accent/5">{winRatio.toFixed(1)}%</td>
                                                        <td className="py-4 px-4 text-right text-slate-600 font-medium tracking-tight">{formatCurrency(s.createdValue)}</td>
                                                        <td className="py-4 px-4 text-right font-bold text-emerald-600 tracking-tight">{formatCurrency(s.wonValue)}</td>
                                                    </tr>
                                                    {isExpanded && sortedCountries.map(([country, stats], idx) => {
                                                        const cWinRatio = stats.wonCount + stats.lostCount > 0 ? (stats.wonCount / (stats.wonCount + stats.lostCount)) * 100 : 0;
                                                        const cSharePct = s.createdCount > 0 ? (stats.createdCount / s.createdCount) * 100 : 0;
                                                        return (
                                                            <tr key={`${yr}-${country}`} className="bg-slate-50/50 border-b border-slate-100 hover:bg-slate-100/50 transition-colors">
                                                                <td className="py-2.5 px-4 pl-12 font-semibold text-slate-700 border-r border-slate-100 text-sm flex items-center">
                                                                    <span className="text-slate-400 font-normal text-xs w-5 inline-block text-right mr-3">{idx + 1}.</span>
                                                                    {country}
                                                                </td>
                                                                <td className="py-2.5 px-4 text-center font-medium text-slate-500 text-sm">
                                                                    {stats.createdCount.toLocaleString()}
                                                                    <span className="text-[10px] text-slate-400 ml-1.5 font-bold" title="% of Year's Total Created Volume">({cSharePct.toFixed(1)}%)</span>
                                                                </td>
                                                                <td className="py-2.5 px-4 text-center font-semibold text-emerald-600/80 text-sm">{stats.wonCount.toLocaleString()}</td>
                                                                <td className="py-2.5 px-4 text-center font-semibold text-rose-600/80 text-sm">{stats.lostCount.toLocaleString()}</td>
                                                                <td className="py-2.5 px-4 text-center font-bold text-vjtech-accent/80 bg-vjtech-accent/5 text-sm">{cWinRatio.toFixed(1)}%</td>
                                                                <td className="py-2.5 px-4 text-right text-slate-500 font-medium tracking-tight text-sm">{formatCurrency(stats.createdValue)}</td>
                                                                <td className="py-2.5 px-4 text-right font-semibold text-emerald-600/80 tracking-tight text-sm">{formatCurrency(stats.wonValue)}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* New Customer Account Creation Section */}
                {sortedAccountYears.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                        {/* New Accounts Table */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm lg:col-span-2">
                            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center">
                                <Users className="w-5 h-5 mr-3 text-vjtech-accent" /> New Customer Account Creations
                            </h3>
                            <p className="text-sm text-slate-500 mb-6 w-3/4">
                                Analyzes your entire dataset to find the exact earliest created opportunity date for every unique Account Name. This represents deterministic growth of your explicit customer base.
                            </p>

                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-[#1E293B] text-slate-300 text-xs font-bold uppercase tracking-wider">
                                        <tr>
                                            <th className="py-4 px-4 border-r border-slate-700 w-1/3 whitespace-nowrap">Acquisition Year</th>
                                            <th className="py-4 px-4 text-center">New Accounts Created</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedAccountYears.map(yr => {
                                            const s = newAccountsByYear.get(yr)!;
                                            const isExpanded = expandedAccountYear === yr;
                                            const sortedCountries = Array.from(s.countries.entries()).sort((a, b) => b[1] - a[1]);

                                            return (
                                                <Fragment key={`acc-${yr}`}>
                                                    <tr
                                                        className={`border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`}
                                                        onClick={() => setExpandedAccountYear(expandedAccountYear === yr ? null : yr)}
                                                        title={`Click to view country breakdown for ${yr}`}
                                                    >
                                                        <td className="py-4 px-4 font-black text-slate-800 border-r border-slate-100 text-base flex items-center group">
                                                            {isExpanded ? <ChevronDown className="w-4 h-4 mr-2 text-vjtech-accent" /> : <ChevronRight className="w-4 h-4 mr-2 text-slate-400" />}
                                                            {yr}
                                                        </td>
                                                        <td className="py-4 px-4 text-center font-bold text-emerald-600 text-lg">{s.totalAccounts.toLocaleString()}</td>
                                                    </tr>
                                                    {isExpanded && sortedCountries.map(([country, count], idx) => {
                                                        const pShare = s.totalAccounts > 0 ? (count / s.totalAccounts) * 100 : 0;
                                                        return (
                                                            <tr key={`acc-${yr}-${country}`} className="bg-slate-50/50 border-b border-slate-100 hover:bg-slate-100/50 transition-colors">
                                                                <td className="py-2.5 px-4 pl-12 font-semibold text-slate-700 border-r border-slate-100 text-sm flex items-center">
                                                                    <span className="text-slate-400 font-normal text-xs w-5 inline-block text-right mr-3">{idx + 1}.</span>
                                                                    {country}
                                                                </td>
                                                                <td className="py-2.5 px-4 text-center font-medium text-slate-700 text-sm">
                                                                    {count.toLocaleString()}
                                                                    <span className="text-[10px] text-slate-400 ml-2 font-bold" title="% of Year's Total Created Accounts">({pShare.toFixed(1)}%)</span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Top Growth Countries Bar Chart */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm lg:col-span-1 flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-md font-bold text-slate-800">Top Growth Countries</h3>
                                <select
                                    value={chartYear || ''}
                                    onChange={(e) => setChartYear(parseInt(e.target.value))}
                                    className="text-xs bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2 text-slate-600 font-bold cursor-pointer focus:outline-none focus:ring-1 focus:ring-vjtech-accent"
                                >
                                    {sortedAccountYears.map(yr => (
                                        <option key={yr} value={yr}>{yr}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex-1 w-full min-h-[300px]">
                                {topChartCountries.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={topChartCountries} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                                            <XAxis type="number" stroke="#94A3B8" fontSize={12} allowDecimals={false} />
                                            <YAxis type="category" dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} width={80} />
                                            <Tooltip
                                                cursor={{ fill: '#F1F5F9' }}
                                                formatter={(val: number) => [`${val} Accounts`, "New Acquired"]}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar dataKey="accounts" fill="#10B981" radius={[0, 4, 4, 0]} barSize={24}>
                                                <LabelList dataKey="accounts" position="right" fill="#64748B" fontSize={11} fontWeight="bold" />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-sm text-slate-400 italic">No data available for this year.</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
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
