// =====================================================================
// Mortgage dApp frontend configuration
// =====================================================================

const ACTIVE_NETWORK = "sepolia";

const CONTRACT_ADDRESS =
  "0xd5acEdC1241b6f0001310d4c25Ad56d9513e1A0c";

const BACKEND_URL = "http://localhost:5000";

// Mortgage.sol ABI
const CONTRACT_ABI = [
  "function nextLoanId() view returns (uint256)",

  "function calculateEMI(uint256 _principal, uint256 _interestRate, uint256 _tenureMonths) pure returns (uint256)",

  "function createLoan(uint256 _principal, uint256 _interestRate, uint256 _tenureMonths)",

  "function makePayment(uint256 _loanId)",

  "function checkLateStatus(uint256 _loanId)",

  "function loans(uint256) view returns (address borrower, uint256 principal, uint256 interestRate, uint256 tenureMonths, uint256 emi, uint256 outstandingBalance, uint256 nextPaymentDue, uint256 paymentsMade, bool active, bool late)",

  "event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 principal)",

  "event PaymentMade(uint256 loanId, uint256 payment, uint256 interest, uint256 principalPaid, uint256 remainingBalance)"
];

const NETWORKS = {
  sepolia: {
    name: "Ethereum Sepolia",
    chainId: 11155111,
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
    explorer: "https://sepolia.etherscan.io",
    currency: "ETH",
  },

  baseSepolia: {
    name: "Base Sepolia",
    chainId: 84532,
    rpcUrl: "https://base-sepolia-rpc.publicnode.com",
    explorer: "https://sepolia.basescan.org",
    currency: "ETH",
  },

  polygonAmoy: {
    name: "Polygon Amoy",
    chainId: 80002,
    rpcUrl: "https://polygon-amoy-bor-rpc.publicnode.com",
    explorer: "https://amoy.polygonscan.com",
    currency: "POL",
  },

  arbitrumSepolia: {
    name: "Arbitrum Sepolia",
    chainId: 421614,
    rpcUrl: "https://sepolia.arbiscan.io",
    explorer: "https://sepolia.arbiscan.io",
    currency: "ETH",
  },

  optimismSepolia: {
    name: "OP Sepolia",
    chainId: 11155420,
    rpcUrl: "https://optimism-sepolia.etherscan.io",
    explorer: "https://sepolia-optimism.etherscan.io",
    currency: "ETH",
  },
};