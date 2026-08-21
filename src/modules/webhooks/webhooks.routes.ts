import { Router } from 'express'
import { WebhooksController } from './webhooks.controller'

const router = Router()
const controller = new WebhooksController()

router.post('/bnb', (req, res) => controller.handleBnbWebhook(req, res))

export default router
