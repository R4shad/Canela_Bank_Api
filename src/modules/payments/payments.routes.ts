import { Router } from 'express'
import { PaymentsController } from './payments.controller'

const router = Router()
const controller = new PaymentsController()

router.post('/qr', (req, res) => controller.generate(req, res))
router.get('/:aliasRef', (req, res) => controller.getStatus(req, res))

export default router
