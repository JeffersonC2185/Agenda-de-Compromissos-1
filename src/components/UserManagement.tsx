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
        dataNascimento: editDataNascimento || null
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
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" className="h-10" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" className="h-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" className="h-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nascimento">Nascimento (Opcional)</Label>
              <Input id="nascimento" type="date" className="h-10" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Tipo</Label>
              <Select value={role} onValueChange={(val: any) => setRole(val)}>
                <SelectTrigger id="role" className="w-full h-10 flex items-center">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="administrador">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="invisible">Ação</Label>
              <Button type="submit" className="w-full h-10" disabled={loading}>
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
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.nome}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'administrador' ? 'default' : 'secondary'}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.ativo ? 'outline' : 'destructive'} className={u.ativo ? 'border-emerald-500 text-emerald-600' : ''}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(u)}
                          title="Editar Usuário"
                        >
                          <Edit className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleStatus(u.id)}
                          title={u.ativo ? 'Desativar' : 'Ativar'}
                        >
                          {u.ativo ? <PowerOff className="h-4 w-4 text-destructive" /> : <Power className="h-4 w-4 text-emerald-500" />}
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
