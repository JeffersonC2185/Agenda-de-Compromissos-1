import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Compromisso } from '@/src/types';
import api from '@/src/lib/api';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Search, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Reports() {
  const [dataInicio, setDataInicio] = useState(format(new Date(), 'yyyy-MM-01'));
  const [dataFim, setDataFim] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [compromissos, setCompromissos] = useState<Compromisso[]>([]);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'administrador';

  const fetchRelatorio = async () => {
    try {
      const response = await api.get(`/relatorios?dataInicio=${dataInicio}&dataFim=${dataFim}`);
      setCompromissos(response.data);
    } catch (error) {
      console.error('Erro ao buscar relatório');
    }
  };

  const exportToExcel = () => {
    const exportData = compromissos.map(c => ({
      'Data': new Date(c.data).toLocaleDateString('pt-BR'),
      'Hora': c.hora,
      'Título': c.titulo,
      'Descrição': c.descricao || '',
      'Usuário': c.user?.nome || 'N/A',
      'Retroativo': c.retroativo ? 'Sim' : 'Não',
      'Status': c.status === 'concluido' ? 'Concluído' : 'Pendente'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");
    XLSX.writeFile(workbook, `relatorio_compromissos_${dataInicio}_a_${dataFim}.xlsx`);
  };

  useEffect(() => {
    fetchRelatorio();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" /> Relatórios de Compromissos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div className="space-y-2">
            <Label>Data Inicial</Label>
            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Data Final</Label>
            <Input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>
          <Button onClick={fetchRelatorio}>
            <Search className="mr-2 h-4 w-4" /> Filtrar
          </Button>
          <Button variant="outline" onClick={exportToExcel} disabled={compromissos.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Exportar XLSX
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Título</TableHead>
                {isAdmin && <TableHead>Usuário</TableHead>}
                <TableHead>Retroativo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compromissos.length > 0 ? (
                compromissos.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{new Date(c.data).toLocaleDateString('pt-BR')}</TableCell>
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
