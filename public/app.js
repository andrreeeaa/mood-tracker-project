const API_URL = 'http://localhost:5000/api';

// --- 1. STATE MANAGEMENT ---
let currentUser = null;

// Variabile temporare pentru WIZARD (Logare în pași)
let wizardData = {
    mood: null,
    tags: [],
    reflection: "",
    sleep: null
};

// Initializare la încărcarea paginii
document.addEventListener('DOMContentLoaded', async () => {
    // Setăm data de azi în header
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    const dateElement = document.getElementById('currentDateDisplay');
    if (dateElement) {
        dateElement.innerText = new Date().toLocaleDateString('en-US', options);
    }

    // Încărcăm datele (în ordine)
    // Nota: Dacă loadUserProfile dă eroare (că nu ai backend de User încă), nu blochează restul
    await loadUserProfile(); 
    await checkTodayStatus();
    await loadStats();
    await loadChart();
});

// --- 2. USER PROFILE ---
async function loadUserProfile() {
    try {
        const res = await fetch(`${API_URL}/users/profile`);
        // Dacă backend-ul nu e gata, fetch poate returna HTML de eroare, deci verificăm
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("API User nu e gata încă");
        }

        const user = await res.json();
        currentUser = user;

        // Actualizăm UI-ul
        if (document.querySelector('.user-name-display')) {
            document.querySelector('.user-name-display').innerText = user.name;
        }
        document.getElementById('nav-avatar').src = user.avatarURL || 'https://ui-avatars.com/api/?name=User';
        document.getElementById('dropdown-name').innerText = user.name;
        document.getElementById('dropdown-email').innerText = user.email;

        // Setări
        document.getElementById('setting-name').value = user.name;
        document.getElementById('setting-avatar').value = user.avatarURL;
        document.getElementById('setting-avatar-preview').src = user.avatarURL;

    } catch (err) { console.warn("Profile loading skipped (Backend not ready):", err); }
}

// --- 3. TODAY STATUS ---
async function checkTodayStatus() {
    try {
        const res = await fetch(`${API_URL}/logs/recent`);
        const logs = await res.json();

        if (logs.length > 0) {
            const lastLogDate = new Date(logs[0].date).toDateString();
            const todayDate = new Date().toDateString();

            if (lastLogDate === todayDate) {
                showLoggedHero(logs[0]);
            } else {
                document.getElementById('hero-empty').style.display = 'block';
            }
        } else {
             document.getElementById('hero-empty').style.display = 'block';
        }
    } catch (err) { console.error(err); }
}

function showLoggedHero(log) {
    document.getElementById('hero-empty').style.display = 'none';
    const heroLogged = document.getElementById('hero-logged');
    heroLogged.style.display = 'grid';

    const moodMap = {
        "1": { text: "Very Sad", emoji: "😭" },
        "2": { text: "Sad", emoji: "☹️" },
        "3": { text: "Neutral", emoji: "😐" },
        "4": { text: "Happy", emoji: "🙂" },
        "5": { text: "Very Happy", emoji: "🤩" }
    };
    
    const moodData = moodMap[log.moodScore] || { text: "Unknown", emoji: "❓" };

    document.getElementById('today-mood-text').innerText = moodData.text;
    document.getElementById('today-emoji').innerText = moodData.emoji;
    document.getElementById('today-sleep').innerText = log.sleepHours + " hours";
    document.getElementById('today-reflection').innerText = log.journalEntry || "No reflection.";

    loadQuote(log.moodScore);
}

async function loadQuote(score) {
    try {
        const res = await fetch(`${API_URL}/quotes/${score}`);
        const data = await res.json();
        document.getElementById('today-quote').innerText = `"${data.quote}"`;
    } catch (e) { console.log(e); }
}

// --- 4. STATISTICS ---
async function loadStats() {
    try {
        const res = await fetch(`${API_URL}/logs/stats`);
        const data = await res.json();

        const moodCard = document.getElementById('mood-card-container');
        const sleepCard = document.getElementById('sleep-card-container');

        // Resetăm clasele vechi
        moodCard.className = 'stat-card'; 
        sleepCard.className = 'stat-card';

        if (data.hasEnoughData === false) {
            // STARE GRI (Empty)
            document.getElementById('mood-empty').style.display = 'block';
            document.getElementById('sleep-empty').style.display = 'block';
            document.getElementById('mood-full').style.display = 'none';
            document.getElementById('sleep-full').style.display = 'none';
            
            // Adăugăm stilul default gri/pal
            moodCard.classList.add('mood-gradient'); // Clasa veche default
            sleepCard.classList.add('sleep-gradient');

        } else {
            // STARE COLORATĂ (Full)
            document.getElementById('mood-empty').style.display = 'none';
            document.getElementById('sleep-empty').style.display = 'none';
            document.getElementById('mood-full').style.display = 'block';
            document.getElementById('sleep-full').style.display = 'block';

            // 1. Colorăm Mood Card dinamic
            const avgMood = Math.round(data.recent.mood); // Rotunjim la cel mai apropiat întreg (1-5)
            moodCard.classList.add(`mood-card-${avgMood}`); // Adaugă mood-card-1, mood-card-5 etc.

            // 2. Colorăm Sleep Card (Întotdeauna indigo închis când sunt date)
            sleepCard.classList.add('sleep-card-active');

            // Populăm textele (Convertim numărul în text: 3 -> "Neutral")
            const moodNames = ["", "Very Sad", "Sad", "Neutral", "Happy", "Very Happy"];
            document.getElementById('stats-mood-val').innerText = moodNames[avgMood];
            document.getElementById('stats-sleep-val').innerText = data.recent.sleep + " Hours";

            if (data.comparison) {
                document.getElementById('stats-mood-comp').innerText = "→ " + data.comparison.mood.text;
                document.getElementById('stats-sleep-comp').innerText = "→ " + data.comparison.sleep.text;
            }
        }
    } catch (e) { console.error("Stats err:", e); }
}

// --- 5. CHART ---
async function loadChart() {
    try {
        const res = await fetch(`${API_URL}/logs/recent`);
        const logs = await res.json();
        const logsRev = logs.reverse();

        const ctx = document.getElementById('trendsChart').getContext('2d');
        
        // 1. CULOAREA = MOOD (Rămâne la fel)
        const barColors = logsRev.map(l => {
            const score = l.moodScore;
            if (score === 1) return '#FF9B99'; // Very Sad (Red)
            if (score === 2) return '#B8B1FF'; // Sad (Indigo)
            if (score === 3) return '#89CAFF'; // Neutral (Blue)
            if (score === 4) return '#89E780'; // Happy (Green)
            if (score === 5) return '#FFC97C'; // Very Happy (Amber)
            return '#CBCDD0';
        });

        // 2. TEXTE MOOD (Pentru Tooltip)
        const moodTexts = ["", "Very Sad", "Sad", "Neutral", "Happy", "Very Happy"];
        const moodEmojis = ["", "😭", "☹️", "😐", "🙂", "🤩"];

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: logsRev.map(l => {
                    const d = new Date(l.date);
                    return d.getDate() + ' ' + d.toLocaleString('en-US', { month: 'short' });
                }),
                datasets: [{
                    label: 'Sleep', // Schimbăm eticheta internă
                    
                    // 3. ÎNĂLȚIMEA = SOMN (Aici e modificarea cheie!)
                    // Mapăm orele reale (7.5) la scara 1-5 a graficului nostru
                    data: logsRev.map(l => {
                        const sleep = l.sleepHours;
                        if (sleep >= 9) return 5;   // 9+ hours
                        if (sleep >= 7) return 4;   // 7-8 hours
                        if (sleep >= 5) return 3;   // 5-6 hours
                        if (sleep >= 3) return 2;   // 3-4 hours
                        return 1;                   // 0-2 hours
                    }), 
                    
                    backgroundColor: barColors,
                    borderRadius: 20,
                    barThickness: 30,
                    // Datele extra pentru tooltip
                    extraData: logsRev.map(l => ({
                        realSleep: l.sleepHours, // Salvăm ora exactă (7.5)
                        moodScore: l.moodScore,
                        reflection: l.journalEntry || "No reflection.",
                        tags: l.feelings || []
                    }))
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#1F2937',
                        bodyColor: '#6B7280',
                        borderColor: '#E5E7EB',
                        borderWidth: 1,
                        padding: 15,
                        cornerRadius: 12,
                        displayColors: false,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 },
                        callbacks: {
                            // Titlul Tooltip-ului: MOOD-ul (Emoji + Text)
                            title: function(context) {
                                const idx = context[0].dataIndex;
                                const extra = context[0].dataset.extraData[idx];
                                return `${moodEmojis[extra.moodScore]} ${moodTexts[extra.moodScore]}`;
                            },
                            // Corpul Tooltip-ului: Detalii Somn + Reflecție
                            label: function(context) {
                                const idx = context.dataIndex;
                                const extra = context.dataset.extraData[idx];
                                
                                return [
                                    `💤 Sleep: ${extra.realSleep} hours`, // Arătăm 7.5, nu 4
                                    ``,
                                    `📝 Reflection:`,
                                    `${extra.reflection.substring(0, 40)}${extra.reflection.length>40?'...':''}`,
                                    ``,
                                    `🏷️ Tags: ${extra.tags.join(', ')}`
                                ];
                            }
                        }
                    }
                },
                scales: { 
                    y: { 
                        display: true, 
                        min: 0, 
                        max: 6,
                        grid: { borderDash: [5, 5], color: '#f0f0f0' },
                        ticks: {
                            // Etichetele de pe axă (Rămân la fel, acum se potrivesc cu înălțimea)
                            callback: function(value) {
                                if(value === 5) return '9+ hours';
                                if(value === 4) return '7-8 hours';
                                if(value === 3) return '5-6 hours';
                                if(value === 2) return '3-4 hours';
                                if(value === 1) return '0-2 hours';
                                return '';
                            },
                            font: { size: 11, family: 'Reddit Sans' },
                            color: '#9CA3AF'
                        }
                    }, 
                    x: { 
                        grid: { display: false },
                        ticks: { font: { weight: 'bold', family: 'Reddit Sans' } }
                    } 
                }
            }
        });
    } catch(err) { console.error(err); }
}

// --- 6. MODAL & WIZARD LOGIC (MULTI-STEP) ---

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(el => {
        el.style.display = 'none';
    });
}

function toggleDropdown() {
    const dd = document.getElementById('userDropdown');
    dd.classList.toggle('show');
}

function openSettings(event) {
    if(event) event.stopPropagation(); // Previne închiderea dropdown-ului instant
    closeAllModals();
    document.getElementById('settingsModal').style.display = 'flex';
}

function closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
}

function openLogModal() {
    closeAllModals();
    document.getElementById('logModal').style.display = 'flex';
    goToStep(1);
    wizardData = { mood: null, tags: [], reflection: "", sleep: null };
    resetWizardStyles();
}

function closeLogModal() { // Trebuia definită
    document.getElementById('logModal').style.display = 'none';
}

// Navigare Wizard
function goToStep(stepNumber) {
    document.querySelectorAll('.wizard-step').forEach(el => el.style.display = 'none');
    document.getElementById(`step-${stepNumber}`).style.display = 'block';
    
    document.querySelectorAll('.step-dash').forEach((dash, index) => {
        if (index < stepNumber) dash.classList.add('active');
        else dash.classList.remove('active');
    });
}

// Funcție ajutătoare pentru a arăta erori vizuale
function showErrorEffect(elementId) {
    const el = document.getElementById(elementId);
    if(el) {
        el.classList.add('input-error');
        // Scoatem roșul după 2 secunde sau când dă click
        setTimeout(() => el.classList.remove('input-error'), 2000);
    }
}

function nextStep(targetStep) {
    // Validare Pasul 1 (Mood)
    if (targetStep === 2) {
        if (!wizardData.mood) {
            showErrorEffect('mood-options'); // Scuturăm lista de butoane
            return; // Oprim funcția, nu trecem mai departe
        }
    }

    // Validare Pasul 2 (Tags) - Opțional, dacă vrei să fie obligatoriu
    if (targetStep === 3) {
        if (wizardData.tags.length === 0) {
            showErrorEffect('tags-container');
            return;
        }
    }
    
    
    goToStep(targetStep);
}

// Interacțiune UI (Selecții)
function selectMood(value, element) {
    wizardData.mood = value;
    document.querySelectorAll('#mood-options .option-btn').forEach(b => b.classList.remove('selected'));
    element.classList.add('selected');
}

function toggleTag(element) {
    const tagText = element.innerText;
    if (wizardData.tags.includes(tagText)) {
        wizardData.tags = wizardData.tags.filter(t => t !== tagText);
        element.classList.remove('selected');
    } else {
        if (wizardData.tags.length >= 3) return alert("Max 3 tags!");
        wizardData.tags.push(tagText);
        element.classList.add('selected');
    }
}

function updateCharCount(textarea) {
    document.getElementById('char-current').innerText = textarea.value.length;
    wizardData.reflection = textarea.value;
}

function selectSleep(value, element) {
    wizardData.sleep = value;
    document.querySelectorAll('#sleep-options .option-btn').forEach(b => b.classList.remove('selected'));
    element.classList.add('selected');
}

function resetWizardStyles() {
    document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    const ref = document.getElementById('wizard-reflection');
    if(ref) ref.value = "";
    const cnt = document.getElementById('char-current');
    if(cnt) cnt.innerText = "0";
}

// Submit Final
async function submitWizard() {
    // Validare Pasul 4 (Sleep)
    if (!wizardData.sleep) {
        showErrorEffect('sleep-options');
        return;
    }

    try {
        const payload = {
            moodScore: wizardData.mood,
            sleepHours: wizardData.sleep,
            journalEntry: wizardData.reflection,
            feelings: wizardData.tags 
        };

        const response = await fetch(`${API_URL}/logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            closeAllModals();
            window.location.reload();
        } else {
            alert("Error saving log."); // Aici lăsăm alert pentru erori de server
        }
    } catch (e) { console.error(e); }
    // if (!wizardData.sleep) return alert("Please select sleep hours.");

    // try {
    //     const payload = {
    //         moodScore: wizardData.mood,
    //         sleepHours: wizardData.sleep,
    //         journalEntry: wizardData.reflection,
    //         feelings: wizardData.tags 
    //     };

    //     const response = await fetch(`${API_URL}/logs`, {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify(payload)
    //     });

    //     if (response.ok) {
    //         closeAllModals();
    //         window.location.reload();
    //     } else {
    //         alert("Error saving log.");
    //     }
    // } catch (e) { console.error(e); }
}
// Funcție Mock pentru Logout (doar refresh pagina momentan)
function logout() {
    alert("You have been logged out (Mock).");
    window.location.reload();
}

// Update Profile
const settingsForm = document.getElementById('settingsForm');
if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('setting-name').value;
        const avatar = document.getElementById('setting-avatar').value;

        await fetch(`${API_URL}/users/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, avatarURL: avatar })
        });
        window.location.reload();
    });
}