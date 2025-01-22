// Game state
let state = {
    studyTimer: null,
    freeTimeTimer: null,
    currentTime: 0,
    selectedTime: 15 * 60, // Default 15 minutes in seconds
    isPaused: true,
    coins: 0,
    freeTimeMinutes: 0,
    isFreeTimePaused: true,
    isFullscreen: false,
    todayStudy: 0,
    studyHistory: [],
    quoteInterval: null
};

// Motivational quotes
const motivationalQuotes = [
    "Focus on the process, not the outcome! 💪",
    "Every minute counts towards your success! ⭐",
    "Small steps, big achievements! 🚀",
    "You're investing in yourself! 📚",
    "Stay focused, stay amazing! ✨",
    "Your future self will thank you! 🌟",
    "Learning is your superpower! 💡",
    "Keep going, you're doing great! 🎯",
    "Quality study time = Quality life! 🌈",
    "Building better habits, one session at a time! 🏗️",
    "Your dedication is inspiring! 🌠",
    "Success is built in these moments! 🏆",
    "You're getting stronger with every session! 💪",
    "This is your time to shine! ✨",
    "Making progress, bit by bit! 📈",
    "Stay committed to your goals! 🎯",
    "You've got this! Keep pushing! 💫",
    "Every second counts! Make it worth it! ⚡",
    "Building your future, right now! 🌅",
    "Your potential is unlimited! 🚀"
];

// Sound context setup
let audioContext = null;

function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

// Load saved state from cookies with better error handling
function loadState() {
    try {
        const savedCoins = getCookie('coins');
        const savedFreeTime = getCookie('freeTime');
        const savedTodayStudy = getCookie('todayStudy');
        const savedDate = getCookie('lastStudyDate');
        const savedHistory = getCookie('studyHistory');
        
        const today = new Date().toDateString();
        
        if (savedDate !== today) {
            // It's a new day, archive yesterday's study time
            if (savedTodayStudy && savedDate) {
                const history = savedHistory ? JSON.parse(savedHistory) : [];
                // Only add to history if there was actual study time
                if (parseInt(savedTodayStudy) > 0) {
                    history.unshift({ 
                        date: savedDate, 
                        minutes: parseInt(savedTodayStudy),
                        timestamp: new Date(savedDate).getTime()
                    });
                    // Keep only last 7 days and sort by date
                    history.sort((a, b) => b.timestamp - a.timestamp);
                    if (history.length > 7) history.length = 7;
                    setCookie('studyHistory', JSON.stringify(history), 30);
                    state.studyHistory = history;
                }
            }
            state.todayStudy = 0;
            setCookie('todayStudy', 0, 30);
            setCookie('lastStudyDate', today, 30);
        } else {
            state.todayStudy = savedTodayStudy ? parseInt(savedTodayStudy) : 0;
            state.studyHistory = savedHistory ? JSON.parse(savedHistory) : [];
        }
        
        state.coins = savedCoins ? parseInt(savedCoins) : 0;
        state.freeTimeMinutes = savedFreeTime ? parseInt(savedFreeTime) : 0;
        
        updateUI();
        updateHistoryDisplay();
    } catch (error) {
        console.error('Error loading state:', error);
        // Reset to defaults if there's an error
        state.coins = 0;
        state.freeTimeMinutes = 0;
        state.todayStudy = 0;
        state.studyHistory = [];
        saveState(); // Save the default state
    }
}

// Save state to cookies
function saveState() {
    setCookie('coins', state.coins, 30);
    setCookie('freeTime', state.freeTimeMinutes, 30);
    setCookie('todayStudy', state.todayStudy, 30);
    setCookie('lastStudyDate', new Date().toDateString(), 30);
    setCookie('studyHistory', JSON.stringify(state.studyHistory), 30);
}

// Update history display with more details
function updateHistoryDisplay() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    if (state.studyHistory.length === 0 && state.todayStudy === 0) {
        historyList.innerHTML = '<div class="history-item">No previous records</div>';
        return;
    }
    
    // Add today's progress first
    const todayItem = document.createElement('div');
    todayItem.className = 'history-item today';
    todayItem.innerHTML = `
        <span>Today</span>
        <span>${state.todayStudy} minutes</span>
    `;
    historyList.appendChild(todayItem);
    
    // Then add previous days
    state.studyHistory.forEach(record => {
        const item = document.createElement('div');
        item.className = 'history-item';
        const date = new Date(record.date);
        item.innerHTML = `
            <span>${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <span>${record.minutes} minutes</span>
        `;
        historyList.appendChild(item);
    });
}

// Cookie utilities
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// UI Elements
const timerDisplay = document.getElementById('timer');
const progressBar = document.getElementById('progressBar');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const coinCount = document.getElementById('coinCount');
const freeTimeMinutes = document.getElementById('youtubeMinutes');
const startFreeTimeBtn = document.getElementById('startYoutubeBtn');
const pauseFreeTimeBtn = document.getElementById('pauseYoutubeBtn');
const freeTimeTimer = document.getElementById('youtubeTimer');
const timeButtons = document.querySelectorAll('.time-btn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const todayStudyDisplay = document.getElementById('todayStudy');

// Fullscreen functionality
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
        state.isFullscreen = true;
        fullscreenBtn.textContent = '📺 Exit Fullscreen';
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            state.isFullscreen = false;
            fullscreenBtn.textContent = '📺 Go Fullscreen';
        }
    }
}

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        state.isFullscreen = false;
        fullscreenBtn.textContent = '📺 Go Fullscreen';
    }
});

// Format time for display
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Update UI elements
function updateUI() {
    timerDisplay.textContent = formatTime(state.currentTime);
    const progress = ((state.selectedTime - state.currentTime) / state.selectedTime) * 100;
    progressBar.style.width = `${progress}%`;
    coinCount.textContent = state.coins;
    freeTimeMinutes.textContent = state.freeTimeMinutes;
    todayStudyDisplay.textContent = state.todayStudy;
    
    // Update Free Time timer if active
    if (!state.isFreeTimePaused) {
        freeTimeTimer.textContent = formatTime(state.freeTimeMinutes * 60);
    }

    // Update button states
    startFreeTimeBtn.disabled = state.freeTimeMinutes === 0;
}

// Improved sound effects
function playSound(type) {
    if (!audioContext) initAudio();
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const masterGainNode = audioContext.createGain();
    masterGainNode.gain.value = 0.3; // Master volume control
    
    // Add a compressor for better sound
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -50;
    compressor.knee.value = 40;
    compressor.ratio.value = 12;
    compressor.attack.value = 0;
    compressor.release.value = 0.25;
    
    oscillator.connect(gainNode);
    gainNode.connect(compressor);
    compressor.connect(masterGainNode);
    masterGainNode.connect(audioContext.destination);
    
    // Smooth envelope for attack and release
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    
    switch(type) {
        case 'start':
            oscillator.frequency.setValueAtTime(660, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
        case 'complete':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            
            // Play a success chord
            setTimeout(() => {
                const chord = [440, 550, 660];
                chord.forEach((freq, i) => {
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(compressor);
                    osc.frequency.setValueAtTime(freq, audioContext.currentTime);
                    gain.gain.setValueAtTime(0, audioContext.currentTime);
                    gain.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
                    gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
                    osc.start(audioContext.currentTime);
                    osc.stop(audioContext.currentTime + 0.3);
                });
            }, 200);
            break;
        case 'tick':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
        case 'pause':
        case 'reset':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(330, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
    }
}

// Update motivational quote
function updateMotivationalQuote() {
    const quoteElement = document.getElementById('motivationalQuote');
    if (quoteElement) {
        const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
        quoteElement.textContent = randomQuote;
        
        // Add fade animation
        quoteElement.style.opacity = '0';
        setTimeout(() => {
            quoteElement.style.opacity = '1';
        }, 100);
    }
}

// Timer functions
function startTimer() {
    if (state.isPaused) {
        // Force fullscreen on start
        if (!document.fullscreenElement) {
            toggleFullscreen();
        }
        
        state.isPaused = false;
        timerDisplay.classList.add('active');
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        resetBtn.disabled = false;
        
        // Play start sound effect
        playSound('start');
        
        // Start quote rotation
        updateMotivationalQuote();
        state.quoteInterval = setInterval(updateMotivationalQuote, 20000); // Change quote every 20 seconds
        
        let lastMinute = Math.floor(state.currentTime / 60);
        
        state.studyTimer = setInterval(() => {
            if (state.currentTime > 0) {
                state.currentTime--;
                updateUI();
                
                // Check if a minute has passed
                const currentMinute = Math.floor(state.currentTime / 60);
                if (currentMinute < lastMinute) {
                    // A minute has passed, update study time
                    state.todayStudy++;
                    saveState();
                    updateHistoryDisplay();
                    lastMinute = currentMinute;
                    
                    // Play tick sound every minute
                    playSound('tick');
                }
            } else {
                completeStudySession();
            }
        }, 1000);
    }
}

function pauseTimer() {
    if (!state.isPaused) {
        state.isPaused = true;
        timerDisplay.classList.remove('active');
        clearInterval(state.studyTimer);
        clearInterval(state.quoteInterval);
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        playSound('pause');
        
        // Save the current state when paused
        saveState();
        updateHistoryDisplay();
        updateUI();
    }
}

function resetTimer() {
    state.isPaused = true;
    timerDisplay.classList.remove('active');
    clearInterval(state.studyTimer);
    clearInterval(state.quoteInterval);
    state.currentTime = state.selectedTime;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    resetBtn.disabled = true;
    playSound('reset');
    
    // Save the current state when reset
    saveState();
    updateHistoryDisplay();
    updateUI();
}

function completeStudySession() {
    clearInterval(state.studyTimer);
    const earnedCoins = Math.floor(state.selectedTime / (15 * 60)) * 5;
    const earnedMinutes = earnedCoins;
    
    state.coins += earnedCoins;
    state.freeTimeMinutes += earnedMinutes;
    
    // Don't add the full session time again since we've been adding it minute by minute
    saveState();
    
    playSound('complete');
    
    // Show completion message with animation
    const message = `🎉 Level Complete! 🎉\n\nYou earned:\n${earnedCoins} coins 🪙\n${earnedMinutes} minutes of free time ⌛\n\nToday's total study: ${state.todayStudy} minutes 📚`;
    alert(message);
    
    resetTimer();
    updateUI();
    updateHistoryDisplay();
    startFreeTimeBtn.disabled = false;
}

// Free Time timer functions
function startFreeTime() {
    if (state.freeTimeMinutes > 0 && state.isFreeTimePaused) {
        state.isFreeTimePaused = false;
        startFreeTimeBtn.disabled = true;
        pauseFreeTimeBtn.disabled = false;
        playSound('start');
        
        state.freeTimeTimer = setInterval(() => {
            if (state.freeTimeMinutes > 0) {
                state.freeTimeMinutes--;
                saveState();
                updateUI();
                
                if (state.freeTimeMinutes === 5) {
                    alert('⚠️ 5 minutes of free time remaining!');
                }
            } else {
                pauseFreeTime();
                playSound('complete');
                alert('⏰ Free time is up!\nTime to get back to studying! 📚');
            }
        }, 60000); // Update every minute
    }
}

function pauseFreeTime() {
    if (!state.isFreeTimePaused) {
        state.isFreeTimePaused = true;
        clearInterval(state.freeTimeTimer);
        startFreeTimeBtn.disabled = false;
        pauseFreeTimeBtn.disabled = true;
        playSound('pause');
        saveState();
    }
}

// Event listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
startFreeTimeBtn.addEventListener('click', startFreeTime);
pauseFreeTimeBtn.addEventListener('click', pauseFreeTime);
fullscreenBtn.addEventListener('click', toggleFullscreen);

timeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const minutes = parseInt(btn.dataset.time);
        state.selectedTime = minutes * 60;
        state.currentTime = state.selectedTime;
        
        timeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        playSound('tick');
        resetTimer();
    });
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    state.currentTime = state.selectedTime;
    updateUI();
    updateHistoryDisplay();
    
    // Set initial active time button
    const defaultTimeBtn = document.querySelector('[data-time="15"]');
    if (defaultTimeBtn) defaultTimeBtn.classList.add('active');
    
    startFreeTimeBtn.disabled = state.freeTimeMinutes === 0;
}); 