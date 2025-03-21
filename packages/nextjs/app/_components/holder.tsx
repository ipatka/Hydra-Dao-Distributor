"use client";

import { useEffect, useState } from "react";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";

interface TokenHolder {
  address: string;
  balance: string;
}

const Holders = () => {
  const [tokenHolders, setTokenHolders] = useState<TokenHolder[]>([]);

  const {
    data: events,
    isLoading: isLoadingEvents,
    error: errorReadingEvents,
  } = useScaffoldEventHistory({
    contractName: "ERC20Mock",
    eventName: "Transfer",
    // fromBlock: 0n,
    fromBlock: 7951824n,
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

  return (
    <div className="mt-5">
      {isLoadingEvents || errorReadingEvents ? (
        <div className="flex justify-between gap-4 animate-pulse">
          <span className="bg-slate-300 w-36 h-4"></span>
          <span className="bg-slate-300 w-36 h-4"></span>
        </div>
      ) : (
        <div className="flex items-center flex-col">
          <div>Total holders: {tokenHolders.length}</div>
          {tokenHolders.map(holder => (
            <div key={holder.address} className="flex justify-between items-center px-5 py-2 gap-4">
              <Address address={holder.address} />
              <span>{holder.balance}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Holders;
