"use client";

import SplitHistory from "./_components/split-history";
import { useAccount } from "wagmi";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import useSpliiterHistory from "~~/hooks/hydra/useSpliiterHistory";

const History = () => {
  const { loading, noTokenSplits } = useSpliiterHistory();
  const { isConnected } = useAccount();
  return (
    <div className="max-w-5xl mx-auto w-full">
      <h1 className="font-bold font-typo-round tracking-wide my-2 mt-8 border-b py-2">HISTORY</h1>
      {loading &&
        isConnected &&
        Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="animate-pulse flex justify-between py-4">
            <div className="rounded-md bg-slate-300 h-6 w-full"></div>
          </div>
        ))}
      {!loading && isConnected && (
        <div>
          {!noTokenSplits && (
            <div>
              <SplitHistory />
            </div>
          )}
        </div>
      )}
      {noTokenSplits && !loading && (
        <div className="flex justify-center gap-1 mt-5">
          <InformationCircleIcon className="text-sm w-5 cursor-pointer" aria-hidden="true" /> No History
        </div>
      )}
    </div>
  );
};

export default History;
