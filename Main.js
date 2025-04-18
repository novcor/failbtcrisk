async function assessRisk() {
  const address = document.getElementById("btcAddress").value.trim();
  const results = document.getElementById("results");
  const scoreDisplay = document.getElementById("score");
  const reasons = document.getElementById("reasons");

  if (!address) {
    alert("Please enter a Bitcoin address.");
    return;
  }

  const result = await analyzeAddress(address);
  scoreDisplay.textContent = `Risk Level: ${result.level}`;
  reasons.innerHTML = "";
  result.reasons.forEach(reason => {
    const li = document.createElement("li");
    li.textContent = reason;
    reasons.appendChild(li);
  });

  results.classList.remove("hidden");
}

async function analyzeAddress(address) {
  let score = 0;
  let reasons = [];

  // === Legacy address format
  if (address.startsWith("1")) {
    score += 2;
    reasons.push("Legacy P2PKH address format (more likely reused or exposed).");
  }

  // === Address format validation
  const base58Pattern = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  if (!base58Pattern.test(address)) {
    score += 1;
    reasons.push("Address format is non-standard or may use weak entropy.");
  }

  // === Call Blockstream API for transaction data
  try {
    const response = await fetch(`https://blockstream.info/api/address/${address}`);
    if (!response.ok) throw new Error("Failed to fetch address data.");
    const data = await response.json();

    const txCount = data.chain_stats.tx_count || 0;

    if (txCount < 3) {
      score += 1;
      reasons.push(`Low transaction activity (${txCount} txs) – possibly burner or attack wallet.`);
    } else if (txCount > 10) {
      score += 2;
      reasons.push(`High reuse detected (${txCount} txs).`);
    }

    const balance = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
    if (balance === 0) {
      reasons.push("Address has no remaining balance. Possibly emptied or inactive.");
    }
  } catch (err) {
    score += 1;
    reasons.push("Unable to fetch blockchain data – fallback risk assumed.");
    console.error("API Error:", err);
  }

  // === Final Risk Score Interpretation
  let level = "Low";
  if (score >= 3 && score < 6) level = "Moderate";
  else if (score >= 6 && score < 9) level = "High";
  else if (score >= 9) level = "Critical";

  return { level, reasons };
}
