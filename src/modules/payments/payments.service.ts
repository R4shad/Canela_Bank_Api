import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '../../shared/database/prisma'
import { createCanvas, loadImage } from 'canvas'

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

    let merchantName = 'Sin especificar'
    let destinationAccount = 'Sin especificar'

    if (input.merchantId) {
      const merchant = await prisma.merchant.findUnique({
        where: { id: input.merchantId },
      })
      if (merchant) {
        merchantName = merchant.name
        destinationAccount = merchant.accountNumber || '0000000000'
      }
    }

    const rawQrBase64 = await QRCode.toDataURL(paymentUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 300,
    })

    const canvas = createCanvas(400, 520)
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 400, 520)

    const qrImage = await loadImage(rawQrBase64)
    ctx.drawImage(qrImage, 50, 10, 300, 300)

    ctx.fillStyle = '#000000'
    ctx.textAlign = 'center'

    ctx.font = 'bold 16px sans-serif'
    ctx.fillText(`Monto: ${currency} ${input.amount.toFixed(2)}`, 200, 340)

    ctx.font = '14px sans-serif'
    ctx.fillText(`Pagar a: ${merchantName}`, 200, 380)
    ctx.fillText(`Cuenta destino: ${destinationAccount}`, 200, 410)
    ctx.fillText(`Concepto: ${gloss.substring(0, 35)}`, 200, 440)
    ctx.fillText(`Válido hasta: ${expiresAt.toLocaleString('es-BO')}`, 200, 470)

    const finalQrBase64 = canvas.toDataURL('image/png')

    const transaction = await prisma.transaction.create({
      data: {
        aliasRef,
        merchantId: input.merchantId || null,
        amount: input.amount,
        currency,
        gloss,
        qrData: finalQrBase64,
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
            accountNumber: true,
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
      payerName: transaction.payerName,
      payerAccount: transaction.payerAccount,
      receiptNumber: transaction.receiptNumber,
    }
  }
}
