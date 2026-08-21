import { prisma } from '../../shared/database/prisma'

export interface CanelaPaymentPayload {
  aliasRef: string
  status: 'COMPLETED' | 'FAILED'
  paymentDate: string
  transactionNumber: string
}

export class WebhooksService {
  async processCanelaNotification(payload: CanelaPaymentPayload) {
    const { aliasRef, status } = payload

    const transaction = await prisma.transaction.findUnique({
      where: { aliasRef },
    })

    if (!transaction) {
      return { success: false, reason: 'TRANSACTION_NOT_FOUND' }
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

    return { success: true, status: updated.status }
  }
}
