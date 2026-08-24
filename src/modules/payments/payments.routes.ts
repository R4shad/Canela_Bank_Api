import { Router } from 'express'
import { PaymentsController } from './payments.controller'
import { authenticateApiKey } from '../../shared/middlewares/auth.middleware'

const router = Router()
const controller = new PaymentsController()

router.post('/qr', authenticateApiKey, (req, res) =>
  controller.generate(req as any, res),
)
router.get('/:aliasRef', authenticateApiKey, (req, res) =>
  controller.getStatus(req as any, res),
)

export default router
