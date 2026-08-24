import { OpenAPIV3 } from 'openapi-types'

export const swaggerDocument: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'Canela Bank API - Payment Gateway Simulator',
    version: '1.0.0',
    description: 'API simuladora de pasarela de pagos Canela Pay QR',
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
          },
        },
      },
    },
    '/api/v1/payments/qr': {
      post: {
        summary: 'Generar un nuevo código QR de pago Canela Pay',
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
                  gloss: {
                    type: 'string',
                    example: 'Compra de teclado mecánico - Orden #1024',
                  },
                  expirationMinutes: { type: 'number', example: 15 },
                  callbackUrl: {
                    type: 'string',
                    example:
                      'https://webhook.site/80b73e4b-4bee-48f9-a29e-9bb26cf26e61',
                  },
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
    '/api/v1/webhooks/canela-pay': {
      post: {
        summary:
          'Webhook oficial receptor de confirmaciones Canela Pay (requiere x-canela-signature)',
        tags: ['Webhooks'],
        parameters: [
          {
            name: 'x-canela-signature',
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
                    example: '2026-08-24T23:30:00.000Z',
                  },
                  transactionNumber: {
                    type: 'string',
                    example: 'CANELA-TX-998811',
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
    '/api/v1/mock/canela/simulate-payment': {
      post: {
        summary: 'Simulador de Canela Bank para disparar el pago de un QR',
        tags: ['Mock Canela Engine'],
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
