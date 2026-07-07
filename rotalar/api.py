from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
from servisler import vt_servisi, yz_servisi
import os
import shutil

router = APIRouter()

class BaglantiIstegi(BaseModel):
    baglanti_metni: str

class AciklamaIstegi(BaseModel):
    baglanti_metni: str
    api_anahtari: str
    ai_model: str = "gemini"
    qwen_api_key: str = ""

class SqlIstegi(BaseModel):
    baglanti_metni: str
    api_anahtari: str
    istek_metni: str
    ai_model: str = "gemini"
    qwen_api_key: str = ""

class SorguCalistirmaIstegi(BaseModel):
    baglanti_metni: str
    sql_sorgusu: str

class VeriUretmeIstegi(BaseModel):
    baglanti_metni: str
    api_anahtari: str
    tablo_adi: str
    adet: int
    ai_model: str = "gemini"
    qwen_api_key: str = ""

class IleriAnalizIstegi(BaseModel):
    baglanti_metni: str
    api_anahtari: str
    ai_model: str = "gemini"
    qwen_api_key: str = ""

class SohbetIstegi(BaseModel):
    baglanti_metni: str
    api_anahtari: str
    mesaj: str
    gecmis: list = []
    ai_model: str = "gemini"
    qwen_api_key: str = ""

class VtOlusturIstegi(BaseModel):
    dosya_adi: str

class LinkIstegi(BaseModel):
    url: str
    api_anahtari: str
    ai_model: str = "gemini"
    qwen_api_key: str = ""

from typing import Any

class HucreGuncelleIstegi(BaseModel):
    baglanti_metni: str
    tablo_adi: str
    pk_kolon: str
    pk_deger: Any
    hedef_kolon: str
    yeni_deger: Any

class SatirSilIstegi(BaseModel):
    baglanti_metni: str
    tablo_adi: str
    pk_kolon: str
    pk_degerler: list

class TabloSilIstegi(BaseModel):
    baglanti_metni: str
    tablo_adi: str

@router.post("/yukle")
async def dosya_yukle(dosya: UploadFile = File(...)):
    try:
        os.makedirs("yuklenenler", exist_ok=True)
        hedef_yol = os.path.join("yuklenenler", dosya.filename)
        with open(hedef_yol, "wb") as f:
            shutil.copyfileobj(dosya.file, f)
            
        if dosya.filename.endswith(".sql"):
            vt_yolu = hedef_yol + ".db"
            if os.path.exists(vt_yolu):
                os.remove(vt_yolu)
            baglanti_metni = f"sqlite:///{vt_yolu}"
            with open(hedef_yol, "r", encoding="utf-8", errors="ignore") as sql_f:
                sql_icerik = sql_f.read()
                sorgular = sql_icerik.split(";")
                for sorgu in sorgular:
                    if sorgu.strip():
                        try:
                            vt_servisi.sorgu_calistir(baglanti_metni, sorgu)
                        except Exception:
                            pass
            return {"baglanti_metni": baglanti_metni}
        else:
            return {"baglanti_metni": f"sqlite:///{hedef_yol}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/sema")
def sema_getir(istek: BaglantiIstegi):
    try:
        sema = vt_servisi.sema_getir(istek.baglanti_metni)
        return {"sema": sema}
    except Exception as e:
        import traceback
        print("SEMA GETIR ERROR:")
        print(traceback.format_exc())
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/acikla")
def veritabani_acikla(istek: AciklamaIstegi):
    try:
        sema = vt_servisi.sema_getir(istek.baglanti_metni)
        aciklama = yz_servisi.veritabani_acikla(istek.api_anahtari, sema, istek.ai_model, istek.qwen_api_key)
        return {"aciklama": aciklama}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/sql-olustur")
def sql_olustur(istek: SqlIstegi):
    try:
        sema = vt_servisi.sema_getir(istek.baglanti_metni)
        sql = yz_servisi.sql_olustur(istek.api_anahtari, sema, istek.istek_metni, istek.ai_model, istek.qwen_api_key)
        return {"sql": sql}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/sorgu-calistir")
def sorgu_calistir(istek: SorguCalistirmaIstegi):
    try:
        sonuc = vt_servisi.sorgu_calistir(istek.baglanti_metni, istek.sql_sorgusu)
        return {"sonuc": sonuc}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/veri-uret")
def veri_uret(istek: VeriUretmeIstegi):
    try:
        sema = vt_servisi.sema_getir(istek.baglanti_metni)
        sql = yz_servisi.veri_uret(istek.api_anahtari, sema, istek.tablo_adi, istek.adet, istek.ai_model, istek.qwen_api_key)
        sonuc = vt_servisi.sorgu_calistir(istek.baglanti_metni, sql)
        return {"mesaj": f"{istek.adet} adet veri üretildi ve eklendi.", "sql": sql}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/anomali-tara")
def anomali_tara(istek: IleriAnalizIstegi):
    try:
        sema = vt_servisi.sema_getir(istek.baglanti_metni)
        ornek_veri = vt_servisi.ornek_veri_getir(istek.baglanti_metni, sema)
        sonuc = yz_servisi.anomali_tara(istek.api_anahtari, sema, ornek_veri, istek.ai_model, istek.qwen_api_key)
        return {"sonuc": sonuc}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/iliski-kesfet")
def iliski_kesfet(istek: IleriAnalizIstegi):
    try:
        sema = vt_servisi.sema_getir(istek.baglanti_metni)
        ornek_veri = vt_servisi.ornek_veri_getir(istek.baglanti_metni, sema)
        sonuc = yz_servisi.iliski_kesfet(istek.api_anahtari, sema, ornek_veri, istek.ai_model, istek.qwen_api_key)
        return {"sonuc": sonuc}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/api-kodu-uret")
def api_kodu_uret(istek: IleriAnalizIstegi):
    try:
        sema = vt_servisi.sema_getir(istek.baglanti_metni)
        kod = yz_servisi.api_kodu_uret(istek.api_anahtari, sema, istek.ai_model, istek.qwen_api_key)
        return {"kod": kod}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/istatistik")
def istatistik_getir(istek: BaglantiIstegi):
    try:
        istatistik = vt_servisi.istatistik_getir(istek.baglanti_metni)
        return istatistik
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/sohbet")
def sohbet(istek: SohbetIstegi):
    try:
        sema = {}
        if istek.baglanti_metni:
            try:
                sema = vt_servisi.sema_getir(istek.baglanti_metni)
            except:
                pass
                
        yanit = yz_servisi.sohbet_asistani(
            istek.api_anahtari, 
            sema, 
            istek.mesaj, 
            istek.gecmis, 
            istek.ai_model, 
            istek.qwen_api_key,
            istek.baglanti_metni
        )
        
        if yanit.get("tip") == "sistem_ve_sql":
            if yanit.get("islem") == "vt_olustur":
                db_adi = yanit.get("arguman", "yeni_vt")
                basari, yeni_baglanti = vt_servisi.vt_olustur(db_adi)
                if basari:
                    try:
                        for sorgu in yanit.get("sorgular", []):
                            vt_servisi.sorgu_calistir(yeni_baglanti, sorgu)
                        return {"tip": "sistem_basarili", "mesaj": yanit.get("mesaj"), "baglanti_metni": yeni_baglanti}
                    except Exception as sqle:
                        return {"tip": "mesaj", "icerik": f"**Veritabanı Oluşturma Hatası:** Yapay zeka hatalı bir SQL üretti.\n\n`{str(sqle)}`"}
                else:
                    return {"tip": "mesaj", "icerik": "VT Hatası: " + yeni_baglanti}
                    
        elif yanit.get("tip") == "sql":
            sorgular = yanit.get("sorgular", [])
            if not sorgular and "sorgu" in yanit:
                sorgular = [yanit.get("sorgu")]
                
            son_sonuc = None
            try:
                for sorgu in sorgular:
                    son_sonuc = vt_servisi.sorgu_calistir(istek.baglanti_metni, sorgu)
            except Exception as sqle:
                return {"tip": "mesaj", "icerik": f"**Sorgu Hatası:** İşlem sırasında veritabanı bir sözdizimi veya kısıtlama hatası verdi. Yapay zekanın ürettiği SQL geçersiz olabilir:\n\n`{str(sqle)}`"}
            
            # Eğer tablo okuma (SELECT) yapıldıysa veri dön, değilse mesaj dön
            if sorgular and sorgular[-1].strip().upper().startswith("SELECT"):
                return {"tip": "veri", "icerik": son_sonuc, "mesaj": yanit.get("mesaj")}
            else:
                return {"tip": "bildirim", "icerik": yanit.get("mesaj") or "İşlem başarıyla tamamlandı."}
                
        elif yanit.get("tip") == "veri_uret":
            tablolar = yanit.get("tablolar", [])
            adet = yanit.get("adet", 10)
            if not tablolar:
                return {"tip": "mesaj", "icerik": "Tablo adı anlaşılamadı, lütfen tekrar deneyin."}
            
            try:
                for tablo in tablolar:
                    vt_servisi.sahte_veri_uret(istek.baglanti_metni, tablo, adet)
                return {"tip": "bildirim", "icerik": f"{len(tablolar)} tabloyaya başarıyla {adet} adet sentetik veri eklendi."}
            except Exception as e:
                return {"tip": "mesaj", "icerik": f"Veri üretilirken hata oluştu: `{str(e)}`"}
                
        else:
            return {"tip": "mesaj", "icerik": yanit.get("icerik")}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/vt-olustur")
def vt_olustur(istek: VtOlusturIstegi):
    basari, sonuc = vt_servisi.vt_olustur(istek.dosya_adi)
    if not basari:
        raise HTTPException(status_code=400, detail=sonuc)
    return {"baglanti_metni": sonuc}

@router.post("/hucre-guncelle")
def hucre_guncelle(istek: HucreGuncelleIstegi):
    try:
        vt_servisi.hucre_guncelle(istek.baglanti_metni, istek.tablo_adi, istek.pk_kolon, istek.pk_deger, istek.hedef_kolon, istek.yeni_deger)
        return {"mesaj": "Güncellendi"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/satir-sil")
def satir_sil(istek: SatirSilIstegi):
    try:
        vt_servisi.satir_sil(istek.baglanti_metni, istek.tablo_adi, istek.pk_kolon, istek.pk_degerler)
        return {"mesaj": f"{len(istek.pk_degerler)} satır silindi."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/tablo-sil")
def tablo_sil(istek: TabloSilIstegi):
    try:
        vt_servisi.tablo_sil(istek.baglanti_metni, istek.tablo_adi)
        return {"mesaj": f"{istek.tablo_adi} tablosu silindi."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

import sqlite3

@router.post("/vt-indir")
def vt_indir(istek: BaglantiIstegi):
    try:
        baglanti = istek.baglanti_metni
        if baglanti.startswith("sqlite:///"):
            dosya_yolu = baglanti.replace("sqlite:///", "")
            if os.path.exists(dosya_yolu):
                con = sqlite3.connect(dosya_yolu)
                sql_dump = "\n".join(con.iterdump())
                con.close()
                return {"sql": sql_dump}
            else:
                raise Exception("Veritabanı dosyası bulunamadı.")
        else:
            raise Exception("Sadece SQLite veritabanları indirilebilir.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/vt-db-indir")
def vt_db_indir(istek: BaglantiIstegi):
    try:
        baglanti = istek.baglanti_metni
        if baglanti.startswith("sqlite:///"):
            dosya_yolu = baglanti.replace("sqlite:///", "")
            if os.path.exists(dosya_yolu):
                return FileResponse(
                    path=dosya_yolu,
                    filename=os.path.basename(dosya_yolu),
                    media_type="application/x-sqlite3"
                )
            else:
                raise Exception("Veritabanı dosyası bulunamadı.")
        else:
            raise Exception("Sadece SQLite veritabanları indirilebilir.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

import tkinter as tk
from tkinter import filedialog

@router.get("/yerel-dosya-sec")
def yerel_dosya_sec():
    try:
        root = tk.Tk()
        root.withdraw()
        root.attributes('-topmost', True)
        dosya_yolu = filedialog.askopenfilename(
            title="DBCoors İçin Orjinal Veritabanını Seçin",
            filetypes=[("SQLite Veritabanı", "*.db *.sqlite"), ("SQL Dosyası", "*.sql"), ("Tüm Dosyalar", "*.*")]
        )
        root.destroy()
        if dosya_yolu:
            # Eğer seçilen dosya .sql ise, aynı klasörde .db'ye dönüştür
            if dosya_yolu.lower().endswith(".sql"):
                vt_yolu = dosya_yolu + ".db"
                if os.path.exists(vt_yolu):
                    os.remove(vt_yolu)
                
                with open(dosya_yolu, "r", encoding="utf-8") as f:
                    sql_icerik = f.read()
                    
                import sqlite3
                baglanti = sqlite3.connect(vt_yolu)
                baglanti.executescript(sql_icerik)
                baglanti.commit()
                baglanti.close()
                dosya_yolu = vt_yolu
                
            # Dosya yolundaki tüm ters eğik çizgileri (backslash) düz eğik çizgiye çevir
            # SQLAlchemy Windows'ta sqlite:///C:/Users/Ali... formatını sever
            dosya_yolu_duz = dosya_yolu.replace('\\', '/')
            return {"baglanti_metni": f"sqlite:///{dosya_yolu_duz}", "dosya_adi": os.path.basename(dosya_yolu)}
        return {"baglanti_metni": "", "dosya_adi": ""}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/linkten-cek")
def linkten_cek(istek: LinkIstegi):
    try:
        # 1. Fetch text content from URL
        sayfa_metni = yz_servisi.url_icerik_cek(istek.url)
        
        # 2. Let AI write the SQL script
        sql_icerik = yz_servisi.linkten_sql_olustur(istek.api_anahtari, istek.url, sayfa_metni, istek.ai_model, istek.qwen_api_key)
        
        # 3. Create a SQLite DB file based on URL hash/name
        import urllib.parse
        parsed_url = urllib.parse.urlparse(istek.url)
        domain = parsed_url.netloc or "link"
        domain_clean = "".join([c if c.isalnum() else "_" for c in domain])
        import uuid
        db_adi = f"{domain_clean}_{uuid.uuid4().hex[:6]}.db"
        
        basari, baglanti_metni = vt_servisi.vt_olustur(db_adi)
        if not basari:
            raise Exception(baglanti_metni)
            
        # 4. Run the SQL script to create tables and insert data
        sorgular = sql_icerik.split(";")
        for sorgu in sorgular:
            if sorgu.strip():
                try:
                    vt_servisi.sorgu_calistir(baglanti_metni, sorgu)
                except Exception as e:
                    print("Sorgu hatası (Linkten Çek):", e)
                    pass
        
        # Format path for Windows if necessary
        baglanti_metni_duz = baglanti_metni.replace('\\', '/')
        return {"baglanti_metni": baglanti_metni_duz, "dosya_adi": db_adi}
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=400, detail=str(e))

