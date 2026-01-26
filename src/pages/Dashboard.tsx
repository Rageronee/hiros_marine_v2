import { useState } from 'react';
import { Activity } from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import NewsSection from '../components/dashboard/NewsSection';
import LocationGrid from '../components/dashboard/LocationGrid';
import MissionSidebar from '../components/dashboard/MissionSidebar';
import LocationModal from '../components/dashboard/LocationModal';
import { Location } from '../types';

export default function Dashboard() {
    const { news, activeQuests, locations, loading, error } = useDashboard();
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center text-cyan-500/50">
                <Activity className="animate-pulse" size={48} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex items-center justify-center text-red-400 font-bold">
                Error: {error}
            </div>
        );
    }

    return (
        // Main Background: Deep Ocean Dark Gradient
        <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-900 via-[#0B1120] to-[#0f172a] p-4 lg:p-8 custom-scrollbar text-slate-200">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
                <div>
                    <h1 className="text-4xl lg:text-5xl font-display font-black text-white tracking-tight mb-2 drop-shadow-[0_0_15px_rgba(56,189,248,0.3)]">
                        Command Center
                    </h1>
                    <p className="text-cyan-400 font-medium flex items-center gap-2">
                        <Activity size={16} className="animate-pulse" />
                        Welcome back, Operative. Systems nominal.
                    </p>
                </div>

                {/* Rank Card - Glassmorphism */}
                <div className="bg-slate-800/40 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 shadow-xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 flex items-center justify-center font-bold font-display text-lg shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                        12
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest leading-none mb-1">Current Rank</p>
                        <p className="text-sm font-bold text-white leading-none">Senior Ranger</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pb-20">
                {/* Main Content Area (Left 3/4) */}
                <div className="lg:col-span-3 space-y-8">
                    <NewsSection news={news} />
                    <LocationGrid locations={locations} onLocationClick={setSelectedLocation} />
                </div>

                {/* Right Sidebar (Active Missions) */}
                <div className="lg:col-span-1 space-y-6">
                    <MissionSidebar activeQuests={activeQuests} />
                </div>
            </div>

            {/* Location Detail Modal */}
            <LocationModal
                location={selectedLocation}
                onClose={() => setSelectedLocation(null)}
            />
        </div>
    );
}
