import cron from 'node-cron'
import { prisma } from '../database/prisma'

export class ExpirationJob {
  static init(): void {
    cron.schedule('* * * * *', async () => {
      try {
        const now = new Date()
        const result = await prisma.transaction.updateMany({
          where: {
            status: 'PENDING',
            expiresAt: {
              lt: now,
            },
          },
          data: {
            status: 'EXPIRED',
          },
        })

        if (result.count > 0) {
          console.log(
            `[EXPIRATION JOB] Se marcaron ${result.count} transacción(es) como EXPIRED`,
          )
        }
      } catch (error) {
        console.error('[EXPIRATION JOB ERROR]:', error)
      }
    })
  }
}
