<div align="center">

<img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Robot.png" width="150" alt="DBCoors AI" />

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%" alt="Neon LED Divider" />

# 🧠 DBCoors : Yapay Zeka Tabanlı Veritabanı Mimarı

**Sohbet Arayüzü Üzerinden SQL Şemaları Çizen ve Sentetik Veri Dolduran Otonom Sistem**

<img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=600&size=22&pause=1000&color=00FF9D&center=true&vCenter=true&width=800&lines=Sadece+isteyin,+veritaban%C4%B1+saniyeler+i%C3%A7inde+kurulsun...;Faker+ile+tek+t%C4%B1kla+binlerce+sentetik+veri+%C3%BCretin...;Gemini+ve+Qwen+altyap%C4%B1s%C4%B1yla+hatas%C4%B1z+mimariler+in%C5%9Fa+edin...;Siz+kahvenizi+yudumlarken+sistem+kendini+yazs%C4%B1n...;DBCoors+ile+Gelece%C4%9Fe+Ho%C5%9F+Geldiniz!" alt="DBCoors Özellikler" />

<p align="center">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/SQLAlchemy-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white" alt="SQLAlchemy">
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite">
  <img src="https://img.shields.io/badge/Gemini_API-8E75B2?style=for-the-badge&logo=google&logoColor=white" alt="Gemini">
  <img src="https://img.shields.io/badge/Qwen_API-FF6A00?style=for-the-badge&logo=alibabacloud&logoColor=white" alt="Qwen">
</p>

</div>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%" alt="Neon LED Divider" />

<br>

## 📜 Proje Tanımı ve Amacı

**DBCoors**, karmaşık SQL veritabanlarını oluşturmayı ve yönetmeyi metin tabanlı bir sohbet asistanına indirgeyen bir arka plan (backend) sistemidir. Proje tamamen mevcut kod tabanına dayalı olarak şu üç temel işlevi yerine getirir:

1. **SQL Şeması Tasarımı:** Doğal dil analizleriyle `CREATE TABLE` sorguları üretir.
2. **Otomatik Test Verisi (Mock Data):** Python `Faker` kütüphanesini kullanarak, var olan tabloların kolon veri tiplerini (INT, VARCHAR, DATE vb.) ve ilişkilerini (Foreign Key) okur, buna uygun sentetik veri üretip `INSERT` eder.
3. **Anomali ve İlişki Analizi:** Tablolardaki mevcut verileri inceleyip olası mantık hatalarını veya gizli ilişkileri keşfeder.

<br>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%" alt="Neon LED Divider" />

## 🧩 Teknik Mimari ve Yetenekler

Mevcut kod altyapısının doğrudan desteklediği ve aktif olarak çalışan teknik yetenekler aşağıda listelenmiştir:

| Özellik | Açıklama (Kod Analizi) |
| :--- | :--- |
| **Çoklu AI Motoru** | `yz_servisi.py` içerisinde hem **Google Gemini** (1.5-flash) hem de **Alibaba Qwen** (qwen-plus) entegrasyonu mevcuttur. Parametrelerle dinamik değiştirilebilir. |
| **Yabancı Anahtar (FK) Zekası** | `vt_servisi.py` içerisindeki veri üretim algoritması, alt tablolar için rastgele numara uydurmak yerine, *Parent* (Ana) tabloları `SELECT` sorgusuyla tarayıp geçerli ID'leri yakalar. |
| **DML Çakışma Önleyici** | Üretilen `INSERT INTO` sorguları düzenli ifadelerle (regex) yakalanarak anında `INSERT OR IGNORE INTO` yapısına çevrilir (`UNIQUE constraint` çökmelerini önlemek için). |
| **Markdown Yanıt Formatı** | Frontend arayüzünde (`uygulama.js`), AI tarafından dönülen kodlar ve açıklamalar **marked.js** kütüphanesi yardımıyla renklendirilmiş (syntax-highlighted) bloklar halinde sunulur. |
| **SQLAlchemy Dinamik Bağlantı** | Sistem bir ORM tabanı kullanır. MetaData reflection (şema yansıması) ile mevcut veritabanını tarar ve saniyeler içinde JSON formatında AI'a aktarır. |

<br>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%" alt="Neon LED Divider" />

## 🔄 Sistem Akışı (Sequence Flow)

Aşağıdaki şema, sistemde gerçekleşen bir veri üretim veya tablo oluşturma döngüsünü göstermektedir:

```mermaid
sequenceDiagram
    participant K as Kullanıcı (Frontend)
    participant A as API (FastAPI)
    participant Y as Yapay Zeka Servisi
    participant V as Veritabanı (SQLite)

    K->>A: "Hastane sistemi kur" talebi
    A->>V: Mevcut şemayı (MetaData) oku
    V-->>A: Şema JSON olarak döner
    A->>Y: Kullanıcı Talebi + Şema JSON + Sistem Kuralları (Prompt)
    Y-->>A: Salt JSON Çıktısı (SQL Komutları veya Metin)
    A->>V: Üretilen DDL/DML SQL komutlarını çalıştır (execute)
    V-->>A: İşlem başarılı / UNIQUE hata önlemi
    A-->>K: İşlem sonucu (Markdown formatında görselleştirilir)
```

<br>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%" alt="Neon LED Divider" />

## 🚀 Kurulum ve Çalıştırma

Projenin hiçbir ekstra bağımlılığı yoktur, sadece `requirements.txt` mantığında aşağıdaki paketlerin kurulu olması yeterlidir.

### Gereksinimlerin Yüklenmesi
```bash
pip install fastapi uvicorn sqlalchemy faker markdown google-genai requests openai
```

### Uygulamanın Başlatılması
Proje kök dizininde aşağıdaki komutu çalıştırarak yerel sunucuyu aktif edin:
```bash
python -m uvicorn ana:uygulama --port 8000 --reload
```

Sunucu `127.0.0.1:8000` adresinde başlayacaktır. Tarayıcınızdan bu adrese girerek sisteme erişebilirsiniz.

<br>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%" alt="Neon LED Divider" />

## 💻 Kullanım Örnekleri

Sohbet asistanına gönderebileceğiniz bazı doğrudan komut örnekleri:

> - *"Sisteme 'kitaplar' adında bir tablo ekle. id (primary), isim ve yazar kolonları olsun."*
> - *"Bu tablo için içine 50 adet sahte kitap verisi üret."*
> - *"Veritabanımdaki tablolar arasında nasıl bir gizli ilişki var, benim için analiz et."*
> - *"Kullanıcılar tablosunu sil."*

Tüm işlemler arka planda SQLite tabanında (veya verdiğiniz bağlantı metnine göre MySQL) fiziksel olarak saniyeler içinde gerçekleştirilecektir.

<br>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%" alt="Neon LED Divider" />

<div align="center">
  <p><b>DBCoors</b> - %100 Otonom Veritabanı Mühendisliği</p>
  <i>Yalnızca temiz kod, sıfır abartı.</i>
</div>
