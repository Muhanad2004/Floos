// src/utils/amountUtils.js
const MAX_DIGITS = 7
const DECIMAL_PLACES = 3
const INT_PLACES = MAX_DIGITS - DECIMAL_PLACES // 4

export function queueToDisplay(queue) {
  const padded = Array(MAX_DIGITS - queue.length).fill(0).concat(queue)
  const intNum = parseInt(padded.slice(0, INT_PLACES).join(''), 10)
  const decStr = padded.slice(INT_PLACES).join('')
  return `${intNum}.${decStr}`
}

export function queueToAmount(queue) {
  if (queue.length === 0) return 0
  return parseFloat(queueToDisplay(queue))
}

export function amountToQueue(amount) {
  if (amount === 0) return []
  const str = amount.toFixed(DECIMAL_PLACES).replace('.', '')
  const padded = str.padStart(MAX_DIGITS, '0')
  const trimmed = padded.replace(/^0+/, '')
  if (!trimmed) return []
  return trimmed.split('').map(Number)
}

export function isQueueZero(queue) {
  return queue.every(d => d === 0)
}

export function addDigit(queue, digit) {
  if (queue.length >= MAX_DIGITS) return queue
  return [...queue, digit]
}

export function removeDigit(queue) {
  return queue.slice(0, -1)
}
