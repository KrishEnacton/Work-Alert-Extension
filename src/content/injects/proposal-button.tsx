import ReactDOM from 'react-dom/client'
import ProprosalButton from '../components/proposal/ProposalButton'

const config = { attributes: true, childList: true, subtree: true }

const callback = () => {
  if (document.querySelector('#injected-button')) {
    observer.disconnect()
    return true
  }
  let div = document.createElement('div') as HTMLElement
  div.id = 'injected-button'
  div.style.position = 'relative'
  const shadow = div.attachShadow({ mode: 'open' })

  const coverLetterDiv = document.querySelector('.cover-letter-area')
  coverLetterDiv?.prepend(div)
  const renderElem = document.createElement('div')
  renderElem.id = 'render-button'
  renderElem.style.right = '2px'
  renderElem.style.bottom = '-20px'
  renderElem.style.position = 'absolute'

  ReactDOM.createRoot(renderElem).render(<ProprosalButton />)
  shadow.appendChild(renderElem)
}

// Create an observer instance linked to the callback function
const observer = new MutationObserver(callback)

// Start observing the target node for configured mutations
observer.observe(document.body, config)
