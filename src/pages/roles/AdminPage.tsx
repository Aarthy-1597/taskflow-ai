import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Settings, Database, Lock } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

const AdminPage = () => {
    return (
        <AppLayout>
            <div className="p-8 min-h-screen text-white">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-7xl mx-auto"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
                            <Shield className="text-red-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Admin Console</h1>
                            <p className="text-gray-400 text-sm">System oversight and organizational management</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { title: 'System Health', icon: <Database />, value: 'Optimal', color: 'text-green-500' },
                            { title: 'Active Users', icon: <Users />, value: '1,284', color: 'text-blue-500' },
                            { title: 'Security Logs', icon: <Lock />, value: 'Checked', color: 'text-purple-500' },
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <div className="p-2 rounded-lg bg-white/5 text-gray-400">{stat.icon}</div>
                                    <span className={stat.color}>{stat.value}</span>
                                </div>
                                <h3 className="text-sm font-medium text-gray-400">{stat.title}</h3>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-12 p-12 rounded-3xl bg-gradient-to-br from-red-500/5 to-purple-600/5 border border-white/5 text-center">
                        <Settings className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Administrative Tools</h2>
                        <p className="text-gray-500 max-w-md mx-auto">Access restricted system configurations, user permissions, and global settings.</p>
                    </div>
                </motion.div>
            </div>
        </AppLayout>
    );
};

export default AdminPage;
