// ☕ Baanbrew Dashboard - Application Logic & Chart Renderer

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('customers_cleaned.json');
    const customers = await response.json();

    initDashboard(customers);
  } catch (err) {
    console.error('Error loading customer data:', err);
  }
});

function initDashboard(data) {
  renderCharts(data);
  renderTable(data);
  setupFilters(data);
}

function renderCharts(data) {
  // 1. Membership Tier Counts
  const tierCounts = { Platinum: 0, Gold: 0, Silver: 0, Bronze: 0 };
  const tierSpending = { Platinum: 0, Gold: 0, Silver: 0, Bronze: 0 };
  const categoryCounts = {};
  const ageGroups = { '18-25': 0, '26-35': 0, '36-50': 0, '50+': 0 };

  data.forEach(item => {
    // Tiers
    if (tierCounts[item.membership_tier] !== undefined) {
      tierCounts[item.membership_tier]++;
      tierSpending[item.membership_tier] += item.total_spent;
    }

    // Categories
    categoryCounts[item.favorite_category] = (categoryCounts[item.favorite_category] || 0) + 1;

    // Age Groups
    const age = item.age;
    if (age <= 25) ageGroups['18-25']++;
    else if (age <= 35) ageGroups['26-35']++;
    else if (age <= 50) ageGroups['36-50']++;
    else ageGroups['50+']++;
  });

  // Chart 1: Membership Tier (Doughnut)
  new Chart(document.getElementById('membershipChart'), {
    type: 'doughnut',
    data: {
      labels: Object.keys(tierCounts),
      datasets: [{
        data: Object.values(tierCounts),
        backgroundColor: ['#4F46E5', '#D97706', '#6B7280', '#C2410C'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } }
    }
  });

  // Chart 2: Favorite Category (Bar)
  new Chart(document.getElementById('categoryChart'), {
    type: 'bar',
    data: {
      labels: Object.keys(categoryCounts),
      datasets: [{
        label: 'จำนวนลูกค้าที่ชื่นชอบ',
        data: Object.values(categoryCounts),
        backgroundColor: '#3E6B52',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });

  // Chart 3: Total Spent by Tier (Bar)
  new Chart(document.getElementById('spendingChart'), {
    type: 'bar',
    data: {
      labels: Object.keys(tierSpending),
      datasets: [{
        label: 'ยอดใช้จ่ายรวม (บาท)',
        data: Object.values(tierSpending),
        backgroundColor: '#D4A359',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });

  // Chart 4: Age Distribution (Line)
  new Chart(document.getElementById('ageChart'), {
    type: 'line',
    data: {
      labels: Object.keys(ageGroups),
      datasets: [{
        label: 'จำนวนลูกค้า (คน)',
        data: Object.values(ageGroups),
        borderColor: '#3A6D8C',
        backgroundColor: 'rgba(58, 109, 140, 0.15)',
        fill: true,
        tension: 0.4,
        pointRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

function renderTable(data) {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';

  data.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${item.customer_id}</strong></td>
      <td>${item.name}</td>
      <td>${item.email}</td>
      <td>${item.phone}</td>
      <td>${item.age}</td>
      <td>${item.gender}</td>
      <td><span class="badge-tier tier-${item.membership_tier}">${item.membership_tier}</span></td>
      <td>฿${item.total_spent.toLocaleString()}</td>
      <td>${item.order_count}</td>
      <td>${item.favorite_category}</td>
    `;
    tbody.appendChild(row);
  });
}

function setupFilters(allData) {
  const searchInput = document.getElementById('searchInput');
  const tierFilter = document.getElementById('tierFilter');

  function filterData() {
    const term = searchInput.value.toLowerCase();
    const tier = tierFilter.value;

    const filtered = allData.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(term) ||
                          item.email.toLowerCase().includes(term) ||
                          item.customer_id.toLowerCase().includes(term);
      const matchTier = tier === 'ALL' || item.membership_tier === tier;
      return matchSearch && matchTier;
    });

    renderTable(filtered);
  }

  searchInput.addEventListener('input', filterData);
  tierFilter.addEventListener('change', filterData);
}
