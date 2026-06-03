/**
 * Calcula modificador de atributo (escala centrada em 10).
 * @param {number} value
 * @returns {number}
 */
export function attributeModifier(value) {
  return Math.floor((Number(value) - 10) / 2);
}

/**
 * Limita um número entre min e max.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
