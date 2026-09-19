import { describe, expect, test } from 'vitest'
import { categoryBadgeClass, formatShowingRange, getInitials, getVisiblePageNumbers } from './history'

describe('getVisiblePageNumbers', () => {
  test('muestra todas las páginas cuando caben en la ventana', () => {
    expect(getVisiblePageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5])
    expect(getVisiblePageNumbers(3, 3)).toEqual([1, 2, 3])
  })

  test('centra la ventana en la página actual', () => {
    expect(getVisiblePageNumbers(5, 10)).toEqual([3, 4, 5, 6, 7])
  })

  test('recorta al inicio y al final', () => {
    expect(getVisiblePageNumbers(1, 10)).toEqual([1, 2, 3, 4, 5])
    expect(getVisiblePageNumbers(10, 10)).toEqual([6, 7, 8, 9, 10])
  })

  test('una sola página', () => {
    expect(getVisiblePageNumbers(1, 1)).toEqual([1])
  })
})

describe('formatShowingRange', () => {
  test('calcula el rango visible de la página', () => {
    expect(formatShowingRange(1, 10, 58)).toEqual({ from: 1, to: 10 })
    expect(formatShowingRange(6, 10, 58)).toEqual({ from: 51, to: 58 })
    expect(formatShowingRange(2, 10, 15)).toEqual({ from: 11, to: 15 })
  })

  test('total en cero', () => {
    expect(formatShowingRange(1, 10, 0)).toEqual({ from: 0, to: 0 })
  })
})

describe('getInitials', () => {
  test('usa el nombre del perfil', () => {
    expect(getInitials('Johan Castillon', 'johan@example.com')).toBe('JC')
    expect(getInitials('María', 'maria@example.com')).toBe('M')
  })

  test('usa el correo cuando no hay nombre', () => {
    expect(getInitials(undefined, 'johan@example.com')).toBe('J')
  })

  test('sin datos devuelve interrogante', () => {
    expect(getInitials(undefined, undefined)).toBe('?')
  })
})

describe('categoryBadgeClass', () => {
  test('asigna estilos por slug conocido', () => {
    expect(categoryBadgeClass('alimentacion')).toContain('emerald')
    expect(categoryBadgeClass('transporte')).toContain('sky')
    expect(categoryBadgeClass('salud')).toContain('rose')
  })

  test('usa estilo neutro para slugs desconocidos', () => {
    expect(categoryBadgeClass('desconocida')).toContain('stone')
  })
})
