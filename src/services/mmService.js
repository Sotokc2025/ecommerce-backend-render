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

  /**
   * Registra o actualiza un cliente en el CRM (PostgreSQL)
   * @param {any} userData - Datos del usuario (email, displayName, phone)
   */
  async syncCustomer(userData) {
    try {
      const response = await axios.post(`${this.apiBase}/customers/sync`, {
        email: userData.email,
        name: userData.displayName,
        phone: userData.phone || '',
        source: 'ECOMMERCE_ATLAS'
      });
      console.log('👤 Cliente sincronizado en MM CRM:', response.data.email);
      return response.data;
    } catch (error) {
      const e = /** @type {any} */ (error);
      console.error('⚠️ Error sincronizando cliente a MM:', e.response?.data || e.message);
      // No lanzamos error para no bloquear la venta si falla el CRM
    }
  }
}

export default new MMService();
