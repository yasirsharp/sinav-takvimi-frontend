import { useCallback, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { bolumApi, type Bolum } from '../../api/bolum'
import { derslikApi } from '../../api/derslik'
import { dersApi } from '../../api/ders'
import { dbapApi, type DbapFormValues } from '../../api/dbap'
import { akademikPersonelApi, type AkademikPersonelFormValues } from '../../api/akademikPersonel'
import { ogrenciApi, type OgrenciCreateValues } from '../../api/ogrenci'
import type { BulkResult } from '../../api/account'
import { getErrorMessage } from '../../api/errors'
import { normalizeTr } from '../../utils/search'
import { DERS_KODU_PATTERN, normalizeDersKodu } from '../../utils/dersKodu'
import { useBolumler } from '../bolum/queries'
import { useDersler } from '../ders/queries'
import { useDerslikler } from '../derslik/queries'
import { useDbapList } from '../dbap/queries'
import { useAkademikPersoneller } from '../akademikPersonel/queries'
import { useOgrenciler } from '../ogrenci/queries'
import { derslerForBolum, isDuplicateDbap } from '../dbap/dbapRules'
import type { ImportDefinition, ImportResult } from './importTypes'
import { parseBoolTr, splitList } from './importUtils'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** Toplu uçlara tek istekte gönderilen satır sayısı (backend sınırı 1000) */
const BULK_CHUNK = 200

/** Satırları tek tek kaydeder (bölüm, derslik, ders, ders ataması gibi toplu ucu olmayan kaynaklar) */
async function runSequential<T>(
  rows: { row: number; value: T }[],
  save: (value: T) => Promise<unknown>,
  onProgress: (ratio: number) => void,
): Promise<ImportResult[]> {
  const results: ImportResult[] = []
  for (let i = 0; i < rows.length; i++) {
    try {
      await save(rows[i].value)
      results.push({ row: rows[i].row, success: true, message: 'Eklendi' })
    } catch (err) {
      results.push({ row: rows[i].row, success: false, message: getErrorMessage(err) })
    }
    onProgress((i + 1) / rows.length)
  }
  return results
}

/** Toplu uçla parça parça kaydeder; backend'in satır sırasını dosyadaki satır numarasına çevirir */
async function runBulk<T>(
  rows: { row: number; value: T }[],
  send: (values: T[]) => Promise<BulkResult>,
  onProgress: (ratio: number) => void,
): Promise<ImportResult[]> {
  const results: ImportResult[] = []
  for (let start = 0; start < rows.length; start += BULK_CHUNK) {
    const chunk = rows.slice(start, start + BULK_CHUNK)
    try {
      const res = await send(chunk.map((r) => r.value))
      for (const r of res.rows) {
        results.push({
          row: chunk[r.row - 1].row,
          success: r.success,
          message: r.message,
          userName: r.account?.userName,
          password: r.account?.temporaryPassword,
        })
      }
    } catch (err) {
      // Parçanın tamamı başarısız (ör. bağlantı hatası); kalan parçalar denenmeye devam eder
      const message = getErrorMessage(err)
      chunk.forEach((r) => results.push({ row: r.row, success: false, message }))
    }
    onProgress(Math.min(1, (start + chunk.length) / rows.length))
  }
  return results
}

/** Bölüm adlarını ID'ye çevirir (büyük/küçük harf ve ı/i farkı gözetilmez) */
function bolumResolver(bolumler: Bolum[] | undefined) {
  const byName = new Map((bolumler ?? []).map((b) => [normalizeTr(b.ad), b.id]))
  return (names: string[]) => {
    const ids: number[] = []
    const unknown: string[] = []
    for (const name of names) {
      const id = byName.get(normalizeTr(name))
      if (id) ids.push(id)
      else unknown.push(name)
    }
    return { ids: [...new Set(ids)], unknown }
  }
}

/** Aktarım bitince ilgili listeleri yeniler. Anahtarlar sabit olduğu için fonksiyon render'lar arasında aynı kalır. */
function useInvalidate(...keys: string[][]) {
  const queryClient = useQueryClient()
  const joined = JSON.stringify(keys)
  return useCallback(
    () => (JSON.parse(joined) as string[][]).forEach((queryKey) => void queryClient.invalidateQueries({ queryKey })),
    [queryClient, joined],
  )
}

const bolumNote = 'Bölüm adları sistemdeki adlarla aynı yazılmalıdır (büyük/küçük harf önemli değildir).'

export function useBolumImport(): ImportDefinition<{ ad: string }> {
  const { data: bolumler, isSuccess } = useBolumler()
  const invalidate = useInvalidate(['bolumler'])
  return useMemo(() => {
    const existing = new Set((bolumler ?? []).map((b) => normalizeTr(b.ad)))
    return {
      title: 'Bölüm',
      fileName: 'bolum',
      ready: isSuccess,
      columns: [{ key: 'ad', header: 'Bölüm adı', required: true, example: 'Bilgisayar Mühendisliği' }],
      parseRow: (v) => {
        const ad = v.ad.replace(/\s+/g, ' ').trim()
        const errors: string[] = []
        if (!ad) errors.push('Bölüm adı boş.')
        else if (ad.length > 200) errors.push('Bölüm adı en fazla 200 karakter.')
        else if (existing.has(normalizeTr(ad))) errors.push('Bu bölüm zaten kayıtlı.')
        return { value: { ad }, errors }
      },
      uniqueKey: (v) => normalizeTr(v.ad),
      run: async (rows, onProgress) => {
        const r = await runSequential(rows, (v) => bolumApi.create(v), onProgress)
        invalidate()
        return r
      },
    }
  }, [bolumler, isSuccess, invalidate])
}

interface DerslikRow {
  ad: string
  kapasite: number
  ortakDerslik: boolean
  bolumIds: number[]
}

export function useDerslikImport(): ImportDefinition<DerslikRow> {
  const { data: bolumler, isSuccess: b } = useBolumler()
  const { data: derslikler, isSuccess: d } = useDerslikler()
  const invalidate = useInvalidate(['derslikler'])
  return useMemo(() => {
    const resolve = bolumResolver(bolumler)
    const existing = new Set((derslikler ?? []).map((x) => normalizeTr(x.derslikAd)))
    return {
      title: 'Derslik',
      fileName: 'derslik',
      ready: b && d,
      notes: bolumNote,
      columns: [
        { key: 'ad', header: 'Derslik adı', required: true, example: 'MF-A101' },
        { key: 'kapasite', header: 'Kapasite', required: true, example: '40', help: 'sınav düzeninde kaç öğrenci alır' },
        { key: 'ortak', header: 'Ortak derslik', example: 'Hayır', help: 'Evet ise tüm bölümler kullanır' },
        { key: 'bolumler', header: 'Bölümler', example: 'Bilgisayar Mühendisliği', help: 'ortak değilse zorunlu; birden çok bölüm virgülle ayrılır' },
      ],
      parseRow: (v) => {
        const errors: string[] = []
        const ad = v.ad.trim()
        const kapasite = Number(v.kapasite)
        const ortak = parseBoolTr(v.ortak)
        if (!ad) errors.push('Derslik adı boş.')
        else if (existing.has(normalizeTr(ad))) errors.push('Bu derslik zaten kayıtlı.')
        if (!Number.isInteger(kapasite) || kapasite < 1 || kapasite > 1000) errors.push('Kapasite 1–1000 arası tam sayı olmalı.')
        if (ortak === null) errors.push('"Ortak derslik" Evet veya Hayır olmalı.')
        const { ids, unknown } = resolve(splitList(v.bolumler))
        if (unknown.length) errors.push(`Bölüm bulunamadı: ${unknown.join(', ')}.`)
        if (!ortak && ids.length === 0 && !unknown.length) errors.push('Ortak olmayan derslik için en az bir bölüm yazın.')
        return { value: { ad, kapasite, ortakDerslik: !!ortak, bolumIds: ortak ? [] : ids }, errors }
      },
      uniqueKey: (v) => normalizeTr(v.ad),
      run: async (rows, onProgress) => {
        const r = await runSequential(rows, (v) => derslikApi.create({ ...v, status: true }), onProgress)
        invalidate()
        return r
      },
    }
  }, [bolumler, derslikler, b, d, invalidate])
}

interface DersRow {
  kod: string
  ad: string
  ortakDers: boolean
  bolumIds: number[]
}

export function useDersImport(): ImportDefinition<DersRow> {
  const { data: bolumler, isSuccess: b } = useBolumler()
  const { data: dersler, isSuccess: d } = useDersler()
  const invalidate = useInvalidate(['dersler'])
  return useMemo(() => {
    const resolve = bolumResolver(bolumler)
    const existing = new Set((dersler ?? []).map((x) => x.kod ?? ''))
    return {
      title: 'Ders',
      fileName: 'ders',
      ready: b && d,
      notes: bolumNote,
      columns: [
        { key: 'kod', header: 'Ders kodu', required: true, example: 'BLM201', help: 'harf ve rakam, boşluksuz' },
        { key: 'ad', header: 'Ders adı', required: true, example: 'Veri Yapıları' },
        { key: 'ortak', header: 'Ortak ders', example: 'Hayır', help: 'Evet ise bölümü olmayan ortak ders (ör. Türk Dili)' },
        { key: 'bolumler', header: 'Bölümler', example: 'Bilgisayar Mühendisliği', help: 'ortak değilse zorunlu; virgülle ayrılır' },
      ],
      parseRow: (v) => {
        const errors: string[] = []
        const kod = normalizeDersKodu(v.kod)
        const ad = v.ad.replace(/\s+/g, ' ').trim()
        const ortak = parseBoolTr(v.ortak)
        if (!kod) errors.push('Ders kodu boş.')
        else if (!DERS_KODU_PATTERN.test(kod)) errors.push('Ders kodu sadece harf ve rakam içerebilir.')
        else if (existing.has(kod)) errors.push('Bu ders kodu zaten kayıtlı.')
        if (!ad) errors.push('Ders adı boş.')
        if (ortak === null) errors.push('"Ortak ders" Evet veya Hayır olmalı.')
        const { ids, unknown } = resolve(splitList(v.bolumler))
        if (unknown.length) errors.push(`Bölüm bulunamadı: ${unknown.join(', ')}.`)
        if (!ortak && ids.length === 0 && !unknown.length) errors.push('Ortak olmayan ders için en az bir bölüm yazın.')
        return { value: { kod, ad, ortakDers: !!ortak, bolumIds: ortak ? [] : ids }, errors }
      },
      uniqueKey: (v) => v.kod,
      run: async (rows, onProgress) => {
        const r = await runSequential(rows, (v) => dersApi.create(v), onProgress)
        invalidate()
        return r
      },
    }
  }, [bolumler, dersler, b, d, invalidate])
}

export function usePersonelImport(): ImportDefinition<AkademikPersonelFormValues> {
  const { data: personeller, isSuccess } = useAkademikPersoneller()
  const invalidate = useInvalidate(['akademikPersonel'], ['users'])
  return useMemo(() => {
    const existing = new Set((personeller ?? []).map((p) => normalizeTr(p.ad)))
    return {
      title: 'Akademik personel',
      fileName: 'akademik-personel',
      ready: isSuccess,
      credentials: true,
      notes: 'Her personel için kullanıcı hesabı ve geçici parola oluşturulur. E-posta verilirse kullanıcı adı e-postanın @ öncesi olur.',
      columns: [
        { key: 'unvan', header: 'Unvan', required: true, example: 'Dr. Öğr. Üyesi' },
        { key: 'ad', header: 'Ad Soyad', required: true, example: 'Ayşe Yılmaz' },
        { key: 'email', header: 'E-posta', example: 'ayse.yilmaz@duzce.edu.tr', aliases: ['eposta', 'email', 'mail'] },
      ],
      parseRow: (v) => {
        const errors: string[] = []
        const ad = v.ad.replace(/\s+/g, ' ').trim()
        const unvan = v.unvan.trim()
        const email = v.email.trim().toLowerCase()
        if (!unvan) errors.push('Unvan boş.')
        if (ad.split(' ').length < 2) errors.push('Ad ve soyadı birlikte yazın.')
        else if (existing.has(normalizeTr(ad))) errors.push('Bu adla bir personel zaten kayıtlı.')
        if (email && !EMAIL.test(email)) errors.push('E-posta geçersiz.')
        return { value: { ad, unvan, email: email || null }, errors }
      },
      uniqueKey: (v) => v.email || normalizeTr(v.ad),
      run: async (rows, onProgress) => {
        const r = await runBulk(rows, akademikPersonelApi.bulkCreate, onProgress)
        invalidate()
        return r
      },
    }
  }, [personeller, isSuccess, invalidate])
}

export function useOgrenciImport(): ImportDefinition<OgrenciCreateValues> {
  const { data: bolumler, isSuccess: b } = useBolumler()
  const { data: ogrenciler, isSuccess: o } = useOgrenciler()
  const invalidate = useInvalidate(['ogrenciler'], ['users'])
  return useMemo(() => {
    const resolve = bolumResolver(bolumler)
    const existing = new Set((ogrenciler ?? []).map((x) => x.ogrenciNo))
    return {
      title: 'Öğrenci',
      fileName: 'ogrenci',
      ready: b && o,
      credentials: true,
      notes: (
        `Her öğrenci için kullanıcı hesabı açılır; kullanıcı adı öğrenci numarasıdır. E-posta boşsa ` +
        `<öğrenci no>@ogr.duzce.edu.tr kullanılır. ${bolumNote}`
      ),
      columns: [
        { key: 'ogrenciNo', header: 'Öğrenci No', required: true, example: '2026123456', aliases: ['numara', 'no'] },
        { key: 'ad', header: 'Ad', required: true, example: 'Elif' },
        { key: 'soyad', header: 'Soyad', required: true, example: 'Şahin' },
        { key: 'bolum', header: 'Bölüm', required: true, example: 'Bilgisayar Mühendisliği' },
        { key: 'sinif', header: 'Sınıf', example: '1' },
        { key: 'email', header: 'E-posta', example: '', aliases: ['eposta', 'email'] },
      ],
      parseRow: (v) => {
        const errors: string[] = []
        const ogrenciNo = v.ogrenciNo.replace(/\s+/g, '')
        const sinif = v.sinif ? Number(v.sinif) : null
        const email = v.email.trim().toLowerCase()
        if (!ogrenciNo) errors.push('Öğrenci no boş.')
        else if (!/^[A-Za-z0-9]{1,20}$/.test(ogrenciNo)) errors.push('Öğrenci no sadece harf ve rakam, en fazla 20 karakter.')
        else if (existing.has(ogrenciNo)) errors.push('Bu öğrenci no zaten kayıtlı.')
        if (!v.ad.trim()) errors.push('Ad boş.')
        if (!v.soyad.trim()) errors.push('Soyad boş.')
        const { ids, unknown } = resolve([v.bolum])
        if (!v.bolum.trim()) errors.push('Bölüm boş.')
        else if (unknown.length) errors.push(`Bölüm bulunamadı: ${v.bolum}.`)
        if (sinif != null && (!Number.isInteger(sinif) || sinif < 1 || sinif > 8)) errors.push('Sınıf 1–8 arası olmalı.')
        if (email && !EMAIL.test(email)) errors.push('E-posta geçersiz.')
        return {
          value: { ogrenciNo, ad: v.ad.trim(), soyad: v.soyad.trim(), bolumId: ids[0], sinif, email: email || null },
          errors,
        }
      },
      uniqueKey: (v) => v.ogrenciNo,
      run: async (rows, onProgress) => {
        const r = await runBulk(rows, ogrenciApi.bulkCreate, onProgress)
        invalidate()
        return r
      },
    }
  }, [bolumler, ogrenciler, b, o, invalidate])
}

/** "Dr. Öğr. Üyesi Ayşe Yılmaz" → "ayse yilmaz" benzeri karşılaştırma için unvanı atar */
const UNVAN_PREFIX = /^((prof|doç|doc|dr|öğr|ogr|gör|gor|arş|ars|üyesi|uyesi|öğretim|ogretim|görevlisi|gorevlisi)\.?\s+)+/i

export function stripUnvan(name: string): string {
  return normalizeTr(name.replace(UNVAN_PREFIX, ''))
}

export function useDbapImport(): ImportDefinition<DbapFormValues> {
  const { data: bolumler, isSuccess: b } = useBolumler()
  const { data: dersler, isSuccess: d } = useDersler()
  const { data: personeller, isSuccess: p } = useAkademikPersoneller()
  const { data: dbapList, isSuccess: l } = useDbapList()
  const invalidate = useInvalidate(['dbap'])
  return useMemo(() => {
    const resolve = bolumResolver(bolumler)
    const personelByName = new Map<string, number[]>()
    for (const x of personeller ?? []) {
      const key = stripUnvan(x.ad)
      personelByName.set(key, [...(personelByName.get(key) ?? []), x.id])
    }
    return {
      title: 'Ders ataması',
      fileName: 'ders-atamalari',
      ready: b && d && p && l,
      notes: 'Önce bölümleri, dersleri ve akademik personeli aktarın. Öğretim elemanı ad soyadıyla eşleştirilir (unvan yazılsa da olur).',
      columns: [
        { key: 'dersKodu', header: 'Ders kodu', required: true, example: 'BLM201' },
        { key: 'bolum', header: 'Bölüm', required: true, example: 'Bilgisayar Mühendisliği' },
        { key: 'personel', header: 'Öğretim elemanı', required: true, example: 'Ayşe Yılmaz', aliases: ['personel', 'hoca'] },
      ],
      parseRow: (v) => {
        const errors: string[] = []
        const kod = normalizeDersKodu(v.dersKodu)
        const { ids } = resolve([v.bolum])
        const bolumId = ids[0]
        if (!bolumId) errors.push(`Bölüm bulunamadı: ${v.bolum || '(boş)'}.`)
        const ders = (dersler ?? []).find((x) => x.kod === kod)
        if (!ders) errors.push(`Ders bulunamadı: ${kod || '(boş)'}.`)
        else if (bolumId && !derslerForBolum([ders], bolumId).length) errors.push('Bu ders bu bölümde verilmiyor (Dersler ekranından bölümü ekleyin).')
        const matches = personelByName.get(stripUnvan(v.personel)) ?? []
        if (matches.length === 0) errors.push(`Öğretim elemanı bulunamadı: ${v.personel || '(boş)'}.`)
        else if (matches.length > 1) errors.push('Bu adla birden çok personel var; elle atayın.')
        const value = { dersId: ders?.dersId ?? 0, bolumId: bolumId ?? 0, akademikPersonelId: matches[0] ?? 0 }
        if (!errors.length && isDuplicateDbap(dbapList ?? [], value)) errors.push('Bu atama zaten var.')
        return { value, errors }
      },
      uniqueKey: (v) => `${v.dersId}-${v.bolumId}-${v.akademikPersonelId}`,
      run: async (rows, onProgress) => {
        const r = await runSequential(rows, (v) => dbapApi.create(v), onProgress)
        invalidate()
        return r
      },
    }
  }, [bolumler, dersler, personeller, dbapList, b, d, p, l, invalidate])
}
