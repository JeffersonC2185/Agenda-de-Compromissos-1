import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/src/lib/api';
import { motion } from 'motion/react';
import { LogIn, UserPlus, Mail, KeyRound } from 'lucide-react';
import Logo from './Logo';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';

interface LoginProps {
  onLogin: (user: any, token: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerData, setRegisterData] = useState({ nome: '', email: '', password: '', confirmPassword: '' });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowResend(false);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      onLogin(user, token);
      toast.success(`Bem-vindo, ${user.nome}!`);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Erro ao fazer login';
      toast.error(errorMsg);
      if (errorMsg.includes('ativada')) {
        setShowResend(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      return toast.error('As senhas não coincidem');
    }
    if (registerData.password.length < 6) {
      return toast.error('A senha deve ter no mínimo 6 caracteres');
    }

    setRegisterLoading(true);
    try {
      const response = await api.post('/auth/register', {
        nome: registerData.nome,
        email: registerData.email,
        password: registerData.password
      });
      toast.success(response.data.message, { duration: 10000 });
      setIsRegisterOpen(false);
      setRegisterData({ nome: '', email: '', password: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao realizar cadastro');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) return toast.error('Informe seu e-mail para reenviar a confirmação');
    try {
      await api.post('/auth/reenviar-confirmacao', { email });
      toast.success('E-mail de confirmação reenviado!');
      setShowResend(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao reenviar e-mail');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const response = await api.post('/auth/esqueci-senha', { email: forgotEmail });
      toast.success(response.data.message);
      setIsForgotOpen(false);
      setForgotEmail('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao processar solicitação');
    } finally {
      setForgotLoading(false);
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

            <div className="mt-2 text-center">
              <Dialog open={isForgotOpen} onOpenChange={setIsForgotOpen}>
                <DialogTrigger render={<Button variant="link" className="text-xs text-muted-foreground hover:text-primary p-0 h-auto" />}>
                  Esqueci minha senha
                </DialogTrigger>
                <DialogContent className="sm:max-w-[400px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <KeyRound className="h-5 w-5 text-primary" />
                      Recuperar Senha
                    </DialogTitle>
                    <DialogDescription>
                      Informe seu e-mail para receber um link de redefinição de senha.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleForgotPassword} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email">E-mail</Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={forgotLoading}>
                      {forgotLoading ? 'Enviando...' : 'Enviar link de recuperação'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="mt-4 space-y-2">
              <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
                <DialogTrigger render={<Button variant="outline" className="w-full gap-2" />}>
                  <UserPlus className="h-4 w-4" />
                  Cadastrar-se
                </DialogTrigger>
                <DialogContent className="sm:max-w-[400px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-primary" />
                      Criar Nova Conta
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleRegister} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-nome">Nome Completo</Label>
                      <Input
                        id="reg-nome"
                        value={registerData.nome}
                        onChange={(e) => setRegisterData({ ...registerData, nome: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">E-mail</Label>
                      <Input
                        id="reg-email"
                        type="email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Senha (mín. 6 caracteres)</Label>
                      <Input
                        id="reg-password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-confirm">Confirmar Senha</Label>
                      <Input
                        id="reg-confirm"
                        type="password"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={registerLoading}>
                      {registerLoading ? 'Cadastrando...' : 'Cadastrar'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              {showResend && (
                <Button 
                  variant="ghost" 
                  className="w-full text-xs gap-2 text-muted-foreground hover:text-primary"
                  onClick={handleResendConfirmation}
                >
                  <Mail className="h-3 w-3" />
                  Reenviar e-mail de confirmação
                </Button>
              )}
            </div>

            <div className="mt-6 p-4 bg-secondary rounded-md text-xs text-secondary-foreground">
              <p className="font-bold mb-1">Acesso de demonstração:</p>
              <p>E-mail: test@segnorte.com.br</p>
              <p>Senha: test123</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
