import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CalendarView from './components/CalendarView';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import UserManagement from './components/UserManagement';
import Login from './components/Login';
import Footer from './components/Footer';
import ThemeToggle from './components/ThemeToggle';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import api from '@/src/lib/api';
import { Calendar, LayoutDashboard, FileText, Users, LogOut, User as UserIcon, Settings, Cake, UserCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from './types';
import { Button } from '@/components/ui/button';
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
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setProfileNome(parsedUser.nome);
      if (parsedUser.dataNascimento) {
        setProfileDataNascimento(parsedUser.dataNascimento.split('T')[0]);
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (user: User, token: string) => {
    setUser(user);
    setProfileNome(user.nome);
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
      const data: any = { nome: profileNome };
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

  if (loading) return null;

  if (!user) {
    return (
      <div className="min-h-screen bg-background transition-colors duration-300">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Login onLogin={handleLogin} />
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
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-xl shadow-sm border transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Agenda de Compromissos</h1>
              <p className="text-muted-foreground text-sm">Olá, {user.nome} ({user.role})</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => setIsProfileModalOpen(true)} className="text-muted-foreground">
              <Settings className="h-4 w-4 mr-2" /> Perfil
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsLogoutDialogOpen(true)} className="text-muted-foreground">
              <LogOut className="h-4 w-4 mr-2" /> Sair
            </Button>
          </div>
        </header>

        <Tabs defaultValue="calendar" className="w-full space-y-6">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4 max-w-xl' : 'grid-cols-3 max-w-md'}`}>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Calendário
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> Relatórios
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Usuários
              </TabsTrigger>
            )}
          </TabsList>

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
              <UserCircle className="h-5 w-5 text-blue-600" /> Meu Perfil
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="profile-nome">Nome</Label>
              <Input 
                id="profile-nome" 
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
                  value={profileDataNascimento} 
                  onChange={(e) => setProfileDataNascimento(e.target.value)} 
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-password">Nova Senha (deixe em branco para manter)</Label>
              <Input 
                id="profile-password" 
                type="password" 
                value={profilePassword} 
                onChange={(e) => setProfilePassword(e.target.value)} 
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
