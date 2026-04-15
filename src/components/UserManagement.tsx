import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Users, Power, PowerOff, Edit, Cake, UserCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/src/lib/api';
import { User } from '@/src/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [role, setRole] = useState<'administrador' | 'cliente'>('cliente');
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit form states
  const [editNome, setEditNome] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editDataNascimento, setEditDataNascimento] = useState('');
  const [editRole, setEditRole] = useState<'administrador' | 'cliente'>('cliente');
  const [editNotificacaoEmail, setEditNotificacaoEmail] = useState(true);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      toast.error('Erro ao buscar usuários');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/users', { 
        nome, 
        email, 
        password, 
        role,
        dataNascimento: dataNascimento || null 
      });
      toast.success('Usuário criado com sucesso!');
      setNome('');
      setEmail('');
      setPassword('');
      setDataNascimento('');
      setRole('cliente');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: number) => {
    try {
      await api.patch(`/users/${id}/toggle-status`);
      toast.success('Status alterado!');
      fetchUsers();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditNome(user.nome);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditDataNascimento(user.dataNascimento ? user.dataNascimento.split('T')[0] : '');
    setEditNotificacaoEmail(user.notificacaoEmail ?? true);
    setEditPassword('');
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setLoading(true);
    try {
      const data: any = { 
        nome: editNome, 
        email: editEmail, 
        role: editRole,
        dataNascimento: editDataNascimento || null,
        notificacaoEmail: editNotificacaoEmail
      };
      if (editPassword) data.password = editPassword;
      
      await api.put(`/users/${editingUser.id}`, data);
      toast.success('Usuário atualizado com sucesso!');
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> Cadastrar Novo Usuário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser} className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
              <Label htmlFor="nome" className="text-xs text-muted-foreground uppercase tracking-wider">Nome Completo</Label>
              <Input 
                id="nome" 
                className="!h-11 !py-0 text-sm border-muted-foreground/20 focus:border-primary transition-all" 
                value={nome} 
                onChange={(e) => setNome(e.target.value)} 
                required 
                placeholder="Ex: João Silva"
              />
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
              <Label htmlFor="email" className="text-xs text-muted-foreground uppercase tracking-wider">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                className="!h-11 !py-0 text-sm border-muted-foreground/20 focus:border-primary transition-all" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="joao@exemplo.com"
              />
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-[150px]">
              <Label htmlFor="password" className="text-xs text-muted-foreground uppercase tracking-wider">Senha</Label>
              <Input 
                id="password" 
                type="password" 
                className="!h-11 !py-0 text-sm border-muted-foreground/20 focus:border-primary transition-all" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
              />
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-[150px]">
              <Label htmlFor="nascimento" className="text-xs text-muted-foreground uppercase tracking-wider">Nascimento</Label>
              <div className="relative">
                <Input 
                  id="nascimento" 
                  type="date" 
                  className="!h-11 !py-0 text-sm border-muted-foreground/20 focus:border-primary transition-all" 
                  value={dataNascimento} 
                  onChange={(e) => setDataNascimento(e.target.value)} 
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-[150px]">
              <Label htmlFor="role" className="text-xs text-muted-foreground uppercase tracking-wider">Tipo de Acesso</Label>
              <Select value={role} onValueChange={(val: any) => setRole(val)}>
                <SelectTrigger id="role" className="w-full !h-11 !py-0 text-sm border-muted-foreground/20 focus:border-primary transition-all">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="administrador">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="invisible hidden lg:block">Ação</Label>
              <Button type="submit" className="!h-11 px-8 font-semibold shadow-sm hover:shadow-md transition-all" disabled={loading}>
                {loading ? 'Criando...' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Lista de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto scrollbar-hide">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {u.nome.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground">{u.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="py-4">
                      <Badge 
                        variant={u.role === 'administrador' ? 'default' : 'secondary'}
                        className="capitalize font-medium px-2.5 py-0.5"
                      >
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge 
                        variant={u.ativo ? 'outline' : 'destructive'} 
                        className={u.ativo ? 'border-emerald-500/50 bg-emerald-500/5 text-emerald-600 font-medium px-2.5 py-0.5' : 'font-medium px-2.5 py-0.5'}
                      >
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 hover:bg-primary/10 hover:text-primary transition-colors"
                          onClick={() => openEditModal(u)}
                          title="Editar Usuário"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-9 w-9 transition-colors ${u.ativo ? 'hover:bg-destructive/10 hover:text-destructive' : 'hover:bg-emerald-500/10 hover:text-emerald-600'}`}
                          onClick={() => toggleStatus(u.id)}
                          title={u.ativo ? 'Desativar' : 'Ativar'}
                        >
                          {u.ativo ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-primary" /> Editar Usuário
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome</Label>
              <Input id="edit-nome" value={editNome} onChange={(e) => setEditNome(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">E-mail</Label>
              <Input id="edit-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-nascimento">Data de Nascimento (Opcional)</Label>
              <Input id="edit-nascimento" type="date" value={editDataNascimento} onChange={(e) => setEditDataNascimento(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Nova Senha (deixe em branco para manter)</Label>
              <Input id="edit-password" type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Tipo</Label>
              <Select value={editRole} onValueChange={(val: any) => setEditRole(val)}>
                <SelectTrigger id="edit-role" className="w-full h-10 flex items-center">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="administrador">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between space-x-2 py-2 border-t pt-4">
              <div className="space-y-0.5">
                <Label htmlFor="edit-notif-email">Lembretes por E-mail</Label>
                <p className="text-[10px] text-muted-foreground">Receba um lembrete 1 hora antes do compromisso.</p>
              </div>
              <Switch 
                id="edit-notif-email" 
                checked={editNotificacaoEmail} 
                onCheckedChange={setEditNotificacaoEmail} 
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
