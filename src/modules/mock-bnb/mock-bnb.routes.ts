import { Router } from 'express'
import { MockBnbController } from './mock-bnb.controller'

const router = Router()
const controller = new MockBnbController()

router.post('/simulate-payment', (req, res) =>
  controller.simulatePayment(req, res),
)

export default router
