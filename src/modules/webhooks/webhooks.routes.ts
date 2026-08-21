import { Router } from 'express'
import { WebhooksController } from './webhooks.controller'

const router = Router()
const controller = new WebhooksController()

router.post('/canela-pay', (req, res) =>
  controller.handleCanelaWebhook(req, res),
)

export default router
