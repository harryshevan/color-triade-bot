import { MediaUpload } from "gramio";
import sharp from "sharp";
import { colorflow } from "./colorflow-node";

/**
 * Generates multiple PNG images with 3-color combinations for wardrobe
 * @param hexColor - Hex color string (with or without #)
 * @param colors - Array of 3 hex colors
 * @param name - Name for the file
 * @returns File that can be sent via gramio
 */
async function generateCombination(colors: string[], name: string): Promise<File> {
  // Configuration
  const squareSize = 64;
  const numSquares = colors.length;
  const width = squareSize * numSquares;
  const height = squareSize;
  
  // Build SVG
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
  
  // Add color squares
  colors.forEach((color: string, index: number) => {
    const x = index * squareSize;
    const cleanColor = color.replace("#", "");
    svg += `
  <rect x="${x}" y="0" width="${squareSize}" height="${squareSize}" fill="#${cleanColor}" />`;
  });
  
  svg += `
</svg>`;
  
  // Convert SVG to PNG using sharp
  const pngBuffer = await sharp(Buffer.from(svg))
    .png()
    .toBuffer();
  
  // Return as File using MediaUpload
  return MediaUpload.buffer(pngBuffer, `${name}.png`);
}

/**
 * Generates wardrobe combinations based on a base color
 * Returns array of different 3-color combinations
 * @param hexColor - Hex color string (with or without #)
 * @returns Array of File objects for different combinations
 */
export async function squares(hexColor: string): Promise<File[]> {
  // Ensure hex color has # prefix
  const normalizedHex = hexColor.startsWith('#') ? hexColor : `#${hexColor}`;
  
  const hsv = colorflow.hex2hsv(normalizedHex);
  const baseHue = hsv[0];
  const baseSat = hsv[1];
  const baseVal = hsv[2];
  
  // Определение характеристик цвета по системе Tonal (OpenWardrobe)
  // 1. Температура (Warm/Cool)
  const isWarm = (baseHue >= 0 && baseHue <= 60) || (baseHue >= 300 && baseHue <= 360);
  const isCool = baseHue >= 180 && baseHue <= 300;
  
  // 2. Глубина (Deep/Light)
  const isDeep = baseVal < 50;
  const isLight = baseVal > 70;
  
  // 3. Насыщенность (Clear/Soft)
  const isClear = baseSat > 60;
  const isSoft = baseSat < 40;
  
  // Адаптивные нейтральные цвета в зависимости от температуры
  const warmNeutrals = {
    dark: "#5d4037",   // Тёплый коричневый
    mid: "#d4c5b0",    // Бежевый
    light: "#f5f5dc",  // Светло-бежевый (beige)
    accent: "#a0826d"  // Тауп
  };
  
  const coolNeutrals = {
    dark: "#2c3e50",   // Navy (холодный тёмный)
    mid: "#95a5a6",    // Холодный серый
    light: "#ecf0f1",  // Светло-серый
    accent: "#607d8b"  // Серо-синий
  };
  
  // Выбираем подходящие нейтральные
  const neutrals = isWarm ? warmNeutrals : isCool ? coolNeutrals : 
    // Для нейтральных оттенков (зелёные, сине-зелёные) используем баланс
    { dark: "#4a4a4a", mid: "#c0c0c0", light: "#f0f0f0", accent: "#808080" };
  
  const white = "#ffffff";
  const black = "#000000";
  
  // Сочетание 1: Монохроматическое (основной + светлее + темнее)
  // Различные оттенки одного цвета - ультра-шикарно по OpenWardrobe
  const combo1 = [
    normalizedHex,
    colorflow.lighten(normalizedHex, 25),
    colorflow.darken(normalizedHex, 20)
  ];
  
  // Сочетание 2: С нейтральными (основной + адаптивные нейтральные по температуре)
  // Используем нейтральные, подобранные по тональной системе
  const combo2 = [
    normalizedHex,
    isDeep ? neutrals.dark : neutrals.mid,  // Глубина определяет яркость нейтрального
    neutrals.light
  ];
  
  // Сочетание 3: Аналоговое (основной + соседние оттенки)
  // Гармоничные соседние цвета на цветовом круге
  const analog1 = colorflow.hsv2hex([
    colorflow.degrees(baseHue, 30),
    isSoft ? Math.max(baseSat - 5, 20) : Math.max(baseSat - 10, 30),
    baseVal
  ]);
  const analog2 = colorflow.hsv2hex([
    colorflow.degrees(baseHue, -25),
    isSoft ? Math.max(baseSat - 5, 20) : Math.max(baseSat - 10, 30),
    baseVal
  ]);
  const combo3 = [
    normalizedHex,
    analog1,
    analog2
  ];
  
  // Сочетание 4: Классическое с контрастом (основной + нейтральные контрастные)
  // Deep типы - с черным/белым, Light типы - с мягкими нейтральными
  const combo4 = [
    normalizedHex,
    isDeep ? white : neutrals.light,
    isLight ? neutrals.dark : (isDeep ? black : neutrals.dark)
  ];
  
  // Сочетание 5: Экспериментальное (с элементом рандома - "возможно подойдет")
  // Используем правила стилистов: комплементарные но приглушенные + температурный акцент
  const randomOffset = Math.random() > 0.5 ? 150 : 180;
  
  // Комплементарный цвет, но приглушенный (OpenWardrobe рекомендует не использовать яркие комплементарные)
  const experimentalColor1 = colorflow.desaturate(
    colorflow.hsv2hex([
      colorflow.degrees(baseHue, randomOffset),
      Math.max(baseSat - 20, 30),
      Math.min(baseVal + 10, 85)
    ]),
    isClear ? 15 : 25  // Clear типы могут больше яркости
  );
  
  // Акценты подбираем по температуре - тёплые для тёплых, холодные для холодных
  const warmAccents = ["#c0392b", "#e67e22", "#f39c12", "#a0826d"]; // Красный, оранжевый, золотой, тауп
  const coolAccents = ["#16a085", "#8e44ad", "#34495e", "#5c6bc0"]; // Изумрудный, фиолетовый, графит, индиго
  
  const accentPool = isWarm ? warmAccents : isCool ? coolAccents : 
    [...warmAccents, ...coolAccents]; // Нейтральные могут с любыми
  
  const randomAccent = accentPool[Math.floor(Math.random() * accentPool.length)];
  
  const combo5 = [
    normalizedHex,
    experimentalColor1,
    randomAccent
  ];
  
  // Generate all combinations
  const combinations = await Promise.all([
    generateCombination(combo1, `combo1-monochrome`),
    generateCombination(combo2, `combo2-neutrals`),
    generateCombination(combo3, `combo3-analogous`),
    generateCombination(combo4, `combo4-classic`),
    generateCombination(combo5, `combo5-experimental`)
  ]);
  
  return combinations;
}

