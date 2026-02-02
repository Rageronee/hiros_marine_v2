import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Target, MapPin, Camera, Clock, CheckCircle, Loader2, Zap, Anchor, Eye, Trash2, AlertTriangle, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Mission {
    id: string;
    title: string;
    location: string;
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
    type: 'Cleanup' | 'Observation' | 'Restoration' | 'Patrol';
    xpReward: number;
    shellReward: number;
    description: string;
    status: 'Available' | 'Active' | 'Completed';
    deadline?: string;
}

export default function Missions() {
    const [filter, setFilter] = useState<'Available' | 'Active' | 'Completed'>('Available');
    const queryClient = useQueryClient();

    // Fetch missions with React Query cache
    const { data: missions = [], isLoading: loading } = useQuery({
        queryKey: ['missions'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('missions')
                .select('*');

            if (error) throw error;

            return (data || []).map(item => ({
                id: item.id,
                title: item.title,
                location: item.location,
                difficulty: item.difficulty,
                type: item.type,
                xpReward: item.xp_reward,
                shellReward: item.shell_reward,
                description: item.description,
                status: item.status,
                deadline: item.deadline
            })) as Mission[];
        }
    });

    const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
    const [processingState, setProcessingState] = useState<'idle' | 'validating' | 'accepting' | 'completed'>('idle');
    const [missionUnlockAnim, setMissionUnlockAnim] = useState(false);

    const handleAcceptMission = () => {
        setProcessingState('accepting');
        setMissionUnlockAnim(true);

        // Simulate holographic unlock sequence
        setTimeout(() => {
            setMissionUnlockAnim(false);
            setProcessingState('idle');
            // Optimistic update
            if (selectedMission) {
                const updated = { ...selectedMission, status: 'Active' as const };
                setSelectedMission(updated);

                queryClient.setQueryData(['missions'], (old: Mission[] | undefined) => {
                    return old ? old.map(m => m.id === updated.id ? updated : m) : [];
                });

                setFilter('Active');
            }
        }, 2500);
    };

    const handleSubmitEvidence = async () => {
        // ... (Simulated submission logic remains same)
        setProcessingState('validating');
        setTimeout(() => {
            setProcessingState('completed');
            setTimeout(() => {
                setProcessingState('idle');
                const updated = { ...selectedMission!, status: 'Completed' as const };

                queryClient.setQueryData(['missions'], (old: Mission[] | undefined) => {
                    return old ? old.map(m => m.id === updated.id ? updated : m) : [];
                });

                setFilter('Completed');
                setSelectedMission(null);
            }, 2000);
        }, 1500);
    };

    const getMissionIcon = (type: string) => {
        switch (type) {
            case 'Cleanup': return <Trash2 size={16} />;
            case 'Observation': return <Eye size={16} />;
            case 'Restoration': return <Anchor size={16} />;
            case 'Patrol': return <Zap size={16} />;
            default: return <Target size={16} />;
        }
    };

    const getDifficultyColor = (diff: string) => {
        switch (diff) {
            case 'Easy': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'Medium': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
            case 'Hard': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'Expert': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
            default: return 'text-slate-400 bg-slate-800 border-white/10';
        }
    };

    const filteredMissions = missions.filter(m => m.status === filter);

    return (
        <div className="h-full w-full p-4 lg:p-8 flex flex-col lg:flex-row gap-8 overflow-hidden bg-linear-to-br from-slate-900 via-[#0B1120] to-surface-pure relative">

            {/* Organic Water Unlock Overlay (Mission Acquired) */}
            {missionUnlockAnim && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md animate-fade-in">
                    <div className="text-center relative max-w-md w-full mx-4 overflow-hidden rounded-[3rem] p-12 bg-slate-900 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.2)]">
                        <div className="absolute inset-0 z-0 overflow-hidden opacity-20 pointer-events-none">
                            {/* Abstract Particles */}
                            <div className="absolute inset-0 bg-linear-to-b from-cyan-500/10 to-transparent" />
                        </div>

                        <div className="relative z-10">
                            <div className="w-32 h-32 mx-auto mb-6 relative flex items-center justify-center">
                                <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-[ripple_2s_linear_infinite]"></div>
                                <div className="absolute inset-4 bg-cyan-500/10 rounded-full animate-[ripple_2s_linear_infinite_delay-500ms]"></div>
                                <div className="relative z-10 bg-slate-900 p-6 rounded-full border border-cyan-500/50 text-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                                    <Anchor size={48} className="animate-pulse" />
                                </div>
                            </div>
                            <h2 className="text-3xl font-display font-black text-white mb-2 tracking-wide drop-shadow-md animate-slide-up">
                                Directive Acquired
                            </h2>
                            <p className="text-cyan-400/80 font-sans text-sm font-bold tracking-widest uppercase animate-pulse">
                                Syncing Coordinates...
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Overlay */}
            {processingState === 'completed' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md animate-fade-in">
                    <div className="text-center">
                        <div className="w-24 h-24 mx-auto mb-6 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                            <CheckCircle size={48} className="text-emerald-500 animate-bounce" />
                        </div>
                        <h2 className="text-3xl font-display font-black text-white mb-2">Evidence Uploaded</h2>
                        <p className="text-slate-400 max-w-sm mx-auto mb-8">
                            Solid copy. Central will verify shortly. Good work, Ranger.
                        </p>
                    </div>
                </div>
            )}

            {/* Mission List */}
            <div className={`w-full lg:w-1/2 flex-col h-full transition-all duration-500 ${selectedMission ? 'hidden lg:flex' : 'flex'}`}>
                <header className="mb-8 pl-2">
                    <h1 className="text-4xl lg:text-5xl font-display text-white mb-4 tracking-tight font-black drop-shadow-[0_0_15px_rgba(34,211,238,0.2)]">Mission Control</h1>
                    <div className="flex gap-4 sm:gap-8 border-b border-white/10 pb-4 overflow-x-auto">
                        {['Available', 'Active', 'Completed'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setFilter(tab as any)}
                                className={`text-sm uppercase tracking-[0.2em] transition-all relative pb-2 whitespace-nowrap cursor-pointer ${filter === tab ? 'text-cyan-400 font-black shadow-[0_10px_20px_-10px_rgba(34,211,238,0.5)]' : 'text-slate-500 hover:text-white font-bold'
                                    }`}
                            >
                                {tab}
                                {filter === tab && <div className="absolute -bottom-[17px] left-0 w-full h-[3px] bg-cyan-500 rounded-t-full shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>}
                            </button>
                        ))}
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar pb-24">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-40 text-cyan-400/50">
                            <Loader2 className="animate-spin mb-4" size={32} />
                            <p className="tracking-widest uppercase text-xs font-bold">Decrypting Directives...</p>
                        </div>
                    ) : filteredMissions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500 border border-dashed border-white/5 rounded-3xl bg-white/5 mx-2">
                            <Shield size={48} className="mb-4 opacity-50" />
                            <p className="tracking-widest uppercase text-xs font-bold">No Directives Found</p>
                            <p className="text-[10px] mt-2 text-slate-600">Sector Clear</p>
                        </div>
                    ) : (
                        filteredMissions.map(mission => (
                            <div
                                key={mission.id}
                                onClick={() => {
                                    setSelectedMission(mission);
                                    setProcessingState('idle');
                                }}
                                className={`p-6 cursor-pointer transition-all duration-300 group relative overflow-hidden text-left border rounded-3xl ${selectedMission?.id === mission.id
                                    ? 'bg-slate-800/80 shadow-xl border-cyan-500/50 translate-x-1'
                                    : 'bg-slate-900/40 hover:bg-slate-800/60 hover:shadow-lg border-white/5 hover:border-cyan-500/30'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex gap-2">
                                        <span className={`text-[9px] px-2 py-0.5 rounded border uppercase tracking-widest font-black flex items-center gap-1 ${getDifficultyColor(mission.difficulty)}`}>
                                            {mission.difficulty}
                                        </span>
                                        <span className="text-[9px] px-2 py-0.5 rounded border uppercase tracking-widest font-black bg-slate-950/50 border-white/10 text-slate-400 flex items-center gap-1 group-hover:text-white transition-colors">
                                            {getMissionIcon(mission.type)} {mission.type}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-slate-500 text-[10px] font-mono font-bold">
                                        <Clock size={10} />
                                        {mission.deadline || 'OPEN'}
                                    </div>
                                </div>
                                <h3 className={`text-lg font-display font-bold mb-1 transition-colors duration-300 leading-tight ${selectedMission?.id === mission.id ? 'text-cyan-300' : 'text-white group-hover:text-cyan-300'}`}>
                                    {mission.title}
                                </h3>
                                <div className="flex items-center gap-2 text-slate-400 text-xs mb-4 font-medium">
                                    <MapPin size={12} className="text-cyan-500" />
                                    {mission.location}
                                </div>
                                <div className="flex gap-4 text-xs font-mono font-bold bg-black/20 w-fit px-3 py-1.5 rounded-lg border border-white/5">
                                    <span className="text-cyan-400 text-shadow-glow">+{mission.xpReward} XP</span>
                                    <span className="text-amber-400">+{mission.shellReward} Shells</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Mission Details Panel (Desktop & Mobile) */}
            <div className={`fixed inset-0 lg:relative lg:flex w-full lg:w-1/2 p-0 lg:p-0 flex-col overflow-hidden bg-slate-900 z-40 transition-transform duration-500 border-l border-white/5 ${selectedMission ? 'translate-y-0' : 'translate-y-[110%] lg:translate-y-0 lg:opacity-50 lg:pointer-events-none lg:grayscale'}`}>

                {selectedMission ? (
                    <div className="h-full flex flex-col relative bg-slate-900/50 backdrop-blur-xl">
                        {/* Background Map Effect */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://images.unsplash.com/photo-1589634749362-a8ef3056cbe9?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')] bg-cover bg-center grayscale mix-blend-overlay"></div>

                        {/* Mobile Close Button */}
                        <button
                            onClick={() => setSelectedMission(null)}
                            className="lg:hidden absolute top-4 right-4 z-50 p-3 bg-black/50 backdrop-blur-md rounded-full text-white border border-white/10"
                        >
                            ✕
                        </button>

                        <div className="p-8 lg:p-12 flex-1 overflow-y-auto custom-scrollbar relative z-10">
                            <span className={`inline-flex mb-6 px-3 py-1 rounded text-[10px] font-black uppercase tracking-[0.2em] border ${getDifficultyColor(selectedMission.difficulty)}`}>
                                {selectedMission.difficulty} Priority
                            </span>

                            <h2 className="text-3xl lg:text-5xl font-display font-black text-white mb-6 leading-tigher drop-shadow-xl border-l-4 border-cyan-500 pl-6">
                                {selectedMission.title}
                            </h2>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-4 bg-slate-800/50 rounded-2xl border border-white/5">
                                    <p className="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-1">Target</p>
                                    <p className="text-white font-bold flex items-center gap-2">
                                        {getMissionIcon(selectedMission.type)} {selectedMission.type}
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-800/50 rounded-2xl border border-white/5">
                                    <p className="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-1">Sector</p>
                                    <p className="text-white font-bold flex items-center gap-2">
                                        <MapPin size={16} className="text-cyan-500" /> {selectedMission.location}
                                    </p>
                                </div>
                            </div>

                            <div className="prose prose-invert prose-sm max-w-none text-slate-300 mb-8 leading-relaxed">
                                <h3 className="text-white font-display uppercase tracking-widest text-xs font-bold mb-2 flex items-center gap-2">
                                    <AlertTriangle size={14} className="text-amber-400" /> Briefing
                                </h3>
                                <p>{selectedMission.description}</p>
                            </div>

                            <div className="p-6 bg-cyan-900/10 rounded-2xl border border-cyan-500/20 mb-8">
                                <h3 className="text-cyan-400 font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Shield size={16} /> Rewards
                                </h3>
                                <div className="flex gap-8">
                                    <div>
                                        <p className="text-[10px] text-cyan-200/60 font-bold uppercase">Experience</p>
                                        <p className="text-2xl font-black text-white">+{selectedMission.xpReward} <span className="text-sm font-normal text-cyan-500">XP</span></p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-cyan-200/60 font-bold uppercase">Currency</p>
                                        <p className="text-2xl font-black text-white">+{selectedMission.shellReward} <span className="text-sm font-normal text-amber-400">Shells</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-auto pt-8 border-t border-white/5">
                                {selectedMission.status === 'Available' ? (
                                    <button
                                        onClick={handleAcceptMission}
                                        disabled={processingState !== 'idle'}
                                        className="w-full py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black uppercase tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processingState === 'accepting' ? <Loader2 className="animate-spin" /> : <Zap size={18} />}
                                        Accept Directive
                                    </button>
                                ) : selectedMission.status === 'Active' ? (
                                    <div className="space-y-4">
                                        <div className="p-4 border border-dashed border-cyan-500/30 rounded-xl bg-cyan-950/20 text-center">
                                            <p className="text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2 animate-pulse">Mission Active</p>
                                            <p className="text-slate-400 text-xs">Complete objectives and upload evidence.</p>
                                        </div>
                                        <button
                                            onClick={handleSubmitEvidence}
                                            disabled={processingState !== 'idle'}
                                            className="w-full py-4 rounded-xl bg-white hover:bg-slate-200 text-slate-900 font-black uppercase tracking-widest text-sm transition-all shadow-lg flex items-center justify-center gap-2"
                                        >
                                            {processingState === 'validating' ? <Loader2 className="animate-spin" /> : <Camera size={18} />}
                                            Upload Evidence
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center gap-2 text-emerald-400 font-bold uppercase tracking-widest">
                                        <CheckCircle size={20} /> Mission Complete
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 p-8 text-center bg-slate-950/50">
                        <Target size={64} className="mb-6 opacity-20" />
                        <h3 className="text-xl font-display font-bold text-slate-500 mb-2">Select a Directive</h3>
                        <p className="text-sm text-slate-600 max-w-xs leading-relaxed">
                            Choose a mission from the list to view briefing details and operational parameters.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
