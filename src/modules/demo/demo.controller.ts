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
              <p>El código QR o enlace ingresado no existe en nuestro sistema.</p>
            </div>
          </body>
          </html>
        `)
        return
      }

      const isPending = transaction.status === 'PENDING'
      const isPaid = transaction.status === 'PAID'
      const isExpired = new Date() > transaction.expiresAt && isPending

      const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Simulador de Pago BNB - Canela Bank</title>
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
              background: linear-gradient(135deg, #0284c7, #0369a1);
              padding: 1.5rem;
              text-align: center;
            }
            .app-header h1 {
              font-size: 1.25rem;
              font-weight: 700;
              letter-spacing: 0.5px;
            }
            .app-header p {
              font-size: 0.85rem;
              opacity: 0.9;
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
              margin-bottom: 1.5rem;
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
              color: #38bdf8;
              margin: 0.5rem 0;
            }
            .ref-info {
              font-size: 0.75rem;
              color: #64748b;
              word-break: break-all;
            }
            .status-badge {
              display: inline-block;
              padding: 6px 14px;
              border-radius: 9999px;
              font-size: 0.85rem;
              font-weight: 600;
              margin-bottom: 1.5rem;
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
              background: #0284c7;
              color: #ffffff;
            }
            .btn-pay:hover {
              background: #0369a1;
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
              <h1>Banca Móvil BNB</h1>
              <p>Simulador de Transferencia Simple QR</p>
            </div>
            <div class="app-body">
              <div class="amount-card">
                <div class="amount-label">Monto a Transferir</div>
                <div class="amount-val">${Number(transaction.amount).toFixed(2)} ${transaction.currency}</div>
                <div class="ref-info">Ref: ${transaction.aliasRef}</div>
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
                const response = await fetch('/api/v1/mock/bnb/simulate-payment', {
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
                alert('Error de conexión con el simulador');
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
