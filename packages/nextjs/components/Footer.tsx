import React from "react";
import { hardhat } from "viem/chains";
import { SwitchTheme } from "~~/components/SwitchTheme";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

/**
 * Site footer
 */
export const Footer = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  return (
    <div className="footer-container">
      <div>
        <div className="fixed flex justify-end items-center w-full z-10 p-4 bottom-0 left-0 pointer-events-none">
          <SwitchTheme className={`pointer-events-auto ${isLocalNetwork ? "self-end md:self-auto" : ""}`} />
        </div>
      </div>
      <div className="w-full">
        <ul className="menu menu-horizontal w-full">
          <div className="flex justify-center items-center gap-2 text-sm w-full">
            <div className="flex justify-center items-center gap-2">
              <p className="m-0 text-center">2025 - Totally not a scam</p>
            </div>
            <span>·</span>
            <div>
              <a
                className="flex justify-center items-center gap-1"
                href="https://instagram.com/"
                target="_blank"
                rel="noreferrer"
              >
                <span className="link">social network 1</span>
              </a>
            </div>
            <div>
              <a
                className="flex justify-center items-center gap-1"
                href="https://facebook.com/"
                target="_blank"
                rel="noreferrer"
              >
                <span className="link">social network2</span>
              </a>
            </div>
          </div>
        </ul>
      </div>
    </div>
  );
};
