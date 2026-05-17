import jsQR from 'jsqr'

/**
 * Fase 2: acceso a cámara + escaneo de QR con jsQR.
 * @param {(qrContent: string) => void} onQRDetected
 */
export async function initPhase2(onQRDetected) {
  const btn      = document.getElementById('btn-camera')
  const status   = document.getElementById('scan-status')
  const video    = document.getElementById('camera-feed')
  const canvas   = document.getElementById('scan-canvas')

  btn.addEventListener('click', async () => {
    btn.disabled = true
    status.textContent = 'Solicitando acceso a la cámara…'

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })

      video.srcObject = stream
      await video.play()

      status.textContent = 'Buscando código QR…'
      _startScanLoop(video, canvas, stream, status, onQRDetected)
    } catch (err) {
      console.error('Camera error:', err)
      status.textContent = 'No se pudo acceder a la cámara.'
      btn.disabled = false
    }
  })
}

// Número de frames consecutivos con el mismo resultado antes de aceptarlo
const CONFIRM_FRAMES = 8

function _startScanLoop(video, canvas, stream, status, onDetected) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  let rafId
  let lastData  = null
  let streak    = 0

  function tick() {
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafId = requestAnimationFrame(tick)
      return
    }

    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    })

    if (code) {
      if (code.data === lastData) {
        streak++
      } else {
        // Resultado distinto al anterior — reinicia el contador
        lastData = code.data
        streak   = 1
      }

      const remaining = CONFIRM_FRAMES - streak
      status.textContent = remaining > 0
        ? `QR encontrado, confirmando… (${remaining})`
        : ''

      if (streak >= CONFIRM_FRAMES) {
        cancelAnimationFrame(rafId)
        stream.getTracks().forEach((t) => t.stop())
        status.textContent = `QR detectado: ${code.data}`
        onDetected(code.data)
      } else {
        rafId = requestAnimationFrame(tick)
      }
    } else {
      // Sin detección — resetea el streak
      lastData = null
      streak   = 0
      status.textContent = 'Buscando código QR…'
      rafId = requestAnimationFrame(tick)
    }
  }

  rafId = requestAnimationFrame(tick)
}
