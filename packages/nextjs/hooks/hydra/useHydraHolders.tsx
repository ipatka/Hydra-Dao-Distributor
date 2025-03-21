import { useEffect, useState } from "react";
import { useScaffoldEventHistory } from "../scaffold-eth";

export interface TokenHolder {
  address: string;
  balance: string;
}

const useHydraHolders = () => {
  const [tokenHolders, setTokenHolders] = useState<TokenHolder[]>([]);

  const {
    data: events,
    isLoading: isLoadingEvents,
    error: errorReadingEvents,
  } = useScaffoldEventHistory({
    contractName: "HYDRA",
    eventName: "Transfer",
    // fromBlock: 7951824n,
    fromBlock: 16780015n,
    // fromBlock: 0n,
    watch: true,
  });

  useEffect(() => {
    if (!events) return;
    const ledger: Record<string, bigint> = {};

    events.forEach((event: any) => {
      const { from, to, value } = event.args;

      const amount = BigInt(value as bigint);

      if (from !== "0x0000000000000000000000000000000000000000") {
        ledger[from] = (ledger[from] || BigInt(0)) - amount;
      }

      if (to !== "0x0000000000000000000000000000000000000000") {
        ledger[to] = (ledger[to] || BigInt(0)) + amount;
      }
    });

    const tokenHolders = Object.entries(ledger)
      .filter(([, balance]) => balance > 0n)
      .map(([address, balance]) => ({
        address,
        balance: balance.toString(), // Convert back to string for readability
      }))
      .sort((a, b) => Number(b.balance) - Number(a.balance));

    setTokenHolders(tokenHolders);
  }, [events, isLoadingEvents]);
  return {
    tokenHolders,
    isLoadingHolders: isLoadingEvents,
    errorReadingHolders: errorReadingEvents,
  };
};

export default useHydraHolders;
