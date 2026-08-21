import { Request, Response } from 'express'
import { CryptoUtil } from '../../shared/utils/crypto'
import { WebhooksService } from '../webhooks/webhooks.service'

const webhooksService = new WebhooksService()

export class MockCanelaController {
  async simulatePayment(req: Request, res: Response): Promise<void> {
    try {
      const { aliasRef, status } = req.body

      if (!aliasRef || typeof aliasRef !== 'string') {
        res.status(400).json({ error: 'El aliasRef es requerido' })
        return
      }

      const payload = {
        aliasRef,
        status: status === 'FAILED' ? 'FAILED' : 'COMPLETED',
        paymentDate: new Date().toISOString(),
        transactionNumber: `CANELA-TX-${Math.floor(100000 + Math.random() * 900000)}`,
      }

      const secret =
        process.env.WEBHOOK_SECRET || 'canela_bank_super_secret_key_12345'
      const signature = CryptoUtil.generateHmacSignature(payload, secret)

      const processingResult = await webhooksService.processCanelaNotification(
        payload as any,
      )

      res.status(200).json({
        simulatedEvent: 'CANELA_WEBHOOK_DISPATCHED',
        signatureGenerated: signature,
        payloadSent: payload,
        processingResult,
      })
    } catch (error) {
      res.status(500).json({ error: 'Error al simular el pago' })
    }
  }
}
