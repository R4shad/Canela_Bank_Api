import { defineConfig } from '@prisma/config'
import process from 'node:process'
import 'dotenv/config'

export default defineConfig({
  migrations: {
    seed: 'npx tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
