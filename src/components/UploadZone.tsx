"use client";

import { useState } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, FolderSync } from "lucide-react";
import { useDashboard } from "./DashboardProvider";

export function UploadZone() {
    const [isHovering, setIsHovering] = useState(false);
    const [oppFile, setOppFile] = useState<File | null>(null);
    const [custFile, setCustFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { setDashboardData } = useDashboard();

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsHovering(true);
    };

    const handleDragLeave = () => {
        setIsHovering(false);
    };

    const handleDrop = (e: React.DragEvent, type: 'opps' | 'custs') => {
        e.preventDefault();
        setIsHovering(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (type === 'opps') setOppFile(file);
            else setCustFile(file);
        }
    };

    const submitFiles = async () => {
        if (!oppFile || !custFile) return;

        setIsUploading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append("opportunities", oppFile);
            formData.append("customers", custFile);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error || "Upload failed");
            }

            // Populate Global Context Context
            setDashboardData({
                opportunities: json.data.opportunities,
                report: json.data.report,
                currentSnapshot: json.data.currentSnapshot,
                previousSnapshot: json.data.previousSnapshot,
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const syncLocalFiles = async () => {
        setIsUploading(true);
        setError(null);
        try {
            const res = await fetch("/api/sync", {
                method: "POST"
            });

            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error || "Local sync failed");
            }

            setDashboardData({
                opportunities: json.data.opportunities,
                report: json.data.report,
                currentSnapshot: json.data.currentSnapshot,
                previousSnapshot: json.data.previousSnapshot,
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-12 px-6">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">Initialize Pipeline Engine</h2>
                <p className="text-slate-500 text-lg">Drop your raw ERP Excel files here to trigger deterministic processing.</p>
            </div>

            <div className="grid grid-cols-2 gap-8 w-full">
                {/* Opportunities Dropzone */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 'opps')}
                    className={`relative border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all duration-200 bg-white shadow-sm
            ${oppFile ? 'border-emerald-400 bg-emerald-50/30' :
                            isHovering ? 'border-vjtech-accent/40 bg-vjtech-accent/5 shadow-md' : 'border-slate-300 hover:border-vjtech-accent/30'}`}
                >
                    {oppFile ? (
                        <>
                            <div className="bg-emerald-100 p-4 rounded-full mb-4">
                                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h3 className="font-semibold text-slate-900">{oppFile.name}</h3>
                            <p className="text-xs text-slate-500 mt-1">Ready for parsing</p>
                        </>
                    ) : (
                        <>
                            <div className="bg-slate-50 p-4 rounded-full mb-4 border border-slate-100 ring-4 ring-white">
                                <UploadCloud className="w-8 h-8 text-vjtech-accent" />
                            </div>
                            <h3 className="font-semibold text-slate-700 mb-1">Opportunities Excel</h3>
                            <p className="text-xs text-slate-400">Drag & Drop .xlsx file</p>
                        </>
                    )}
                </div>

                {/* Customers Dropzone */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 'custs')}
                    className={`relative border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all duration-200 bg-white shadow-sm
            ${custFile ? 'border-emerald-400 bg-emerald-50/30' :
                            isHovering ? 'border-vjtech-accent/40 bg-vjtech-accent/5 shadow-md' : 'border-slate-300 hover:border-vjtech-accent/30'}`}
                >
                    {custFile ? (
                        <>
                            <div className="bg-emerald-100 p-4 rounded-full mb-4">
                                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h3 className="font-semibold text-slate-900">{custFile.name}</h3>
                            <p className="text-xs text-slate-500 mt-1">Ready for parsing</p>
                        </>
                    ) : (
                        <>
                            <div className="bg-slate-50 p-4 rounded-full mb-4 border border-slate-100 ring-4 ring-white">
                                <UploadCloud className="w-8 h-8 text-slate-500" />
                            </div>
                            <h3 className="font-semibold text-slate-700 mb-1">Customers Excel</h3>
                            <p className="text-xs text-slate-400">Drag & Drop .xlsx file</p>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <div className="mt-8 flex items-center p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl w-full">
                    <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 w-full">
                <button
                    onClick={syncLocalFiles}
                    disabled={isUploading}
                    className={`px-8 py-4 rounded-xl font-bold flex-1 max-w-[300px] text-lg shadow-lg transition-all duration-200 flex items-center justify-center space-x-2
            ${isUploading
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5'}`}
                >
                    {isUploading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <FolderSync className="w-5 h-5" />
                            <span>Auto-Sync Local Folder</span>
                        </>
                    )}
                </button>
                <span className="text-slate-400 font-medium">OR</span>
                <button
                    onClick={submitFiles}
                    disabled={!oppFile || !custFile || isUploading}
                    className={`px-8 py-4 rounded-xl font-bold flex-1 max-w-[300px] text-lg shadow-lg transition-all duration-200 flex items-center justify-center space-x-2
            ${(!oppFile || !custFile || isUploading)
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                            : 'bg-vjtech-accent hover:bg-vjtech-accent/90 text-white shadow-vjtech-accent/30 hover:shadow-vjtech-accent/50 hover:-translate-y-0.5'}`}
                >
                    <span>Upload Manually</span>
                </button>
            </div>

        </div>
    );
}
