import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CalendarView from './components/CalendarView';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import { Toaster } from '@/components/ui/sonner';
import { Calendar, LayoutDashboard, FileText } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto space-y-8"
      >
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Agenda de Compromissos</h1>
            <p className="text-slate-500">Gerencie seus compromissos de forma simples e organizada.</p>
          </div>
        </header>

        <Tabs defaultValue="calendar" className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Calendário
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> Relatórios
            </TabsTrigger>
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
        </Tabs>
      </motion.div>
      <Toaster position="top-right" />
    </div>
  );
}
