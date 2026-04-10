import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// API Routes
app.get("/api/compromissos", async (req, res) => {
  try {
    const compromissos = await prisma.compromisso.findMany({
      orderBy: { data: "asc" },
    });
    res.json(compromissos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar compromissos" });
  }
});

app.post("/api/compromissos", async (req, res) => {
  try {
    const { titulo, descricao, data, hora } = req.body;
    if (!titulo || !data || !hora) {
      return res.status(400).json({ error: "Título, data e hora são obrigatórios" });
    }
    const novoCompromisso = await prisma.compromisso.create({
      data: {
        titulo,
        descricao,
        data: new Date(data),
        hora,
        status: "pendente",
      },
    });
    res.status(201).json(novoCompromisso);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar compromisso" });
  }
});

app.put("/api/compromissos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descricao, data, hora, status } = req.body;
    const compromisso = await prisma.compromisso.update({
      where: { id: parseInt(id) },
      data: {
        titulo,
        descricao,
        data: data ? new Date(data) : undefined,
        hora,
        status,
      },
    });
    res.json(compromisso);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar compromisso" });
  }
});

app.delete("/api/compromissos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.compromisso.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao excluir compromisso" });
  }
});

app.patch("/api/compromissos/:id/concluir", async (req, res) => {
  try {
    const { id } = req.params;
    const compromisso = await prisma.compromisso.update({
      where: { id: parseInt(id) },
      data: { status: "concluido" },
    });
    res.json(compromisso);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao concluir compromisso" });
  }
});

app.get("/api/relatorios", async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;
    const where: any = {};
    if (dataInicio && dataFim) {
      where.data = {
        gte: new Date(dataInicio as string),
        lte: new Date(dataFim as string),
      };
    }
    const compromissos = await prisma.compromisso.findMany({
      where,
      orderBy: { data: "asc" },
    });
    res.json(compromissos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao gerar relatório" });
  }
});

// Dashboard stats
app.get("/api/dashboard", async (req, res) => {
  try {
    const total = await prisma.compromisso.count();
    const concluidos = await prisma.compromisso.count({ where: { status: "concluido" } });
    const pendentes = await prisma.compromisso.count({ where: { status: "pendente" } });
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);
    
    const doDia = await prisma.compromisso.count({
      where: {
        data: {
          gte: hoje,
          lt: amanha,
        },
      },
    });

    res.json({ total, concluidos, pendentes, doDia });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar dados do dashboard" });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
