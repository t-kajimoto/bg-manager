'use client';
import { createTheme } from '@mui/material/styles';

// ============================================================================
// HARIDICE Material Design 3 テーマ定義
// ============================================================================

// ブランドカラー: ロゴのハリネズミオレンジをベースにしたM3カラースキーム
// HARIDICEのアイデンティティ = ハリネズミ(HARI) + サイコロ(DICE)

// --- M3 カラートークン ---
const m3Colors = {
  // Primary: ハリネズミのオレンジ（ロゴの特徴的な色）
  primary: '#E8593F',
  onPrimary: '#FFFFFF',
  primaryContainer: '#FFDAD2',
  onPrimaryContainer: '#3B0900',

  // Secondary: 温かみのあるブラウン系（ハリネズミの毛色イメージ）
  secondary: '#77574C',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#FFDBD0',
  onSecondaryContainer: '#2C150D',

  // Tertiary: ボードゲームのダイス色を想起させるティール
  tertiary: '#6C5D2F',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#F5E1A7',
  onTertiaryContainer: '#231B00',

  // Error
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',

  // Surface（ライトテーマ）
  surface: '#FFFBFF',
  onSurface: '#201A18',
  surfaceVariant: '#F5DED6',
  onSurfaceVariant: '#53433E',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#FEF1EC',
  surfaceContainer: '#F8EBE6',
  surfaceContainerHigh: '#F2E5E0',
  surfaceContainerHighest: '#EDE0DB',

  // Outline
  outline: '#85736D',
  outlineVariant: '#D8C2BA',

  // Inverse
  inverseSurface: '#362F2C',
  inverseOnSurface: '#FBEEEA',
  inversePrimary: '#FFB4A1',
};

// --- M3 ダークテーマカラートークン ---
const m3DarkColors = {
  primary: '#FFB4A1',
  onPrimary: '#5F1500',
  primaryContainer: '#832200',
  onPrimaryContainer: '#FFDAD2',

  secondary: '#E7BDB0',
  onSecondary: '#442A20',
  secondaryContainer: '#5D4036',
  onSecondaryContainer: '#FFDBD0',

  tertiary: '#D8C58D',
  onTertiary: '#3B2F05',
  tertiaryContainer: '#534519',
  onTertiaryContainer: '#F5E1A7',

  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',

  surface: '#1A1110',
  onSurface: '#EDE0DB',
  surfaceVariant: '#53433E',
  onSurfaceVariant: '#D8C2BA',
  surfaceContainerLowest: '#140C0A',
  surfaceContainerLow: '#201A18',
  surfaceContainer: '#251E1C',
  surfaceContainerHigh: '#2F2826',
  surfaceContainerHighest: '#3B3330',

  outline: '#A08D86',
  outlineVariant: '#53433E',

  inverseSurface: '#EDE0DB',
  inverseOnSurface: '#362F2C',
  inversePrimary: '#A63A1C',
};

// --- テーマ作成 ---
const theme = createTheme({
  // M3 Window Size Classes に合わせたブレークポイント
  breakpoints: {
    values: {
      xs: 0, // Compact（モバイル）
      sm: 600, // Medium（タブレット）
      md: 840, // Expanded（デスクトップ）
      lg: 1200, // Large（ワイドスクリーン）
      xl: 1600, // Extra Large
    },
  },

  // --- パレット ---
  palette: {
    primary: {
      main: m3Colors.primary,
      light: m3Colors.primaryContainer,
      dark: m3Colors.onPrimaryContainer,
      contrastText: m3Colors.onPrimary,
    },
    secondary: {
      main: m3Colors.secondary,
      light: m3Colors.secondaryContainer,
      dark: m3Colors.onSecondaryContainer,
      contrastText: m3Colors.onSecondary,
    },
    error: {
      main: m3Colors.error,
      light: m3Colors.errorContainer,
      dark: m3Colors.onErrorContainer,
      contrastText: m3Colors.onError,
    },
    background: {
      default: m3Colors.surface,
      paper: m3Colors.surfaceContainerLow,
    },
    text: {
      primary: m3Colors.onSurface,
      secondary: m3Colors.onSurfaceVariant,
    },
    divider: m3Colors.outlineVariant,
  },

  // --- タイポグラフィ ---
  // M3 Type Scale に準拠。日本語はNoto Sans JP、英数字はRobotoを使用
  typography: {
    fontFamily: '"Noto Sans JP", "Roboto", "Helvetica", "Arial", sans-serif',
    // Display Large
    h1: {
      fontSize: '2.8125rem', // 45px
      lineHeight: 1.15,
      fontWeight: 400,
      letterSpacing: '0px',
    },
    // Display Medium（実際のページタイトル用）
    h2: {
      fontSize: '2.25rem', // 36px
      lineHeight: 1.22,
      fontWeight: 400,
      letterSpacing: '0px',
    },
    // Display Small
    h3: {
      fontSize: '1.5rem', // 24px
      lineHeight: 1.33,
      fontWeight: 400,
    },
    // Headline Large
    h4: {
      fontSize: '1.75rem', // 28px
      lineHeight: 1.28,
      fontWeight: 400,
    },
    // Headline Medium
    h5: {
      fontSize: '1.5rem', // 24px
      lineHeight: 1.33,
      fontWeight: 400,
    },
    // Title Large
    h6: {
      fontSize: '1.375rem', // 22px
      lineHeight: 1.27,
      fontWeight: 500,
    },
    // Title Medium
    subtitle1: {
      fontSize: '1rem', // 16px
      lineHeight: 1.5,
      fontWeight: 500,
      letterSpacing: '0.15px',
    },
    // Title Small
    subtitle2: {
      fontSize: '0.875rem', // 14px
      lineHeight: 1.43,
      fontWeight: 500,
      letterSpacing: '0.1px',
    },
    // Body Large
    body1: {
      fontSize: '1rem', // 16px
      lineHeight: 1.5,
      fontWeight: 400,
      letterSpacing: '0.5px',
    },
    // Body Medium
    body2: {
      fontSize: '0.875rem', // 14px
      lineHeight: 1.43,
      fontWeight: 400,
      letterSpacing: '0.25px',
    },
    // Label Large
    button: {
      fontSize: '0.875rem', // 14px
      lineHeight: 1.43,
      fontWeight: 500,
      letterSpacing: '0.1px',
      textTransform: 'none' as const, // M3ではテキスト変換しない
    },
    // Label Small
    caption: {
      fontSize: '0.75rem', // 12px
      lineHeight: 1.33,
      fontWeight: 400,
      letterSpacing: '0.4px',
    },
    // Label Small (overline)
    overline: {
      fontSize: '0.6875rem', // 11px
      lineHeight: 1.45,
      fontWeight: 500,
      letterSpacing: '0.5px',
    },
  },

  // --- シェイプ ---
  // M3 Shape Scale: None=0, Extra Small=4, Small=8, Medium=12, Large=16, Extra Large=28, Full
  shape: {
    borderRadius: 12, // Medium（デフォルトのborderRadius）
  },

  // --- コンポーネントオーバーライド ---
  components: {
    // CSSベースライン: ページ全体のスムーズスクロール
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          scrollBehavior: 'smooth',
        },
      },
    },

    // AppBar: M3 Top App Bar スタイル
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
        color: 'default',
      },
      styleOverrides: {
        root: {
          backgroundColor: m3Colors.surface,
          color: m3Colors.onSurface,
          borderBottom: `1px solid ${m3Colors.outlineVariant}`,
        },
      },
    },

    // Card: M3 Outlined Card をデフォルトに
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${m3Colors.outlineVariant}`,
          transition:
            'box-shadow 200ms cubic-bezier(0.2, 0, 0, 1), transform 200ms cubic-bezier(0.2, 0, 0, 1)',
          '&:hover': {
            boxShadow:
              '0px 1px 3px 1px rgba(0,0,0,0.15), 0px 1px 2px 0px rgba(0,0,0,0.3)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },

    // Button: M3 Button スタイル（角丸20dp = Full capsule shape）
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 20,
          textTransform: 'none',
          fontWeight: 500,
          padding: '10px 24px',
          letterSpacing: '0.1px',
        },
        contained: {
          '&:hover': {
            boxShadow:
              '0px 1px 3px 1px rgba(0,0,0,0.15), 0px 1px 2px 0px rgba(0,0,0,0.3)',
          },
        },
        outlined: {
          borderColor: m3Colors.outline,
        },
      },
    },

    // FAB: M3 Floating Action Button（角丸16dp）
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          textTransform: 'none',
          boxShadow:
            '0px 1px 3px 1px rgba(0,0,0,0.15), 0px 1px 2px 0px rgba(0,0,0,0.3)',
        },
      },
    },

    // Chip: M3 Chip スタイル（角丸8dp）
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          letterSpacing: '0.1px',
        },
      },
    },

    // Dialog: M3 Dialog スタイル（角丸28dp）
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 28,
          padding: '8px',
        },
      },
    },

    // TextField: M3 Outlined Text Field
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },

    // ListItemButton: hover/active の M3 state layer
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 28,
          '&.Mui-selected': {
            backgroundColor: m3Colors.secondaryContainer,
            color: m3Colors.onSecondaryContainer,
            '&:hover': {
              backgroundColor: m3Colors.secondaryContainer,
            },
          },
        },
      },
    },

    // Tab: M3 Tab indicator スタイル
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          letterSpacing: '0.1px',
        },
      },
    },

    // Tabs: M3 indicator スタイル
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },

    // Avatar: M3 形状
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: m3Colors.primaryContainer,
          color: m3Colors.onPrimaryContainer,
        },
      },
    },

    // Rating: カスタムカラー
    MuiRating: {
      styleOverrides: {
        iconFilled: {
          color: m3Colors.primary,
        },
      },
    },

    // Snackbar: M3角丸
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: m3Colors.inverseSurface,
          color: m3Colors.inverseOnSurface,
        },
      },
    },
  },
});

export default theme;

// M3カラートークンをエクスポート（他コンポーネントから参照可能に）
export { m3Colors, m3DarkColors };
