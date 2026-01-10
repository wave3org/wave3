"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { config } from "~~/utils/config";

const Home: NextPage = () => {
  const [ipfsCid, setIpfsCid] = useState<string>("");
  const [ipfsContent, setIpfsContent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Read current counter value
  const { data: counterValue, refetch: refetchCounter } = useScaffoldReadContract({
    contractName: "Counter",
    functionName: "getCount",
  });

  // Write contract - increment
  const { writeContractAsync: increment } = useScaffoldWriteContract("Counter");

  const handleIncrement = async () => {
    try {
      await increment({
        functionName: "increment",
      });
      // Refetch counter value after increment
      setTimeout(() => refetchCounter(), 1000);
    } catch (e) {
      console.error("Error incrementing counter:", e);
    }
  };

  const handleGetCounterFromML = async () => {
    setLoading(true);
    setError("");
    setIpfsCid("");
    setIpfsContent(null);

    try {
      // Call ML service GET /counter
      const response = await fetch(`${config.mlUrl}/counter`);
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      const cid = data.cid || data.CID || data.ipfs_cid || data.ipfs_hash;

      if (!cid) {
        throw new Error("No CID found in response");
      }

      setIpfsCid(cid);

      // Download content from IPFS
      // You can use a public gateway like ipfs.io
      const ipfsResponse = await fetch(`https://ipfs.io/ipfs/${cid}`);
      if (!ipfsResponse.ok) {
        throw new Error(`Error downloading from IPFS: ${ipfsResponse.statusText}`);
      }

      const ipfsData = await ipfsResponse.json();
      setIpfsContent(ipfsData);
    } catch (e: any) {
      setError(e.message || "Error fetching data");
      console.error("Error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5 w-full max-w-4xl">
          <h1 className="text-center mb-4">
            <span className="block text-4xl font-bold">Counter DApp</span>
          </h1>

          {/* Environment Info */}
          <div className="bg-base-200 rounded-lg p-4 mb-8 text-sm">
            <p className="font-semibold mb-2">🌐 Servicios activos:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <span className="font-mono text-xs">ML Service:</span>
                <br />
                <span className="text-xs opacity-70">{config.mlUrl}</span>
              </div>
              <div>
                <span className="font-mono text-xs">Storage:</span>
                <br />
                <span className="text-xs opacity-70">{config.storageUrl}</span>
              </div>
              <div>
                <span className="font-mono text-xs">Ponder:</span>
                <br />
                <span className="text-xs opacity-70">{config.ponderUrl}</span>
              </div>
            </div>
          </div>

          {/* Counter Section */}
          <div className="bg-base-100 rounded-3xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-center mb-4">Smart Contract Counter</h2>
            <p className="text-center text-sm opacity-70 mb-6">
              Interactúa con un smart contract en la blockchain. El contador se incrementa on-chain y el valor se lee
              directamente del contrato.
            </p>

            <div className="text-center mb-6">
              <p className="text-lg mb-2">Current Value:</p>
              <div className="text-6xl font-bold text-primary">
                {counterValue !== undefined ? counterValue.toString() : "..."}
              </div>
            </div>

            <div className="flex justify-center">
              <button className="btn btn-primary btn-lg" onClick={handleIncrement}>
                Increment Counter
              </button>
            </div>
          </div>

          {/* IPFS Section */}
          <div className="bg-base-100 rounded-3xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-center mb-4">IPFS Storage</h2>
            <p className="text-center text-sm opacity-70 mb-6">
              Este botón consulta el servicio ML que lee eventos indexados de Ponder, procesa los datos y los guarda en
              IPFS mediante el servicio Storage. Luego descarga y muestra el contenido desde IPFS.
            </p>

            <div className="bg-base-200 rounded-lg p-4 mb-6 text-xs">
              <p className="font-semibold mb-2">Flujo de datos:</p>
              <ol className="list-decimal list-inside space-y-1 opacity-70">
                <li>Frontend → ML Service: GET /counter</li>
                <li>ML Service → Ponder GraphQL: obtiene últimos eventos del contador</li>
                <li>ML Service → Storage Service: sube JSON a IPFS</li>
                <li>Storage Service → IPFS: guarda archivo y retorna CID</li>
                <li>Frontend → IPFS Gateway: descarga contenido usando el CID</li>
              </ol>
            </div>

            <div className="flex justify-center mb-6">
              <button className="btn btn-secondary btn-lg" onClick={handleGetCounterFromML} disabled={loading}>
                {loading ? "Loading..." : "Get Counter from ML/IPFS"}
              </button>
            </div>

            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            {ipfsCid && (
              <div className="mb-4">
                <p className="font-semibold mb-2">IPFS CID:</p>
                <code className="block bg-base-300 p-3 rounded break-all">{ipfsCid}</code>
              </div>
            )}

            {ipfsContent && (
              <div>
                <p className="font-semibold mb-2">IPFS Content:</p>
                <pre className="bg-base-300 p-4 rounded overflow-auto max-h-96">
                  {JSON.stringify(ipfsContent, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
