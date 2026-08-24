import { prisma } from '../../shared/database/prisma'
import { MerchantNotifierService } from './merchant-notifier.service'

export interface CanelaPaymentPayload {
  aliasRef: string
  status: 'COMPLETED' | 'FAILED'
  paymentDate: string
  transactionNumber: string
}

const merchantNotifier = new MerchantNotifierService()

export class WebhooksService {
  async processCanelaNotification(payload: CanelaPaymentPayload) {
    const { aliasRef, status, transactionNumber, paymentDate } = payload

    const transaction = await prisma.transaction.findUnique({
      where: { aliasRef },
    })

    if (!transaction) {
      return { success: false, reason: 'TRANSACTION_NOT_FOUND' }
    }

    if (
      transaction.status === 'EXPIRED' ||
      (transaction.status === 'PENDING' && new Date() > transaction.expiresAt)
    ) {
      if (transaction.status !== 'EXPIRED') {
        await prisma.transaction.update({
          where: { aliasRef },
          data: { status: 'EXPIRED' },
        })
      }
      return {
        success: false,
        reason: 'TRANSACTION_EXPIRED',
        status: 'EXPIRED',
      }
    }

    if (transaction.status !== 'PENDING') {
      return {
        success: true,
        message: 'IDEMPOTENT_ALREADY_PROCESSED',
        status: transaction.status,
      }
    }

    const nextStatus = status === 'COMPLETED' ? 'PAID' : 'FAILED'

    const updated = await prisma.transaction.update({
      where: { aliasRef },
      data: {
        status: nextStatus,
      },
    })

    let merchantNotified = false

    if (updated.callbackUrl) {
      merchantNotified = await merchantNotifier.notifyMerchant(
        updated.callbackUrl,
        {
          event: nextStatus === 'PAID' ? 'PAYMENT_COMPLETED' : 'PAYMENT_FAILED',
          aliasRef: updated.aliasRef,
          amount: Number(updated.amount),
          currency: updated.currency,
          gloss: updated.gloss,
          status: updated.status,
          transactionNumber: transactionNumber || `CANELA-${Date.now()}`,
          paymentDate: paymentDate || new Date().toISOString(),
        },
      )
    }

    return { success: true, status: updated.status, merchantNotified }
  }
}
