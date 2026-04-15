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
import { FileText, Search, Download, User as UserIcon, Filter, ArrowUpDown, ArrowUp, ArrowDown, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const title = "Relatório de Compromissos";
    const period = `Período: ${format(new Date(dataInicio + 'T12:00:00'), 'dd/MM/yyyy')} até ${format(new Date(dataFim + 'T12:00:00'), 'dd/MM/yyyy')}`;
    
    // Header
    doc.setFontSize(18);
    doc.setTextColor(0, 166, 80); // SegNorte Green
    doc.text(title, 14, 20);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(period, 14, 28);
    
    if (isAdmin && filtroUsuario !== 'todos') {
      const userNome = usuarios.find(u => u.id.toString() === filtroUsuario)?.nome || '';
      doc.text(`Filtro Usuário: ${userNome}`, 14, 34);
    }

    const tableColumn = ["Data", "Hora", "Título", "Descrição", "Usuário", "Retroativo", "Status"];
    const tableRows = sortedCompromissos.map(c => {
      const dateParts = c.data.split('T')[0].split('-');
      const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
      
      return [
        formattedDate,
        c.hora,
        c.titulo,
        c.descricao || '',
        c.user?.nome || 'N/A',
        c.retroativo ? 'Sim' : 'Não',
        c.status === 'concluido' ? 'Concluído' : 'Pendente'
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: isAdmin && filtroUsuario !== 'todos' ? 40 : 35,
      theme: 'striped',
      headStyles: { fillColor: [0, 166, 80], textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 25 }, // Data
        1: { cellWidth: 20 }, // Hora
        2: { cellWidth: 45 }, // Título
        3: { cellWidth: 'auto' }, // Descrição (flex)
        4: { cellWidth: 35 }, // Usuário
        5: { cellWidth: 20 }, // Retroativo
        6: { cellWidth: 25 }, // Status
      },
      didDrawPage: (data) => {
        // Footer
        const str = `Página ${data.pageNumber}`;
        doc.setFontSize(10);
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        doc.text(str, data.settings.margin.left, pageHeight - 10);
      }
    });

    doc.save(`relatorio_compromissos_${dataInicio}_a_${dataFim}.pdf`);
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
        <div className="flex flex-wrap items-end gap-4 mb-8">
          <div className="flex flex-col gap-2 min-w-[160px]">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Data Inicial</Label>
            <Input
              type="date"
              className="!h-10 !py-0 text-sm border-muted-foreground/20 focus:border-primary transition-all"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2 min-w-[160px]">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Data Final</Label>
            <Input
              type="date"
              className="!h-10 !py-0 text-sm border-muted-foreground/20 focus:border-primary transition-all"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>
          
          {isAdmin && (
            <div className="flex flex-col gap-2 min-w-[200px]">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Usuário</Label>
              <Select value={filtroUsuario} onValueChange={setFiltroUsuario}>
                <SelectTrigger className="w-full !h-10 !py-0 text-sm border-muted-foreground/20 focus:border-primary transition-all">
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

          <div className="flex flex-col gap-2 min-w-[160px]">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Status</Label>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-full !h-10 !py-0 text-sm border-muted-foreground/20 focus:border-primary transition-all">
                <SelectValue placeholder="Todos os Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider invisible hidden sm:block">Ações</Label>
            <div className="flex gap-2">
              <Button 
                onClick={fetchRelatorio} 
                className="!h-10 px-6 font-semibold shadow-sm hover:shadow-md transition-all"
              >
                <Search className="mr-2 h-4 w-4" /> Filtrar
              </Button>
              <Button 
                variant="outline" 
                onClick={exportToExcel} 
                disabled={compromissos.length === 0} 
                className="!h-10 px-4 border-muted-foreground/20 hover:bg-muted transition-all"
              >
                <Download className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Exportar</span> XLSX
              </Button>
              <Button 
                variant="outline" 
                onClick={exportToPDF} 
                disabled={compromissos.length === 0} 
                className="!h-10 px-4 border-muted-foreground/20 hover:bg-muted transition-all"
              >
                <FileDown className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Exportar</span> PDF
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
                      <Badge variant={c.status === 'concluido' ? 'default' : 'warning'}>
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
