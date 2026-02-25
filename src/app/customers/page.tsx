"use client";

import { useDashboard } from "@/components/DashboardProvider";
import { TopBar } from "@/components/TopBar";
import { UploadZone } from "@/components/UploadZone";
import { ArrowUpDown, Users, Search, PlayCircle } from "lucide-react";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

export default function CustomerExplorerPage() {
    const router = useRouter();
    const { isLoaded, opportunities } = useDashboard();
    const [searchTerm, setSearchTerm] = useState("");

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'openVal', direction: 'desc' });

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
    };

    // Calculate Customer Aggregations
    const customerStats = useMemo(() => {
        const statsMap = new Map<string, {
            accountName: string;
            country: string;
            totalOpps: number;
            openCount: number;
            openVal: number;
            wonCount: number;
            wonVal: number;
            lostCount: number;
            lostVal: number;
            dormantCount: number;
            dormantVal: number;
            lastActivity: Date | null;
            firstOppDate: Date | null;
        }>();

        for (const o of opportunities) {
            if (!o.accountName) continue;

            const accName = o.accountName;
            if (!statsMap.has(accName)) {
                statsMap.set(accName, {
                    accountName: accName,
                    country: o.country || 'Unknown',
                    totalOpps: 0, openCount: 0, openVal: 0,
                    wonCount: 0, wonVal: 0, lostCount: 0, lostVal: 0,
                    dormantCount: 0, dormantVal: 0,
                    lastActivity: null,
                    firstOppDate: null
                });
            }

            const s = statsMap.get(accName)!;
            s.totalOpps++;

            // Track First/Last Opp Dates contextually
            const dateObj = new Date(o.createdOn);
            if (!s.firstOppDate || dateObj < s.firstOppDate) s.firstOppDate = dateObj;
            if (!s.lastActivity || dateObj > s.lastActivity) s.lastActivity = dateObj;

            if (o.isOpen) {
                s.openCount++;
                s.openVal += o.valueGbp;
            } else if (o.status === 'Won') {
                s.wonCount++;
                s.wonVal += o.valueGbp;
            } else if (o.status === 'Lost') {
                s.lostCount++;
                s.lostVal += o.valueGbp;
            } else if (o.status === 'Dormant') {
                s.dormantCount++;
                s.dormantVal += o.valueGbp;
            }
        }
        return Array.from(statsMap.values());
    }, [opportunities]);

    // Handle Search Filter
    const filteredStats = useMemo(() => {
        if (!searchTerm) return customerStats;
        const lowerSearch = searchTerm.toLowerCase();
        return customerStats.filter(c =>
            c.accountName.toLowerCase().includes(lowerSearch) ||
            c.country.toLowerCase().includes(lowerSearch)
        );
    }, [customerStats, searchTerm]);

    // Handle Sorting
    const sortedStats = useMemo(() => {
        const sortableItems = [...filteredStats];
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
    }, [filteredStats, sortConfig]);

    if (!isLoaded || !opportunities) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC]">
                <TopBar title="Customer Explorer" />
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

    return (
        <div className="flex-1 flex flex-col bg-[#F8FAFC] min-h-screen">
            <TopBar title="Customer Explorer" />

            <div className="p-8 space-y-6 max-w-[1400px] w-full mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm gap-4">
                    <div>
                        <h2 className="text-xl font-bold flex items-center text-slate-800">
                            <Users className="w-6 h-6 mr-3 text-vjtech-accent" /> Customer Knowledge Base
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">Aggregated historical pipeline metrics explicitly linked to customer accounts.</p>
                    </div>

                    <div className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search Account Name or Country..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-vjtech-accent/50 focus:border-vjtech-accent transition-all"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto max-h-[70vh]">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[#1E293B] text-slate-300 text-xs font-bold uppercase tracking-wider sticky top-0 z-10">
                                <tr>
                                    <th className="py-4 px-4 border-b border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleSort('accountName')}>
                                        <div className="flex items-center">Account Name <ArrowUpDown className="w-3 h-3 ml-2 text-slate-500" /></div>
                                    </th>
                                    <th className="py-4 px-4 border-b border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleSort('country')}>
                                        <div className="flex items-center">Country <ArrowUpDown className="w-3 h-3 ml-2 text-slate-500" /></div>
                                    </th>
                                    <th className="py-4 px-4 border-b border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors text-center" onClick={() => handleSort('totalOpps')}>
                                        <div className="flex items-center justify-center">Total Opps <ArrowUpDown className="w-3 h-3 ml-2 text-slate-500" /></div>
                                    </th>
                                    <th className="py-4 px-4 border-b border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors text-right" onClick={() => handleSort('openVal')}>
                                        <div className="flex items-center justify-end">Open Pipeline <ArrowUpDown className="w-3 h-3 ml-2 text-slate-500" /></div>
                                    </th>
                                    <th className="py-4 px-4 border-b border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors text-right" onClick={() => handleSort('wonVal')}>
                                        <div className="flex items-center justify-end">Won Velocity <ArrowUpDown className="w-3 h-3 ml-2 text-slate-500" /></div>
                                    </th>
                                    <th className="py-4 px-4 border-b border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors text-right" onClick={() => handleSort('lostVal')}>
                                        <div className="flex items-center justify-end">Lost Volume <ArrowUpDown className="w-3 h-3 ml-2 text-slate-500" /></div>
                                    </th>
                                    <th className="py-4 px-4 border-b border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors text-right" onClick={() => handleSort('dormantVal')}>
                                        <div className="flex items-center justify-end text-amber-500">Dormant Value <ArrowUpDown className="w-3 h-3 ml-2 text-slate-500" /></div>
                                    </th>
                                    <th className="py-4 px-4 border-b border-slate-700"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sortedStats.map((s, idx) => (
                                    <tr key={`${s.accountName}-${idx}`} className="hover:bg-slate-50 transition-colors group">
                                        <td className="py-3 px-4 font-bold text-slate-800">{s.accountName}</td>
                                        <td className="py-3 px-4 text-slate-500 font-medium">{s.country}</td>
                                        <td className="py-3 px-4 text-center text-slate-700 font-bold">{s.totalOpps}</td>

                                        <td className="py-3 px-4 text-right">
                                            <div className="font-bold text-vjtech-primary">{formatCurrency(s.openVal)}</div>
                                            <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">{s.openCount} Open</div>
                                        </td>

                                        <td className="py-3 px-4 text-right">
                                            <div className="font-bold text-emerald-600">{formatCurrency(s.wonVal)}</div>
                                            <div className="text-[10px] text-emerald-600/60 font-medium uppercase mt-0.5">{s.wonCount} Won</div>
                                        </td>

                                        <td className="py-3 px-4 text-right">
                                            <div className="font-bold text-rose-600">{formatCurrency(s.lostVal)}</div>
                                            <div className="text-[10px] text-rose-600/60 font-medium uppercase mt-0.5">{s.lostCount} Lost</div>
                                        </td>

                                        <td className="py-3 px-4 text-right bg-amber-50/30">
                                            <div className="font-bold text-amber-600">{formatCurrency(s.dormantVal)}</div>
                                            <div className="text-[10px] text-amber-600/60 font-medium uppercase mt-0.5">{s.dormantCount} Dormant</div>
                                        </td>

                                        <td className="py-3 px-4 text-right">
                                            <button
                                                onClick={() => router.push(`/explorer?search=${encodeURIComponent(s.accountName)}`)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-vjtech-accent hover:bg-vjtech-accent/10 rounded-lg flex items-center justify-center"
                                                title={`Explore all opportunities for ${s.accountName}`}
                                            >
                                                <PlayCircle className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {sortedStats.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-slate-400 italic">No customers found matching the search criteria.</td>
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
