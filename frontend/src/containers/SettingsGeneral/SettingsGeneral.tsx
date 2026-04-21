import * as React from 'react';
import {
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  HStack,
  Input,
  Switch,
  Text,
  Textarea,
  useToast,
  VStack,
} from '@chakra-ui/react';
import styles from './SettingsGeneral.module.scss';
import { getUserProfile, setOpenAIKey } from '../../services/userServices';

export const SettingsGeneral = () => {
  const toast = useToast();
  const [isLoading, setIsLoading] = React.useState<boolean>();
  const [isApiKeyLoading, setIsApiKeyLoading] = React.useState<boolean>();
  const [apiKey, setApiKey] = React.useState<string>('');
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    async function fetchData() {
      try {
        setIsApiKeyLoading(true);
        const response = await getUserProfile();
        if (response.data.customKeys && response.data.customKeys.useOwnKey) {
			setApiKey('***************************************************');
        }
		setUser(response.data);
      } catch (error) {
        console.log('Unable to fetch deals', error);
      } finally {
        setIsApiKeyLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleApiKeySave = React.useCallback(async () => {
    try {
      setIsLoading(true);
      if (!apiKey.includes('**')) {
		if(user && user.subscriptionData && user.subscriptionData.name === 'FREE') {
			toast({
				title: `Өз API кілтіңізді қолдану үшін ақылы жоспарға өтіңіз`,
				status: 'warning',
				isClosable: true,
			  });
		} else {
			await setOpenAIKey(apiKey, !!apiKey);
			toast({
				title: `API кілті сәтті жаңартылды!`,
				status: 'success',
				isClosable: true,
			  });
		}
      } else {
        toast({
          title: `Дұрыс API кілтін енгізіңіз. Өз кілтіңізді өшіру үшін оны өшіріп, сақтаңыз.`,
          status: 'warning',
          isClosable: true,
        });
      }
    } catch (error) {
      console.log('Unable to fetch deals', error);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, toast, user]);

  const handleApiKeyChange = React.useCallback((e) => {
    setApiKey(e.target.value);
  }, []);

  return (
    <Flex bg="white" p="12" borderRadius="md" shadow="sm" maxW="3xl">
      <VStack spacing="8">
        <Flex direction={'column'} w="100%">
          <Box>
            <Heading className={styles.heading} size="md">
              OpenAI API кілті
            </Heading>
            <Text className={styles.subHeading} mb="2">
				API кілтіңіз қауіпсіз түрде шифрланады. Шифрланғаннан кейін бастапқы кілтті аккаунтта көре алмайсыз.
				Бірақ оны әрқашан ауыстыра аласыз.
            </Text>
            <Text className={styles.subHeading} mb="6">
				Егер API кілті жарамсыз болса, QoldauAI әдепкі API кілтін қолданады. Егер жоспарыңызда брендті жою үшін жеке API кілт қажет болса, кілт бос не жарамсыз кезде бренд көрсетіледі.
            </Text>
          </Box>
          <Input
            isDisabled={isApiKeyLoading}
            onChange={handleApiKeyChange}
            type="password"
            value={apiKey}
            mb={4}
          />
          <HStack>
            <Button
              colorScheme="teal"
              size="md"
              isLoading={isLoading}
			  isDisabled={isApiKeyLoading}
              loadingText={'Сақталуда...'}
              onClick={handleApiKeySave}
            >
              Сақтау
            </Button>
          </HStack>
        </Flex>
		{/* {user? (<><Divider maxW="3xl" orientation="horizontal" />
        <Flex direction={'column'} w="100%">
          <Box>
            <Flex alignItems="center" justifyContent="space-between">
              <Heading className={styles.heading} size="md">
                Use your own API key
              </Heading>
              <Switch
                //defaultChecked={(defaultCustomizationValues || chatWidgetDefaultValues).showReadMore}
                //defaultChecked={getDefaultUsageValue()}
				defaultChecked={user.customKeys && user.customKeys.useOwnKey}
				//isDisabled={!apiKey || apiKey.includes('**')}
                colorScheme="teal"
				value={}
				onChange={}
                size="md"
              />
            </Flex>
            <Text className={styles.subHeading}>
			If turned off, or if the API key is invalid, QoldauAI will use its default API key. Please note that if your plan requires your own API key for brand removal, branding will be displayed when this option is off.
            </Text>
          </Box>
        </Flex></>):null} */}
		
      </VStack>

    </Flex>
  );
};
