import jsPDF from 'jspdf'
import { langName } from './languages'

export function downloadTranscript(transcripts, sourceLang, targetLang) {
  if (!transcripts.length) return

  const doc = new jsPDF()
  const marginX = 14
  let y = 20

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Meeting Transcript', marginX, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`${langName(sourceLang)} -> ${langName(targetLang)}  |  Generated ${new Date().toLocaleString()}`, marginX, y)
  y += 10
  doc.setTextColor(20)

  transcripts.forEach((t, i) => {
    if (y > 265) {
      doc.addPage()
      y = 20
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(120)
    doc.text(`${i + 1}. ${t.time}`, marginX, y)
    y += 5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(20)
    const original = doc.splitTextToSize(`[${langName(sourceLang)}] ${t.src || '(no speech detected)'}`, 180)
    doc.text(original, marginX, y)
    y += original.length * 6

    doc.setFont('helvetica', 'italic')
    doc.setTextColor(70)
    const translated = doc.splitTextToSize(`[${langName(targetLang)}] ${t.text}`, 180)
    doc.text(translated, marginX, y)
    y += translated.length * 6 + 6
    doc.setTextColor(20)
  })

  doc.save(`transcript-${Date.now()}.pdf`)
}
