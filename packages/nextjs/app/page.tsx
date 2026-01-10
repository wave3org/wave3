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

  const [ponderData, setPonderData] = useState<any>(null);
  const [ponderLoading, setPonderLoading] = useState(false);

  const [storageResult, setStorageResult] = useState<any>(null);
  const [storageLoading, setStorageLoading] = useState(false);

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

  const handlePonderQuery = async () => {
    setPonderLoading(true);
    setPonderData(null);
    try {
      const query = `{
        counterEvents(orderBy: "timestamp", orderDirection: "desc", limit: 5) {
          items {
            id
            value
            timestamp
            blockNumber
          }
        }
      }`;

      const response = await fetch(`${config.ponderUrl}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) throw new Error("Ponder query failed");
      const data = await response.json();
      setPonderData(data);
    } catch (e: any) {
      setPonderData({ error: e.message });
    } finally {
      setPonderLoading(false);
    }
  };

  const handleStorageUpload = async () => {
    setStorageLoading(true);
    setStorageResult(null);
    try {
      const sampleData = {
        message: "Hello IPFS!",
        timestamp: new Date().toISOString(),
        value: Math.random(),
      };

      const jsonBlob = new Blob([JSON.stringify(sampleData, null, 2)], { type: "application/json" });
      const formData = new FormData();
      formData.append("file", jsonBlob, "sample.json");

      const response = await fetch(`${config.storageUrl}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setStorageResult(data);
    } catch (e: any) {
      setStorageResult({ error: e.message });
    } finally {
      setStorageLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5 w-full max-w-4xl">
          <h1 className="text-center mb-4">
            <span className="block text-4xl font-bold">Counter DApp</span>
          </h1>

          {/* Walking Skeleton Info */}
          <div className="alert bg-info/10 border-info/20 mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-info shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <div>
              <h3 className="font-bold">Walking Skeleton 🦴</h3>
              <div className="text-sm opacity-90">
                Esta es una implementación mínima de extremo a extremo para verificar que toda la arquitectura funciona
                correctamente. El objetivo es tocar cada servicio (Smart Contracts, Ponder, ML, Storage, IPFS) y
                confirmar la integración completa.
              </div>
            </div>
          </div>

          {/* Environment Info */}
          <div className="bg-base-200 rounded-lg p-4 mb-8">
            <p className="font-semibold mb-4">🌐 Servicios activos y endpoints:</p>

            {/* Ponder */}
            <div className="mb-4 pb-4 border-b border-base-300">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <span className="font-mono text-sm font-semibold">Ponder Indexer</span>
                  <p className="text-xs opacity-70 mt-1">
                    Indexa eventos de blockchain en tiempo real y los expone via GraphQL
                  </p>
                  <div className="text-xs mt-1">
                    <span className="opacity-60">{config.ponderUrl}</span>
                    <span className="ml-2 font-mono opacity-50">POST /graphql</span>
                  </div>
                </div>
                <button className="btn btn-xs btn-outline" onClick={handlePonderQuery} disabled={ponderLoading}>
                  {ponderLoading ? "..." : "Query"}
                </button>
              </div>
              {ponderData && (
                <pre className="bg-base-300 p-2 rounded text-xs overflow-auto max-h-32 mt-2">
                  {JSON.stringify(ponderData, null, 2)}
                </pre>
              )}
            </div>

            {/* Storage */}
            <div className="mb-4 pb-4 border-b border-base-300">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <span className="font-mono text-sm font-semibold">Storage Service</span>
                  <p className="text-xs opacity-70 mt-1">Gestiona archivos en IPFS (upload/pin)</p>
                  <div className="text-xs mt-1">
                    <span className="opacity-60">{config.storageUrl}</span>
                    <span className="ml-2 font-mono opacity-50">POST /upload</span>
                  </div>
                </div>
                <button className="btn btn-xs btn-outline" onClick={handleStorageUpload} disabled={storageLoading}>
                  {storageLoading ? "..." : "Upload JSON"}
                </button>
              </div>
              {storageResult && (
                <pre className="bg-base-300 p-2 rounded text-xs overflow-auto max-h-32 mt-2">
                  {JSON.stringify(storageResult, null, 2)}
                </pre>
              )}
            </div>

            {/* ML */}
            <div className="mb-4 pb-4 border-b border-base-300">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <span className="font-mono text-sm font-semibold">ML Service</span>
                  <p className="text-xs opacity-70 mt-1">Procesa datos indexados y los persiste en IPFS</p>
                  <div className="text-xs mt-1">
                    <span className="opacity-60">{config.mlUrl}</span>
                    <span className="ml-2 font-mono opacity-50">GET /counter</span>
                  </div>
                </div>
              </div>
              <p className="text-xs opacity-60 italic">
                Ver sección &quot;IPFS Storage&quot; abajo para probar este endpoint
              </p>
            </div>

            {/* IPFS */}
            <div>
              <span className="font-mono text-sm font-semibold">IPFS Gateways</span>
              <p className="text-xs opacity-70 mt-1">Acceso descentralizado a archivos mediante CID</p>
              <div className="text-xs mt-1 space-y-1">
                <div>
                  <span className="opacity-60">Local:</span>{" "}
                  <span className="font-mono opacity-50">http://localhost:8080/ipfs/&#123;cid&#125;</span>
                </div>
                <div>
                  <span className="opacity-60">Public:</span>{" "}
                  <span className="font-mono opacity-50">https://ipfs.io/ipfs/&#123;cid&#125;</span>
                </div>
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
