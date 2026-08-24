import { Response } from 'express'
import { PaymentsService } from './payments.service'
import { AuthenticatedRequest } from '../../shared/middlewares/auth.middleware'

const paymentsService = new PaymentsService()

export class PaymentsController {
  async generate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { amount, currency, gloss, expirationMinutes, callbackUrl } =
        req.body

      if (!amount || typeof amount !== 'number' || amount <= 0) {
        res
          .status(400)
          .json({ error: 'El monto debe ser un número mayor a cero' })
        return
      }

      const result = await paymentsService.generatePaymentQr({
        amount,
        currency,
        gloss,
        expirationMinutes,
        callbackUrl,
        merchantId: req.merchant?.id,
      })

      res.status(201).json(result)
    } catch (error) {
      console.error('ERROR EN GENERATE QR:', error)
      res
        .status(500)
        .json({
          error: 'Error interno al generar el QR',
          details: String(error),
        })
    }
  }

  async getStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { aliasRef } = req.params

      if (!aliasRef || typeof aliasRef !== 'string') {
        res
          .status(400)
          .json({ error: 'El aliasRef es requerido y debe ser un texto' })
        return
      }

      const transaction = await paymentsService.getPaymentStatus(aliasRef)

      if (!transaction) {
        res.status(404).json({ error: 'Transacción no encontrada' })
        return
      }

      res.status(200).json(transaction)
    } catch (error) {
      console.error('ERROR EN GET STATUS:', error)
      res.status(500).json({ error: 'Error interno al consultar el estado' })
    }
  }
}
