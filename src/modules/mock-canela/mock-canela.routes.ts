import { Router } from 'express'
import { MockCanelaController } from './mock-canela.controller'

const router = Router()
const controller = new MockCanelaController()

router.post('/simulate-payment', (req, res) =>
  controller.simulatePayment(req, res),
)

export default router
