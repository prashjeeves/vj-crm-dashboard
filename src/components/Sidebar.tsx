"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import {
    LayoutDashboard,
    BarChart3,
    PieChart,
    Layers,
    Users,
    PauseCircle
} from "lucide-react";

export function Sidebar() {
    const pathname = usePathname();

    const links = [
        { name: "Executive Overview", href: "/", icon: LayoutDashboard },
        { name: "Opportunity Explorer", href: "/explorer", icon: Layers },
        { name: "Pipeline Analytics", href: "/pipeline", icon: BarChart3 },
        { name: "Growth Metrics", href: "/growth", icon: PieChart },
        { name: "Customer Base", href: "/customers", icon: Users },
        { name: "Dormant Enquiries", href: "/dormant", icon: PauseCircle },
    ];

    return (
        <aside className="w-64 bg-vjtech-primary text-slate-300 flex flex-col shadow-xl z-20 h-screen">
            <div className="p-6 border-b border-white/10 flex items-center justify-center space-x-3 h-[90px]">
                <Image
                    src="/vjtech-logo.png"
                    alt="VJ Tech Logo"
                    width={180}
                    height={60}
                    className="object-contain"
                />
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2 relative">
                <div className="mb-4 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Dashboards
                </div>
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${isActive
                                ? "bg-vjtech-accent/90 border border-vjtech-accent/50 text-white shadow-md shadow-vjtech-accent/20"
                                : "hover:bg-vjtech-primary hover:brightness-125 hover:text-white"
                                }`}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/40 rounded-r-md"></div>
                            )}
                            <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-vjtech-accent"}`} />
                            <span className="font-medium text-sm">{link.name}</span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
