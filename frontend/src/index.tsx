import { ColorModeScript } from '@chakra-ui/react';
import * as React from 'react';
import ReactDOM from 'react-dom';
import { Base } from './Base';
import reportWebVitals from './reportWebVitals';
import theme from './theme/theme';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(
	<React.StrictMode>
		<ColorModeScript initialColorMode={theme.config.initialColorMode} />
		<Base />
	</React.StrictMode>,
	document.getElementById('root')
);

serviceWorker.unregister();

reportWebVitals();
