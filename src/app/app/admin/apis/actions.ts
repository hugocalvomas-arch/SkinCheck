'use server'
import { usuarioActual } from '@/lib/auth'
import { probar } from '@/server/bancoApis'

export async function probarProveedor(id: string) {
  const { esAdmin } = await usuarioActual()
  if (!esAdmin) return []
  return probar(id)
}
