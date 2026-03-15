/**
 * Logic for Sales Statistics
 */

var salesChart = null;

function getPeriodDates(period) {
    const now = new Date();
    let startDate, endDate;
    if (period === 'current_month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    }
    return { startDate, endDate };
}

async function renderProductCurve() {
    const period = document.getElementById('statsPeriodFilter').value;
    const { startDate, endDate } = getPeriodDates(period);

    // Fetch all paid orders in the period
    const allOrders = await Orders.getAll();
    const isAdmin = window.getCurrentUserRole && window.getCurrentUserRole() === 'admin';
    const currentName = window.getCurrentUserName ? window.getCurrentUserName() : '';

    const paidOrders = allOrders.filter(o => {
        if (o.status !== Orders.ORDER_STATUS.PAID || !o.paidAt) return false;

        // Date filter
        const d = new Date(o.paidAt);
        if (!(d >= startDate && d <= endDate)) return false;

        // Role filter: servers only see their own orders
        if (!isAdmin && o.waiterName !== currentName) return false;

        return true;
    });

    // Grouping by "Session" (Clôture)
    const sessionsMap = {}; // { sessionKey: { revenue: 0, qty: 0, date: Date } }

    paidOrders.forEach(o => {
        const key = o.closedAt || 'open';
        if (!sessionsMap[key]) {
            sessionsMap[key] = {
                revenue: 0,
                qty: 0,
                date: new Date(o.paidAt)
            };
        }
        sessionsMap[key].revenue += (parseFloat(o.total) || 0);
    });

    const paidOrdersMap = {};
    paidOrders.forEach(o => paidOrdersMap[o.id] = o);

    // Process items for session quantities and product breakdown
    const allItems = await CafeDB.getAll(CafeDB.STORES.orderItems);
    const allMenuProducts = await Products.getAll();
    const productStats = {};
    allMenuProducts.forEach(p => { productStats[p.name] = { qty: 0, revenue: 0 }; });

    allItems.forEach(item => {
        const order = paidOrdersMap[item.orderId];
        if (order) {
            const key = order.closedAt || 'open';
            const iQty = parseFloat(item.quantity) || 0;
            const iSubTotal = parseFloat(item.subTotal) || 0;

            if (sessionsMap[key]) sessionsMap[key].qty += iQty;

            if (!productStats[item.productName]) {
                productStats[item.productName] = { qty: 0, revenue: 0 };
            }
            productStats[item.productName].qty += iQty;
            productStats[item.productName].revenue += iSubTotal;
        }
    });

    // Prepare Chart Data
    const sortedKeys = Object.keys(sessionsMap).sort((a, b) => sessionsMap[a].date - sessionsMap[b].date);
    const labels = sortedKeys.map(k => sessionsMap[k].date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }));
    const revenueData = sortedKeys.map(k => sessionsMap[k].revenue);
    const quantityData = sortedKeys.map(k => sessionsMap[k].qty);

    // Summary Calculations
    let totalMonthRev = 0;
    let maxSessQty = 0;
    let bestSess = null;
    sortedKeys.forEach(k => {
        totalMonthRev += sessionsMap[k].revenue;
        if (sessionsMap[k].qty > maxSessQty) {
            maxSessQty = sessionsMap[k].qty;
            bestSess = sessionsMap[k];
        }
    });

    let bestProdName = null;
    let maxProdQty = 0;
    const sortedProds = [];
    for (const name in productStats) {
        if (productStats[name].qty > maxProdQty) {
            maxProdQty = productStats[name].qty;
            bestProdName = name;
        }
        sortedProds.push({ name, ...productStats[name] });
    }
    sortedProds.sort((a, b) => b.qty - a.qty || b.revenue - a.revenue);

    // Layout Updates
    const elTotal = document.getElementById('statsTotalMonth');
    const elBestP = document.getElementById('statsBestProduct');
    const elBestD = document.getElementById('statsBestDay');

    if (elTotal) elTotal.textContent = UI.formatPrice(totalMonthRev);
    if (elBestP) elBestP.textContent = bestProdName && maxProdQty > 0 ? `${bestProdName} (${maxProdQty})` : '-';
    if (elBestD) {
        if (bestSess && maxSessQty > 0) {
            const dStr = bestSess.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            elBestD.innerHTML = `${dStr}<br><span style="font-size:0.85rem; opacity:0.8; font-weight:normal;">${maxSessQty} produits (${UI.formatPrice(bestSess.revenue)})</span>`;
        } else {
            elBestD.textContent = '-';
        }
    }

    document.getElementById('statsTitle').textContent = `Ventes par séance - ${period === 'current_month' ? 'Mois en cours' : 'Mois dernier'}`;

    // Breakdown Table
    let tableHtml = '<table class="revenue-table"><thead><tr><th>Produit</th><th>Qté</th><th>Recette</th></tr></thead><tbody>';
    if (sortedProds.length === 0) {
        tableHtml += '<tr><td colspan="3" style="text-align:center;">Aucune donnée</td></tr>';
    } else {
        sortedProds.forEach(p => {
            tableHtml += `<tr><td>${p.name}</td><td>${p.qty}</td><td>${UI.formatPrice(p.revenue)}</td></tr>`;
        });
    }
    tableHtml += '</tbody></table>';
    document.getElementById('statsProductList').innerHTML = tableHtml;

    // Chart.js
    const ctx = document.getElementById('productSalesChart').getContext('2d');
    if (salesChart) salesChart.destroy();
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Recette (DT)',
                    data: revenueData,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Quantité',
                    data: quantityData,
                    borderColor: '#10B981',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Recette (DT)' }, beginAtZero: true },
                y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Quantité' }, beginAtZero: true, grid: { drawOnChartArea: false } }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const filter = document.getElementById('statsPeriodFilter');
    if (filter) filter.addEventListener('change', renderProductCurve);
});

window.Stats = { renderProductCurve: renderProductCurve };
