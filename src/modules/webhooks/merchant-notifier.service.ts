import { prisma } from '../../shared/database/prisma'
import { CryptoUtil } from '../../shared/utils/crypto'

export interface MerchantNotificationPayload {
  event: 'PAYMENT_COMPLETED' | 'PAYMENT_FAILED'
  aliasRef: string
  amount: number
  currency: string
  gloss?: string | null
  status: string
  transactionNumber: string
  paymentDate: string
}

export class MerchantNotifierService {
  private calculateNextRetry(attempt: number): Date {
    const delayMinutes = [1, 5, 15][attempt - 1] || 30
    return new Date(Date.now() + delayMinutes * 60 * 1000)
  }

  async dispatchInitialWebhook(
    transactionId: string,
    callbackUrl: string,
    payload: MerchantNotificationPayload,
  ): Promise<boolean> {
    const delivery = await prisma.webhookDelivery.create({
      data: {
        transactionId,
        url: callbackUrl,
        payload: payload as any,
        attempt: 1,
        maxAttempts: 4,
        status: 'PENDING',
      },
    })

    return this.executeDelivery(delivery.id, callbackUrl, payload, 1, 4)
  }

  async executeDelivery(
    deliveryId: string,
    callbackUrl: string,
    payload: MerchantNotificationPayload,
    currentAttempt: number,
    maxAttempts: number,
  ): Promise<boolean> {
    const secret =
      process.env.WEBHOOK_SECRET || 'canela_bank_super_secret_key_12345'
    const signature = CryptoUtil.generateHmacSignature(payload, secret)

    try {
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

      const responseBody = await response.text().catch(() => null)

      if (response.ok) {
        await prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            statusCode: response.status,
            responseBody: responseBody ? responseBody.slice(0, 1000) : null,
            status: 'SUCCESS',
            nextRetryAt: null,
          },
        })
        return true
      }

      throw new Error(
        `Servidor del comercio respondió con status HTTP ${response.status}`,
      )
    } catch (error: any) {
      const isLastAttempt = currentAttempt >= maxAttempts
      const nextRetryAt = isLastAttempt
        ? null
        : this.calculateNextRetry(currentAttempt)

      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: isLastAttempt ? 'FAILED' : 'PENDING',
          nextRetryAt,
          lastError: error.message || 'Error de conexión o timeout',
        },
      })

      return false
    }
  }

  async retryPendingDeliveries(): Promise<void> {
    const now = new Date()
    const pendingDeliveries = await prisma.webhookDelivery.findMany({
      where: {
        status: 'PENDING',
        nextRetryAt: {
          lte: now,
        },
      },
    })

    for (const item of pendingDeliveries) {
      const nextAttempt = item.attempt + 1
      await prisma.webhookDelivery.update({
        where: { id: item.id },
        data: { attempt: nextAttempt },
      })

      await this.executeDelivery(
        item.id,
        item.url,
        item.payload as any,
        nextAttempt,
        item.maxAttempts,
      )
    }
  }
}
