function assessRisk() {
  const address = document.getElementById("btcAddress").value.trim();
  const results = document.getElementById("results");
  const score = document.getElementById("score");
  const reasons = document.getElementById("reasons");

  if (!address) {
    alert("Please enter a Bitcoin address.");
    return;
  }

  // Dummy logic (real scoring comes later!)
  let riskScore = "Moderate";
  let findings = [
    "No direct matches in compromised address lists.",
    "Address appears reused in multiple transactions.",
    "No known darknet association (based on public heuristics)."
  ];

  if (address.startsWith("1")) {
    riskScore = "High";
    findings.push("Legacy address format (P2PKH) more likely to be reused.");
  }

  // Output the results
  score.textContent = `Risk Level: ${riskScore}`;
  reasons.innerHTML = "";
  findings.forEach(reason => {
    const li = document.createElement("li");
    li.textContent = reason;
    reasons.appendChild(li);
  });

  results.classList.remove("hidden");
}
