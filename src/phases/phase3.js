const BOOTSTRAP_URL =
  'https://nt1779211331673.my.site.com/ESWWebQRDeployment1779234551621/assets/js/bootstrap.min.js'

export function initPhase3(customerId) {
  const script = document.createElement('script')
  script.type  = 'text/javascript'
  script.src   = BOOTSTRAP_URL

  script.onload  = () => _initMessaging(customerId)
  script.onerror = () => _setStatus('Error al cargar el agente. Intenta de nuevo.', true)

  document.body.appendChild(script)
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
  try {
    embeddedservice_bootstrap.prechatAPI.setHiddenPrechatFields({ customerId })
  } catch (e) {
    console.warn('prechatAPI error:', e)
  }

  setTimeout(() => embeddedservice_bootstrap.utilAPI.launchChat(), 800)

  _setStatus('El chat está abierto. Puedes comenzar la conversación.')
  document.getElementById('phase3-title').textContent = 'Agente conectado'
}

function _setStatus(text, isError = false) {
  const el = document.getElementById('phase3-sub')
  if (!el) return
  el.textContent = text
  el.style.color = isError ? '#ff453a' : ''
}
