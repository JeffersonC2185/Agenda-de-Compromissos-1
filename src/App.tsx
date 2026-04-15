import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CalendarView from './components/CalendarView';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import UserManagement from './components/UserManagement';
import Login from './components/Login';
import Footer from './components/Footer';
import ThemeToggle from './components/ThemeToggle';
import Logo from './components/Logo';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import api from '@/src/lib/api';
import { Calendar, LayoutDashboard, FileText, Users, LogOut, User as UserIcon, Settings, Cake, UserCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from './types';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [profileNome, setProfileNome] = useState('');
  const [profileDataNascimento, setProfileDataNascimento] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileNotificacaoEmail, setProfileNotificacaoEmail] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    // Check for email confirmation token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const confirmToken = urlParams.get('token');
    const isConfirmPath = window.location.pathname === '/confirmar';
    const isResetPath = window.location.pathname === '/redefinir-senha';

    if (confirmToken && isConfirmPath) {
      const confirmEmail = async () => {
        try {
          const response = await api.get(`/auth/confirmar?token=${confirmToken}`);
          toast.success(response.data.message, { duration: 6000 });
          // Clear URL parameters and path
          window.history.replaceState({}, document.title, "/");
        } catch (error: any) {
          toast.error(error.response?.data?.error || 'Erro ao confirmar e-mail', { duration: 6000 });
          window.history.replaceState({}, document.title, "/");
        }
      };
      confirmEmail();
    }

    if (confirmToken && isResetPath) {
      setResetToken(confirmToken);
    }

    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setProfileNome(parsedUser.nome);
      setProfileNotificacaoEmail(parsedUser.notificacaoEmail ?? true);
      if (parsedUser.dataNascimento) {
        setProfileDataNascimento(parsedUser.dataNascimento.split('T')[0]);
      }
    }
    setLoading(false);

    const handleUnauthorized = () => {
      setUser(null);
      toast.error('Sessão expirada. Por favor, faça login novamente.');
    };

    window.addEventListener('unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, []);

  const handleLogin = (user: User, token: string) => {
    setUser(user);
    setProfileNome(user.nome);
    setProfileNotificacaoEmail(user.notificacaoEmail ?? true);
    if (user.dataNascimento) {
      setProfileDataNascimento(user.dataNascimento.split('T')[0]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsLogoutDialogOpen(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileLoading(true);
    try {
      const data: any = { 
        nome: profileNome,
        notificacaoEmail: profileNotificacaoEmail
      };
      if (profilePassword) data.password = profilePassword;
      data.dataNascimento = profileDataNascimento || null;
      
      const response = await api.put(`/users/${user.id}`, data);
      const updatedUser = response.data;
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Perfil atualizado com sucesso!');
      setIsProfileModalOpen(false);
      setProfilePassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar perfil');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPassword !== resetConfirmPassword) {
      return toast.error('As senhas não coincidem');
    }
    if (resetPassword.length < 6) {
      return toast.error('A senha deve ter no mínimo 6 caracteres');
    }

    setResetLoading(true);
    try {
      const response = await api.post('/auth/redefinir-senha', {
        token: resetToken,
        password: resetPassword
      });
      toast.success(response.data.message);
      setResetToken(null);
      setResetPassword('');
      setResetConfirmPassword('');
      window.history.replaceState({}, document.title, "/");
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao redefinir senha');
    } finally {
      setResetLoading(false);
    }
  };

  if (loading) return null;

  if (!user) {
    return (
      <div className="min-h-screen bg-background transition-colors duration-300">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        {resetToken ? (
          <div className="min-h-screen flex items-center justify-center p-4">
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
                  <CardTitle className="text-2xl font-bold">Nova Senha</CardTitle>
                  <p className="text-sm text-muted-foreground">Crie uma nova senha para sua conta</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Nova Senha</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-new-password">Confirmar Nova Senha</Label>
                      <Input
                        id="confirm-new-password"
                        type="password"
                        value={resetConfirmPassword}
                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={resetLoading}>
                      {resetLoading ? 'Alterando...' : 'Alterar Senha'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="w-full text-xs"
                      onClick={() => {
                        setResetToken(null);
                        window.history.replaceState({}, document.title, "/");
                      }}
                    >
                      Voltar para Login
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        ) : (
          <Login onLogin={handleLogin} />
        )}
        <Toaster position="top-right" />
      </div>
    );
  }

  const isAdmin = user.role === 'administrador';

  return (
    <div className="min-h-screen bg-background transition-colors duration-300 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto space-y-8"
      >
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 sm:p-6 rounded-xl shadow-sm border transition-colors duration-300">
          <div className="flex items-center gap-3 sm:gap-4">
            <Logo className="h-10 sm:h-12" />
            <div className="min-w-0 border-l pl-3 sm:pl-4">
              <p className="text-foreground font-medium text-sm sm:text-base truncate">Olá, {user.nome}</p>
              <p className="text-muted-foreground text-[10px] sm:text-xs truncate uppercase tracking-wider">{user.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 justify-end">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => setIsProfileModalOpen(true)} className="text-muted-foreground h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm">
              <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Perfil</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsLogoutDialogOpen(true)} className="text-muted-foreground h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm">
              <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </header>

        <Tabs defaultValue="calendar" className="w-full space-y-6">
          <div className="overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            <TabsList className={`inline-flex w-auto min-w-full sm:w-full sm:grid ${isAdmin ? 'sm:grid-cols-4 sm:max-w-xl' : 'sm:grid-cols-3 sm:max-w-md'} h-10 sm:h-11 p-1`}>
              <TabsTrigger value="calendar" className="flex items-center gap-2 whitespace-nowrap px-3 sm:px-4">
                <Calendar className="h-4 w-4 shrink-0" /> <span className="text-xs sm:text-sm">Calendário</span>
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="flex items-center gap-2 whitespace-nowrap px-3 sm:px-4">
                <LayoutDashboard className="h-4 w-4 shrink-0" /> <span className="text-xs sm:text-sm">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2 whitespace-nowrap px-3 sm:px-4">
                <FileText className="h-4 w-4 shrink-0" /> <span className="text-xs sm:text-sm">Relatórios</span>
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="users" className="flex items-center gap-2 whitespace-nowrap px-3 sm:px-4">
                  <Users className="h-4 w-4 shrink-0" /> <span className="text-xs sm:text-sm">Usuários</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="calendar" className="border-none p-0 outline-none">
            <CalendarView />
          </TabsContent>

          <TabsContent value="dashboard" className="border-none p-0 outline-none">
            <Dashboard />
          </TabsContent>

          <TabsContent value="reports" className="border-none p-0 outline-none">
            <Reports />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="users" className="border-none p-0 outline-none">
              <UserManagement />
            </TabsContent>
          )}
        </Tabs>
        <Footer />
      </motion.div>

      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-primary" /> Meu Perfil
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="profile-nome">Nome</Label>
              <Input 
                id="profile-nome" 
                className="h-10"
                value={profileNome} 
                onChange={(e) => setProfileNome(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">E-mail</Label>
              <Input 
                id="profile-email" 
                value={user?.email} 
                disabled 
                className="bg-muted"
              />
              <p className="text-[10px] text-muted-foreground italic">O e-mail não pode ser alterado pelo usuário.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-nascimento">Data de Nascimento (Opcional)</Label>
              <div className="relative">
                <Cake className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="profile-nascimento" 
                  type="date"
                  className="pl-10 h-10"
                  value={profileDataNascimento} 
                  onChange={(e) => setProfileDataNascimento(e.target.value)} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-password">Nova Senha (deixe em branco para manter)</Label>
              <Input 
                id="profile-password" 
                type="password" 
                className="h-10"
                value={profilePassword} 
                onChange={(e) => setProfilePassword(e.target.value)} 
              />
            </div>
            <div className="flex items-center justify-between space-x-2 py-2 border-t pt-4">
              <div className="space-y-0.5">
                <Label htmlFor="notif-email">Lembretes por E-mail</Label>
                <p className="text-[10px] text-muted-foreground">Receba um lembrete 1 hora antes do compromisso.</p>
              </div>
              <Switch 
                id="notif-email" 
                checked={profileNotificacaoEmail} 
                onCheckedChange={setProfileNotificacaoEmail} 
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsProfileModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={profileLoading}>
                {profileLoading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-destructive" /> Confirmar Saída
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja sair do sistema?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster position="top-right" />
    </div>
  );
}
