import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { PrismaClient, Role } from "@prisma/client";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

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
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.ativo) {
      return res.status(401).json({ error: "Usuário não encontrado ou inativo" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Senha incorreta" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, nome: user.nome },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        nome: user.nome,
        dataNascimento: user.dataNascimento 
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Erro no login" });
  }
});

// User Management (Admin only)
app.get("/api/users", authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, nome: true, role: true, ativo: true, dataNascimento: true },
    });
    res.json(users);
  } catch (error) {
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
    
    // Only admin can change role or email
    if (requester.role === "administrador") {
      if (role) data.role = role;
      if (email) data.email = email;
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetId },
      data,
      select: { id: true, email: true, nome: true, role: true, ativo: true, dataNascimento: true },
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
  try {
    const { titulo, descricao, data, hora, retroativo } = req.body;
    const userId = req.user.id;

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
    res.status(201).json(novoCompromisso);
  } catch (error) {
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
    res.json(updated);
  } catch (error) {
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
    res.status(204).send();
  } catch (error) {
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
  try {
    const { dataInicio, dataFim, userId: filterUserId, status } = req.query;
    const { role, id: userId } = req.user;
    
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
  try {
    const { userId: filterUserId } = req.query;
    const { role, id: userId } = req.user;
    
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
  const adminEmail = "admin@agenda.com";
  const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        nome: "Administrador",
        role: "administrador",
      },
    });
    console.log("Admin user seeded: admin@agenda.com / admin123");
  }
}

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
    process.exit(1);
  }
}

startServer();
