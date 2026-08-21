import { Request, Response } from 'express'
import { WebhooksService } from './webhooks.service'
import { CryptoUtil } from '../../shared/utils/crypto'

const webhooksService = new WebhooksService()

export class WebhooksController {
  async handleCanelaWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['x-canela-signature'] as string
      const secret =
        process.env.WEBHOOK_SECRET || 'canela_bank_super_secret_key_12345'

      if (!signature) {
        res.status(401).json({ error: 'Firma x-canela-signature faltante' })
        return
      }

      const isValid = CryptoUtil.verifyHmacSignature(
        req.body,
        signature,
        secret,
      )

      if (!isValid) {
        res.status(401).json({ error: 'Firma HMAC inválida o manipulada' })
        return
      }

      const result = await webhooksService.processCanelaNotification(req.body)

      if (!result.success && result.reason === 'TRANSACTION_NOT_FOUND') {
        res.status(404).json({ error: 'Transacción no encontrada' })
        return
      }

      res.status(200).json({ status: 'ACKNOWLEDGED', result })
    } catch (error) {
      res.status(500).json({ error: 'Error interno procesando webhook' })
    }
  }
}
