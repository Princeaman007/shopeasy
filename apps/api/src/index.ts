import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import { env } from './config/env'

const app = express()

// ── Sécurité & parsing ──────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}))
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// ── Logs en développement ───────────────────────────────────────
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// ── Route de santé ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'ShopEasy CI API',
    env: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
})

// ── Démarrage serveur ───────────────────────────────────────────
app.listen(env.PORT, () => {
  console.log(`🚀 API ShopEasy CI démarrée sur le port ${env.PORT}`)
  console.log(`📍 Environnement : ${env.NODE_ENV}`)
})

export default app