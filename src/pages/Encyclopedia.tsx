import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Grid, List, BookOpen, Droplets, Ruler, AlertTriangle, Loader2, ChevronLeft, ChevronRight, X, Info, CheckCircle2, Bookmark } from 'lucide-react';

export default function Encyclopedia() {
    const [specimens, setSpecimens] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSpecimen, setSelectedSpecimen] = useState<any | null>(null);
    const [savedLogs, setSavedLogs] = useState<string[]>([]);
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        fetchSpecimens();
        const saved = localStorage.getItem('hiro_specimen_logs');
        if (saved) setSavedLogs(JSON.parse(saved));
    }, []);

    const fetchSpecimens = async () => {
        try {
            const { data, error } = await supabase.from('specimens').select('*');
            if (error) throw error;
            setSpecimens(data || []);
        } catch (error) {
            console.error('Error fetching specimens:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToLog = (id: string) => {
        let newLogs;
        if (savedLogs.includes(id)) {
            newLogs = savedLogs.filter(logId => logId !== id);
        } else {
            newLogs = [...savedLogs, id];
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
        setSavedLogs(newLogs);
        localStorage.setItem('hiro_specimen_logs', JSON.stringify(newLogs));
    };

    const filteredSpecimens = specimens.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.scientific_name && s.scientific_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="h-full w-full p-4 lg:p-8 flex flex-col gap-6 overflow-hidden bg-slate-900 relative">

            {showToast && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 z-60 animate-in fade-in slide-in-from-top-4">
                    <div className="bg-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-emerald-400/50 backdrop-blur-md">
                        <CheckCircle2 size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Specimen Logged</span>
                    </div>
                </div>
            )}

            {/* Header - Responive (Center Mobile, Row PC) */}
            <header className="flex flex-col md:flex-row gap-6 shrink-0 pb-4 border-b border-white/5 items-center md:items-end md:justify-between pt-2">
                <div className="text-center md:text-left">
                    <h1 className="text-4xl md:text-5xl font-display font-black text-white tracking-tight mb-2 md:mb-1">
                        Marine Index
                    </h1>
                    <div className="flex items-center justify-center md:justify-start gap-3 text-ocean-medium/80 font-mono text-xs uppercase tracking-widest">
                        <span className="bg-white/5 px-2 py-0.5 rounded text-ocean-light">Biodiversity Database</span>
                        <span>•</span>
                        <span>{specimens.length} Entries</span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
                    <div className="relative group w-full md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ocean-light transition-colors group-focus-within:text-white">
                            <Search size={16} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search species..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-ocean-light/50 focus:border-ocean-light/50 transition-all text-white shadow-inner text-center md:text-left"
                        />
                    </div>

                    <div className="flex bg-slate-900 p-1 rounded-xl border border-white/10">
                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}>
                            <Grid size={18} />
                        </button>
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}>
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-24">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="animate-spin text-ocean-light" size={48} />
                    </div>
                ) : filteredSpecimens.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-white/10 rounded-3xl bg-slate-900/20">
                        <Search size={48} className="mb-4 opacity-50" />
                        <p className="uppercase tracking-widest text-xs font-bold">No Matches Found</p>
                    </div>
                ) : (
                    <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'flex flex-col gap-4'}`}>
                        {filteredSpecimens.map((specimen) => (
                            <div
                                key={specimen.id}
                                onClick={() => setSelectedSpecimen(specimen)}
                                className={`marine-card group cursor-pointer overflow-hidden relative ${viewMode === 'list' ? 'flex flex-row h-32 items-center p-4 gap-6' : 'flex flex-col h-96'}`}
                            >
                                {savedLogs.includes(specimen.id) && (
                                    <div className="absolute top-3 right-3 z-60 bg-emerald-500/20 backdrop-blur-md p-1.5 rounded-full border border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                        <Bookmark size={12} fill="currentColor" />
                                    </div>
                                )}

                                <div className={`${viewMode === 'list' ? 'w-24 h-24 rounded-xl' : 'h-56 w-full'} bg-slate-950 relative overflow-hidden shrink-0 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all`}>
                                    <img
                                        src={specimen.image_url || 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?auto=format&fit=crop&q=80'}
                                        className="absolute inset-0 w-full h-full object-cover opacity-50 blur-xl scale-110"
                                        alt=""
                                    />
                                    <img
                                        src={specimen.image_url || 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?auto=format&fit=crop&q=80'}
                                        alt={specimen.name}
                                        className="relative w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 z-10"
                                    />
                                    {specimen.status === 'Locked' && (
                                        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-20">
                                            <div className="p-2 border border-white/20 rounded-full">
                                                <BookOpen size={20} className="text-slate-400" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className={`${viewMode === 'list' ? 'flex-1' : 'p-5 flex flex-col flex-1'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-display font-bold text-lg text-white group-hover:text-ocean-light transition-colors line-clamp-1 tracking-tight">{specimen.name}</h3>
                                            <p className="text-xs font-serif italic text-slate-400 line-clamp-1 opacity-80">{specimen.scientific_name}</p>
                                        </div>
                                        {viewMode === 'grid' && (
                                            <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-1 rounded-full shrink-0 ${specimen.rarity === 'Legendary' ? 'bg-sand-gold/20 text-sand-gold border border-sand-gold/30' : 'bg-ocean-light/10 text-ocean-light border border-ocean-light/20'}`}>
                                                {specimen.rarity}
                                            </span>
                                        )}
                                    </div>
                                    {viewMode === 'grid' && (
                                        <>
                                            <p className="text-xs text-slate-300 line-clamp-3 mb-4 opacity-80 leading-relaxed font-light">
                                                {specimen.description}
                                            </p>
                                            <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/5">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{specimen.type}</span>
                                                <span className="text-[10px] text-ocean-dark font-mono bg-ocean-light/20 px-1.5 py-0.5 rounded text-ocean-light">#{specimen.id.slice(0, 4)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedSpecimen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-0 md:p-6 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="absolute inset-0" onClick={() => setSelectedSpecimen(null)} />

                    {/* Modal Card - Fullscreen Mobile (z-100/h-full), Windowed Desktop */}
                    <div className="relative w-full h-dvh md:h-[85vh] max-w-6xl overflow-hidden flex flex-col md:flex-row shadow-2xl shadow-black bg-slate-900 md:border border-white/10 rounded-none md:rounded-3xl z-101" onClick={e => e.stopPropagation()}>

                        {/* DESKTOP CLOSE BUTTON (Hidden on Mobile) */}
                        <button onClick={() => setSelectedSpecimen(null)} className="hidden md:block absolute top-4 right-4 z-50 p-2 bg-black/40 text-white rounded-full hover:bg-alert-red hover:rotate-90 transition-all backdrop-blur-md border border-white/10">
                            <X size={20} />
                        </button>

                        {/* DESKTOP SIDE NAVIGATION (Hidden on Mobile) */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const currentIndex = filteredSpecimens.findIndex(s => s.id === selectedSpecimen.id);
                                const prevIndex = (currentIndex - 1 + filteredSpecimens.length) % filteredSpecimens.length;
                                setSelectedSpecimen(filteredSpecimens[prevIndex]);
                            }}
                            className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-800/80 text-white hover:bg-ocean-depth hover:scale-110 transition-all border border-white/10 z-60 backdrop-blur-md shadow-xl Group/nav"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const currentIndex = filteredSpecimens.findIndex(s => s.id === selectedSpecimen.id);
                                const nextIndex = (currentIndex + 1) % filteredSpecimens.length;
                                setSelectedSpecimen(filteredSpecimens[nextIndex]);
                            }}
                            className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-800/80 text-white hover:bg-ocean-depth hover:scale-110 transition-all border border-white/10 z-60 backdrop-blur-md shadow-xl group/nav"
                        >
                            <ChevronRight size={24} />
                        </button>


                        {/* Image Section */}
                        <div className="w-full md:w-1/2 h-[40dvh] md:h-full relative bg-slate-950 group shrink-0 overflow-hidden text-left">
                            <img
                                src={selectedSpecimen.image_url || 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?auto=format&fit=crop&q=80'}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover opacity-30 blur-3xl scale-125"
                            />
                            <img
                                src={selectedSpecimen.image_url || 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?auto=format&fit=crop&q=80'}
                                alt={selectedSpecimen.name}
                                className="relative w-full h-full object-cover z-10 transition-transform duration-3000 group-hover:scale-105"
                            />

                            {/* Mobile Only: Top Right Close Button on Image */}
                            <button onClick={() => setSelectedSpecimen(null)} className="md:hidden absolute top-7 right-4 z-110 p-2 bg-black/40 text-white rounded-full backdrop-blur-md border border-white/10">
                                <X size={20} />
                            </button>

                            <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-slate-900/10 to-transparent z-20"></div>
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none z-30"></div>

                            <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full z-30">
                                <div className="flex items-center gap-3 mb-2 md:mb-4">
                                    <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest backdrop-blur-md border ${selectedSpecimen.rarity === 'Legendary' ? 'bg-sand-gold/20 border-sand-gold text-sand-gold' : 'bg-ocean-light/20 border-ocean-light text-ocean-light'}`}>
                                        {selectedSpecimen.rarity || 'Common'}
                                    </span>
                                    <span className="px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-white/10 border border-white/20 text-white">
                                        {selectedSpecimen.type || 'Fauna'}
                                    </span>
                                </div>
                                <h2 className="text-3xl md:text-6xl font-display font-black text-white mb-1 leading-none drop-shadow-lg wrap-break-word">{selectedSpecimen.name}</h2>
                                <p className="text-sm md:text-xl font-serif italic text-ocean-light font-light tracking-wide opacity-90">{selectedSpecimen.scientific_name || selectedSpecimen.latin_name}</p>
                            </div>
                        </div>

                        {/* Info Section - Scrollable Area */}

                        <div className="w-full md:w-1/2 flex flex-col bg-slate-900 relative flex-1 overflow-hidden">
                            {/* Content Scroll Container */}
                            {/* min-h-0 is crucial for nested flex scrolling */}
                            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 md:p-12 pb-32 md:pb-12 relative">
                                <div className="space-y-6 md:space-y-10 relative z-10 pb-4">
                                    <div className="flex justify-between items-end mb-3 md:mb-4 border-b border-white/10 pb-2">
                                        <h4 className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-ocean-light uppercase tracking-[0.2em]">
                                            <Info size={14} /> Field Notes
                                        </h4>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddToLog(selectedSpecimen.id);
                                            }}
                                            className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${savedLogs.includes(selectedSpecimen.id)
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600 hover:text-white'
                                                }`}
                                        >
                                            {savedLogs.includes(selectedSpecimen.id) ? (
                                                <>Logged <CheckCircle2 size={12} /></>
                                            ) : (
                                                <>Log <Bookmark size={12} /></>
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-slate-300 leading-relaxed text-sm md:text-lg font-light">
                                        {selectedSpecimen.description}
                                    </p>

                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        <div className="p-3 md:p-4 rounded-xl bg-white/5 border border-white/5">
                                            <div className="flex items-center gap-2 text-ocean-medium mb-1 opacity-80">
                                                <Ruler size={14} />
                                                <span className="text-[9px] font-bold uppercase tracking-widest">Avg Size</span>
                                            </div>
                                            <span className="text-base md:text-xl font-display font-bold text-white">{selectedSpecimen.size || 'Unknown'}</span>
                                        </div>
                                        <div className="p-3 md:p-4 rounded-xl bg-white/5 border border-white/5">
                                            <div className="flex items-center gap-2 text-ocean-medium mb-1 opacity-80">
                                                <Droplets size={14} />
                                                <span className="text-[9px] font-bold uppercase tracking-widest">Habitat</span>
                                            </div>
                                            <span className="text-base md:text-xl font-display font-bold text-white">{selectedSpecimen.habitat || selectedSpecimen.depth || 'Unknown'}</span>
                                        </div>
                                    </div>

                                    {/* Mobile Only: Inline Navigation */}
                                    <div className="grid grid-cols-2 gap-3 md:hidden">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const currentIndex = filteredSpecimens.findIndex(s => s.id === selectedSpecimen.id);
                                                const prevIndex = (currentIndex - 1 + filteredSpecimens.length) % filteredSpecimens.length;
                                                setSelectedSpecimen(filteredSpecimens[prevIndex]);
                                            }}
                                            className="py-3 rounded-lg bg-white/5 text-ocean-light border border-white/10 hover:bg-white/10 flex items-center justify-center active:scale-95 transition-all"
                                        >
                                            <ChevronLeft size={16} /> <span className="ml-2 text-[10px] font-bold uppercase tracking-widest">Prev</span>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const currentIndex = filteredSpecimens.findIndex(s => s.id === selectedSpecimen.id);
                                                const nextIndex = (currentIndex + 1) % filteredSpecimens.length;
                                                setSelectedSpecimen(filteredSpecimens[nextIndex]);
                                            }}
                                            className="py-3 rounded-lg bg-white/5 text-ocean-light border border-white/10 hover:bg-white/10 flex items-center justify-center active:scale-95 transition-all"
                                        >
                                            <span className="mr-2 text-[10px] font-bold uppercase tracking-widest">Next</span> <ChevronRight size={16} />
                                        </button>
                                    </div>

                                    {selectedSpecimen.status === 'Locked' && (
                                        <div className="p-4 rounded-xl bg-alert-red/5 border border-alert-red/20 flex items-start gap-3">
                                            <AlertTriangle className="text-alert-red shrink-0" size={16} />
                                            <div>
                                                <h5 className="font-bold text-alert-red text-xs mb-1">Data Encrypted</h5>
                                                <p className="text-[10px] md:text-xs text-alert-red/70 leading-relaxed">
                                                    Additional biological data is encoded. Complete missions in {selectedSpecimen.discovery_location || 'Unknown Region'}.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
