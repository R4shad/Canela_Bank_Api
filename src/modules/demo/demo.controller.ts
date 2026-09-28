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
        res.status(404).send('<h1>Pago No Encontrado</h1>')
        return
      }

      const isPending = transaction.status === 'PENDING'
      const isExpired = new Date() > transaction.expiresAt && isPending
      const isPaid = transaction.status === 'PAID'

      const dateStr = transaction.updatedAt.toLocaleDateString('es-BO', {
        timeZone: 'America/La_Paz',
      })
      const timeStr = transaction.updatedAt.toLocaleTimeString('es-BO', {
        timeZone: 'America/La_Paz',
        hour12: false,
      })

      const merchantName =
        transaction.customRecipient ||
        transaction.merchant?.name ||
        'Comercio Destino'
      const merchantAccount =
        transaction.merchant?.accountNumber || '3187030000001'
      const payerNameDisplay = transaction.payerName || 'ANÓNIMO'
      const receiptNum = transaction.receiptNumber || '3P94901049'

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
            .app-header { background: linear-gradient(135deg, #16a34a, #15803d); padding: 1.5rem; text-align: center; }
            .app-header h1 { font-size: 1.3rem; font-weight: 700; color: #ffffff; }
            .app-header p { font-size: 0.85rem; color: #dcfce7; margin-top: 4px; }
            .app-body { padding: 1.75rem; }
            .amount-card { background: #0f172a; border: 1px solid #334155; border-radius: 16px; padding: 1.25rem; text-align: center; margin-bottom: 1.25rem; display: ${isPaid ? 'none' : 'block'}; }
            .amount-label { font-size: 0.8rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
            .amount-val { font-size: 2.2rem; font-weight: 800; color: #22c55e; margin: 0.5rem 0; }
            .form-group { margin-bottom: 1rem; display: ${isPaid ? 'none' : 'block'}; text-align: left; }
            .form-group label { display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 0.4rem; }
            .form-control { width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #ffffff; font-size: 0.95rem; }
            .form-control:invalid { border-color: #ef4444; }
            .error-msg { color: #f87171; font-size: 0.75rem; margin-top: 4px; display: none; }
            .detail-box { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 0.9rem; margin-bottom: 1.25rem; font-size: 0.85rem; display: ${isPaid ? 'none' : 'block'}; }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
            .detail-label { color: #94a3b8; font-weight: 500; }
            .detail-value { color: #f8fafc; font-weight: 600; text-align: right; }
            .btn { width: 100%; padding: 1rem; border-radius: 12px; border: none; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.2s ease; display: block; margin-bottom: 0.75rem; }
            .btn-pay { background: #16a34a; color: #ffffff; }
            .btn-pay:hover { background: #15803d; }
            .btn-download { background: #059669; color: #ffffff; }
            .btn-fail { background: transparent; color: #94a3b8; border: 1px solid #475569; }
            #receipt { background: #ffffff; color: #166534; padding: 1.75rem; border-radius: 12px; margin-bottom: 1.5rem; text-align: center; display: ${isPaid ? 'block' : 'none'}; }
            #receipt h2 { color: #16a34a; font-size: 1.8rem; font-weight: 900; margin-bottom: 0.2rem; }
            #receipt h3 { font-size: 1rem; font-weight: 600; margin-bottom: 1rem; color: #15803d; }
            .receipt-row { display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.6rem; text-align: left; border-bottom: 1px dashed #e5e7eb; padding-bottom: 4px; }
            .r-label { font-weight: 600; color: #16a34a; width: 45%; }
            .r-value { color: #374151; width: 55%; font-weight: 600; text-align: right; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="app-container">
            <div class="app-header">
              <h1>BNB Móvil</h1>
              <p>Comprobante Electrónico - Transferencia QR</p>
            </div>
            <div class="app-body">
              
              <div class="amount-card">
                <div class="amount-label">Monto a Pagar</div>
                <div class="amount-val">Bs. ${Number(transaction.amount).toFixed(2)}</div>
              </div>

              <div class="form-group">
                <label for="payerNameInput">Nombre del Originante (Pagador) *:</label>
                <input type="text" id="payerNameInput" class="form-control" value="" placeholder="Ingrese su nombre completo" required />
                <div id="errorMsg" class="error-msg">Debe ingresar el nombre del originante para continuar.</div>
              </div>

              <div class="detail-box">
                <div class="detail-row">
                  <span class="detail-label">Concepto:</span>
                  <span class="detail-value">${transaction.gloss || 'Transferencia'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Destinatario:</span>
                  <span class="detail-value">${merchantName}</span>
                </div>
              </div>

              <div id="receipt">
                <h2>BNB</h2>
                <h3>Comprobante Electrónico</h3>
                <div style="margin-bottom: 1rem; font-size: 0.8rem; font-weight: bold; color: #16a34a;">
                  Transferencia interbancaria
                </div>
                
                <div class="receipt-row">
                  <span class="r-label">Referencia:</span>
                  <span class="r-value">${transaction.gloss || 'Sin referencia'}</span>
                </div>
                <div class="receipt-row">
                  <span class="r-label">Fecha de la transacción:</span>
                  <span class="r-value">${dateStr}</span>
                </div>
                <div class="receipt-row">
                  <span class="r-label">Hora de la transacción:</span>
                  <span class="r-value">${timeStr}</span>
                </div>
                <div class="receipt-row">
                  <span class="r-label">Nombre del originante:</span>
                  <span class="r-value">${payerNameDisplay}</span>
                </div>
                <div class="receipt-row">
                  <span class="r-label">Se debitó de su caja de ahorro:</span>
                  <span class="r-value">350****437</span>
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
                  <span class="r-label">La suma de Bs.:</span>
                  <span class="r-value">${Number(transaction.amount).toFixed(2)}</span>
                </div>
                <div class="receipt-row">
                  <span class="r-label">Bancarización:</span>
                  <span class="r-value">${receiptNum}</span>
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
              const payerNameInput = document.getElementById('payerNameInput');
              const errorMsg = document.getElementById('errorMsg');
              const payerNameVal = payerNameInput ? payerNameInput.value.trim() : '';

              if (!payerNameVal && status === 'COMPLETED') {
                payerNameInput.style.borderColor = '#ef4444';
                errorMsg.style.display = 'block';
                payerNameInput.focus();
                return;
              }

              errorMsg.style.display = 'none';
              payerNameInput.style.borderColor = '#334155';

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
                    status: status,
                    payerName: payerNameVal
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
                link.download = 'Comprobante_BNB_${transaction.aliasRef.substring(0, 10)}.png';
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
