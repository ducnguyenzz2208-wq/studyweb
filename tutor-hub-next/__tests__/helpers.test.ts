import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

// Các helper thuần (getGrade, avgScore) sống trong app trình duyệt dạng classic
// script (public/js/12-ui-core.js), không export module. Để test ĐÚNG mã đang
// chạy production (không nhân bản logic), ta đọc file nguồn, trích thân hàm theo
// tên rồi biên dịch lại. Nếu ngưỡng điểm bị đổi trong app, test sẽ bắt được.
const here = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(resolve(here, '../public/js/12-ui-core.js'), 'utf8')

function extractFn(source: string, signature: string): string {
  const start = source.indexOf(signature)
  if (start === -1) throw new Error('Không tìm thấy ' + signature)
  const braceOpen = source.indexOf('{', start)
  let depth = 0
  for (let i = braceOpen; i < source.length; i++) {
    if (source[i] === '{') depth++
    else if (source[i] === '}') {
      depth--
      if (depth === 0) return source.slice(start, i + 1)
    }
  }
  throw new Error('Không tìm thấy dấu đóng ngoặc cho ' + signature)
}

function compile<T = (...args: any[]) => any>(signature: string): T {
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function('return (' + extractFn(src, signature) + ')')() as T
}

const getGrade = compile<(score: number) => string>('function getGrade(')
const avgScore = compile<(s: { mathScore: number; engScore: number }) => number>('function avgScore(')

describe('getGrade — xếp loại theo ngưỡng (mã thật trong 12-ui-core.js)', () => {
  it('A khi >= 90', () => {
    expect(getGrade(100)).toBe('A')
    expect(getGrade(90)).toBe('A')
  })
  it('B khi 80–89', () => {
    expect(getGrade(89)).toBe('B')
    expect(getGrade(80)).toBe('B')
  })
  it('C khi 70–79', () => {
    expect(getGrade(79)).toBe('C')
    expect(getGrade(70)).toBe('C')
  })
  it('D khi 60–69', () => {
    expect(getGrade(69)).toBe('D')
    expect(getGrade(60)).toBe('D')
  })
  it('F khi < 60', () => {
    expect(getGrade(59)).toBe('F')
    expect(getGrade(0)).toBe('F')
  })
})

describe('avgScore — trung bình toán & anh, làm tròn', () => {
  it('trung bình chẵn', () => {
    expect(avgScore({ mathScore: 90, engScore: 80 })).toBe(85)
    expect(avgScore({ mathScore: 92, engScore: 88 })).toBe(90)
  })
  it('làm tròn nửa lên', () => {
    expect(avgScore({ mathScore: 61, engScore: 74 })).toBe(68) // 67.5 → 68
  })
  it('điểm 0', () => {
    expect(avgScore({ mathScore: 0, engScore: 0 })).toBe(0)
  })
})
