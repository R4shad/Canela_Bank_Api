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
        include: { merchant: true },
      })

      if (!transaction) {
        res.status(404).send(`<h1>Pago No Encontrado</h1>`)
        return
      }

      const isPending = transaction.status === 'PENDING'
      const isExpired = new Date() > transaction.expiresAt && isPending
      const isPaid = transaction.status === 'PAID'

      const dateStr = transaction.updatedAt.toLocaleDateString('es-BO')
      const timeStr = transaction.updatedAt.toLocaleTimeString('es-BO')
      const mockPayerName = 'JUAN PEREZ SIMULADOR'
      const mockPayerAccount = '350****123'
      const mockReceipt = `98845*1202BNB*${Math.floor(Math.random() * 9000) + 1000}`
      const merchantName = transaction.merchant?.name || 'Comercio Desconocido'
      const merchantAccount =
        transaction.merchant?.accountNumber || 'Caja de Ahorro 350****999'

      const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Banca Móvil - Canela Bank</title>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: system-ui, -apple-system, sans-serif; background-color: #0b1329; color: #f1f5f9; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 1.25rem; }
            .app-container { background: #1e293b; width: 100%; max-width: 420px; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6); border: 1px solid #334155; }
            .app-header { background: linear-gradient(135deg, #d97706, #b45309); padding: 1.5rem; text-align: center; }
            .app-header h1 { font-size: 1.3rem; font-weight: 700; letter-spacing: 0.5px; }
            .app-header p { font-size: 0.85rem; opacity: 0.95; margin-top: 4px; }
            .app-body { padding: 1.75rem; }
            .amount-card { background: #0f172a; border: 1px solid #334155; border-radius: 16px; padding: 1.25rem; text-align: center; margin-bottom: 1.25rem; display: ${isPaid ? 'none' : 'block'}; }
            .amount-label { font-size: 0.8rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
            .amount-val { font-size: 2.2rem; font-weight: 800; color: #f59e0b; margin: 0.5rem 0; }
            .detail-box { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 0.9rem; margin-bottom: 1.25rem; font-size: 0.85rem; display: ${isPaid ? 'none' : 'block'}; }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
            .detail-row:last-child { margin-bottom: 0; }
            .detail-label { color: #94a3b8; font-weight: 500; }
            .detail-value { color: #f8fafc; font-weight: 600; text-align: right; }
            .btn { width: 100%; padding: 1rem; border-radius: 12px; border: none; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.2s ease; display: block; margin-bottom: 0.75rem; }
            .btn-pay { background: #d97706; color: #ffffff; }
            .btn-pay:hover { background: #b45309; }
            .btn-download { background: #059669; color: #ffffff; }
            .btn-download:hover { background: #047857; }
            .btn-fail { background: transparent; color: #94a3b8; border: 1px solid #475569; }
            .btn-fail:hover { background: rgba(239, 68, 68, 0.1); color: #f87171; border-color: #ef4444; }
            #receipt { background: #ffffff; color: #166534; padding: 2rem; border-radius: 12px; margin-bottom: 1.5rem; text-align: center; display: ${isPaid ? 'block' : 'none'}; }
            #receipt h2 { color: #16a34a; font-size: 2rem; font-weight: 900; margin-bottom: 0.5rem; }
            #receipt h3 { font-size: 1.1rem; font-weight: 500; margin-bottom: 1.5rem; }
            .receipt-row { display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.75rem; text-align: left; }
            .r-label { font-weight: 500; color: #22c55e; width: 45%; }
            .r-value { color: #374151; width: 55%; font-weight: 600; word-break: break-all; }
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

              <div id="receipt">
                <h2>CANELA</h2>
                <h3>Comprobante Electrónico</h3>
                <div style="margin-bottom: 1.5rem; font-size: 0.9rem; font-weight: bold; color: #22c55e;">
                  Comprobante de transferencia a terceros simple.
                </div>
                
                <div class="receipt-row">
                  <span class="r-label">Referencia:</span>
                  <span class="r-value">${transaction.gloss || 'Sin referencia'}</span>
                </div>
                <div class="receipt-row">
                  <span class="r-label">Fecha de la Transacción:</span>
                  <span class="r-value">${dateStr}</span>
                </div>
                <div class="receipt-row">
                  <span class="r-label">Hora de la transacción:</span>
                  <span class="r-value">${timeStr}</span>
                </div>
                <div class="receipt-row">
                  <span class="r-label">Se debitó de su Caja de Ahorro:</span>
                  <span class="r-value">${mockPayerAccount}</span>
                </div>
                <div class="receipt-row">
                  <span class="r-label">Se debitó la suma de BS::</span>
                  <span class="r-value">${Number(transaction.amount).toFixed(2)}</span>
                </div>
                <div class="receipt-row">
                  <span class="r-label">Nombre del destinatario:</span>
                  <span class="r-value">${merchantName}</span>
                </div>
                <div class="receipt-row">
                  <span class="r-label">Se acreditó a la cuenta:</span>
                  <span class="r-value">${merchantAccount}</span>
                </div>
                <div class="receipt-row">
                  <span class="r-label">Comprobante:</span>
                  <span class="r-value">${mockReceipt}</span>
                </div>
              </div>

              ${
                isPending && !isExpired
                  ? `
                <button id="btnPay" class="btn btn-pay" onclick="processPayment('COMPLETED')">Confirmar Transferencia</button>
                <button id="btnFail" class="btn btn-fail" onclick="processPayment('FAILED')">Rechazar Transferencia</button>
              `
                  : ''
              }

              ${
                isPaid
                  ? `<button class="btn btn-download" onclick="downloadReceipt()">Descargar Comprobante</button>`
                  : ''
              }
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
                alert('Error de conexión');
                if (btnPay) btnPay.disabled = false;
                if (btnFail) btnFail.disabled = false;
              }
            }

            function downloadReceipt() {
              const receiptElement = document.getElementById('receipt');
              html2canvas(receiptElement, { scale: 2 }).then(canvas => {
                const link = document.createElement('a');
                link.download = 'Comprobante_Canela_${transaction.aliasRef.substring(0, 10)}.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
              });
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
