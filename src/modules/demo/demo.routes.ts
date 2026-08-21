import { Router } from 'express'
import { DemoController } from './demo.controller'

const router = Router()
const controller = new DemoController()

router.get('/pay/:aliasRef', (req, res) =>
  controller.renderPaymentPage(req, res),
)

export default router
