async function assessRisk() {
  const address = document.getElementById("btcAddress").value.trim();
  const results = document.getElementById("results");
  const usageDisplay = document.getElementById("usageScore");
  const vulnDisplay = document.getElementById("vulnScore");
  const usageReasons = document.getElementById("usageReasons");
  const vulnReasons = document.getElementById("vulnReasons");

  if (!address) {
    alert("Please enter a Bitcoin address.");
    return;
  }

  const usage = await analyzeUsageRisk(address);
  const vuln = await analyzeVulnerabilityRisk(address);

  usageDisplay.textContent = `Usage Risk: ${usage.level}`;
  vulnDisplay.textContent = `Vulnerability Risk: ${vuln.level}`;

  usageReasons.innerHTML = "";
  vulnReasons.innerHTML = "";

  usage.reasons.forEach(reason => {
    const li = document.createElement("li");
    li.textContent = reason;
    usageReasons.appendChild(li);
  });

  vuln.reasons.forEach(reason => {
    const li = document.createElement("li");
    li.textContent = reason;
    vulnReasons.appendChild(li);
  });

  results.classList.remove("hidden");
}

// ========== USAGE RISK ==========
async function analyzeUsageRisk(address) {
  let score = 0;
  let reasons = [];

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

  let level = "Low";
  if (score >= 3 && score < 6) level = "Moderate";
  else if (score >= 6 && score < 9) level = "High";
  else if (score >= 9) level = "Critical";

  return { level, reasons };
}

// ========== VULNERABILITY RISK ==========
async function analyzeVulnerabilityRisk(address) {
  let score = 0;
  let reasons = [];

  if (address.startsWith("1")) {
    score += 2;
    reasons.push("Legacy P2PKH format – more commonly generated by older or insecure wallets.");
  }

  const weakVanityPrefixes = ["1Love", "1Free", "1God", "1Win", "1Lucky", "1Q2W3E", "1Bitcoin"];
  if (weakVanityPrefixes.some(prefix => address.startsWith(prefix))) {
    score += 3;
    reasons.push("Weak vanity prefix – may have been generated using a short or predictable pattern.");
  }

  const repeatingCharPattern = /(.)\1{4,}/;
  if (repeatingCharPattern.test(address)) {
    score += 2;
    reasons.push("Address contains repeated characters – may be low entropy or brute-forced.");
  }

  const lowercase = address.toLowerCase();
  const englishWords = ["god", "love", "bitcoin", "password", "wallet", "money"];
  if (englishWords.some(word => lowercase.includes(word))) {
    score += 2;
    reasons.push("Contains readable English words – possible brainwallet or vanity phrase.");
  }

  const knownCompromised = false; // future dataset integration
  if (knownCompromised) {
    score += 10;
    reasons.push("Address matches known leaked private key.");
  }

  let level = "Low";
  if (score >= 3 && score < 6) level = "Moderate";
  else if (score >= 6 && score < 9) level = "High";
  else if (score >= 9) level = "Critical";

  return { level, reasons };
}
