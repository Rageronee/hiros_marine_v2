import { Link } from 'react-router-dom';
import { ArrowLeft, Book, Shield, Code, Database, Users, Server, Globe } from 'lucide-react';

export default function About() {
    return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar bg-slate-950 relative">
            {/* Background Texture */}
            <div className="absolute inset-0 z-0 bg-slate-950">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-slate-950 to-blue-950/20" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto p-8 lg:p-12 pb-24">

                {/* Header */}
                <div className="mb-12">
                    <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors mb-6 text-sm font-bold uppercase tracking-widest group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Return to Terminal
                    </Link>
                    <h1 className="text-5xl font-display font-black text-white mb-4 italic tracking-tight">System Manual <span className="text-cyan-500">v2.1</span></h1>
                    <p className="text-xl text-slate-400 font-light leading-relaxed">
                        Comprehensive guide to the <span className="text-cyan-100 font-medium">Hiro Marine Protection System</span>.
                        Protocols, User Roles, and Technical Architecture.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">

                    {/* Card 1: Purpose */}
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-6 border border-cyan-500/20">
                            <Globe size={24} />
                        </div>
                        <h2 className="text-2xl font-display font-bold text-white mb-3">Project Vision</h2>
                        <p className="text-slate-400 leading-relaxed text-sm">
                            Hiro Marine is a next-generation conservation platform designed to gamify marine protection.
                            Users (Operatives) complete real-world missions to clean oceans, track specimens, and earn rewards via the "Ocean Shells" currency system.
                        </p>
                    </div>

                    {/* Card 2: Roles */}
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-6 border border-amber-500/20">
                            <Users size={24} />
                        </div>
                        <h2 className="text-2xl font-display font-bold text-white mb-3">Role Hierarchy</h2>
                        <ul className="space-y-3 text-sm text-slate-400">
                            <li className="flex gap-3">
                                <span className="text-cyan-400 font-bold uppercase tracking-wider w-16">User</span>
                                <span>Operative. Can view missions, submit evidence, and manage profile.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-amber-400 font-bold uppercase tracking-wider w-16">Admin</span>
                                <span>Commander. Can edit database entries, approve/reject submissions, and manage system alerts.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Tech Stack Section */}
                <div className="mb-12">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                        <span className="w-8 h-[1px] bg-slate-700"></span>
                        Technical Architecture
                        <span className="flex-1 h-[1px] bg-slate-700"></span>
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <TechCard icon={<Code size={20} />} title="React + Vite" desc="Frontend Core" />
                        <TechCard icon={<Shield size={20} />} title="TypeScript" desc="Type Safety" />
                        <TechCard icon={<Database size={20} />} title="Supabase" desc="PostgreSQL DB" />
                        <TechCard icon={<Server size={20} />} title="Tauri" desc="Native Rust App" />
                    </div>
                </div>

                {/* User Guide */}
                <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-br from-cyan-900/20 to-blue-900/10 border border-cyan-500/10">
                    <h2 className="text-3xl font-display font-bold text-white mb-8 flex items-center gap-3">
                        <Book className="text-cyan-400" /> Operaive Guide
                    </h2>

                    <div className="space-y-8">
                        <div>
                            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                <span className="text-cyan-500">01.</span> Account Initialization
                            </h3>
                            <p className="text-slate-400 text-sm pl-8">
                                Use the <strong>Enlistment Protocol</strong> on the Login screen.
                                Default prototypes are provided for immediate access.
                                Admins must be manually promoted via SQL Injection (see schema.sql).
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                <span className="text-cyan-500">02.</span> Mission Execution
                            </h3>
                            <p className="text-slate-400 text-sm pl-8">
                                Navigate to the <strong>Command Center</strong>. Select a mission marked "Available".
                                Upon completion, submit visual evidence (URL).
                                Status will remain "Pending" until verified by High Command.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                <span className="text-cyan-500">03.</span> Rank Advancement
                            </h3>
                            <p className="text-slate-400 text-sm pl-8">
                                Earn XP to level up your Clearance Class.
                                Rare specimens discovered in the field (e.g., Javan Rhino) award "Mythic" badges.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

function TechCard({ icon, title, desc }: any) {
    return (
        <div className="p-4 bg-slate-900/50 border border-white/5 rounded-xl flex items-center gap-4 hover:border-cyan-500/30 transition-colors">
            <div className="text-cyan-400">{icon}</div>
            <div>
                <div className="text-white font-bold text-sm">{title}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">{desc}</div>
            </div>
        </div>
    )
}
