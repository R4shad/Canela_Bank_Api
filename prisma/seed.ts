import 'dotenv/config'
import * as crypto from 'node:crypto'
import process from 'node:process'
import { prisma } from '../src/shared/database/prisma'

async function main() {
  const existing = await prisma.merchant.findFirst({
    where: { apiKey: 'canela_test_key_live_99887766' },
  })

  if (!existing) {
    await prisma.merchant.create({
      data: {
        name: 'Comercio Demo Central',
        apiKey: 'canela_test_key_live_99887766',
        secretKey: crypto.randomBytes(32).toString('hex'),
        isActive: true,
      },
    })
    console.log(
      '[SEED] Comercio Demo creado exitosamente: API Key = canela_test_key_live_99887766',
    )
  } else {
    console.log('[SEED] El comercio demo ya existía en la base de datos.')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
