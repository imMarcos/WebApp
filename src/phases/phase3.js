const BOOTSTRAP_URL =
  'https://nt1779211331673.my.site.com/ESWWebQRDeployment1779234551621/assets/js/bootstrap.min.js'

// Preload the bootstrap script as soon as phase 2 starts, before the QR is scanned
export function preloadWidget() {
  if (document.querySelector(`script[src="${BOOTSTRAP_URL}"]`)) return
  const script = document.createElement('script')
  script.type = 'text/javascript'
  script.src  = BOOTSTRAP_URL
  document.body.appendChild(script)
}

/**
 * Fase 3: inicializa el widget de Agentforce Embedded Messaging
 * con el customerId obtenido del QR. El script ya fue precargado en fase 2.
 *
 * @param {string} customerId  Contenido del QR escaneado en Fase 2
 */
export function initPhase3(customerId) {
  _clearSalesforceSession()

  const existing = document.querySelector(`script[src="${BOOTSTRAP_URL}"]`)

  if (window.embeddedservice_bootstrap) {
    // Script ya cargado y ejecutado — inicializar de inmediato
    _initMessaging(customerId)
  } else if (existing) {
    // Script en descarga — esperar a que termine
    existing.addEventListener('load',  () => _initMessaging(customerId))
    existing.addEventListener('error', () => _setStatus('Error al cargar el agente. Intenta de nuevo.', true))
  } else {
    // Fallback: inyectar ahora si preload no corrió
    const script = document.createElement('script')
    script.type  = 'text/javascript'
    script.src   = BOOTSTRAP_URL
    script.onload  = () => _initMessaging(customerId)
    script.onerror = () => _setStatus('Error al cargar el agente. Intenta de nuevo.', true)
    document.body.appendChild(script)
  }
}

function _initMessaging(customerId) {
  try {
    embeddedservice_bootstrap.settings.language = 'es'

    embeddedservice_bootstrap.init(
      '00DKh000003TzXB',
      'WebQRDeployment',
      'https://nt1779211331673.my.site.com/ESWWebQRDeployment1779234551621',
      { scrt2URL: 'https://nt1779211331673.my.salesforce-scrt.com' }
    )

    window.addEventListener('onEmbeddedMessagingReady', () => {
      _onReady(customerId)
    })
  } catch (err) {
    console.error('Agentforce init error:', err)
    _setStatus('Error al inicializar el agente.', true)
  }
}

function _onReady(customerId) {
  window.addEventListener('beforeunload', () => {
    try { embeddedservice_bootstrap.utilAPI.endChat() } catch {}
    _clearSalesforceSession()
  })

  embeddedservice_bootstrap.prechatAPI.setHiddenPrechatFields({ customerId })

  if (_hasActiveSession()) {
    window.addEventListener('onEmbeddedMessagingConversationEnded', () => {
      _clearSalesforceSession()
      setTimeout(() => embeddedservice_bootstrap.utilAPI.launchChat(), 600)
    }, { once: true })

    try {
      embeddedservice_bootstrap.utilAPI.endChat()
    } catch {
      _clearSalesforceSession()
      setTimeout(() => embeddedservice_bootstrap.utilAPI.launchChat(), 800)
    }
  } else {
    setTimeout(() => embeddedservice_bootstrap.utilAPI.launchChat(), 800)
  }

  _setStatus('El chat está abierto. Puedes comenzar la conversación.')
  document.getElementById('phase3-title').textContent = 'Agente conectado'
}

function _hasActiveSession() {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.includes('embeddedservice') || key.includes('ESW') || key.includes('00DKh000003TzXB'))) {
      return true
    }
  }
  return false
}

function _clearSalesforceSession() {
  const keysToRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.includes('embeddedservice') || key.includes('ESW') || key.includes('00DKh000003TzXB'))) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key))
}

function _setStatus(text, isError = false) {
  const el = document.getElementById('phase3-sub')
  if (!el) return
  el.textContent  = text
  el.style.color  = isError ? '#ff453a' : ''
}
