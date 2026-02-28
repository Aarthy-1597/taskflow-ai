import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import RoleSelector, { Role } from '@/components/auth/RoleSelector';
import MicrosoftLoginButton from '@/components/auth/MicrosoftLoginButton';
import EmailLoginForm from '@/components/auth/EmailLoginForm';
import { redirectToMicrosoftLogin, loginWithEmail } from '@/api/auth';

const LoginPage = () => {
    const navigate = useNavigate();
    const { setUser } = useApp();
    const [selectedRole, setSelectedRole] = useState<Role>('Team_Member');

    const handleMicrosoftLogin = () => {
        redirectToMicrosoftLogin();
    };

    const handleEmailLogin = async (email: string, pass: string) => {
        const roleLabel = selectedRole.replace('_', ' ');
        const hasApi = typeof import.meta !== 'undefined' && !!import.meta.env.VITE_API_URL;

        if (hasApi) {
            const result = await loginWithEmail(email, pass);
            if (result) {
                setUser(
                    result.user
                        ? { name: result.user.name, email: result.user.email, role: result.user.role, avatar: result.user.avatar }
                        : { name: 'System Admin', email, role: roleLabel }
                );
                toast.success(`Logged in successfully as ${roleLabel}`);
                switch (selectedRole) {
                    case 'Admin':
                        navigate('/admin');
                        break;
                    case 'Project_Manager':
                        navigate('/manager');
                        break;
                    case 'Team_Member':
                        navigate('/member');
                        break;
                    default:
                        navigate('/dashboard');
                }
                return;
            }
        }

        if (email === 'admin@gmail.com' && pass === 'admin@123') {
            setUser({ name: 'System Admin', email, role: roleLabel });
            toast.success(`Logged in successfully as ${roleLabel}`);
            switch (selectedRole) {
                case 'Admin':
                    navigate('/admin');
                    break;
                case 'Project_Manager':
                    navigate('/manager');
                    break;
                case 'Team_Member':
                    navigate('/member');
                    break;
                default:
                    navigate('/');
            }
        } else {
            toast.error('Invalid credentials.');
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-[#030014] text-white overflow-hidden font-sans">
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="hidden lg:flex lg:w-3/5 relative items-center justify-center overflow-hidden"
            >
                <div className="absolute inset-0 z-0">
                    <img
                        src="/login-bg.png"
                        alt="Taskflow Visual"
                        className="w-full h-full object-cover opacity-60 scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#030014]" />
                </div>

                <div className="relative z-10 p-12 max-w-2xl text-center lg:text-left">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                    >
                        <h1 className="text-6xl font-bold tracking-tight mb-4">
                            Master Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Taskflow</span>
                        </h1>
                        <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                            Experience the next generation of project management. Seamless, intuitive, and designed for high-performance teams.
                        </p>
                        <div className="flex gap-4 justify-center lg:justify-start">
                            <div className="px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-sm font-medium">
                                ★ Highly Rated
                            </div>
                            <div className="px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-sm font-medium">
                                🚀 Fast Performance
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full lg:w-2/5 flex flex-col items-center justify-center p-8 lg:p-16 bg-[#030014] relative overflow-y-auto"
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full z-0" />

                <div className="w-full max-w-md relative z-10">
                    <div className="flex items-center gap-2 mb-10 justify-center lg:justify-start">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-purple-500/20">
                            T
                        </div>
                        <span className="text-2xl font-bold tracking-tight">Task<span className="text-purple-500">flow</span></span>
                    </div>

                    <div className="mb-8 text-center lg:text-left">
                        <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
                        <p className="text-gray-400">Please select your role and sign in</p>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <p className="text-sm font-medium text-gray-400 mb-4 ml-1">Continue as:</p>
                            <RoleSelector selectedRole={selectedRole} onRoleSelect={setSelectedRole} />
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedRole}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6"
                            >
                                <MicrosoftLoginButton onClick={handleMicrosoftLogin} />

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-white/10"></span>
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-[#030014] px-4 text-gray-500">Or use credentials</span>
                                    </div>
                                </div>

                                <EmailLoginForm onSubmit={handleEmailLogin} />
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <p className="mt-12 text-center text-sm text-gray-500">
                        Don't have an account? <button className="text-purple-400 font-medium hover:underline decoration-purple-400/30">Contact your Administrator</button>
                    </p>
                </div>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-gray-600 tracking-widest uppercase">
                    © 2026 Taskflow AI Systems
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
