import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, ListTodo, Star, Target, TrendingUp } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

const TeamMemberPage = () => {
    return (
        <AppLayout>
            <div className="p-8 min-h-screen text-white">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-7xl mx-auto"
                >
                    <div className="flex justify-between items-center mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                                <Target className="text-blue-500" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">My Dashboard</h1>
                                <p className="text-gray-400 text-sm">Focus on your tasks and daily goals</p>
                            </div>
                        </div>
                        <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center gap-2 text-yellow-500 text-sm">
                            <Star className="w-4 h-4" /> 240 Points
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Current Tasks */}
                        <div className="lg:col-span-2 space-y-6">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <ListTodo className="text-purple-400" /> Today's Focus
                            </h2>
                            <div className="space-y-4">
                                {[
                                    { task: 'Refactor Auth Components', project: 'Taskflow AI', time: '2h', priority: 'High' },
                                    { task: 'Implement Role-Based Routing', project: 'Frontend Redesign', time: '4h', priority: 'Medium' },
                                    { task: 'Team Standup', project: 'Daily', time: '30m', priority: 'Low' },
                                ].map((task, i) => (
                                    <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center hover:bg-white/[0.07] transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded border border-white/20 flex items-center justify-center group-hover:border-blue-500/50 transition-colors">
                                                <div className="w-2 h-2 bg-blue-500 rounded-sm opacity-0 group-hover:opacity-100" />
                                            </div>
                                            <div>
                                                <div className="font-medium">{task.task}</div>
                                                <div className="text-xs text-gray-500">{task.project}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs">
                                            <span className="text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {task.time}</span>
                                            <span className={`px-2 py-1 rounded-md ${task.priority === 'High' ? 'bg-red-500/10 text-red-500' :
                                                    task.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-500'
                                                }`}>
                                                {task.priority}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Stats & Progress */}
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <TrendingUp className="text-blue-400" /> Performance
                            </h2>
                            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-600/10 border border-white/10">
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-400">Monthly Goal</span>
                                        <span className="text-blue-400 font-bold">78%</span>
                                    </div>
                                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div className="w-[78%] h-full bg-gradient-to-r from-blue-500 to-purple-500" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <div className="text-center">
                                        <div className="text-xl font-bold">142</div>
                                        <div className="text-[10px] text-gray-500 uppercase">Tasks Done</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xl font-bold">12h</div>
                                        <div className="text-[10px] text-gray-500 uppercase">Avg/Week</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AppLayout>
    );
};

export default TeamMemberPage;
