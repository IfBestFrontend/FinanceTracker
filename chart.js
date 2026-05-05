document.addEventListener("DOMContentLoaded", () => {
    const ctx = document.getElementById("balanceChart").getContext("2d");

    const days = [1, 2, 3, 4, 5, 6, 7];

    const income = [45, 40, 35, 60, 15, 12, 90];
    const expense = [25, 25, 35, 62, 17, 5, 10];

    const balance = [];

    let currentBalance = 0;

    for (let i = 0; i < days.length; i++) {
        currentBalance += income[i] - expense[i];
        balance.push(currentBalance);
    }

    new Chart(ctx, {
        type: "line",
        data: {
            labels: days,
            datasets: [
                {
                    label: "Доходы",
                    data: income,
                    borderColor: "#4DA3FF",
                    backgroundColor: "transparent",
                    tension: 0.3,
                    pointRadius: 4
                },
                {
                    label: "Расходы",
                    data: expense,
                    borderColor: "#FF4D4D",
                    backgroundColor: "transparent",
                    tension: 0.3,
                    pointRadius: 4
                },
                {
                    label: "Остаток",
                    data: balance,
                    borderColor: "#FFFFFF",
                    backgroundColor: "transparent",
                    tension: 0.3,
                    pointRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "#ccc",
                        usePointStyle: true, 
                        padding: 20
                    }
                }
            },

            scales: {
                x: {
                    ticks: {
                        color: "#aaa"
                    },
                    grid: {
                        color: "rgba(255,255,255,0.05)"
                    }
                },
                y: {
                    ticks: {
                        color: "#aaa"
                    },
                    grid: {
                        color: "rgba(255,255,255,0.05)"
                    }
                }
            }
        }
    });
});