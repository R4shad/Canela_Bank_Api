import express, { Application } from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import { swaggerDocument } from './config/swagger'
import paymentsRouter from './modules/payments/payments.routes'
import webhooksRouter from './modules/webhooks/webhooks.routes'
import mockBnbRouter from './modules/mock-bnb/mock-bnb.routes'

export const createApp = (): Application => {
  const app = express()

  app.use(cors())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  app.use('/api/v1/payments', paymentsRouter)
  app.use('/api/v1/webhooks', webhooksRouter)
  app.use('/api/v1/mock/bnb', mockBnbRouter)

  return app
}
