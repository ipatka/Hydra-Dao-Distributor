"use client";

import Holders from "./_components/holder";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useDeployedContractInfo} from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const { data: HydraToken } = useDeployedContractInfo("HYDRA");

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Hydra Dao Token Distributor</span>
          </h1>
          <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address address={connectedAddress} />
            <p className="my-2 font-medium">Hydra Token Address:</p>
            <Address address={HydraToken?.address} />
          </div>
        </div>

        <Holders />
      </div>
    </>
  );
};

export default Home;
