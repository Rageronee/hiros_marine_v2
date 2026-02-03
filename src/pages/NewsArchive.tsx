import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Newspaper, ChevronRight, Loader2, AlertTriangle, Heart, Zap, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NewsItem {
    id: string;
    title: string;
    category: 'Positive News' | 'Alert' | 'Community';
    image_url: string;
    content: string;
    created_at: string;
}

export default function NewsArchive() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'All' | 'Positive News' | 'Alert' | 'Community'>('All');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchNews = async () => {
            try {
                let query = supabase.from('news').select('*').order('created_at', { ascending: false });

                if (filter !== 'All') {
                    query = query.eq('category', filter);
                }

                const { data, error } = await query;
                if (error) throw error;
                setNews(data || []);
            } catch (err) {
                console.error("Error loading news:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, [filter]);

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'Positive News': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'Alert': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
            case 'Community': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
            default: return 'bg-slate-800/50 text-slate-400 border-slate-700';
        }
    };

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'Positive News': return <Zap size={12} />;
            case 'Alert': return <AlertTriangle size={12} />;
            case 'Community': return <Heart size={12} />;
            default: return <Newspaper size={12} />;
        }
    };

    return (
        <div className="h-full overflow-y-auto bg-linear-to-br from-slate-900 via-[#0B1120] to-surface-pure p-4 lg:p-8 custom-scrollbar">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-4xl lg:text-5xl font-display font-black text-white tracking-tight mb-2 drop-shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                        Ocean Gazette
                    </h1>
                    <p className="text-cyan-400/80 font-medium">Archive of all Sector Updates and Directives.</p>
                </div>

                {/* Filter */}
                <div className="flex bg-slate-800/50 backdrop-blur-md rounded-xl p-1 shadow-lg border border-white/10">
                    {['All', 'Positive News', 'Alert', 'Community'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab as any)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all cursor-pointer ${filter === tab
                                ? 'bg-cyan-500 text-slate-900 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center text-cyan-400/60">
                    <Loader2 className="animate-spin mb-3" size={32} />
                    <span className="text-xs font-bold uppercase tracking-widest">Retrieving Archives...</span>
                </div>
            ) : news.length === 0 ? (
                <div className="text-center py-24 text-slate-500 border-2 border-dashed border-white/5 rounded-3xl bg-white/5">
                    <Search className="mx-auto mb-4 opacity-50" size={48} />
                    <p className="font-bold text-lg text-slate-400">No Records Found</p>
                    <p className="text-xs uppercase tracking-widest mt-2">Try adjusting your filters</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                    {news.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => navigate(`/news/${item.id}`)}
                            className="bg-slate-800/30 backdrop-blur-md rounded-2xl overflow-hidden border border-white/5 shadow-lg hover:shadow-cyan-500/10 hover:border-cyan-500/30 transition-all duration-300 group cursor-pointer flex flex-col h-full relative"
                        >
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-linear-to-r from-transparent via-cyan-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="h-56 relative overflow-hidden">
                                <img
                                    src={item.image_url}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                                />
                                <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                                <div className="absolute top-4 left-4">
                                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border backdrop-blur-md shadow-lg ${getCategoryColor(item.category)}`}>
                                        {getCategoryIcon(item.category)}
                                        {item.category}
                                    </span>
                                </div>
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <h3 className="text-xl font-display font-bold text-white leading-tight mb-3 group-hover:text-cyan-300 transition-colors drop-shadow-md">
                                    {item.title}
                                </h3>
                                <p className="text-slate-400 text-sm line-clamp-3 mb-6 flex-1 leading-relaxed">
                                    {item.content}
                                </p>
                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </span>
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-cyan-500 group-hover:text-slate-900 transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                                        <ChevronRight size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
