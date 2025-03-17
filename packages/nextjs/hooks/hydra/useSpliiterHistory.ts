import { useEffect, useState } from "react";
import { readContract } from "@wagmi/core";
import { erc20Abi } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";

const useSpliiterHistory = () => {
  const [erc20SplitEvents, setErc20SplitEvents] = useState<any[] | undefined>([]);

  const { address, chain } = useAccount();
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  const getTokenSymbol = async (tokenAddress?: string) => {
    if (tokenAddress && tokenAddress != "") {
      try {
        const data = await readContract(wagmiConfig, {
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "symbol",
        });
        return data;
      } catch (error) {
        console.log(error);
      }
    }
    return "";
  };

  const getTokenDecimals = async (tokenAddress?: string) => {
    if (tokenAddress && tokenAddress != "") {
      try {
        const data = await readContract(wagmiConfig, {
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "decimals",
        });
        return data;
      } catch (error) {
        console.log(error);
      }
    }
    return 18;
  };

  const erc20Splits = useScaffoldEventHistory({
    contractName: "TokenDistributor",
    eventName: "Erc20Split",
    fromBlock: BigInt(Number(process.env.NEXT_PUBLIC_DEPLOY_BLOCK) || 0),
    blockData: true,
  });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const events = erc20Splits.data?.filter(obj => obj.args.sender === address);
        if (events) {
          const eventsWithTokenData = await Promise.all(
            events.map(async event => {
              const symbol = await getTokenSymbol(event.args.token);
              const decimals = await getTokenDecimals(event.args.token);
              return {
                ...event,
                tokenSymbol: symbol,
                tokenDecimals: decimals,
              };
            }),
          );
          setErc20SplitEvents(eventsWithTokenData);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setTimeout(() => {
          setIsLoadingEvents(false);
        }, 5000);
      }
    };

    fetchEvents();
  }, [erc20Splits.isLoading, address, erc20Splits.data, chain]);

  return {
    erc20SplitEvents,
    noTokenSplits: erc20SplitEvents && erc20SplitEvents?.length == 0,
    loading: erc20Splits.isLoading || isLoadingEvents,
  };
};

export default useSpliiterHistory;
