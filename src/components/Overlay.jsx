import { useEffect, useRef, useState } from 'react'

// Floats the current subtitle over any window (Zoom, Meet, Teams) via the
// browser's native Picture-in-Picture, by streaming a <canvas> as video.
export default function Overlay({ text }) {
  const canvasRef = useRef(null)
  const videoRef = useRef(null)
  const [isFloating, setIsFloating] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
    grad.addColorStop(0, 'rgba(11,15,30,0.92)')
    grad.addColorStop(1, 'rgba(11,15,30,0.98)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = '#E7E9F5'
    ctx.font = 'bold 46px "Space Grotesk", Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const maxWidth = canvas.width - 60
    const lines = wrapText(ctx, text || 'Waiting for speech…', maxWidth)
    const lineHeight = 56
    const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2
    lines.forEach((line, i) => ctx.fillText(line, canvas.width / 2, startY + i * lineHeight))
  }, [text])

  const openPiP = async () => {
    try {
      const stream = canvasRef.current.captureStream(15)
      const video = videoRef.current
      video.srcObject = stream
      await video.play()
      await video.requestPictureInPicture()
      setIsFloating(true)
      video.addEventListener(
        'leavepictureinpicture',
        () => setIsFloating(false),
        { once: true }
      )
    } catch (err) {
      console.error('Picture-in-Picture failed:', err)
      alert('This browser does not support floating overlay mode. Try Chrome or Edge.')
    }
  }

  return (
    <>
      <canvas ref={canvasRef} width={900} height={220} style={{ display: 'none' }} />
      <video ref={videoRef} muted playsInline style={{ display: 'none' }} />
      <button onClick={openPiP} className="btn-sculpt btn-ghost px-6 py-3 text-base flex items-center gap-2">
        <span>🖼️</span>
        <span>{isFloating ? 'Overlay active' : 'Float subtitles'}</span>
      </button>
    </>
  )
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let current = ''

  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines.slice(0, 3)
}
