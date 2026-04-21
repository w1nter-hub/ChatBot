import * as React from "react";
import {
	Alert,
	AlertIcon,
	Box,
	Flex,
	Heading,
	SimpleGrid,
	Spinner,
	Text,
	VStack,
} from "@chakra-ui/react";

import { ChatBot } from "../../components/ChatBot/ChatBot";
import { useEffect } from "react";
import { DEMO_CHATBOTS_CONFIGURED, getDemoChatbotId } from "../../config";

/** Дереккөз: әр бот үшін тек бір бет (бір URL) оқытуға арналған мысалдар. */
function buildDemoChatBotsData() {
	return [
		{
			_id: getDemoChatbotId(0),
			name: "Bilimland",
			description: "https://bilimland.kz/kk/faq",
			customizationValues: {
				backgroundColor: "#5b47d8",
				heading: "Мен сіздің Bilimland көмекшіңізбін",
				description:
					'Мен <a style="text-decoration:underline; font-weight:bold" href="https://bilimland.kz/kk/faq" target="_blank" rel="noopener noreferrer">Bilimland</a> платформасының <strong>осы бір беті (FAQ)</strong> бойынша оқытылдым. Онлайн сабақтар мен материалдар туралы сұрақ қоя аласыз.',
				fontColor: "#FFF",
				borderRadius: "12px",
				placement: "right",
				welcomeMessage: "Сәлем! Сізге қалай көмектесе аламын?",
			},
		},
		{
			_id: getDemoChatbotId(1),
			name: "Gov.kz — Білім",
			description:
				"https://www.gov.kz/memleket/entities/edu/activities/population?lang=kk",
			customizationValues: {
				backgroundColor: "#00a884",
				heading: "Мен сіздің мемлекеттік білім көмекшіңізбін",
				description:
					'Мен <a style="text-decoration:underline; font-weight:bold" href="https://www.gov.kz/memleket/entities/edu/activities/population?lang=kk" target="_blank" rel="noopener noreferrer">ҚР Білім және ғылым министрлігі</a> ресми бетінің <strong>осы бір бөлімі</strong> бойынша оқытылдым. Мемлекеттік білім саясаты туралы сұраңыз.',
				fontColor: "#FFF",
				borderRadius: "12px",
				placement: "right",
				welcomeMessage: "Сәлем! Сізге қалай көмектесе аламын?",
			},
		},
		{
			_id: getDemoChatbotId(2),
			name: "nationalcatalog.kz",
			description: "https://nationalcatalog.kz/about",
			customizationValues: {
				backgroundColor: "#1e3a5f",
				heading: "Мен сіздің ұлттық каталог көмекшіңізбін",
				description:
					'Мен <a style="text-decoration:underline; font-weight:bold" href="https://nationalcatalog.kz/about" target="_blank" rel="noopener noreferrer">Nationalcatalog.kz</a> сайтының <strong>осы бір беті</strong> (About) бойынша оқытылдым. Біліктіліктер каталогы туралы сұрақ қоя аласыз.',
				fontColor: "#FFF",
				borderRadius: "12px",
				placement: "right",
				welcomeMessage: "Сәлем! Сізге қалай көмектесе аламын?",
			},
		},
	];
}

export const DemoChatbots = () => {
	const [chatBotList, setChatBot] = React.useState<any[]>();
	const [chatbotsLoaded, setChatbotsLoaded] = React.useState<boolean>(false);



	useEffect(() => {
		async function fetchData() {
			try {
				setChatbotsLoaded(true);
				setChatBot(buildDemoChatBotsData());
			} catch (error) {
				console.log("Unable to fetch chatbots", error);
			} finally {
			}
		}
		fetchData();
	}, []);

	const getNoDataIcon = React.useCallback(() => {
		return (
			<VStack
				spacing="9"
				alignItems="center"
				direction="column"
				justifyContent="center"
				w="100%"
				h="100%"
			>
				<Heading
					maxW="580px"
					mt={32}
					fontSize="2xl"
					fontWeight="semibold"
					as="h3"
					lineHeight="medium"
					textAlign="center"
				>
					Сайт деректерін қолданып, чат-ботты бірнеше минутта жасаңыз
				</Heading>
			</VStack>
		);
	}, []);
	

	const getChatBotLists = React.useCallback(() => {
		if (!chatbotsLoaded) {
			return (
				<Flex w="100%" minH="300px" justifyContent="center" alignItems="center">
					<Spinner
						thickness="2px"
						speed="0.65s"
						emptyColor="gray.200"
						color="gray.700"
						size="xl"
					/>
				</Flex>
			);
		}
		if (!chatBotList?.length) {
			return getNoDataIcon();
		}
		const chatbotListItems = chatBotList?.map((chatbot) => {
			return (
				<Flex key={chatbot._id}>
					<ChatBot
						height={"560px"}
						knowledgeBaseId={chatbot._id}
						showCloseButton={false}
						showLauncher={false}
						customStyle={chatbot.customizationValues}
					/>
				</Flex>
			);
		});
		return (
			<SimpleGrid columns={[1, 1, 1, 3]} spacing="6">
				{chatbotListItems}
			</SimpleGrid>
		);
	}, [chatBotList, chatbotsLoaded, getNoDataIcon]);


	return (
		<Box
			w="100%"
			maxW="1200px"
			p="6"
			shadow="sm"
			h="100%"
			position="relative"
			overflow="auto"
		>
			<VStack w="100%" spacing="10">
				<Flex shrink={0} w="100%" justifyContent="space-between">
					<Heading fontSize="30">Демо чат-боттар</Heading>
				</Flex>
				{!DEMO_CHATBOTS_CONFIGURED && (
					<Alert status="info" borderRadius="md" fontSize="sm">
						<AlertIcon />
						<Box>
							<Text fontWeight="600" mb={1}>
								Өз серверіңізде демо дұрыс жауап беруі үшін
							</Text>
							<Text>
								Жобаларда үш жеке чат-бот жасап, әрқайсысына Bilimland, Gov.kz білім беті
								және nationalcatalog сияқты сайттың <strong>бір ғана бетін</strong> оқытыңыз.
								Sодан кейін frontend <code>.env</code> ішінде{" "}
								<code>REACT_APP_DEMO_CHATBOT_IDS</code> орнатыңыз да, қайта құрастырыңыз.
							</Text>
						</Box>
					</Alert>
				)}
				<Box zIndex="1" width="100%">
					{getChatBotLists()}
				</Box>
			</VStack>
		</Box>
	);
};
