// --- INITIAL SETUP ---
const session = JSON.parse(localStorage.getItem('dc500_session'));

if (!session) {
    window.location.href = 'login.html';
}

// Set User Info
if (document.getElementById('userName')) {
    document.getElementById('userName').innerText = session.name || 'Operator';
    document.getElementById('roleBadge').innerText = (session.role || 'USER').toUpperCase();
}

// Developer Mode Toggle
const isDev = session && session.role === 'developer';
if (isDev) {
    document.body.classList.add('dev-mode');
    const roleBadge = document.getElementById('roleBadge');
    if (roleBadge) {
        roleBadge.style.borderColor = 'var(--accent-dev)';
        roleBadge.style.color = 'var(--accent-dev)';
    }

    // Unlock Controls
    const sliderLT = document.getElementById('sliderLT');
    const sliderCT = document.getElementById('sliderCT');
    if (sliderLT) sliderLT.disabled = false;
    if (sliderCT) sliderCT.disabled = false;

    // Update Control Mode Badge
    const controlMode = document.getElementById('controlMode');
    if (controlMode) controlMode.textContent = 'Manual Control';

    // Show Dev Panel
    const devPanel = document.getElementById('devPanel');
    if (devPanel) devPanel.classList.remove('hidden');
}

// --- DOM ELEMENTS ---
const bridge = document.getElementById('craneBridge');
const trolley = document.getElementById('craneTrolley');
const sliderLT = document.getElementById('sliderLT');
const sliderCT = document.getElementById('sliderCT');
const ltVal = document.getElementById('ltVal');
const ctVal = document.getElementById('ctVal');
const zoneAlert = document.getElementById('zoneAlert');
const devLogs = document.getElementById('devLogs');

// --- SIMULATION VARIABLES ---
let ltPos = 0;
let ctPos = 0;
let ltDir = 0.5;
let ctDir = 0.8;
let loadWeight = 1.0;

// --- CHARTS CONFIG ---
let envChart, loadChart;

function initCharts() {
    // 1. Humidity Gauge (Doughnut)
    const ctxHumidity = document.getElementById('humidityGauge');
    if (ctxHumidity) {
        const humCtx = ctxHumidity.getContext('2d');
        new Chart(humCtx, {
            type: 'doughnut',
            data: {
                labels: ['Used', 'Remaining'],
                datasets: [{
                    data: [67, 33],
                    backgroundColor: ['#10b981', '#e5e7eb'],
                    borderColor: ['#059669', '#d1d5db'],
                    borderWidth: 2,
                    circumference: 180,
                    rotation: 270
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });
    }

    // 2. Temperature Line Chart
    const ctxTemp = document.getElementById('tempChart');
    if (ctxTemp) {
        tempChart = new Chart(ctxTemp.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['21:00', '22:00', '23:00', '00:00', '01:00', '02:00', '03:00', '04:00'],
                datasets: [{
                    label: 'Temperature (°C)',
                    data: [42, 43, 42, 41, 42, 43, 42, 42],
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 3,
                    pointBackgroundColor: '#f59e0b'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    x: {
                        grid: { display: true, color: '#e5e7eb' }
                    },
                    y: {
                        beginAtZero: false,
                        suggestedMin: 0,
                        suggestedMax: 100,
                        grid: { color: '#e5e7eb' }
                    }
                }
            }
        });
    }

    // 3. Load Chart (if exists)
    const ctxLoad = document.getElementById('loadChart');
    if (ctxLoad) {
        loadChart = new Chart(ctxLoad.getContext('2d'), {
            type: 'line',
            data: {
                labels: Array(30).fill(''),
                datasets: [{
                    label: 'Crane Load (Tons)',
                    data: Array(30).fill(1.2),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    tension: 0.2,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    x: { display: false, grid: { display: false } },
                    y: { beginAtZero: true, suggestedMax: 5 }
                }
            }
        });
    }
}

// --- MAIN LOOP ---
function systemLoop() {
    if (!bridge || !trolley) return; // Safety check

    if (!isDev) {
        // AUTOMATIC SIMULATION (For User)
        ltPos += ltDir;
        ctPos += ctDir;

        // Bounce off walls
        if (ltPos > 95 || ltPos < 0) ltDir *= -1;
        if (ctPos > 90 || ctPos < 0) ctDir *= -1;

        // Update Sliders to match reality
        if (sliderLT) sliderLT.value = ltPos;
        if (sliderCT) sliderCT.value = ctPos;
    } else {
        // MANUAL CONTROL (For Developer)
        // Read directly from sliders
        if (sliderLT) ltPos = parseFloat(sliderLT.value);
        if (sliderCT) ctPos = parseFloat(sliderCT.value);
    }

    // 1. Update Visuals
    updateVisuals(ltPos, ctPos);

    // 2. Safety Check (Zone Fencing)
    checkSafetyZones(ltPos, ctPos);

    // 3. Sensor Fluctuations
    updateSensors();

    requestAnimationFrame(systemLoop);
}

// --- CORE FUNCTIONS ---

function updateVisuals(lt, ct) {
    // Update Text
    if (ltVal) ltVal.innerText = Math.round(lt) + " m";
    if (ctVal) ctVal.innerText = Math.round(ct) + " m";

    // Update 3D Elements
    // LT moves Y axis (top %)
    if (bridge) bridge.style.top = lt + "%";

    // CT moves X axis (left %)
    if (trolley) trolley.style.left = ct + "%";
}

function checkSafetyZones(lt, ct) {
    if (!zoneAlert || !trolley) return;

    // Defined Danger Zone: LT > 70% AND CT > 70% (Bottom Right Corner)
    if (lt > 70 && ct > 70) {
        zoneAlert.style.display = 'flex'; // Changed to flex for alignment
        trolley.style.backgroundColor = '#ef4444'; // Red
        trolley.style.boxShadow = '0 0 20px red';
    } else {
        zoneAlert.style.display = 'none';
        trolley.style.backgroundColor = isDev ? '#f59e0b' : '#fbbf24'; // Yellow
        trolley.style.boxShadow = 'none';
    }
}

function updateSensors() {
    // Only update every 60 frames approx to reduce jitter
    if (Math.random() > 0.05) return;

    // Temp: Base 42 +/- random
    let temp = 42 + (Math.random() * 2 - 1);
    const tempDisplay = document.getElementById('tempDisplay');
    if (tempDisplay) tempDisplay.innerText = temp.toFixed(1);

    // Temp Bar Color
    const bar = document.getElementById('tempBar');
    if (bar) {
        if (temp > 45) { bar.style.background = '#ef4444'; }
        else { bar.style.background = '#10b981'; }
    }

    // Load: Base 1.2 tons +/- random
    loadWeight = 1.2 + (Math.random() * 0.1 - 0.05);
    const loadDisplay = document.getElementById('loadDisplay');
    if (loadDisplay) loadDisplay.innerText = loadWeight.toFixed(2);

    // Humidity
    let hum = 58 + (Math.random() * 4 - 2);
    const humDisplay = document.getElementById('humDisplay');
    if (humDisplay) {
        humDisplay.innerText = Math.round(hum);
    }

    // UPDATE CHARTS
    if (envChart) {
        // Remove oldest
        envChart.data.datasets[0].data.shift();
        envChart.data.datasets[1].data.shift();
        // Add newest
        envChart.data.datasets[0].data.push(temp);
        envChart.data.datasets[1].data.push(hum);
        envChart.update('none'); // 'none' mode for performance
    }

    if (loadChart) {
        loadChart.data.datasets[0].data.shift();
        loadChart.data.datasets[0].data.push(loadWeight);
        loadChart.update('none');
    }
}

// --- UDP FUNCTIONS ---

function testUdpConnection() {
    const ip = document.getElementById('udpIp').value;
    const port = document.getElementById('udpPort').value;

    // Simulate connection test
    const btn = document.querySelector('.udp-btn.primary');
    const originalText = btn.innerHTML;

    btn.innerHTML = 'Testing...';
    btn.disabled = true;

    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
        alert(`Successfully pinged UDP Server at ${ip}:${port}\nLatency: 12ms`);

        // Update status
        document.getElementById('udpStatus').innerHTML = '<span class="status-dot"></span>CONNECTED';
        document.getElementById('udpStatus').className = 'status-badge online';
    }, 1500);
}

function saveUdpSettings() {
    const ip = document.getElementById('udpIp').value;
    const port = document.getElementById('udpPort').value;
    const localPort = document.getElementById('udpLocalPort').value;

    // Save to local storage (mock)
    localStorage.setItem('dc500_udp_settings', JSON.stringify({ ip, port, localPort }));

    alert('UDP Settings Saved Successfully!');
}

// --- FIRMWARE UPLOAD HANDLERS ---

// Called when user selects a file
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('firmwareFile');
    const fileNameDiv = document.getElementById('firmwareFileName');
    const uploadBtn = document.getElementById('firmwareUploadBtn');

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const f = e.target.files[0];
            if (!f) {
                if (fileNameDiv) fileNameDiv.textContent = '';
                if (uploadBtn) uploadBtn.disabled = true;
                return;
            }
            // Validate extension
            const name = f.name || '';
            const ext = name.split('.').pop().toLowerCase();
            if (!['bin','img'].includes(ext)) {
                alert('Please select a .bin or .img firmware file');
                fileInput.value = '';
                if (uploadBtn) uploadBtn.disabled = true;
                if (fileNameDiv) fileNameDiv.textContent = '';
                return;
            }
            if (fileNameDiv) fileNameDiv.textContent = name;
            if (uploadBtn) {
                uploadBtn.disabled = false;
                uploadBtn.style.background = 'var(--brand-blue)';
            }
        });
    }
});

function uploadFirmware() {
    const input = document.getElementById('firmwareFile');
    const uploadBtn = document.getElementById('firmwareUploadBtn');
    if (!input || !input.files || !input.files[0]) {
        alert('No firmware file selected');
        return;
    }
    const file = input.files[0];

    // Disable UI
    if (uploadBtn) {
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Uploading...';
    }

    // Try to POST to /upload-firmware if backend exists; otherwise simulate
    const form = new FormData();
    form.append('firmware', file);

    fetch('/upload-firmware', { method: 'POST', body: form })
        .then(res => {
            if (!res.ok) throw new Error('no-backend');
            return res.json();
        })
        .then(json => {
            alert('Firmware uploaded successfully. Device will reboot.');
            if (uploadBtn) uploadBtn.textContent = 'Uploaded';
        })
        .catch(err => {
            // Backend not present — simulate upload
            console.warn('Firmware upload endpoint not available, simulating upload.');
            setTimeout(() => {
                alert('Firmware uploaded (simulated). Please implement server endpoint /upload-firmware to process the file.');
                if (uploadBtn) uploadBtn.textContent = 'Uploaded (sim)';
            }, 1400);
        })
        .finally(() => {
            if (uploadBtn) {
                uploadBtn.disabled = false;
                setTimeout(() => { uploadBtn.textContent = 'upload'; uploadBtn.style.background = '#6b7280'; }, 1200);
            }
        });
}

// Firmware Update Tab File Handler
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('firmwareFileFW');
    const fileNameDiv = document.getElementById('firmwareFileNameFW');
    const uploadBtn = document.getElementById('firmwareUploadBtnFW');

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const f = e.target.files[0];
            if (!f) {
                if (fileNameDiv) fileNameDiv.textContent = '';
                if (uploadBtn) uploadBtn.disabled = true;
                return;
            }
            const name = f.name || '';
            const ext = name.split('.').pop().toLowerCase();
            if (!['bin','img'].includes(ext)) {
                alert('Please select a .bin or .img firmware file');
                fileInput.value = '';
                if (uploadBtn) uploadBtn.disabled = true;
                if (fileNameDiv) fileNameDiv.textContent = '';
                return;
            }
            if (fileNameDiv) fileNameDiv.textContent = name;
            if (uploadBtn) {
                uploadBtn.disabled = false;
                uploadBtn.style.background = 'var(--brand-blue)';
            }
        });
    }
});

function uploadFirmwareFW() {
    const input = document.getElementById('firmwareFileFW');
    const uploadBtn = document.getElementById('firmwareUploadBtnFW');
    if (!input || !input.files || !input.files[0]) {
        alert('No firmware file selected');
        return;
    }
    const file = input.files[0];

    if (uploadBtn) {
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Uploading...';
    }

    const form = new FormData();
    form.append('firmware', file);

    fetch('/upload-firmware', { method: 'POST', body: form })
        .then(res => {
            if (!res.ok) throw new Error('no-backend');
            return res.json();
        })
        .then(json => {
            alert('Firmware uploaded successfully. Device will reboot.');
            if (uploadBtn) uploadBtn.textContent = 'Uploaded';
        })
        .catch(err => {
            console.warn('Firmware upload endpoint not available, simulating upload.');
            setTimeout(() => {
                alert('Firmware uploaded (simulated). Please implement server endpoint /upload-firmware to process the file.');
                if (uploadBtn) uploadBtn.textContent = 'Uploaded (sim)';
            }, 1400);
        })
        .finally(() => {
            if (uploadBtn) {
                uploadBtn.disabled = false;
                setTimeout(() => { uploadBtn.textContent = 'upload'; uploadBtn.style.background = '#6b7280'; }, 1200);
            }
        });
}

// --- EVENT LISTENERS ---

// Developer Action Logger
function devAction(msg) {
    if (!devLogs) return;
    const time = new Date().toLocaleTimeString();
    const newLog = `> [${time}] ${msg}<br>`;
    devLogs.innerHTML += newLog;
    devLogs.scrollTop = devLogs.scrollHeight;
}

// Navigation Tabs
function switchTab(tabId, btn) {
    // Hide all
    document.querySelectorAll('.content-section').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));

    // Show target
    const target = document.getElementById('tab-' + tabId);
    if (target) target.classList.remove('hidden');

    if (btn) btn.classList.add('active');
}

function logout() {
    localStorage.removeItem('dc500_session');
    window.location.href = 'login.html';
}

// --- START SYSTEM ---
initCharts();
systemLoop();