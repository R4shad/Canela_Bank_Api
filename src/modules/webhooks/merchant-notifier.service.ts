import { CryptoUtil } from '../../shared/utils/crypto'

export interface MerchantNotificationPayload {
  event: 'PAYMENT_COMPLETED' | 'PAYMENT_FAILED'
  aliasRef: string
  amount: number
  currency: string
  status: string
  transactionNumber: string
  paymentDate: string
}

export class MerchantNotifierService {
  async notifyMerchant(
    callbackUrl: string,
    payload: MerchantNotificationPayload,
  ): Promise<boolean> {
    try {
      const secret =
        process.env.WEBHOOK_SECRET || 'canela_bank_super_secret_key_12345'
      const signature = CryptoUtil.generateHmacSignature(payload, secret)

      const response = await fetch(callbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-canela-signature': signature,
          'User-Agent': 'CanelaBank-Webhook-Dispatcher/1.0',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      })

      return response.ok
    } catch {
      return false
    }
  }
}
