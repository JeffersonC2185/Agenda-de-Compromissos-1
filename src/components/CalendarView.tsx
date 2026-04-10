import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Compromisso } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CheckCircle, Trash2, Edit, Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Cake, CalendarDays, Bell, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AppointmentForm from './AppointmentForm';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { format, isToday, differenceInMinutes } from 'date-fns';
import api from '@/src/lib/api';
import axios from 'axios';

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
  const [appointmentEvents, setAppointmentEvents] = useState<any[]>([]);
  const [birthdayEvents, setBirthdayEvents] = useState<any[]>([]);
  const [holidayEvents, setHolidayEvents] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Partial<Compromisso> | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState<Compromisso | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRetroactiveModalOpen, setIsRetroactiveModalOpen] = useState(false);
  const [pendingAppointmentData, setPendingAppointmentData] = useState<Partial<Compromisso> | null>(null);
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [currentCalendarYear, setCurrentCalendarYear] = useState(new Date().getFullYear());
  const [notifiedIds, setNotifiedIds] = useState<Set<number>>(new Set());
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const calendarRef = useRef<FullCalendar>(null);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'administrador';

  useEffect(() => {
    setEvents([...appointmentEvents, ...birthdayEvents, ...holidayEvents]);
  }, [appointmentEvents, birthdayEvents, holidayEvents]);

  const fetchHolidays = async (startYear: number) => {
    try {
      const yearsToFetch = [startYear, startYear + 1, startYear + 2];
      const holidayPromises = yearsToFetch.map(year => 
        axios.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/BR`)
      );
      
      const responses = await Promise.all(holidayPromises);
      const allFormattedHolidays = responses.flatMap(response => 
        response.data.map((h: any) => ({
          id: `holiday-${h.date}-${h.name}`,
          title: `🇧🇷 ${h.localName}`,
          start: h.date,
          allDay: true,
          backgroundColor: '#94a3b8',
          borderColor: '#94a3b8',
          display: 'block',
          editable: false,
          extendedProps: { isHoliday: true }
        }))
      );
      setHolidayEvents(allFormattedHolidays);
    } catch (error) {
      console.error('Erro ao buscar feriados:', error);
    }
  };

  const fetchCompromissos = async () => {
    try {
      const [compRes, birthRes] = await Promise.all([
        api.get('/compromissos'),
        api.get('/birthdays')
      ]);
      
      const rawData = compRes.data;
      const birthData = birthRes.data;
      
      const formattedEvents = rawData.map((c: Compromisso) => {
        const isOwner = c.userId === user.id;
        return {
          id: `comp-${c.id}`,
          title: isAdmin && !isOwner ? `[${c.user?.nome}] ${c.titulo}` : c.titulo,
          start: `${c.data.split('T')[0]}T${c.hora}`,
          backgroundColor: c.status === 'concluido' ? '#10b981' : (isOwner ? '#3b82f6' : '#94a3b8'),
          borderColor: c.status === 'concluido' ? '#10b981' : (isOwner ? '#3b82f6' : '#94a3b8'),
          extendedProps: { ...c, isBirthday: false },
        };
      });

      // Add birthdays as events
      const formattedBirthdays = birthData.flatMap((u: any) => {
        const birthDate = new Date(u.dataNascimento);
        const month = birthDate.getUTCMonth();
        const day = birthDate.getUTCDate();
        
        // Show birthday for current year, previous and next to handle view transitions
        const currentYear = new Date().getFullYear();
        return [currentYear - 1, currentYear, currentYear + 1].map(year => ({
          id: `birth-${u.id}-${year}`,
          title: `🎂 Aniversário: ${u.nome}`,
          start: `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
          allDay: true,
          backgroundColor: '#f472b6',
          borderColor: '#f472b6',
          display: 'block',
          extendedProps: { isBirthday: true, userName: u.nome }
        }));
      });

      setAppointmentEvents(formattedEvents);
      setBirthdayEvents(formattedBirthdays);
      checkUpcomingAppointments(rawData);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    }
  };

  const checkUpcomingAppointments = (appointments: Compromisso[]) => {
    const now = new Date();
    const newNotifiedIds = new Set(notifiedIds);
    let hasNewNotification = false;

    appointments.forEach(c => {
      if (c.status === 'concluido' || c.userId !== user.id || notifiedIds.has(c.id)) return;

      const appDate = new Date(`${c.data.split('T')[0]}T${c.hora}`);
      const diffMinutes = differenceInMinutes(appDate, now);

      if (diffMinutes > 0 && diffMinutes <= 60) {
        toast.info(`Compromisso Próximo: "${c.titulo}" começa em ${diffMinutes} minutos!`, {
          icon: <Bell className="h-4 w-4 text-blue-500" />,
          duration: 10000,
          action: {
            label: 'Fechar',
            onClick: () => {}
          }
        });
        newNotifiedIds.add(c.id);
        hasNewNotification = true;
      } else if (isToday(appDate) && diffMinutes > 60) {
        // Only notify about "today" once at the start of the day or when fetched
        toast(`Lembrete: Você tem "${c.titulo}" hoje às ${c.hora}`, {
          icon: <CalendarIcon className="h-4 w-4 text-orange-500" />,
          action: {
            label: 'Fechar',
            onClick: () => {}
          }
        });
        newNotifiedIds.add(c.id);
        hasNewNotification = true;
      }
    });

    if (hasNewNotification) {
      setNotifiedIds(newNotifiedIds);
    }
  };

  useEffect(() => {
    fetchCompromissos();
    fetchHolidays(new Date().getFullYear());
    
    // Check for upcoming appointments every 5 minutes
    const interval = setInterval(() => {
      fetchCompromissos();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
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
    if (arg.event.extendedProps.isHoliday) {
      return;
    }
    if (arg.event.extendedProps.isBirthday) {
      toast.info(`Hoje é aniversário de ${arg.event.extendedProps.userName}! 🎂`, {
        icon: <Cake className="h-4 w-4 text-pink-500" />
      });
      return;
    }
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
    if (currentAppointment?.status === 'concluido') {
      toast.error('Compromissos concluídos não podem ser editados');
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
    const newYear = arg.view.currentStart.getFullYear();
    if (newYear !== currentCalendarYear) {
      setCurrentCalendarYear(newYear);
      // We still fetch a 3-year window starting from the current view year
      // to ensure the user always has context for the "next two years" from where they are
      fetchHolidays(newYear);
    }
    // Update the custom title button text and capitalize
    setTimeout(() => {
      const titleBtn = document.querySelector('.fc-calendarTitle-button');
      if (titleBtn) {
        const title = arg.view.title;
        titleBtn.textContent = title.charAt(0).toUpperCase() + title.slice(1);
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
              left: 'today prev,next',
              center: 'calendarTitle',
              right: 'dayGridMonth,timeGridWeek,timeGridDay novoCompromisso'
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
            allDayText="dia inteiro"
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
          <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 pr-8">
                <CalendarDays className="h-5 w-5 text-blue-600" />
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
              <DialogTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-blue-600" /> Selecionar Ano
              </DialogTitle>
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
          <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex flex-col gap-1 pr-8">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                    <Clock className="h-5 w-5 text-blue-600 shrink-0" />
                    <span className="truncate block">{currentAppointment?.titulo}</span>
                  </div>
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
                  <span className="text-xs font-normal text-muted-foreground break-all">
                    Usuário: {currentAppointment?.user?.nome} ({currentAppointment?.user?.email})
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">Data</p>
                  <p className="truncate">
                    {currentAppointment && (() => {
                      const dateParts = currentAppointment.data.split('T')[0].split('-');
                      return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                    })()}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">Hora</p>
                  <p className="truncate">{currentAppointment?.hora}</p>
                </div>
              </div>
              {currentAppointment?.retroativo && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-xs text-amber-700 font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3 shrink-0" /> Criado de forma retroativa
                  </p>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Descrição</p>
                <p className="text-sm break-words whitespace-pre-wrap">{currentAppointment?.descricao || 'Sem descrição'}</p>
              </div>
              
              {isOwner ? (
                <div className="flex flex-wrap justify-end gap-2 pt-4">
                  <Button variant="outline" size="icon" onClick={() => setIsDeleteDialogOpen(true)} className="shrink-0">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                  {currentAppointment?.status === 'pendente' && (
                    <>
                      <Button variant="outline" size="icon" onClick={handleEdit} className="shrink-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => handleConcluir(currentAppointment!.id)} className="flex-1 sm:flex-none">
                        <CheckCircle className="mr-2 h-4 w-4" /> Concluir
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <div className="pt-4 p-3 bg-slate-50 rounded-md text-xs text-slate-500 italic break-words">
                  Visualização apenas (compromisso de outro usuário)
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" /> Tem certeza?
              </AlertDialogTitle>
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
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" /> Compromisso Retroativo
              </AlertDialogTitle>
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
