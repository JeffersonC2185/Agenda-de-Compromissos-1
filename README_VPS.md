# Guia de Implantação em VPS (SegAgenda)

Este guia descreve como configurar e rodar a aplicação SegAgenda em sua própria VPS.

## Pré-requisitos

- Node.js (v18 ou superior)
- MySQL Server
- Gerenciador de processos (recomendado: PM2)

## Passos para Instalação

1. **Clonar o Repositório**
   ```bash
   git clone <seu-repositorio>
   cd segagenda
   ```

2. **Instalar Dependências**
   ```bash
   npm install
   ```

3. **Configurar Variáveis de Ambiente**
   Copie o arquivo `.env.example` para `.env` e preencha com suas informações:
   ```bash
   cp .env.example .env
   ```
   *Certifique-se de definir uma `JWT_SECRET` forte e a `DATABASE_URL` correta para seu MySQL.*

4. **Configurar o Banco de Dados**
   Execute o comando para sincronizar o esquema do Prisma com seu banco de Dados:
   ```bash
   npm run db:push
   ```

5. **Gerar o Build de Produção**
   ```bash
   npm run build
   ```

6. **Iniciar a Aplicação**

   **Opção A: Usando PM2 (Recomendado)**
   ```bash
   npm install -g pm2
   pm2 start tsx --name "segagenda" -- server.ts
   ```

   **Opção B: Usando NPM diretamente**
   ```bash
   NODE_ENV=production npm start
   ```

## Notas Adicionais

- **Porta:** Por padrão, a aplicação roda na porta `3000`. Você pode alterar isso no arquivo `.env`.
- **Nginx:** Recomendamos usar o Nginx como proxy reverso para apontar seu domínio para a porta `3000`.
- **SSL:** Use o Certbot para configurar o HTTPS em seu domínio.
