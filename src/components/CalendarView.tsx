import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Compromisso } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CheckCircle, Trash2, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AppointmentForm from './AppointmentForm';
import axios from 'axios';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

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

export default function CalendarView() {
  const [events, setEvents] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Compromisso | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState<Compromisso | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchCompromissos = async () => {
    try {
      const response = await axios.get('/api/compromissos');
      const formattedEvents = response.data.map((c: Compromisso) => ({
        id: c.id.toString(),
        title: c.titulo,
        start: `${c.data.split('T')[0]}T${c.hora}`,
        backgroundColor: c.status === 'concluido' ? '#10b981' : '#3b82f6',
        borderColor: c.status === 'concluido' ? '#10b981' : '#3b82f6',
        extendedProps: c,
      }));
      setEvents(formattedEvents);
    } catch (error) {
      toast.error('Erro ao carregar compromissos');
    }
  };

  useEffect(() => {
    fetchCompromissos();
  }, []);

  const handleDateClick = (arg: any) => {
    setSelectedAppointment(null);
    setIsModalOpen(true);
  };

  const handleEventClick = (arg: any) => {
    setCurrentAppointment(arg.event.extendedProps);
    setIsViewModalOpen(true);
  };

  const handleSave = async (data: Partial<Compromisso>) => {
    try {
      if (selectedAppointment) {
        await axios.put(`/api/compromissos/${selectedAppointment.id}`, data);
        toast.success('Compromisso atualizado!');
      } else {
        await axios.post('/api/compromissos', data);
        toast.success('Compromisso criado!');
      }
      setIsModalOpen(false);
      fetchCompromissos();
    } catch (error) {
      toast.error('Erro ao salvar compromisso');
    }
  };

  const handleConcluir = async (id: number) => {
    try {
      await axios.patch(`/api/compromissos/${id}/concluir`);
      toast.success('Compromisso concluído!');
      setIsViewModalOpen(false);
      fetchCompromissos();
    } catch (error) {
      toast.error('Erro ao concluir compromisso');
    }
  };

  const handleDelete = async () => {
    if (!currentAppointment) return;
    try {
      await axios.delete(`/api/compromissos/${currentAppointment.id}`);
      toast.success('Compromisso excluído!');
      setIsDeleteDialogOpen(false);
      setIsViewModalOpen(false);
      fetchCompromissos();
    } catch (error) {
      toast.error('Erro ao excluir compromisso');
    }
  };

  const handleEdit = () => {
    setSelectedAppointment(currentAppointment);
    setIsViewModalOpen(false);
    setIsModalOpen(true);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Calendário de Compromissos</CardTitle>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger>
            <Button onClick={() => setSelectedAppointment(null)}>
              <Plus className="mr-2 h-4 w-4" /> Novo Compromisso
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedAppointment ? 'Editar Compromisso' : 'Novo Compromisso'}</DialogTitle>
            </DialogHeader>
            <AppointmentForm
              appointment={selectedAppointment}
              onSave={handleSave}
              onCancel={() => setIsModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="calendar-container">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            locale="pt-br"
            buttonText={{
              today: 'Hoje',
              month: 'Mês',
              week: 'Semana',
              day: 'Dia'
            }}
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            height="auto"
          />
        </div>

        {/* View Details Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{currentAppointment?.titulo}</span>
                <Badge variant={currentAppointment?.status === 'concluido' ? 'default' : 'secondary'}>
                  {currentAppointment?.status === 'concluido' ? 'Concluído' : 'Pendente'}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data</p>
                  <p>{currentAppointment && new Date(currentAppointment.data).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Hora</p>
                  <p>{currentAppointment?.hora}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Descrição</p>
                <p className="text-sm">{currentAppointment?.descricao || 'Sem descrição'}</p>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" size="icon" onClick={() => setIsDeleteDialogOpen(true)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
                {currentAppointment?.status === 'pendente' && (
                  <Button onClick={() => handleConcluir(currentAppointment!.id)}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Concluir
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o compromisso.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
