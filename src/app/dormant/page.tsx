"use client";

import { useDashboard } from "@/components/DashboardProvider";
import { TopBar } from "@/components/TopBar";
import { UploadZone } from "@/components/UploadZone";
import { ArrowUpDown, PauseCircle, Search } from "lucide-react";
import React, { useState, useMemo } from "react";

export default function DormantEnquiriesPage() {
    const { isLoaded, opportunities } = useDashboard();
    const [searchTerm, setSearchTerm] = useState("");

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'valueGbp', direction: 'desc' });

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
    };

    // Filter to Dormant only
    const dormantOpps = useMemo(() => {
        return (opportunities || []).filter(o => o.isDormant);
    }, [opportunities]);

    // Handle Search Filter
    const filteredOpps = useMemo(() => {
        if (!searchTerm) return dormantOpps;
        const lowerSearch = searchTerm.toLowerCase();
        return dormantOpps.filter(o =>
            (o.accountName || '').toLowerCase().includes(lowerSearch) ||
            (o.country || '').toLowerCase().includes(lowerSearch) ||
            (o.description || '').toLowerCase().includes(lowerSearch)
        );
    }, [dormantOpps, searchTerm]);

    // Handle Sorting
    const sortedOpps = useMemo(() => {
        const sortableItems = [...filteredOpps];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sortableItems.sort((a: Record<string, any>, b: Record<string, any>) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
        return sortableItems;
    }, [filteredOpps, sortConfig]);

    if (!isLoaded || !opportunities) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC]">
                <TopBar title="Dormant Enquiries" />
                <div className="flex-1 flex items-center justify-center w-full">
                    <UploadZone />
                </div>
            </div>
        );
    }

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const totalDormantValue = dormantOpps.reduce((sum, o) => sum + o.valueGbp, 0);

    return (
        <div className="flex-1 flex flex-col bg-[#F8FAFC] min-h-screen">
            <TopBar title="Dormant Enquiries" />

            <div className="p-8 space-y-6 max-w-[1400px] w-full mx-auto">
                {/* KPI Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center col-span-1">
                        <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mr-4">
                            <PauseCircle className="w-7 h-7 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Dormant Value</p>
                            <h3 className="text-3xl font-black text-slate-800 tracking-tight">{formatCurrency(totalDormantValue)}</h3>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center col-span-2">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
                            <div>
                                <h2 className="text-xl font-bold flex items-center text-slate-800">
                                    Enquiries &quot;On Hold&quot;
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">Opportunities marked as Lost with the reason &quot;On Hold&quot;. These are excluded from win/loss pipeline metrics but tracked here for periodic re-engagement.</p>
                            </div>

                            <div className="relative w-full md:w-72">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto max-h-[65vh]">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[#1E293B] text-slate-300 text-xs font-bold uppercase tracking-wider sticky top-0 z-10">
                                <tr>
                                    <th className="py-4 px-4 border-b border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleSort('accountName')}>
                                        <div className="flex items-center">Account Name <ArrowUpDown className="w-3 h-3 ml-2 text-slate-500" /></div>
                                    </th>
                                    <th className="py-4 px-4 border-b border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleSort('description')}>
                                        <div className="flex items-center">Description <ArrowUpDown className="w-3 h-3 ml-2 text-slate-500" /></div>
                                    </th>
                                    <th className="py-4 px-4 border-b border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleSort('country')}>
                                        <div className="flex items-center">Country <ArrowUpDown className="w-3 h-3 ml-2 text-slate-500" /></div>
                                    </th>
                                    <th className="py-4 px-4 border-b border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleSort('owner')}>
                                        <div className="flex items-center">Owner <ArrowUpDown className="w-3 h-3 ml-2 text-slate-500" /></div>
                                    </th>
                                    <th className="py-4 px-4 border-b border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors text-right" onClick={() => handleSort('createdOn')}>
                                        <div className="flex items-center justify-end">Created On <ArrowUpDown className="w-3 h-3 ml-2 text-slate-500" /></div>
                                    </th>
                                    <th className="py-4 px-4 border-b border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors text-right" onClick={() => handleSort('valueGbp')}>
                                        <div className="flex items-center justify-end">Value (GBP) <ArrowUpDown className="w-3 h-3 ml-2 text-slate-500" /></div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sortedOpps.map((o) => (
                                    <tr key={o.id} className="hover:bg-amber-50/30 transition-colors">
                                        <td className="py-3 px-4 font-bold text-slate-800">{o.accountName}</td>
                                        <td className="py-3 px-4 text-slate-600 max-w-[250px] truncate" title={o.description}>{o.description}</td>
                                        <td className="py-3 px-4 text-slate-500 font-medium">{o.country}</td>
                                        <td className="py-3 px-4 text-slate-500"><span className="bg-slate-100 px-2 py-0.5 rounded text-xs">{o.owner}</span></td>
                                        <td className="py-3 px-4 text-right text-slate-500">{new Date(o.createdOn).toLocaleDateString()}</td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="font-bold text-amber-600">{formatCurrency(o.valueGbp)}</div>
                                            {o.nativeCurrency !== 'GBP' && (
                                                <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                                    {new Intl.NumberFormat('en-GB', { style: 'currency', currency: o.nativeCurrency, maximumFractionDigits: 0 }).format(o.nativeTotal)}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {sortedOpps.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-400 italic">No dormant enquiries found.</td>
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
