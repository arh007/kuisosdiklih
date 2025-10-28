// =================== SELECTOR ===================
const layarAwal = document.getElementById('start-screen');
const layarKuis = document.getElementById('quiz-screen');
const layarHasil = document.getElementById('result-screen');
const layarPapanSkor = document.getElementById('leaderboard-screen');

const inputNama = document.getElementById('player-name');
const tombolMulai = document.getElementById('btn-start');
const tombolLihatPapan = document.getElementById('btn-view-leaderboard');
const teksPemain = document.getElementById('player-display');
const timerEl = document.getElementById('time-left');
const teksPertanyaan = document.getElementById('question-text');
const wadahJawaban = document.getElementById('answers');
const tombolBerikutnya = document.getElementById('btn-next');
const teksHasil = document.getElementById('result-text');
const skorAkhirEl = document.getElementById('final-score');
const tombolUlang = document.getElementById('btn-restart');
const tombolSimpan = document.getElementById('btn-save');
const tombolKembali = document.getElementById('btn-back');
const tombolHapus = document.getElementById('btn-clear');
const daftarPapanSkor = document.getElementById('leaderboard-list');
const comboContainer = document.getElementById('combo-container');

// Achievement container
let achievementContainer;

// Suara
const suaraBenar = new Audio('benar.mp3');
const suaraSalah = new Audio('salah.mp3');
const suaraTimeout = new Audio('timeout.mp3');

// =================== VARIABLE GLOBAL ===================
let namaPemain = '';
let daftarPertanyaan = [];
let indexSoal = 0;
let skor = 0;
let timer = null;
let sisaWaktu = 15;
let comboStreak = 0;
let totalWaktuJawab = 0;
let totalSoalDijawab = 0;

const WAKTU_PER_SOAL = 15;
const KEY_PENYIMPANAN = 'quizcoy_papan_skor';

// =================== FUNCTION UTILITY ===================
function acakArray(arr) {
  return arr.map(v => ({ v, r: Math.random() }))
            .sort((a, b) => a.r - b.r)
            .map(x => x.v);
}

function tampilkanLayar(layar) {
  [layarAwal, layarKuis, layarHasil, layarPapanSkor].forEach(l => l.classList.add('hidden'));
  layar.classList.remove('hidden');
}

// =================== GAMEPLAY ===================
function mulaiKuis() {
  namaPemain = inputNama.value.trim() || 'Pemain';
  teksPemain.textContent = `Pemain: ${namaPemain}`;
  daftarPertanyaan = acakArray(PERTANYAAN).slice(0, 10);
  indexSoal = 0;
  skor = 0;
  comboStreak = 0;
  totalWaktuJawab = 0;
  totalSoalDijawab = 0;

  tampilkanLayar(layarKuis);
  tampilkanSoal(true);
}

function tampilkanSoal(isFirst = false) {
  clearInterval(timer);
  sisaWaktu = WAKTU_PER_SOAL;
  timerEl.textContent = sisaWaktu;

  const q = daftarPertanyaan[indexSoal];
  wadahJawaban.innerHTML = '';
  teksPertanyaan.textContent = `(${indexSoal + 1}/${daftarPertanyaan.length}) ${q.q}`;

  q.a.forEach((opsi, idx) => {
    const btn = document.createElement('button');
    btn.className = 'answer';
    btn.textContent = opsi;
    btn.dataset.index = idx;
    btn.addEventListener('click', jawab);
    wadahJawaban.appendChild(btn);
  });

  tombolBerikutnya.disabled = true;

  if (!isFirst) {
    teksPertanyaan.classList.add('fade-in');
    setTimeout(() => teksPertanyaan.classList.remove('fade-in'), 400);
  }

  timer = setInterval(() => {
    sisaWaktu -= 1;
    timerEl.textContent = sisaWaktu;

    if (sisaWaktu <= 3) {
      timerEl.style.color = 'red';
      timerEl.style.fontWeight = 'bold';
    } else {
      timerEl.style.color = '';
      timerEl.style.fontWeight = '';
    }

    if (sisaWaktu <= 0) {
      clearInterval(timer);
      waktuHabis();
    }
  }, 1000);
}

function jawab(e) {
  clearInterval(timer);
  const pilihan = Number(e.currentTarget.dataset.index);
  const q = daftarPertanyaan[indexSoal];
  const semuaTombol = Array.from(wadahJawaban.children);
  semuaTombol.forEach(b => b.removeEventListener('click', jawab));

  totalWaktuJawab += (WAKTU_PER_SOAL - sisaWaktu);
  totalSoalDijawab++;

  if (pilihan === q.correct) {
    e.currentTarget.classList.add('correct');
    suaraBenar.play();
    comboStreak++;

    if (comboStreak >= 3) tampilkanCombo(comboStreak);
    skor += 10; // ✅ poin tetap 10 per soal benar
  } else {
    e.currentTarget.classList.add('wrong');
    suaraSalah.play();
    semuaTombol[q.correct].classList.add('correct');
    comboStreak = 0;
  }

  tombolBerikutnya.disabled = false;
}

function tampilkanCombo(combo) {
  const comboEl = document.createElement('div');
  comboEl.className = 'combo-text';
  comboEl.textContent = `🔥 Combo ${combo}x!`;

  comboContainer.appendChild(comboEl);
  comboEl.addEventListener('animationend', () => comboEl.remove());
}

function waktuHabis() {
  suaraTimeout.play();
  const tombol = Array.from(wadahJawaban.children);
  const q = daftarPertanyaan[indexSoal];

  if (tombol[q.correct]) tombol[q.correct].classList.add('correct');
  tombol.forEach(b => b.removeEventListener('click', jawab));

  comboStreak = 0;
  tombolBerikutnya.disabled = false;
}

// =================== NAVIGASI SOAL ===================
tombolBerikutnya.addEventListener('click', () => {
  indexSoal += 1;
  if (indexSoal >= daftarPertanyaan.length) {
    selesaiKuis();
  } else {
    tampilkanSoal();
  }
});

// =================== SELESAI KUIS ===================
function selesaiKuis() {
  clearInterval(timer);
  teksHasil.textContent = `Terima kasih ${namaPemain}! Kamu sudah menyelesaikan kuis.`;
  skorAkhirEl.textContent = skor;
  tampilkanLayar(layarHasil);

  if (skor >= 50) {
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
  }

  tampilkanAchievement();
}

function tampilkanAchievement() {
  if (achievementContainer) achievementContainer.remove();
  achievementContainer = document.createElement('div');
  achievementContainer.style.marginTop = '10px';

  if (skor === daftarPertanyaan.length * 10) addAchievement("🏆 Perfect! Semua benar!");
  const avgTime = totalWaktuJawab / totalSoalDijawab;
  if (avgTime < 5) addAchievement("⚡ Cepat Tanggap! Rata-rata jawab < 5 detik!");
  if (skor < 50) addAchievement("💪 Tahan Banting! Tetap main walau banyak salah 😆");

  layarHasil.appendChild(achievementContainer);
}

function addAchievement(text) {
  const div = document.createElement('div');
  div.className = 'achievement';
  div.textContent = text;
  achievementContainer.appendChild(div);
}

// =================== LEADERBOARD DARI GOOGLE SHEET (DENGAN MEDALI) ===================

// === KONFIGURASI SPREADSHEET ===
const SPREADSHEET_ID = "14EVLurxHgHcdxtyYio1tieCysz65BabHCqcxLT9joyo"; // Ganti sesuai ID kamu
const SHEET_NAME = "Sheet1";
const SHEET_URL = `https://opensheet.elk.sh/${SPREADSHEET_ID}/${SHEET_NAME}`;

// Ambil data leaderboard langsung dari Google Sheets
async function loadPapanSkorDariSpreadsheet() {
  daftarPapanSkor.innerHTML = "<li>⏳ Memuat data dari Spreadsheet...</li>";

  try {
    const res = await fetch(SHEET_URL);
    const data = await res.json();

    // Filter dan urutkan dari skor tertinggi
    const sorted = data
      .filter(row => row.Nama && row.Skor)
      .sort((a, b) => parseInt(b.Skor) - parseInt(a.Skor));

    daftarPapanSkor.innerHTML = "";

    sorted.forEach((row, i) => {
      const li = document.createElement("li");

      // Tentukan medali berdasarkan peringkat
      let medali = "";
      if (i === 0) medali = "🥇";
      else if (i === 1) medali = "🥈";
      else if (i === 2) medali = "🥉";
      else medali = `#${i + 1}`;

      // Tambahkan gaya berbeda untuk tiga besar
      const warna = i === 0 ? "#ffd700" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "#fff";

      li.innerHTML = `
        <span style="color:${warna}; font-weight:700;">${medali}</span>
        <span style="margin-left:8px;">${row.Nama}</span>
        <strong style="float:right; color:${warna};">${row.Skor} poin</strong>
      `;

      li.style.padding = "8px 12px";
      li.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
      li.style.display = "flex";
      li.style.justifyContent = "space-between";
      li.style.alignItems = "center";
      li.style.transition = "transform 0.2s ease";

      // Efek hover lembut
      li.addEventListener("mouseover", () => {
        li.style.transform = "scale(1.02)";
        li.style.backgroundColor = "rgba(255,255,255,0.05)";
      });
      li.addEventListener("mouseout", () => {
        li.style.transform = "scale(1)";
        li.style.backgroundColor = "transparent";
      });

      daftarPapanSkor.appendChild(li);
    });

  } catch (err) {
    console.error(err);
    daftarPapanSkor.innerHTML = "<li>⚠️ Gagal memuat data dari Spreadsheet.</li>";
  }
}

function tampilkanPapanSkor() {
  tampilkanLayar(layarPapanSkor);
  loadPapanSkorDariSpreadsheet(); // 🔥 ambil langsung dari Spreadsheet
}
// =================== SIMPAN SKOR ===================
function simpanSkor() {
  try {
    const skorTersimpan = JSON.parse(localStorage.getItem(KEY_PENYIMPANAN)) || [];
    skorTersimpan.push({ nama: namaPemain, skor: skor });
    skorTersimpan.sort((a, b) => b.skor - a.skor);
    localStorage.setItem(KEY_PENYIMPANAN, JSON.stringify(skorTersimpan));

    console.log("💾 Skor tersimpan ke localStorage:", { nama: namaPemain, skor: skor });
  } catch (err) {
    console.error("⚠️ Gagal menyimpan skor:", err);
  }
}

// =================== EVENT LISTENER ===================
tombolMulai.addEventListener('click', mulaiKuis);
tombolUlang.addEventListener('click', () => tampilkanLayar(layarAwal));
tombolSimpan.addEventListener('click', async () => {
  // Simpan ke localStorage seperti biasa
  simpanSkor();

  // Kirim ke Google Spreadsheet juga
  const nama = namaPemain || "Anonim";
  const dataKirim = { nama, skor};

  try {
    await fetch("https://script.google.com/macros/s/AKfycbzpCD_IqdAAf4wH4dvrnzhfrl5csq270FzBTllsev09oIPBI3SLzh8qSXwBtAQFrPyf/exec", {
      method: "POST",
      mode: "no-cors", // penting agar tidak kena CORS
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataKirim)
    });

    alert("✅ Skor berhasil dikirim ke spreadsheet!");
  } catch (err) {
    alert("⚠️ Gagal mengirim skor: " + err);
  }

  tampilkanPapanSkor();
});

tombolLihatPapan.addEventListener('click', tampilkanPapanSkor);
tombolKembali.addEventListener('click', () => tampilkanLayar(layarAwal));
tombolHapus.addEventListener('click', () => {
  if (confirm('Hapus semua data papan skor?')) {
    localStorage.removeItem(KEY_PENYIMPANAN);
    renderPapanSkor();
  }
});

inputNama.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') mulaiKuis();
});

document.addEventListener('DOMContentLoaded', () => {
  tampilkanLayar(layarAwal);
});

