import { Request, Response, NextFunction } from 'express'
import { prisma } from '../database/prisma'

export interface AuthenticatedRequest extends Request {
  merchant?: {
    id: string
    name: string
    apiKey: string
  }
}

export const authenticateApiKey = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers['authorization']
  const customApiKeyHeader = req.headers['x-api-key'] as string

  let apiKey: string | undefined

  if (authHeader && authHeader.startsWith('Bearer ')) {
    apiKey = authHeader.substring(7)
  } else if (customApiKeyHeader) {
    apiKey = customApiKeyHeader
  }

  if (!apiKey) {
    res.status(401).json({
      error:
        'No autorizado: Credencial faltante. Proporciona x-api-key o Authorization: Bearer <API_KEY>',
    })
    return
  }

  const merchant = await prisma.merchant.findUnique({
    where: { apiKey },
  })

  if (!merchant || !merchant.isActive) {
    res.status(401).json({
      error: 'No autorizado: API Key inválida o comercio inactivo',
    })
    return
  }

  req.merchant = {
    id: merchant.id,
    name: merchant.name,
    apiKey: merchant.apiKey,
  }

  next()
}
