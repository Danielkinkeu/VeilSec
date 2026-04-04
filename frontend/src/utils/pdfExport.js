// frontend/src/utils/pdfExport.js

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Génère un rapport PDF professionnel de l'analyse de stack VeilSec.
 */
export const generateStackReport = (results, stack) => {

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth  = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin       = 20
  const contentWidth = pageWidth - margin * 2
  const now          = new Date()

  // ─── Données ──────────────────────────────────────────────────
  const ai    = results?.analyse_ia     || {}
  const stats = results?.statistiques   || {}
  const cves  = results?.vulnerabilites || []
  const niveau = ai.niveau_risque       || 'INCONNU'
  const score  = ai.score_risque_global ?? 0

  const techList = stack
    ? Object.entries(stack)
        .filter(([k]) => k !== 'saved_at')
        .flatMap(([, v]) => Array.isArray(v) ? v : [])
        .filter(Boolean)
    : []

  // ─── Couleurs ─────────────────────────────────────────────────
  const C = {
    primary : [59,  130, 246],
    dark    : [17,  24,  39],
    medium  : [55,  65,  81],
    light   : [156, 163, 175],
    white   : [255, 255, 255],
    red     : [239, 68,  68],
    orange  : [249, 115, 22],
    yellow  : [234, 179, 8],
    green   : [34,  197, 94],
  }

  const riskColor = {
    'CRITIQUE': C.red,
    'ÉLEVÉ':    C.orange,
    'MODÉRÉ':   C.yellow,
    'FAIBLE':   C.green,
    'INCONNU':  C.light,
  }

  const scoreColor = riskColor[niveau] || C.light

  let y = 0

  // ─── Pied de page ─────────────────────────────────────────────
  const drawFooter = (pageNum, totalPages) => {
    const fy = pageHeight - 20
    doc.setDrawColor(...C.medium)
    doc.setLineWidth(0.3)
    doc.line(margin, fy - 2, pageWidth - margin, fy - 2)

    doc.setFontSize(6.5)
    doc.setTextColor(...C.light)
    doc.text(
      'Ce rapport est généré par IA et ne remplace pas un audit de sécurité professionnel.',
      margin, fy + 2
    )
    doc.text(
      'Aucune donnée personnelle collectée. Conformité RGPD Art. 5 & 25. Données techniques uniquement.',
      margin, fy + 6
    )
    doc.text(
      `Généré le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')} — VeilSec v2.0 — veil-sec.vercel.app`,
      margin, fy + 10
    )
    doc.setFontSize(7)
    doc.text(`${pageNum} / ${totalPages}`, pageWidth - margin, fy + 6, { align: 'right' })
  }

  // ─── Vérification saut de page ────────────────────────────────
  const checkBreak = (needed) => {
    if (y + needed > pageHeight - 30) {
      doc.addPage()
      y = margin + 5
    }
  }

  // ════════════════════════════════════════════════
  // EN-TÊTE
  // ════════════════════════════════════════════════
  doc.setFillColor(...C.dark)
  doc.rect(0, 0, pageWidth, 52, 'F')

  // Logo texte VeilSec
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text('VeilSec', margin, 18)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.primary)
  doc.text('Vulnerability Intelligence Hub', margin, 25)

  doc.setFontSize(7)
  doc.setTextColor(...C.light)
  doc.text('veil-sec.vercel.app', margin, 31)

  // Titre rapport (droite)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text("RAPPORT D'ANALYSE DE SECURITE", pageWidth - margin, 16, { align: 'right' })

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.light)
  doc.text(
    `Généré le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')}`,
    pageWidth - margin, 23, { align: 'right' }
  )
  doc.text(
    `Stack : ${techList.slice(0, 5).join(', ')}${techList.length > 5 ? '...' : ''}`,
    pageWidth - margin, 29, { align: 'right' }
  )

  y = 62

  // ════════════════════════════════════════════════
  // SCORE DE RISQUE
  // ════════════════════════════════════════════════
  doc.setDrawColor(...scoreColor)
  doc.setLineWidth(0.5)
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'S')

  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...scoreColor)
  doc.text(`${score}/10`, margin + 6, y + 17)

  doc.setFontSize(14)
  doc.text(niveau, margin + 42, y + 10)

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.light)
  doc.text('SCORE DE RISQUE GLOBAL', margin + 42, y + 17)

  // Barre progression
  const bx = margin + 85
  const bw = contentWidth - 90
  doc.setFillColor(...C.medium)
  doc.roundedRect(bx, y + 11, bw, 3.5, 1, 1, 'F')
  doc.setFillColor(...scoreColor)
  doc.roundedRect(bx, y + 11, bw * (score / 10), 3.5, 1, 1, 'F')

  y += 34

  // ════════════════════════════════════════════════
  // STACK ANALYSÉE
  // ════════════════════════════════════════════════
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.primary)
  doc.text('STACK TECHNIQUE ANALYSEE', margin, y)
  y += 4

  doc.setFillColor(240, 244, 255)
  doc.roundedRect(margin, y, contentWidth, 9, 1, 1, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(30, 60, 120)
  const techStr = techList.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join('  ·  ')
  doc.text(techStr.slice(0, 110), margin + 3, y + 6)
  y += 16

  // ════════════════════════════════════════════════
  // RÉSUMÉ EXPOSITION
  // ════════════════════════════════════════════════
  if (ai.resume_exposition) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.primary)
    doc.text("RESUME DE L'EXPOSITION", margin, y)
    y += 4

    const lines = doc.splitTextToSize(ai.resume_exposition, contentWidth - 6)
    const h = lines.length * 4.5 + 6
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(margin, y, contentWidth, h, 2, 2, 'F')
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 40, 60)
    doc.text(lines, margin + 3, y + 5)
    y += h + 8
  }

  // ════════════════════════════════════════════════
  // IMPACT POTENTIEL
  // ════════════════════════════════════════════════
  if (ai.impact_potentiel) {
    checkBreak(30)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.red)
    doc.text('IMPACT POTENTIEL', margin, y)
    y += 4

    const lines = doc.splitTextToSize(ai.impact_potentiel, contentWidth - 8)
    const h = lines.length * 4.5 + 6
    doc.setFillColor(254, 242, 242)
    doc.roundedRect(margin, y, contentWidth, h, 2, 2, 'F')
    doc.setFillColor(...C.red)
    doc.rect(margin, y, 3, h, 'F')
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(160, 40, 40)
    doc.text(lines, margin + 6, y + 5)
    y += h + 8
  }

  // ════════════════════════════════════════════════
  // STATISTIQUES
  // ════════════════════════════════════════════════
  checkBreak(50)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.primary)
  doc.text('STATISTIQUES DES VULNERABILITES', margin, y)
  y += 3

  const total = results.total_vulnerabilites || 1
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Catégorie', 'Nombre', '%']],
    body: [
      ['Critiques',          stats.critiques      ?? 0, `${Math.round(((stats.critiques      ?? 0) / total) * 100)}%`],
      ['Hautes',             stats.hautes         ?? 0, `${Math.round(((stats.hautes         ?? 0) / total) * 100)}%`],
      ['Moyennes',           stats.moyennes       ?? 0, `${Math.round(((stats.moyennes       ?? 0) / total) * 100)}%`],
      ['Faibles',            stats.faibles        ?? 0, `${Math.round(((stats.faibles        ?? 0) / total) * 100)}%`],
      ['Activement exploites', stats.actifs_exploit ?? 0, `${Math.round(((stats.actifs_exploit ?? 0) / total) * 100)}%`],
      ['Enrichis par IA',    stats.enrichis       ?? 0, `${Math.round(((stats.enrichis       ?? 0) / total) * 100)}%`],
      ['TOTAL',              results.total_vulnerabilites ?? 0, '100%'],
    ],
    styles:      { fontSize: 8.5, cellPadding: 2.5 },
    headStyles:  { fillColor: C.primary, textColor: C.white, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 25, halign: 'center' },
    },
  })
  y = doc.lastAutoTable.finalY + 12

  // ════════════════════════════════════════════════
  // VECTEURS D'ATTAQUE
  // ════════════════════════════════════════════════
  if (ai.vecteurs_attaque?.length > 0) {
    checkBreak(20)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.primary)
    doc.text("VECTEURS D'ATTAQUE IDENTIFIES", margin, y)
    y += 6

    ai.vecteurs_attaque.forEach((v, i) => {
      checkBreak(22)
      const vc = riskColor[v.criticite] || C.light

      doc.setFillColor(...vc)
      doc.rect(margin, y, 3, 20, 'F')

      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 40, 60)
      doc.text(`${i + 1}. ${v.titre}`, margin + 7, y + 6)

      doc.setFontSize(7)
      doc.setTextColor(...vc)
      doc.text(`[${v.criticite}]`, pageWidth - margin, y + 6, { align: 'right' })

      const dlines = doc.splitTextToSize(v.description, contentWidth - 15)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...C.medium)
      doc.text(dlines[0], margin + 7, y + 12)

      if (v.cve_associes?.length > 0) {
        doc.setFontSize(7)
        doc.setTextColor(...C.primary)
        doc.text(`CVE : ${v.cve_associes.join(', ')}`, margin + 7, y + 17)
      }
      y += 24
    })
    y += 4
  }

  // ════════════════════════════════════════════════
  // RECOMMANDATIONS
  // ════════════════════════════════════════════════
  if (ai.recommandations) {
    checkBreak(20)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.primary)
    doc.text("PLAN D'ACTION RECOMMANDE", margin, y)
    y += 6

    const sections = [
      { key: 'immediat',      label: 'ACTIONS IMMEDIATES - Aujourd\'hui',        color: C.red,    fill: [254, 242, 242] },
      { key: 'cette_semaine', label: 'CETTE SEMAINE - 7 prochains jours',         color: C.orange, fill: [255, 247, 237] },
      { key: 'ce_mois',       label: 'CE MOIS - 30 prochains jours',              color: C.primary, fill: [239, 246, 255] },
    ]

    sections.forEach(({ key, label, color, fill }) => {
      const items = ai.recommandations[key] || []
      if (!items.length) return

      const h = items.length * 7 + 14
      checkBreak(h + 5)

      doc.setFillColor(...fill)
      doc.roundedRect(margin, y, contentWidth, h, 2, 2, 'F')
      doc.setFillColor(...color)
      doc.rect(margin, y, 3, h, 'F')

      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...color)
      doc.text(label, margin + 7, y + 7)

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(30, 40, 60)
      items.forEach((item, idx) => {
        doc.setFontSize(8)
        const l = doc.splitTextToSize(`-> ${item}`, contentWidth - 15)
        doc.text(l[0], margin + 10, y + 13 + idx * 7)
      })
      y += h + 6
    })
    y += 4
  }

  // ════════════════════════════════════════════════
  // POINTS POSITIFS
  // ════════════════════════════════════════════════
  if (ai.points_positifs?.length > 0) {
    checkBreak(20)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.green)
    doc.text('POINTS POSITIFS DE VOTRE STACK', margin, y)
    y += 4

    const h = ai.points_positifs.length * 6 + 8
    doc.setFillColor(240, 253, 244)
    doc.roundedRect(margin, y, contentWidth, h, 2, 2, 'F')
    doc.setFillColor(...C.green)
    doc.rect(margin, y, 3, h, 'F')

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(20, 100, 50)
    ai.points_positifs.forEach((p, i) => {
      doc.text(`+ ${p}`, margin + 7, y + 6 + i * 6)
    })
    y += h + 10
  }

  // ════════════════════════════════════════════════
  // TOP 20 CVE
  // ════════════════════════════════════════════════
  if (cves.length > 0) {
    checkBreak(20)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.primary)
    doc.text(`TOP VULNERABILITES (${Math.min(cves.length, 20)} sur ${cves.length})`, margin, y)
    y += 3

    const critColors = {
      'CRITIQUE': [220, 38,  38],
      'HAUTE':    [234, 88,  12],
      'MOYENNE':  [161, 98,   7],
      'FAIBLE':   [21,  128, 61],
      'INCONNUE': [107, 114, 128],
    }

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['ID CVE', 'Criticite', 'Score', 'Source', 'Description']],
      body: cves.slice(0, 20).map(cve => [
        cve.id,
        cve.criticite || 'N/A',
        cve.score_cvss?.toFixed(1) ?? 'N/A',
        (cve.source || '').toUpperCase(),
        (cve.resume_ia || cve.description || '').slice(0, 80) + '...',
      ]),
      styles:     { fontSize: 7.5, cellPadding: 2.5, overflow: 'linebreak' },
      headStyles: { fillColor: C.primary, textColor: C.white, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 32, fontStyle: 'bold' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 'auto' },
      },
      didParseCell: (data) => {
        if (data.column.index === 1 && data.section === 'body') {
          data.cell.styles.textColor = critColors[data.cell.raw] || [107, 114, 128]
          data.cell.styles.fontStyle = 'bold'
        }
      },
    })
  }

  // ════════════════════════════════════════════════
  // PIEDS DE PAGE
  // ════════════════════════════════════════════════
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    drawFooter(i, totalPages)
  }

  // ─── Téléchargement ───────────────────────────────────────────
  const filename = `VeilSec_Rapport_${now.toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}