document.addEventListener("DOMContentLoaded", () => {
  // Ekran Elementleri
  const loadingScreen = document.getElementById("loading-screen");
  const gameScreen = document.getElementById("game-screen");
  const giftIntro = document.getElementById("gift-intro");
  const flowersContainer = document.getElementById("flowers-container");

  // Oyun Elementleri
  const gameCard = document.querySelector(".game-card");
  const puzzleBoard = document.getElementById("puzzle-board");
  const feedbackBox = document.getElementById("feedback-box");
  const feedbackIconEl = feedbackBox.querySelector(".feedback-icon");
  const feedbackTextEl = document.getElementById("feedback-text");
  const heartsContainer = document.getElementById("hearts-container");
  const guessForm = document.getElementById("guess-form");
  const sentenceInput = document.getElementById("sentence-input");
  const guessBtn = document.getElementById("guess-btn");
  const hintBtn = document.getElementById("hint-btn");
  const hintCountEl = document.getElementById("hint-count");
  const skipBtn = document.getElementById("skip-btn");

  // SVG İkon Seti
  const ICONS = {
    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
    bulb: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
    error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    heart: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`
  };

  // Gizli Cümle ve Oyun Ayarları
  const TARGET_WORDS = ["İYİ", "Kİ", "ÖĞRETMENİMSİN"];

  const HINTS = [
    "1. İpucu: Cümle 'İYİ Kİ' kelimeleriyle başlıyor...",
    "2. İpucu: Son kelime 13 harfli ve sizin kutsal mesleğinize hitap ediyor...",
    "3. İpucu: Sizin için birkaç harf daha açıldı!"
  ];

  let chances = 5;
  let hintIndex = 0;
  let guessedLetters = new Set();
  let isGameFinished = false;

  // Türkçe karakter duyarlı normalizasyon ("iyiki" veya "iyi ki" ikisi de kabul edilir)
  function normalizeTurkish(str) {
    return str
      .trim()
      .toLocaleUpperCase("tr-TR")
      .replace(/\s+/g, "");
  }

  // 1. AŞAMA -> 2. AŞAMA: Yükleme ekranından Bilmece ekranına geçiş
  setTimeout(() => {
    loadingScreen.classList.remove("active");
    gameScreen.classList.add("active");
  }, 2300);

  // Bulmaca Tahtasını Oluştur
  function renderBoard(markSolvedGold = false) {
    puzzleBoard.innerHTML = "";

    // İlk 2 kelime ("İYİ" ve "Kİ") üst satırda yan yana
    const topRow = document.createElement("div");
    topRow.className = "word-pair";

    [TARGET_WORDS[0], TARGET_WORDS[1]].forEach((word) => {
      const wordGroup = document.createElement("div");
      wordGroup.className = "word-row";
      for (const char of word) {
        const slot = document.createElement("div");
        slot.className = "letter-slot";
        if (guessedLetters.has(char) || markSolvedGold) {
          slot.textContent = char;
          slot.classList.add("revealed");
          if (markSolvedGold) slot.classList.add("solved-gold");
        }
        wordGroup.appendChild(slot);
      }
      topRow.appendChild(wordGroup);
    });

    // 3. kelime ("ÖĞRETMENİMSİN") alt satırda tek parça
    const bottomRow = document.createElement("div");
    bottomRow.className = "word-row";
    for (const char of TARGET_WORDS[2]) {
      const slot = document.createElement("div");
      slot.className = "letter-slot";
      if (guessedLetters.has(char) || markSolvedGold) {
        slot.textContent = char;
        slot.classList.add("revealed");
        if (markSolvedGold) slot.classList.add("solved-gold");
      }
      bottomRow.appendChild(slot);
    }

    puzzleBoard.appendChild(topRow);
    puzzleBoard.appendChild(bottomRow);
  }

  // Kalan Şans Kalplerini Güncelle
  function updateHearts() {
    const hearts = heartsContainer.querySelectorAll(".heart");
    hearts.forEach((heart, idx) => {
      if (idx >= chances) {
        heart.classList.add("lost");
      }
    });
  }

  // Mesaj Kutusunu İkonla Birlikte Güncelle
  function setFeedback(text, type = "normal", iconKey = "info") {
    feedbackTextEl.textContent = text;
    feedbackIconEl.innerHTML = ICONS[iconKey] || ICONS.info;
    feedbackBox.className = "feedback-box";
    if (type === "error") feedbackBox.classList.add("error");
    if (type === "success") feedbackBox.classList.add("success");
  }

  // Kart Titreme Efekti
  function triggerShake() {
    gameCard.classList.remove("shake");
    void gameCard.offsetWidth;
    gameCard.classList.add("shake");
  }

  // Tüm harfler açıldı mı kontrol et
  function checkAllLettersRevealed() {
    const fullPhrase = TARGET_WORDS.join("");
    for (const char of fullPhrase) {
      if (!guessedLetters.has(char)) return false;
    }
    return true;
  }

  // Cümle Tahmini İşlemi
  guessForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (isGameFinished) return;

    const userGuess = normalizeTurkish(sentenceInput.value);
    const targetNormalized = normalizeTurkish(TARGET_WORDS.join(" "));

    if (!userGuess) {
      setFeedback("Lütfen kutuya bir cümle tahmini yazın.", "error", "error");
      return;
    }

    if (userGuess === targetNormalized) {
      finishGame(true);
    } else {
      sentenceInput.value = "";
      loseChance("Tam olarak bu değil hocam, tekrar deneyebilirsiniz!");
    }
  });

  // Şans Azaltma ve 5 Şans Bitimi Kontrolü
  function loseChance(reasonText) {
    chances = Math.max(0, chances - 1);
    updateHearts();
    triggerShake();

    if (chances === 0) {
      finishGame(false);
    } else {
      setFeedback(`${reasonText} (Kalan şansınız: ${chances})`, "error", "error");
    }
  }

  // İpucu Tuşu İşlemi
  hintBtn.addEventListener("click", () => {
    if (isGameFinished || hintIndex >= HINTS.length) return;

    setFeedback(HINTS[hintIndex], "normal", "bulb");

    // 1. ipucunda "İ" harfini aç, 3. ipucunda "Ö", "E", "M" harflerini aç
    if (hintIndex === 0) {
      revealSpecificLetters(["İ"]);
    } else if (hintIndex === 2) {
      revealSpecificLetters(["Ö", "E", "M"]);
    }

    hintIndex++;
    hintCountEl.textContent = String(HINTS.length - hintIndex);

    if (hintIndex >= HINTS.length) {
      hintBtn.disabled = true;
    }

    if (checkAllLettersRevealed()) {
      finishGame(true);
    }
  });

  function revealSpecificLetters(letters) {
    letters.forEach((l) => {
      guessedLetters.add(l);
    });
    renderBoard();
  }

  // Oyunu Bitir (Bildiyse veya 5 Şans Dolduysa)
  function finishGame(isWin) {
    isGameFinished = true;
    sentenceInput.disabled = true;
    guessBtn.disabled = true;
    hintBtn.disabled = true;
    skipBtn.disabled = true;

    renderBoard(true);

    if (isWin) {
      setFeedback("Tebrikler Hocam! Doğru cevap: İYİ Kİ ÖĞRETMENİMSİN", "success", "success");
    } else {
      setFeedback(
        "Olsun hocam, sizin varlığınız en güzel cevap! Doğru cümle: İYİ Kİ ÖĞRETMENİMSİN",
        "normal",
        "heart"
      );
    }

    setTimeout(() => {
      startGiftTransition();
    }, 2200);
  }

  // Öğretmen İstemezse Geçme Tuşu
  skipBtn.addEventListener("click", () => {
    if (isGameFinished) return;
    isGameFinished = true;
    startGiftTransition();
  });

  // 3. AŞAMA -> 4. AŞAMA: Hediye Yazısı ve Ardından Çiçeklerin Açılışı
  function startGiftTransition() {
    gameScreen.classList.remove("active");

    // "Bu da benden siz öğretmenlerime hediye" yazısını zarifçe getir
    setTimeout(() => {
      giftIntro.classList.add("active");
    }, 450);

    // Yazı okunduktan sonra zarif bir animasyonla kaybolsun
    setTimeout(() => {
      giftIntro.classList.add("fade-out");
    }, 3600);

    // Yazı kaybolurken çiçek ekranı ve animasyonları başlasın
    setTimeout(() => {
      giftIntro.classList.remove("active");
      flowersContainer.classList.add("show-flowers");
      document.body.classList.remove("not-loaded");
    }, 4750);
  }

  // Başlangıçta tahtayı çiz
  renderBoard();
});
