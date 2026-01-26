import { MapPin, ExternalLink } from 'lucide-react';
import { Location } from '../../types';

interface LocationGridProps {
    locations: Location[];
    onLocationClick: (location: Location) => void;
}

export default function LocationGrid({ locations, onLocationClick }: LocationGridProps) {
    return (
        <section>
            <div className="flex justify-between items-end mb-6">
                <h2 className="text-xl font-display font-bold text-white flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                        <MapPin size={20} />
                    </div>
                    Island Hopping
                </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {locations.map((loc) => (
                    <button
                        key={loc.id}
                        onClick={() => onLocationClick(loc)}
                        className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-cyan-500/20 border border-white/5 hover:border-cyan-500/30 transition-all active:scale-95 w-full text-left focus:ring-2 focus:ring-emerald-400 focus:outline-none p-0"
                        aria-label={`View details for ${loc.name}`}
                    >
                        <img
                            src={loc.image_url || ''}
                            alt={loc.name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-75 group-hover:opacity-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />

                        <div className="absolute bottom-4 left-4 right-4">
                            <h3 className="text-white font-bold text-sm mb-1 leading-tight group-hover:text-cyan-300 transition-colors">{loc.name}</h3>
                            <p className="text-cyan-100/60 text-[9px] font-bold truncate uppercase tracking-wider">{loc.region}</p>
                        </div>
                        {/* Hover Indicator */}
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-cyan-500/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 text-cyan-300 border border-cyan-500/30">
                            <ExternalLink size={12} />
                        </div>
                    </button>
                ))}
            </div>
        </section>
    );
}
