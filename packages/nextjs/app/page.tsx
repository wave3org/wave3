"use client";

import Link from "next/link";
import type { NextPage } from "next";
import Logo from "~~/components/Logo";
import "~~/styles/login-page.css";

const LoginPage: NextPage = () => {
	return (
		<div className="greetings-container">
			<div className="greetings-content">
				<div className="title">
					<Logo />
				</div>
				<div className="greetings-subtitle">
					<span>La nueva era de la música es tuya</span>
				</div>
				<div className="greetings-description">
					<span>Escucha sin límites, invierte en tus artistas favoritos y gana regalías. Todo en la blockchain.</span>
				</div>
				<div className="login-button-container">
					<Link href="/home" passHref className="primary-button ">
						<span>Conectar billetera</span>
					</Link>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;
