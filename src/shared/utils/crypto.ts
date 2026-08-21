import crypto from 'crypto'

export class CryptoUtil {
  static generateHmacSignature(payload: object, secret: string): string {
    const serialized = JSON.stringify(payload)
    return crypto.createHmac('sha256', secret).update(serialized).digest('hex')
  }

  static verifyHmacSignature(
    payload: object,
    incomingSignature: string,
    secret: string,
  ): boolean {
    const expectedSignature = this.generateHmacSignature(payload, secret)

    if (incomingSignature.length !== expectedSignature.length) {
      return false
    }

    const incomingBuffer = Buffer.from(incomingSignature, 'utf8')
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8')

    return crypto.timingSafeEqual(incomingBuffer, expectedBuffer)
  }
}
