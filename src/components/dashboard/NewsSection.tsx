import { useNavigate } from 'react-router-dom';
import { ArrowRight, Waves } from 'lucide-react';
import { News } from '../../types';

interface NewsSectionProps {
    news: News[];
}

export default function NewsSection({ news }: NewsSectionProps) {
    const navigate = useNavigate();

    if (news.length === 0) return null;

    return (
        <section>
            <div className="flex justify-between items-end mb-6">
                <h2 className="text-xl font-display font-bold text-white flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                        <Waves size={20} />
                    </div>
                    Coastal Feed
                </h2>
                <button
                    onClick={() => navigate('/news')}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer uppercase tracking-wider bg-cyan-500/5 px-3 py-1.5 rounded-full border border-cyan-500/10 hover:border-cyan-500/30 hover:bg-cyan-500/10 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                    aria-label="View all news"
                >
                    NEWS <ArrowRight size={12} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Featured Article (First Item) */}
                {news[0] && (
                    <button
                        onClick={() => navigate(`/news/${news[0].id}`)}
                        className="md:col-span-2 relative h-72 md:h-auto rounded-3xl overflow-hidden group cursor-pointer shadow-2xl shadow-black/50 border border-white/5 text-left focus:ring-2 focus:ring-cyan-400 focus:outline-none w-full p-0"
                        aria-label={`Read article: ${news[0].title}`}
                    >
                        <img
                            src={news[0].image_url || 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80'}
                            alt={news[0].title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />

                        <div className="absolute bottom-0 left-0 p-8 w-full">
                            <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/20 backdrop-blur-md text-cyan-300 border border-cyan-500/20 text-[10px] font-bold uppercase tracking-widest mb-3 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                                {news[0].category}
                            </span>
                            <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-3 leading-tight group-hover:text-cyan-300 transition-colors drop-shadow-lg">
                                {news[0].title}
                            </h3>
                            <p className="text-slate-300 text-sm line-clamp-2 md:line-clamp-none max-w-lg mb-4">
                                {news[0].content}
                            </p>
                            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                                Read Transmisson <ArrowRight size={14} />
                            </div>
                        </div>
                    </button>
                )}

                {/* Secondary Articles */}
                <div className="space-y-4">
                    {news.slice(1, 4).map((item) => (
                        <button
                            key={item.id}
                            onClick={() => navigate(`/news/${item.id}`)}
                            className="w-full bg-slate-800/40 backdrop-blur-sm rounded-2xl p-3 border border-white/5 hover:border-cyan-500/30 hover:bg-slate-800/60 transition-all cursor-pointer group flex gap-4 h-28 relative overflow-hidden text-left focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                            aria-label={`Read article: ${item.title}`}
                        >
                            <div className="w-24 h-full rounded-xl overflow-hidden flex-shrink-0 relative">
                                <img
                                    src={item.image_url || 'https://images.unsplash.com/photo-1468581264429-2548ef9eb732?q=80'}
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                                />
                            </div>
                            <div className="flex-1 flex flex-col justify-center py-1">
                                <span className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 ${item.category === 'Alert' ? 'text-red-400' : 'text-cyan-400'
                                    }`}>
                                    {item.category}
                                </span>
                                <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-cyan-300 transition-colors mb-auto">
                                    {item.title}
                                </h3>
                                <p className="text-[10px] text-slate-500 font-mono mt-2">
                                    {new Date(item.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}
