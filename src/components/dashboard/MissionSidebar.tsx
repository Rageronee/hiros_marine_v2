import { useNavigate } from 'react-router-dom';
import { Trophy, MapPin, ArrowRight } from 'lucide-react';
import { Mission } from '../../types';

interface MissionSidebarProps {
    activeQuests: Mission[];
}

export default function MissionSidebar({ activeQuests }: MissionSidebarProps) {
    const navigate = useNavigate();

    return (
        <section className="bg-slate-800/30 backdrop-blur-sm rounded-3xl p-6 border border-white/5 shadow-xl h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-display font-bold text-white flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                        <Trophy size={18} />
                    </div>
                    Directives
                </h2>
            </div>

            <div className="space-y-4 flex-1">
                {activeQuests.length > 0 ? activeQuests.map((quest) => (
                    <div key={quest.id} className="group cursor-pointer rounded-2xl bg-white/5 border border-white/5 p-4 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all">
                        <div className="flex justify-between items-start mb-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${quest.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                quest.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                    'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}>
                                {quest.difficulty}
                            </span>
                            <span className="text-[10px] font-bold text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.2)]">{quest.xp_reward} XP</span>
                        </div>

                        <h3 className="text-sm font-bold text-white mb-1.5 leading-tight group-hover:text-amber-300 transition-colors">
                            {quest.title}
                        </h3>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mb-3">
                            <MapPin size={10} className="text-slate-500" /> {quest.location}
                        </p>

                        <button className="w-full py-2 rounded-xl bg-slate-900 border border-white/10 text-[10px] font-bold text-slate-300 uppercase tracking-widest hover:bg-amber-500 hover:text-slate-900 hover:border-amber-500 transition-all shadow-lg shadow-black/20 focus:ring-2 focus:ring-amber-400 focus:outline-none">
                            Engage
                        </button>
                    </div>
                )) : (
                    <div className="text-center py-10 px-4 border-2 border-dashed border-white/5 rounded-2xl">
                        <p className="text-xs text-slate-500 font-medium">No active directives.</p>
                    </div>
                )}
            </div>

            {/* View All Button */}
            <button
                onClick={() => navigate('/missions')}
                className="w-full py-4 mt-4 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest border-t border-white/5 transition-colors flex items-center justify-center gap-2 group focus:ring-2 focus:ring-slate-400 focus:outline-none"
            >
                View All <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </button>
        </section>
    );
}
