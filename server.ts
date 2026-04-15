import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { PrismaClient, Role, UserStatus } from "@prisma/client";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";
import cron from "node-cron";
import { addHours, subMinutes, addMinutes } from "date-fns";

dotenv.config();

// Logger Helper
type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

function logger(level: LogLevel, context: string, message: string, data: any = null) {
  const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const dataStr = data ? ` | ${typeof data === 'object' ? JSON.stringify(data) : data}` : '';
  const logMessage = `[${timestamp}] [${level}] [${context}] ${message}${dataStr}`;
  
  if (level === 'ERROR') {
    console.error(logMessage);
  } else if (level === 'WARN') {
    console.warn(logMessage);
  } else {
    // Em produção, podemos silenciar DEBUG se necessário
    if (level === 'DEBUG' && process.env.NODE_ENV === 'production') return;
    console.log(logMessage);
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient({
  log: ['error', 'warn'],
  datasourceUrl: process.env.DATABASE_URL ? `${process.env.DATABASE_URL}${process.env.DATABASE_URL.includes('?') ? '&' : '?'}connection_limit=2&pool_timeout=20` : undefined
});
const app = express();

// Request Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger('INFO', 'HTTP', `${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendConfirmationEmail = async (email: string, token: string) => {
  const confirmLink = `${process.env.APP_URL || "http://localhost:3000"}/confirmar?token=${token}`;
  
  const mailOptions = {
    from: `"SegAgenda" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Confirmação de E-mail - SegAgenda",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
        <h2 style="color: #00a650;">Bem-vindo ao SegAgenda!</h2>
        <p>Para ativar sua conta e começar a gerenciar seus compromissos, clique no botão abaixo:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmLink}" style="background-color: #00a650; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Confirmar E-mail</a>
        </div>
        <p style="font-size: 12px; color: #64748b;">Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
        <p style="font-size: 12px; color: #64748b;">${confirmLink}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">Este link expira em 24 horas.</p>
      </div>
    `,
  };

  if (process.env.SMTP_HOST) {
    try {
      await transporter.sendMail(mailOptions);
      logger('INFO', 'EmailService', `E-mail de confirmação enviado para: ${email}`);
    } catch (error: any) {
      logger('ERROR', 'EmailService', `Erro ao enviar e-mail de confirmação para ${email}: ${error.message}`);
    }
  } else {
    logger('INFO', 'EmailService', 'SMTP não configurado. Simulação de envio de e-mail.', {
      to: email,
      link: confirmLink
    });
  }
};

const sendResetPasswordEmail = async (email: string, token: string) => {
  const resetLink = `${process.env.APP_URL || "http://localhost:3000"}/redefinir-senha?token=${token}`;
  
  const mailOptions = {
    from: `"SegAgenda" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Recuperação de senha - SegAgenda",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #00a650;">Recuperação de Senha</h2>
        <p>Olá!</p>
        <p>Recebemos uma solicitação para redefinir sua senha no SegAgenda.</p>
        <p>Clique no botão abaixo para criar uma nova senha:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #00a650; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Redefinir Senha</a>
        </div>
        <p style="font-size: 12px; color: #64748b;">Se você não solicitou isso, ignore este e-mail.</p>
        <p style="font-size: 12px; color: #64748b;">Este link expira em 1 hora.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">Atenciosamente,<br>Equipe SegAgenda</p>
      </div>
    `,
  };

  if (process.env.SMTP_HOST) {
    try {
      await transporter.sendMail(mailOptions);
      logger('INFO', 'EmailService', `E-mail de recuperação enviado para: ${email}`);
    } catch (error: any) {
      logger('ERROR', 'EmailService', `Erro ao enviar e-mail de recuperação para ${email}: ${error.message}`);
    }
  } else {
    logger('INFO', 'EmailService', 'SMTP não configurado. Simulação de envio de e-mail de recuperação.', {
      to: email,
      link: resetLink
    });
  }
};

app.use(cors());
app.use(express.json());

// Middleware de Autenticação
const authenticateToken = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Token não fornecido" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.user = user;
    next();
  });
};

// Middleware de Admin
const isAdmin = (req: any, res: Response, next: NextFunction) => {
  if (req.user.role !== "administrador") {
    return res.status(403).json({ error: "Acesso negado: apenas administradores" });
  }
  next();
};

// Auth Routes
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  logger('DEBUG', 'Auth', `Tentativa de login para: ${email}`);
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      logger('WARN', 'Auth', `Login falhou: Usuário não encontrado (${email})`);
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    if (user.status === UserStatus.pendente || !user.ativo) {
      logger('WARN', 'Auth', `Login falhou: Conta não ativada (${email})`);
      return res.status(401).json({ error: "Sua conta ainda não foi ativada. Verifique seu e-mail." });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      logger('WARN', 'Auth', `Login falhou: Senha incorreta (${email})`);
      return res.status(401).json({ error: "Senha incorreta" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, nome: user.nome },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    logger('INFO', 'Auth', `Login bem-sucedido: ${email} (ID: ${user.id})`);
    res.json({
      token,
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        nome: user.nome,
        dataNascimento: user.dataNascimento,
        notificacaoEmail: user.notificacaoEmail
      },
    });
  } catch (error: any) {
    logger('ERROR', 'Auth', `Erro no processo de login para ${email}: ${error.message}`);
    res.status(500).json({ error: "Erro no login" });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { nome, email, password } = req.body;
  logger('DEBUG', 'Auth', `Tentativa de registro para: ${email}`);
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      logger('WARN', 'Auth', `Registro falhou: E-mail já cadastrado (${email})`);
      return res.status(400).json({ error: "E-mail já cadastrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = uuidv4();
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    const newUser = await prisma.user.create({
      data: {
        nome,
        email,
        password: hashedPassword,
        role: "cliente",
        status: "pendente",
        ativo: false,
        tokenConfirmacao: token,
        tokenExpiracao: expires,
      },
    });

    logger('INFO', 'Auth', `Novo usuário registrado: ${email} (ID: ${newUser.id})`);
    await sendConfirmationEmail(email, token);

    res.status(201).json({ message: "Cadastro realizado! Verifique seu e-mail para ativar sua conta." });
  } catch (error: any) {
    logger('ERROR', 'Auth', `Erro no registro de usuário (${email}): ${error.message}`);
    res.status(500).json({ error: "Erro ao realizar cadastro" });
  }
});

app.get("/api/auth/confirmar", async (req, res) => {
  const { token } = req.query;
  try {
    const user = await prisma.user.findUnique({ where: { tokenConfirmacao: token as string } });
    if (!user) {
      return res.status(400).json({ error: "Token de confirmação inválido ou já utilizado." });
    }

    if (user.tokenExpiracao && new Date() > user.tokenExpiracao) {
      return res.status(400).json({ error: "Este link de confirmação expirou. Por favor, solicite um novo." });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: "ativo",
        ativo: true,
        tokenConfirmacao: null,
        tokenExpiracao: null,
      },
    });

    res.json({ message: "E-mail confirmado com sucesso! Você já pode fazer login." });
  } catch (error) {
    res.status(500).json({ error: "Erro ao confirmar e-mail" });
  }
});

app.post("/api/auth/reenviar-confirmacao", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    if (user.status === "ativo") return res.status(400).json({ error: "Esta conta já está ativa" });

    const token = uuidv4();
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        tokenConfirmacao: token,
        tokenExpiracao: expires,
      },
    });

    await sendConfirmationEmail(email, token);
    res.json({ message: "E-mail de confirmação reenviado!" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao reenviar e-mail" });
  }
});

app.post("/api/auth/esqueci-senha", async (req, res) => {
  const { email } = req.body;
  logger('DEBUG', 'Auth', `Solicitação de recuperação de senha para: ${email}`);
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    
    // Always return generic message for security
    const genericMessage = "Se o e-mail estiver cadastrado, você receberá um link de recuperação.";
    
    if (!user) {
      logger('INFO', 'Auth', `Recuperação de senha: E-mail não encontrado (${email})`);
      return res.json({ message: genericMessage });
    }

    const token = uuidv4();
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiracao: expires,
      },
    });

    logger('INFO', 'Auth', `Token de recuperação gerado para: ${email}`);
    await sendResetPasswordEmail(email, token);
    res.json({ message: genericMessage });
  } catch (error: any) {
    logger('ERROR', 'Auth', `Erro no esqueci-senha para ${email}: ${error.message}`);
    res.status(500).json({ error: "Erro ao processar solicitação" });
  }
});

app.post("/api/auth/redefinir-senha", async (req, res) => {
  const { token, password } = req.body;
  logger('DEBUG', 'Auth', 'Tentativa de redefinição de senha com token');
  try {
    const user = await prisma.user.findUnique({ where: { resetToken: token } });
    
    if (!user) {
      logger('WARN', 'Auth', 'Redefinição de senha falhou: Token inválido');
      return res.status(400).json({ error: "Token de recuperação inválido ou já utilizado." });
    }

    if (user.resetTokenExpiracao && new Date() > user.resetTokenExpiracao) {
      logger('WARN', 'Auth', `Redefinição de senha falhou: Token expirado (${user.email})`);
      return res.status(400).json({ error: "Este link de recuperação expirou. Por favor, solicite um novo." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiracao: null,
      },
    });

    logger('INFO', 'Auth', `Senha redefinida com sucesso para: ${user.email}`);
    res.json({ message: "Senha alterada com sucesso!" });
  } catch (error: any) {
    logger('ERROR', 'Auth', `Erro ao redefinir senha: ${error.message}`);
    res.status(500).json({ error: "Erro ao redefinir senha" });
  }
});

// User Management (Admin only)
app.get("/api/users", authenticateToken, isAdmin, async (req, res) => {
  logger('DEBUG', 'User', 'Buscando todos os usuários');
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, nome: true, role: true, ativo: true, dataNascimento: true },
    });
    res.json(users);
  } catch (error: any) {
    logger('ERROR', 'User', `Erro ao buscar usuários: ${error.message}`);
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

app.post("/api/users", authenticateToken, isAdmin, async (req, res) => {
  const { email, password, nome, role, dataNascimento } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { 
        email, 
        password: hashedPassword, 
        nome, 
        role,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : null
      },
    });
    res.status(201).json({ id: user.id, email: user.email, nome: user.nome, role: user.role, dataNascimento: user.dataNascimento });
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

app.patch("/api/users/:id/toggle-status", authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { ativo: !user.ativo },
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: "Erro ao alterar status" });
  }
});

app.put("/api/users/:id", authenticateToken, async (req: any, res) => {
  const { id } = req.params;
  const { nome, password, role, email, dataNascimento } = req.body;
  const targetId = parseInt(id);
  const requester = req.user;

  try {
    // Check permissions: admin can edit anyone, user can only edit themselves
    if (requester.role !== "administrador" && requester.id !== targetId) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const data: any = {};
    if (nome) data.nome = nome;
    if (password) data.password = await bcrypt.hash(password, 10);
    if (dataNascimento !== undefined) data.dataNascimento = dataNascimento ? new Date(dataNascimento) : null;
    if (req.body.notificacaoEmail !== undefined) data.notificacaoEmail = req.body.notificacaoEmail;
    
    // Only admin can change role or email
    if (requester.role === "administrador") {
      if (role) data.role = role;
      if (email) data.email = email;
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetId },
      data,
      select: { id: true, email: true, nome: true, role: true, ativo: true, dataNascimento: true, notificacaoEmail: true },
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
});

// Birthdays endpoint
app.get("/api/birthdays", authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        dataNascimento: { not: null },
        ativo: true
      },
      select: { id: true, nome: true, dataNascimento: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar aniversários" });
  }
});

// Compromissos Routes
app.get("/api/compromissos", authenticateToken, async (req: any, res) => {
  try {
    const { role, id: userId } = req.user;
    
    // Se for admin, pode ver todos os compromissos (agrupados por usuário no front)
    // Mas o requisito diz: "O administrador só pode visualizar os compromissos de outros usuários e gerenciar apenas os próprios."
    // Então vamos retornar todos, e o front decide como exibir.
    const where = role === "administrador" ? {} : { userId };
    
    const compromissos = await prisma.compromisso.findMany({
      where,
      include: { user: { select: { nome: true, email: true } } },
      orderBy: { data: "asc" },
    });
    res.json(compromissos);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar compromissos" });
  }
});

app.post("/api/compromissos", authenticateToken, async (req: any, res) => {
  const userId = req.user.id;
  try {
    const { titulo, descricao, data, hora, retroativo } = req.body;

    const novoCompromisso = await prisma.compromisso.create({
      data: {
        titulo,
        descricao,
        data: new Date(data),
        hora,
        retroativo: !!retroativo,
        userId,
      },
    });
    logger('INFO', 'Compromisso', `Compromisso criado com sucesso (ID: ${novoCompromisso.id})`);
    res.status(201).json(novoCompromisso);
  } catch (error: any) {
    logger('ERROR', 'Compromisso', `Erro ao criar compromisso para usuário ${userId}: ${error.message}`);
    res.status(500).json({ error: "Erro ao criar compromisso" });
  }
});

app.put("/api/compromissos/:id", authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { titulo, descricao, data, hora, status, retroativo } = req.body;
    const userId = req.user.id;

    // Apenas o dono pode gerenciar
    const compromisso = await prisma.compromisso.findUnique({ where: { id: parseInt(id) } });
    if (!compromisso || compromisso.userId !== userId) {
      return res.status(403).json({ error: "Acesso negado: você não é o dono deste compromisso" });
    }

    if (compromisso.status === 'concluido') {
      return res.status(403).json({ error: "Compromissos concluídos não podem ser editados" });
    }

    const updated = await prisma.compromisso.update({
      where: { id: parseInt(id) },
      data: {
        titulo,
        descricao,
        data: data ? new Date(data) : undefined,
        hora,
        status,
        retroativo: retroativo !== undefined ? !!retroativo : undefined,
      },
    });
    logger('INFO', 'Compromisso', `Compromisso atualizado (ID: ${id})`);
    res.json(updated);
  } catch (error: any) {
    logger('ERROR', 'Compromisso', `Erro ao atualizar compromisso ${req.params.id}: ${error.message}`);
    res.status(500).json({ error: "Erro ao atualizar compromisso" });
  }
});

app.delete("/api/compromissos/:id", authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const compromisso = await prisma.compromisso.findUnique({ where: { id: parseInt(id) } });
    if (!compromisso || compromisso.userId !== userId) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    await prisma.compromisso.delete({ where: { id: parseInt(id) } });
    logger('INFO', 'Compromisso', `Compromisso excluído (ID: ${id})`);
    res.status(204).send();
  } catch (error: any) {
    logger('ERROR', 'Compromisso', `Erro ao excluir compromisso ${req.params.id}: ${error.message}`);
    res.status(500).json({ error: "Erro ao excluir compromisso" });
  }
});

app.patch("/api/compromissos/:id/concluir", authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const compromisso = await prisma.compromisso.findUnique({ where: { id: parseInt(id) } });
    if (!compromisso || compromisso.userId !== userId) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const updated = await prisma.compromisso.update({
      where: { id: parseInt(id) },
      data: { status: "concluido" },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Erro ao concluir compromisso" });
  }
});

app.get("/api/relatorios", authenticateToken, async (req: any, res) => {
  const { dataInicio, dataFim, userId: filterUserId, status } = req.query;
  const { role, id: userId } = req.user;
  logger('DEBUG', 'Relatorio', `Gerando relatório para usuário ${userId}`, { dataInicio, dataFim, filterUserId, status });
  try {
    let where: any = role === "administrador" ? {} : { userId };
    
    if (role === "administrador" && filterUserId) {
      where.userId = parseInt(filterUserId as string);
    }

    if (status) {
      where.status = status;
    }

    if (dataInicio && dataFim) {
      where.data = {
        gte: new Date(dataInicio as string),
        lte: new Date(dataFim as string),
      };
    }
    const compromissos = await prisma.compromisso.findMany({
      where,
      include: { user: { select: { nome: true, email: true } } },
      orderBy: { data: "asc" },
    });
    res.json(compromissos);
  } catch (error) {
    res.status(500).json({ error: "Erro ao gerar relatório" });
  }
});

app.get("/api/dashboard", authenticateToken, async (req: any, res) => {
  const { userId: filterUserId } = req.query;
  const { role, id: userId } = req.user;
  logger('DEBUG', 'Dashboard', `Buscando dados do dashboard para usuário ${userId}`, { filterUserId });
  try {
    let where: any = role === "administrador" ? {} : { userId };
    
    if (role === "administrador" && filterUserId) {
      where.userId = parseInt(filterUserId as string);
    }

    const total = await prisma.compromisso.count({ where });
    const concluidos = await prisma.compromisso.count({ where: { ...where, status: "concluido" } });
    const pendentes = await prisma.compromisso.count({ where: { ...where, status: "pendente" } });
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);
    
    const doDia = await prisma.compromisso.count({
      where: {
        ...where,
        data: { gte: hoje, lt: amanha },
      },
    });

    res.json({ total, concluidos, pendentes, doDia });
  } catch (error) {
    res.status(500).json({ error: "Erro no dashboard" });
  }
});

// Seed Admin User if not exists
async function seedAdmin() {
  const adminEmail = "test@segnorte.com.br";
  const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    const hashedPassword = await bcrypt.hash("test123", 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        nome: "Administrador",
        role: "administrador",
        status: "ativo",
        ativo: true
      },
    });
    logger('INFO', 'Admin', "Admin user seeded: test@segnorte.com.br / test123");
  }
}

// Cron Job para Lembretes de E-mail (executa a cada minuto)
cron.schedule("* * * * *", async () => {
  logger('DEBUG', 'Cron', "Iniciando verificação de compromissos para lembretes...");
  try {
    const now = new Date();
    const oneHourFromNow = addHours(now, 1);
    
    // Janela de 5 minutos para garantir que não percamos nenhum compromisso
    const startWindow = subMinutes(oneHourFromNow, 2);
    const endWindow = addMinutes(oneHourFromNow, 2);

    const upcomingAppointments = await prisma.compromisso.findMany({
      where: {
        status: "pendente",
        notificadoEmail: false,
        data: {
          gte: new Date(startWindow.toISOString().split('T')[0]),
          lte: new Date(endWindow.toISOString().split('T')[0]),
        },
        user: {
          notificacaoEmail: true,
          ativo: true
        }
      },
      include: {
        user: true
      }
    });

    for (const appo of upcomingAppointments) {
      // Verificar a hora exata
      const [hours, minutes] = appo.hora.split(":").map(Number);
      const appoDateTime = new Date(appo.data);
      appoDateTime.setHours(hours, minutes, 0, 0);

      const diffMinutes = (appoDateTime.getTime() - now.getTime()) / (1000 * 60);

      // Se estiver entre 55 e 65 minutos de distância
      if (diffMinutes >= 55 && diffMinutes <= 65) {
        logger('INFO', 'Cron', `Enviando lembrete para ${appo.user.email} (Compromisso: ${appo.titulo})`);
        
        const mailOptions = {
          from: `"SegAgenda" <${process.env.SMTP_USER}>`,
          to: appo.user.email,
          subject: "Lembrete de compromisso",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #00a650;">Olá, ${appo.user.nome}!</h2>
              <p>Este é um lembrete de que você possui um compromisso agendado para hoje às <strong>${appo.hora}</strong>.</p>
              <p><strong>Compromisso:</strong> ${appo.titulo}</p>
              ${appo.descricao ? `<p><strong>Descrição:</strong> ${appo.descricao}</p>` : ''}
              <p>Por favor, não se esqueça.</p>
              <p>Se precisar reagendar, entre no sistema.</p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="font-size: 12px; color: #94a3b8;">Atenciosamente,<br>Equipe SegAgenda</p>
            </div>
          `,
        };

        try {
          if (process.env.SMTP_HOST) {
            await transporter.sendMail(mailOptions);
            logger('INFO', 'Cron', `E-mail de lembrete enviado para: ${appo.user.email}`);
          } else {
            logger('INFO', 'Cron', `MOCK REMINDER SENT TO: ${appo.user.email}`);
          }

          await prisma.compromisso.update({
            where: { id: appo.id },
            data: {
              notificadoEmail: true,
              dataNotificacaoEmail: new Date()
            }
          });
        } catch (mailError: any) {
          logger('ERROR', 'Cron', `Falha ao enviar lembrete para ${appo.user.email}: ${mailError.message}`);
        }
      }
    }
  } catch (error: any) {
    logger('ERROR', 'Cron', `Erro no cron job de lembretes: ${error.message}`);
  }
});

// Vite middleware setup
async function startServer() {
  try {
    console.log("Starting server initialization...");
    await seedAdmin();
    console.log("Admin seeding completed.");
    
    if (process.env.NODE_ENV !== "production") {
      console.log("Running in development mode with Vite middleware.");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      console.log("Running in production mode.");
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
