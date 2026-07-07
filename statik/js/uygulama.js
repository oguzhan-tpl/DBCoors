/* -------------------------------------------------------------
   DBCreator Client Core Controller - Premium AI DBMS
   Handles multiple chat sessions, dynamic robot states, and grid editing
   ------------------------------------------------------------- */

let guncelTablo = '';
let guncelSema = {};
let guncelBaglantiMetni = '';
let guncelDosyaAdi = '';

// DOM Elements
const landingEkrani = document.getElementById('landing-ekrani');
const anaDashboard = document.getElementById('ana-dashboard');

const apiAnahtariGirdisi = document.getElementById('api-anahtari');
const dosyaSecBtn = document.getElementById('dosya-sec-btn');
const dosyaAdiEtiketi = document.getElementById('dosya-adi-etiketi');

const linkGirdisi = document.getElementById('link-girdisi');
const linkCekBtn = document.getElementById('link-cek-btn');

const yeniDbAdi = document.getElementById('yeni-db-adi');
const yeniDbBtn = document.getElementById('yeni-db-btn');
const ornekDbBtn = document.getElementById('ornek-db-btn');

const bagliDbYolu = document.getElementById('bagli-db-yolu');
const durumNoktasi = document.getElementById('durum-noktasi');
const baglantiyiKesBtn = document.getElementById('baglantiyi-kes-btn');

// Stats Elements
const metrikTablo = document.getElementById('metrik-tablo');
const metrikSatir = document.getElementById('metrik-satir');
const metrikBoyut = document.getElementById('metrik-boyut');

// Navigation Tabs
const navLinkler = document.querySelectorAll('.nav-link');
const paneller = document.querySelectorAll('.viewport-panel');

// Explorer Tree View
const sidebarTabloListesi = document.getElementById('sidebar-tablo-listesi');

// Spreadsheet Elements
const aktifTabloBaslik = document.getElementById('aktif-tablo-baslik');
const tabloAksiyonlar = document.getElementById('tablo-aksiyonlar');
const tabloAramaFiltre = document.getElementById('tablo-arama-filtre');
const satirEkleBtn = document.getElementById('satir-ekle-btn');
const secilenleriSilBtn = document.getElementById('secilenleri-sil-btn');
const tabloSilBtn = document.getElementById('tablo-sil-btn');
const disaAktarBtn = document.getElementById('disa-aktar-btn');
const veriTablosu = document.getElementById('veri-tablosu');

// SQL Console Elements
const sqlRunnerToggle = document.getElementById('sql-runner-toggle');
const sqlRunnerSabit = document.querySelector('.sql-runner-sabit');
const manuelSorgu = document.getElementById('manuel-sorgu');
const manuelSorguBtn = document.getElementById('manuel-sorgu-btn');

// AI Analytics Elements
const anomaliBtn = document.getElementById('anomali-btn');
const iliskiBtn = document.getElementById('iliski-btn');
const apiUretBtn = document.getElementById('api-uret-btn');
const ileriYzSonuc = document.getElementById('ileri-yz-sonuc');

const uretTabloAdi = document.getElementById('uret-tablo-adi');
const uretAdet = document.getElementById('uret-adet');
const veriUretBtn = document.getElementById('veri-uret-btn');

// Robot Assistant & Chat Drawer Elements
const robotFace = document.getElementById('robot-face');
const robotDurumBaslik = document.getElementById('robot-durum-baslik');
const robotDurumAlt = document.getElementById('robot-durum-alt');

const sohbetSecici = document.getElementById('sohbet-secici');
const yeniSohbetBtn = document.getElementById('yeni-sohbet-btn');
const sohbetSilBtn = document.getElementById('sohbet-sil-btn');
const chatGecmisi = document.getElementById('chat-gecmisi');
const chatGirdi = document.getElementById('chat-girdi');
const chatGonderBtn = document.getElementById('chat-gonder-btn');

// Notification Elements
const bildirimBtn = document.getElementById('bildirim-btn');
const bildirimPaneli = document.getElementById('bildirim-paneli');
const bildirimSayaci = document.getElementById('bildirim-sayaci');
const bildirimListesi = document.getElementById('bildirim-listesi');

// Operation Modal Elements
const aiIslemModal = document.getElementById('ai-islem-modal');
const islemModalMetni = document.getElementById('islem-modal-metni');
const islemKodOnizleme = document.getElementById('islem-kod-onizleme');
const islemKodAlani = document.getElementById('islem-kod-alani');
const analizYukleniyor = document.getElementById('analiz-yukleniyor');

// State Constants
let okunmamisBildirim = 0;
let activeConversations = [];
let activeChatId = '';

/* -------------------------------------------------------------
   INITIALIZATION
   ------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Load saved config details
    const savedApiKey = localStorage.getItem('dbcoors_api_anahtari');
    const savedConnection = localStorage.getItem('dbcoors_baglanti_metni');
    const savedFileName = localStorage.getItem('dbcoors_dosya_adi');
    
    if (savedApiKey) apiAnahtariGirdisi.value = savedApiKey;
    
    // 2. Setup multiple chat sessions
    setupConversations();
    
    // 3. Connect to DB if details are cached
    if (savedConnection) {
        guncelBaglantiMetni = savedConnection;
        guncelDosyaAdi = savedFileName || savedConnection.split('/').pop();
        baglantiKur();
    } else {
        // Stay in Landing screen
        landingEkrani.style.display = 'flex';
        anaDashboard.style.display = 'none';
    }
});

apiAnahtariGirdisi.addEventListener('input', () => {
    localStorage.setItem('dbcoors_api_anahtari', apiAnahtariGirdisi.value);
});

// Navigation Toggle
navLinkler.forEach(link => {
    link.addEventListener('click', () => {
        navLinkler.forEach(l => l.classList.remove('aktif'));
        paneller.forEach(p => p.classList.remove('aktif'));
        
        link.classList.add('aktif');
        const target = document.getElementById(link.dataset.hedef);
        if (target) target.classList.add('aktif');
    });
});

// SQL Console Toggle Collapse
sqlRunnerToggle.addEventListener('click', () => {
    sqlRunnerSabit.classList.toggle('kapali');
});

/* -------------------------------------------------------------
   ROBOT STATE CONTROLLER
   ------------------------------------------------------------- */
function setRobotState(state, desc) {
    // states: idle, thinking, success, error
    robotFace.className.baseVal = `robot-face-svg state-${state}`;
    robotDurumAlt.textContent = desc || "Beklemede / Idle";
    
    if (state === 'thinking') {
        robotDurumBaslik.textContent = "DBCoors Düşünüyor";
    } else if (state === 'success') {
        robotDurumBaslik.textContent = "İşlem Başarılı";
        setTimeout(() => setRobotState('idle', 'Sistem Hazır / Idle'), 3000);
    } else if (state === 'error') {
        robotDurumBaslik.textContent = "İşlem Başarısız";
        setTimeout(() => setRobotState('idle', 'Sistem Hazır / Idle'), 4000);
    } else {
        robotDurumBaslik.textContent = "DBCoors Asistan";
    }
}

/* -------------------------------------------------------------
   DATABASE CONNECTION & DATA LOADING
   ------------------------------------------------------------- */
async function baglantiKur() {
    if (!guncelBaglantiMetni) return;
    
    analizYukleniyor.style.display = 'flex';
    setRobotState('thinking', 'Veritabanına bağlanılıyor...');
    
    try {
        const data = await apiIstegi('/api/sema', { baglanti_metni: guncelBaglantiMetni });
        guncelSema = data.sema;
        
        // Render dynamic tree layout
        semayiTreeCiz(guncelSema);
        
        // Load stats
        await istatistikleriGuncelle();
        
        // Cache credentials
        localStorage.setItem('dbcoors_baglanti_metni', guncelBaglantiMetni);
        localStorage.setItem('dbcoors_dosya_adi', guncelDosyaAdi);
        
        // Show dashboard viewport, hide landing screen
        landingEkrani.style.display = 'none';
        anaDashboard.style.display = 'flex';
        
        bagliDbYolu.textContent = guncelDosyaAdi;
        durumNoktasi.className = 'nokta aktif';
        setRobotState('success', 'Veritabanı bağlantısı kuruldu');
        
    } catch (hata) {
        setRobotState('error', 'Bağlantı hatası: ' + hata.message);
        durumNoktasi.className = 'nokta pasif';
        bagliDbYolu.textContent = 'Bağlantı Hatası';
        await alert('Veritabanına bağlanılamadı: ' + hata.message);
        
        // Revert to Landing screen
        localStorage.removeItem('dbcoors_baglanti_metni');
        landingEkrani.style.display = 'flex';
        anaDashboard.style.display = 'none';
    } finally {
        analizYukleniyor.style.display = 'none';
    }
}

// Global Stats update
async function istatistikleriGuncelle() {
    try {
        const stats = await apiIstegi('/api/istatistik', { baglanti_metni: guncelBaglantiMetni });
        metrikTablo.textContent = stats.tablo_sayisi;
        metrikSatir.textContent = stats.toplam_satir;
        metrikBoyut.textContent = stats.dosya_boyutu || "N/A";
    } catch(err) {
        console.error("Metrikler güncellenemedi", err);
    }
}

// Disconnect DB
baglantiyiKesBtn.addEventListener('click', () => {
    localStorage.removeItem('dbcoors_baglanti_metni');
    localStorage.removeItem('dbcoors_dosya_adi');
    guncelBaglantiMetni = '';
    guncelDosyaAdi = '';
    landingEkrani.style.display = 'flex';
    anaDashboard.style.display = 'none';
});

/* -------------------------------------------------------------
   LANDING SCREEN EVENT LISTENERS
   ------------------------------------------------------------- */

// Option 1: File selection
dosyaSecBtn.addEventListener('click', async () => {
    dosyaSecBtn.disabled = true;
    dosyaSecBtn.textContent = 'Pencere Açılıyor...';
    try {
        const yanit = await fetch('/api/yerel-dosya-sec');
        if (!yanit.ok) throw new Error('Dosya seçimi iptal edildi.');
        const veri = await yanit.json();
        
        if (veri.baglanti_metni) {
            dosyaAdiEtiketi.textContent = veri.dosya_adi;
            guncelBaglantiMetni = veri.baglanti_metni;
            guncelDosyaAdi = veri.dosya_adi;
            baglantiKur();
        } else {
            dosyaAdiEtiketi.textContent = 'İptal edildi.';
        }
    } catch (hata) {
        dosyaAdiEtiketi.textContent = 'Dosya seçilemedi.';
    } finally {
        dosyaSecBtn.disabled = false;
        dosyaSecBtn.textContent = 'Dosya Seç';
    }
});

// Option 2: Pull from Link (or Connect directly to remote DB)
linkCekBtn.addEventListener('click', async () => {
    let url = linkGirdisi.value.trim();
    const apiKey = apiAnahtariGirdisi.value;
    
    if (!url) { await alert('Lütfen geçerli bir web sitesi linki veya veritabanı bağlantı adresi (mysql://) girin.'); return; }
    
    // Check if the user entered a direct database connection string
    if (url.startsWith('mysql://') || url.startsWith('mysql+pymysql://') || url.startsWith('postgresql://') || url.startsWith('sqlite://')) {
        if (url.startsWith('mysql://')) {
            url = url.replace('mysql://', 'mysql+pymysql://'); // Add driver for SQLAlchemy
        }
        
        let dbName = "Uzak DB";
        try {
            dbName = "Uzak DB: " + url.split('@')[1].split('/')[0].split(':')[0];
        } catch(e) {}

        guncelBaglantiMetni = url;
        guncelDosyaAdi = dbName;
        linkGirdisi.value = '';
        baglantiKur();
        return;
    }
    
    if (!apiKey) { await alert('Web sitesinden veri çekmek ve şema tasarlamak için Gemini API Anahtarı gereklidir. Uzak veritabanlarına bağlanmak için API anahtarına gerek yoktur.'); return; }
    
    islemModuAc('Web sayfası okunuyor, lütfen bekleyin...');
    setRobotState('thinking', 'Web sitesi verileri kazınıyor...');
    
    // Simulate steps for maximum cybernetic feeling
    setTimeout(() => {
        if(islemModalMetni) islemModalMetni.textContent = 'Yapay zeka veritabanı şemasını tasarlıyor...';
    }, 3000);
    
    setTimeout(() => {
        if(islemModalMetni) islemModalMetni.textContent = 'Veriler SQLite veritabanına yazılıyor...';
    }, 6000);

    try {
        const res = await apiIstegi('/api/linkten-cek', {
            url: url,
            api_anahtari: apiKey
        });
        
        islemModuKapat();
        guncelBaglantiMetni = res.baglanti_metni;
        guncelDosyaAdi = res.dosya_adi;
        linkGirdisi.value = '';
        
        baglantiKur();
    } catch(err) {
        islemModuKapat();
        setRobotState('error', 'Hata: ' + err.message);
        await alert('Veri çekilemedi: ' + err.message);
    }
});

// Option 3: Create empty database
yeniDbBtn.addEventListener('click', async () => {
    const dbAdi = yeniDbAdi.value.trim();
    if (!dbAdi) { await alert('Lütfen veritabanı adı girin.'); return; }
    
    analizYukleniyor.style.display = 'flex';
    try {
        const veri = await apiIstegi('/api/vt-olustur', { dosya_adi: dbAdi });
        guncelBaglantiMetni = veri.baglanti_metni;
        guncelDosyaAdi = dbAdi.endsWith('.db') ? dbAdi : dbAdi + '.db';
        yeniDbAdi.value = '';
        baglantiKur();
    } catch (hata) {
        await alert('Hata: ' + hata.message);
    } finally {
        analizYukleniyor.style.display = 'none';
    }
});

// Option 4: Load sample database
ornekDbBtn.addEventListener('click', () => {
    guncelBaglantiMetni = 'sqlite:///ornek.db';
    guncelDosyaAdi = 'ornek.db';
    baglantiKur();
});

/* -------------------------------------------------------------
   EXPLORER TREE GRAPHIC INTERFACE
   ------------------------------------------------------------- */
function semayiTreeCiz(sema) {
    sidebarTabloListesi.innerHTML = '';
    
    if (Object.keys(sema).length === 0) {
        sidebarTabloListesi.innerHTML = '<li class="tablo-tree-item bos-tree">Veritabanında tablo yok.</li>';
        return;
    }
    
    for (const [tabloAdi, kolonlar] of Object.entries(sema)) {
        const liItem = document.createElement('li');
        liItem.className = 'tree-item-konteyner';
        
        // Table Name Row
        const isimSatiri = document.createElement('div');
        isimSatiri.className = 'tablo-isim-satiri';
        if (guncelTablo === tabloAdi) isimSatiri.classList.add('secili');
        
        isimSatiri.innerHTML = `
            <div class="tablo-isim-sol">
                <span class="klasor-ikon">⊞</span>
                <span class="tablo-isim-text">${tabloAdi}</span>
            </div>
            <span class="tablo-isim-sag-ok">▶</span>
        `;
        
        // Column Nested List
        const sutunListesi = document.createElement('ul');
        sutunListesi.className = 'sutun-tree-listesi';
        
        kolonlar.forEach(kolon => {
            const keyIcon = kolon.birincil_anahtar ? '<span style="color:#f59e0b">🔑</span>' : '';
            const keyTag = kolon.birincil_anahtar ? ' (PK)' : '';
            sutunListesi.innerHTML += `
                <li class="sutun-tree-item">
                    <div class="sutun-isim-sol" title="${kolon.isim}${keyTag}">
                        ${keyIcon}
                        <span>${kolon.isim}</span>
                    </div>
                    <span class="sutun-tip-yazisi">${cleanType(kolon.tip)}</span>
                </li>
            `;
        });
        
        // Expanding and Loading behavior
        isimSatiri.addEventListener('click', (e) => {
            // Toggle open class
            isimSatiri.classList.toggle('acik');
            
            // Select and load table data
            document.querySelectorAll('.tablo-isim-satiri').forEach(el => el.classList.remove('secili'));
            isimSatiri.classList.add('secili');
            
            // View table
            tabloSec(tabloAdi);
        });
        
        liItem.appendChild(isimSatiri);
        liItem.appendChild(sutunListesi);
        sidebarTabloListesi.appendChild(liItem);
    }
}

function cleanType(typeStr) {
    if (typeStr.toUpperCase().includes('VARCHAR')) return 'STR';
    if (typeStr.toUpperCase().includes('INT')) return 'INT';
    if (typeStr.toUpperCase().includes('FLOAT') || typeStr.toUpperCase().includes('REAL')) return 'REAL';
    if (typeStr.toUpperCase().includes('BOOL')) return 'BOOL';
    return typeStr.substring(0, 5).toUpperCase();
}

/* -------------------------------------------------------------
   EXCEL GRID SPREADSHEET CONTROLLER
   ------------------------------------------------------------- */
async function tabloSec(tabloAdi) {
    guncelTablo = tabloAdi;
    aktifTabloBaslik.textContent = tabloAdi;
    tabloAksiyonlar.style.display = 'flex';
    
    // Switch to data panel
    const dataNav = Array.from(navLinkler).find(l => l.dataset.hedef === 'panel-veri');
    if (dataNav) dataNav.click();
    
    veriTablosu.innerHTML = '<div class="tablo-yukleniyor">Veriler yükleniyor...</div>';
    
    try {
        const query = `SELECT * FROM ${tabloAdi} LIMIT 300;`;
        manuelSorgu.value = query;
        
        const res = await apiIstegi('/api/sorgu-calistir', {
            baglanti_metni: guncelBaglantiMetni,
            sql_sorgusu: query
        });
        
        veriyiGridCiz(res.sonuc);
    } catch(err) {
        veriTablosu.innerHTML = `<div class="tablo-yukleniyor" style="color:var(--color-red)">Veriler çekilemedi: ${err.message}</div>`;
    }
}

// Render dynamic spreadsheet
let activeGridData = [];
function veriyiGridCiz(veri) {
    veriTablosu.innerHTML = '';
    activeGridData = veri;
    
    if (veri.mesaj) {
        veriTablosu.innerHTML = `<div class="tablo-yukleniyor">${veri.mesaj}</div>`;
        return;
    }
    
    if (!Array.isArray(veri) || veri.length === 0) {
        veriTablosu.innerHTML = `
            <div class="tablo-bos-durum">
                <div class="bos-durum-ikon">📭</div>
                <h3>Tablo Boş</h3>
                <p>Bu tabloda henüz kayıtlı veri yok. Aşağıdaki SQL konsolundan INSERT yazabilir veya "Satır Ekle" butonuna tıklayabilirsiniz.</p>
            </div>
        `;
        return;
    }
    
    const tableEl = document.createElement('table');
    tableEl.className = 'real-excel-table';
    
    // 1. Generate Headers
    const headRow = document.createElement('tr');
    
    // Select column header
    const thSelect = document.createElement('th');
    thSelect.style.width = '40px';
    thSelect.innerHTML = '<input type="checkbox" id="tumunu-sec-checkbox">';
    headRow.appendChild(thSelect);
    
    const columns = Object.keys(veri[0]);
    
    // Primary Key identification
    let pkCol = columns[0];
    if (guncelTablo && guncelSema[guncelTablo]) {
        const pk = guncelSema[guncelTablo].find(k => k.birincil_anahtar);
        if (pk) pkCol = pk.isim;
    }
    
    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        if (col === pkCol) th.innerHTML += ' 🔑';
        headRow.appendChild(th);
    });
    tableEl.appendChild(headRow);
    
    // 2. Generate Data Rows
    veri.forEach((satir, idx) => {
        const tr = document.createElement('tr');
        tr.dataset.index = idx;
        
        const tdSelect = document.createElement('td');
        tdSelect.innerHTML = `<input type="checkbox" class="satir-checkbox" data-pk="${satir[pkCol]}">`;
        tr.appendChild(tdSelect);
        
        columns.forEach(col => {
            const td = document.createElement('td');
            td.textContent = satir[col] !== null ? satir[col] : 'NULL';
            
            // Cells that are not PK can be edited
            if (col !== pkCol && guncelTablo) {
                td.setAttribute('contenteditable', 'true');
                td.addEventListener('blur', async (e) => {
                    const newVal = e.target.textContent.trim() === 'NULL' ? null : e.target.textContent;
                    if (newVal !== String(satir[col])) {
                        setRobotState('thinking', 'Hücre kaydediliyor...');
                        try {
                            await apiIstegi('/api/hucre-guncelle', {
                                baglanti_metni: guncelBaglantiMetni,
                                tablo_adi: guncelTablo,
                                pk_kolon: pkCol,
                                pk_deger: satir[pkCol],
                                hedef_kolon: col,
                                yeni_deger: newVal
                            });
                            satir[col] = newVal;
                            setRobotState('success', 'Hücre güncellendi');
                            bildirimEkle(`Tablo '${guncelTablo}' hücresi güncellendi: ${col} = ${newVal}`);
                        } catch(hata) {
                            setRobotState('error', 'Hata: ' + hata.message);
                            await alert('Hücre güncellenemedi: ' + hata.message);
                            e.target.textContent = satir[col] !== null ? satir[col] : 'NULL';
                        }
                    }
                });
            } else {
                td.style.backgroundColor = 'rgba(7, 9, 19, 0.3)';
                td.style.color = 'var(--text-secondary)';
            }
            tr.appendChild(td);
        });
        tableEl.appendChild(tr);
    });
    
    veriTablosu.appendChild(tableEl);
    
    // Listen to bulk selection
    const checkAll = tableEl.querySelector('#tumunu-sec-checkbox');
    const checkboxes = tableEl.querySelectorAll('.satir-checkbox');
    
    checkAll.addEventListener('change', (e) => {
        checkboxes.forEach(cb => {
            cb.checked = e.target.checked;
            const trParent = cb.closest('tr');
            if (trParent) {
                if (e.target.checked) trParent.classList.add('secili-satir');
                else trParent.classList.remove('secili-satir');
            }
        });
    });
    
    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            const trParent = cb.closest('tr');
            if (cb.checked) trParent.classList.add('secili-satir');
            else trParent.classList.remove('secili-satir');
        });
    });
}

// Client Side filtering search
tabloAramaFiltre.addEventListener('input', () => {
    const q = tabloAramaFiltre.value.toLowerCase().trim();
    const rows = veriTablosu.querySelectorAll('table.real-excel-table tr:not(:first-child)');
    
    rows.forEach(tr => {
        let match = false;
        const cells = tr.querySelectorAll('td:not(:first-child)');
        cells.forEach(td => {
            if (td.textContent.toLowerCase().includes(q)) match = true;
        });
        if (match || q === '') tr.style.display = '';
        else tr.style.display = 'none';
    });
});

/* Satir Ekle */
satirEkleBtn.addEventListener('click', async () => {
    if (!guncelTablo) return;
    
    // Send a prompt to AI to insert a sample row
    setRobotState('thinking', 'Yapay zeka örnek satır ekleme SQL\'i hazırlıyor...');
    try {
        const sqlRes = await apiIstegi('/api/sql-olustur', {
            baglanti_metni: guncelBaglantiMetni,
            api_anahtari: apiAnahtariGirdisi.value || 'mock_key',
            istek_metni: `${guncelTablo} tablosuna 1 adet boş veya örnek yeni veri ekle`
        });
        
        await apiIstegi('/api/sorgu-calistir', {
            baglanti_metni: guncelBaglantiMetni,
            sql_sorgusu: sqlRes.sql
        });
        
        setRobotState('success', 'Yeni satır eklendi');
        bildirimEkle(`Tablo '${guncelTablo}' tablosuna yeni veri satırı eklendi.`);
        tabloSec(guncelTablo);
        await istatistikleriGuncelle();
    } catch(err) {
        setRobotState('error', 'Hata: ' + err.message);
        await alert('Satır eklenemedi: ' + err.message);
    }
});

/* Secilenleri Sil */
secilenleriSilBtn.addEventListener('click', async () => {
    if (!guncelTablo) return;
    
    const checkboxes = Array.from(document.querySelectorAll('.satir-checkbox:checked'));
    if (checkboxes.length === 0) { await alert('Silmek için önce satır seçmelisiniz.'); return; }
    
    if (!(await confirm(`${checkboxes.length} satırı silmek istediğinize emin misiniz?`))) return;
    
    let pkCol = 'id';
    if (guncelSema[guncelTablo]) {
        const pk = guncelSema[guncelTablo].find(k => k.birincil_anahtar);
        if (pk) pkCol = pk.isim;
    }
    
    const pkValues = checkboxes.map(cb => cb.dataset.pk);
    
    setRobotState('thinking', 'Satırlar siliniyor...');
    try {
        const res = await apiIstegi('/api/satir-sil', {
            baglanti_metni: guncelBaglantiMetni,
            tablo_adi: guncelTablo,
            pk_kolon: pkCol,
            pk_degerler: pkValues
        });
        
        setRobotState('success', res.mesaj);
        bildirimEkle(`Tablo '${guncelTablo}' tablosundan ${pkValues.length} satır silindi.`);
        tabloSec(guncelTablo);
        await istatistikleriGuncelle();
    } catch(err) {
        setRobotState('error', 'Hata: ' + err.message);
        await alert('Silme işlemi başarısız: ' + err.message);
    }
});

/* Tabloyu Sil */
tabloSilBtn.addEventListener('click', async () => {
    if (!guncelTablo) return;
    if (!(await confirm(`DİKKAT! '${guncelTablo}' tablosunu ve içindeki tüm verileri tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`))) return;
    
    setRobotState('thinking', 'Tablo siliniyor...');
    try {
        await apiIstegi('/api/tablo-sil', {
            baglanti_metni: guncelBaglantiMetni,
            tablo_adi: guncelTablo
        });
        
        setRobotState('success', 'Tablo silindi');
        bildirimEkle(`'${guncelTablo}' tablosu silindi.`);
        guncelTablo = '';
        tabloAksiyonlar.style.display = 'none';
        aktifTabloBaslik.textContent = 'Seçili Tablo Yok';
        
        // Reload schema
        const data = await apiIstegi('/api/sema', { baglanti_metni: guncelBaglantiMetni });
        guncelSema = data.sema;
        semayiTreeCiz(guncelSema);
        
        veriTablosu.innerHTML = `
            <div class="tablo-bos-durum">
                <div class="bos-durum-ikon">📊</div>
                <h3>Tablo Silindi</h3>
                <p>Yeni bir tablo seçebilir ya da AI Asistanından yeni bir tablo tasarlamasını isteyebilirsiniz.</p>
            </div>
        `;
        
        await istatistikleriGuncelle();
    } catch(err) {
        setRobotState('error', 'Hata: ' + err.message);
        await alert('Tablo silinemedi: ' + err.message);
    }
});

/* Dışa Aktar (CSV) */
disaAktarBtn.addEventListener('click', async () => {
    if (!activeGridData || activeGridData.length === 0) { await alert('Dışa aktarılacak veri yok.'); return; }
    
    let csv = [];
    const headers = Object.keys(activeGridData[0]);
    csv.push(headers.join(','));
    
    activeGridData.forEach(satir => {
        let row = headers.map(col => {
            let cell = satir[col] !== null ? String(satir[col]) : '';
            // Escape double quotes
            return `"${cell.replace(/"/g, '""')}"`;
        });
        csv.push(row.join(','));
    });
    
    const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${guncelTablo || 'sorgu_sonucu'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

/* -------------------------------------------------------------
   COLLAPSIBLE SQL RUNNER & ANALYTICS
   ------------------------------------------------------------- */
manuelSorguBtn.addEventListener('click', async () => {
    const query = manuelSorgu.value.trim();
    if (!query) { await alert('Lütfen çalıştırılacak SQL sorgusunu yazın.'); return; }
    
    setRobotState('thinking', 'SQL sorgusu çalıştırılıyor...');
    try {
        const res = await apiIstegi('/api/sorgu-calistir', {
            baglanti_metni: guncelBaglantiMetni,
            sql_sorgusu: query
        });
        
        veriyiGridCiz(res.sonuc);
        setRobotState('success', 'Sorgu başarıyla çalıştırıldı');
        bildirimEkle(`SQL Sorgusu çalıştırıldı: <code>${query.substring(0, 40)}...</code>`);
        
        // Refresh tree schema
        const data = await apiIstegi('/api/sema', { baglanti_metni: guncelBaglantiMetni });
        guncelSema = data.sema;
        semayiTreeCiz(guncelSema);
        await istatistikleriGuncelle();
    } catch(err) {
        setRobotState('error', 'Hata: ' + err.message);
        veriTablosu.innerHTML = `<div class="tablo-yukleniyor" style="color:var(--color-red)">Sorgu Hatası:<br>${err.message}</div>`;
    }
});

// Advanced Analytics Calls
async function runAdvancedAnalysis(endpoint) {
    const apiKey = apiAnahtariGirdisi.value;
    if (!apiKey) { await alert('Analizleri çalıştırmak için Gemini API Anahtarı gereklidir.'); return; }
    
    ileriYzSonuc.textContent = 'Analiz devam ediyor, yapay zeka çalıştırılıyor...';
    setRobotState('thinking', 'Veriler derin yapay zeka tarafından taranıyor...');
    
    try {
        const res = await apiIstegi(endpoint, {
            baglanti_metni: guncelBaglantiMetni,
            api_anahtari: apiKey
        });
        ileriYzSonuc.textContent = res.sonuc || res.kod;
        setRobotState('success', 'Analiz tamamlandı');
    } catch(err) {
        ileriYzSonuc.textContent = 'Hata oluştu: ' + err.message;
        setRobotState('error', 'Analiz hatası');
    }
}

anomaliBtn.addEventListener('click', () => runAdvancedAnalysis('/api/anomali-tara'));
iliskiBtn.addEventListener('click', () => runAdvancedAnalysis('/api/iliski-kesfet'));
apiUretBtn.addEventListener('click', () => runAdvancedAnalysis('/api/api-kodu-uret'));

// Synthetic Data generation
veriUretBtn.addEventListener('click', async () => {
    const table = uretTabloAdi.value.trim();
    const count = parseInt(uretAdet.value);
    const apiKey = apiAnahtariGirdisi.value;
    
    if (!table || !count) { await alert('Lütfen hedef tablo adını ve adet değerini girin.'); return; }
    if (!apiKey) { await alert('Veri üretmek için Gemini API Anahtarı gereklidir.'); return; }
    
    islemModuAc(`${count} Adet Sentetik Veri Üretiliyor...`);
    setRobotState('thinking', 'Sentetik veriler ekleniyor...');
    
    try {
        const res = await apiIstegi('/api/veri-uret', {
            baglanti_metni: guncelBaglantiMetni,
            api_anahtari: apiKey,
            tablo_adi: table,
            adet: count
        });
        
        islemModuKapat();
        ileriYzSonuc.textContent = res.mesaj + '\n\nÇalıştırılan SQL:\n' + res.sql;
        setRobotState('success', `${count} adet veri eklendi`);
        bildirimEkle(`Tablo '${table}' tablosuna ${count} adet yapay zeka verisi eklendi.`);
        
        // Reload table if selected
        if (guncelTablo === table) tabloSec(table);
        await istatistikleriGuncelle();
    } catch(err) {
        islemModuKapat();
        setRobotState('error', 'Hata: ' + err.message);
        await alert('Veri üretimi başarısız: ' + err.message);
    }
});

/* -------------------------------------------------------------
   PERSISTENT CHAT & MULTIPLE CONVERSATIONS MANAGER
   ------------------------------------------------------------- */
function setupConversations() {
    const savedChats = localStorage.getItem('dbcoors_chats');
    const savedActiveId = localStorage.getItem('dbcoors_aktif_chat_id');
    
    if (savedChats) {
        try {
            activeConversations = JSON.parse(savedChats);
        } catch(e) {
            activeConversations = [];
        }
    }
    
    if (activeConversations.length === 0) {
        // Create initial default chat
        const defaultChat = {
            id: 'chat_' + Date.now(),
            title: 'Varsayılan Sohbet',
            messages: [
                { rol: 'asistan', icerik: 'Merhaba! Ben DBCoors veritabanı yapay zeka asistanıyım. Veritabanınızı yönetebilir, tablo ekleyebilir veya veri sorgulatabilirsiniz. Nasıl yardımcı olabilirim?' }
            ]
        };
        activeConversations.push(defaultChat);
        activeChatId = defaultChat.id;
        kaydetSohbetler();
    } else {
        activeChatId = savedActiveId || activeConversations[0].id;
    }
    
    DropdownSohbetleriCiz();
    SohbetGecmisiniCiz();
}

function kaydetSohbetler() {
    localStorage.setItem('dbcoors_chats', JSON.stringify(activeConversations));
    localStorage.setItem('dbcoors_aktif_chat_id', activeChatId);
}

function DropdownSohbetleriCiz() {
    sohbetSecici.innerHTML = '';
    activeConversations.forEach(chat => {
        const opt = document.createElement('option');
        opt.value = chat.id;
        opt.textContent = chat.title;
        if (chat.id === activeChatId) opt.selected = true;
        sohbetSecici.appendChild(opt);
    });
}

function SohbetGecmisiniCiz() {
    chatGecmisi.innerHTML = '';
    const activeChat = activeConversations.find(c => c.id === activeChatId);
    if (!activeChat) return;
    
    activeChat.messages.forEach(msg => {
        const rolClass = msg.rol === 'kullanici' ? 'kullanici' : 'asistan';
        let content = msg.icerik;
        let finalContent = content;
        let isMarkdown = false;
        
        if (content.startsWith("Sistem İşlemi:")) {
            const msgBody = content.replace("Sistem İşlemi: ", "");
            finalContent = `
                <div class="chat-islem-karti success">
                    <div class="islem-karti-ust success">
                        <span>✓</span> <strong>Sistem Yapılandırıldı</strong>
                    </div>
                    <div class="islem-karti-mesaj">${msgBody}</div>
                </div>`;
        } else if (content.startsWith("Bildirim:")) {
            const msgBody = content.replace("Bildirim: ", "");
            finalContent = `
                <div class="chat-islem-karti success">
                    <div class="islem-karti-ust success">
                        <span>✓</span> <strong>İşlem Tamamlandı</strong>
                    </div>
                    <div class="islem-karti-mesaj">${msgBody}</div>
                </div>`;
        } else if (content.startsWith("Veri İşlemi Yapıldı. SQL:")) {
            const parts = content.replace("Veri İşlemi Yapıldı. SQL: ", "").split("<br><br>");
            const sqlQuery = parts[0];
            const extraMsg = parts[1] || "";
            finalContent = `
                <div class="chat-islem-karti info">
                    <div class="islem-karti-ust info">
                        <span>ℹ️</span> <strong>Veri İşlemi Tamamlandı</strong>
                    </div>
                    ${extraMsg ? `<div class="islem-karti-mesaj">${extraMsg}</div>` : ''}
                    <div class="islem-karti-kod">${sqlQuery}</div>
                </div>`;
        } else {
            if (msg.rol === 'asistan' && typeof marked !== 'undefined') {
                finalContent = marked.parse(content);
                isMarkdown = true;
            } else {
                finalContent = content.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
            }
        }
        
        chatGecmisi.innerHTML += `
            <div class="mesaj ${rolClass}">
                <div class="mesaj-icerik ${isMarkdown ? 'markdown-body' : ''}">${finalContent}</div>
            </div>
        `;
    });
    chatGecmisi.scrollTop = chatGecmisi.scrollHeight;
}

// Start new conversation chat
yeniSohbetBtn.addEventListener('click', async () => {
    const name = await prompt("Yeni sohbet ismi:", `Sohbet ${activeConversations.length + 1}`);
    if (!name) return;
    
    const newChat = {
        id: 'chat_' + Date.now(),
        title: name,
        messages: [
            { rol: 'asistan', icerik: `Merhaba! '${name}' odası açıldı. Bu oturumda veritabanınız ile ilgili işlemler yapabiliriz.` }
        ]
    };
    
    activeConversations.push(newChat);
    activeChatId = newChat.id;
    kaydetSohbetler();
    DropdownSohbetleriCiz();
    SohbetGecmisiniCiz();
    setRobotState('success', 'Yeni sohbet oluşturuldu');
});

// Delete active conversation chat
sohbetSilBtn.addEventListener('click', async () => {
    if (activeConversations.length <= 1) {
        await alert('Son kalan sohbet odasını silemezsiniz.');
        return;
    }
    
    if (!(await confirm('Bu sohbeti tamamen silmek istediğinize emin misiniz?'))) return;
    
    activeConversations = activeConversations.filter(c => c.id !== activeChatId);
    activeChatId = activeConversations[0].id;
    
    kaydetSohbetler();
    DropdownSohbetleriCiz();
    SohbetGecmisiniCiz();
    setRobotState('success', 'Sohbet silindi');
});

// Dropdown change listener
sohbetSecici.addEventListener('change', (e) => {
    activeChatId = e.target.value;
    localStorage.setItem('dbcoors_aktif_chat_id', activeChatId);
    SohbetGecmisiniCiz();
});

// Send Chat Message
async function chatMesajGonder() {
    const text = chatGirdi.value.trim();
    if (!text) return;
    
    const apiKey = apiAnahtariGirdisi.value;
    if (!apiKey) { await alert('AI Asistanı ile konuşabilmek için Gemini API Anahtarı gereklidir.'); return; }
    
    const activeChat = activeConversations.find(c => c.id === activeChatId);
    if (!activeChat) return;
    
    // User message bubble
    chatGecmisi.innerHTML += `
        <div class="mesaj kullanici">
            <div class="mesaj-icerik"></div>
        </div>
    `;
    chatGecmisi.lastElementChild.querySelector('.mesaj-icerik').textContent = text;
    
    chatGirdi.value = '';
    chatGecmisi.scrollTop = chatGecmisi.scrollHeight;
    
    const loadingId = 'loading-' + Date.now();
    chatGecmisi.innerHTML += `
        <div class="mesaj asistan" id="${loadingId}">
            <div class="mesaj-icerik">DBCoors düşünüyor...</div>
        </div>
    `;
    chatGecmisi.scrollTop = chatGecmisi.scrollHeight;
    
    // Save to states
    activeChat.messages.push({ rol: "kullanici", icerik: text });
    kaydetSohbetler();
    
    setRobotState('thinking', 'Yapay zeka yanıt üretiyor...');
    
    // Construct request history payload (limit to last 10 messages)
    const historyPayload = activeChat.messages.slice(-10, -1);
    
    try {
        const yanit = await apiIstegi('/api/sohbet', {
            baglanti_metni: guncelBaglantiMetni,
            api_anahtari: apiKey,
            mesaj: text,
            gecmis: historyPayload
        });
        
        const loadingEl = document.getElementById(loadingId);
        const icerikEl = loadingEl.querySelector('.mesaj-icerik');
        
        let asistanCevapStr = "";
        
        if (yanit.tip === 'mesaj') {
            if (typeof marked !== 'undefined') {
                icerikEl.innerHTML = marked.parse(yanit.icerik);
                icerikEl.classList.add('markdown-body');
            } else {
                icerikEl.textContent = yanit.icerik;
            }
            asistanCevapStr = yanit.icerik;
        } else if (yanit.tip === 'sistem_basarili') {
            const parsedMesaj = typeof marked !== 'undefined' ? marked.parse(yanit.mesaj || '') : (yanit.mesaj || '');
            icerikEl.innerHTML = `
                <div class="chat-islem-karti success">
                    <div class="islem-karti-ust success">
                        <span>✓</span> <strong>Sistem Yapılandırıldı</strong>
                    </div>
                    <div class="islem-karti-mesaj markdown-body">${parsedMesaj}</div>
                </div>`;
            bildirimEkle(yanit.mesaj);
            asistanCevapStr = "Sistem İşlemi: " + yanit.mesaj;
            
            if (yanit.baglanti_metni) {
                guncelBaglantiMetni = yanit.baglanti_metni;
                guncelDosyaAdi = yanit.baglanti_metni.split('/').pop();
                baglantiKur();
            }
        } else if (yanit.tip === 'bildirim') {
            const parsedIcerik = typeof marked !== 'undefined' ? marked.parse(yanit.icerik || '') : (yanit.icerik || '');
            icerikEl.innerHTML = `
                <div class="chat-islem-karti success">
                    <div class="islem-karti-ust success">
                        <span>✓</span> <strong>İşlem Tamamlandı</strong>
                    </div>
                    <div class="islem-karti-mesaj markdown-body">${parsedIcerik}</div>
                </div>`;
            bildirimEkle(yanit.icerik);
            asistanCevapStr = "Bildirim: " + yanit.icerik;
            
            // Reload DB details
            if (guncelBaglantiMetni) {
                const data = await apiIstegi('/api/sema', { baglanti_metni: guncelBaglantiMetni });
                guncelSema = data.sema;
                semayiTreeCiz(guncelSema);
                await istatistikleriGuncelle();
                if (guncelTablo) tabloSec(guncelTablo);
            }
        } else if (yanit.tip === 'veri') {
            const parsedMesaj = (yanit.mesaj && typeof marked !== 'undefined') ? marked.parse(yanit.mesaj) : (yanit.mesaj || '');
            icerikEl.innerHTML = `
                <div class="chat-islem-karti info">
                    <div class="islem-karti-ust info">
                        <span>ℹ️</span> <strong>Veri İşlemi Tamamlandı</strong>
                    </div>
                    ${yanit.mesaj ? `<div class="islem-karti-mesaj markdown-body">${parsedMesaj}</div>` : ''}
                    <div class="islem-karti-kod">${yanit.sorgu || ''}</div>
                </div>`;
            asistanCevapStr = "Veri İşlemi Yapıldı. " + (yanit.mesaj ? yanit.mesaj : "");
            
            // Reload database details and grid
            if (guncelBaglantiMetni) {
                const data = await apiIstegi('/api/sema', { baglanti_metni: guncelBaglantiMetni });
                guncelSema = data.sema;
                semayiTreeCiz(guncelSema);
                await istatistikleriGuncelle();
                if (guncelTablo) tabloSec(guncelTablo);
            }
        }
        
        activeChat.messages.push({ rol: "asistan", icerik: asistanCevapStr });
        kaydetSohbetler();
        setRobotState('success', 'Cevap hazırlandı');
        
    } catch(err) {
        const loadingEl = document.getElementById(loadingId);
        loadingEl.querySelector('.mesaj-icerik').innerHTML = `
            <div class="chat-islem-karti error">
                <div class="islem-karti-ust error">
                    <span>⚠️</span> <strong>Sistem Hatası</strong>
                </div>
                <div class="islem-karti-mesaj">${err.message}</div>
            </div>`;
        setRobotState('error', 'AI yanıt hatası');
    }
    chatGecmisi.scrollTop = chatGecmisi.scrollHeight;
}

chatGonderBtn.addEventListener('click', chatMesajGonder);
chatGirdi.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatMesajGonder();
    }
});

/* -------------------------------------------------------------
   UTILITIES
   ------------------------------------------------------------- */
async function apiIstegi(url, veri = {}) {
    if (typeof veri === 'object' && veri !== null) {
        veri.ai_model = localStorage.getItem('dbcoors_ai_model') || 'gemini';
        veri.qwen_api_key = localStorage.getItem('dbcoors_qwen_key') || '';
    }
    const yanit = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(veri)
    });
    
    if (!yanit.ok) {
        const hata = await yanit.json();
        throw new Error(hata.detail || 'Bilinmeyen bir hata oluştu');
    }
    
    return yanit.json();
}

function islemModuAc(metin) {
    aiIslemModal.style.display = 'flex';
    islemModalMetni.textContent = metin;
}

function islemModuKapat() {
    aiIslemModal.style.display = 'none';
}

function bildirimEkle(mesaj) {
    const bos = bildirimListesi.querySelector('.bos-bildirim');
    if (bos) bos.remove();
    
    const li = document.createElement('li');
    li.style.padding = '0.65rem 0.85rem';
    li.style.borderBottom = '1px solid var(--border-color)';
    li.style.fontSize = '0.8rem';
    li.innerHTML = `<strong>🤖 AI Raporu:</strong><br>${mesaj}`;
    bildirimListesi.prepend(li);
    
    if (!bildirimPaneli.classList.contains('aktif')) {
        okunmamisBildirim++;
        bildirimSayaci.textContent = okunmamisBildirim;
        bildirimSayaci.style.display = 'flex';
    }
}

bildirimBtn.addEventListener('click', () => {
    bildirimPaneli.classList.toggle('aktif');
    if (bildirimPaneli.classList.contains('aktif')) {
        okunmamisBildirim = 0;
        bildirimSayaci.style.display = 'none';
    }
});

document.addEventListener('click', (e) => {
    if (!bildirimBtn.contains(e.target) && !bildirimPaneli.contains(e.target)) {
        bildirimPaneli.classList.remove('aktif');
    }
});

// Download db files
document.getElementById('vt-indir-db-btn').addEventListener('click', () => {
    if (!guncelBaglantiMetni) return;
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/vt-db-indir';
    
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'baglanti_metni';
    input.value = guncelBaglantiMetni;
    
    form.appendChild(input);
    document.body.appendChild(form);
    
    // Convert fetch request to trigger File Download
    fetch('/api/vt-db-indir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baglanti_metni: guncelBaglantiMetni })
    })
    .then(res => res.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = guncelDosyaAdi;
        document.body.appendChild(a);
        a.click();
        a.remove();
    })
    .catch(async err => await alert("Dosya indirilemedi: " + err.message));
});

document.getElementById('vt-indir-btn').addEventListener('click', async () => {
    if (!guncelBaglantiMetni) return;
    try {
        const res = await apiIstegi('/api/vt-indir', { baglanti_metni: guncelBaglantiMetni });
        const blob = new Blob([res.sql], { type: 'text/sql' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = guncelDosyaAdi.replace('.db', '.sql');
        document.body.appendChild(a);
        a.click();
        a.remove();
    } catch(err) {
        await alert("SQL İndirilemedi: " + err.message);
    }
});

// Custom Dialog UI Elements and Functions
const customDialogModal = document.getElementById('custom-dialog-modal');
const dialogBaslik = document.getElementById('dialog-baslik');
const dialogMesaj = document.getElementById('dialog-mesaj');
const dialogGirdiGrubu = document.getElementById('dialog-girdi-grubu');
const dialogGirdiAlan = document.getElementById('dialog-girdi-alan');
const dialogIptalBtn = document.getElementById('dialog-iptal-btn');
const dialogTamamBtn = document.getElementById('dialog-tamam-btn');
const dialogIkon = document.getElementById('dialog-ikon');

let dialogResolve = null;

function customShowDialog(type, message, title = 'Sistem İletisi', defaultValue = '') {
    return new Promise((resolve) => {
        dialogResolve = resolve;
        dialogBaslik.textContent = title;
        dialogMesaj.textContent = message;
        
        if (type === 'prompt') {
            dialogGirdiGrubu.style.display = 'block';
            dialogGirdiAlan.value = defaultValue;
            dialogIptalBtn.style.display = 'inline-flex';
            dialogIkon.textContent = '✏️';
        } else if (type === 'confirm') {
            dialogGirdiGrubu.style.display = 'none';
            dialogIptalBtn.style.display = 'inline-flex';
            dialogIkon.textContent = '❓';
        } else {
            dialogGirdiGrubu.style.display = 'none';
            dialogIptalBtn.style.display = 'none';
            dialogIkon.textContent = 'ℹ️';
        }
        
        customDialogModal.style.display = 'flex';
        
        if (type === 'prompt') {
            dialogGirdiAlan.focus();
            dialogGirdiAlan.select();
        } else {
            dialogTamamBtn.focus();
        }
    });
}

dialogTamamBtn.addEventListener('click', () => {
    customDialogModal.style.display = 'none';
    if (dialogResolve) {
        if (dialogGirdiGrubu.style.display === 'block') {
            dialogResolve(dialogGirdiAlan.value);
        } else {
            dialogResolve(true);
        }
    }
});

dialogIptalBtn.addEventListener('click', () => {
    customDialogModal.style.display = 'none';
    if (dialogResolve) {
        if (dialogGirdiGrubu.style.display === 'block') {
            dialogResolve(null);
        } else {
            dialogResolve(false);
        }
    }
});

// Override window dialogs globally
window.alert = function(msg) {
    return customShowDialog('alert', msg, 'Bilgi');
};
window.confirm = function(msg) {
    return customShowDialog('confirm', msg, 'Onay Gerekli');
};
window.prompt = function(msg, def) {
    return customShowDialog('prompt', msg, 'Girdi Gerekli', def);
};

/* -------------------------------------------------------------
   CHAT DRAWER RESIZE LOGIC
   ------------------------------------------------------------- */
const chatDrawer = document.getElementById('chat-drawer-sag');
const chatResizer = document.getElementById('chat-resizer');

if (chatDrawer && chatResizer) {
    let isResizing = false;

    chatResizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        chatResizer.classList.add('active');
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none'; // Prevent text selection while dragging
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        // Calculate new width: viewport width - mouse X position
        const newWidth = document.body.clientWidth - e.clientX;
        
        // Apply constraints
        if (newWidth >= 250 && newWidth <= 800) {
            chatDrawer.style.width = newWidth + 'px';
        }
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            chatResizer.classList.remove('active');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });
}

/* -------------------------------------------------------------
   AI MODEL SELECTION LOGIC
   ------------------------------------------------------------- */
const aiModelSecici = document.getElementById('ai-model-secici');
if (aiModelSecici) {
    aiModelSecici.value = localStorage.getItem('dbcoors_ai_model') || 'gemini';
    
    aiModelSecici.addEventListener('change', async (e) => {
        const secilen = e.target.value;
        if (secilen === 'qwen') {
            let existingKey = localStorage.getItem('dbcoors_qwen_key');
            if (!existingKey) {
                existingKey = await prompt("Lütfen Qwen (DashScope) API Anahtarınızı giriniz:", "");
                if (existingKey) {
                    localStorage.setItem('dbcoors_qwen_key', existingKey);
                } else {
                    aiModelSecici.value = 'gemini';
                    return;
                }
            }
        }
        localStorage.setItem('dbcoors_ai_model', secilen);
        bildirimEkle(`AI Modeli '${secilen.toUpperCase()}' olarak ayarlandı.`);
    });
}
