import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import writeXlsxFile from 'write-excel-file/node'

/** Testlerde içe aktarılan örnek dosyalar (her çalıştırmada geçici klasöre üretilir) */
export const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sinav-e2e-'))

const csv = (rows: string[][]) =>
  '﻿' + rows.map((r) => r.map((c) => (/[";\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(';')).join('\r\n')

async function xlsx(rows: (string | number)[][], name: string) {
  const data = rows.map((r) => r.map((v) => ({ value: v, type: typeof v === 'number' ? Number : String })))
  await writeXlsxFile(data as never).toFile(path.join(fixtureDir, name))
}

export const OGRENCI_SAYISI = 60

export async function writeFixtures() {
  await xlsx([['Bölüm adı'], ['Bilgisayar Mühendisliği'], ['Elektrik-Elektronik Mühendisliği'], ['İnşaat Mühendisliği'], ['bilgisayar mühendisliği']], 'bolum.xlsx')
  fs.writeFileSync(
    path.join(fixtureDir, 'derslik.csv'),
    csv([
      ['Derslik adı', 'Kapasite', 'Ortak derslik', 'Bölümler'],
      ['MF-A101', '40', 'Hayır', 'Bilgisayar Mühendisliği'],
      ['MF-A102', '60', 'evet', ''],
      ['MF-B201', '35', 'Hayır', 'Bilgisayar Mühendisliği, Elektrik-Elektronik Mühendisliği'],
      ['MF-B202', 'kırk', 'Hayır', 'Kimya'],
    ]),
  )
  await xlsx(
    [
      ['Ders kodu', 'Ders adı', 'Ortak ders', 'Bölümler'],
      ['blm 201', 'Veri Yapıları', 'Hayır', 'Bilgisayar Mühendisliği'],
      ['BLM202', 'Algoritmalar', 'Hayır', 'Bilgisayar Mühendisliği'],
      ['EEM101', 'Devre Teorisi', 'Hayır', 'Elektrik-Elektronik Mühendisliği'],
      ['TDL101', 'Türk Dili I', 'Evet', ''],
    ],
    'ders.xlsx',
  )
  await xlsx(
    [
      ['Unvan', 'Ad Soyad', 'E-posta'],
      ['Prof. Dr.', 'Zeynep Çelik', 'zeynep.celik@duzce.edu.tr'],
      ['Dr. Öğr. Üyesi', 'Mehmet Öz', 'mehmet.oz@duzce.edu.tr'],
      ['Öğr. Gör.', 'Ali Can Yıldız', 'alican.yildiz@duzce.edu.tr'],
      ['', 'Eksik Unvan', ''],
    ],
    'personel.xlsx',
  )
  const ogr = [['Öğrenci No', 'Ad', 'Soyad', 'Bölüm', 'Sınıf', 'E-posta']]
  for (let i = 1; i <= OGRENCI_SAYISI; i++) {
    ogr.push([String(2026100000 + i), `Öğrenci${i}`, 'Test', i % 2 ? 'Bilgisayar Mühendisliği' : 'Elektrik-Elektronik Mühendisliği', String((i % 4) + 1), ''])
  }
  ogr.push(['2026100001', 'Tekrar', 'Satır', 'Bilgisayar Mühendisliği', '1', ''])
  ogr.push(['2026999999', 'Yanlış', 'Bölüm', 'Tıp', '1', ''])
  fs.writeFileSync(path.join(fixtureDir, 'ogrenci.csv'), csv(ogr))
  await xlsx(
    [
      ['Ders kodu', 'Bölüm', 'Öğretim elemanı'],
      ['BLM201', 'Bilgisayar Mühendisliği', 'Prof. Dr. Zeynep Çelik'],
      ['BLM202', 'Bilgisayar Mühendisliği', 'Mehmet Öz'],
      ['TDL101', 'İnşaat Mühendisliği', 'Ali Can Yıldız'],
      ['EEM101', 'Bilgisayar Mühendisliği', 'Mehmet Öz'],
      ['XYZ999', 'Bilgisayar Mühendisliği', 'Mehmet Öz'],
    ],
    'dbap.xlsx',
  )
}
