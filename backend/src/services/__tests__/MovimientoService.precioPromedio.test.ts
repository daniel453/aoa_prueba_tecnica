import { MovimientoService } from '../MovimientoService';

/**
 * Tests del calculo de precio promedio ponderado.
 * Es estatico y puro: no requiere mocks, base de datos ni instanciar la clase.
 */
describe('MovimientoService.calcularPrecioPromedio', () => {
  const calc = MovimientoService.calcularPrecioPromedio;

  describe('caso producto vacio (stock=0)', () => {
    it('reinicia el promedio al precio de entrada', () => {
      expect(calc(0, 0, 10, 100)).toBe(100);
    });

    it('reinicia incluso si habia un precio promedio previo (lote agotado)', () => {
      expect(calc(0, 250, 5, 80)).toBe(80);
    });
  });

  describe('caso clasico de mezcla', () => {
    it('mezcla dos lotes del mismo precio mantiene el promedio', () => {
      // 10 unidades a 100 + 5 unidades a 100 -> sigue siendo 100
      expect(calc(10, 100, 5, 100)).toBe(100);
    });

    it('formula clasica: 10@100 + 5@150 = 116.67', () => {
      // (10*100 + 5*150) / 15 = 1750/15 = 116.666...
      expect(calc(10, 100, 5, 150)).toBeCloseTo(116.6667, 4);
    });

    it('formula con mas peso al lote nuevo: 5@200 + 95@10 = 19.5', () => {
      // (5*200 + 95*10) / 100 = (1000 + 950) / 100 = 19.5
      expect(calc(5, 200, 95, 10)).toBe(19.5);
    });
  });

  describe('borde y precision', () => {
    it('precio de entrada cero baja el promedio proporcionalmente', () => {
      // 10@100 + 10@0 = 50
      expect(calc(10, 100, 10, 0)).toBe(50);
    });

    it('cantidades grandes no rompen la precision', () => {
      // 100000@5 + 100000@7 = 6
      expect(calc(100000, 5, 100000, 7)).toBe(6);
    });

    it('mantiene decimales en el resultado', () => {
      // (3*10 + 2*7) / 5 = 44/5 = 8.8
      expect(calc(3, 10, 2, 7)).toBe(8.8);
    });
  });
});
