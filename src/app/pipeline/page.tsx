"use client";

import { useDashboard } from "@/components/DashboardProvider";
import { TopBar } from "@/components/TopBar";
import { UploadZone } from "@/components/UploadZone";
import { filterOpportunities } from "@/lib/aggregations";
import { AgeBand } from "@/lib/types";
import { Clock, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";

const AGE_BANDS: AgeBand[] = ['0-30', '31-60', '61-90', '91-180', '181-270', '271-365', '365+'];

export default function PipelineAnalyticsPage() {
    const router = useRouter();
    const { isLoaded, opportunities, filters } = useDashboard();

    if (!isLoaded) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC]">
                <TopBar title="Pipeline Analytics" />
                <div className="flex-1 flex items-center justify-center w-full">
                    <UploadZone />
                </div>
            </div>
        );
    }

    const activeOpps = filterOpportunities(opportunities, filters);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(val);
    };

    // Build Ageing Matrix
    const RegionRows = new Map<string, Record<AgeBand, number>>();
    const RegionCounts = new Map<string, number>();
    const totalByBand: Record<AgeBand, number> = { '0-30': 0, '31-60': 0, '61-90': 0, '91-180': 0, '181-270': 0, '271-365': 0, '365+': 0 };
    let grandTotalCount = 0;

    for (const o of activeOpps) {
        const region = o.salesRegion || "Unknown";
        if (!RegionRows.has(region)) {
            RegionRows.set(region, { '0-30': 0, '31-60': 0, '61-90': 0, '91-180': 0, '181-270': 0, '271-365': 0, '365+': 0 });
            RegionCounts.set(region, 0);
        }
        const row = RegionRows.get(region)!;

        // Fallback protection just in case band string logic breaks map
        if (row[o.ageBand] !== undefined) {
            row[o.ageBand] += o.valueGbp;
            totalByBand[o.ageBand] += o.valueGbp;
            RegionCounts.set(region, RegionCounts.get(region)! + 1);
            grandTotalCount++;
        }
    }

    const matrixRegions = Array.from(RegionRows.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    // Build 2026 Forecast Matrix
    const forecastMonths = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'];
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const ForecastRows = new Map<string, Record<string, number>>();
    const forecastTotalByCol: Record<string, number> = { 'Past': 0, ...Object.fromEntries(forecastMonths.map(m => [m, 0])), 'Future': 0 };

    for (const o of activeOpps) {
        const region = o.salesRegion || "Unknown";
        if (!ForecastRows.has(region)) {
            ForecastRows.set(region, { 'Past': 0, ...Object.fromEntries(forecastMonths.map(m => [m, 0])), 'Future': 0 });
        }
        const row = ForecastRows.get(region)!;

        const val = o.valueGbp;
        let col = 'Future';

        if (!o.estimatedCloseDate) {
            col = 'Past';
        } else {
            const estDate = new Date(o.estimatedCloseDate);
            if (isNaN(estDate.getTime())) {
                col = 'Past';
            } else {
                const yr = estDate.getFullYear();
                if (yr < 2026) col = 'Past';
                else if (yr === 2026) {
                    const mo = (estDate.getMonth() + 1).toString().padStart(2, '0');
                    const cm = `2026-${mo}`;
                    if (forecastMonths.includes(cm)) col = cm;
                } else {
                    col = 'Future';
                }
            }
        }

        row[col] += val;
        forecastTotalByCol[col] += val;
    }

    const forecastMatrixRegions = Array.from(ForecastRows.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    // Top Opps
    const topOpps = [...activeOpps].sort((a, b) => b.valueGbp - a.valueGbp).slice(0, 10);

    const maxMonthForecastValue = Math.max(
        1,
        ...forecastMatrixRegions.flatMap(([, map]) =>
            forecastMonths.map(m => map[m])
        )
    );

    const getHeatmapBg = (val: number) => {
        if (val === 0) return 'transparent';
        const ratio = Math.min(1, val / maxMonthForecastValue);
        const opacity = 0.05 + (ratio * 0.65);
        return `rgba(99, 102, 241, ${opacity})`;
    };

    return (
        <div className="flex-1 flex flex-col bg-[#F8FAFC] min-h-screen">
            <TopBar title="Pipeline Analytics" />

            <div className="p-8 space-y-8 max-w-[1600px] w-full mx-auto">

                {/* 2026 Forecast Matrix */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center">
                            <Clock className="w-5 h-5 mr-2 text-indigo-500" /> 2026 Regional Revenue Forecast (Based on Est. Close Date)
                        </h3>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[#1E293B] text-slate-300">
                                <tr>
                                    <th className="py-4 px-4 font-semibold min-w-[150px]">Region</th>
                                    <th className="py-4 px-2 font-semibold text-right text-rose-300">Past / Overdue</th>
                                    {monthLabels.map((lbl) => (
                                        <th key={lbl} className="py-4 px-2 font-semibold text-right">{lbl}</th>
                                    ))}
                                    <th className="py-4 px-2 font-semibold text-right text-emerald-300">2027+</th>
                                    <th className="py-4 px-4 font-bold text-white text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {forecastMatrixRegions.map(([region, map]) => {
                                    const regionTotal = map['Past'] + forecastMonths.reduce((sum, m) => sum + map[m], 0) + map['Future'];
                                    return (
                                        <tr key={region} className="border-b border-slate-100 hover:bg-indigo-50/50 transition-colors">
                                            <td className="py-3 px-4 font-medium text-slate-800 border-r border-slate-100">{region}</td>
                                            <td
                                                className={`py-3 px-2 text-right border-r border-slate-100/50 ${map['Past'] > 0 ? 'text-rose-600 font-bold bg-rose-50/30' : 'text-slate-300'}`}
                                            >
                                                {map['Past'] > 0 ? formatCurrency(map['Past']) : '-'}
                                            </td>
                                            {forecastMonths.map(m => (
                                                <td
                                                    key={m}
                                                    className={`py-3 px-2 text-right border-x border-white/50 transition-all ${map[m] > 0 ? 'text-slate-800 font-semibold drop-shadow-sm cursor-pointer hover:ring-2 hover:ring-vjtech-accent hover:ring-inset' : 'text-slate-400/50'}`}
                                                    style={{ backgroundColor: getHeatmapBg(map[m]) }}
                                                    onClick={() => {
                                                        if (map[m] > 0) {
                                                            router.push(`/explorer?region=${encodeURIComponent(region)}&closeMonth=${m}`);
                                                        }
                                                    }}
                                                    title={map[m] > 0 ? `Click to view ${region} deals closing in ${m}` : undefined}
                                                >
                                                    {map[m] > 0 ? formatCurrency(map[m]) : '-'}
                                                </td>
                                            ))}
                                            <td className={`py-3 px-2 text-right border-l border-slate-100/50 ${map['Future'] > 0 ? 'text-emerald-600 font-bold bg-emerald-50/30' : 'text-slate-300'}`}>
                                                {map['Future'] > 0 ? formatCurrency(map['Future']) : '-'}
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold text-slate-900 border-l border-slate-100 bg-slate-50/50">{formatCurrency(regionTotal)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                                <tr>
                                    <td className="py-4 px-4 font-bold text-slate-900 border-r border-slate-200">Grand Total</td>
                                    <td className="py-4 px-2 text-right font-bold text-rose-600 border-r border-slate-200">
                                        {forecastTotalByCol['Past'] > 0 ? formatCurrency(forecastTotalByCol['Past']) : '-'}
                                    </td>
                                    {forecastMonths.map(m => (
                                        <td
                                            key={m}
                                            className={`py-4 px-2 text-right font-semibold transition-all ${forecastTotalByCol[m] > 0 ? 'text-vjtech-accent cursor-pointer hover:ring-2 hover:ring-vjtech-accent hover:ring-inset bg-white' : 'text-slate-400/50'}`}
                                            onClick={() => {
                                                if (forecastTotalByCol[m] > 0) {
                                                    router.push(`/explorer?closeMonth=${m}`);
                                                }
                                            }}
                                            title={forecastTotalByCol[m] > 0 ? `Click to view all deals closing in ${m}` : undefined}
                                        >
                                            {forecastTotalByCol[m] > 0 ? formatCurrency(forecastTotalByCol[m]) : '-'}
                                        </td>
                                    ))}
                                    <td className="py-4 px-2 text-right font-bold text-emerald-600 border-l border-slate-200">
                                        {forecastTotalByCol['Future'] > 0 ? formatCurrency(forecastTotalByCol['Future']) : '-'}
                                    </td>
                                    <td className="py-4 px-4 text-right font-black text-slate-900 border-l border-slate-200">
                                        {formatCurrency(forecastTotalByCol['Past'] + forecastMonths.reduce((sum, m) => sum + forecastTotalByCol[m], 0) + forecastTotalByCol['Future'])}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Ageing Matrix */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm overflow-hidden mt-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center">
                            <Clock className="w-5 h-5 mr-2 text-vjtech-accent" /> Regional Ageing Matrix (GBP)
                        </h3>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[#1E293B] text-slate-300">
                                <tr>
                                    <th className="py-4 px-4 font-semibold w-1/5">Region</th>
                                    {AGE_BANDS.map(band => (
                                        <th key={band} className="py-4 px-2 font-semibold text-right whitespace-nowrap">{band} Days</th>
                                    ))}
                                    <th className="py-4 px-4 font-bold text-white text-right">Avg Deal Value</th>
                                    <th className="py-4 px-4 font-bold text-white text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {matrixRegions.map(([region, map]) => {
                                    const regionTotal = AGE_BANDS.reduce((sum, b) => sum + map[b], 0);
                                    const regionCount = RegionCounts.get(region) || 0;
                                    const avgVal = regionCount > 0 ? regionTotal / regionCount : 0;
                                    return (
                                        <tr key={region} className="border-b border-slate-100 hover:bg-vjtech-accent/5 transition-colors">
                                            <td className="py-3 px-4 font-medium text-slate-800 border-r border-slate-100">{region}</td>
                                            {AGE_BANDS.map(band => (
                                                <td key={band} className={`py-3 px-2 text-right ${map[band] > 0 ? 'text-slate-700' : 'text-slate-300'}`}>
                                                    {map[band] > 0 ? formatCurrency(map[band]) : '-'}
                                                </td>
                                            ))}
                                            <td className="py-3 px-4 text-right font-medium text-slate-500 border-l border-slate-100">
                                                {avgVal > 0 ? formatCurrency(avgVal) : '-'}
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold text-slate-900 border-l border-slate-100">{formatCurrency(regionTotal)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                                <tr>
                                    <td className="py-4 px-4 font-bold text-slate-900 border-r border-slate-200">Grand Total</td>
                                    {AGE_BANDS.map(band => (
                                        <td key={band} className="py-4 px-2 text-right font-semibold text-vjtech-accent">
                                            {totalByBand[band] > 0 ? formatCurrency(totalByBand[band]) : '-'}
                                        </td>
                                    ))}
                                    <td className="py-4 px-4 text-right font-bold text-slate-600 border-l border-slate-200">
                                        {grandTotalCount > 0 ? formatCurrency(AGE_BANDS.reduce((sum, b) => sum + totalByBand[b], 0) / grandTotalCount) : '-'}
                                    </td>
                                    <td className="py-4 px-4 text-right font-black text-slate-900 border-l border-slate-200">
                                        {formatCurrency(AGE_BANDS.reduce((sum, b) => sum + totalByBand[b], 0))}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Top 10 Opportunities Table */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                        <Trophy className="w-5 h-5 mr-2 text-amber-500" /> Top Active Opportunities
                    </h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-separate border-spacing-0">
                            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="py-3 px-4 rounded-tl-lg w-1/3">Opportunity</th>
                                    <th className="py-3 px-4">Country</th>
                                    <th className="py-3 px-4">Class</th>
                                    <th className="py-3 px-4">Owner</th>
                                    <th className="py-3 px-4 text-center">Stage %</th>
                                    <th className="py-3 px-4 text-center">User %</th>
                                    <th className="py-3 px-4 text-right">Age</th>
                                    <th className="py-3 px-4 text-right rounded-tr-lg">Value (GBP)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topOpps.map((opp, idx) => (
                                    <tr key={opp.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="py-3 px-4 border-b border-slate-100">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 flex items-center">
                                                    <span className="w-6 text-slate-400 font-normal text-xs">{idx + 1}.</span> {opp.accountName}
                                                </span>
                                                {opp.description && (
                                                    <span className="text-xs text-slate-500 mt-1 ml-6 line-clamp-2" title={opp.description}>
                                                        {opp.description}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 border-b border-slate-100 text-slate-600 align-top">{opp.country}</td>
                                        <td className="py-3 px-4 border-b border-slate-100 text-slate-600 align-top">{opp.customerClass || 'N/A'}</td>
                                        <td className="py-3 px-4 border-b border-slate-100 text-slate-600 align-top">{opp.owner}</td>
                                        <td className="py-3 px-4 border-b border-slate-100 text-center align-top" title={opp.stageOrig}>
                                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-xs font-semibold border border-slate-200">
                                                {(opp.stageProbability ?? 0) * 100}%
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 border-b border-slate-100 text-center align-top">
                                            <span className="bg-vjtech-accent/10 text-vjtech-accent px-2 py-0.5 rounded-md text-xs font-semibold border border-vjtech-accent/20">
                                                {(opp.userProbability ?? 0) * 100}%
                                            </span>
                                        </td>
                                        <td className={`py-3 px-4 border-b border-slate-100 text-right align-top ${opp.ageDays > 180 ? 'text-amber-600 font-medium' : 'text-slate-600'}`}>
                                            {opp.ageDays}d
                                        </td>
                                        <td className="py-3 px-4 border-b border-slate-100 text-right font-bold text-slate-900 align-top">
                                            {formatCurrency(opp.valueGbp)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
