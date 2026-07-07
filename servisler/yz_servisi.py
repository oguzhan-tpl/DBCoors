import google.generativeai as genai
import json

_AKTIF_MODEL = None

def api_anahtari_ayarla(anahtar):
    genai.configure(api_key=anahtar)

def model_olustur():
    global _AKTIF_MODEL
    if _AKTIF_MODEL:
        return genai.GenerativeModel(_AKTIF_MODEL)
        
    try:
        modeller = [m for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
        
        # Öncelik 1.5 flash serisinde
        for m in modeller:
            if '1.5-flash' in m.name.lower() and '8b' not in m.name.lower():
                _AKTIF_MODEL = m.name
                return genai.GenerativeModel(_AKTIF_MODEL)
                
        # Bulamazsa normal flash
        for m in modeller:
            if 'flash' in m.name.lower():
                _AKTIF_MODEL = m.name
                return genai.GenerativeModel(_AKTIF_MODEL)
                
        _AKTIF_MODEL = modeller[0].name
        return genai.GenerativeModel(_AKTIF_MODEL)
    except Exception:
        return genai.GenerativeModel('gemini-1.5-flash')

import openai

def _ai_generate(istem, api_anahtari, ai_model="gemini", qwen_api_key=""):
    if ai_model == "qwen":
        client = openai.OpenAI(
            api_key=qwen_api_key,
            base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
        )
        try:
            response = client.chat.completions.create(
                model="qwen-plus",
                messages=[{"role": "user", "content": istem}]
            )
            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"Qwen API Hatası: {str(e)}")
    else:
        api_anahtari_ayarla(api_anahtari)
        model = model_olustur()
        yanit = model.generate_content(istem)
        return yanit.text

def veritabani_acikla(anahtar, sema_bilgisi, ai_model="gemini", qwen_api_key=""):
    istem = f"""Aşağıdaki veritabanı şemasını incele ve ne işe yaradığını, hangi amaçla kullanıldığını Türkçe olarak açıkla. Teknik olmayan birinin anlayabileceği şekilde özetle.
    
    Şema:
    {json.dumps(sema_bilgisi, indent=2)}
    """
    
    yanit_metni = _ai_generate(istem, anahtar, ai_model, qwen_api_key)
    return yanit_metni

def sql_olustur(anahtar, sema_bilgisi, kullanici_istegi, ai_model="gemini", qwen_api_key=""):
    istem = f"""Sen bir SQL uzmanısın. Aşağıdaki veritabanı şemasına göre, kullanıcının isteğini yerine getirecek SQL sorgusunu oluştur.
    Sadece geçerli SQL kodunu döndür. Başka hiçbir metin veya markdown işareti kullanma.
    ÇOK ÖNEMLİ KURAL: Eğer veri ekliyorsan (INSERT), çakışma hatalarını (UNIQUE constraint) önlemek için kesinlikle "INSERT INTO" YERİNE "INSERT OR IGNORE INTO" kullan!
    
    Mevcut Şema:
    {json.dumps(sema_bilgisi, indent=2)}
    
    Kullanıcı İsteği:
    {kullanici_istegi}
    """
    
    yanit_metni = _ai_generate(istem, anahtar, ai_model, qwen_api_key)
    sql_metni = yanit_metni.strip().replace('```sql', '').replace('```', '')
    
    # Kullanıcı isteği ile ekleme yapılıyorsa "INSERT INTO" komutlarını yakalayıp ezelim
    import re
    sql_metni = re.sub(r'(?i)\bINSERT\s+INTO\b', 'INSERT OR IGNORE INTO', sql_metni)
    
    return sql_metni

def veri_uret(anahtar, sema_bilgisi, tablo_adi, adet, ai_model="gemini", qwen_api_key=""):
    istem = f"""Aşağıdaki veritabanı şemasına göre, '{tablo_adi}' tablosu için {adet} adet gerçekçi sentetik veri satırı oluştur.
    Sadece {adet} adet SQL komutu üret. 
    ÇOK ÖNEMLİ KURAL 1: Çakışma hatalarını (UNIQUE constraint) önlemek için kesinlikle "INSERT INTO" YERİNE "INSERT OR IGNORE INTO" kullan!
    ÇOK ÖNEMLİ KURAL 2: TIMESTAMP, DATETIME ve DATE tipindeki tüm kolonlar için (örneğin 'created_at', 'updated_at') kesinlikle 'YYYY-MM-DD HH:MM:SS' formatında geçerli tarihler üret. Asla rastgele metin veya lorem ipsum koyma!
    Başka hiçbir metin veya markdown işareti kullanma.
    
    Şema:
    {json.dumps(sema_bilgisi, indent=2)}
    """
    
    yanit_metni = _ai_generate(istem, anahtar, ai_model, qwen_api_key)
    sql_metni = yanit_metni.strip().replace('```sql', '').replace('```', '')
    
    # Yapay zeka promptu dinlemeyip "INSERT INTO" yazarsa diye Python ile zorla değiştiriyoruz
    # Büyük-küçük harf duyarlılığını kaldırmak ve her türlü INSERT INTO'yu yakalamak için:
    import re
    sql_metni = re.sub(r'(?i)\bINSERT\s+INTO\b', 'INSERT OR IGNORE INTO', sql_metni)
    
    return sql_metni

def anomali_tara(anahtar, sema_bilgisi, ornek_veri, ai_model="gemini", qwen_api_key=""):
    istem = f"""Aşağıdaki veritabanı şemasını ve tablolardaki örnek verileri incele. 
    Verilerde mantıksız, hatalı veya anomali olabilecek durumları Türkçe olarak raporla (örneğin aşırı yüksek bir yaş, mantıksız bir e-posta formatı).
    Eğer her şey normal görünüyorsa "Herhangi bir anomali tespit edilmedi." yaz.
    
    Şema:
    {json.dumps(sema_bilgisi, indent=2)}
    
    Örnek Veriler:
    {json.dumps(ornek_veri, indent=2)}
    """
    
    yanit_metni = _ai_generate(istem, anahtar, ai_model, qwen_api_key)
    return yanit_metni

def iliski_kesfet(anahtar, sema_bilgisi, ornek_veri, ai_model="gemini", qwen_api_key=""):
    istem = f"""Aşağıdaki veritabanı şemasını ve örnek verileri incele. 
    Tablolarda Foreign Key (Dış Anahtar) kısıtlamaları olmasa bile, kolon isimlerinden ve veri tiplerinden yola çıkarak tablolar arasındaki gizli ilişkileri keşfet.
    Hangi tablo hangi tabloya, hangi kolon üzerinden bağlanıyor olmalı? Türkçe olarak açıkla.
    
    Şema:
    {json.dumps(sema_bilgisi, indent=2)}
    
    Örnek Veriler:
    {json.dumps(ornek_veri, indent=2)}
    """
    
    yanit_metni = _ai_generate(istem, anahtar, ai_model, qwen_api_key)
    return yanit_metni

def api_kodu_uret(anahtar, sema_bilgisi, ai_model="gemini", qwen_api_key=""):
    istem = f"""Aşağıdaki veritabanı şemasını kullanarak, bu veritabanı için tam teşekküllü bir FastAPI REST API kodu üret.
    Sadece geçerli Python kodunu döndür. Başka metin veya markdown işareti kullanma.
    
    Şema:
    {json.dumps(sema_bilgisi, indent=2)}
    """
    
    yanit_metni = _ai_generate(istem, anahtar, ai_model, qwen_api_key)
    return yanit_metni.strip().replace('```python', '').replace('```', '')

def sohbet_asistani(anahtar, sema_bilgisi, kullanici_mesaji, gecmis, ai_model="gemini", qwen_api_key="", baglanti_metni=""):
    istem = f"""Senin adın **DBCoors**. Sen sıradan bir asistan değil, dünyanın en yetenekli, zeki ve soğukkanlı "Baş Veritabanı Mimarı ve Sistem Analisti"sin. 
Kullanıcılarla üst düzey bir profesyonellikle, net, özgüvenli ve teknik bir dille konuşursun. Sorunları çözerken sistemin performansını, güvenliğini (SQL Injection önlemleri) ve veritabanı normlarını (3NF) her zaman göz önünde bulundurursun.

**DBCoors Olarak Temel Davranış Kuralların:**
1. **Zengin Markdown Kullanımı:** Asla sıkıcı, düz metinler yazma. Cevaplarında daima Markdown formatının gücünü kullan!
   - Önemli vurguları ve teknik terimleri **kalın** yaz.
   - Tablo ve kolon isimlerini daima `kod görünümünde` (vurgulu) belirt.
   - Adımları ve tavsiyeleri emoji destekli, düzenli maddeler (bullet points) halinde listele.
   - Eğer bir SQL kodu vereceksen, bunu kesinlikle ` ```sql ... ``` ` blokları içine al.
2. **Karakter ve Tavır:** Soğukkanlı, net ve çözüm odaklısın. Gereksiz uzatmalardan kaçınır, doğrudan sorunun veya mimarinin kalbine inersin.
3. **JSON Formatı Zorunluluğu:** Sistemin arka planında çalıştığın için **TÜM ÇIKTILARIN SADECE VE SADECE GEÇERLİ BİR JSON OBJESİ OLMALIDIR.** JSON dışında (örneğin ```json bloğu veya ekstra sohbet metni) ASLA hiçbir şey yazma.

Kullanıcının isteğini, mevcut veritabanı şemasını ve geçmiş sohbeti derinlemesine analiz et. Çıktını aşağıdaki 4 görev formatından en uygun olanına göre oluştur:

### 1. YENİ BİR VERİTABANI/SİSTEM KURULUMU (vt_olustur)
Eğer kullanıcı sıfırdan ("hastane sistemi kur", "e-ticaret altyapısı oluştur") bir yapı istiyorsa:
{{
    "tip": "sistem_ve_sql",
    "islem": "vt_olustur",
    "arguman": "<Veritabanı için mantıklı ve kısa dosya adı (örneğin: sirket_db)>",
    "sorgular": ["CREATE TABLE IF NOT EXISTS ...", "INSERT OR IGNORE INTO ..."],
    "mesaj": "<Kurduğun mimarinin gücünü ve neden bu tabloları seçtiğini anlatan, **Markdown** ile zenginleştirilmiş profesyonel bir özet.>"
}}

### 2. MEVCUT SİSTEMDE SQL DEĞİŞİKLİĞİ (DML/DDL)
Eğer kullanıcı ("tabloya yaş kolonu ekle", "verileri sil") bir işlem istiyorsa:
{{
    "tip": "sql",
    "sorgular": ["ALTER TABLE ...", "UPDATE ..."],
    "mesaj": "<Yaptığın veritabanı operasyonunun profesyonel ve net açıklaması. Tablo isimlerini `kod` formatında yaz, **Markdown** ile şıklaştır.>"
}}
(DİKKAT 1: INSERT işlemlerinde çakışmaları önlemek için mutlaka 'INSERT OR IGNORE INTO' kullan.)
(DİKKAT 2: Veritabanı motoru SQLite/TiDB olabileceği için ALTER TABLE ADD COLUMN sırasında `CONSTRAINT` veya `CHECK` ifadeleri KULLANMA. Sadece temel veri tipini ver, örneğin: `ALTER TABLE tablo ADD COLUMN yas INT;` )
(DİKKAT 3: FOREIGN KEY kurallarına DİKKAT ET! Parent tabloda (örn: oda_tipleri) veri yokken, child tabloya (örn: odalar) INSERT YAPAMAZSIN, yaparsan FOREIGN KEY constraint failed hatası alırsın. Eğer ilişkili veriler eklenecekse her zaman önce bağımsız ana (parent) tabloları dolduran SQL'ler yaz.)

### 3. SENTETİK / SAHTE VERİ ÜRETİMİ (veri_uret)
Eğer kullanıcı sisteme ("test için 10 kullanıcı ekle", "rastgele veriler doldur") sentetik test verisi eklenmesini istiyorsa, SQL YAZMA. Sadece şu JSON'u döndür:
{{
    "tip": "veri_uret",
    "tablolar": ["<hedef_tablo_1>", "<hedef_tablo_2>"],
    "adet": <Kaç adet veri isteniyorsa sayısal olarak>
}}

### 4. BİLGİ, ANALİZ, DANIŞMANLIK VE SOHBET (mesaj)
Eğer veritabanını değiştirmeyen bir analiz ("hangi tablolar boş?", "şema analizi yap", "selam") ise:
{{
    "tip": "mesaj",
    "icerik": "<Baş Veritabanı Mimarı vizyonuyla hazırlanmış; **kalın fontların**, `kod bloklarının` ve düzenli listelerin kullanıldığı muazzam güzellikte ve okunaklı bir Markdown yanıtı. Tablo ve durum analizlerini şık bir dille ifade et.>"
}}

ŞU ANKİ SİSTEM DURUMU:
Aktif Veritabanı Bağlantısı (Motor Tipi): {baglanti_metni or "Bilinmiyor/Yeni"}
Mevcut Şema:
{json.dumps(sema_bilgisi, indent=2)}

Geçmiş Sohbet Bağlamı:
{json.dumps(gecmis, indent=2)}

Kullanıcının Talebi:
{kullanici_mesaji}
"""
    
    yanit_metni = _ai_generate(istem, anahtar, ai_model, qwen_api_key)
    metin = yanit_metni.strip()
    if metin.startswith('```json'):
        metin = metin.replace('```json', '', 1)
    if metin.endswith('```'):
        metin = metin[::-1].replace('```'[::-1], '', 1)[::-1]
    return json.loads(metin.strip())


import urllib.request
import urllib.error
from html.parser import HTMLParser
import re

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text_parts = []
        self.in_script_or_style = False

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'):
            self.in_script_or_style = True

    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.in_script_or_style = False

    def handle_data(self, data):
        if not self.in_script_or_style:
            text = data.strip()
            if text:
                self.text_parts.append(text)

    def get_text(self):
        return "\n".join(self.text_parts)

def url_icerik_cek(url):
    url = url.strip()
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url
    
    print(f"[DEBUG] İstek atılan URL: {url}")
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read().decode('utf-8', errors='ignore')
            parser = TextExtractor()
            parser.feed(html)
            text = parser.get_text()
            text = re.sub(r'\n+', '\n', text)
            text = re.sub(r' +', ' ', text)
            print(f"[DEBUG] URL'den başarıyla metin çekildi. Uzunluk: {len(text)}")
            return text[:15000]
    except urllib.error.URLError as e:
        print(f"[DEBUG] URLError: {str(e)}")
        if "getaddrinfo failed" in str(e) or "Name or service not known" in str(e):
            raise Exception(f"Girilen adres ({url}) bulunamadı. Lütfen adresi doğru yazdığınızdan emin olun.")
        raise Exception(f"Bağlantı hatası: {getattr(e, 'reason', str(e))}")
    except Exception as e:
        print(f"[DEBUG] Genel Hata: {str(e)}")
        raise Exception(f"URL okunamadı: {str(e)}")

def linkten_sql_olustur(anahtar, url, sayfa_metni, ai_model="gemini", qwen_api_key=""):
    istem = f"""Sen bir veritabanı mimarı ve veri çıkarma uzmanısın.
Aşağıda, kullanıcının belirttiği '{url}' adresinden çekilen web sayfasının ham metin içeriği verilmiştir.
Bu metindeki bilgileri analiz et ve mantıklı, ilişkisel bir veritabanı şeması tasarlayarak SQL komutları üret.

GÖREVLERİN:
1. Metinde hangi bilgi grupları var? (Örn: Ürün listesi, personel listesi, kategoriler, yorumlar, istatistikler vb.) Bunlar için tablolar tasarla.
2. Bu tablolar için "CREATE TABLE IF NOT EXISTS ..." komutlarını yaz. Tablolarda birincil anahtar (PRIMARY KEY) ve uygun veri tiplerini belirle.
3. Metindeki ham verileri ayıklayarak bu tablolara "INSERT OR IGNORE INTO ..." komutlarıyla ekle. En az 10-20 satır gerçek veri eklemeye çalış.
4. Sadece geçerli SQLite SQL kodunu döndür. Başka hiçbir açıklama, metin veya markdown işareti (```sql gibi) kullanma.

Web Sayfası İçeriği (İlk 15000 karakter):
{sayfa_metni}
"""
    
    yanit_metni = _ai_generate(istem, anahtar, ai_model, qwen_api_key)
    sql_metni = yanit_metni.strip().replace('```sql', '').replace('```', '')
    
    import re
    sql_metni = re.sub(r'(?i)\bINSERT\s+INTO\b', 'INSERT OR IGNORE INTO', sql_metni)
    
    return sql_metni


