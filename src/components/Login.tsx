import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/src/lib/api';
import { motion } from 'motion/react';
import { LogIn } from 'lucide-react';
import Logo from './Logo';

interface LoginProps {
  onLogin: (user: any, token: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      onLogin(user, token);
      toast.success(`Bem-vindo, ${user.nome}!`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Logo className="h-16" />
            </div>
            <CardTitle className="text-2xl font-bold">Acesso ao Sistema</CardTitle>
            <p className="text-sm text-muted-foreground">Entre com suas credenciais para gerenciar sua agenda</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="exemplo@agenda.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
            <div className="mt-6 p-4 bg-secondary rounded-md text-xs text-secondary-foreground">
              <p className="font-bold mb-1">Acesso Admin (Seed):</p>
              <p>E-mail: admin@agenda.com</p>
              <p>Senha: admin123</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
