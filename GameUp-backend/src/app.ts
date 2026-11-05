//ARCHIVO EJEMPLO DE LA PROFE DE COMO DEBERIA QUEDAR EL APP.TS
/*import express from "express";

//Importacion del swagger-ui-express y el archivo swagger.js que contiene la configuracion de la documentacion
import swaggerUI from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger.js";



import cors from "cors";
import { readConfig } from "./config.js";
import { prisma } from "./prisma.js";
import type { ErrorRequestHandler } from "express";
import { authRouter } from "./rutas/auth.js";

export const app = express();
const { corsOrigins, trustProxyHops } = readConfig();
app.disable("x-powered-by");
app.set("trust proxy", trustProxyHops);
app.get("/health", async (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "unavailable" });
  }
});

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && !corsOrigins.includes(origin)) {
    res.status(403).json({ error: "Origen no autorizado" });
    return;
  }
  next();
});

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerSpec));

app.use(
  cors({
    origin: corsOrigins,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  }),
);*/