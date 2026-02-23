"use client";

import { useDashboard } from "@/components/DashboardProvider";
import { Filter, Calendar, Info, X } from "lucide-react";
import { format } from "date-fns";
import { useState, useMemo } from "react";

interface TopBarProps {
    title: string;
}

export function TopBar({ title }: TopBarProps) {
    const { isLoaded, currentSnapshot, filters, setFilter, clearFilters, opportunities } = useDashboard();
    const today = format(new Date(), "MMM dd, yyyy");
    const [showFilters, setShowFilters] = useState(false);

    const mostRecentDate = useMemo(() => {
        if (!opportunities || opportunities.length === 0) return null;
        let max = 0;
        for (const o of opportunities) {
            const t = new Date(o.createdOn).getTime();
            if (t > max) max = t;
        }
        return new Date(max);
    }, [opportunities]);

    const handleQuickDateSelect = (days: number | null) => {
        if (days === null) {
            setFilter('createdAfter', null);
            setFilter('createdBefore', null);
        } else {
            const date = new Date();
            date.setDate(date.getDate() - days);
            setFilter('createdAfter', format(date, 'yyyy-MM-dd'));
            setFilter('createdBefore', null);
        }
    };

    const hasActiveFilters = filters.minProbability > 0 || filters.createdAfter || filters.createdBefore || filters.region || filters.customerClass || filters.ageStatus;

    return (
        <>
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
                    {isLoaded && currentSnapshot && (
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="flex items-center text-slate-500 text-xs font-medium bg-slate-100 px-2.5 py-1 rounded-lg">
                                <Calendar className="w-3 h-3 mr-1" /> {today}
                            </span>
                            <span className="flex items-center text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 text-xs font-medium focus:outline-none">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                                Live Pipeline Active
                            </span>
                            {mostRecentDate && (
                                <span className="flex items-center text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-medium" title="Date of the most recently created opportunity in the dataset">
                                    Latest Update: <span className="font-bold ml-1 text-slate-700">{format(mostRecentDate, 'MMM d, yyyy')}</span>
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {isLoaded && (
                    <div className="flex items-center space-x-4 relative">
                        <button
                            onClick={clearFilters}
                            className="text-xs text-slate-400 font-semibold hover:text-slate-700 transition-colors uppercase tracking-wider"
                        >
                            Clear Filters
                        </button>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center space-x-2 border font-medium px-4 py-2 rounded-xl text-sm transition-all shadow-sm ${showFilters ? 'bg-vjtech-accent/10 border-vjtech-accent/50 text-vjtech-accent' : 'bg-white border-slate-200 hover:border-vjtech-accent/50 hover:bg-slate-50 text-slate-700'}`}>
                            <Filter className={`w-4 h-4 ${showFilters ? 'text-vjtech-accent' : 'text-slate-400'}`} />
                            <span>Filters</span>
                            {hasActiveFilters && (
                                <span className="ml-1 bg-vjtech-accent text-white w-2 h-2 rounded-full absolute -top-1 -right-1 ring-2 ring-white"></span>
                            )}
                        </button>

                        {showFilters && (
                            <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-5 z-50 max-h-[80vh] overflow-y-auto">
                                <div className="flex items-center justify-between mb-4 sticky top-0 bg-white z-10 py-1">
                                    <h3 className="font-bold text-slate-800">Pipeline Filters</h3>
                                    <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Ageing Status</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-vjtech-accent focus:border-vjtech-accent block p-2.5 outline-none"
                                            value={filters.ageStatus || ""}
                                            onChange={(e) => setFilter('ageStatus', e.target.value || null)}
                                        >
                                            <option value="">All Opportunities</option>
                                            <option value="fresh">Fresh (&le; 90 Days)</option>
                                            <option value="ageing">Ageing (91 - 180 Days)</option>
                                            <option value="stale">Stale (&gt; 180 Days)</option>
                                            <option value="severe">Severely Stale (&gt; 365 Days)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Probability Logic</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-vjtech-accent focus:border-vjtech-accent block p-2.5 outline-none"
                                            value={filters.mode}
                                            onChange={(e) => setFilter('mode', e.target.value)}
                                        >
                                            <option value="stage">Stage Defined %</option>
                                            <option value="user">User Defined %</option>
                                            <option value="blended">Blended Average %</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Quick Date Select</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-vjtech-accent focus:border-vjtech-accent block p-2.5 outline-none mb-4"
                                            onChange={(e) => handleQuickDateSelect(e.target.value === "custom" ? null : parseInt(e.target.value))}
                                            defaultValue="custom"
                                        >
                                            <option value="custom">Custom Range...</option>
                                            <option value="7">Last 7 Days</option>
                                            <option value="30">Last 30 Days</option>
                                            <option value="90">Last 90 Days</option>
                                            <option value="365">Last 365 Days</option>
                                        </select>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Created After</label>
                                                <input
                                                    type="date"
                                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-vjtech-accent focus:border-vjtech-accent block p-2.5 outline-none"
                                                    value={filters.createdAfter || ""}
                                                    onChange={(e) => setFilter('createdAfter', e.target.value || null)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Created Before</label>
                                                <input
                                                    type="date"
                                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-vjtech-accent focus:border-vjtech-accent block p-2.5 outline-none"
                                                    value={filters.createdBefore || ""}
                                                    onChange={(e) => setFilter('createdBefore', e.target.value || null)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Min Probability</label>
                                            <span className="text-vjtech-accent font-bold text-sm">{(filters.minProbability * 100).toFixed(0)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0" max="1" step="0.05"
                                            value={filters.minProbability}
                                            onChange={(e) => setFilter('minProbability', parseFloat(e.target.value))}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-vjtech-accent"
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
                                            <span>0%</span>
                                            <span>50%</span>
                                            <span>100%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </header>

            {hasActiveFilters && (
                <div className="bg-white border-b border-slate-200 px-8 py-2.5 flex items-center gap-3 w-full relative z-40 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center shrink-0">
                        <Filter className="w-3 h-3 mr-1" /> Active Filters:
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                        {filters.minProbability > 0 && (
                            <span className="flex items-center text-vjtech-accent bg-vjtech-accent/5 border border-vjtech-accent/20 px-2.5 py-1 rounded-lg text-xs font-bold">
                                Prob &ge; {filters.minProbability * 100}%
                            </span>
                        )}
                        {filters.createdAfter && (
                            <span className="flex items-center text-vjtech-accent bg-vjtech-accent/5 border border-vjtech-accent/20 px-2.5 py-1 rounded-lg text-xs font-bold">
                                After: {format(new Date(filters.createdAfter), 'MMM d, yyyy')}
                            </span>
                        )}
                        {filters.createdBefore && (
                            <span className="flex items-center text-vjtech-accent bg-vjtech-accent/5 border border-vjtech-accent/20 px-2.5 py-1 rounded-lg text-xs font-bold">
                                Before: {format(new Date(filters.createdBefore), 'MMM d, yyyy')}
                            </span>
                        )}
                        {filters.region && (
                            <span className="flex items-center text-vjtech-accent bg-vjtech-accent/5 border border-vjtech-accent/20 px-2.5 py-1 rounded-lg text-xs font-bold">
                                Region: {filters.region}
                            </span>
                        )}
                        {filters.customerClass && (
                            <span className="flex items-center text-vjtech-accent bg-vjtech-accent/5 border border-vjtech-accent/20 px-2.5 py-1 rounded-lg text-xs font-bold">
                                Class: {filters.customerClass}
                            </span>
                        )}
                        {filters.ageStatus && (
                            <span className="flex items-center text-vjtech-accent bg-vjtech-accent/5 border border-vjtech-accent/20 px-2.5 py-1 rounded-lg text-xs font-bold">
                                Age: {filters.ageStatus.toUpperCase()}
                            </span>
                        )}
                        <button onClick={clearFilters} className="text-[10px] ml-2 font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider underline underline-offset-2">
                            Clear All
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
