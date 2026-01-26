import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Calendar, Tag, Share2, Clock, ThumbsUp, MessageSquare, Loader2 } from 'lucide-react';

export default function NewsDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState<any>(null);
    const [relatedNews, setRelatedNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArticleAndRelated = async () => {
            if (!id) return;
            try {
                // Fetch current article
                const { data: current, error: currentError } = await supabase
                    .from('news')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (currentError) throw currentError;
                setArticle(current);

                // Fetch related news (excluding current)
                const { data: related, error: relatedError } = await supabase
                    .from('news')
                    .select('*')
                    .neq('id', id)
                    .limit(3)
                    .order('created_at', { ascending: false });

                if (relatedError) console.error('Error fetching related:', relatedError);
                setRelatedNews(related || []);

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchArticleAndRelated();
        // Scroll to top when id changes
        window.scrollTo(0, 0);
    }, [id]);

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="animate-spin text-ocean-light" size={48} />
            </div>
        );
    }

    if (!article) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center text-white">
                <h2 className="text-2xl font-bold mb-4">Transmission Lost</h2>
                <button onClick={() => navigate(-1)} className="btn-ghost">Return to Surface</button>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full overflow-y-auto custom-scrollbar bg-slate-950">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-96 bg-cyan-500/5 blur-[100px]" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/5 blur-[100px]" />
            </div>

            {/* Hero Image Header */}
            <div className="w-full h-[60vh] relative">
                <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>

                <div className="absolute top-8 left-8 z-20">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-cyan-500 hover:text-slate-900 transition-all border border-white/10 group shadow-xl cursor-pointer"
                    >
                        <ArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                </div>

                <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 lg:p-20 z-10">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm font-bold uppercase tracking-widest">
                            <span className={`flex items-center gap-2 px-3 py-1 rounded-full border backdrop-blur-md ${article.category === 'Alert' ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'}`}>
                                <Tag size={14} /> {article.category}
                            </span>
                            <span className="flex items-center gap-2 text-slate-300 bg-black/20 px-3 py-1 rounded-full border border-white/5">
                                <Calendar size={14} /> {new Date(article.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-2 text-slate-300 bg-black/20 px-3 py-1 rounded-full border border-white/5 hidden sm:flex">
                                <Clock size={14} /> 5 min read
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-black text-white leading-tight drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] mb-8 max-w-4xl">
                            {article.title}
                        </h1>
                        <div className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 w-fit">
                            <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-lg shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                                HQ
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm">Command Center</p>
                                <p className="text-cyan-400/60 text-xs uppercase tracking-wider font-bold">Official Transmission</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="max-w-6xl mx-auto px-6 md:px-12 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">

                {/* Main Article */}
                <div className="lg:col-span-8">
                    <div className="prose prose-invert prose-lg max-w-none text-slate-300 leading-loose">
                        {/* First paragraph oversized */}
                        <p className="text-xl md:text-2xl leading-relaxed text-white font-light mb-10 border-l-4 border-cyan-500 pl-6 py-2">
                            {article.content.split('\n')[0]}
                        </p>
                        {/* Remaining content */}
                        <div className="space-y-6 text-slate-300/90 font-light tracking-wide">
                            {article.content.split('\n').slice(1).map((paragraph: string, idx: number) => (
                                <p key={idx} className="leading-8">{paragraph}</p>
                            ))}
                        </div>
                    </div>

                    {/* Interaction Bar */}
                    <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap gap-4 justify-between items-center text-slate-400 bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                        <div className="flex gap-4 sm:gap-6">
                            <button className="flex items-center gap-2 hover:text-cyan-400 transition-colors px-4 py-2 rounded-full hover:bg-cyan-500/10 cursor-pointer">
                                <ThumbsUp size={20} /> <span className="text-sm font-bold">Like</span>
                            </button>
                            <button className="flex items-center gap-2 hover:text-cyan-400 transition-colors px-4 py-2 rounded-full hover:bg-cyan-500/10 cursor-pointer">
                                <MessageSquare size={20} /> <span className="text-sm font-bold">Comment</span>
                            </button>
                        </div>
                        <button className="flex items-center gap-2 hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-white/10 ml-auto sm:ml-0 cursor-pointer text-slate-300">
                            <Share2 size={20} /> <span className="text-sm font-bold">Share Transmission</span>
                        </button>
                    </div>
                </div>

                {/* Sidebar: Incoming Transmissions */}
                <aside className="lg:col-span-4 space-y-8">
                    <div className="sticky top-8">
                        <h3 className="text-lg font-display font-bold text-white mb-6 flex items-center gap-3 px-2">
                            <div className="w-1.5 h-6 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                            Incoming Transmissions
                        </h3>

                        <div className="space-y-4">
                            {relatedNews.length > 0 ? relatedNews.map((item) => (
                                <div
                                    key={item.id}
                                    className="group cursor-pointer bg-slate-900/50 p-3 rounded-2xl border border-white/5 hover:bg-slate-800 transition-all hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:-translate-y-1"
                                    onClick={() => navigate(`/news/${item.id}`)}
                                >
                                    <div className="flex gap-4">
                                        <div className="w-24 h-24 bg-slate-800 rounded-xl shrink-0 overflow-hidden relative">
                                            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                        </div>
                                        <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
                                            <span className={`text-[9px] font-bold uppercase tracking-wider mb-2 block w-fit px-2 py-0.5 rounded ${item.category === 'Alert' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                                }`}>
                                                {item.category}
                                            </span>
                                            <h4 className="text-sm font-bold text-white leading-snug group-hover:text-cyan-300 transition-colors line-clamp-2 mb-2">
                                                {item.title}
                                            </h4>
                                            <span className="text-[10px] text-slate-500 font-mono">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-slate-500 text-sm italic p-6 border border-dashed border-white/10 rounded-2xl text-center bg-white/5">
                                    No other signals detected.
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

            </div>
        </div>
    );
}
