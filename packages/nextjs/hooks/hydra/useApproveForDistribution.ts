import { useEffect, useState } from "react";
import { readContract, writeContract } from "@wagmi/core";
import { formatUnits, parseUnits } from "viem";
import { erc20Abi } from "viem";
import { useAccount } from "wagmi";
import { useTransactor } from "~~/hooks/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";
import { getParsedError } from "~~/utils/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

// Custom ABI for non-standard ERC20 tokens like USDT that don't return a boolean from approve
const approveAbiNoReturn = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

export const useApproveForDistribution = ({
  tokenAddress,
  amount,
  isTransferLoading,
}: {
  tokenAddress?: string;
  amount: number;
  isTransferLoading?: boolean;
}) => {
  const { address, chain } = useAccount();
  const writeTx = useTransactor();
  const [isMining, setIsMining] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { targetNetwork } = useTargetNetwork();
  const { data: deployedContract } = useDeployedContractInfo("TokenDistributor");

  const [allowance, setAllowance] = useState<number>();
  const [balance, setBalance] = useState<number>();
  const [tokenSymbol, setTokenSymbol] = useState<string>();
  const [tokenName, setTokenName] = useState<string>();
  const [tokenDecimals, setTokenDecimals] = useState<number>(18);

  const [updateAllowance, setUpdateAllowance] = useState(false);

  const sendContractWriteTx = async () => {
    if (!chain?.id) {
      notification.error("Please connect your wallet");
      return;
    }
    if (chain?.id !== targetNetwork.id) {
      notification.error("You on the wrong network");
      return;
    }

    if (deployedContract && tokenAddress) {
      const adjustedAmount = amount * 1.000001;

      try {
        setIsMining(true);
        // Use custom ABI that doesn't expect return value to support non-standard tokens like USDT
        await writeTx(() =>
          writeContract(wagmiConfig, {
            address: tokenAddress as `0x${string}`,
            abi: approveAbiNoReturn,
            functionName: "approve",
            args: [deployedContract.address, parseUnits(adjustedAmount.toString(), tokenDecimals)],
          }),
        );
        setUpdateAllowance(true);
      } catch (e: any) {
        const message = getParsedError(e);
        notification.error(message);
      } finally {
        setIsMining(false);
      }
    } else {
      notification.error("Contract writer error. Try again.");
      return;
    }
  };

  useEffect(() => {
    (async () => {
      if (tokenAddress && tokenAddress != "" && address && deployedContract && !isTransferLoading) {
        setAllowance(undefined);
        setIsLoading(true);
        try {
          // Fetch decimals first to ensure we format correctly
          const decimals = await readContract(wagmiConfig, {
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "decimals",
          });

          const data = await readContract(wagmiConfig, {
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "allowance",
            args: [address, deployedContract.address],
          });
          setAllowance(parseFloat(formatUnits(data, decimals)));
        } catch (error) {
          setAllowance(undefined);
        }
      }
      if (updateAllowance) setUpdateAllowance(false);
      setIsLoading(false);
    })();
  }, [tokenAddress, address, deployedContract, isMining, updateAllowance, isTransferLoading]);

  useEffect(() => {
    (async () => {
      if (tokenAddress && tokenAddress != "" && address && !isTransferLoading) {
        setIsLoading(true);
        setBalance(undefined);
        setTokenDecimals(18);

        try {
          const decimals = await readContract(wagmiConfig, {
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "decimals",
          });
          setTokenDecimals(decimals);

          const balance = await readContract(wagmiConfig, {
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [address],
          });
          setBalance(parseFloat(formatUnits(balance, decimals)));
        } catch (error) {
          setBalance(undefined);
          setTokenDecimals(18);
        }
      }
    })();
    setIsLoading(false);
  }, [tokenAddress, address, deployedContract, isMining, isTransferLoading]);

  useEffect(() => {
    (async () => {
      if (tokenAddress && tokenAddress != "" && address && !isTransferLoading) {
        setTokenSymbol("");
        setTokenName("");
        setIsLoading(true);
        try {
          const symbol = await readContract(wagmiConfig, {
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "symbol",
          });
          setTokenSymbol(symbol);

          const name = await readContract(wagmiConfig, {
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "name",
          });
          setTokenName(name);
        } catch (error) {
          setTokenSymbol("");
          setTokenName("");
        }
      }
      setIsLoading(false);
    })();
  }, [tokenAddress, address, deployedContract, isMining, isTransferLoading]);

  return {
    isMining,
    writeAsync: sendContractWriteTx,
    allowance: allowance,
    balance: balance,
    tokenSymbol: tokenSymbol,
    tokenName: tokenName,
    tokenDecimals: tokenDecimals,
    isLoading,
  };
};
