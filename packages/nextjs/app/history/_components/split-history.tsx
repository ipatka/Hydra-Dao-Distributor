"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatUnits } from "viem";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import useSpliiterHistory from "~~/hooks/hydra/useSpliiterHistory";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { getDate } from "~~/utils/hydra/hydra";
import { getBlockExplorerTxLink } from "~~/utils/scaffold-eth";

const SplitHistory = () => {
  const { erc20SplitEvents } = useSpliiterHistory();
  const [activeIndex, setActiveIndex] = useState<number[]>([]);
  const { targetNetwork } = useTargetNetwork();

  console.log("erc20SplitEvents", erc20SplitEvents);

  const handleToggle = (index: number) => {
    const currentActive = [...activeIndex];

    if (currentActive.includes(index)) {
      const indexToRemove = currentActive.indexOf(index);
      currentActive.splice(indexToRemove, 1);
    } else {
      currentActive.push(index);
    }
    setActiveIndex(currentActive);
  };

  return (
    <div className="sm">
      {erc20SplitEvents?.map((event, index) => (
        <div key={index} className="flex flex-col my-1 hover:border-yellow-500 border sm">
          <div
            className="flex flex-wrap items-center py-2 justify-between cursor-pointer bg-base-300 px-4"
            onClick={() => handleToggle(index)}
          >
            <span className="w-[40%]">Split</span>
            <span className="w-[30%]">
              {event.args.amounts.reduce(
                (accumulator: number, currentNumber: bigint) =>
                  accumulator + Number(formatUnits(currentNumber, event.tokenDecimals)),
                0,
              ) +
                " " +
                event.tokenSymbol}
            </span>
            <span className="w-[30%] flex justify-center">{getDate(event.blockData?.timestamp)}</span>
          </div>
          <div
            className={`
              overflow-hidden transition-all duration-300 ease-in-out
              ${activeIndex.includes(index) ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}
            `}
          >
            <div className="px-4 py-6 grid md:grid-cols-4 gap-4 text-xs grid-cols-2">
              <div>
                <span>recipients (address[]):</span>
              </div>
              <div className="flex flex-col">
                [
                {event.args.recipients.map((address: string) => (
                  <Address key={address} address={address} hideBlockie={true} size="xs" />
                ))}
                ]
              </div>
              <span>amounts (uint256[]):</span>
              <div className="flex flex-col sm">
                [
                {event.args.amounts.map((amount: string, index: number) => (
                  <span key={index}>{Number(amount)}</span>
                ))}
                ]
              </div>
              <span className="py-1">token (address):</span>
              <div>
                <Address address={event.args.token} hideBlockie={true} size="xs" />
              </div>
              {event.transactionHash && (
                <div className="flex gap-2 items-center py-1">
                  <span>Transaction Link</span>
                  <span className="">
                    <Link href={getBlockExplorerTxLink(targetNetwork.id, event.transactionHash)} target="_blank">
                      <ArrowTopRightOnSquareIcon className="text-xs w-4 cursor-pointer" aria-hidden="true" />
                    </Link>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SplitHistory;
