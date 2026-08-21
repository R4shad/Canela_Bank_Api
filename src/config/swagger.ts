import { OpenAPIV3 } from 'openapi-types'

export const swaggerDocument: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'Canela Bank API - Simple QR Simulator',
    version: '1.0.0',
    description: 'API simuladora de pasarela de pagos Simple QR BNB',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor Local',
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Verificar estado del servicio',
        responses: {
          '200': {
            description: 'Servicio activo',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: {
                      type: 'string',
                      example: '2026-08-20T23:45:00.000Z',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/payments/qr': {
      post: {
        summary: 'Generar un nuevo código QR de pago',
        tags: ['Payments'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amount'],
                properties: {
                  amount: { type: 'number', example: 50.5 },
                  currency: { type: 'string', example: 'BOB' },
                  expirationMinutes: { type: 'number', example: 15 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'QR generado exitosamente' },
          '400': { description: 'Datos inválidos' },
        },
      },
    },
    '/api/v1/payments/{aliasRef}': {
      get: {
        summary: 'Consultar estado de una transacción por aliasRef',
        tags: ['Payments'],
        parameters: [
          {
            name: 'aliasRef',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            example: 'CANELA-1234-abcd',
          },
        ],
        responses: {
          '200': { description: 'Estado de la transacción' },
          '404': { description: 'Transacción no encontrada' },
        },
      },
    },
    '/api/v1/webhooks/bnb': {
      post: {
        summary:
          'Webhook oficial receptor de confirmaciones BNB (requiere x-bnb-signature)',
        tags: ['Webhooks'],
        parameters: [
          {
            name: 'x-bnb-signature',
            in: 'header',
            required: true,
            schema: { type: 'string' },
            description: 'Firma HMAC-SHA256 del payload',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['aliasRef', 'status'],
                properties: {
                  aliasRef: { type: 'string', example: 'CANELA-1234-abcd' },
                  status: {
                    type: 'string',
                    enum: ['COMPLETED', 'FAILED'],
                    example: 'COMPLETED',
                  },
                  paymentDate: {
                    type: 'string',
                    example: '2026-08-21T10:00:00.000Z',
                  },
                  transactionNumber: {
                    type: 'string',
                    example: 'BNB-TX-998811',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Notificación procesada' },
          '401': { description: 'Firma no autorizada o manipulada' },
        },
      },
    },
    '/api/v1/mock/bnb/simulate-payment': {
      post: {
        summary: 'Simulador bancario BNB para disparar el pago de un QR',
        tags: ['Mock BNB Engine'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['aliasRef'],
                properties: {
                  aliasRef: { type: 'string', example: 'CANELA-1234-abcd' },
                  status: {
                    type: 'string',
                    enum: ['COMPLETED', 'FAILED'],
                    example: 'COMPLETED',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Evento simulado exitosamente' },
        },
      },
    },
  },
}
