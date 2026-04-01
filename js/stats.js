/**
 * Logic for Sales Statistics
 */

var salesChart = null;

function getPeriodDates() {
    let year = window.currentStatsYear !== undefined ? window.currentStatsYear : new Date().getFullYear();
    let month = window.currentStatsMonth !== undefined ? window.currentStatsMonth : new Date().getMonth();
    let startDate = new Date(year, month, 1);
    let endDate = new Date(year, month + 1, 0, 23, 59, 59);
    return { startDate, endDate };
}

async function renderProductCurve() {
    const { startDate, endDate } = getPeriodDates();

    // Fetch all paid orders in the period
    const allOrders = await Orders.getAll();
    const isAdmin = window.getCurrentUserRole && window.getCurrentUserRole() === 'admin';
    const currentName = window.getCurrentUserName ? window.getCurrentUserName() : '';

    const paidOrders = allOrders.filter(o => {
        if (o.status !== Orders.ORDER_STATUS.PAID || !o.closedAt) return false; // Use closedAt like calendar

        // Date filter - use closedAt like calendar
        const d = new Date(o.closedAt);
        if (!(d >= startDate && d <= endDate)) return false;

        // Role filter: servers only see their own orders
        if (!isAdmin && o.waiterName !== currentName) return false;

        return true;
    });

    // Grouping by Calendar Day with session support (like calendar)
    const dailyMap = {}; // { dateKey: { revenue: 0, qty: 0, date: Date, sessions: [] } }

    paidOrders.forEach(o => {
        const orderDate = new Date(o.closedAt); // Use closedAt like calendar
        const dateKey = orderDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Determine session based on closure time (same logic as calendar)
        const hour = orderDate.getHours();
        const sessionType = hour < 15 ? 'matin' : 'soir'; // 8h-15h = matin, 15h+ = soir
        
        if (!dailyMap[dateKey]) {
            dailyMap[dateKey] = {
                revenue: 0,
                qty: 0,
                date: orderDate,
                sessions: {}
            };
        }
        
        if (!dailyMap[dateKey].sessions[sessionType]) {
            dailyMap[dateKey].sessions[sessionType] = {
                revenue: 0,
                qty: 0
            };
        }
        
        const orderTotal = parseFloat(o.total) || 0;
        dailyMap[dateKey].revenue += orderTotal;
        dailyMap[dateKey].sessions[sessionType].revenue += orderTotal;
    });

    const paidOrdersMap = {};
    paidOrders.forEach(o => paidOrdersMap[o.id] = o);

    // Process items for daily quantities and product breakdown
    const allItems = await CafeDB.getAll(CafeDB.STORES.orderItems);
    const allMenuProducts = await Products.getAll();
    const productStats = {};
    allMenuProducts.forEach(p => { productStats[p.name] = { qty: 0, revenue: 0 }; });

    allItems.forEach(item => {
        const order = paidOrdersMap[item.orderId];
        if (order) {
            const orderDate = new Date(order.closedAt); // Use closedAt like calendar
            const dateKey = orderDate.toISOString().split('T')[0];
            const hour = orderDate.getHours();
            const sessionType = hour < 15 ? 'matin' : 'soir';
            const iQty = parseFloat(item.quantity) || 0;
            const iSubTotal = parseFloat(item.subTotal) || 0;

            if (dailyMap[dateKey]) {
                dailyMap[dateKey].qty += iQty;
                if (dailyMap[dateKey].sessions[sessionType]) {
                    dailyMap[dateKey].sessions[sessionType].qty += iQty;
                }
            }

            if (!productStats[item.productName]) {
                productStats[item.productName] = { qty: 0, revenue: 0 };
            }
            productStats[item.productName].qty += iQty;
            productStats[item.productName].revenue += iSubTotal;
        }
    });

    // Prepare Chart Data (by day)
    const sortedKeys = Object.keys(dailyMap).sort((a, b) => new Date(a) - new Date(b));
    const labels = sortedKeys.map(k => dailyMap[k].date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }));
    const revenueData = sortedKeys.map(k => dailyMap[k].revenue);
    const quantityData = sortedKeys.map(k => dailyMap[k].qty);

    // Summary Calculations - Find best day by REVENUE (not quantity)
    let totalMonthRev = 0;
    let maxDayRevenue = 0;
    let bestDay = null;
    sortedKeys.forEach(k => {
        totalMonthRev += dailyMap[k].revenue;
        if (dailyMap[k].revenue > maxDayRevenue) {
            maxDayRevenue = dailyMap[k].revenue;
            bestDay = dailyMap[k];
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
        if (bestDay && maxDayRevenue > 0) {
            const dStr = bestDay.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            elBestD.innerHTML = `${dStr}<br><span style="font-size:0.85rem; opacity:0.8; font-weight:normal;">${bestDay.qty} produits (${UI.formatPrice(bestDay.revenue)})</span>`;
        } else {
            elBestD.textContent = '-';
        }
    }

    const monthNameStr = startDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    document.getElementById('statsTitle').textContent = `Ventes par jour - ${monthNameStr.charAt(0).toUpperCase() + monthNameStr.slice(1)}`;

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
    // filter logic moved to ui.js
});

window.Stats = { renderProductCurve: renderProductCurve };
