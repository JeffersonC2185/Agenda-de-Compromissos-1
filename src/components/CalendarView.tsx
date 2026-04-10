import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Compromisso } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CheckCircle, Trash2, Edit, Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AppointmentForm from './AppointmentForm';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { format, addHours } from 'date-fns';
import api from '@/src/lib/api';

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
  const [selectedAppointment, setSelectedAppointment] = useState<Partial<Compromisso> | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState<Compromisso | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRetroactiveModalOpen, setIsRetroactiveModalOpen] = useState(false);
  const [pendingAppointmentData, setPendingAppointmentData] = useState<Partial<Compromisso> | null>(null);
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [currentCalendarYear, setCurrentCalendarYear] = useState(new Date().getFullYear());
  const calendarRef = useRef<FullCalendar>(null);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'administrador';

  const fetchCompromissos = async () => {
    try {
      const response = await api.get('/compromissos');
      const formattedEvents = response.data.map((c: Compromisso) => {
        const isOwner = c.userId === user.id;
        return {
          id: c.id.toString(),
          title: isAdmin && !isOwner ? `[${c.user?.nome}] ${c.titulo}` : c.titulo,
          start: `${c.data.split('T')[0]}T${c.hora}`,
          backgroundColor: c.status === 'concluido' ? '#10b981' : (isOwner ? '#3b82f6' : '#94a3b8'),
          borderColor: c.status === 'concluido' ? '#10b981' : (isOwner ? '#3b82f6' : '#94a3b8'),
          extendedProps: c,
        };
      });
      setEvents(formattedEvents);
    } catch (error) {
      toast.error('Erro ao carregar compromissos');
    }
  };

  useEffect(() => {
    fetchCompromissos();
  }, []);

  const handleDateClick = (arg: any) => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    const defaultTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    setSelectedAppointment({
      id: 0,
      titulo: '',
      descricao: '',
      data: arg.dateStr,
      hora: defaultTime,
      status: 'pendente',
      retroativo: false,
      userId: user.id
    });
    setIsModalOpen(true);
  };

  const handleEventClick = (arg: any) => {
    setCurrentAppointment(arg.event.extendedProps);
    setIsViewModalOpen(true);
  };

  const handleSave = async (data: Partial<Compromisso>) => {
    const now = new Date();
    const appointmentDate = new Date(`${data.data}T${data.hora}`);

    // Check if it's a new appointment and if it's in the past
    if (!selectedAppointment || selectedAppointment.id === 0) {
      if (appointmentDate < now) {
        setPendingAppointmentData(data);
        setIsRetroactiveModalOpen(true);
        return;
      }
    } else {
      // If updating an existing appointment
      // If it was retroactive and now it's in the future (or present), set retroativo to false
      if (appointmentDate >= now) {
        data.retroativo = false;
      }
    }
    
    await executeSave(data);
  };

  const executeSave = async (data: Partial<Compromisso>) => {
    try {
      if (selectedAppointment && selectedAppointment.id !== 0) {
        await api.put(`/compromissos/${selectedAppointment.id}`, data);
        toast.success('Compromisso atualizado!');
      } else {
        await api.post('/compromissos', data);
        toast.success('Compromisso criado!');
      }
      setIsModalOpen(false);
      fetchCompromissos();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar compromisso');
    }
  };

  const confirmRetroactive = async () => {
    if (pendingAppointmentData) {
      await executeSave({ ...pendingAppointmentData, retroativo: true });
      setIsRetroactiveModalOpen(false);
      setPendingAppointmentData(null);
    }
  };

  const handleConcluir = async (id: number) => {
    try {
      await api.patch(`/compromissos/${id}/concluir`);
      toast.success('Compromisso concluído!');
      setIsViewModalOpen(false);
      fetchCompromissos();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao concluir compromisso');
    }
  };

  const handleDelete = async () => {
    if (!currentAppointment) return;
    try {
      await api.delete(`/compromissos/${currentAppointment.id}`);
      toast.success('Compromisso excluído!');
      setIsDeleteDialogOpen(false);
      setIsViewModalOpen(false);
      fetchCompromissos();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao excluir compromisso');
    }
  };

  const handleEdit = () => {
    if (currentAppointment?.userId !== user.id) {
      toast.error('Você só pode editar seus próprios compromissos');
      return;
    }
    setSelectedAppointment(currentAppointment);
    setIsViewModalOpen(false);
    setIsModalOpen(true);
  };

  const isOwner = currentAppointment?.userId === user.id;

  const handleYearSelect = (year: number) => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      const currentDate = calendarApi.getDate();
      const newDate = new Date(currentDate);
      newDate.setFullYear(year);
      calendarApi.gotoDate(newDate);
      setIsYearModalOpen(false);
    }
  };

  const years = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i);

  const handleDatesSet = (arg: any) => {
    setCurrentCalendarYear(arg.view.currentStart.getFullYear());
    // Update the custom title button text
    setTimeout(() => {
      const titleBtn = document.querySelector('.fc-calendarTitle-button');
      if (titleBtn) {
        titleBtn.textContent = arg.view.title;
      }
    }, 0);
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="calendar-container">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'today,dayGridMonth,timeGridWeek,timeGridDay',
              center: 'prev,calendarTitle,next',
              right: 'novoCompromisso'
            }}
            customButtons={{
              novoCompromisso: {
                text: 'Novo Compromisso',
                click: () => {
                  const now = new Date();
                  now.setHours(now.getHours() + 1);
                  const defaultTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                  
                  setSelectedAppointment({
                    id: 0,
                    titulo: '',
                    descricao: '',
                    data: format(new Date(), 'yyyy-MM-dd'),
                    hora: defaultTime,
                    status: 'pendente',
                    retroativo: false,
                    userId: user.id
                  });
                  setIsModalOpen(true);
                }
              },
              calendarTitle: {
                text: '', // Will be updated in datesSet
                click: () => setIsYearModalOpen(true)
              }
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
            datesSet={handleDatesSet}
            height="auto"
          />
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="pr-8">
                {selectedAppointment && selectedAppointment.id !== 0 ? 'Editar Compromisso' : 'Novo Compromisso'}
              </DialogTitle>
            </DialogHeader>
            <AppointmentForm
              appointment={selectedAppointment}
              onSave={handleSave}
              onCancel={() => setIsModalOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Year Selection Modal */}
        <Dialog open={isYearModalOpen} onOpenChange={setIsYearModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Selecionar Ano</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-2 py-4">
              {years.map((year) => (
                <Button
                  key={year}
                  variant={currentCalendarYear === year ? "default" : "outline"}
                  onClick={() => handleYearSelect(year)}
                  className="w-full"
                >
                  {year}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* View Details Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex flex-col gap-1 pr-8">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">{currentAppointment?.titulo}</span>
                  <Badge 
                    variant="outline" 
                    className={`shrink-0 ${
                      currentAppointment?.status === 'concluido' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                        : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                    }`}
                  >
                    {currentAppointment?.status === 'concluido' ? 'Concluído' : 'Pendente'}
                  </Badge>
                </div>
                {isAdmin && !isOwner && (
                  <span className="text-xs font-normal text-muted-foreground">
                    Usuário: {currentAppointment?.user?.nome} ({currentAppointment?.user?.email})
                  </span>
                )}
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
              {currentAppointment?.retroativo && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-xs text-amber-700 font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Criado de forma retroativa
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Descrição</p>
                <p className="text-sm">{currentAppointment?.descricao || 'Sem descrição'}</p>
              </div>
              
              {isOwner ? (
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
              ) : (
                <div className="pt-4 p-3 bg-slate-50 rounded-md text-xs text-slate-500 italic">
                  Visualização apenas (compromisso de outro usuário)
                </div>
              )}
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
        
        <AlertDialog open={isRetroactiveModalOpen} onOpenChange={setIsRetroactiveModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Compromisso Retroativo</AlertDialogTitle>
              <AlertDialogDescription>
                A data e hora selecionadas já passaram. Deseja continuar e criar este compromisso de forma retroativa?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPendingAppointmentData(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmRetroactive}>
                Sim, Criar Retroativo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
