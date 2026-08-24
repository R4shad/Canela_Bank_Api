import cron from 'node-cron'
import { MerchantNotifierService } from '../../modules/webhooks/merchant-notifier.service'

const notifierService = new MerchantNotifierService()

export class WebhookRetryJob {
  static init(): void {
    cron.schedule('*/30 * * * * *', async () => {
      try {
        await notifierService.retryPendingDeliveries()
      } catch (error) {
        console.error('[WEBHOOK RETRY JOB ERROR]:', error)
      }
    })
  }
}
