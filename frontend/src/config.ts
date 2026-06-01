export const GOOGLE_AUTH_ID = process.env.REACT_APP_GOOGLE_AUTH_ID;
export const baseURL = process.env.REACT_APP_BASE_URL;
export const SELF_HOST = process.env.REACT_APP_SELF_HOST;

const demoIdsRaw = process.env.REACT_APP_DEMO_CHATBOT_IDS || '';
export const DEMO_CHATBOT_IDS: string[] = demoIdsRaw
	.split(',')
	.map((s) => s.trim())
	.filter((s) => /^[a-f0-9]{24}$/i.test(s));

export const DEMO_CHATBOTS_CONFIGURED = DEMO_CHATBOT_IDS.length === 3;

const FALLBACK_DEMO_CHATBOT_IDS = [
	'69dbafa3ca0f93f354d2750b',
	'69dbafefca0f93f354d2750c',
	'69dbb009ca0f93f354d2750d',
];

export function getDemoChatbotId(index: number): string {
	return DEMO_CHATBOT_IDS[index] || FALLBACK_DEMO_CHATBOT_IDS[index] || FALLBACK_DEMO_CHATBOT_IDS[0];
}

export const QOLDAUAI_WIDGET_URL =
	process.env.REACT_APP_QOLDAUAI_WIDGET_URL ||
	'http://localhost:3031';
