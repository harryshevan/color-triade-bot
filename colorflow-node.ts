/**
 * Node.js wrapper for colorflow.js
 * Adapted from https://github.com/sw4/colorflow.js
 */

interface ColorflowColor {
  hex2rgb(hex: string): [number, number, number];
  rgb2hex(rgb: number[]): string;
  rgb2hsv(rgb: number[]): [number, number, number];
  hsv2rgb(hsv: number[]): [number, number, number];
  rgb2hsl(rgb: number[]): [number, number, number];
  hsl2rgb(hsl: number[]): [number, number, number];
  hex2hsl(hex: string): [number, number, number];
  hsl2hex(hsl: number[]): string;
  hex2hsv(hex: string): [number, number, number];
  hsv2hex(hsv: number[]): string;
  complement(hex: string, type?: 'split' | 'double'): string[];
  triadic(hex: string): string[];
  tetradic(hex: string): string[];
  pentadic(hex: string): string[];
  algorithmic(options: {
    hex: string;
    count?: number;
    type?: 'hue' | 'saturation' | 'value';
    scope?: number;
    rotation?: number;
  }): string[];
  degrees(deg: number, offset: number): number;
  scale(hex: string, amount: number, type?: 'hue' | 'saturation' | 'value', absolute?: boolean): string;
  lighten(hex: string, amount: number, absolute?: boolean): string;
  darken(hex: string, amount: number, absolute?: boolean): string;
  saturate(hex: string, amount: number, absolute?: boolean): string;
  desaturate(hex: string, amount: number, absolute?: boolean): string;
}

function toArr(val: any): any[] {
  let arr: any[] = [];
  if (val && typeof val !== 'object') {
    if (val.indexOf(',') !== -1) {
      arr = val.split(',');
    } else {
      arr.push(val);
    }
  } else {
    arr = val;
  }
  return arr;
}

function getRand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min;
}

export const colorflow: ColorflowColor = {
  hex2rgb(hex: string): [number, number, number] {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  },

  rgb2hex(rgb: number[]): string {
    rgb = toArr(rgb);
    let hex = '';
    for (let i = 0; i < rgb.length; i++) {
      let h = rgb[i].toString(16);
      h = h.length === 1 ? '0' + h : h;
      hex += h;
    }
    return '#' + hex;
  },

  rgb2hsv(rgb: number[]): [number, number, number] {
    rgb = toArr(rgb);
    const r = rgb[0], g = rgb[1], b = rgb[2];
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    const delta = max - min;
    const v = Math.floor(max / 255 * 100);

    if (max === 0) return [0, 0, 0];

    const s = Math.floor(delta / max * 100);
    let h: number;

    if (delta === 0) {
      h = 0;
    } else if (r === max) {
      h = (g - b) / delta;
    } else if (g === max) {
      h = 2 + (b - r) / delta;
    } else {
      h = 4 + (r - g) / delta;
    }

    h = Math.floor(h * 60);
    if (h < 0) h += 360;

    return [h, s, v];
  },

  hsv2rgb(hsv: number[]): [number, number, number] {
    hsv = toArr(hsv);
    let h = Math.max(0, Math.min(360, hsv[0]));
    let s = Math.max(0, Math.min(100, hsv[1]));
    let v = Math.max(0, Math.min(100, hsv[2]));

    s /= 100;
    v /= 100;
    h = h === 360 ? 0 : h;

    if (s === 0) {
      const gray = v;
      return [Math.round(gray * 255), Math.round(gray * 255), Math.round(gray * 255)];
    }

    h /= 60;
    const i = Math.floor(h);
    const f = h - i;
    const p = v * (1 - s);
    const q = v * (1 - s * f);
    const t = v * (1 - s * (1 - f));

    let r: number, g: number, b: number;
    switch (i) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
      default: r = 0; g = 0; b = 0;
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  },

  rgb2hsl(rgb: number[]): [number, number, number] {
    rgb = toArr(rgb);
    let r = rgb[0] / 255;
    let g = rgb[1] / 255;
    let b = rgb[2] / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h: number, s: number;
    const l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0;
      }
      h /= 6;
    }

    return [h, s, l];
  },

  hsl2rgb(hsl: number[]): [number, number, number] {
    hsl = toArr(hsl);
    const h = hsl[0], s = hsl[1], l = hsl[2];

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r: number, g: number, b: number;

    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return [r * 255, g * 255, b * 255];
  },

  hex2hsl(hex: string): [number, number, number] {
    return this.rgb2hsl(this.hex2rgb(hex));
  },

  hsl2hex(hsl: number[]): string {
    return this.rgb2hex(this.hsl2rgb(toArr(hsl)));
  },

  hex2hsv(hex: string): [number, number, number] {
    return this.rgb2hsv(this.hex2rgb(hex));
  },

  hsv2hex(hsv: number[]): string {
    return this.rgb2hex(this.hsv2rgb(toArr(hsv)));
  },

  complement(hex: string, type?: 'split' | 'double'): string[] {
    let count = 1;
    let scope = 180;
    let rotation = 0;

    if (type === 'split') {
      count = 3;
      scope = 180;
      rotation = 180;
    } else if (type === 'double') {
      count = 5;
      scope = 180;
      rotation = 180;
    }

    return this.algorithmic({ hex, count, scope, rotation });
  },

  triadic(hex: string): string[] {
    return this.algorithmic({ hex });
  },

  tetradic(hex: string): string[] {
    return this.algorithmic({ hex, count: 4 });
  },

  pentadic(hex: string): string[] {
    return this.algorithmic({ hex, count: 5 });
  },

  degrees(deg: number, offset: number): number {
    deg += offset;
    if (deg > 360) deg -= 360;
    else if (deg < 0) deg += 360;
    return deg;
  },

  scale(hex: string, amount: number, type: 'hue' | 'saturation' | 'value' = 'hue', absolute?: boolean): string {
    const hsv = this.hex2hsv(hex);
    const current = type === 'hue' ? hsv[0] : type === 'saturation' ? hsv[1] : hsv[2];

    amount = Math.abs(amount) > 1 ? amount / 100 : amount;
    const scaled = absolute 
      ? amount * 100
      : current + ((type === 'hue' ? 360 : 100) - current) * amount;

    return this.hsv2hex([
      type === 'hue' ? scaled : hsv[0],
      type === 'saturation' ? scaled : hsv[1],
      type === 'value' ? scaled : hsv[2]
    ]);
  },

  lighten(hex: string, amount: number, absolute?: boolean): string {
    amount = amount > 0 ? amount : -1 * amount;
    return this.scale(hex, amount, 'value', absolute);
  },

  darken(hex: string, amount: number, absolute?: boolean): string {
    amount = amount < 0 ? amount : -1 * amount;
    return this.scale(hex, amount, 'value', absolute);
  },

  saturate(hex: string, amount: number, absolute?: boolean): string {
    amount = amount > 0 ? amount : -1 * amount;
    return this.scale(hex, amount, 'saturation', absolute);
  },

  desaturate(hex: string, amount: number, absolute?: boolean): string {
    amount = amount < 0 ? amount : -1 * amount;
    return this.scale(hex, amount, 'saturation', absolute);
  },

  algorithmic(options: {
    hex: string;
    count?: number;
    type?: 'hue' | 'saturation' | 'value';
    scope?: number;
    rotation?: number;
  }): string[] {
    const hex = options.hex;
    const count = options.count ?? 3;
    const type = options.type ?? 'hue';
    const scope = options.scope ?? 360;
    const rotation = options.rotation ?? 0;

    const hsv = this.hex2hsv(hex);
    const h = hsv[0], s = hsv[1], v = hsv[2];
    const colors: string[] = [];

    const step = (type !== 'hue' || (scope !== 360 && scope !== 0))
      ? scope / (count - 1)
      : scope / count;

    const start = scope === 360
      ? h
      : this.degrees(this.degrees(h, rotation), -1 * scope / 2);

    for (let i = 0; i < count; i++) {
      const offset = step * i;
      switch (type) {
        case 'hue':
          const hue = this.degrees(start, offset);
          colors.push(this.hsv2hex([hue === 360 ? 0 : hue, s, v]));
          break;
        case 'saturation':
          colors.push(this.hsv2hex([h, offset, v]));
          break;
        case 'value':
          colors.push(this.hsv2hex([h, s, offset]));
          break;
      }
    }

    return colors;
  }
};

