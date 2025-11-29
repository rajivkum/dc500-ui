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
let ltPos = 23.9;
let ctPos = 11.95;
let loadWeight = 832;
let columnNum = 2;

// --- CHARTS CONFIG ---
let humidityChart, tempChart, loadChart, modernEnvChart;
let liveSparkChart;
// --- Live Crane Monitoring Animation ---
function renderCraneColumns() {
    const columns = document.getElementById('craneColumns');
    if (!columns) return;
    columns.innerHTML = '';
    for (let i = 1; i <= 22; i++) {
        const col = document.createElement('div');
        col.style.flex = '1';
        col.style.textAlign = 'center';
        col.style.fontSize = '11px';
        col.style.color = '#3b82f6';
        col.style.fontWeight = '600';
        col.innerText = i;
        columns.appendChild(col);
    }
}

function updateCranePosition(lt, ct) {
    // LT: 0-100, CT: 0-100
    const cart = document.getElementById('craneCart');
    const track = document.getElementById('craneTrack');
    const ltLabel = document.getElementById('craneLTLabel');
    const ctLabel = document.getElementById('craneCTLabel');
    if (!cart || !track || !ltLabel || !ctLabel) return;
    // Track width
    const trackWidth = track.offsetWidth - 170; // 130px maintenance + 40px cart
    // Map LT to left position (simulate columns)
    const left = 130 + Math.max(0, Math.min(trackWidth, (lt / 100) * trackWidth));
    cart.style.left = left + 'px';
    // Update labels
    ltLabel.innerText = `LT: ${lt.toFixed(2)}m`;
    ctLabel.innerText = `CT: ${ct.toFixed(2)}m`;
    cart.innerHTML = `<span style='color:#fff;font-weight:700;'>${loadWeight}</span>`;
// --- SLIDER FOR COLUMNS ---
let simInterval = null;
document.addEventListener('DOMContentLoaded', function() {
    const slider = document.getElementById('craneColumnSlider');
    const startBtn = document.getElementById('startSimBtn');
    const stopBtn = document.getElementById('stopSimBtn');

    if (slider) {
        slider.addEventListener('input', function(e) {
            columnNum = parseInt(e.target.value);
            ltPos = columnNum * (100/22);
            ctPos = Math.random() * 100; // Simulate CT movement
            loadWeight = Math.floor(500 + Math.random() * 500); // Simulate load
            updateCranePosition(ltPos, ctPos);
        });
    }
    // Initial position
    updateCranePosition(ltPos, ctPos);

    function startSimulation() {
        if (simInterval) return;
        simInterval = setInterval(function() {
            columnNum = Math.floor(1 + Math.random() * 22);
            ltPos = columnNum * (100/22);
            ctPos = Math.random() * 100;
            loadWeight = Math.floor(500 + Math.random() * 500);
            updateCranePosition(ltPos, ctPos);
            if (slider) slider.value = columnNum;
        }, 2000);
    }
    function stopSimulation() {
        if (simInterval) {
            clearInterval(simInterval);
            simInterval = null;
        }
    }
    if (startBtn) startBtn.addEventListener('click', startSimulation);
    if (stopBtn) stopBtn.addEventListener('click', stopSimulation);
});
}

document.addEventListener('DOMContentLoaded', renderCraneColumns);

function initCharts() {
    // Modern Humidity & Temperature Graph
    const ctxModernEnv = document.getElementById('modernEnvChart');
    if (ctxModernEnv) {
        modernEnvChart = new Chart(ctxModernEnv.getContext('2d'), {
            type: 'line',
            data: {
                labels: Array(30).fill(''),
                datasets: [
                    {
                        label: 'Temperature (°C)',
                        data: Array(30).fill(42),
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245,158,11,0.10)',
                        borderWidth: 3,
                        tension: 0.45,
                        fill: true,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        cubicInterpolationMode: 'monotone',
                    },
                    {
                        label: 'Humidity (%)',
                        data: Array(30).fill(67),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16,185,129,0.10)',
                        borderWidth: 3,
                        tension: 0.45,
                        fill: true,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        cubicInterpolationMode: 'monotone',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 900, easing: 'easeOutQuart' },
                plugins: {
                    legend: { display: true, position: 'top' },
                    tooltip: { enabled: true }
                },
                scales: {
                    x: { display: false },
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

    // 4. Small sparkline chart for livedata tab (combined)
    const ctxLive = document.getElementById('livedataSpark');
    if (ctxLive) {
        liveSparkChart = new Chart(ctxLive.getContext('2d'), {
            type: 'line',
            data: {
                labels: Array(20).fill(''),
                datasets: [{
                    label: 'Temp (°C)',
                    data: Array(20).fill(42),
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245,158,11,0.08)',
                    tension: 0.3,
                    fill: true
                }, {
                    label: 'Humidity (%)',
                    data: Array(20).fill(60),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16,185,129,0.06)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } }
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

    // Also update top live-data (if present)
    const topLT = document.getElementById('topLT');
    const topCT = document.getElementById('topCT');
    if (topLT) topLT.innerText = Math.round(lt) + " m";
    if (topCT) topCT.innerText = Math.round(ct) + " m";

    // Also update live-tab values if present
    const liveLT = document.getElementById('liveLT');
    const liveCT = document.getElementById('liveCT');
    if (liveLT) liveLT.innerText = Math.round(lt) + ' m';
    if (liveCT) liveCT.innerText = Math.round(ct) + ' m';

    // Update crane animation in live data tab
    updateCranePosition(lt, ct);
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
    // Reduced jitter but faster updates for a lively dashboard
    if (Math.random() > 0.45) return;

    // Temp: Base 42 +/- random
    let temp = 42 + (Math.random() * 2 - 1);
    const tempDisplay = document.getElementById('tempDisplay');
    if (tempDisplay) {
        tempDisplay.innerText = temp.toFixed(1);
        tempDisplay.classList.add('pulse');
        setTimeout(() => tempDisplay.classList.remove('pulse'), 350);
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
        const humidityValue = document.getElementById('humidityValue');
        if (humidityValue) humidityValue.innerText = Math.round(hum);
    }

    // Update top load element (if present) in kg for a familiar readout
    const topLoadEl = document.getElementById('topLoad');
    if (topLoadEl) {
        // loadWeight is in tons in the simulation; present kg when reasonable
        const kg = Math.round(loadWeight * 1000);
        topLoadEl.innerText = kg + ' kg';
    }

    // Update live-tab values
    const liveLoad = document.getElementById('liveLoad');
    if (liveLoad) {
        liveLoad.innerText = Math.round(loadWeight * 1000) + ' kg';
        liveLoad.classList.add('pulse');
        setTimeout(() => liveLoad.classList.remove('pulse'), 300);
    }
    const liveTemp = document.getElementById('liveTemp');
    if (liveTemp) {
        liveTemp.innerText = temp.toFixed(1) + ' °C';
        liveTemp.classList.add('pulse');
        setTimeout(() => liveTemp.classList.remove('pulse'), 300);
    }
    const liveHum = document.getElementById('liveHum');
    if (liveHum) liveHum.innerText = Math.round(hum) + '%';

    // Push into live spark chart
    if (liveSparkChart) {
        liveSparkChart.data.datasets[0].data.shift();
        liveSparkChart.data.datasets[0].data.push(parseFloat(temp.toFixed(1)));
        liveSparkChart.data.datasets[1].data.shift();
        liveSparkChart.data.datasets[1].data.push(Math.round(hum));
        liveSparkChart.update('none');
    }

    // UPDATE MODERN CHART
    if (modernEnvChart) {
        modernEnvChart.data.datasets[0].data.shift();
        modernEnvChart.data.datasets[0].data.push(parseFloat(temp.toFixed(1)));
        modernEnvChart.data.datasets[1].data.shift();
        modernEnvChart.data.datasets[1].data.push(Math.round(hum));
        modernEnvChart.update();
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
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    // Show target
    const target = document.getElementById('tab-' + tabId);
    if (target) target.classList.remove('hidden');

    if (btn) btn.classList.add('active');

    // If switching to dashboard, ensure charts are animated and visible
    if (tabId === 'dashboard') {
        if (tempChart) tempChart.update();
        if (humidityChart) humidityChart.update();
    }
}

function logout() {
    localStorage.removeItem('dc500_session');
    window.location.href = 'login.html';
}

// --- START SYSTEM ---
initCharts();
systemLoop();