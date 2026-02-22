"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { ParsedOpportunity, DataQualityReport, SnapshotConfig } from "@/lib/types";

interface DashboardState {
    opportunities: ParsedOpportunity[];
    report: DataQualityReport | null;
    currentSnapshot: SnapshotConfig | null;
    previousSnapshot: SnapshotConfig | null;
    isLoaded: boolean;
    filters: {
        mode: 'unweighted' | 'stage' | 'user' | 'blended';
        minProbability: number;
        region: string | null;
        customerClass: string | null;
        createdAfter: string | null;
        createdBefore: string | null;
    };
}

interface DashboardContextType extends DashboardState {
    setDashboardData: (data: Partial<DashboardState>) => void;
    setFilter: (key: keyof DashboardState['filters'], value: any) => void;
    clearFilters: () => void;
    resetData: () => void;
}

const initialState: DashboardState = {
    opportunities: [],
    report: null,
    currentSnapshot: null,
    previousSnapshot: null,
    isLoaded: false,
    filters: {
        mode: 'stage',
        minProbability: 0,
        region: null,
        customerClass: null,
        createdAfter: null,
        createdBefore: null
    }
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<DashboardState>(initialState);

    const setDashboardData = (data: Partial<DashboardState>) => {
        setState(prev => ({ ...prev, ...data, isLoaded: true }));
    };

    const setFilter = (key: keyof DashboardState['filters'], value: any) => {
        setState(prev => ({
            ...prev,
            filters: { ...prev.filters, [key]: value }
        }));
    };

    const resetData = () => {
        setState(initialState);
    };

    const clearFilters = () => {
        setState(prev => ({
            ...prev,
            filters: initialState.filters
        }));
    };

    return (
        <DashboardContext.Provider value={{ ...state, setDashboardData, setFilter, clearFilters, resetData }}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
}
