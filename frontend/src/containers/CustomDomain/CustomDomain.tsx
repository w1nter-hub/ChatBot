import * as React from "react";
import {
	Box,
	Flex,
	Text,
	HStack,
	ListItem,
	useToast,
	Button,
	FormControl,
	FormErrorMessage,
	FormHelperText,
	FormLabel,
	Input,
	InputGroup,
	InputRightElement,
	OrderedList,
} from "@chakra-ui/react";

import { Formik, Form, Field } from "formik";
import { createChatBotSession, sendOfflineMessage, setCustomDomain } from "../../services/knowledgebaseService";

function validateWebsite(value: string) {
	let error;
	const domainRegex = /^(?:[\w-]+\.)?\w+\.[a-z]{2,}(?:\.[a-z]{2,})?$/i;
	if (value &&
		!domainRegex.test(
			value
		)
	) {
		error = "Домен атауы жарамсыз";
	}
	return error;
}

interface CustomDomainProps {
	chatBotId: string;
	defaultCustomDomain: string;
}


export const CustomDomain = ({
	chatBotId,
	defaultCustomDomain,
}: CustomDomainProps) => {
	const toast = useToast();
	const handleCustomDomainSave = React.useCallback(async (values) => {
		setCustomDomain(chatBotId, values.customDomain);
	}, [chatBotId]);
	const [isNameCopied, setIsNameCopied] = React.useState<boolean>(false);
	const [isValueCopied, setIsValueCopied] = React.useState<boolean>(false);

	const [recordName, setRecordName] = React.useState<string>(defaultCustomDomain ? defaultCustomDomain.split('.')[0] : '');

	const [domainName, setDomainName] = React.useState<string>(defaultCustomDomain);

	React.useEffect(() => {
		setRecordName(domainName ? domainName.split('.')[0] : '');
	}, [domainName]);

	const handleRecordNotifier = React.useCallback(async () => {
		toast({
			title: `Рақмет, ${recordName} домені үшін SSL сертификатын жақын арада шығарып, email арқылы хабарлаймыз.`,
			status: "info",
			isClosable: true,
		});
		const res = await createChatBotSession('6432611b6655e0d245e760ed');
		sendOfflineMessage({
			"knowledgebaseId": "6432611b6655e0d245e760ed",
			"sessionId": res.data,
			"name": "Custom Domain",
			"email": "admin@qoldauai.ai",
			"message": domainName + '---'+ chatBotId,
		})
	}, [chatBotId, domainName, recordName, toast]);
	const handleNameCopy = React.useCallback(() => {
		navigator.clipboard.writeText(
			recordName || ''
		);
		toast({
			title: `Буферге көшірілді`,
			status: "info",
			isClosable: true,
		});
		setIsNameCopied(true);
		setTimeout(() => {
			setIsNameCopied(false);
		}, 1000)
	}, [recordName, toast]);
	const handleValueCopy = React.useCallback(() => {
		navigator.clipboard.writeText(
			'widget.qoldauai.ai.'
		);
		toast({
			title: `Буферге көшірілді`,
			status: "info",
			isClosable: true,
		});
		setIsValueCopied(true);
		setTimeout(() => {
			setIsValueCopied(false);
		}, 1000)
	}, [toast]);
	return (
		<Box maxW="620px">
			<Flex direction="column" alignItems="start">
				<Formik
					initialValues={{
						customDomain: defaultCustomDomain || '',
					}}
					onSubmit={async () => { }}
				>
					{({ values, isValid, dirty }) => (
						<>
							<Form style={{ width: '100%' }}>
								<Field
									type="text"
									name="customDomain"
									validate={validateWebsite}
								>
									{({ field, form }: any) => (
										<FormControl
											// isRequired
											mb="8"
										>
											<FormLabel
												fontWeight={400}
												color="gray.700"
												fontSize="sm"
												htmlFor="customDomain"
											>
												Жеке домен
											</FormLabel>
											<Input
												color="gray.700"
												{...field}
												id="customDomain"
												onChange={(e) => {
													setDomainName(e.target.value);
													field.onChange(e);
												}}
												// required
												placeholder="chat.timemaster.ai"
											/>
											<FormHelperText fontSize="smaller" color="gray.400">
												Тек домен атауын енгізіңіз. Қосымша жол немесе протокол қоспаңыз.
											</FormHelperText>
											{form.touched.customDomain &&
												form.errors.customDomain && (
													<FormHelperText color="red">
														{form.errors.customDomain}
													</FormHelperText>
												)}
											<FormErrorMessage>
												{form.errors.customDomain}
											</FormErrorMessage>
										</FormControl>
									)}
								</Field>
								<Button disabled={!isValid} colorScheme='blue' onClick={() => {
									handleCustomDomainSave(values);
								}}>
									Сақтау
								</Button>
							</Form>
						</>
					)}
				</Formik>
			</Flex>
			<Text fontSize="md" mt="10" mb="4" pb="2" fontWeight="500" borderBottom={"1px solid"} borderBottomColor="gray.200">Доменіңіз үшін CNAME жазбасын жасаңыз</Text>
			<HStack>
				<FormControl
				>
					<FormLabel fontSize="sm" htmlFor="collectEmailText" color="gray.700" fontWeight="400" >
						Атауы
					</FormLabel>
					<InputGroup size='md'>
						<Input
							readOnly
							value={recordName}
						/>
						<InputRightElement width='4.5rem'>
							<Button disabled={!recordName} h='1.75rem' size='sm' onClick={handleNameCopy}>
								{isNameCopied ? 'Көшірілді' : 'Көшіру'}
							</Button>
						</InputRightElement>
					</InputGroup>
				</FormControl>
				<FormControl

				>
					<FormLabel fontSize="sm" htmlFor="collectEmailText" color="gray.700" fontWeight="400" >
						Мәні
					</FormLabel>
					<InputGroup size='md'>
						<Input
							readOnly value={'widget.qoldauai.ai.'}
						/>
						<InputRightElement width='4.5rem'>
							<Button h='1.75rem' size='sm' onClick={handleValueCopy}>
								{isValueCopied ? 'Көшірілді' : 'Көшіру'}
							</Button>
						</InputRightElement>
					</InputGroup>
				</FormControl>
			</HStack>
			<Box>
				<OrderedList fontSize="sm" mt="4" pl="1" mb="2">
					<ListItem>DNS хостинг қызметіңіздің басқару панеліне өтіңіз.</ListItem>
					<ListItem>'Name' немесе 'Host' өрісіне таңдаған субдоменіңізді енгізіңіз. Жоғарыдағы 'Атауы' өрісінен көшіріңіз.</ListItem>
					<ListItem>'Value' немесе 'Target' өрісіне widget.qoldauai.ai енгізіңіз. Дұрыс жазылғанын тексеріңіз.</ListItem>
					<ListItem>Жазбаны қосқаннан кейін төмендегі батырманы басыңыз. Содан кейін доменіңізге SSL сертификатын шығарамыз.</ListItem>
				</OrderedList>
				<Button colorScheme='blue' disabled={!recordName} onClick={() => {
					handleRecordNotifier();
				}}>
					Жазбаны қостым
				</Button>
			</Box>
		</Box>

	);
};
