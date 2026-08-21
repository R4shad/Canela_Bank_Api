import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '../../shared/database/prisma'

export interface GenerateQrInput {
  amount: number
  currency?: string
  expirationMinutes?: number
}

export class PaymentsService {
  async generatePaymentQr(input: GenerateQrInput) {
    const currency = input.currency || 'BOB'
    const expirationMinutes = input.expirationMinutes || 15

    const aliasRef = `CANELA-${uuidv4()}`
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000)

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
    const paymentUrl = `${baseUrl}/demo/pay/${aliasRef}`

    const qrBase64 = await QRCode.toDataURL(paymentUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 300,
    })

    const transaction = await prisma.transaction.create({
      data: {
        aliasRef,
        amount: input.amount,
        currency,
        qrData: qrBase64,
        status: 'PENDING',
        expiresAt,
      },
    })

    return {
      id: transaction.id,
      aliasRef: transaction.aliasRef,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      status: transaction.status,
      qrImage: transaction.qrData,
      paymentUrl,
      expiresAt: transaction.expiresAt,
    }
  }

  async getPaymentStatus(aliasRef: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { aliasRef },
    })

    if (!transaction) {
      return null
    }

    return {
      id: transaction.id,
      aliasRef: transaction.aliasRef,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      status: transaction.status,
      expiresAt: transaction.expiresAt,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    }
  }
}
