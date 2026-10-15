/**
 * Backend'deki Business/Constants/Roles.cs ile birebir aynı tutulmalıdır.
 */
export const Roles = {
  SuperAdmin: 'super.admin',
  Admin: 'Admin',
  BolumGorevlisi: 'bolum.gorevlisi',
  GorevliPersonel: 'gorevli.personel',
  AkademikPersonel: 'akademik.personel',
  Ogrenci: 'ogrenci',
} as const

export type RoleName = (typeof Roles)[keyof typeof Roles]

/** Kullanıcı, yetki, bölüm ve personel yönetimi */
export const Yonetici: readonly string[] = [Roles.SuperAdmin, Roles.Admin]
/** Ders, derslik, DBAP ve sınav planlaması */
export const Planlayici: readonly string[] = [...Yonetici, Roles.BolumGorevlisi]
/** Öğrenci olmayan tüm personel */
export const Personel: readonly string[] = [...Planlayici, Roles.GorevliPersonel, Roles.AkademikPersonel]

/** Kullanıcının verilen rollerden en az birine sahip olup olmadığını döner. allowed boşsa herkes erişebilir. */
export function hasAnyRole(userRoles: readonly string[], allowed?: readonly string[]): boolean {
  if (!allowed || allowed.length === 0) return true
  return userRoles.some((role) => allowed.includes(role))
}

const ROLE_LABELS: Record<string, string> = {
  [Roles.SuperAdmin]: 'Süper Yönetici',
  [Roles.Admin]: 'Yönetici',
  [Roles.BolumGorevlisi]: 'Bölüm Görevlisi',
  [Roles.GorevliPersonel]: 'Görevli Personel',
  [Roles.AkademikPersonel]: 'Akademik Personel',
  [Roles.Ogrenci]: 'Öğrenci',
}

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role
}
