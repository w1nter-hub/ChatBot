import * as React from "react";
import {
	Box,
	Flex,
	HStack,
	Button,
	VStack,
	Text,
	Switch,
	Tabs, TabList, TabPanels, Tab, TabPanel,
	Textarea,
	FormControl,
	FormErrorMessage,
	FormHelperText,
	FormLabel,
	Input,
	IconButton,
	Radio,
	RadioGroup,
	Select,
} from "@chakra-ui/react";

import { Field, FieldArray, Form, Formik } from "formik";

import { RiDeleteBin5Line } from "react-icons/ri"

import styles from "./ChatBotsCustomize.module.scss";

import { chatWidgetDefaultValues } from "../../utils/commonUtils";
import { SectionTitle } from "../../components/SectionTitle/SectionTitle";
import { ChatBotCustomizeData } from "../../types/knowledgebase.type";
import ChatBotLauncher from "../ChatBotLauncher/ChatBotLauncher";
export function validateEmailAddress(email: string) {
	return email && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);
}


interface ChatBotsCustomizeProps {
	onNextClick: (formValues: ChatBotCustomizeData) => void;
	onBackClick: () => void;
	defaultCustomizationValues?: ChatBotCustomizeData;
	primaryButtonLabel?: string;
	isSubmitting?: boolean;
	showheader?: boolean;
	showTimeMessage?: boolean;
	/** Қолданылмайды — API үйлесімділігі үшін сақталған */
	subscriptionName?: string;
}

export const ChatBotsCustomize = ({
	onNextClick,
	onBackClick,
	defaultCustomizationValues,
	primaryButtonLabel = "Виджет стилін жаңарту",
	isSubmitting = false,
}: ChatBotsCustomizeProps) => {

	const [message, setMessage] = React.useState("");
	const [selectedTab, setSelectedTab] = React.useState<number>(0);

	const handleTextAreaChange = React.useCallback((e: any) => {
		const { value } = e.target;
		setMessage(value);
	}, []);

	const handleSwitchChange = React.useCallback((e: any, form) => {
		const { checked, name } = e.target;
		form.setFieldValue(name, checked);
		if(name === 'offlineMessage' && !checked){
			setSelectedTab(0);
		}
	}, []);

	return (
		<Flex h="100%" direction="column">
			<VStack alignItems="start" w="100%">
				<SectionTitle title="Баптау" description="Чаттың мәтінін, түстерін және байланыс формасын қарапайым түрде өзгертіңіз. Оң жақта алдын ала көрініс бар." />
			</VStack>
			<Formik
				initialValues={defaultCustomizationValues || chatWidgetDefaultValues}
				onSubmit={async () => { }}
			>
				{({
					values,
				}) => (
					<>
						<VStack
							alignItems="start"
							overflowY="auto"
							spacing="8"
							mb="41px"
							position="relative"
							height="calc(100vh - 250px)"
						>
							<HStack w="100%" alignItems="start" overflow="hidden">
								<Box w="50%" h="100%" overflow="auto">
									<Form style={{ width: '100%' }}>
										<Box maxW="620px">
											<Tabs variant='soft-rounded' colorScheme='gray' mt="1" size="sm" p={1}>
												<TabList flexWrap="wrap" gap={1}>
													<Tab>Мәтін</Tab>
													<Tab>Түс пен орналасу</Tab>
													<Tab>Хабар қалдыру</Tab>
												</TabList>
												<TabPanels>
													<TabPanel pt="8">
														<Field type="text" name="heading">
															{({ field, form }: any) => (
																<FormControl
																	mb="6"
																	isInvalid={
																		form.errors.heading && form.touched.heading
																	}
																>
																	<FormLabel fontSize="sm" htmlFor="heading" color="gray.700" fontWeight="400" >
																		Тақырып
																	</FormLabel>
																	<Input
																		{...field}
																		placeholder={(defaultCustomizationValues || chatWidgetDefaultValues).heading}
																	/>
																	<FormErrorMessage>
																		{form.errors.heading}
																	</FormErrorMessage>
																</FormControl>
															)}
														</Field>
														<Field type="text" name="description">
															{({ field, form }: any) => (
																<FormControl
																	mb="6"
																	isInvalid={
																		form.errors.description && form.touched.description
																	}
																>
																	<FormLabel fontSize="sm" htmlFor="description" color="gray.700" fontWeight="400" >
																		Сипаттама
																	</FormLabel>
																	<Textarea
																		{...field}
																		rows={2}
																		placeholder={(defaultCustomizationValues || chatWidgetDefaultValues).description}
																	/>
																	<FormErrorMessage>
																		{form.errors.description}
																	</FormErrorMessage>
																</FormControl>
															)}
														</Field>
														<Field type="text" name="chatInputPlaceholderText">
															{({ field, form }: any) => (
																<FormControl
																	mb="6"
																	isInvalid={
																		form.errors.chatInputPlaceholderText && form.touched.chatInputPlaceholderText
																	}
																>
																	<FormLabel fontSize="sm" htmlFor="chatInputPlaceholderText" color="gray.700" fontWeight="400" >
																		Чат енгізу өрісінің мәтіні
																	</FormLabel>
																	<Input
																		{...field}
																		placeholder={(defaultCustomizationValues || chatWidgetDefaultValues).chatInputPlaceholderText}
																	/>
																	<FormErrorMessage>
																		{form.errors.chatInputPlaceholderText}
																	</FormErrorMessage>
																</FormControl>
															)}
														</Field>
														<Box className={styles.nestedFormCont} mt="8">
															<Text className={styles.nestedFormHeading} fontSize="md" mb="4" pb="2" fontWeight="500" borderBottom={"1px solid"} borderBottomColor="gray.200">Сәлемдесу хабарламалары</Text>

															<FieldArray name="welcomeMessages">
																{({ insert, remove, push }) => (
																	<Box className={styles.nestedForm}>
																		{values.welcomeMessages.length > 0 &&
																			values.welcomeMessages.map((friend, index) => (
																				<Box key={index} mb="4" pos="relative">
																					<IconButton
																						className={styles.questionDeleteBtn}
																						variant='outline'
																						colorScheme='gray'
																						aria-label='Delete Question'
																						fontSize='14px'
																						size="xs"
																						onClick={() => remove(index)}
																						icon={<RiDeleteBin5Line />}
																					/>
																					<Field type="text" name={`welcomeMessages.${index}`}>
																						{({ field, form }: any) => (
																							<FormControl
																								mb="2"
																							>
																								<FormLabel fontWeight="400" color="gray.700" fontSize="sm" htmlFor={`welcomeMessages.${index}`}>
																									Хабарлама
																								</FormLabel>
																								<Input
																									{...field}
																								/>
																							</FormControl>
																						)}
																					</Field>
																				</Box>
																			))}
																		<Button
																			colorScheme="teal"
																			variant="solid"
																			size="xs"
																			mb="8"
																			onClick={() => push('')}
																		>
																			Сәлемдесу хабарын қосу
																		</Button>
																	</Box>
																)}
															</FieldArray>
														</Box>
														<Box className={styles.nestedFormCont} mt="8">
															<Text className={styles.nestedFormHeading} fontSize="md" mb="2" pb="2" fontWeight="500" borderBottom={"1px solid"} borderBottomColor="gray.200">Жылдам сұрақ батырмалары</Text>
															<Text fontSize="sm" color="gray.600" mb="4">Пайдаланушылар бір басумен жібере алатын дайын сұрақтар. «Белгі» — батырмада көрінетін қысқа атау.</Text>

															<FieldArray name="questionExamples">
																{({ insert, remove, push }) => (
																	<Box className={styles.nestedForm}>
																		{values.questionExamples.length > 0 &&
																			values.questionExamples.map((friend, index) => (
																				<Box key={index} mb="4" pos="relative">
																					<IconButton
																						className={styles.questionDeleteBtn}
																						variant='outline'
																						colorScheme='gray'
																						aria-label='Delete Question'
																						fontSize='14px'
																						size="xs"
																						onClick={() => remove(index)}
																						icon={<RiDeleteBin5Line />}
																					/>
																					<Field type="text" name={`questionExamples.${index}.question`}>
																						{({ field, form }: any) => (
																							<FormControl
																								mb="2"
																							>
																								<FormLabel fontWeight="400" color="gray.700" fontSize="sm" htmlFor={`questionExamples.${index}.question`}>
																									Сұрақ
																								</FormLabel>
																								<Input
																									{...field}
																								/>
																							</FormControl>
																						)}
																					</Field>
																					<Field type="text" name={`questionExamples.${index}.label`}>
																						{({ field, form }: any) => (
																							<FormControl
																								mb="2"
																							>
																								<FormLabel fontWeight="400" color="gray.700" fontSize="sm" htmlFor={`questionExamples.${index}.label`}>
																									Белгі
																								</FormLabel>
																								<Input
																									{...field}
																								/>
																							</FormControl>
																						)}
																					</Field>
																				</Box>
																			))}
																		<Button
																			colorScheme="teal"
																			variant="solid"
																			size="xs"
																			mb="8"
																			onClick={() => push({ question: '', label: '' })}
																		>
																			Сұрақ қосу
																		</Button>
																	</Box>
																)}
															</FieldArray>
														</Box>
														<Field type="text" name="defaultAnswer">
															{({ field, form }: any) => (
																<FormControl
																	mb="6"
																	mt="8"
																	isInvalid={
																		form.errors.defaultAnswer && form.touched.defaultAnswer
																	}
																>
																	<FormLabel fontSize="sm" htmlFor="defaultAnswer" color="gray.700" fontWeight="400" >
																		Жауап табылмағанда не жазу керек
																	</FormLabel>
																	<Textarea
																		{...field}
																		rows={3}
																		placeholder={(defaultCustomizationValues || chatWidgetDefaultValues).defaultAnswer}
																	/>
																	<FormHelperText fontSize="sm">Бот дерекқорда жауап таппаса, осы мәтін көрсетіледі.</FormHelperText>
																	<FormErrorMessage>
																		{form.errors.defaultAnswer}
																	</FormErrorMessage>
																</FormControl>
															)}
														</Field>
													</TabPanel>
													<TabPanel pt="8">
														<Field type="text" name="backgroundColor">
															{({ field, form }: any) => (
																<FormControl
																	mb="6"
																	isInvalid={
																		form.errors.backgroundColor &&
																		form.touched.backgroundColor
																	}
																>
																	<FormLabel fontWeight="400" fontSize="sm" color="gray.700" htmlFor="backgroundColor">
																		Фон түсі
																	</FormLabel>
																	<HStack spacing={3} align="flex-start" maxW="100%">
																		<Input
																			type="color"
																			w="44px"
																			h="32px"
																			p={1}
																			borderRadius="md"
																			value={/^#[0-9A-Fa-f]{6}$/.test(field.value) ? field.value : '#11141c'}
																			onChange={(e) => form.setFieldValue('backgroundColor', e.target.value)}
																			flexShrink={0}
																		/>
																		<Input
																			{...field}
																			size="sm"
																			id="backgroundColor"
																			placeholder="#11141C"
																			flex={1}
																			minW={0}
																		/>
																	</HStack>
																	<FormHelperText fontSize="sm">Түс таңдағышы немесе #RRGGBB пішімінде код.</FormHelperText>
																	<FormErrorMessage>
																		{form.errors.backgroundColor}
																	</FormErrorMessage>
																</FormControl>
															)}
														</Field>
														<Field type="text" name="fontColor">
															{({ field, form }: any) => (
																<FormControl
																	mb="6"
																	isInvalid={
																		form.errors.fontColor &&
																		form.touched.fontColor
																	}
																>
																	<FormLabel fontWeight="400" fontSize="sm" color="gray.700" htmlFor="fontColor">
																		Мәтін түсі
																	</FormLabel>
																	<HStack spacing={3} align="flex-start" maxW="100%">
																		<Input
																			type="color"
																			w="44px"
																			h="32px"
																			p={1}
																			borderRadius="md"
																			value={/^#[0-9A-Fa-f]{6}$/.test(field.value) ? field.value : '#ffffff'}
																			onChange={(e) => form.setFieldValue('fontColor', e.target.value)}
																			flexShrink={0}
																		/>
																		<Input
																			{...field}
																			size="sm"
																			id="fontColor"
																			placeholder="#FFFFFF"
																			flex={1}
																			minW={0}
																		/>
																	</HStack>
																	<FormHelperText fontSize="sm">Чаттағы мәтін мен батырмалардың түсі.</FormHelperText>
																	<FormErrorMessage>
																		{form.errors.fontColor}
																	</FormErrorMessage>
																</FormControl>
															)}
														</Field>
														<Field name="borderRadius">
															{({ field, form }: any) => {
																const presets = ['0px', '8px', '16px', '24px'];
																const v = field.value || '0px';
																const hasCustom = !presets.includes(v);
																return (
																	<FormControl
																		mb="6"
																		isInvalid={
																			form.errors.borderRadius && form.touched.borderRadius
																		}
																	>
																		<FormLabel fontWeight="400" fontSize="sm" color="gray.700" htmlFor="borderRadius">
																			Бұрыштардың дөңгелектігі
																		</FormLabel>
																		<Select {...field} id="borderRadius" size="sm">
																			{hasCustom && (
																				<option value={v}>{v} (ағымдағы)</option>
																			)}
																			<option value="0px">Тікті</option>
																			<option value="8px">Сәл дөңгелек</option>
																			<option value="16px">Дөңгелек</option>
																			<option value="24px">Өте дөңгелек</option>
																		</Select>
																		<FormHelperText fontSize="sm">Виджеттің бұрыштары қаншалықты дөңгелек екенін таңдаңыз.</FormHelperText>
																		<FormErrorMessage>
																			{form.errors.borderRadius}
																		</FormErrorMessage>
																	</FormControl>
																);
															}}
														</Field>
														<Field type="text" name="placement">
															{({ field, form }: any) => (
																<FormControl mb="6">
																	<FormLabel fontWeight="400" fontSize="sm" color="gray.700" htmlFor="placement">
																		Виджет орны
																	</FormLabel>
																	<RadioGroup
																		{...field}
																		size="sm"
																		defaultValue="right"
																	>
																		<HStack height="38px" spacing="24px">
																			<Radio {...field}
																				size="md" value="left">
																				<Text fontSize="sm">

																					Сол жақ
																				</Text>
																			</Radio>
																			<Radio {...field}
																				size="md" value="right">
																				<Text fontSize="sm">

																					Оң жақ
																				</Text>
																			</Radio>
																		</HStack>
																	</RadioGroup>
																</FormControl>
															)}
														</Field>
													</TabPanel>
													<TabPanel pt="8">
														<Field type="text" name="offlineMessage">
															{({ field, form }: any) => (
																<FormControl mb="6">
																	<Flex justifyContent="space-between" w="100%" alignItems="center">

																		<FormLabel fontWeight="400" fontSize="sm" color="gray.700" htmlFor="offlineMessage">
																			Хабар қалдыру формасын көрсету
																		</FormLabel>
																			<Switch
																				{...field}
																				defaultChecked={(defaultCustomizationValues || chatWidgetDefaultValues).offlineMessage}
																				onChange={(event) => { handleSwitchChange(event, form) }}
																				colorScheme="teal"
																				size="md"
																				mr="2"
																			/>
																	</Flex>
																</FormControl>
															)}
														</Field>
														<Text fontSize="sm" color="gray.600" mb="5" maxW="md">
															Қосқанда виджетте екі бөлім болады: AI чат және келуші сізге хабар қалдыратын қарапайым форма. Төменде тек негізгі мәтіндерді өзгертіңіз.
														</Text>

														<Field type="text" name="adminEmail">
															{({ field, form }: any) => (
																<FormControl
																	mb="6"
																	isInvalid={
																		form.errors.adminEmail && form.touched.adminEmail
																	}
																>
																	<FormLabel fontSize="sm" htmlFor="adminEmail" color="gray.700" fontWeight="400" >
																		Email жіберу мекенжайы
																		</FormLabel>
																	<Input
																		{...field}
																		placeholder={(defaultCustomizationValues || chatWidgetDefaultValues).adminEmail}
																		isDisabled={!values.offlineMessage}
																	/>
																	<FormHelperText fontSize="sm">Әдепкі бойынша офлайн хабарламалар аккаунт иесінің email мекенжайына жіберіледі.</FormHelperText>
																	<FormErrorMessage>
																		{form.errors.adminEmail}
																	</FormErrorMessage>
																</FormControl>
															)}
														</Field>
														<Field type="text" name="assistantTabHeader">
															{({ field, form }: any) => (
																<FormControl
																	mb="6"
																	isInvalid={
																		form.errors.assistantTabHeader && form.touched.assistantTabHeader
																	}
																>
																	<FormLabel fontSize="sm" htmlFor="assistantTabHeader" color="gray.700" fontWeight="400" >
																		Чат қойындысының атауы
																		</FormLabel>
																	<Input
																		{...field}
																		placeholder={(defaultCustomizationValues || chatWidgetDefaultValues).assistantTabHeader}
																		isDisabled={!values.offlineMessage}
																	/>
																	<FormErrorMessage>
																		{form.errors.assistantTabHeader}
																	</FormErrorMessage>
																</FormControl>
															)}
														</Field>
														<Field type="text" name="offlineMsgTabHeader">
															{({ field, form }: any) => (
																<FormControl
																	mb="6"
																	isInvalid={
																		form.errors.offlineMsgTabHeader && form.touched.offlineMsgTabHeader
																	}
																>
																	<FormLabel fontSize="sm" htmlFor="offlineMsgTabHeader" color="gray.700" fontWeight="400" >
																		Хабар қалдыру қойындысының атауы
																		</FormLabel>
																	<Input
																		{...field}
																		placeholder={(defaultCustomizationValues || chatWidgetDefaultValues).offlineMsgTabHeader}
																		isDisabled={!values.offlineMessage}
																	/>
																	<FormErrorMessage>
																		{form.errors.offlineMsgTabHeader}
																	</FormErrorMessage>
																</FormControl>
															)}
														</Field>

														<Field type="text" name="offlineMsgHeading">
															{({ field, form }: any) => (
																<FormControl
																	mb="6"
																	isInvalid={
																		form.errors.offlineMsgHeading && form.touched.offlineMsgHeading
																	}
																>
																	<FormLabel fontSize="sm" htmlFor="offlineMsgHeading" color="gray.700" fontWeight="400" >
																		Тақырып
																	</FormLabel>
																	<Input
																		{...field}
																		placeholder={(defaultCustomizationValues || chatWidgetDefaultValues).offlineMsgHeading}
																		isDisabled={!values.offlineMessage}
																	/>
																	<FormErrorMessage>
																		{form.errors.offlineMsgHeading}
																	</FormErrorMessage>
																</FormControl>
															)}
														</Field>

														<Field type="text" name="offlineMsgDescription">
															{({ field, form }: any) => (
																<FormControl
																	mb="6"
																	isInvalid={
																		form.errors.offlineMsgDescription && form.touched.offlineMsgDescription
																	}
																>
																	<FormLabel fontSize="sm" htmlFor="offlineMsgDescription" color="gray.700" fontWeight="400" >
																		Сипаттама
																	</FormLabel>
																	<Textarea
																		{...field}
																		rows={2}
																		placeholder={(defaultCustomizationValues || chatWidgetDefaultValues).offlineMsgDescription}
																		isDisabled={!values.offlineMessage}
																	/>
																	<FormErrorMessage>
																		{form.errors.offlineMsgDescription}
																	</FormErrorMessage>
																</FormControl>
															)}
														</Field>
													</TabPanel>
												</TabPanels>
											</Tabs>

										</Box>

									</Form>
								</Box>
								<Flex w="50%" height="100%" pos="absolute" right="0" top="0" bottom="74px" justifyContent="center" overflow="auto">
									<div className="chat-wrap widget-open" id="chat-wrap" style={{ marginTop: '0', minHeight: "600px" }}>


										<div className="chat-widget" style={{ borderRadius: values.borderRadius, width: "400px", height: "570px" }}>
											<div className="chat-header" style={{ backgroundColor: values.backgroundColor, color: values.fontColor }}>
												
													<div className="chat-header-top" style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
														<div className="chat-tabs" id="chat-tabs"
															style={{
																marginTop: '-17px',
																display: values.offlineMessage ? 'flex' : 'none',
																position: 'relative',
																backgroundColor: 'rgba(255, 255, 255, 0.2)',
																borderRadius: '16px',
															}}>
															<button id="tab-ai-assistant"
																onClick={() => { setSelectedTab(0) }}
																style={{
																	border: 'none',
																	padding: '6px 10px',
																	fontSize: '13px',
																	borderRadius: '16px',
																	cursor: 'pointer',
																	position: 'relative',
																	zIndex: 2,
																}}>
																	{selectedTab === 0 && <div className={styles.activeTab} style={{ backgroundColor: values.backgroundColor, left: "4px" }}></div>}
																{values.assistantTabHeader}
															</button>
															<button id="tab-offline-msg"
																onClick={() => { setSelectedTab(1) }}
																style={{
																	border: 'none',
																	padding: '6px 10px',
																	fontSize: '13px',
																	borderRadius: '16px',
																	cursor: 'pointer',
																	position: 'relative',
																	zIndex: 2,
																}}
															>
																{selectedTab === 1 && <div className={styles.activeTab} style={{ backgroundColor: values.backgroundColor, right: "4px" }}></div>}
																{values.offlineMsgTabHeader}
															</button>
														</div>


														<div className="chat-close">
															<button className="chat-close-btn" id="chat-close-btn">
																<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-x">
																	<line x1="18" y1="6" x2="6" y2="18"></line>
																	<line x1="6" y1="6" x2="18" y2="18"></line>
																</svg>
															</button>
														</div>
													</div>

													{
														selectedTab === 0 && (
															<div className="ai-assistant-header">
																<h2>
																	{values.heading}
																</h2>
																<p>{values.description}</p>
															</div>
														)
													}
													{
														selectedTab === 1 && (
															<div className="offline-message-header">
																<h2>
																	{values.offlineMsgHeading}
																</h2>
																<p>{values.offlineMsgDescription}</p>
															</div>
														)
													}
											</div>
											<div id="chat-container" className="chat-container" style={{ minHeight: "140px"}}>
												{selectedTab === 0 && (
													<div style={{display: 'flex',
													flexDirection: 'column',
													height: '100%'}}>
														<div id="chat-messages" className="chat-messages">
															{
																values.welcomeMessages.map((item: any, index: number) => (

																	<div className="chat-message chatbot">
																		<div className="chat-message-text">{item}</div>
																	</div>

																))
															}
															<div className="chat-message user" >
																<div className="chat-message-text" style={{ backgroundColor: values.backgroundColor, color: values.fontColor }}>QoldauAI деген не?</div>
															</div>
														</div>
														<div className={styles.chatSampleMessages} id="chat-sample-messages">
															{values.questionExamples.map((item: any, index: number) => (

																<button onClick={() => {
																	setMessage(item.question)
																}} className={styles.chatSampleMessage} data-message={item.question} key={index}>{item.label}</button>


															))
															}
														</div>
														<Box id="chat-form">
															<div className="chat-input-wrap">
																<textarea value={message} onChange={handleTextAreaChange} rows={1} className="chat-input textarea js-auto-size" id="chat-input" placeholder={values.chatInputPlaceholderText} ></textarea>
																<button className="chat-submit-btn"><svg width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
																	<path fillRule="evenodd" clipRule="evenodd" d="M4.394 14.7L13.75 9.3c1-.577 1-2.02 0-2.598L4.394 1.299a1.5 1.5 0 00-2.25 1.3v3.438l4.059 1.088c.494.132.494.833 0 .966l-4.06 1.087v4.224a1.5 1.5 0 002.25 1.299z" style={{ fill: values.backgroundColor }}></path>
																</svg></button>
															</div>
														</Box>
													</div>
												)}

												{selectedTab === 1 && (
													<div className="offline-message" style={{ padding: "20px 20px 10px 20px", position: "relative", height: "100%", overflow: "auto" }}>
														<div className={styles.formGroup}>
															<label className={styles.formLabel}>{values.nameFieldLabel} <span className={styles.formRequired}>*</span></label>
															<input type="text" className={styles.formControl} id="offline-message-name" placeholder={values.nameFieldPlaceholder}></input>
															{/* <div className={styles.invalidFeedback} id="invalid-feedback-email">{values.requiredFieldMsg}</div> */}
														</div>

														<div className={styles.formGroup}>
															<label className={styles.formLabel}>{values.emailFieldLabel} <span className={styles.formRequired}>*</span></label>
															<input type="text" className={styles.formControl} id="offline-message-email" placeholder={values.emailFieldPlaceholder}></input>
																{/* <div className={styles.invalidFeedback} id="invalid-feedback-email-invalid">{values.invalidEmailMsg}</div> */}
														</div>
														<div className={styles.formGroup}>
															<label className={styles.formLabel}>{values.msgFieldLabel} <span className={styles.formRequired}>*</span></label>
															<textarea className={styles.formControl} rows={4} id="offline-message-message"
																placeholder={values.msgFieldPlaceholder}></textarea>
														</div>
														<button className={styles.formSubmit} id="offline-message-submit"
															type="button" style={{ backgroundColor: values.backgroundColor, color: values.fontColor }}>{values.formSubmitBtnLabel}</button>
													</div>
												)}
											</div>
										</div>
										<ChatBotLauncher backgroundColor= { values.backgroundColor} fontColor= {values.fontColor} launcherIcon={values.launcherIcon.id} />
									</div>
								</Flex>

							</HStack>
						</VStack>
						<Box
							pos="absolute"
							w="100%"
							zIndex={2}
							display="flex"
							p="8"
							pt="4"
							pb="4"
							bottom="0"
							left="0"
							right="0"
							bg="white"
							borderTop="1px solid"
							borderColor="gray.100"
							justifyContent="space-between"
						>
							<HStack></HStack>
							<HStack>
								<Button onClick={onBackClick} variant="outline">
									Артқа
								</Button>
								<Button
									colorScheme="blue"
									variant="solid"
									isLoading={isSubmitting}
									isDisabled={isSubmitting}
									onClick={() => {
										onNextClick(values);
									}}
								>
									{primaryButtonLabel}
								</Button>
							</HStack>
						</Box>
					</>
				)}
			</Formik>
		</Flex>
	);
};
