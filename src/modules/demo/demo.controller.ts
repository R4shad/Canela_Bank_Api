import { Request, Response } from 'express'
import { prisma } from '../../shared/database/prisma'

export class DemoController {
  async renderPaymentPage(req: Request, res: Response): Promise<void> {
    try {
      const { aliasRef } = req.params

      if (!aliasRef || typeof aliasRef !== 'string') {
        res.status(400).send('<h1>Identificador de pago inválido</h1>')
        return
      }

      const transaction = await prisma.transaction.findUnique({
        where: { aliasRef },
      })

      if (!transaction) {
        res.status(404).send(`
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pago no encontrado - Canela Bank</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #0f172a; color: #f8fafc; text-align: center; }
              .card { background: #1e293b; padding: 2.5rem; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); max-width: 400px; width: 90%; }
              h1 { color: #f87171; font-size: 1.5rem; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Pago No Encontrado</h1>
              <p>El código QR o enlace ingresado no existe en Canela Bank.</p>
            </div>
          </body>
          </html>
        `)
        return
      }

      const isPending = transaction.status === 'PENDING'
      const isExpired = new Date() > transaction.expiresAt && isPending

      const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Banca Móvil - Canela Bank</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background-color: #0b1329;
              color: #f1f5f9;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              padding: 1.25rem;
            }
            .app-container {
              background: #1e293b;
              width: 100%;
              max-width: 420px;
              border-radius: 24px;
              overflow: hidden;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
              border: 1px solid #334155;
            }
            .app-header {
              background: linear-gradient(135deg, #d97706, #b45309);
              padding: 1.5rem;
              text-align: center;
            }
            .app-header h1 {
              font-size: 1.3rem;
              font-weight: 700;
              letter-spacing: 0.5px;
            }
            .app-header p {
              font-size: 0.85rem;
              opacity: 0.95;
              margin-top: 4px;
            }
            .app-body {
              padding: 1.75rem;
            }
            .amount-card {
              background: #0f172a;
              border: 1px solid #334155;
              border-radius: 16px;
              padding: 1.25rem;
              text-align: center;
              margin-bottom: 1.25rem;
            }
            .amount-label {
              font-size: 0.8rem;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .amount-val {
              font-size: 2.2rem;
              font-weight: 800;
              color: #f59e0b;
              margin: 0.5rem 0;
            }
            .detail-box {
              background: #0f172a;
              border: 1px solid #334155;
              border-radius: 12px;
              padding: 0.9rem;
              margin-bottom: 1.25rem;
              font-size: 0.85rem;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 6px;
            }
            .detail-row:last-child { margin-bottom: 0; }
            .detail-label { color: #94a3b8; font-weight: 500; }
            .detail-value { color: #f8fafc; font-weight: 600; text-align: right; }
            .status-badge {
              display: inline-block;
              padding: 6px 14px;
              border-radius: 9999px;
              font-size: 0.85rem;
              font-weight: 600;
              margin-bottom: 1.25rem;
              width: 100%;
              text-align: center;
            }
            .status-PENDING { background: rgba(234, 179, 8, 0.15); color: #facc15; border: 1px solid #ca8a04; }
            .status-PAID { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid #16a34a; }
            .status-FAILED { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid #dc2626; }
            .btn {
              width: 100%;
              padding: 1rem;
              border-radius: 12px;
              border: none;
              font-size: 1rem;
              font-weight: 700;
              cursor: pointer;
              transition: all 0.2s ease;
              display: block;
              margin-bottom: 0.75rem;
            }
            .btn-pay {
              background: #d97706;
              color: #ffffff;
            }
            .btn-pay:hover {
              background: #b45309;
            }
            .btn-pay:disabled {
              background: #475569;
              cursor: not-allowed;
            }
            .btn-fail {
              background: transparent;
              color: #94a3b8;
              border: 1px solid #475569;
            }
            .btn-fail:hover {
              background: rgba(239, 68, 68, 0.1);
              color: #f87171;
              border-color: #ef4444;
            }
            .footer-info {
              text-align: center;
              font-size: 0.75rem;
              color: #64748b;
              margin-top: 1.5rem;
            }
          </style>
        </head>
        <body>
          <div class="app-container">
            <div class="app-header">
              <h1>Canela Bank Móvil</h1>
              <p>Transferencia QR Canela Pay</p>
            </div>
            <div class="app-body">
              <div class="amount-card">
                <div class="amount-label">Monto a Transferir</div>
                <div class="amount-val">${Number(transaction.amount).toFixed(2)} ${transaction.currency}</div>
              </div>

              <div class="detail-box">
                <div class="detail-row">
                  <span class="detail-label">Concepto / Glosa:</span>
                  <span class="detail-value">${transaction.gloss || 'Pago Simple QR'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Referencia:</span>
                  <span class="detail-value" style="font-size: 0.75rem; word-break: break-all;">${transaction.aliasRef}</span>
                </div>
              </div>

              <div id="statusBadge" class="status-badge status-${isExpired ? 'FAILED' : transaction.status}">
                ${isExpired ? 'EXPIRADO' : transaction.status}
              </div>

              ${
                isPending && !isExpired
                  ? `
                <button id="btnPay" class="btn btn-pay" onclick="processPayment('COMPLETED')">
                  Confirmar Transferencia
                </button>
                <button id="btnFail" class="btn btn-fail" onclick="processPayment('FAILED')">
                  Rechazar Transferencia
                </button>
              `
                  : `
                <p style="text-align: center; color: #94a3b8; font-size: 0.9rem;">
                  Esta transacción ya ha sido procesada o ha expirado.
                </p>
              `
              }

              <div class="footer-info">
                Canela Bank API © 2026 - Sandbox Environment
              </div>
            </div>
          </div>

          <script>
            async function processPayment(status) {
              const btnPay = document.getElementById('btnPay');
              const btnFail = document.getElementById('btnFail');
              
              if (btnPay) btnPay.disabled = true;
              if (btnFail) btnFail.disabled = true;

              try {
                const response = await fetch('/api/v1/mock/canela/simulate-payment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    aliasRef: '${transaction.aliasRef}',
                    status: status
                  })
                });

                if (response.ok) {
                  window.location.reload();
                } else {
                  alert('Ocurrió un error al procesar el pago');
                  if (btnPay) btnPay.disabled = false;
                  if (btnFail) btnFail.disabled = false;
                }
              } catch (err) {
                alert('Error de conexión con el simulador de Canela Bank');
                if (btnPay) btnPay.disabled = false;
                if (btnFail) btnFail.disabled = false;
              }
            }
          </script>
        </body>
        </html>
      `

      res.status(200).send(html)
    } catch (error) {
      res.status(500).send('<h1>Error interno del servidor</h1>')
    }
  }
}
