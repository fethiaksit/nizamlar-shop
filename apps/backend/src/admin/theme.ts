/**
 * Nizamlar Admin Ortak Tasarım Sistemi (Design System)
 *
 * Kurumsal Renk Paleti:
 * - Antrasit:  #222325 (Koyu zemin, ana metinler, kurumsal kontrast)
 * - Kahverengi: #49372E (Vurgu, koyu buton hover, sıcak geçişler)
 * - Gold:       #B29460 (Birincil marka aksanı, altın rozetler, butonlar)
 * - Krem:       #F3EFE7 (Açık tema zemin dokusu, açık rozetler)
 * - Beyaz:      #FFFFFF (Kart zeminleri, kontrast yüzeyler)
 *
 * Hem açık (Light) hem koyu (Dark) Medusa temalarını destekler.
 * WCAG AA 4.5:1 kontrast standardına uygundur.
 */

export const nizamlarColors = {
  anthracite: "#222325",
  brown: "#49372E",
  gold: "#B29460",
  goldHover: "#9E8250",
  goldSubtle: "#FAF2E6",
  goldSubtleDark: "rgba(178, 148, 96, 0.15)",
  cream: "#F3EFE7",
  white: "#FFFFFF",
} as const

export const adminTheme = {
  // Sayfa ve Kapsayıcılar
  page: "flex flex-col gap-y-6 max-w-7xl font-sans text-ui-fg-base",

  // Kartlar ve Yüzeyler
  card: "bg-ui-bg-base border border-ui-border-base text-ui-fg-base rounded-2xl shadow-xs transition-colors",
  cardSubtle: "bg-ui-bg-subtle/80 border border-ui-border-base text-ui-fg-base rounded-xl transition-colors",
  cardInteractive:
    "bg-ui-bg-base border border-ui-border-base hover:border-[#B29460] rounded-xl text-ui-fg-base transition-all group",

  // Başlıklar ve Metinler
  headingPrimary: "text-2xl font-black text-ui-fg-base tracking-tight",
  headingSecondary: "text-base font-bold text-ui-fg-base",
  headingCard: "text-sm font-bold text-ui-fg-base",
  textDescription: "text-xs text-ui-fg-subtle leading-relaxed",
  textMuted: "text-xs text-ui-fg-muted",
  textSubtle: "text-xs text-ui-fg-subtle font-medium",
  textCode: "font-mono text-xs text-ui-fg-subtle bg-ui-bg-subtle px-1.5 py-0.5 rounded border border-ui-border-base",

  // Form Alanları ve Etiketler
  label: "text-xs font-bold text-ui-fg-base mb-1 block",
  labelSubtle: "text-[11px] font-semibold text-ui-fg-subtle mb-1 block",
  input:
    "w-full px-3 py-2 text-xs rounded-lg border border-ui-border-base bg-ui-bg-field text-ui-fg-base placeholder:text-ui-fg-muted focus:outline-none focus:border-[#B29460] focus:ring-1 focus:ring-[#B29460] transition-colors disabled:opacity-60 disabled:cursor-not-allowed",
  textarea:
    "w-full p-2.5 text-xs rounded-lg border border-ui-border-base bg-ui-bg-field text-ui-fg-base placeholder:text-ui-fg-muted focus:outline-none focus:border-[#B29460] focus:ring-1 focus:ring-[#B29460] transition-colors leading-relaxed disabled:opacity-60 disabled:cursor-not-allowed",
  select:
    "w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:outline-none focus:border-[#B29460] focus:ring-1 focus:ring-[#B29460] transition-colors disabled:opacity-60 disabled:cursor-not-allowed",

  // Butonlar (Gold üzerinde her zaman koyu #222325 metin kullanılır)
  btnGold:
    "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-[#B29460] hover:bg-[#9E8250] text-[#222325] shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
  btnDark:
    "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#222325] hover:bg-[#49372E] text-white dark:bg-ui-bg-component dark:hover:bg-ui-bg-base border border-transparent dark:border-ui-border-base shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
  btnSecondary:
    "inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-ui-bg-base hover:bg-ui-bg-subtle text-ui-fg-base border border-ui-border-base shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
  btnDanger:
    "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer disabled:opacity-50",

  // Rozetler
  badgeGold:
    "bg-[#B29460] text-[#222325] font-black tracking-wider text-[11px] uppercase px-2.5 py-0.5 rounded-md border-0 inline-flex items-center gap-1",
  badgeGoldOutline:
    "bg-[#B29460]/15 text-[#B29460] dark:text-[#F3EFE7] border border-[#B29460]/40 font-bold text-xs px-2.5 py-0.5 rounded-md inline-flex items-center gap-1",
  badgeNeutral:
    "bg-ui-bg-subtle text-ui-fg-subtle border border-ui-border-base font-semibold text-xs px-2 py-0.5 rounded-md inline-flex items-center gap-1",
  badgeSuccess:
    "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5",
  badgeDraft:
    "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-bold text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5",

  // Tablolar
  tableHeader:
    "bg-ui-bg-subtle border-b border-ui-border-base text-xs font-bold text-ui-fg-subtle uppercase tracking-wider",
  tableRow: "hover:bg-ui-bg-subtle/50 transition-colors border-b border-ui-border-base",
  tableCell: "py-3.5 px-4 text-ui-fg-base",

  // Seçili ve Pasif Durumlar
  selectedItem: "border-2 border-[#B29460] bg-amber-50/40 dark:bg-[#B29460]/10 shadow-xs",
  unselectedItem: "border border-ui-border-base hover:border-[#B29460]/60 bg-ui-bg-base",
  disabledField: "opacity-60 cursor-not-allowed bg-ui-bg-disabled text-ui-fg-disabled",
} as const
