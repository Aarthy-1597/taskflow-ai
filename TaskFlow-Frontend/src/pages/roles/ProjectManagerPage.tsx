import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Kanban, MessageSquare, PieChart, Users, Zap } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

const ProjectManagerPage = () => {
    return (
        <AppLayout>
            <div className="p-8 min-h-screen text-white">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-7xl mx-auto"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
                            <Briefcase className="text-purple-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Project Workspace</h1>
                            <p className="text-gray-400 text-sm">Strategic planning and team coordination</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        {[
                            { label: 'Active Projects', value: '12', icon: <Kanban /> },
                            { label: 'Team Capacity', value: '85%', icon: <Users /> },
                            { label: 'Upcoming Deadlines', value: '4', icon: <Zap /> },
                            { label: 'Unread Messages', value: '28', icon: <MessageSquare /> },
                        ].map((item, i) => (
                            <div key={i} className="p-5 rounded-xl bg-white/5 border border-white/10">
                                <div className="text-purple-400 mb-2">{item.icon}</div>
                                <div className="text-2xl font-bold">{item.value}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">{item.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 h-64 flex items-center justify-center border-dashed">
                            <div className="text-center">
                                <PieChart className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                                <p className="text-gray-500 italic">Project distribution chart coming soon...</p>
                            </div>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 h-64 flex items-center justify-center border-dashed">
                            <div className="text-center">
                                <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                                <p className="text-gray-500 italic">Team availability timeline coming soon...</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AppLayout>
    );
};

export default ProjectManagerPage;
