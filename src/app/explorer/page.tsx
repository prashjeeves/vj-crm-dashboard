"use client";

import { useDashboard } from "@/components/DashboardProvider";
import { TopBar } from "@/components/TopBar";
import { UploadZone } from "@/components/UploadZone";
import { filterOpportunities } from "@/lib/aggregations";
import { Search, ArrowUpDown, XCircle } from "lucide-react";
import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type SortField = 'value' | 'age' | 'stageProb' | 'userProb' | 'name';

function ExplorerContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isLoaded, opportunities, filters, setFilter } = useDashboard();

    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState<SortField>('value');
    const [sortDesc, setSortDesc] = useState(true);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(val);
    };

    const regionParam = searchParams.get('region');
    const closeMonthParam = searchParams.get('closeMonth');

    useEffect(() => {
        if (regionParam && filters.region !== regionParam) {
            setFilter('region', regionParam);
        }
        if (closeMonthParam && filters.closeMonth !== closeMonthParam) {
            setFilter('closeMonth', closeMonthParam);
        }
    }, [regionParam, closeMonthParam, filters.region, filters.closeMonth, setFilter]);

    const activeOpps = useMemo(() => isLoaded ? filterOpportunities(opportunities, filters) : [], [isLoaded, opportunities, filters]);

    // Filter by search term & Sort
    const displayedOpps = useMemo(() => {
        let filtered = activeOpps;

        if (searchTerm.trim()) {
            const lowerQuery = searchTerm.toLowerCase();
            filtered = filtered.filter(o =>
                o.accountName.toLowerCase().includes(lowerQuery) ||
                o.country.toLowerCase().includes(lowerQuery) ||
                o.owner.toLowerCase().includes(lowerQuery) ||
                (o.description && o.description.toLowerCase().includes(lowerQuery))
            );
        }

        return filtered.sort((a, b) => {
            let result = 0;
            switch (sortField) {
                case 'value': result = a.valueGbp - b.valueGbp; break;
                case 'age': result = a.ageDays - b.ageDays; break;
                case 'stageProb': result = (a.stageProbability ?? 0) - (b.stageProbability ?? 0); break;
                case 'userProb': result = (a.userProbability ?? 0) - (b.userProbability ?? 0); break;
                case 'name': result = a.accountName.localeCompare(b.accountName); break;
            }
            return sortDesc ? -result : result;
        });
    }, [activeOpps, searchTerm, sortField, sortDesc]);

    if (!isLoaded) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC]">
                <TopBar title="Opportunity Explorer" />
                <div className="flex-1 flex items-center justify-center w-full">
                    <UploadZone />
                </div>
            </div>
        );
    }


    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDesc(!sortDesc);
        } else {
            setSortField(field);
            setSortDesc(true);
        }
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        return <ArrowUpDown className={`w-3 h-3 inline-block ml-1 transition-colors ${sortField === field ? 'text-vjtech-accent' : 'text-slate-300 group-hover:text-slate-500'}`} />;
    };

    return (
        <div className="flex-1 flex flex-col bg-[#F8FAFC] min-h-screen">
            <TopBar title="Opportunity Explorer" />

            <div className="p-8 space-y-6 max-w-[1600px] w-full mx-auto flex-1 flex flex-col">

                {/* Controls Row */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex-1 max-w-md relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by Account, Owner, Country, or Description..."
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-vjtech-accent/20 focus:border-vjtech-accent outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        {filters.region && (
                            <div className="flex items-center space-x-2 bg-vjtech-accent/10 text-vjtech-accent px-4 py-2 rounded-xl text-sm font-semibold">
                                <span>Filtering exactly Region: {filters.region}</span>
                                <button
                                    onClick={() => {
                                        setFilter('region', null);
                                        const newParams = new URLSearchParams(searchParams.toString());
                                        newParams.delete('region');
                                        router.push(`/explorer?${newParams.toString()}`);
                                    }}
                                    className="text-vjtech-accent/60 hover:text-vjtech-accent p-1"
                                    title="Clear Region Filter"
                                >
                                    <XCircle className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {filters.closeMonth && (
                            <div className="flex items-center space-x-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-semibold">
                                <span>Closing in: {filters.closeMonth}</span>
                                <button
                                    onClick={() => {
                                        setFilter('closeMonth', null);
                                        const newParams = new URLSearchParams(searchParams.toString());
                                        newParams.delete('closeMonth');
                                        router.push(`/explorer?${newParams.toString()}`);
                                    }}
                                    className="text-indigo-400 hover:text-indigo-600 p-1"
                                    title="Clear Month Filter"
                                >
                                    <XCircle className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="text-sm font-medium text-slate-500">
                        Viewing <span className="font-bold text-slate-900">{displayedOpps.length}</span> Opportunities
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm flex-1 overflow-hidden flex flex-col">
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-sm text-left border-separate border-spacing-0">
                            <thead className="bg-[#1E293B] text-slate-300 sticky top-0 z-10">
                                <tr>
                                    <th className="py-4 px-6 font-semibold cursor-pointer group hover:text-white transition-colors w-1/3" onClick={() => handleSort('name')}>
                                        Account Name <SortIcon field="name" />
                                    </th>
                                    <th className="py-4 px-4 font-semibold">Location</th>
                                    <th className="py-4 px-4 font-semibold">Owner</th>
                                    <th className="py-4 px-4 font-semibold text-center cursor-pointer group hover:text-white transition-colors" onClick={() => handleSort('stageProb')}>
                                        Stage % <SortIcon field="stageProb" />
                                    </th>
                                    <th className="py-4 px-4 font-semibold text-center cursor-pointer group hover:text-white transition-colors" onClick={() => handleSort('userProb')}>
                                        User % <SortIcon field="userProb" />
                                    </th>
                                    <th className="py-4 px-4 font-semibold text-right cursor-pointer group hover:text-white transition-colors" onClick={() => handleSort('age')}>
                                        Age <SortIcon field="age" />
                                    </th>
                                    <th className="py-4 px-6 font-bold text-white text-right cursor-pointer group" onClick={() => handleSort('value')}>
                                        Value (GBP) <SortIcon field="value" />
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedOpps.map((opp) => (
                                    <tr key={opp.id} className="hover:bg-vjtech-accent/5 transition-colors border-b border-slate-100 last:border-0">
                                        <td className="py-4 px-6 border-b border-slate-100 align-top">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">{opp.accountName}</span>
                                                {opp.description && (
                                                    <span className="text-xs text-slate-500 mt-1 line-clamp-3">
                                                        {opp.description}
                                                    </span>
                                                )}
                                                <div className="flex gap-2 mt-2">
                                                    <span className="text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                                                        {opp.status}
                                                    </span>
                                                    {opp.customerClass && (
                                                        <span className="text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                                                            {opp.customerClass}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 border-b border-slate-100 align-top">
                                            <div className="font-medium text-slate-800">{opp.country}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">{opp.salesRegion}</div>
                                        </td>
                                        <td className="py-4 px-4 border-b border-slate-100 text-slate-700 align-top font-medium">
                                            {opp.owner}
                                        </td>
                                        <td className="py-4 px-4 border-b border-slate-100 text-center align-top">
                                            <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs font-semibold border border-slate-200 inline-block w-12 text-center">
                                                {(opp.stageProbability ?? 0) * 100}%
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 border-b border-slate-100 text-center align-top">
                                            <span className="bg-vjtech-accent/10 text-vjtech-accent px-2 py-1 rounded-md text-xs font-semibold border border-vjtech-accent/20 inline-block w-12 text-center">
                                                {(opp.userProbability ?? 0) * 100}%
                                            </span>
                                        </td>
                                        <td className={`py-4 px-4 border-b border-slate-100 text-right align-top ${opp.ageDays > 180 ? 'text-amber-600 font-bold' : 'text-slate-600 font-medium'}`}>
                                            {opp.ageDays}d
                                        </td>
                                        <td className="py-4 px-6 border-b border-slate-100 text-right font-black text-slate-900 align-top">
                                            <div className="text-base">{formatCurrency(opp.valueGbp)}</div>
                                            {opp.nativeCurrency !== 'GBP' && (
                                                <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">
                                                    {opp.nativeCurrency} {new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(opp.nativeTotal)}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {displayedOpps.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-500 text-base">
                                            No opportunities found matching your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default function ExplorerPage() {
    return (
        <Suspense fallback={<div className="flex-1 flex items-center justify-center p-8 text-slate-500">Loading Explorer...</div>}>
            <ExplorerContent />
        </Suspense>
    );
}
