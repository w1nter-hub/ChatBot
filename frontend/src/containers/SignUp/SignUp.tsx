import * as React from 'react';
import {
	Box,
	Button,
	Flex,
	FormControl,
	FormErrorMessage,
	FormLabel,
	Heading,
	Input,
	Text,
	useToast,
} from '@chakra-ui/react';


import { Field, Form, Formik } from 'formik';

import { signUp } from '../../services/authServices';
import {
	Link,
	RouteComponentProps,
	useHistory,
	withRouter,
} from 'react-router-dom';
import { Logo } from '../../components/Logo/Logo';
export function validateEmailAddress(email: string) {
	return email && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);
}
interface FormValues {
	email: string;
	password: string;
}
interface SignUpProps extends RouteComponentProps {
	onSignUp: (token: string, redirectTo?: string) => void;
}
function validateEmail(value: string) {
	let error;
	if (!value) {
		error = 'Email енгізіңіз.';
	} else if (validateEmailAddress(value)) {
		error = 'Дұрыс email мекенжайын енгізіңіз.';
	}
	return error;
}
function validatePassword(value: string) {
	let error;
	if (!value) {
		error = 'Құпиясөзді енгізіңіз.';
	}
	return error;
}
const SignUp = (props: SignUpProps) => {
	const toast = useToast();
	let history = useHistory();

	return (
		<Flex minH="100vh" direction="column" position="relative">
			<Flex
				shrink={0}
				w="100%"
				h="64px"
				px={{ base: 4, md: 10 }}
				alignItems="center"
				zIndex={3}
				position="relative"
				borderBottomWidth="1px"
				borderColor="whiteAlpha.700"
				bg="rgba(255, 255, 255, 0.78)"
				sx={{
					backdropFilter: 'saturate(160%) blur(14px)',
					WebkitBackdropFilter: 'saturate(160%) blur(14px)',
					boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset, 0 8px 32px rgba(127, 88, 255, 0.06)',
				}}
			>
				<Logo></Logo>
			</Flex>
			<Flex alignItems="center" justifyContent="center" flex={1} px={4} py={10}>
				<Box
					width={480}
					maxW="100%"
					p={{ base: 8, md: 12 }}
					borderRadius="2xl"
					borderWidth="1px"
					borderColor="whiteAlpha.800"
					bg="rgba(255, 255, 255, 0.82)"
					m="0 auto"
					sx={{
						backdropFilter: 'saturate(180%) blur(20px)',
						WebkitBackdropFilter: 'saturate(180%) blur(20px)',
						boxShadow:
							'0 4px 32px rgba(127, 88, 255, 0.1), 0 1px 0 rgba(255,255,255,0.95) inset',
					}}
				>
					<Heading
						textAlign="center"
						fontSize={{ base: '2xl', md: '3xl' }}
						fontWeight="700"
						as="h3"
						mb={8}
						sx={{
							background: 'linear-gradient(135deg, #6b47e8, #35c2a1)',
							WebkitBackgroundClip: 'text',
							WebkitTextFillColor: 'transparent',
							backgroundClip: 'text',
						}}
					>
						Тіркелу
					</Heading>
					<Formik
						initialValues={{ email: '', password: '' }}
						onSubmit={async (values: FormValues, actions) => {
							try {
								const response = await signUp({
									email: values.email,
									password: values.password,
									confirmPassword: values.password,
								});
								actions.setSubmitting(false);
								props.onSignUp(response.data.access);
								history.push('/dashboard');
							} catch (error) {
								toast({
									title: `Қате орын алды`,
									status: 'error',
									isClosable: true,
								});
								actions.setSubmitting(false);
							}
						}}
					>
						{(props) => (
							<Form>
								<Field
									type='email'
									name='email'
									validate={validateEmail}
								>
									{({ field, form }: any) => (
										<FormControl
											mb='6'
											isInvalid={
												form.errors.email &&
												form.touched.email
											}
										>
											<FormLabel
												fontSize='sm'
												htmlFor='email'
											>
												Email мекенжайы
											</FormLabel>
											<Input
												{...field}
												id='email'
												placeholder='atynyz@kompaniya.kz'
											/>
											<FormErrorMessage>
												{form.errors.email}
											</FormErrorMessage>
										</FormControl>
									)}
								</Field>
								<Field
									type='password'
									name='password'
									validate={validatePassword}
								>
									{({ field, form }: any) => (
										<FormControl
											mb='6'
											isInvalid={
												form.errors.password &&
												form.touched.password
											}
										>
											<FormLabel
												fontSize='sm'
												htmlFor='password'
											>
												Құпиясөз
											</FormLabel>
											<Input
												{...field}
												type='password'
												id='password'
												placeholder='********'
											/>
											<FormErrorMessage>
												{form.errors.password}
											</FormErrorMessage>
										</FormControl>
									)}
								</Field>
								<Button
									colorScheme="blue"
									variant='solid'
									mt={4}
									isFullWidth
									size='lg'
									isLoading={props.isSubmitting}
									isDisabled={
										props.isSubmitting ||
										!props.isValid ||
										!props.dirty
									}
									type='submit'
								>
									Тегін тіркелу
								</Button>
							</Form>
						)}
					</Formik>
					<Text fontSize='sm' mt='8' textAlign='center' color="gray.600">
						Аккаунтыңыз бар ма?{' '}
						<Link to='/login'>
							<Text display='inline' color="gray.700" fontWeight="600">
								Кіру
							</Text>
						</Link>
					</Text>
				</Box>
			</Flex>
		</Flex>
	);
};
export default withRouter(SignUp);
