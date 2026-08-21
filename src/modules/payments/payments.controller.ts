import { Request, Response } from 'express'
import { PaymentsService } from './payments.service'

const paymentsService = new PaymentsService()

export class PaymentsController {
  async generate(req: Request, res: Response): Promise<void> {
    try {
      const { amount, currency, expirationMinutes } = req.body

      if (!amount || typeof amount !== 'number' || amount <= 0) {
        res
          .status(400)
          .json({ error: 'El monto debe ser un número mayor a cero' })
        return
      }

      const result = await paymentsService.generatePaymentQr({
        amount,
        currency,
        expirationMinutes,
      })

      res.status(201).json(result)
    } catch (error) {
      res.status(500).json({ error: 'Error interno al generar el QR' })
    }
  }

  async getStatus(req: Request, res: Response): Promise<void> {
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
      res.status(500).json({ error: 'Error interno al consultar el estado' })
    }
  }
}
