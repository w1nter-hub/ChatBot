// theme.ts

// 1. import `extendTheme` function
import { extendTheme, ThemeConfig } from '@chakra-ui/react';
import { mode } from '@chakra-ui/theme-tools';

// 2. Add your color mode config
const config: ThemeConfig = {
	initialColorMode: 'light',
	useSystemColorMode: false,
};

const theme = extendTheme({
	config,
	fonts: {
		heading: `'Inter', sans-serif`,
		body: `'Inter', sans-serif`,
	},
	colors: {
		black: '#000',
		white: '#fff',
		brand: {
			50: '#f5f2ff',
			100: '#ebe6ff',
			200: '#d4c9ff',
			500: '#7f58ff',
			600: '#6b47e8',
			700: '#5a3ac7',
		},
		accent: {
			400: '#35c2a1',
			500: '#2da889',
		},
		blue: {
			50: 'rgba(127, 88, 255, 0.12)',
			100: 'rgba(127, 88, 255, 0.18)',
			500: '#7f58ff',
			600: '#6b47e8',
			700: '#5a3ac7',
		},
	},
	fontSizes: {
		xs: "0.75rem",
		sm: "0.875rem",
		md: "1rem",
		lg: "1.125rem",
		xl: "1.25rem",
		"2xl": "1.5rem",
		"3xl": "1.875rem",
		"4xl": "2.25rem",
		"5xl": "3.25rem",
		"6xl": "3.75rem",
		"7xl": "4.5rem",
		"8xl": "6rem",
		"9xl": "8rem",
	},
	styles: {
		global: (props) => ({
			body: {
				color: mode('gray.800', 'gray.100')(props),
				background: mode(
					'linear-gradient(145deg, #f3f0ff 0%, #eef6f4 28%, #f5f3ff 55%, #eaf8f4 100%)',
					'linear-gradient(145deg, #1a1625 0%, #15222a 40%, #1c1830 100%)'
				)(props),
				backgroundAttachment: 'fixed',
				minHeight: '100vh',
			},
			'#root': {
				minHeight: '100vh',
			},
		}),
	},
	components: {
		Button: {
			baseStyle: {
				fontWeight: '600',
				borderRadius: 'lg',
			},
			defaultProps: {
				colorScheme: 'blue',
			},
		},
	},
});

export default theme;
