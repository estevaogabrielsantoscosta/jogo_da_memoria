// Memory Game - Versão com Sons Aprimorados
// Manipulação DOM, eventos, arrays, timer e modal

// ************ variáveis globais ****************
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let score = 0;
let timer = 0;
let timerInterval = null;
let gameActive = true;
let currentSize = 4;
let lockBoard = false;
let soundEnabled = true;
let stars = 0;

// ================== Dados do jogo ==============
const icons = [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
    '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
    '🐧', '🐦', '🐴', '🦄', '🐌', '🐝', '🐙', '🦋'
];

// ============= Sistema de Som Avançado ===============
class SoundManager {
    constructor() {
        this.enabled = true;
        this.ctx = null;
        this.initAudio();
    }

    initAudio() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API não suportada');
        }
    }

    // Função auxiliar para tocar notas
    playNote(frequency, duration, volume = 0.3, type = 'sine') {
        if (!this.enabled || !this.ctx) return;

        const oscillator = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.ctx.currentTime);
        
        // Envelope de volume (fade in/out suave)
        gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.02);
        gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);
        
        oscillator.start(this.ctx.currentTime);
        oscillator.stop(this.ctx.currentTime + duration);
    }

    // Som de ACERTO - melodia alegre e satisfatória
    playMatch() {
        if (!this.enabled || !this.ctx) return;

        // Primeira nota (Dó)
        this.playNote(523.25, 0.15, 0.3, 'sine');
        
        // Segunda nota (Mi) - com pequeno delay
        setTimeout(() => {
            this.playNote(659.25, 0.15, 0.3, 'sine');
        }, 120);
        
        // Terceira nota (Sol) - com delay
        setTimeout(() => {
            this.playNote(783.99, 0.2, 0.35, 'sine');
        }, 240);
        
        // Quarta nota (Dó agudo) - com delay
        setTimeout(() => {
            this.playNote(1046.50, 0.25, 0.3, 'sine');
        }, 380);
        
        // Arpejo ascendente completo
        setTimeout(() => {
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, i) => {
                setTimeout(() => {
                    this.playNote(freq, 0.1, 0.15, 'sine');
                }, i * 80);
            });
        }, 500);
    }

    // Som de PAR ENCONTRADO - mais curto e alegre
    playPairFound() {
        if (!this.enabled || !this.ctx) return;

        // Três notas rápidas ascendentes
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playNote(freq, 0.1, 0.25, 'sine');
            }, i * 100);
        });
    }

    // Som de VIRAR CARTA
    playFlip() {
        if (!this.enabled || !this.ctx) return;
        this.playNote(440, 0.08, 0.15, 'sine');
    }

    // Som de ERRO
    playWrong() {
        if (!this.enabled || !this.ctx) return;
        this.playNote(220, 0.25, 0.2, 'sawtooth');
        setTimeout(() => {
            this.playNote(180, 0.3, 0.15, 'sawtooth');
        }, 150);
    }

    // Som de VITÓRIA - melodia épica
    playVictory() {
        if (!this.enabled || !this.ctx) return;

        // Melodia de vitória (Trecho de "Ode à Alegria" simplificado)
        const melody = [
            { note: 523.25, duration: 0.2 }, // Dó
            { note: 523.25, duration: 0.2 }, // Dó
            { note: 587.33, duration: 0.2 }, // Ré
            { note: 587.33, duration: 0.2 }, // Ré
            { note: 659.25, duration: 0.3 }, // Mi
            { note: 659.25, duration: 0.2 }, // Mi
            { note: 587.33, duration: 0.4 }, // Ré
            { note: 523.25, duration: 0.2 }, // Dó
            { note: 523.25, duration: 0.2 }, // Dó
            { note: 587.33, duration: 0.2 }, // Ré
            { note: 587.33, duration: 0.2 }, // Ré
            { note: 659.25, duration: 0.3 }, // Mi
            { note: 659.25, duration: 0.2 }, // Mi
            { note: 587.33, duration: 0.5 }, // Ré
        ];

        melody.forEach((noteData, i) => {
            setTimeout(() => {
                this.playNote(noteData.note, noteData.duration, 0.25, 'sine');
            }, i * 180);
        });

        // Arpejo final
        setTimeout(() => {
            const finalNotes = [523.25, 659.25, 783.99, 1046.50];
            finalNotes.forEach((freq, i) => {
                setTimeout(() => {
                    this.playNote(freq, 0.2, 0.2, 'sine');
                }, i * 100);
            });
        }, melody.length * 180 + 200);
    }

    // Som de INÍCIO DO JOGO
    playStart() {
        if (!this.enabled || !this.ctx) return;
        this.playNote(440, 0.1, 0.15, 'sine');
        setTimeout(() => {
            this.playNote(554.37, 0.1, 0.15, 'sine');
        }, 120);
        setTimeout(() => {
            this.playNote(659.25, 0.15, 0.2, 'sine');
        }, 240);
    }

    // Interface unificada para tocar sons
    play(type) {
        switch(type) {
            case 'flip':
                this.playFlip();
                break;
            case 'match':
                this.playMatch();
                break;
            case 'pair':
                this.playPairFound();
                break;
            case 'wrong':
                this.playWrong();
                break;
            case 'victory':
                this.playVictory();
                break;
            case 'start':
                this.playStart();
                break;
            default:
                break;
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

const soundManager = new SoundManager();

// ============= Funções principais ===============

function startGame(size) {
    // Limpar timer se existir
    if (timerInterval) clearInterval(timerInterval);
    
    // Resetar variáveis
    timer = 0;
    moves = 0;
    score = 0;
    matchedPairs = 0;
    flippedCards = [];
    gameActive = true;
    lockBoard = false;
    currentSize = size;
    stars = 0;

    updateUI();
    
    // Configurar cartas
    const totalCards = size * size;
    const totalPairs = totalCards / 2;
    const selectedIcons = icons.slice(0, totalPairs);
    let cardIcons = [...selectedIcons, ...selectedIcons];

    // Embaralhar (Fisher-Yates)
    for (let i = cardIcons.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cardIcons[i], cardIcons[j]] = [cardIcons[j], cardIcons[i]];
    }

    cards = cardIcons.map((icon, index) => ({
        id: index,
        icon: icon,
        flipped: false,
        matched: false
    }));

    renderBoard();
    startTimer();
    soundManager.play('start');
    updateStars();
}

function renderBoard() {
    const board = document.getElementById('gameBoard');
    const cols = currentSize;
    board.className = 'row g-2 justify-content-center';
    board.innerHTML = '';

    // Calcular tamanho responsivo
    const colSize = currentSize === 4 ? 3 : 2;

    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const col = document.createElement('div');
        col.className = `col-${colSize}`;
        
        // Determinar conteúdo da carta
        let content = '';
        if (card.flipped || card.matched) {
            content = `<span class="card-icon">${card.icon}</span>`;
        } else {
            content = `<i class="bi bi-question-lg card-question"></i>`;
        }

        col.innerHTML = `
            <div class="memory-card ${card.flipped || card.matched ? 'flipped' : ''} ${card.matched ? 'matched' : ''}" 
                 onclick="flipCard(${card.id})"
                 style="animation-delay: ${i * 0.05}s">
                ${content}
            </div>
        `;
        board.append(col);
    }
}

function flipCard(cardID) {
    if (lockBoard || !gameActive || flippedCards.length >= 2) return;
    
    const card = cards[cardID];
    if (card.flipped || card.matched) return;
    
    card.flipped = true;
    flippedCards.push(card);
    
    renderBoard();
    soundManager.play('flip');

    if (flippedCards.length === 2) {
        moves++;
        updateUI();
        checkMatch();
    }
}

function checkMatch() {
    const [card1, card2] = flippedCards;

    if (card1.icon === card2.icon) {
        // 🎵 PAR ENCONTRADO! - Toca som de acerto
        card1.matched = true;
        card2.matched = true;
        card1.flipped = false;
        card2.flipped = false;

        matchedPairs++;
        score += 100;
        
        updateUI();
        
        // Toca som de par encontrado (mais curto e alegre)
        soundManager.play('pair');
        
        // Toca melodia completa de acerto (mais elaborada)
        setTimeout(() => {
            soundManager.play('match');
        }, 300);
        
        highlightMatch(card1.id, card2.id);

        if (matchedPairs === cards.length / 2) {
            gameVictory();
        }

        flippedCards = [];
        renderBoard();
        updateStars();
    } else {
        // Par não encontrado
        lockBoard = true;
        soundManager.play('wrong');

        // Efeito de erro nas cartas
        const cardElements = document.querySelectorAll('.memory-card');
        cardElements.forEach(el => {
            if (el.onclick && el.onclick.toString().includes(card1.id) || 
                el.onclick && el.onclick.toString().includes(card2.id)) {
                el.style.animation = 'shake 0.5s ease';
            }
        });

        setTimeout(() => {
            card1.flipped = false;
            card2.flipped = false;
            flippedCards = [];
            renderBoard();
            lockBoard = false;
        }, 800);
    }
}

function highlightMatch(cardId1, cardId2) {
    const cardsElements = document.querySelectorAll('.memory-card');
    cardsElements.forEach(el => {
        el.classList.add('match-animation');
        setTimeout(() => el.classList.remove('match-animation'), 400);
    });
}

function gameVictory() {
    gameActive = false;
    clearInterval(timerInterval);
    
    // Calcular bônus
    const timeBonus = Math.max(0, 300 - timer) * 10;
    const movesBonus = Math.max(0, 50 - moves) * 5;
    const totalScore = score + timeBonus + movesBonus;

    // Calcular estrelas
    const starsCount = moves <= 10 ? 3 : moves <= 20 ? 2 : 1;
    stars = starsCount;

    // 🎵 Toca melodia de vitória (épica!)
    soundManager.play('victory');
    
    const victoryModal = new bootstrap.Modal(document.getElementById('victoryModal'));
    
    const statsText = `
        <div class="victory-stats">
            <div class="stars-display">
                ${'⭐'.repeat(starsCount)}${'☆'.repeat(3 - starsCount)}
            </div>
            <p><i class="bi bi-clock"></i> Tempo: ${formatTime(timer)}</p>
            <p><i class="bi bi-arrows-move"></i> Movimentos: ${moves}</p>
            <p><i class="bi bi-star"></i> Bônus tempo: +${timeBonus}</p>
            <p><i class="bi bi-star"></i> Bônus movimentos: +${movesBonus}</p>
            <p><i class="bi bi-music-note"></i> Sons de vitória! 🎵</p>
        </div>
    `;

    document.getElementById('victoryStats').innerHTML = statsText;
    document.getElementById('finalScore').textContent = totalScore;
    victoryModal.show();
}

function resetGame() {
    startGame(currentSize);
}

function updateUI() {
    document.getElementById('moves').textContent = moves;
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = currentSize === 4 ? 1 : 2;
    document.getElementById('timer').textContent = formatTime(timer);
}

function startTimer() {
    timerInterval = setInterval(() => {
        if (gameActive) {
            timer++;
            document.getElementById('timer').textContent = formatTime(timer);
        }
    }, 1000);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateStars() {
    const starDisplay = document.getElementById('starDisplay');
    if (starDisplay) {
        const starsCount = moves <= 5 ? 3 : moves <= 10 ? 2 : moves <= 15 ? 1 : 0;
        starDisplay.textContent = '⭐'.repeat(starsCount);
    }
}

// ============= Event Listeners ===============

// Toggle de som
document.addEventListener('DOMContentLoaded', () => {
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
        soundToggle.addEventListener('change', function() {
            const enabled = soundManager.toggle();
            this.checked = enabled;
            // Feedback visual
            const label = this.closest('.form-check-label');
            if (label) {
                label.innerHTML = `
                    <input class="form-check-input" type="checkbox" id="soundToggle" ${enabled ? 'checked' : ''}>
                    <i class="bi ${enabled ? 'bi-volume-up' : 'bi-volume-mute'}"></i>
                    ${enabled ? 'Sons' : 'Silenciado'}
                `;
            }
        });
    }

    // Iniciar com 4x4
    startGame(4);
});