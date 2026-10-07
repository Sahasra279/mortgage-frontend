// ============================================================
// Mortgage dApp Frontend
// ============================================================

let provider = null;
let signer = null;
let readContract = null;
let writeContract = null;
let currentAccount = null;


// ============================================================
// Helper
// ============================================================

function $(id) {
    return document.getElementById(id);
}


// ============================================================
// Get active network configuration
// ============================================================

function getNetworkConfig() {
    return NETWORKS[ACTIVE_NETWORK];
}


// ============================================================
// Initialize read provider
// ============================================================

function initializeReadProvider() {

    const network =
        getNetworkConfig();

    if (!network) {
        console.error(
            "Network configuration not found."
        );
        return;
    }

    provider =
        new ethers.JsonRpcProvider(
            network.rpcUrl
        );

    readContract =
        new ethers.Contract(
            CONTRACT_ADDRESS,
            CONTRACT_ABI,
            provider
        );
}


// ============================================================
// Friendly error messages
// ============================================================

function friendlyError(error) {

    console.error(error);

    if (!error) {
        return "Something went wrong.";
    }

    if (
        error.code === "ACTION_REJECTED" ||
        error.code === 4001
    ) {
        return "Transaction was rejected in MetaMask.";
    }

    if (
        error.message &&
        error.message.includes(
            "Only borrower can pay"
        )
    ) {
        return "Only the borrower wallet can make this payment.";
    }

    if (
        error.message &&
        error.message.includes(
            "Loan is not active"
        )
    ) {
        return "This loan is no longer active.";
    }

    return (
        error.shortMessage ||
        error.reason ||
        error.message ||
        "Transaction failed."
    );
}


// ============================================================
// Connect Wallet
// ============================================================

async function connectWallet() {

    const status =
        $("wallet-status");

    try {

        if (
            typeof window.ethereum ===
            "undefined"
        ) {

            if (status) {
                status.textContent =
                    "MetaMask is not installed.";
            }

            return;
        }

        provider =
            new ethers.BrowserProvider(
                window.ethereum
            );

        await provider.send(
            "eth_requestAccounts",
            []
        );

        signer =
            await provider.getSigner();

        signer =
    await provider.getSigner();

currentAccount =
    await signer.getAddress();

const walletAddress = $("wallet-address");

if (walletAddress) {
    walletAddress.textContent = currentAccount;
}

const balance = await provider.getBalance(currentAccount);

const balanceElement = $("wallet-balance");

if (balanceElement) {
    balanceElement.textContent =
        ethers.formatEther(balance) + " ETH";
}


        writeContract =
            new ethers.Contract(
                CONTRACT_ADDRESS,
                CONTRACT_ABI,
                signer
            );

        readContract =
            new ethers.Contract(
                CONTRACT_ADDRESS,
                CONTRACT_ABI,
                provider
            );

        if (status) {
            status.textContent =
                "Wallet connected: " +
                currentAccount;
        }

        await loadMyLoans();
        await loadPaymentHistory();

    } catch (error) {

        console.error(error);

        if (status) {
            status.textContent =
                friendlyError(error);
        }
    }
}


// ============================================================
// Calculate EMI
// ============================================================

async function calculateEMI() {

    const principal =
        $("principal");

    const interest =
        $("interest-rate");

    const months =
        $("tenure");

    const result =
        $("emi-result");

    if (
        !principal ||
        !interest ||
        !months
    ) {
        return;
    }

    try {

        if (!readContract) {
            initializeReadProvider();
        }

        const emi =
            await readContract.calculateEMI(
                principal.value,
                interest.value,
                months.value
            );

        if (result) {
            result.textContent =
                "Estimated EMI: " +
                emi.toString();
        }

    } catch (error) {

        console.error(error);

        if (result) {
            result.textContent =
                friendlyError(error);
        }
    }
}

// ============================================================
// Create Loan
// ============================================================

async function createLoan() {

    const status =
        $("loan-status");

    if (!writeContract) {

        if (status) {
            status.textContent =
                "Connect MetaMask first.";
        }

        return;
    }

    try {

        const principal =
            $("principal").value;

        const interest =
            $("interest-rate").value;

        const months =
            $("tenure").value;

        if (status) {
            status.textContent =
                "Creating loan...";
        }

        const transaction =
            await writeContract.createLoan(
                principal,
                interest,
                months
            );

        if (status) {
            status.textContent =
                "Transaction sent. Waiting for confirmation...";
        }

        const receipt =
            await transaction.wait();

        const network =
            getNetworkConfig();

        if (status) {
            status.innerHTML =
                "Loan created successfully!<br>" +
                "Transaction: " +
                `<a href="${network.explorer}/tx/${receipt.hash}" target="_blank">${receipt.hash.slice(0, 10)}...</a>`;
        }

        await loadMyLoans();

    } catch (error) {

        console.error(error);

        if (status) {
            status.textContent =
                friendlyError(error);
        }
    }
}


// ============================================================
// Load One Loan
// ============================================================

async function loadLoan(loanId) {

    try {

        if (!readContract) {
            initializeReadProvider();
        }

        const loan =
            await readContract.loans(
                loanId
            );

        return {
            id: loanId,
            borrower: loan.borrower,
            principal:
                loan.principal.toString(),
            interestRate:
                loan.interestRate.toString(),
            tenureMonths:
                loan.tenureMonths.toString(),
            emi:
                loan.emi.toString(),
            outstandingBalance:
                loan.outstandingBalance.toString(),
            nextPaymentDue:
                loan.nextPaymentDue.toString(),
            paymentsMade:
                loan.paymentsMade.toString(),
            active:
                loan.active,
            late:
                loan.late
        };

    } catch (error) {

        console.error(error);

        return null;
    }
}


// ============================================================
// Render Loan
// ============================================================

function renderLoan(loan) {

    const list =
        $("loans");

    if (!list) {
        return;
    }

    const item =
        document.createElement("div");

    item.className =
        "loan-card";

    item.innerHTML =
        `<h3>Loan #${loan.id}</h3>` +
        `<p>Principal: ${loan.principal}</p>` +
        `<p>Interest Rate: ${loan.interestRate}%</p>` +
        `<p>Duration: ${loan.tenureMonths} months</p>` +
        `<p>EMI: ${loan.emi}</p>` +
        `<p>Outstanding Balance: ${loan.outstandingBalance}</p>` +
        `<p>Payments Made: ${loan.paymentsMade}</p>` +
        `<p>Status: ${loan.active ? "Active" : "Inactive"}</p>` +
        `<p>Late: ${loan.late ? "Yes" : "No"}</p>` +
        `<button onclick="makePayment(${loan.id})">Make Payment</button>`;

    list.appendChild(item);
}


// ============================================================
// Load My Loans
// ============================================================

async function loadMyLoans() {

    const list =
        $("loans");

    if (!list) {
        return;
    }

    list.textContent =
        "Loading your loans...";

    try {

        if (!readContract) {
            initializeReadProvider();
        }

        if (!currentAccount) {

            list.textContent =
                "Connect MetaMask to view your loans.";

            return;
        }

        const nextLoanId =
            await readContract.nextLoanId();

        const count =
            Number(nextLoanId);

        if (count === 0) {

            list.textContent =
                "No loans have been created yet.";

            return;
        }

        list.innerHTML = "";

        let found = false;

        for (
            let i = 0;
            i < count;
            i++
        ) {

            const loan =
                await loadLoan(i);

            if (!loan) {
                continue;
            }

            if (
                loan.borrower.toLowerCase() !==
                currentAccount.toLowerCase()
            ) {
                continue;
            }

            found = true;

            renderLoan(loan);
        }

        if (!found) {

            list.textContent =
                "No loans found for this wallet.";
        }

    } catch (error) {

        console.error(error);

        list.textContent =
            friendlyError(error);
    }
}


// ============================================================
// Make Payment
// ============================================================

async function makePayment(loanId) {

    const status =
        $("payment-status");

    if (!writeContract) {

        if (status) {
            status.textContent =
                "Connect MetaMask first.";
        }

        return;
    }

    try {

        if (status) {
            status.textContent =
                "Preparing EMI payment...";
        }

        const transaction =
            await writeContract.makePayment(
                loanId
            );

        if (status) {
            status.textContent =
                "Payment sent. Waiting for confirmation...";
        }

        const receipt =
            await transaction.wait();

        const network =
            getNetworkConfig();

        if (status) {
            status.innerHTML =
                "EMI payment successful!<br>" +
                "Transaction: " +
                `<a href="${network.explorer}/tx/${receipt.hash}" target="_blank">${receipt.hash.slice(0, 10)}...</a>`;
        }

        await loadMyLoans();
        await loadPaymentHistory();

    } catch (error) {

        console.error(error);

        if (status) {
            status.textContent =
                friendlyError(error);
        }
    }
}


// ============================================================
// Payment History
// ============================================================

async function loadPaymentHistory() {

    const history =
        $("payment-history");

    if (!history) {
        return;
    }

    try {

        if (!currentAccount) {

            history.textContent =
                "Connect MetaMask to view payment history.";

            return;
        }

        if (!provider) {
            initializeReadProvider();
        }

        const latest =
            await provider.getBlockNumber();

        const fromBlock =
            Math.max(
                0,
                latest - 9000
            );

        const payments =
            await readContract.queryFilter(
                readContract.filters.PaymentMade(),
                fromBlock,
                latest
            );

        if (payments.length === 0) {

            history.textContent =
                "No payment history found.";

            return;
        }

        history.innerHTML = "";

        let found = false;

        for (
            const payment of payments
        ) {

            const loanId =
                payment.args.loanId.toString();

            const loan =
                await loadLoan(
                    loanId
                );

            if (!loan) {
                continue;
            }

            if (
                loan.borrower.toLowerCase() !==
                currentAccount.toLowerCase()
            ) {
                continue;
            }

            found = true;

            const amount =
                payment.args.payment.toString();

            const interest =
                payment.args.interest.toString();

            const principal =
                payment.args.principalPaid.toString();

            const remaining =
                payment.args.remainingBalance.toString();

            const tx =
                payment.transactionHash;

            const item =
                document.createElement("div");

            item.className =
                "payment-history-item";

            item.innerHTML =
                `<p><strong>Loan #${loanId}</strong></p>` +
                `<p>Payment: ${amount}</p>` +
                `<p>Interest: ${interest}</p>` +
                `<p>Principal Paid: ${principal}</p>` +
                `<p>Remaining Balance: ${remaining}</p>` +
                `<p>Transaction: ` +
                `<a href="${getNetworkConfig().explorer}/tx/${tx}" target="_blank">` +
                `${tx.slice(0, 10)}...</a></p>`;

            history.appendChild(item);
        }

        if (!found) {

            history.textContent =
                "No payment history found for this wallet.";
        }

    } catch (error) {

        console.error(error);

        history.textContent =
            "Unable to load payment history.";
    }
}


// ============================================================
// Refresh Loans
// ============================================================

async function refreshLoans() {

    await loadMyLoans();
    await loadPaymentHistory();
}


// ============================================================
// Wallet Account Changed
// ============================================================

if (
    typeof window.ethereum !==
    "undefined"
) {

    window.ethereum.on(
        "accountsChanged",
        async function (accounts) {

            if (
                accounts.length === 0
            ) {

                currentAccount = null;
                signer = null;
                writeContract = null;

                await loadMyLoans();
                await loadPaymentHistory();

                return;
            }

            await connectWallet();
        }
    );


    window.ethereum.on(
        "chainChanged",
        function () {

            window.location.reload();
        }
    );
}


// ============================================================
// Page Initialization
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeReadProvider();

        const connectButton =
            $("connect-wallet");

        if (connectButton) {

            connectButton.addEventListener(
                "click",
                connectWallet
            );
        }

        const calculateButton =
            $("calculate-btn");

        if (calculateButton) {

            calculateButton.addEventListener(
                "click",
                calculateEMI
            );
        }

        const createButton =
            $("create-loan-btn");

        if (createButton) {

            createButton.addEventListener(
                "click",
                createLoan
            );
        }

        loadMyLoans();
        loadPaymentHistory();
    }
);