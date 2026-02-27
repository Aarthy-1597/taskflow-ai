import React from 'react';
import { motion } from 'framer-motion';
import { Shield, User, Briefcase, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Role = 'Admin' | 'Project_Manager' | 'Team_Member';

interface RoleSelectorProps {
    selectedRole: Role;
    onRoleSelect: (role: Role) => void;
}

const roles: { id: Role; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'Admin', label: 'Admin', icon: <Shield className="w-4 h-4" />, color: 'from-red-500/20 to-red-600/20' },
    { id: 'Project_Manager', label: 'Project Manager', icon: <Briefcase className="w-4 h-4" />, color: 'from-purple-500/20 to-purple-600/20' },
    { id: 'Team_Member', label: 'Team Member', icon: <Users className="w-4 h-4" />, color: 'from-blue-500/20 to-blue-600/20' },
];

const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedRole, onRoleSelect }) => {
    return (
        <div className="flex flex-col gap-3 mb-8">
            {roles.map((role) => (
                <motion.button
                    key={role.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onRoleSelect(role.id)}
                    className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group",
                        selectedRole === role.id
                            ? "border-purple-500 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                            : "border-white/5 bg-white/5 hover:border-white/20"
                    )}
                >
                    {selectedRole === role.id && (
                        <motion.div
                            layoutId="role-glow"
                            className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent z-0"
                        />
                    )}
                    <div className={cn(
                        "p-2.5 rounded-lg relative z-10 transition-colors duration-300",
                        selectedRole === role.id ? "bg-purple-500 text-white" : "bg-white/5 text-gray-400 group-hover:text-white"
                    )}>
                        {role.icon}
                    </div>
                    <div className="flex flex-col items-start relative z-10">
                        <span className={cn(
                            "font-bold text-sm transition-colors duration-300",
                            selectedRole === role.id ? "text-white" : "text-gray-400 group-hover:text-white"
                        )}>
                            {role.label}
                        </span>
                        <span className="text-[10px] text-gray-500 group-hover:text-gray-400 transition-colors">
                            {role.id === 'Admin' ? 'System full access' : role.id === 'Project_Manager' ? 'Team & Project oversight' : 'Daily tasks & collaboration'}
                        </span>
                    </div>
                    {selectedRole === role.id && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="ml-auto w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                        />
                    )}
                </motion.button>
            ))}
        </div>
    );
};

export default RoleSelector;
