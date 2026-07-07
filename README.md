# DBCoors - Yapay Zeka Destekli Akıllı Veritabanı Mimarı 🚀

DBCoors, doğal dille (Türkçe) konuşarak veritabanı tasarlayabileceğiniz, yönetebileceğiniz ve içine akıllı sentetik veriler doldurabileceğiniz yeni nesil bir veritabanı asistanıdır. Gücünü **Gemini 1.5** ve **Qwen** modellerinden alır.

İster sıfırdan bir hastane yönetim sistemi kurun, ister var olan veritabanınızı analiz ettirin; DBCoors sizin için tüm SQL kodlarını yazar, veritabanını oluşturur ve şemayı görselleştirir.

## ✨ Öne Çıkan Özellikler

- 🤖 **Doğal Dille Veritabanı Yönetimi:** Sadece "Bana bir e-ticaret sistemi kur" veya "Kullanıcılar tablosuna yaş kolonu ekle" demeniz yeterli.
- 🔗 **Geniş Veritabanı Desteği:** SQLite, MySQL, MariaDB, TiDB ve PostgreSQL (Sınırlı) destekler. Uzak veritabanlarına link ile (örn: `mysql://kullanici:sifre@sunucu:3306/db`) anında bağlanabilirsiniz.
- 🎲 **Akıllı Sentetik Veri Üretimi:** Test verilerine mi ihtiyacınız var? Sadece "50 tane sahte kullanıcı ekle" deyin. Sistem, `Faker` kütüphanesini kullanarak isimleri, e-postaları, tarihleri ve hatta ilişkili tabloları (Foreign Keys) zekice analiz edip doldurur.
- 🌳 **Etkileşimli Şema Görüntüleyici:** Tablolarınızı ve aralarındaki ilişkileri yan panelde ağaç yapısı (Tree View) olarak görebilirsiniz.
- 🎨 **Karanlık Mod (Dark Mode) ve Şık Arayüz:** Göz yormayan, modern, cam görünümlü (glassmorphism) ve tepkisel bir arayüze sahiptir. Markdown destekli mesaj kutucuklarıyla SQL kodları pırıl pırıl görünür.

## 🚀 Kurulum & Çalıştırma

Bilgisayarınızda **Python 3.8+** yüklü olduğundan emin olun.

1. **Gerekli kütüphaneleri yükleyin:**
   ```bash
   pip install fastapi uvicorn sqlalchemy faker google-generativeai openai pymysql python-multipart
   ```

2. **Uygulamayı Başlatın:**
   Proje dizininde (bu klasörde) terminalinizi açın ve şu komutu çalıştırın:
   ```bash
   python -m uvicorn ana:uygulama --port 8000
   ```

3. **Tarayıcıdan Erişin:**
   Tarayıcınızdan `http://localhost:8000` adresine gidin.

## ⚙️ Nasıl Kullanılır?

1. **API Anahtarı Ayarlama:** Arayüze girdikten sonra kendi `Gemini` veya `Qwen` API anahtarınızı sol alt köşedeki ayarlar kutucuğuna girin. (Anahtarlar sunucuya kaydedilmez, sadece tarayıcınızda tutulur!)
2. **Sıfırdan Proje Başlatma:** Kutuya "Hastane takip veritabanı kur" yazıp enter'a basın. DBCoors sizin için en ideal SQL mimarisini çizecek ve dosyayı oluşturacaktır.
3. **Mevcut Veritabanına Bağlanma:** Elinizde olan bir SQLite dosyasına veya uzaktaki MySQL sunucunuza sol menüdeki "Veritabanı Aç / Bağlan" bölümünden bağlanın.
4. **Düzenleme & Veri Doldurma:** "Bolumler tablosunu sahte verilerle doldur", "Doktorlar tablosundaki verileri sil" gibi komutlarla sistemi yönetin!

## 🛡️ Güvenlik ve Uyarılar

* **Yapay Zeka Hataları:** Yapay zeka sistemleri bazen yanlış SQL üretebilir. Ancak DBCoors güvenli bir "INSERT IGNORE" mimarisine ve Foreign Key toleransına sahip olduğu için veritabanınızı çökertmez.
* **Üretim (Production) Ortamı:** Uygulamayı canlı üretim veritabanlarınızda (özellikle silme komutları verirken) kullanırken dikkatli olmanız tavsiye edilir. Asistan, verdiğiniz komutları uygular.
* Tüm sohbet geçmişi ve API anahtarları yerel tarayıcınızın `localStorage` alanında saklanır. `Temizle` komutu veya sayfa önbelleğini temizlemek, tüm anahtarlarınızı anında siler.

## 💻 Katkıda Bulunma
Sistemi daha da geliştirmek için Pull Request atabilir veya Issue oluşturabilirsiniz. 

---
*Bu proje modern web mimarisi, FastAPI ve SQLAlchemy teknolojileriyle geliştirilmiş açık kaynaklı bir araçtır.*
