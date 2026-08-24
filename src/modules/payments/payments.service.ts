import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '../../shared/database/prisma'

export interface GenerateQrInput {
  amount: number
  currency?: string
  gloss?: string
  expirationMinutes?: number
  callbackUrl?: string
  merchantId?: string
}

export class PaymentsService {
  async generatePaymentQr(input: GenerateQrInput) {
    const currency = input.currency || 'BOB'
    const expirationMinutes = input.expirationMinutes || 15
    const gloss = input.gloss || 'Pago de servicios / productos'

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
        merchantId: input.merchantId || null,
        amount: input.amount,
        currency,
        gloss,
        qrData: qrBase64,
        status: 'PENDING',
        callbackUrl: input.callbackUrl || null,
        expiresAt,
      },
    })

    return {
      id: transaction.id,
      aliasRef: transaction.aliasRef,
      merchantId: transaction.merchantId,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      gloss: transaction.gloss,
      status: transaction.status,
      qrImage: transaction.qrData,
      paymentUrl,
      callbackUrl: transaction.callbackUrl,
      expiresAt: transaction.expiresAt,
    }
  }

  async getPaymentStatus(aliasRef: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { aliasRef },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!transaction) {
      return null
    }

    return {
      id: transaction.id,
      aliasRef: transaction.aliasRef,
      merchant: transaction.merchant,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      gloss: transaction.gloss,
      status: transaction.status,
      callbackUrl: transaction.callbackUrl,
      expiresAt: transaction.expiresAt,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    }
  }
}
