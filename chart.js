let balanceChartInstance = null;

function RenderBalanceChart() {
    const ctx = document.getElementById("balanceChart")?.getContext("2d");
    if (!ctx) return;

    // Последние 7 дней
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - 6);
    cutoff.setHours(0, 0, 0, 0);
    const cutoffTs = cutoff.getTime();

    // Берём объекты транзакций (не ID!) за 7 дней
    const recentTx = transactions;

    // Уникальные даты, отсортированные по возрастанию
    const dateSet = new Set(
        recentTx.map(tx => new Date(tx[TRANSACTION.DATE]).toLocaleDateString("ru-RU"))
    );
    const labels = [...dateSet].sort((a, b) => {
        const parse = s => { const [d, m, y] = s.split("."); return new Date(y, m - 1, d); };
        return parse(a) - parse(b);
    });

    // Суммы по дате и типу
    const incomeByDate  = Object.fromEntries(labels.map(l => [l, 0]));
    const expenseByDate = Object.fromEntries(labels.map(l => [l, 0]));

    recentTx.forEach(tx => {
        const label = new Date(tx[TRANSACTION.DATE]).toLocaleDateString("ru-RU");
        if (tx[TRANSACTION.TYPE] === "income")  incomeByDate[label]  += tx[TRANSACTION.SUMM];
        if (tx[TRANSACTION.TYPE] === "expense") expenseByDate[label] += tx[TRANSACTION.SUMM];
    });

    // Нарастающий остаток
    let balance = 0;
    const balanceData = labels.map(l => {
        balance += incomeByDate[l] - expenseByDate[l];
        return balance;
    });

    if (balanceChartInstance) balanceChartInstance.destroy();

    balanceChartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [
                { label: "Доходы",  data: labels.map(l => incomeByDate[l]),  borderColor: "#4DA3FF", backgroundColor: "transparent", tension: 0.3, pointRadius: 4 },
                { label: "Расходы", data: labels.map(l => expenseByDate[l]), borderColor: "#FF4D4D", backgroundColor: "transparent", tension: 0.3, pointRadius: 4 },
                { label: "Остаток", data: balanceData,                        borderColor: "#FFFFFF",  backgroundColor: "transparent", tension: 0.3, pointRadius: 4 },
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "bottom", labels: { color: "#ccc", usePointStyle: true, padding: 20 } }
            },
            scales: {
                x: { ticks: { color: "#aaa" }, grid: { color: "rgba(255,255,255,0.05)" } },
                y: { ticks: { color: "#aaa" }, grid: { color: "rgba(255,255,255,0.05)" } }
            }
        }
    });
}