import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Info, Calendar, Clock, CheckCircle, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-12 pb-8 border-t pt-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Info className="h-5 w-5" />
              <span>Como Usar</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nossa agenda permite que você organize seus compromissos de forma simples e eficiente. 
              Acompanhe suas tarefas diárias, semanais ou mensais com facilidade.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-foreground font-medium text-sm">
              <Calendar className="h-4 w-4" />
              <span>Agendamento</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Clique em qualquer data no calendário para criar um novo compromisso. Preencha o título, 
              hora e descrição para salvar.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-foreground font-medium text-sm">
              <Clock className="h-4 w-4" />
              <span>Retroativos</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Se você agendar algo no passado, o sistema solicitará confirmação e marcará o 
              evento como "Retroativo" para seu controle.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-foreground font-medium text-sm">
              <CheckCircle className="h-4 w-4" />
              <span>Conclusão</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Marque seus compromissos como concluídos para manter seu dashboard atualizado 
              e visualizar seu progresso em tempo real.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            <span>Sistema Seguro & Gerenciamento de Agenda Profissional</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Agenda de Compromissos. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
