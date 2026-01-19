import Image from "next/image";
import { SongParticipation } from "~~/services/portfolio/portfolioService";

interface SongDetailModalProps {
  participation: SongParticipation | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SongDetailModal = ({ participation, isOpen, onClose }: SongDetailModalProps) => {
  if (!isOpen || !participation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-[#1a2f2f] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="md:w-2/5 bg-gradient-to-br from-[#2d4d4d] via-[#3d5555] to-[#d4c5a0] p-8 flex items-center justify-center">
            <div className="relative w-full aspect-square max-w-xs">
              <Image
                src={participation.imageUrl}
                alt={participation.songTitle}
                fill
                className="rounded-lg object-cover"
              />
            </div>
          </div>

          {/* Content Section */}
          <div className="md:w-3/5 p-8 bg-[#1a2f2f]">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-[#2d4444] transition-colors"
            >
              ✕
            </button>

            {/* Title */}
            <h2 className="text-3xl font-bold text-white mb-1">{participation.songTitle}</h2>
            <p className="text-lg text-gray-400 mb-6">{participation.artist}</p>

            {/* Purchase Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <div className="text-sm text-gray-400">Fecha de compra</div>
                <div className="text-base font-medium text-white">{participation.purchaseDate}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Tokens invertidos</div>
                <div className="text-base font-medium text-white">
                  {participation.tokensInvested.toFixed(2)} {participation.investedToken}
                </div>
              </div>
            </div>

            {/* Participation */}
            <div className="mb-6">
              <div className="text-sm text-gray-400">Mi participación</div>
              <div className="text-2xl font-bold text-[#5eead4]">{participation.participationPercent}%</div>
            </div>

            {/* Royalty History */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-white">Historial de Regalías</h3>
                <button className="text-sm text-[#5eead4] hover:underline">Ver todo</button>
              </div>
              <div className="space-y-2">
                {participation.royaltyHistory.slice(0, 3).map(payment => (
                  <div key={payment.id} className="flex justify-between items-center py-2 border-b border-[#2d4444]">
                    <span className="text-sm text-gray-400">
                      Pago #{payment.paymentNumber} - {payment.date}
                    </span>
                    <span className="font-medium text-white">
                      {payment.amount.toFixed(2)} {payment.token}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ROI Section */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <div className="text-sm text-gray-400">ROI Histórico</div>
                <div
                  className={`text-xl font-bold ${participation.historicalROI >= 0 ? "text-[#4ade80]" : "text-[#f87171]"}`}
                >
                  {participation.historicalROI >= 0 ? "+" : ""}
                  {participation.historicalROI}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Proyección 12m</div>
                <div className="text-xl font-bold text-white">~ +{participation.projectedROI12m}%</div>
              </div>
            </div>

            {/* Blockchain Link */}
            <div className="mb-6">
              <a href="#" className="text-sm text-[#5eead4] hover:underline inline-flex items-center gap-1">
                Ver contrato en Blockchain
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button className="flex-1 px-6 py-3 rounded-lg bg-[#5eead4] text-[#0a1f1f] font-medium hover:bg-[#4dd4c0] transition-colors">
                Vender participación
              </button>
              <button className="flex-1 px-6 py-3 rounded-lg border-2 border-white text-white font-medium hover:bg-white/10 transition-colors">
                Retirar regalías
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
