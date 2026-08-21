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
          '201': {
            description: 'QR generado exitosamente',
          },
          '400': {
            description: 'Datos inválidos',
          },
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
          '200': {
            description: 'Estado de la transacción',
          },
          '404': {
            description: 'Transacción no encontrada',
          },
        },
      },
    },
  },
}
