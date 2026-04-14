import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Compromisso, User } from '@/src/types';
import api from '@/src/lib/api';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Search, Download, User as UserIcon, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import * as XLSX from 'xlsx';

type SortConfig = {
  key: keyof Compromisso | 'usuario';
  direction: 'asc' | 'desc';
} | null;

export default function Reports() {
  const [dataInicio, setDataInicio] = useState(format(new Date(), 'yyyy-MM-01'));
  const [dataFim, setDataFim] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [compromissos, setCompromissos] = useState<Compromisso[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [filtroUsuario, setFiltroUsuario] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'administrador';

  const fetchUsuarios = async () => {
    if (!isAdmin) return;
    try {
      const response = await api.get('/users');
      setUsuarios(response.data);
    } catch (error) {
      console.error('Erro ao buscar usuários');
    }
  };

  const fetchRelatorio = async () => {
    try {
      let url = `/relatorios?dataInicio=${dataInicio}&dataFim=${dataFim}`;
      // Ensure admin can filter by user, but if 'todos' is selected, it should show all (handled by backend)
      if (isAdmin && filtroUsuario !== 'todos') url += `&userId=${filtroUsuario}`;
      if (filtroStatus !== 'todos') url += `&status=${filtroStatus}`;
      
      const response = await api.get(url);
      setCompromissos(response.data);
    } catch (error) {
      console.error('Erro ao buscar relatório');
    }
  };

  const exportToExcel = () => {
    const exportData = compromissos.map(c => {
      // Use split('T')[0] and split('-') to avoid timezone shifts
      const dateParts = c.data.split('T')[0].split('-');
      const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
      
      return {
        'Data': formattedDate,
        'Hora': c.hora,
        'Título': c.titulo,
        'Descrição': c.descricao || '',
        'Usuário': c.user?.nome || 'N/A',
        'Retroativo': c.retroativo ? 'Sim' : 'Não',
        'Status': c.status === 'concluido' ? 'Concluído' : 'Pendente'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");
    XLSX.writeFile(workbook, `relatorio_compromissos_${dataInicio}_a_${dataFim}.xlsx`);
  };

  useEffect(() => {
    fetchRelatorio();
    if (isAdmin) fetchUsuarios();
  }, []);

  const handleSort = (key: keyof Compromisso | 'usuario') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedCompromissos = React.useMemo(() => {
    if (!sortConfig) return compromissos;

    return [...compromissos].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortConfig.key === 'usuario') {
        aValue = a.user?.nome || '';
        bValue = b.user?.nome || '';
      } else {
        aValue = a[sortConfig.key] || '';
        bValue = b[sortConfig.key] || '';
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [compromissos, sortConfig]);

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" /> Relatórios de Compromissos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-4 mb-6">
          <div className="flex flex-col space-y-2 w-full sm:w-auto">
            <Label>Data Inicial</Label>
            <Input
              type="date"
              className="w-full sm:w-[150px] h-10 px-3"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </div>
          <div className="flex flex-col space-y-2 w-full sm:w-auto">
            <Label>Data Final</Label>
            <Input
              type="date"
              className="w-full sm:w-[150px] h-10 px-3"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>
          
          {isAdmin && (
            <div className="flex flex-col space-y-2 w-full sm:w-auto">
              <Label>Usuário</Label>
              <Select value={filtroUsuario} onValueChange={setFiltroUsuario}>
                <SelectTrigger className="w-full sm:w-[180px] h-10 px-3 py-2">
                  <SelectValue placeholder="Todos os Usuários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Usuários</SelectItem>
                  {usuarios.map(u => (
                    <SelectItem key={u.id} value={u.id.toString()}>{u.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col space-y-2 w-full sm:w-auto">
            <Label>Status</Label>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-full sm:w-[150px] h-10 px-3 py-2">
                <SelectValue placeholder="Todos os Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col space-y-2 w-full sm:w-auto">
            <Label className="hidden sm:block invisible">Ações &nbsp;</Label>
            <div className="flex gap-2">
              <Button onClick={fetchRelatorio} className="flex-1 sm:flex-none h-10">
                <Search className="mr-2 h-4 w-4" /> Filtrar
              </Button>
              <Button variant="outline" onClick={exportToExcel} disabled={compromissos.length === 0} className="flex-1 sm:flex-none h-10">
                <Download className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Exportar</span> XLSX
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-md border overflow-x-auto scrollbar-hide">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('data')}>
                  <div className="flex items-center">Data {getSortIcon('data')}</div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('hora')}>
                  <div className="flex items-center">Hora {getSortIcon('hora')}</div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('titulo')}>
                  <div className="flex items-center">Título {getSortIcon('titulo')}</div>
                </TableHead>
                {isAdmin && (
                  <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('usuario')}>
                    <div className="flex items-center">Usuário {getSortIcon('usuario')}</div>
                  </TableHead>
                )}
                <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('retroativo')}>
                  <div className="flex items-center">Retroativo {getSortIcon('retroativo')}</div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('status')}>
                  <div className="flex items-center">Status {getSortIcon('status')}</div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCompromissos.length > 0 ? (
                sortedCompromissos.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      {(() => {
                        const dateParts = c.data.split('T')[0].split('-');
                        return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                      })()}
                    </TableCell>
                    <TableCell>{c.hora}</TableCell>
                    <TableCell className="font-medium">{c.titulo}</TableCell>
                    {isAdmin && <TableCell>{c.user?.nome || 'N/A'}</TableCell>}
                    <TableCell>
                      {c.retroativo ? (
                        <Badge variant="outline" className="text-amber-600 border-amber-600">Sim</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">Não</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.status === 'concluido' ? 'default' : 'secondary'}>
                        {c.status === 'concluido' ? 'Concluído' : 'Pendente'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-8 text-muted-foreground">
                    Nenhum compromisso encontrado para este período.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
