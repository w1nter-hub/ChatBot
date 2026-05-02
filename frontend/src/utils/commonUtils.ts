import { LauncherIconsSVGs } from "./LauncherIconSVGs";

export function getDomainFromUrl(url: string) {
    if (!url) return '';
    const matches = url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
    const domain = matches && matches[1]; // domain will be null if no match is found
    return (domain || '').replace('www.', '');
}

export const uuidv4 = ()=> {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

export function getBrowserName(userAgent: string) {

  if(!userAgent) return 'Other';

  // Detect ARC Welder
  if (userAgent.indexOf('ARC') > -1) {
    return 'ARC Welder';
  }

  // Detect Chrome
  if (userAgent.indexOf("Chrome") > -1 && userAgent.indexOf("Edg") === -1 && userAgent.indexOf("OPR") === -1) {
    return "Google Chrome";
  }

  // Detect Firefox
  if (userAgent.indexOf("Firefox") > -1) {
    return "Mozilla Firefox";
  }

  // Detect Safari
  if (userAgent.indexOf("Safari") > -1 && userAgent.indexOf("Chrome") === -1) {
    return "Safari";
  }

  // Detect Internet Explorer or Legacy Edge
  if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) {
    return "Microsoft Internet Explorer";
  }

  // Detect Edge (Chromium)
  if (userAgent.indexOf("Edg") > -1) {
    return "Microsoft Edge";
  }

  // Detect Opera
  if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) {
    return "Opera";
  }

  // Other
  return 'Other';
}

export function getLlmModelUsed(modelName?: string) {
  switch (modelName) {
    case 'gpt-4-0613':
      return 'GPT-4';
    case 'gpt-4-turbo-preview':
      return 'GPT-4 Turbo';
    case 'gpt-4o':
      return 'GPT-4o';
    case 'gpt-3.5-turbo':
    default:
      return 'GPT-3.5 Turbo';
  }
}

export const chatWidgetDefaultValues = {
	backgroundColor: "#000",
	heading: 'Мен сіздің AI көмекшіңізбін',
	description: `Кез келген сұрақ қойыңыз. Мен осы сайттың деректеріне сүйеніп жауап беруге тырысамын.`,
  chatInputPlaceholderText: 'Хабарламаңызды енгізіңіз',
  assistantTabHeader: 'AI көмекші',
  offlineMsgTabHeader: 'Офлайн хабарлама',
  readMoreText: 'Толығырақ:',
	fontColor: "#FFF",
	borderRadius: "12px",
	placement: "right",
	offlineMessage: true,
	showReadMore: true,
  showAsPopup: false,
  popupDelay: 3000,
  collectEmail: false,
  enableHumanChat: false,
  adminEmail: '',
  collectEmailText: 'Email мекенжайыңыз қандай?',
  questionExamples: [
    { question: 'Сізбен қалай байланыса аламын?', label: 'Байланыс', openOffline: true },
  ],
  welcomeMessages: [
    'Сәлем! Сізге қалай көмектесе аламын?'
  ],
  welcomeMessage: 'Сәлем! Сізге қалай көмектесе аламын?',
  customCSS: '',
  prompt: 'Сіз көмектесуге дайын өте сыпайы чат-ботсыз. Сіздің атыңыз {{chatbotName}}. Тек берілген контекст пен алдыңғы хабарламаларға сүйеніп жауап беріңіз. Жауаптарды Markdown форматында шығарыңыз. Егер контексте жауап болмаса, "{{defaultAnswer}}" мәтінін қайтарыңыз.',
  defaultAnswer: "Кешіріңіз, бұл сұраққа дәл қазір жауап бере алмаймын.",
  launcherIcon: { 
    id: 'icon1', 
    svgElement: LauncherIconsSVGs.get('icon1') 
  },
  offlineMsgHeading: "Офлайн хабарлама",
  offlineMsgDescription: "Төмендегі форманы толтырыңыз, біз сізге мүмкіндігінше тез жауап береміз.",
  nameFieldLabel: "Аты-жөні",
  nameFieldPlaceholder: "Аты-жөніңізді енгізіңіз",
  emailFieldLabel: "Email",
  emailFieldPlaceholder: "Enter your email",
  msgFieldLabel: "Message",
  msgFieldPlaceholder: "Enter your message",
  requiredFieldMsg: "This field is required",
  invalidEmailMsg: "Please enter a valid email",
  formSubmitBtnLabel: "Submit",
  formSubmitBtnSubmittingText: "Submitting...",
  formSubmitSuccessMsg: "Your message sent successfully!",
  formSubmitErrorMsg: "Oops! Something went wrong",
  formSendAgainBtnLabel: "Send again",
  formTryAgainBtnLabel: "Try again",
  model: 'gpt-3.5-turbo'
};


export function formatNumber(num:number, precision = 0) {
  const map = [
    { suffix: 'T', threshold: 1e12 },
    { suffix: 'B', threshold: 1e9 },
    { suffix: 'M', threshold: 1e6 },
    { suffix: 'K', threshold: 1e3 },
    { suffix: '', threshold: 1 },
  ];

  const found = map.find((x) => Math.abs(num) >= x.threshold);
  if (found) {
    const formatted = (num / found.threshold).toFixed(precision) + found.suffix;
    return formatted;
  }

  return num;
}
