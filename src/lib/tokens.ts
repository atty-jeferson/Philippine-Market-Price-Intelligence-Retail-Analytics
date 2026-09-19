/**
 * THE GROCER — Central Design System Tokens
 * Philippine Retail Market Intelligence
 * 
 * Central source of truth for:
 * - Brand Colors & Palette (Light-First: Warm White, Soft Sage, Grocer Green, Stone)
 * - Typography System (Editorial, UI, Data/Numeric)
 * - Surfaces, Borders, Radii, Shadows
 * - Chart Colors & Visualizer Config (Tonal greens & neutrals, no rainbow)
 * - Evidence & Epistemic Status Designations
 */

export const TOKENS = {
  colors: {
    // 1. Primary Palette (Light-First)
    canvas: '#FAFAF7',        // Warm slightly creamy white workspace
    canvasSecondary: '#F4F5EF',// Light neutral secondary
    canvasSage: '#EEF4EE',    // Very light sage
    surface: '#FFFFFF',       // Primary card/table surface
    surfaceSubtle: '#F4F5EF', // Subdued surface
    surfaceHover: '#EEF4EE',  // Table/list hover
    ink: '#163829',           // Dominant softened deep green text (never pure black)
    inkSecondary: '#3B4840',  // Secondary reading text
    inkMuted: '#4F5751',      // Body text
    inkSubtle: '#737A74',     // Metadata, captions, column headers
    inkFaint: '#A8B0A8',      // Placeholders, disabled states
    border: '#E3E6DF',        // Subtle light stone/gray architectural border
    borderSubtle: '#EEF0EA',  // Very faint dividers
    borderHover: '#A8C5B4',   // Interactive border hover (sage)

    // 2. Primary Brand Accent — Philippine Retail Intelligence
    brand: {
      primary: '#176B4D',       // Official Grocer Green
      primaryHover: '#13583E',
      light: '#EAF4ED',         // Active nav & parity tint
      border: '#DDEBE1',        // Pale sage border
      ring: 'rgba(23, 107, 77, 0.15)',
    },

    // 3. Supporting Muted Tones
    supporting: {
      sage: '#A8C5B4',
      paleSage: '#DDEBE1',
      stone: '#E8E7DF',
      warmGray: '#777A74',
      mediumGray: '#5F625D',
      mutedGreen: '#4B735E',
      deepGreen: '#163829',
    },

    // 4. Epistemic Evidence Designations (Core THE GROCER differentiator)
    evidence: {
      observed: {
        label: 'OBSERVED',
        badgeBg: 'bg-[#EEF4EE]',
        badgeText: 'text-[#176B4D]',
        badgeBorder: 'border-[#DDEBE1]',
        dotColor: '#176B4D',
        description: 'Store-inspected shelf price & net weight',
      },
      normalized: {
        label: 'NORMALIZED',
        badgeBg: 'bg-[#EAF4ED]',
        badgeText: 'text-[#176B4D]',
        badgeBorder: 'border-[#DDEBE1]',
        dotColor: '#176B4D',
        description: 'Standardized per 100g unit economics',
      },
      derived: {
        label: 'DERIVED',
        badgeBg: 'bg-[#F4F5EF]',
        badgeText: 'text-[#3B4840]',
        badgeBorder: 'border-[#E3E6DF]',
        dotColor: '#4B735E',
        description: 'RPP, price index & quartile statistics',
      },
      signal: {
        label: 'SIGNAL',
        badgeBg: 'bg-[#FFFDF5]',
        badgeText: 'text-[#B8860B]',
        badgeBorder: 'border-[#F4E8B8]',
        dotColor: '#C27D22',
        description: 'Deterministic market anomaly or dispersion',
      },
      opportunity: {
        label: 'OPPORTUNITY',
        badgeBg: 'bg-[#EAF4ED]',
        badgeText: 'text-[#176B4D]',
        badgeBorder: 'border-[#A8C5B4]',
        dotColor: '#176B4D',
        description: 'Commercial pricing or channel investigation',
      },
      insufficient: {
        label: 'INSUFFICIENT DATA',
        badgeBg: 'bg-[#F4F5EF]',
        badgeText: 'text-[#737A74]',
        badgeBorder: 'border-[#E3E6DF]',
        dotColor: '#777A74',
        description: 'Sub-threshold observation sample',
      }
    },

    // 5. Signal & Severity Colors (Muted, restrained)
    signals: {
      success: '#176B4D',
      successLight: '#EAF4ED',
      successBorder: '#DDEBE1',
      warning: '#B8860B',
      warningLight: '#FFFDF5',
      warningBorder: '#F4E8B8',
      danger: '#C04D44',
      dangerLight: '#FDF4F3',
      dangerBorder: '#F5C8C4',
    },

    // 6. Visualizer / Chart Palette (Strict, tonal greens + neutrals, NO RAINBOW)
    charts: {
      benchmark: '#777A74',     // Category benchmark (dashed neutral gray)
      primaryTrend: '#176B4D',  // Category median or primary line (Grocer Green)
      secondaryTrend: '#A8C5B4',// Secondary trend (Soft Sage)
      thirdTrend: '#B4BCB3',    // Third trend (Stone)
      accent: '#23805C',        // Comparative entity
      bandFill: 'rgba(23, 107, 77, 0.05)', // Interquartile range fill
      grid: '#E8E7DF',          // Subtle Cartesian grid
      axis: '#737A74',          // Axis labels and tick text
      
      // Brand positioning colors (tonal greens, stone & muted neutrals)
      brands: {
        Colgate: '#176B4D',      // Deep Grocer Green
        CloseUp: '#23805C',      // Medium Green
        Sensodyne: '#4B735E',    // Muted Green
        Hapee: '#777A74',        // Warm Gray
        Darlie: '#A8C5B4',       // Sage
        OralB: '#5F625D',        // Medium Gray
        Other: '#B4BCB3',        // Stone
      },

      // Retailer channel colors (tonal greens & neutrals)
      retailers: {
        'SM Supermarket': '#176B4D',
        'Puregold': '#23805C',
        'Robinsons Supermarket': '#4B735E',
        'Mercury Drug': '#777A74',
        'Other': '#A8C5B4',
      }
    }
  },

  // Typography Class Names & Guidelines
  typography: {
    editorial: 'font-editorial font-medium tracking-tight',
    editorialBold: 'font-editorial font-bold tracking-tight',
    ui: 'font-sans font-normal',
    uiMedium: 'font-sans font-medium',
    uiBold: 'font-sans font-semibold tracking-tight',
    
    // Numeric & Data (DISTINCTIVE, TABULAR, NOT MONOSPACE)
    data: 'font-data tabular-nums font-semibold tracking-tight',
    dataFigureLg: 'font-data tabular-nums text-3xl sm:text-4xl font-bold tracking-tight leading-none text-[#163829]',
    dataFigureMd: 'font-data tabular-nums text-xl sm:text-2xl font-bold tracking-tight leading-none text-[#163829]',
    dataFigureSm: 'font-data tabular-nums text-sm sm:text-base font-semibold tracking-tight text-[#163829]',
    
    // Eyebrows & Meta labels
    eyebrow: 'text-[10px] font-sans font-bold uppercase tracking-wider text-[#737A74]',
    meta: 'text-[11px] font-sans text-[#737A74]',
  },

  // Shadows & Elevation
  shadows: {
    card: 'shadow-[0_1px_3px_rgba(22,56,41,0.04),0_2px_8px_rgba(22,56,41,0.02)]',
    floating: 'shadow-[0_10px_25px_rgba(22,56,41,0.08),0_2px_6px_rgba(22,56,41,0.03)]',
  },

  // Radii
  radii: {
    card: 'rounded-xl',
    control: 'rounded-lg',
    badge: 'rounded-md',
    pill: 'rounded-full',
  }
} as const;

