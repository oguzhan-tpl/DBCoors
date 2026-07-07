import sqlite3
import random
from datetime import datetime, timedelta

def veritabani_hazirla():
    baglanti = sqlite3.connect("ornek.db")
    imlec = baglanti.cursor()
    
    imlec.execute("""
    CREATE TABLE IF NOT EXISTS kullanicilar (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        isim TEXT,
        eposta TEXT,
        kayit_tarihi TEXT,
        ulke TEXT
    )
    """)
    
    imlec.execute("""
    CREATE TABLE IF NOT EXISTS urunler (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        urun_adi TEXT,
        kategori TEXT,
        fiyat REAL,
        stok INTEGER
    )
    """)
    
    imlec.execute("""
    CREATE TABLE IF NOT EXISTS siparisler (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kullanici_id INTEGER,
        urun_id INTEGER,
        miktar INTEGER,
        siparis_tarihi TEXT
    )
    """)
    
    isimler = ["Ahmet", "Mehmet", "Ayse", "Fatma", "Mustafa", "Emine", "Ali", "Hatice", "Huseyin", "Zeynep"]
    soyisimler = ["Yilmaz", "Kaya", "Demir", "Celik", "Sahin", "Yildiz", "Ozturk", "Aydin", "Arslan", "Polat"]
    ulkeler = ["Turkiye", "Almanya", "Ingiltere", "Fransa", "Italya", "ABD", "Kanada", "Japonya"]
    kategoriler = ["Elektronik", "Moda", "Ev & Yasam", "Kozmetik", "Spor", "Kitap"]
    urun_isimleri = ["Telefon", "Bilgisayar", "Kulaklik", "Saat", "T-Shirt", "Pantolon", "Ayakkabi", "Parfum", "Krem", "Top", "Mat", "Roman", "Defter"]

    kullanicilar_verisi = []
    baslangic_tarihi = datetime.now() - timedelta(days=365)
    for i in range(100000):
        isim = f"{random.choice(isimler)} {random.choice(soyisimler)}"
        eposta = f"{isim.lower().replace(' ', '')}{random.randint(10, 99)}@eposta.com"
        kayit_tarihi = (baslangic_tarihi + timedelta(minutes=random.randint(0, 525600))).strftime("%Y-%m-%d %H:%M:%S")
        ulke = random.choice(ulkeler)
        kullanicilar_verisi.append((isim, eposta, kayit_tarihi, ulke))
        
    imlec.executemany("INSERT INTO kullanicilar (isim, eposta, kayit_tarihi, ulke) VALUES (?, ?, ?, ?)", kullanicilar_verisi)
    
    urunler_verisi = []
    for i in range(10000):
        urun_adi = f"{random.choice(urun_isimleri)} {random.randint(100, 999)}"
        kategori = random.choice(kategoriler)
        fiyat = round(random.uniform(10.0, 5000.0), 2)
        stok = random.randint(5, 500)
        urunler_verisi.append((urun_adi, kategori, fiyat, stok))
        
    imlec.executemany("INSERT INTO urunler (urun_adi, kategori, fiyat, stok) VALUES (?, ?, ?, ?)", urunler_verisi)
    
    siparisler_verisi = []
    for i in range(90000):
        kullanici_id = random.randint(1, 100000)
        urun_id = random.randint(1, 10000)
        miktar = random.randint(1, 5)
        siparis_tarihi = (baslangic_tarihi + timedelta(minutes=random.randint(0, 525600))).strftime("%Y-%m-%d %H:%M:%S")
        siparisler_verisi.append((kullanici_id, urun_id, miktar, siparis_tarihi))
        
    imlec.executemany("INSERT INTO siparisler (kullanici_id, urun_id, miktar, siparis_tarihi) VALUES (?, ?, ?, ?, ?)", siparisler_verisi)
    
    baglanti.commit()
    baglanti.close()

if __name__ == "__main__":
    veritabani_hazirla()
