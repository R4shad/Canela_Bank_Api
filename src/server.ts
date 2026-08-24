import 'dotenv/config'
import { createApp } from './app'
import { ExpirationJob } from './shared/jobs/expiration.job'
import { WebhookRetryJob } from './shared/jobs/webhook-retry.job'

const app = createApp()
const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Swagger docs: http://localhost:${PORT}/api-docs`)
  ExpirationJob.init()
  WebhookRetryJob.init()
})
