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
    contractName: "ERC20Mock",
    eventName: "Transfer",
    fromBlock: 0n,
    watch: true,
    // filters: { greetingSetter: "0x9eB2C4866aAe575bC88d00DE5061d5063a1bb3aF" },
    // blockData: true,
    // transactionData: true,
    // receiptData: true,
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
