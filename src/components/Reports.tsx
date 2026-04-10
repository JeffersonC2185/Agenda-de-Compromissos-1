import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Compromisso } from '@/src/types';
import axios from 'axios';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Search } from 'lucide-react';

export default function Reports() {
  const [dataInicio, setDataInicio] = useState(format(new Date(), 'yyyy-MM-01'));
  const [dataFim, setDataFim] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [compromissos, setCompromissos] = useState<Compromisso[]>([]);

  const fetchRelatorio = async () => {
    try {
      const response = await axios.get(`/api/relatorios?dataInicio=${dataInicio}&dataFim=${dataFim}`);
      setCompromissos(response.data);
    } catch (error) {
      console.error('Erro ao buscar relatório');
    }
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
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Título</TableHead>
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
                    <TableCell>
                      <Badge variant={c.status === 'concluido' ? 'default' : 'secondary'}>
                        {c.status === 'concluido' ? 'Concluído' : 'Pendente'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
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
