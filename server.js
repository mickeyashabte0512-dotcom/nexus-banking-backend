const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();

// Enable Global CORS to allow your Vercel Frontend to talk to this serverless backend
app.use(cors());
app.use(express.json());

// In-Memory Database Simulation Arrays
let userAccountsDb = [
    { id: "VLT-INT-USD-01", title: "Corporate Checking Reserve", balanceUSD: 25000.00, code: "US Clearing Hub" },
    { id: "VLT-INT-SAV-02", title: "Offshore Strategic Yield", balanceUSD: 89650.00, code: "Zurich Escrow Secure" }
];

let clearingAuditRegistryRecords = [
    { id: 1, vaultId: "VLT-INT-USD-01", actionMessage: "Inbound Pipeline Operational Treasury Faucet Mint", cashVolumeUSD: 10000.00, vectorType: "plus", timeStamp: "Jun 13, 2026" },
    { id: 2, vaultId: "VLT-INT-USD-01", actionMessage: "Cross-Border Settlement Routing -> [IBAN-EU-99201]", cashVolumeUSD: 1500.00, vectorType: "minus", timeStamp: "Jun 11, 2026" }
];

let GLOBAL_MARKET_EXCHANGE_REGISTRY = {
    USD: { name: "United States Dollar", symbol: "$", rate: 1.00 },
    ETB: { name: "Ethiopian Birr", symbol: "ETB", rate: 121.40 },
    EUR: { name: "European Euro", symbol: "€", rate: 0.92 },
    CNY: { name: "Chinese Yuan Renminbi", symbol: "¥", rate: 7.25 },
    JPY: { name: "Japanese Yen", symbol: "¥", rate: 156.70 },
    KRW: { name: "South Korean Won", symbol: "₩", rate: 1374.50 },
    GBP: { name: "British Pound Sterling", symbol: "£", rate: 0.78 }
};

// Background sync function for live financial exchange feeds
async function syncRealWorldExchangeRates() {
    try {
        const response = await fetch("https://open.er-api.com/v6/latest/USD");
        const data = await response.json();
        if (data && data.rates) {
            const freshRates = data.rates;
            if (freshRates.ETB) GLOBAL_MARKET_EXCHANGE_REGISTRY.ETB.rate = freshRates.ETB;
            if (freshRates.EUR) GLOBAL_MARKET_EXCHANGE_REGISTRY.EUR.rate = freshRates.EUR;
            if (freshRates.CNY) GLOBAL_MARKET_EXCHANGE_REGISTRY.CNY.rate = freshRates.CNY;
            if (freshRates.JPY) GLOBAL_MARKET_EXCHANGE_REGISTRY.JPY.rate = freshRates.JPY;
            if (freshRates.KRW) GLOBAL_MARKET_EXCHANGE_REGISTRY.KRW.rate = freshRates.KRW;
            if (freshRates.GBP) GLOBAL_MARKET_EXCHANGE_REGISTRY.GBP.rate = freshRates.GBP;
            console.log("Rates synced successfully.");
        }
    } catch (error) {
        console.log("Using fallback baseline rate indices.", error);
    }
}

// ENDPOINT 0: Fixes the "Cannot GET /" root landing page error text layout
app.get('/', async (req, res) => {
    await syncRealWorldExchangeRates();
    res.status(200).send("<h1>Quantum Treasury Core Serverless Engine Running Successfully!</h1>");
});

// ENDPOINT 1: Fetch active currency matrix configurations
app.get('/api/rates', async (req, res) => {
    await syncRealWorldExchangeRates();
    res.status(200).json({ success: true, rates: GLOBAL_MARKET_EXCHANGE_REGISTRY });
});

// ENDPOINT 2: Fetch active user vault accounts arrays
app.get('/api/vaults', (req, res) => {
    res.status(200).json(userAccountsDb);
});

// ENDPOINT 3: Fetch historical audit logs filtering down by card vault ID
app.get('/api/logs/:vaultId', (req, res) => {
    const targetVaultId = req.params.vaultId;
    const filteredRecords = clearingAuditRegistryRecords.filter(row => row.vaultId === targetVaultId);
    res.status(200).json(filteredRecords);
});

// ENDPOINT 4: Process cross-border routing wire transfers
app.post('/api/wire-transfer', (req, res) => {
    const { vaultId, targetCurrency, recipient, amountUSD } = req.body;
    const activeVault = userAccountsDb.find(v => v.id === vaultId);
    
    if (!activeVault) return res.status(404).json({ success: false, error: "Vault not found." });
    
    const parsingAmount = parseFloat(amountUSD);
    if (isNaN(parsingAmount) || parsingAmount <= 0) return res.status(400).json({ success: false, error: "Invalid amount." });
    if (parsingAmount > activeVault.balanceUSD) return res.status(400).json({ success: false, error: "Insufficient clearing capital." });

    activeVault.balanceUSD -= parsingAmount;
    const chosenCurrencyNode = GLOBAL_MARKET_EXCHANGE_REGISTRY[targetCurrency] || GLOBAL_MARKET_EXCHANGE_REGISTRY.USD;
    const foreignPayoutVolume = parsingAmount * chosenCurrencyNode.rate;

    const recordEntry = {
        id: Date.now(),
        vaultId: vaultId,
        actionMessage: `International Wire -> [${recipient}] Payout: ${foreignPayoutVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${targetCurrency}`,
        cashVolumeUSD: parsingAmount,
        vectorType: "minus",
        timeStamp: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    };

    clearingAuditRegistryRecords.unshift(recordEntry);
    res.status(200).json({ success: true, message: "Cross-border asset transmission executed.", updatedBalance: activeVault.balanceUSD, log: recordEntry });
});

// ENDPOINT 5: Faucet Mint Sandbox Injection Utility route
app.post('/api/utility/mint', (req, res) => {
    const { vaultId } = req.body;
    const activeVault = userAccountsDb.find(v => v.id === vaultId);
    if (!activeVault) return res.status(404).json({ success: false, error: "Vault not found" });

    activeVault.balanceUSD += 50000.00;
    const recordEntry = {
        id: Date.now(),
        vaultId: vaultId,
        actionMessage: "Local Testing Environment Allocation Capital Pipeline Mint Faucet",
        cashVolumeUSD: 50000.00,
        vectorType: "plus",
        timeStamp: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    };
    clearingAuditRegistryRecords.unshift(recordEntry);
    res.status(200).json({ success: true, updatedBalance: activeVault.balanceUSD, log: recordEntry });
});

// Export the app for Vercel Serverless environment execution handling layers
module.exports = app;
