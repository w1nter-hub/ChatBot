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
	InputGroup,
	Text,
	useToast,
} from '@chakra-ui/react';

import styles from './Login.module.scss'

import { Field, Form, Formik } from 'formik';

import { logIn } from '../../services/authServices';
import {
	Link,
	Redirect,
	RouteComponentProps,
	withRouter,
} from 'react-router-dom';
import { useState } from 'react';
import { Logo } from '../../components/Logo/Logo';
export function validateEmailAddress(email: string) {
	return email && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);
}
interface FormValues {
	email: string;
	password: string;
}
interface LoginProps extends RouteComponentProps {
	onLoginIn: (token: string, redirectTo?: string) => void;
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
const Login = (props: LoginProps) => {
	const toast = useToast();

	const [isAuthenticated, setIsAuthenticated] = useState(false);
	if (isAuthenticated) {
		const routeState = props.location.state as any;
		const redirectTo = routeState?.redirectTo || '';
		return <Redirect to={redirectTo} />;
	}

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
						Кіру
					</Heading>
					<Formik
						initialValues={{ email: '', password: '' }}
						onSubmit={async (values: FormValues, actions) => {
							try {
								const response = await logIn({
									username: values.email,
									password: values.password,
								});
								const routeState = props.location.state as any;
								const redirectTo = routeState?.redirectTo || '';
								props.onLoginIn(
									response.data.access,
									redirectTo
								);
								setIsAuthenticated(true);
							} catch (error) {
								console.log('errro', error);
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
											isInvalid={
												form.errors.email &&
												form.touched.email
											}
											mb='6'
										>
											<FormLabel
												fontSize='sm'
												htmlFor='email'
											>
												Email
											</FormLabel>
											<Input
												{...field}
												id='email'
												placeholder='name@company.com'
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
											isInvalid={
												form.errors.password &&
												form.touched.password
											}
											mb='6'
										>
											<FormLabel
												fontSize='sm'
												htmlFor='password'
											>
												Құпиясөз
											</FormLabel>
											<InputGroup size='md'>
												<Input
													{...field}
													type='password'
													id='password'
													placeholder='********'
												/>

											</InputGroup>
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
									Кіру
								</Button>
							</Form>
						)}
					</Formik>
					<Flex justifyContent="center" fontSize='sm' mt='8' textAlign='center'>
						<Text mr='4px' color="gray.600">
							Аккаунтыңыз жоқ па?
						</Text>
						<Link to='/sign-up'>
							<Text display='inline' color="gray.700">
								Тіркелу
							</Text>
						</Link>
					</Flex>
				</Box>
			</Flex>
		</Flex>
	);
};

export default withRouter(Login);
