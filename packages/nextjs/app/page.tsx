"use client";

import Image from "next/image";
import Link from "next/link";
import type { NextPage } from "next";
import "~~/styles/login-page.css";

const LoginPage: NextPage = () => {
  return (
    <div className="greetings-container">
      <div className="greetings-content">
        <div className="greetings-title-container">
          <div className="greetings-logo-container">
            <Image className="logo" alt="wave3 logo" fill src="/wave3-logo.png" />
          </div>
          <span className="greetings-title">wave3</span>
        </div>
        <div className="greetings-subtitle">
          <span>La nueva era de la música es tuya</span>
        </div>
        <div className="greetings-description">
          <span>Escucha sin límites, invierte en tus artistas favoritos y gana regalías. Todo en la blockchain.</span>
        </div>
        <Link href="/home" passHref className="login-button">
          <span>Conectar billetera</span>
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
