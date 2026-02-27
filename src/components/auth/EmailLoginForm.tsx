import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface EmailLoginFormProps {
    onSubmit: (email: string, pass: string) => void;
}

const EmailLoginForm: React.FC<EmailLoginFormProps> = ({ onSubmit }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(email, password);
    };

    return (
        <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        placeholder="name@company.com"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-white/5 border-white/10 h-11 text-white placeholder:text-gray-600 focus:ring-purple-500/50"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="password">Password</Label>
                        <button type="button" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">Forgot password?</button>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-white/5 border-white/10 h-11 text-white placeholder:text-gray-600 focus:ring-purple-500/50"
                        required
                    />
                </div>
            </div>

            <Button type="submit" className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 border-none font-semibold flex items-center justify-center gap-2 group transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
        </form>
    );
};

export default EmailLoginForm;
