"use client";

import React, { useEffect, useRef, useState } from "react";
import { parseUnits, formatUnits } from "viem";
import { isAddress } from "viem";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";
import { useChainId } from "wagmi";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import { useApproveForDistribution } from "~~/hooks/hydra/useApproveForDistribution";
import useHydraHolders from "~~/hooks/hydra/useHydraHolders";
import { TokenHolder } from "~~/hooks/hydra/useHydraHolders";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import tokens from "~~/utils/hydra/constants/tokens";

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

const TokenData = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [distributionAmount, setDistributionAmount] = useState<string>();
  const chainId = useChainId();
  const preloadedTokens = tokens[chainId];
  const [tokenContract, setTokenContract] = useState<string>();
  const [recipients, setRecipients] = useState<string[]>();
  const [amounts, setAmounts] = useState<string[]>();
  const [amountsInWei, setAmountsInWei] = useState<bigint[]>();
  const [holdersData, setHoldersData] = useState<TokenHolder[]>();
  const [totatalHydraHeld, setTotalHydraHeld] = useState<bigint>();
  const [excludedHoldersData, setExcludedHoldersData] = useState<TokenHolder[]>([]);

  const [excludedAddresses, setExcludedAddresses] = useState<string[]>([]);
  const [excludedAddressesMessage, setExcludedAddressesMessage] = useState<string>("");

  const { tokenHolders, isLoadingHolders } = useHydraHolders();
  const { writeContractAsync: writeYourContractAsync, isMining } = useScaffoldWriteContract("TokenDistributor");

  const {
    allowance,
    writeAsync: approve,
    balance,
    tokenSymbol,
    tokenDecimals,
    isLoading: dataLoading,
  } = useApproveForDistribution({
    tokenAddress: tokenContract,
    amount: Number(distributionAmount),
    isTransferLoading: isMining,
  });

  const onDistribution = async () => {
    try {
      if (!recipients || !amountsInWei) return;
      
      // Sort recipients and amounts together to maintain the correct mapping
      const recipientsWithAmounts = recipients.map((address, index) => ({
        address,
        amount: amountsInWei[index]
      }));
      
      recipientsWithAmounts.sort((a, b) => 
        a.address.toLowerCase() < b.address.toLowerCase() ? -1 : 1
      );
      
      // Extract sorted arrays
      const sortedRecipients = recipientsWithAmounts.map(item => item.address);
      const sortedAmounts = recipientsWithAmounts.map(item => item.amount);
      
      // Sort excluded addresses
      const sortedExcludedAddresses = [...excludedAddresses].sort((a, b) => 
        a.toLowerCase() < b.toLowerCase() ? -1 : 1
      );
      
      await writeYourContractAsync({
        functionName: "splitERC20",
        args: [tokenContract, sortedRecipients, sortedAmounts, sortedExcludedAddresses, excludedAddressesMessage],
      });
    } catch (e) {
      console.error("Error distributing tokens:", e);
    }
  };

  const removeWalletField = async (index: number) => {
    if (!holdersData) return;
    const newHoldersData = [...holdersData];
    newHoldersData.splice(index, 1);

    const newExcludedHoldersData = [...(excludedHoldersData ?? []), holdersData[index]];
    setExcludedHoldersData(newExcludedHoldersData);

    setHoldersData(newHoldersData);
  };

  const addWalletField = (index: number) => {
    if (!excludedHoldersData || !holdersData) return;

    const holderToAdd = excludedHoldersData[index];

    const updatedHoldersData = [...holdersData, holderToAdd];
    updatedHoldersData.sort((a, b) => Number(b.balance) - Number(a.balance)); // Sort by balance
    setHoldersData(updatedHoldersData);

    const updatedExcludedHoldersData = [...excludedHoldersData];
    updatedExcludedHoldersData.splice(index, 1);
    setExcludedHoldersData(updatedExcludedHoldersData);
  };

  async function addMultipleAddress(value: string) {
    if (!holdersData) return;

    const cleanAddress = (str: string) => str.replace(/\n|\s/g, "").trim();
    const splitAddresses = (input: string) =>
      input.includes(",") ? input.split(",").map(cleanAddress) : input.split(/\s+/).map(cleanAddress);

    const inputAddresses = splitAddresses(value);

    const validAddresses: string[] = [];
    const invalidAddresses: string[] = [];

    for (const input of inputAddresses) {
      if (input.endsWith(".eth")) {
        try {
          const resolvedAddress = await publicClient.getEnsAddress({
            name: normalize(input),
          });
          if (resolvedAddress && holdersData.some(holder => holder.address === resolvedAddress)) {
            validAddresses.push(resolvedAddress);
          } else {
            invalidAddresses.push(input);
          }
        } catch (err) {
          console.error(`Failed to resolve ENS name: ${input}`, err);
          invalidAddresses.push(input);
        }
      } else if (isAddress(input) && holdersData.some(holder => holder.address === input)) {
        validAddresses.push(input);
      } else {
        invalidAddresses.push(input);
      }
    }

    if (validAddresses.length === 0) return;

    const newExcludedHolders = holdersData.filter(holder => validAddresses.includes(holder.address));
    setExcludedHoldersData([...(excludedHoldersData ?? []), ...newExcludedHolders]);

    const updatedHoldersData = holdersData.filter(holder => !validAddresses.includes(holder.address));
    setHoldersData(updatedHoldersData);

    if (invalidAddresses.length > 0) {
      console.warn("Invalid or already removed addresses:", invalidAddresses);
    }
  }

  const reset = () => {
    setHoldersData(tokenHolders);
    setExcludedHoldersData([]);
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    setHoldersData(tokenHolders);
  }, [tokenHolders, isLoadingHolders]);

  useEffect(() => {
    if (holdersData) {
      const recipients = holdersData.map(holder => holder.address);
      setRecipients(recipients);
      
      // Calculate total HYDRA held as BigInt
      const totalHydraHeldBigInt = holdersData.reduce((acc, holder) => {
        // Convert each balance to BigInt
        const holderBalanceBigInt = parseUnits(holder.balance.toString(), 18);
        return acc + holderBalanceBigInt;
      }, BigInt(0));
      
      setTotalHydraHeld(totalHydraHeldBigInt);
    }
  }, [holdersData]);

  useEffect(() => {
    if (excludedHoldersData) {
      const addresses = excludedHoldersData.map(holder => holder.address);
      setExcludedAddresses(addresses);
    }
  }, [excludedHoldersData]);

  useEffect(() => {
    if (distributionAmount && totatalHydraHeld && holdersData && tokenDecimals !== undefined) {
      try {
        // Convert distribution amount to BigInt with proper decimals
        const totalDistributionAmountBigInt = parseUnits(distributionAmount, tokenDecimals);
        
        // Calculate each holder's share with BigInt math
        const calculatedAmountsBigInt = holdersData.map(holder => {
          const holderBalanceBigInt = parseUnits(holder.balance.toString(), 18);
          
          // (holderBalance / totalHydraHeld) * totalDistributionAmount
          // To avoid precision loss, multiply first then divide
          return (holderBalanceBigInt * totalDistributionAmountBigInt) / totatalHydraHeld;
        });
        
        // The rest of the BigInt calculations remain the same
        const totalCalculatedBigInt = calculatedAmountsBigInt.reduce(
          (acc, amount) => acc + amount, 
          BigInt(0)
        );
        
        const adjustedAmountsBigInt = calculatedAmountsBigInt.map(amount => {
          if (totalCalculatedBigInt > totalDistributionAmountBigInt) {
            return (amount * totalDistributionAmountBigInt) / totalCalculatedBigInt;
          }
          return amount;
        });
        
        // Convert back to string representation for the UI
        const amountsInDecimal = adjustedAmountsBigInt.map(amount => 
          formatUnits(amount, tokenDecimals)
        );
        
        setAmounts(amountsInDecimal);
        setAmountsInWei(adjustedAmountsBigInt);
      } catch (error) {
        console.error("Error calculating distribution amounts:", error);
      }
    }
  }, [totatalHydraHeld, distributionAmount, holdersData, tokenDecimals]);

  return (
    <div className="mb-6 max-w-5xl mx-auto flex flex-col md:flex-row md:space-x-4 gap-4 text-xs ">
      <div className="w-full flex flex-col gap-2">
        <div className="rounded-3xl shadow-md border p-2 px-4 flex flex-col h-fit">
          <div className="flex flex-col space-y-1 w-full my-1">
            <p className="font-semibold ml-1 my-0 break-words text-sm">Enter Token Contract</p>
            <ul className="menu menu-horizontal activemenu py-2 gap-1">
              {preloadedTokens?.contracts?.map((token, index) => (
                <li key={index} onClick={() => setTokenContract(token.address)}>
                  <a className={tokenContract === token.address ? "active" : "bg-base-300"}>{token.name}</a>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-2 border-base-300 bg-base-200 rounded-full text-accent w-full">
              <input
                type="text"
                ref={inputRef}
                value={tokenContract as string}
                onChange={e => setTokenContract(e.target.value)}
                className="input input-sm input-ghost focus:outline-none focus:bg-transparent focus:text-gray-400 border w-full font-medium placeholder:text-accent text-gray-400 placeholder:text-xs"
                placeholder="Token contract"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1 w-full my-1">
            <div className="w-full px-4">
              {!!tokenSymbol && (
                <span className="flex">
                  Token: {tokenSymbol}
                  {dataLoading && (
                    <span className="animate-pulse">
                      <span className="h-4 w-10"></span>
                    </span>
                  )}
                </span>
              )}
              {!!balance && (
                <span className="flex">
                  Balance: {balance?.toFixed(4)}
                  {dataLoading && (
                    <span className="animate-pulse">
                      <span className="h-4 w-10"></span>
                    </span>
                  )}
                </span>
              )}
              {allowance != undefined && allowance >= 0 && (
                <span className="flex">
                  Allowance: {allowance}
                  {dataLoading && (
                    <span className="animate-pulse">
                      <span className="h-4 w-10"></span>
                    </span>
                  )}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between border border-base-300 bg-base-200 rounded-full text-accent w-full">
              <input
                type="number"
                value={distributionAmount as string}
                onChange={e => setDistributionAmount(e.target.value)}
                className="input input-sm input-ghost focus:outline-none focus:bg-transparent focus:text-gray-400 border font-medium placeholder:text-accent w-2/3 text-gray-400 pr-6 py-2 placeholder:text-xs"
                placeholder="Total amount to distribute"
              />
              <button
                type="button"
                disabled={!tokenContract || !distributionAmount}
                className="btn btn-sm btn-primary w-1/3 font-black"
                onClick={async () =>
                  Number(distributionAmount ?? 0) > Number(allowance ?? 0) ? await approve() : await onDistribution()
                }
              >
                {Number(distributionAmount ?? 0) > Number(allowance ?? 0) ? "Approve" : "Distribute"}
              </button>
            </div>
          </div>
        </div>
        <div className="w-full">
          <h1 className="px-2 text-sm font-semibold">Exclude addresses</h1>
          <textarea
            placeholder="Separate each address with a comma, space or new line; ENS Supported"
            onChange={e => addMultipleAddress(e.target.value)}
            className="textarea rounded-md textarea-ghost focus:bg-transparent focus:text-gray-400  min-h-[6rem] w-full font-medium placeholder:text-accent text-gray-400 border-2 border-secondary placeholder:text-xs"
          />
        </div>
        <div className="w-full">
          <h1 className="px-2 text-sm font-semibold">Reason</h1>
          <textarea
            placeholder="Reason for exclusion"
            onChange={e => setExcludedAddressesMessage(e.target.value)}
            className="textarea rounded-md textarea-ghost focus:bg-transparent focus:text-gray-400  min-h-[5rem] w-full font-medium placeholder:text-accent text-gray-400 border-2 border-secondary placeholder:text-xs"
          />
        </div>
        {excludedHoldersData?.length > 0 && (
          <div>
            <h1 className="px-2 text-sm font-semibold">Excluded addresses: {excludedHoldersData.length}</h1>
            <div className="max-h-[10.5rem] overflow-scroll">
              <table className="table w-full">
                <thead>
                  <tr className="flex justify-around">
                    <th></th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {excludedHoldersData.map((holder, index) => (
                    <tr key={index}>
                      <th>
                        <Address size="xs" address={holder.address} />
                      </th>
                      {index >= 0 && (
                        <th>
                          <button type="button" onClick={() => addWalletField(index)}>
                            <PlusIcon className="h-5" />
                          </button>
                        </th>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col h-[73vh] w-full">
        {holdersData && holdersData.length > 0 && (
          <div className="flex flex-col h-full gap-3">
            <div className="flex px-4 justify-between">
              <h2 className="font-semibold text-sm">Recipients: {holdersData.length}</h2>
              <button className="btn btn-primary btn-sm" onClick={() => reset()}>
                Reset
              </button>
            </div>
            <div className="overflow-y-auto flex-grow">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Address</th>
                    <th>Percentage</th>
                    {distributionAmount && <th>Amount</th>}
                    <th></th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {holdersData.map((holder, index) => (
                    <tr key={index}>
                      <th>
                        <Address size="xs" address={holder.address} />
                      </th>
                      <th>
                        {totatalHydraHeld 
                          ? (Number(formatUnits(parseUnits(holder.balance.toString(), 18) * BigInt(1000000) / totatalHydraHeld, 6)) * 100).toFixed(4)
                          : 0}%
                      </th>
                      {distributionAmount && (
                        <th>
                          {amounts && amounts[index] ? Number(amounts[index]).toFixed(4) : '0'}
                        </th>
                      )}
                      {index >= 0 && (
                        <th>
                          <button type="button" onClick={() => removeWalletField(index)}>
                            <TrashIcon className="h-5" />
                          </button>
                        </th>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenData;
