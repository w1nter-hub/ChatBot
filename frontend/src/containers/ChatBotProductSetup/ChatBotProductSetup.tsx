import * as React from "react";
import {
	HStack,
	Button,
	VStack,
	FormControl,
	FormErrorMessage,
	FormLabel,
	Input,
	FormHelperText,
	Box,
	Flex,
	AlertIcon,
	Alert,
	Text,
	Table,
	TableContainer,
	Tbody,
	Td,
	Th,
	Thead,
	Tr,
	Spinner,
	Stat,
	StatLabel,
	StatNumber,
	StatHelpText,
	StatArrow,
	StatGroup,
	useDisclosure,
	Tabs,
	TabList,
	Tab,
	TabPanels,
	TabPanel,
	IconButton,
	Heading,
	useToast,
} from "@chakra-ui/react";

import {
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalFooter,
	ModalBody,
	ModalCloseButton,
} from '@chakra-ui/react'

import classNames from 'classnames';

import { useEffect, useRef } from "react";
import { Formik, Form, Field } from "formik";

import styles from './ChatBotProductSetup.module.scss'
import { getDomainFromUrl } from "../../utils/commonUtils";
import { fetchKnowledgebaseCrawlDataDetails, deleteTrainingData } from "../../services/knowledgebaseService";
import { CrawlData, WebsiteData, ProductSetupData, DocsKnowledgeData } from "../../types/knowledgebase.type";
import ReactMarkdown from "react-markdown";
import { Paginator } from "../../widgets/Paginator/Paginator";
import { SectionTitle } from "../../components/SectionTitle/SectionTitle";
import CustomDropzone from "../../components/FileDropzone/CustomDropzone";
import { RiDeleteBin5Line } from "react-icons/ri";
import { NoDataFineTuneIcon } from "../../components/Icons/noData/NoDataFineTuneIcon";

interface FormValues {
	websiteUrl: string;
	target?: string[];
	exclude?: string[];
	files: File[];
}
interface ChatBotProductSetupProps {
	onPrimaryBtnClick: (finalFormValues: ProductSetupData, hasWebsiteDataChanged: boolean) => void;
	onSecondaryBtnClick: (finalFormValues: ProductSetupData, hasWebsiteDataChanged: boolean) => void;
	onCrawlDataPaginationClick: (pageNo: number) => void;
	onDocsDataPaginationClick: (pageNo: number) => void;
	onTabsChange: (tabIndex: number) => void;
	primaryButtonLabel?: string;
	secondaryBtnLabel?: string;
	showSecondaryButton?: boolean;
	defaultExcludedPaths?: string[];
	defaultIncludedPaths?: string[];
	defaultProductDescription?: string;
	defaultWebsite?: string;
	showDescription?: boolean;
	crawlDataLoading?: boolean;
	defaultCrauledData: CrawlData;
	defaultFiles?: File[];
	disableTabs: boolean;
	isSubmitting?: boolean;
	isUploadingDocs?: boolean;
	isSecondaryBtnSubmitting?: boolean;
	disableWebsiteInput?: boolean;
	loadingText?: string;
	disableSubmitBtnByDefault?: boolean;
	docsData?: DocsKnowledgeData;
	docsDataLoading?: boolean;
}

function validateWebsite(value: string) {
	let error;
	if (value &&
		!/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,10}\b([-a-zA-Z0-9@:%_\+.~#()?&
			value
		)
	) {
		error = "Сайт сілтемесі жарамсыз";
	}
	console.log("error", error);
	return error;
}

export const ChatBotProductSetup = ({
	onPrimaryBtnClick,
	onSecondaryBtnClick,
	onCrawlDataPaginationClick,
	onDocsDataPaginationClick,
	onTabsChange,
	crawlDataLoading,
	defaultWebsite = "",
	primaryButtonLabel = "Қолдау ботын құру",
	secondaryBtnLabel = "Артқа",
	showSecondaryButton = false,
	disableSubmitBtnByDefault = false,
	defaultCrauledData,
	defaultExcludedPaths,
	defaultIncludedPaths,
	defaultFiles = [],
	disableWebsiteInput = false,
	loadingText = '',
	isSubmitting = false,
	disableTabs = false,
	isUploadingDocs = false,
	isSecondaryBtnSubmitting = false,
	docsDataLoading = false,
	docsData,
}: ChatBotProductSetupProps) => {
	const customDropzoneRef = useRef(); 
	const toast = useToast();

	const { isOpen, onOpen, onClose } = useDisclosure()

	const [crauledData, setCrauledData] = React.useState<CrawlData>(defaultCrauledData as unknown as CrawlData)

	const [crauledDataDetail, setCrauledDataDetail] = React.useState<string>(defaultCrauledData as unknown as string)

	const [deleteDocLoading, setDeleteDocLoading] = React.useState<boolean>(false);
	const [localDocsData, setLocalDocsData] = React.useState<DocsKnowledgeData>(docsData as unknown as DocsKnowledgeData);
	const [docToDelete, setDocToDelete] = React.useState<string>('0');
	const [selectedTab, setSelectedTab] = React.useState<number>(0);

	useEffect(() => {
		setLocalDocsData(docsData as unknown as DocsKnowledgeData);
	}, [docsData]);

	useEffect(() => {
		setCrauledData(defaultCrauledData);
	}, [defaultCrauledData]);

	const onNextButtonClick = React.useCallback(
		async ({ websiteUrl, target, exclude, files }: FormValues, type) => {
			const formValues: FormValues = {} as FormValues;
			formValues.websiteUrl = websiteUrl;

			let targetPaths = (target || '').split(',')
			
			targetPaths = targetPaths.filter(path => !!path).map(path => path.trim());

			
			
			

			let excludePaths = (exclude || '').split(',')
			
			excludePaths = excludePaths.filter(path => !!path).map(path => path.trim())

			
			
			
			let chatbotName = '';
			if (websiteUrl) {
				chatbotName = getDomainFromUrl(websiteUrl);
			} else if (files.length) {
				chatbotName = files[0].name;
			}
			const websiteData: WebsiteData = {
				name: chatbotName,
				websiteUrl: websiteUrl,
				urls: [],
				include: targetPaths,
				exclude: excludePaths,
			}

			const payLoad: ProductSetupData = {
				websiteData: websiteData,
				files: files
			}

			if (customDropzoneRef.current) {
				customDropzoneRef.current.clearFiles();
			}

			
			
			
			

			const hasWebsiteDataChanged = (defaultWebsite !== websiteUrl ||
				defaultIncludedPaths !== targetPaths.join(',') ||
				defaultExcludedPaths !== excludePaths.join(',')) ? true : false;

			if (type === 'primary') {
				onPrimaryBtnClick(payLoad, hasWebsiteDataChanged);
			} else {
				onSecondaryBtnClick(payLoad, hasWebsiteDataChanged);
			}
		},
		[defaultWebsite, defaultIncludedPaths, defaultExcludedPaths, onPrimaryBtnClick, onSecondaryBtnClick]
	);

	const handlePageClick = React.useCallback((page) => {
		onCrawlDataPaginationClick(page+1);
	}, [onCrawlDataPaginationClick]);

	const handleDocsPageClick = React.useCallback((page) => {
		onDocsDataPaginationClick(page + 1);
	}, [onDocsDataPaginationClick]);

	const [crawlDatLoading, setCrawlDatLoading] = React.useState<string>('');

	const handleURLClick = React.useCallback(async (knowledgebaseId, crawlDataId) => {
		setCrawlDatLoading(crawlDataId);
		const resposne = await fetchKnowledgebaseCrawlDataDetails(knowledgebaseId, crawlDataId);
		setCrauledDataDetail(resposne.data?.content);
		setCrawlDatLoading('');
		onOpen();
	}, [onOpen]);

	const handleDocDelete = React.useCallback(async (knowledgeBaseId, docId) => {
		setDeleteDocLoading(true);
		try {
			await deleteTrainingData(knowledgeBaseId, docId);
			const updatedResults = localDocsData?.docs.filter((data) => data._id !== docId);
			if (updatedResults) {
				setLocalDocsData(prevPage => ({
					...prevPage,
					docs: updatedResults,
				}));
			}
			toast({
				title: `Құжат сәтті жойылды`,
				status: "success",
				isClosable: true,
			});
		} catch (error) {
			toast({
				title: `Құжатты жою мүмкін болмады`,
				status: "error",
				isClosable: true,
			});
		} finally {
			setDeleteDocLoading(false);
			setDocToDelete('0');
		}
	}, [localDocsData, toast]);

	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	

	const getCrauledPaths = React.useCallback(() => {
		if (isSubmitting) {
			return <>
				<VStack alignItems="center" w="100%" mb="6">
					<VStack w="100%">
						<Flex direction="column" justifyContent="center" alignItems="center" borderRadius="md" border="1px solid" borderColor="gray.200" w="100%" p="12">

							<Spinner color='gray.700' mb="4" />
							<Text color="gray.500">
								{loadingText}
							</Text>
						</Flex>
					</VStack>
				</VStack>
			</>
		}
		if (crauledData) {
			const totalPages = crauledData?.stats?.crawledPages + crauledData?.stats?.failedPages;
			const crawledPercentage = (crauledData?.stats?.crawledPages * 100) / totalPages;
			const failedPercentage = (crauledData?.stats?.failedPages * 100) / totalPages;
			return <>
				{

}
				{

}

				<Box>
					<Box position="relative">
						{crawlDataLoading ? <Box className={styles.crawlDataLoading}><Spinner color='gray.700' size="xs" /></Box> : ''}
						<TableContainer>
							<Table size='sm'>
								<Thead>
									<Tr>
										<Th>Сканерленген URL</Th>
									</Tr>
								</Thead>
								<Tbody>
									{crauledData?.urls?.map((url, index) => {
										return (
											<Tr key={url._id}>
												<Td className={classNames(styles.urls, {
													[styles.firstUrl]: index === 0,
												})} maxW="400px" overflow="hidden" whiteSpace="nowrap" textOverflow="ellipsis">
													{url.url}
													{crawlDatLoading === url._id ? <Box className={styles.urlSpinner}><Spinner color='gray.700' size="xs" /></Box> : ''}

													<Button className={styles.urlBtn} colorScheme='gray' size='xs'
														onClick={() => {
															handleURLClick(crauledData?.knowledgebaseId, url._id)
														}}>
														Деректі көру
													</Button>
												</Td>
											</Tr>
										)
									})}
								</Tbody>
							</Table>
						</TableContainer>
					</Box>
					{
						crauledData.pages > 1 && <Box mt="4">
							<Paginator onPageChange={handlePageClick} pageRangeDisplayed={5}
								pageCount={crauledData.pages} />
						</Box>
					}
				</Box>
			</>
		}
		return null
	}, [crauledData, crawlDatLoading, crawlDataLoading, handlePageClick, handleURLClick, isSubmitting, loadingText]);

	const getCrawledDocs = React.useCallback(() => {
		if (isUploadingDocs || isSubmitting) {
			return <>
				<VStack alignItems="center" w="100%" mb="6">
					<VStack w="100%">
						<Flex direction="column" justifyContent="center" alignItems="center" borderRadius="md" border="1px solid" borderColor="gray.200" w="100%" p="12">

							<Spinner color='gray.700' mb="4" />
							<Text color="gray.500">
								{isUploadingDocs ? 'Файлдар жүктелуде...' : loadingText}
							</Text>
						</Flex>
					</VStack>
				</VStack>
			</>
		}

		if (localDocsData && localDocsData?.docs.length) {
			return <>
			<Box>
				<Box position="relative">
					{docsDataLoading ? <Box className={styles.crawlDataLoading}><Spinner color='gray.700' size="xs" /></Box> : ''}
					<TableContainer>
						<Table size='sm'>
							<Thead>
								<Tr>
									<Th>Файлдар</Th>
								</Tr>
							</Thead>
							<Tbody>
								{localDocsData?.docs?.map((doc, index) => {
									return (
										<Tr key={doc._id}>
											<Td className={classNames(styles.urls, {
												[styles.firstUrl]: index === 0,
											})} maxW="400px" overflow="hidden" whiteSpace="nowrap" textOverflow="ellipsis" align="center">
												<Flex alignItems="center" justifyContent="space-between">
													{doc.title || (doc.url || '').split('/')[(doc.url || '').split('/').length - 1]}
													{crawlDatLoading === doc._id ? <Box className={styles.urlSpinner}><Spinner color='gray.700' size="xs" /></Box> : ''}

													<Box right="5px" top="5px" position="absolute">
														<Button colorScheme='gray' size='xs' mr={2}
															onClick={() => {
																handleURLClick(localDocsData?.knowledgebaseId, doc._id)
															}}
														>
															Деректі көру
														</Button>
														<IconButton
															variant='outline'
															colorScheme='gray'
															aria-label='Call Sage'
															fontSize='14px'
															size="xs"
															isLoading={deleteDocLoading && docToDelete === doc._id}
															onClick={() => {
																setDocToDelete(doc._id);
																handleDocDelete(localDocsData.knowledgebaseId, doc._id)
															}}
															icon={<RiDeleteBin5Line />}
														/>
													</Box>
												</Flex>
												

											</Td>
										</Tr>
									)
								})}
							</Tbody>
						</Table>
					</TableContainer>
				</Box>
				{
					localDocsData.pages > 1 && <Box mt="4">
						<Paginator onPageChange={handleDocsPageClick} pageRangeDisplayed={5}
							pageCount={localDocsData.pages} />
					</Box>
				}
				
			</Box>
			</>
		}
		return null
	}, [isUploadingDocs, localDocsData, handleDocsPageClick, handleURLClick, handleDocDelete, deleteDocLoading, docToDelete, crawlDatLoading, docsDataLoading, loadingText, isSubmitting]);

	const handleTabChange = React.useCallback((index) => {
		setSelectedTab(index);
		onTabsChange(index);
	}, [onTabsChange]);

	return (
		<>
			<Flex h="100%" direction="column">
				<Formik
					initialValues={{
						websiteUrl: defaultWebsite,
						target: defaultIncludedPaths,
						exclude: defaultExcludedPaths,
						files: defaultFiles,
					}}
					onSubmit={async () => { }}
					
				>
					{({ values, isValid, dirty }) => (
						<>
							<VStack
								alignItems="start"
								overflowY="auto"
								spacing="4"
								p={2}
								mb="51"
							>
								<Form style={{ width: '100%' }}>
									<HStack spacing="16" alignItems="start">
											<Tabs variant="enclosed" w="100%" colorScheme='gray' mt="1" size="md" onChange={handleTabChange}>
											<TabList>
												<Tab isDisabled={isSubmitting} _focus={{ outline: "none" }} _disabled={{ cursor: "not-allowed", opacity: "0.4" }}>Сайт</Tab>
												<Tab isDisabled={isSubmitting} _focus={{ outline: "none" }} _disabled={{ cursor: "not-allowed", opacity: "0.4" }}>PDF</Tab>
											</TabList>
												<TabPanels>
													<TabPanel pt="8" px={0}>
													{

}
														<SectionTitle title="Қолдау білім көзі" description="Сайт URL мен жолдарын енгізіңіз. Жүйе беттерді жинап, қолдау білім базасын құрады." />
													
														<HStack alignItems="start" spacing="10" w="100%">
														<Box w="50%" maxW="520px">
															
																<Field
																	type="text"
																	name="websiteUrl"
																	validate={validateWebsite}
																>
																	{({ field, form }: any) => (
																		<FormControl 
																		isRequired 
																		mb="8">
																			<FormLabel fontWeight={400} color="gray.700" fontSize="sm" htmlFor="websiteUrl">
																				Сайт URL
																</FormLabel>
																			<Input
																				color="gray.700"
																				{...field}
																				id="websiteUrl"
																				isDisabled={disableWebsiteInput}
																				
																				placeholder="https://www.paritydeals.com"
																			/>
																			{disableWebsiteInput && (<FormHelperText fontSize="smaller" color="gray.400">
																				Жоба жасалғаннан кейін сайт атауын өзгертуге болмайды.
																			</FormHelperText>)}
																			{form.touched.websiteUrl && form.errors.websiteUrl && (
																				<FormHelperText color="red">
																					{form.errors.websiteUrl}
																				</FormHelperText>
																			)}
																			<FormErrorMessage>
																				{form.errors.websiteUrl}
																			</FormErrorMessage>
																		</FormControl>
																	)}
																</Field>
																<Field type="text" name="target">
																	{({ field, form }: any) => (
																		<FormControl
																			mb="8"
																			isInvalid={form.errors.target && form.touched.target}
																		>
																			<FormLabel fontWeight={400} color="gray.700" fontSize="sm" htmlFor="target">
																				Қосылатын жолдар
																</FormLabel>
																			<Input
																				color="gray.700"
																				{...field}
																				id="target"
																				placeholder="/docs"
																			/>
																			<FormHelperText fontSize="smaller" color="gray.400">
																				Қосылатын жолдарды үтір арқылы енгізіңіз, мысалы: /faq, /help, /shipping.
																</FormHelperText>

																			<FormErrorMessage>
																				{form.errors.target}
																			</FormErrorMessage>
																		</FormControl>
																	)}
																</Field>
																<Field type="text" name="exclude">
																	{({ field, form }: any) => (
																		<FormControl
																			mb="8"
																			isInvalid={form.errors.exclude && form.touched.exclude}
																		>
																			<FormLabel fontWeight={400} color="gray.700" fontSize="sm" htmlFor="exclude">
																				Алынбайтын жолдар
																			</FormLabel>
																			<Input
																				color="gray.700"
																				{...field}
																				id="exclude"
																				placeholder="/privacy"
																			/>
																			<FormHelperText fontSize="smaller" color="gray.400">
																				Алып тасталатын жолдарды үтір арқылы енгізіңіз, мысалы: /privacy, /legal.
																			</FormHelperText>

																			<FormErrorMessage>
																				{form.errors.exclude}
																			</FormErrorMessage>
																		</FormControl>
																	)}
																</Field>
															</Box>
															<Box w="50%">
																{getCrauledPaths()}
															</Box>
														</HStack>
														
													</TabPanel>
													<TabPanel pt="8">
														<SectionTitle title="Қолдау құжаттары" description="Қолдау чат-ботын үйрету үшін құжаттарды жүктеңіз (FAQ, нұсқаулық, саясаттар)." />
														<HStack spacing="10" alignItems="flex-start">
															<Box w="50%">
																<CustomDropzone 
																	ref={customDropzoneRef} 
																	name="files" 
																	label="Файл жүктеу" 
																	helperText=""
																/>
																</Box>
															<Box w="50%">
																	{ getCrawledDocs() }
															</Box>
														</HStack>
													</TabPanel>
												</TabPanels>
											</Tabs>
									</HStack>

								</Form>
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
									{showSecondaryButton ? (
										<Button onClick={() => {
											onNextButtonClick(values, "secondary");
										}} variant="outline"
											isLoading={isSecondaryBtnSubmitting}
											disabled={
												isSecondaryBtnSubmitting
													? !(isValid && dirty)
													: !isValid
											}
										>
											{secondaryBtnLabel}
										</Button>
									) : null}

									<Button
										colorScheme="blue"
										variant="solid"
										isLoading={isSubmitting}
										disabled={
											!isValid || (disableSubmitBtnByDefault && (values.files.length === 0 && !values.websiteUrl)) ||
											(!disableSubmitBtnByDefault && ((selectedTab === 0 && !values.websiteUrl) || (selectedTab === 1 && values.files.length === 0)))
										}
										onClick={() => {
											onNextButtonClick(values, "primary");
										}}
									>
										{primaryButtonLabel}
									</Button>
								</HStack>
							</Box>
						</>
					)}
				</Formik>

				<Modal isOpen={isOpen} onClose={onClose} size="6xl">
					<ModalOverlay />
					<ModalContent>
						<ModalHeader>Веб-беттен жиналған дерек</ModalHeader>
						<ModalCloseButton />
						<ModalBody>
							<Alert status='info' mb="10" fontSize='sm'>
								<AlertIcon />
								Жүйе қажетсіз контентті автоматты түрде алып тастауға тырысады. Соның салдарынан кейбір дерек жойылуы мүмкін. Нәтижені жақсарту үшін қосымша оқыту дерегін қоса аласыз.
							</Alert>
							<Box className="markdown-body">

								<ReactMarkdown children={crauledDataDetail}></ReactMarkdown>
							</Box>
						</ModalBody>

						<ModalFooter>
							<Button colorScheme='blue' mr={3} onClick={onClose}>
								Жабу
							</Button>
						</ModalFooter>
					</ModalContent>
				</Modal>

			</Flex>
		</>
	);
};
