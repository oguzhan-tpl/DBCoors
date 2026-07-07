import sqlalchemy
from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.orm import sessionmaker
import os

motorlar = {}
oturumlar = {}

def baglanti_olustur(baglanti_metni):
    if baglanti_metni not in motorlar:
        motor = create_engine(baglanti_metni)
        motorlar[baglanti_metni] = motor
        oturumlar[baglanti_metni] = sessionmaker(bind=motor)
    return motorlar[baglanti_metni]

def sema_getir(baglanti_metni):
    motor = baglanti_olustur(baglanti_metni)
    meta = MetaData()
    meta.reflect(bind=motor)
    
    sema_bilgisi = {}
    for tablo_adi, tablo in meta.tables.items():
        kolonlar = []
        for kolon in tablo.columns:
            kolonlar.append({
                "isim": kolon.name,
                "tip": str(kolon.type),
                "birincil_anahtar": kolon.primary_key
            })
        sema_bilgisi[tablo_adi] = kolonlar
    return sema_bilgisi

def sorgu_calistir(baglanti_metni, sql_sorgusu):
    Oturum = oturumlar.get(baglanti_metni)
    if not Oturum:
        baglanti_olustur(baglanti_metni)
        Oturum = oturumlar[baglanti_metni]
    
    import re
    if baglanti_metni.startswith("mysql") or baglanti_metni.startswith("mariadb"):
        sql_sorgusu = re.sub(r'(?i)\bINSERT\s+OR\s+IGNORE\s+INTO\b', 'INSERT IGNORE INTO', sql_sorgusu)
    elif baglanti_metni.startswith("postgresql"):
        # Basic fallback for postgresql (requires ON CONFLICT, but we'll leave it as INSERT INTO to let it run)
        sql_sorgusu = re.sub(r'(?i)\bINSERT\s+OR\s+IGNORE\s+INTO\b', 'INSERT INTO', sql_sorgusu)

    with Oturum() as oturum:
        if sql_sorgusu.strip().upper().startswith("SELECT"):
            sonuc = oturum.execute(text(sql_sorgusu))
            satirlar = sonuc.fetchall()
            kolon_isimleri = sonuc.keys()
            veriler = [dict(zip(kolon_isimleri, satir)) for satir in satirlar]
            return veriler
        else:
            raw_conn = oturum.connection().connection
            if hasattr(raw_conn, "dbapi_connection"):
                raw_conn = raw_conn.dbapi_connection
            if hasattr(raw_conn, "executescript"):
                raw_conn.executescript(sql_sorgusu)
            else:
                oturum.execute(text(sql_sorgusu))
            oturum.commit()
            return {"mesaj": "İşlem başarılı."}

def ornek_veri_getir(baglanti_metni, sema):
    Oturum = oturumlar.get(baglanti_metni)
    if not Oturum:
        baglanti_olustur(baglanti_metni)
        Oturum = oturumlar[baglanti_metni]
    
    ornekler = {}
    with Oturum() as oturum:
        for tablo_adi in sema.keys():
            try:
                sonuc = oturum.execute(text(f"SELECT * FROM {tablo_adi} LIMIT 5"))
                satirlar = sonuc.fetchall()
                kolon_isimleri = sonuc.keys()
                ornekler[tablo_adi] = [dict(zip(kolon_isimleri, satir)) for satir in satirlar]
            except Exception:
                ornekler[tablo_adi] = []
    return ornekler

def istatistik_getir(baglanti_metni):
    motor = baglanti_olustur(baglanti_metni)
    meta = MetaData()
    meta.reflect(bind=motor)
    
    toplam_satir = 0
    Oturum = oturumlar[baglanti_metni]
    with Oturum() as oturum:
        for tablo_adi in meta.tables.keys():
            try:
                sonuc = oturum.execute(text(f"SELECT COUNT(*) FROM {tablo_adi}"))
                toplam_satir += sonuc.scalar()
            except Exception:
                pass
                
    boyut_mb = "N/A"
    if baglanti_metni.startswith("sqlite:///"):
        import os
        dosya_yolu = baglanti_metni.replace("sqlite:///", "")
        if os.path.exists(dosya_yolu):
            boyut_mb = f"{round(os.path.getsize(dosya_yolu) / (1024 * 1024), 2)} MB"
            
    return {
        "tablo_sayisi": len(meta.tables),
        "toplam_satir": toplam_satir,
        "dosya_boyutu": boyut_mb
    }

def vt_olustur(dosya_adi):
    if not dosya_adi.endswith('.db'):
        dosya_adi += '.db'
    yol = os.path.join("yuklenenler", dosya_adi)
    os.makedirs("yuklenenler", exist_ok=True)
    if os.path.exists(yol):
        return False, "Bu isimde bir veritabanı zaten var."
    
    baglanti_metni = f"sqlite:///{yol}"
    motor = create_engine(baglanti_metni)
    motor.connect().close()
    return True, baglanti_metni

def hucre_guncelle(baglanti_metni, tablo_adi, pk_kolon, pk_deger, hedef_kolon, yeni_deger):
    Oturum = oturumlar.get(baglanti_metni)
    if not Oturum:
        baglanti_olustur(baglanti_metni)
        Oturum = oturumlar[baglanti_metni]
    
    with Oturum() as oturum:
        sorgu = text(f"UPDATE {tablo_adi} SET {hedef_kolon} = :yeni_deger WHERE {pk_kolon} = :pk_deger")
        oturum.execute(sorgu, {"yeni_deger": yeni_deger, "pk_deger": pk_deger})
        oturum.commit()
        return True

def satir_sil(baglanti_metni, tablo_adi, pk_kolon, pk_degerler):
    if not pk_degerler:
        return True
    Oturum = oturumlar.get(baglanti_metni)
    if not Oturum:
        baglanti_olustur(baglanti_metni)
        Oturum = oturumlar[baglanti_metni]
    
    with Oturum() as oturum:
        params = {f"p_{i}": v for i, v in enumerate(pk_degerler)}
        placeholders = ", ".join([f":{k}" for k in params.keys()])
        sorgu = text(f"DELETE FROM {tablo_adi} WHERE {pk_kolon} IN ({placeholders})")
        oturum.execute(sorgu, params)
        oturum.commit()
        return True

def tablo_sil(baglanti_metni, tablo_adi):
    Oturum = oturumlar.get(baglanti_metni)
    if not Oturum:
        baglanti_olustur(baglanti_metni)
        Oturum = oturumlar[baglanti_metni]
    
    with Oturum() as oturum:
        oturum.execute(text(f"DROP TABLE {tablo_adi}"))
        oturum.commit()
    return True

try:
    from faker import Faker
    fake = Faker('tr_TR')
except ImportError:
    fake = None
import random

def sahte_veri_uret(baglanti_metni, tablo_adi, adet):
    if not fake:
        raise Exception("Faker kütüphanesi kurulu değil. Lütfen 'pip install faker' çalıştırın.")
        
    sema = sema_getir(baglanti_metni)
    if tablo_adi not in sema:
        raise Exception(f"Tablo '{tablo_adi}' bulunamadı.")
        
    kolonlar = sema[tablo_adi]
    
    Oturum = oturumlar.get(baglanti_metni)
    if not Oturum:
        baglanti_olustur(baglanti_metni)
        Oturum = oturumlar[baglanti_metni]
        
    with Oturum() as oturum:
        for _ in range(adet):
            degerler = {}
            for k in kolonlar:
                isim = k["isim"]
                tip = k["tip"].upper()
                if (isim.lower() == "id" or "id" in isim.lower() and k.get("birincil_anahtar")) and ("INTEGER" in tip or "INT" in tip):
                    continue
                
                if "VARCHAR" in tip or "TEXT" in tip or "STRING" in tip:
                    isim_kucuk = isim.lower()
                    if "ad" in isim_kucuk and "soyad" not in isim_kucuk:
                        degerler[isim] = fake.first_name()
                    elif "soyad" in isim_kucuk:
                        degerler[isim] = fake.last_name()
                    elif "isim" in isim_kucuk or "name" in isim_kucuk:
                        degerler[isim] = fake.name()
                    elif "mail" in isim_kucuk:
                        degerler[isim] = fake.email()
                    elif "tel" in isim_kucuk or "phone" in isim_kucuk:
                        degerler[isim] = fake.phone_number()
                    elif "adres" in isim_kucuk or "address" in isim_kucuk:
                        degerler[isim] = fake.address()
                    elif "sehir" in isim_kucuk or "il" == isim_kucuk:
                        degerler[isim] = fake.city()
                    elif "ulke" in isim_kucuk:
                        degerler[isim] = fake.country()
                    elif "meslek" in isim_kucuk or "unvan" in isim_kucuk:
                        degerler[isim] = fake.job()
                    elif "tarih" in isim_kucuk or "date" in isim_kucuk:
                        degerler[isim] = str(fake.date_this_decade())
                    elif "renk" in isim_kucuk or "color" in isim_kucuk:
                        degerler[isim] = fake.color_name()
                    elif "sifre" in isim_kucuk or "password" in isim_kucuk:
                        degerler[isim] = fake.password()
                    else:
                        degerler[isim] = fake.word()
                elif "INT" in tip or "NUMERIC" in tip:
                    isim_kucuk = isim.lower()
                    if "yas" in isim_kucuk or "age" in isim_kucuk:
                        degerler[isim] = random.randint(18, 80)
                    elif "fiyat" in isim_kucuk or "price" in isim_kucuk or "tutar" in isim_kucuk or "maas" in isim_kucuk:
                        degerler[isim] = random.randint(100, 15000)
                    elif "stok" in isim_kucuk or "adet" in isim_kucuk or "miktar" in isim_kucuk:
                        degerler[isim] = random.randint(0, 500)
                    elif "id" in isim_kucuk:
                        # Try to find a parent table and pick a valid ID
                        parent_table = None
                        if isim_kucuk.endswith("_id"):
                            base_name = isim_kucuk[:-3]
                            if base_name + "lar" in sema:
                                parent_table = base_name + "lar"
                            elif base_name + "ler" in sema:
                                parent_table = base_name + "ler"
                            elif base_name + "leri" in sema:
                                parent_table = base_name + "leri"
                        
                        valid_ids = []
                        if parent_table:
                            try:
                                res = oturum.execute(text(f"SELECT {isim} FROM {parent_table} LIMIT 100"))
                                valid_ids = [row[0] for row in res.fetchall()]
                            except:
                                pass
                                
                        if valid_ids:
                            degerler[isim] = random.choice(valid_ids)
                        else:
                            degerler[isim] = random.randint(1, 10)
                    else:
                        degerler[isim] = random.randint(1, 1000)
                elif "FLOAT" in tip or "REAL" in tip or "DOUBLE" in tip or "DECIMAL" in tip:
                    degerler[isim] = round(random.uniform(10.0, 1000.0), 2)
                elif "BOOL" in tip:
                    degerler[isim] = random.choice([True, False])
                elif "DATE" in tip or "TIME" in tip:
                    # Matches DATE, DATETIME, TIMESTAMP
                    degerler[isim] = fake.date_time_this_decade().strftime("%Y-%m-%d %H:%M:%S")
                else:
                    # If type is unknown but name implies date/time
                    isim_kucuk = isim.lower()
                    if "tarih" in isim_kucuk or "date" in isim_kucuk or "zaman" in isim_kucuk or "_at" in isim_kucuk:
                        degerler[isim] = fake.date_time_this_decade().strftime("%Y-%m-%d %H:%M:%S")
                    else:
                        degerler[isim] = fake.word()
            
            if degerler:
                keys = ", ".join(degerler.keys())
                binds = ", ".join([f":{k}" for k in degerler.keys()])
                sorgu_str = f"INSERT INTO {tablo_adi} ({keys}) VALUES ({binds})"
                
                if baglanti_metni.startswith("mysql") or baglanti_metni.startswith("mariadb"):
                    sorgu_str = sorgu_str.replace("INSERT INTO", "INSERT IGNORE INTO")
                elif baglanti_metni.startswith("sqlite"):
                    sorgu_str = sorgu_str.replace("INSERT INTO", "INSERT OR IGNORE INTO")
                
                sorgu = text(sorgu_str)
                try:
                    oturum.execute(sorgu, degerler)
                except Exception:
                    oturum.rollback() # Sadece bu işlem başarısız olursa geri al
                    pass
        oturum.commit()
