import { X, MapPin, ArrowRight } from 'lucide-react';
import { Location } from '../../types';

interface LocationModalProps {
    location: Location | null;
    onClose: () => void;
}

export default function LocationModal({ location, onClose }: LocationModalProps) {
    if (!location) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in cursor-default"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div
                className="bg-slate-900 rounded-4xl max-w-lg w-full overflow-hidden shadow-2xl relative animate-scale-up border border-white/10 shadow-cyan-500/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Hero Image */}
                <div className="h-56 relative">
                    <img src={location.image_url || ''} alt={location.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-transparent to-transparent" />
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all cursor-pointer border border-white/10 focus:ring-2 focus:ring-white focus:outline-none"
                        aria-label="Close modal"
                    >
                        <X size={18} />
                    </button>
                    <div className="absolute bottom-6 left-8 text-white">
                        <h2 id="modal-title" className="text-3xl font-display font-bold leading-tight mb-2 drop-shadow-lg">{location.name}</h2>
                        <p className="text-cyan-300 text-sm font-bold flex items-center gap-1.5 uppercase tracking-wider">
                            <MapPin size={14} /> {location.region}
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                    <div className="flex gap-4">
                        <div className="flex-1 bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Clarity</p>
                            <p className="text-2xl font-bold text-cyan-400">{location.water_clarity ?? '--'}m</p>
                        </div>
                        <div className="flex-1 bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Status</p>
                            <p className={`text-2xl font-bold ${location.current_condition === 'Ideal' ? 'text-emerald-400' : 'text-slate-200'
                                }`}>{location.current_condition || 'Unknown'}</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span> Travel Intelligence
                        </h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            {location.description || "No specific data available for this sector. Consult local guides for detailed reconnaissance."}
                        </p>
                    </div>

                    <button className="w-full btn-primary py-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:-translate-y-0.5 transition-all bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold focus:ring-2 focus:ring-cyan-500 focus:outline-none">
                        Plan Expedition <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
