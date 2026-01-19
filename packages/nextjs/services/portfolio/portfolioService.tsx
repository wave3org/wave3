export interface RoyaltyPayment {
  id: string;
  paymentNumber: number;
  date: string;
  amount: number;
  token: string;
}

export interface SongParticipation {
  id: string;
  songTitle: string;
  artist: string;
  participationPercent: number;
  profitability: number;
  purchaseDate: string;
  tokensInvested: number;
  investedToken: string;
  royaltyHistory: RoyaltyPayment[];
  historicalROI: number;
  projectedROI12m: number;
  imageUrl: string;
}

export interface PortfolioStats {
  totalValue: number;
  totalValueToken: string;
  totalValueChange: number;
  accumulatedYield: number;
  songsInvested: number;
  royaltiesCollected: number;
  royaltiesToken: string;
  availableBalance: number;
  availableBalanceToken: string;
}

const MOCK_ROYALTY_PAYMENTS: RoyaltyPayment[] = [
  {
    id: "r1",
    paymentNumber: 3,
    date: "Mayo 2024",
    amount: 15.4,
    token: "W3T",
  },
  {
    id: "r2",
    paymentNumber: 2,
    date: "Abril 2024",
    amount: 12.1,
    token: "W3T",
  },
  {
    id: "r3",
    paymentNumber: 1,
    date: "Marzo 2024",
    amount: 8.3,
    token: "W3T",
  },
];

const MOCK_SONG_PARTICIPATIONS: SongParticipation[] = [
  {
    id: "sp1",
    songTitle: "Starlight Echoes",
    artist: "Nova Bloom",
    participationPercent: 2.5124,
    profitability: 15.2,
    purchaseDate: "15/03/2024",
    tokensInvested: 125.0,
    investedToken: "W3T",
    royaltyHistory: MOCK_ROYALTY_PAYMENTS,
    historicalROI: 15.2,
    projectedROI12m: 25.8,
    imageUrl: "https://cdn.bensound.com/image/cover/diffiebosman-winterbeams.jpg",
  },
  {
    id: "sp2",
    songTitle: "Midnight Drive",
    artist: "Leo Grand",
    participationPercent: 1.0,
    profitability: 8.0,
    purchaseDate: "20/04/2024",
    tokensInvested: 80.0,
    investedToken: "W3T",
    royaltyHistory: [
      {
        id: "r4",
        paymentNumber: 2,
        date: "Junio 2024",
        amount: 8.5,
        token: "W3T",
      },
      {
        id: "r5",
        paymentNumber: 1,
        date: "Mayo 2024",
        amount: 6.2,
        token: "W3T",
      },
    ],
    historicalROI: 8.0,
    projectedROI12m: 18.5,
    imageUrl: "https://cdn.bensound.com/image/cover/eugenschott-glitchtones.jpg",
  },
  {
    id: "sp3",
    songTitle: "Cyber Dreams",
    artist: "Synthwave Kid",
    participationPercent: 5.0,
    profitability: 21.5,
    purchaseDate: "10/02/2024",
    tokensInvested: 200.0,
    investedToken: "W3T",
    royaltyHistory: [
      {
        id: "r6",
        paymentNumber: 4,
        date: "Junio 2024",
        amount: 22.3,
        token: "W3T",
      },
      {
        id: "r7",
        paymentNumber: 3,
        date: "Mayo 2024",
        amount: 18.9,
        token: "W3T",
      },
      {
        id: "r8",
        paymentNumber: 2,
        date: "Abril 2024",
        amount: 15.4,
        token: "W3T",
      },
      {
        id: "r9",
        paymentNumber: 1,
        date: "Marzo 2024",
        amount: 12.1,
        token: "W3T",
      },
    ],
    historicalROI: 21.5,
    projectedROI12m: 32.4,
    imageUrl: "https://cdn.bensound.com/image/cover/diffiebosman-winterbeams.jpg",
  },
  {
    id: "sp4",
    songTitle: "Lost in the Sound",
    artist: "Aurelia",
    participationPercent: 0.5,
    profitability: -2.1,
    purchaseDate: "05/05/2024",
    tokensInvested: 50.0,
    investedToken: "W3T",
    royaltyHistory: [
      {
        id: "r10",
        paymentNumber: 1,
        date: "Junio 2024",
        amount: 3.2,
        token: "W3T",
      },
    ],
    historicalROI: -2.1,
    projectedROI12m: 5.2,
    imageUrl: "https://cdn.bensound.com/image/cover/eugenschott-glitchtones.jpg",
  },
];

const MOCK_PORTFOLIO_STATS: PortfolioStats = {
  totalValue: 1482.5,
  totalValueToken: "USDT",
  totalValueChange: 1.2,
  accumulatedYield: 12.5,
  songsInvested: 28,
  royaltiesCollected: 256.78,
  royaltiesToken: "W3T",
  availableBalance: 512.9,
  availableBalanceToken: "W3T",
};

export const fetchPortfolioStats = (): PortfolioStats => {
  return MOCK_PORTFOLIO_STATS;
};

export const fetchSongParticipations = (): SongParticipation[] => {
  return MOCK_SONG_PARTICIPATIONS;
};

export const fetchSongParticipation = (id: string): SongParticipation | null => {
  return MOCK_SONG_PARTICIPATIONS.find(sp => sp.id === id) || null;
};
