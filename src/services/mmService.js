// @ts-check
import axios from 'axios';

/**
 * MM Bridge Service (Material Management)
 * Sincronización de Ventas Real-Time (v1.9.9)
 */
class MMService {
  constructor() {
    this.apiBase = process.env.MM_API_URL || 'http://localhost:3200/api';
  }
  /**
   * Registra una venta en el Maestro de Inventarios (PostgreSQL)
   * @param {Array<{productId: any, quantity: number}>} products - Lista de productos
   */
  async registerSale(products) {
    try {
      const items = products.map((p) => ({
        productId: String(p.productId), 
        quantity: p.quantity,
      }));

      const response = await axios.post(`${this.apiBase}/products/sale`, {
        items,
        warehouse: 'SUCURSAL SUR' // Almacén por defecto para Ecommerce
      });
      console.log('✅ Venta registrada en MM:', response.data);
      return response.data;
    } catch (error) {
      const e = /** @type {any} */ (error);
      console.error('❌ Error notificando venta a MM:', e.response?.data || e.message);
      throw new Error('MM_SYNC_FAILED');
    }
  }
}

export default new MMService();
