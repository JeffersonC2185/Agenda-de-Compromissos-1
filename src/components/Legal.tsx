import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, FileText, MessageCircle, ArrowLeft, Lock, Users, Globe, Smartphone } from 'lucide-react';
import Logo from './Logo';

interface LegalProps {
  onBack: () => void;
}

export default function Legal({ onBack }: LegalProps) {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <Logo className="h-10" />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Política de Privacidade e Termos de Uso</h1>
          <p className="text-muted-foreground">O SegAgenda respeita sua privacidade e garante a segurança dos seus dados.</p>
        </div>

        <div className="grid gap-8">
          {/* Política de Privacidade */}
          <Card className="border-none shadow-md">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Shield className="h-5 w-5" /> Política de Privacidade
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6 text-sm leading-relaxed">
              <section className="space-y-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" /> Coleta de Dados
                </h3>
                <p>
                  Coletamos informações essenciais para o funcionamento do sistema, como seu <strong>nome, e-mail e data de nascimento</strong>. 
                  Esses dados são fornecidos voluntariamente por você no momento do cadastro.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" /> Uso das Informações
                </h3>
                <p>
                  Seus dados são utilizados exclusivamente para:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Gerenciamento de seus compromissos e agendamentos.</li>
                  <li>Envio de notificações de lembrete via e-mail.</li>
                  <li>Autenticação e segurança da sua conta.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" /> Segurança e Compartilhamento
                </h3>
                <p>
                  Implementamos medidas de segurança rigorosas para proteger seus dados contra acesso não autorizado. 
                  <strong> Não compartilhamos, vendemos ou alugamos seus dados pessoais para terceiros</strong> sem o seu consentimento explícito.
                </p>
              </section>
            </CardContent>
          </Card>

          {/* Termos de Uso */}
          <Card className="border-none shadow-md">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="flex items-center gap-2 text-primary">
                <FileText className="h-5 w-5" /> Termos de Uso
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6 text-sm leading-relaxed">
              <section className="space-y-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Responsabilidade do Usuário
                </h3>
                <p>
                  O uso do sistema é de inteira responsabilidade do usuário. Você se compromete a fornecer informações verídicas 
                  e a manter a confidencialidade de sua senha de acesso.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-primary" /> Suspensão e Atualizações
                </h3>
                <p>
                  O SegAgenda reserva-se o direito de suspender contas que violem as regras de conduta ou façam uso indevido do sistema. 
                  Atualizações e melhorias podem ocorrer periodicamente para garantir a melhor experiência possível.
                </p>
              </section>
            </CardContent>
          </Card>

          {/* Suporte */}
          <Card className="border-primary/20 bg-primary/5 shadow-lg overflow-hidden">
            <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <h2 className="text-2xl font-bold">Precisa de ajuda?</h2>
                <p className="text-muted-foreground">Nossa equipe de suporte está pronta para atender você via WhatsApp.</p>
              </div>
              <Button 
                size="lg" 
                className="bg-[#25D366] hover:bg-[#20ba5a] text-white gap-2 h-14 px-8 text-lg font-bold shadow-xl transition-all hover:scale-105"
                onClick={() => window.open('https://wa.me/5588996199067', '_blank')}
              >
                <MessageCircle className="h-6 w-6" /> Falar no WhatsApp
              </Button>
            </div>
          </Card>
        </div>

        <footer className="text-center py-8 text-muted-foreground text-xs">
          &copy; {new Date().getFullYear()} SegAgenda. Todos os direitos reservados.
        </footer>
      </div>
    </div>
  );
}
