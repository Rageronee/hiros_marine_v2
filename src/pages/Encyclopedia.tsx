import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Grid, List, BookOpen, Droplets, Ruler, AlertTriangle, Loader2, ChevronLeft, ChevronRight, X, Info, ExternalLink } from 'lucide-react';

export default function Encyclopedia() {
    const [specimens, setSpecimens] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSpecimen, setSelectedSpecimen] = useState<any | null>(null);

    useEffect(() => {
        fetchSpecimens();
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

    const filteredSpecimens = specimens.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.scientific_name && s.scientific_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="h-full w-full p-4 lg:p-8 flex flex-col gap-6 overflow-hidden bg-slate-900">
            {/* Header & Controls */}
            <header className="flex flex-col md:flex-row justify-between items-end gap-4 shrink-0">
                <div>
                    <h1 className="text-4xl font-display font-bold text-white mb-2">Marine Index</h1>
                    <p className="text-ocean-medium font-mono text-xs uppercase tracking-widest">
                        Biodiversity Database • {specimens.length} Entries
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    {/* Search Bar */}
                    <div className="relative group w-full md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ocean-light">
                            <Search size={16} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search species..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/50 border border-ocean-light/20 rounded-xl text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-ocean-light/50 focus:border-transparent transition-all text-white"
                        />
                    </div>

                    {/* View Toggle */}
                    <div className="flex bg-slate-900/50 p-1 rounded-xl border border-ocean-light/20">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-ocean-light/20 text-ocean-light shadow-sm' : 'text-slate-500 hover:text-white'}`}
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-ocean-light/20 text-ocean-light shadow-sm' : 'text-slate-500 hover:text-white'}`}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Content Area */}
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
                                className={`marine-card group cursor-pointer overflow-hidden relative ${viewMode === 'list' ? 'flex flex-row h-32 items-center p-4 gap-6' : 'flex flex-col h-80'}`}
                            >
                                {/* Image */}
                                <div className={`${viewMode === 'list' ? 'w-24 h-24 rounded-xl' : 'h-48 w-full'} bg-slate-800 relative overflow-hidden shrink-0`}>
                                    <img
                                        src={specimen.image_url || 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?auto=format&fit=crop&q=80'}
                                        alt={specimen.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    {specimen.status === 'Locked' && (
                                        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                                            <div className="p-2 border border-white/20 rounded-full">
                                                <BookOpen size={20} className="text-slate-400" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className={`${viewMode === 'list' ? 'flex-1' : 'p-5 flex flex-col flex-1'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-display font-extrabold text-lg text-white group-hover:text-ocean-light transition-colors line-clamp-1 tracking-tight">{specimen.name}</h3>
                                            <p className="text-xs font-serif italic text-slate-400 line-clamp-1 opacity-80">{specimen.scientific_name}</p>
                                        </div>
                                        {viewMode === 'grid' && (
                                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full ${specimen.rarity === 'Legendary' ? 'bg-sand-gold/20 text-sand-gold' : 'bg-ocean-light/10 text-ocean-light'}`}>
                                                {specimen.rarity}
                                            </span>
                                        )}
                                    </div>

                                    {viewMode === 'grid' && (
                                        <p className="text-xs text-slate-300 line-clamp-2 mt-auto opacity-80 leading-relaxed">
                                            {specimen.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Specimen Detail Modal */}
            {selectedSpecimen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-lg animate-in fade-in duration-300" onClick={() => setSelectedSpecimen(null)}>

                    {/* Navigation Buttons (Outside Card) */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const currentIndex = filteredSpecimens.findIndex(s => s.id === selectedSpecimen.id);
                            const prevIndex = (currentIndex - 1 + filteredSpecimens.length) % filteredSpecimens.length;
                            setSelectedSpecimen(filteredSpecimens[prevIndex]);
                        }}
                        className="absolute left-4 md:left-8 p-3 rounded-full bg-slate-800/50 text-white hover:bg-ocean-depth hover:scale-110 transition-all border border-white/10 hidden md:block z-50"
                    >
                        <ChevronLeft size={32} />
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const currentIndex = filteredSpecimens.findIndex(s => s.id === selectedSpecimen.id);
                            const nextIndex = (currentIndex + 1) % filteredSpecimens.length;
                            setSelectedSpecimen(filteredSpecimens[nextIndex]);
                        }}
                        className="absolute right-4 md:right-8 p-3 rounded-full bg-slate-800/50 text-white hover:bg-ocean-depth hover:scale-110 transition-all border border-white/10 hidden md:block z-50"
                    >
                        <ChevronRight size={32} />
                    </button>

                    <div className="marine-card max-w-5xl w-full h-[85vh] flex flex-col md:flex-row overflow-hidden relative shadow-2xl shadow-black/50 border border-ocean-light/20 bg-slate-900" onClick={e => e.stopPropagation()}>

                        {/* Close Button */}
                        <button onClick={() => setSelectedSpecimen(null)} className="absolute top-4 right-4 z-50 p-2 bg-black/40 text-white rounded-full hover:bg-alert-red hover:rotate-90 transition-all backdrop-blur-md border border-white/10">
                            <X size={20} />
                        </button>

                        {/* Image Section - Left Panel */}
                        <div className="w-full md:w-1/2 h-64 md:h-full relative bg-slate-950 group">
                            <img
                                src={selectedSpecimen.image_url || 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?auto=format&fit=crop&q=80'}
                                alt={selectedSpecimen.name}
                                className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent"></div>

                            {/* Holographic Overlay Effect */}
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>

                            <div className="absolute bottom-0 left-0 p-8 w-full z-20">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border ${selectedSpecimen.rarity === 'Legendary' ? 'bg-sand-gold/20 border-sand-gold text-sand-gold' : 'bg-ocean-light/20 border-ocean-light text-ocean-light'}`}>
                                        {selectedSpecimen.rarity || 'Common'}
                                    </span>
                                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/10 border border-white/20 text-white">
                                        {selectedSpecimen.type || 'Fauna'}
                                    </span>
                                </div>
                                <h2 className="text-4xl md:text-6xl font-display font-black text-white mb-1 leading-none drop-shadow-lg">{selectedSpecimen.name}</h2>
                                <p className="text-xl font-serif italic text-ocean-light font-light tracking-wide opacity-90">{selectedSpecimen.scientific_name || selectedSpecimen.latin_name}</p>
                            </div>
                        </div>

                        {/* Info Section - Right Panel */}
                        <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto custom-scrollbar bg-slate-900 relative">
                            {/* Background Elements */}
                            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                <BookOpen size={200} />
                            </div>

                            <div className="space-y-10 relative z-10">
                                <div>
                                    <h4 className="flex items-center gap-2 text-xs font-bold text-ocean-light uppercase tracking-[0.2em] mb-4 border-b border-white/10 pb-2">
                                        <Info size={14} /> Field Notes
                                    </h4>
                                    <p className="text-slate-300 leading-loose text-lg font-light">
                                        {selectedSpecimen.description}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-2 text-ocean-medium mb-2 opacity-80">
                                            <Ruler size={16} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Avg Size</span>
                                        </div>
                                        <span className="text-xl font-display font-bold text-white">{selectedSpecimen.size || 'Unknown'}</span>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-2 text-ocean-medium mb-2 opacity-80">
                                            <Droplets size={16} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Habitat</span>
                                        </div>
                                        <span className="text-xl font-display font-bold text-white">{selectedSpecimen.habitat || selectedSpecimen.depth || 'Unknown'}</span>
                                    </div>
                                </div>

                                {selectedSpecimen.status === 'Locked' && (
                                    <div className="p-6 rounded-2xl bg-alert-red/5 border border-alert-red/20 flex items-start gap-4">
                                        <AlertTriangle className="text-alert-red shrink-0" />
                                        <div>
                                            <h5 className="font-bold text-alert-red mb-1">Data Encrypted</h5>
                                            <p className="text-xs text-alert-red/70 leading-relaxed">
                                                Additional biological data is encoded. Complete observation missions in {selectedSpecimen.discovery_location || 'Unknown Region'} to decrypt full analysis.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-8 border-t border-white/5 flex justify-between items-center">
                                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Ref ID: {selectedSpecimen.id.slice(0, 8)}</span>
                                    <button className="text-xs font-bold text-ocean-light hover:text-white uppercase tracking-widest flex items-center gap-2 transition-colors">
                                        Add to Log <ExternalLink size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
