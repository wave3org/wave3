import { useCallback, useEffect, useMemo, useState } from "react";
import { Address } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { getSmartAccountAddress, isSmartAccountModeEnabled } from "~~/services/web3/smartAccount";

export const useSmartAccount = () => {
  const { address, chain } = useAccount();
  const publicClient = usePublicClient({ chainId: chain?.id });
  const [smartAccountAddress, setSmartAccountAddress] = useState<Address | undefined>(undefined);
  const [isSmartAccountLoading, setIsSmartAccountLoading] = useState(false);

  const smartAccountModeEnabled = isSmartAccountModeEnabled();

  const refreshSmartAccount = useCallback(async () => {
    if (!smartAccountModeEnabled || !address || !chain?.id || !publicClient) {
      setSmartAccountAddress(undefined);
      return;
    }

    setIsSmartAccountLoading(true);
    try {
      const account = await getSmartAccountAddress({
        publicClient,
        chainId: chain.id,
        owner: address,
      });
      setSmartAccountAddress(account);
    } finally {
      setIsSmartAccountLoading(false);
    }
  }, [smartAccountModeEnabled, address, chain?.id, publicClient]);

  useEffect(() => {
    void refreshSmartAccount();

    if (!smartAccountModeEnabled || !address || !chain?.id || !publicClient) {
      return;
    }

    const interval = setInterval(() => {
      void refreshSmartAccount();
    }, 10000);

    return () => clearInterval(interval);
  }, [smartAccountModeEnabled, address, chain?.id, publicClient, refreshSmartAccount]);

  const activeAddress = useMemo(() => {
    if (!smartAccountModeEnabled) {
      return address;
    }
    return smartAccountAddress ?? address;
  }, [smartAccountModeEnabled, smartAccountAddress, address]);

  return {
    smartAccountModeEnabled,
    smartAccountAddress,
    activeAddress,
    isSmartAccountLoading,
    refreshSmartAccount,
  };
};
