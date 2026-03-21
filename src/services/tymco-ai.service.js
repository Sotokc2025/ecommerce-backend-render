import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import Product from "../models/product.js";
import Order from "../models/order.js";

/**
 * TyMCO-Bot AI Service
 * Powered by Groq and LangChain. 
 * Provides wood expertise and order context for TyMCO customers.
 */
class TyMCoAIService {
  constructor() {
    this.model = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: 0.7,
    });
  }

  /**
   * Retrieves relevant store context based on the user's query and profile.
   */
  async getContext(query, userId) {
    if (!userId) return ""; // No context for unauthenticated users

    const q = (query || "").toLowerCase();
    let storeContext = "";

    try {
      // 1. Order History Context
      if (q.includes("pedido") || q.includes("compra") || q.includes("orden") || q.includes("mi status") || q.includes("estado")) {
        const orders = await Order.find({ user: userId })
          .sort({ createdAt: -1 })
          .limit(3)
          .populate("products.productId");

        if (orders && orders.length > 0) {
          storeContext += `\n=== TUS PEDIDOS RECIENTES EN TYMCO ===\n`;
          orders.forEach(o => {
            const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleDateString('es-MX') : 'N/A';
            storeContext += `- ID: ${o._id}, Fecha: ${dateStr}, Total: $${o.totalPrice}, Estatus: ${o.status}\n`;
            if (o.products) {
              o.products.forEach(p => {
                const pName = p.productId?.name || "Producto desconocido";
                storeContext += `  * ${pName} x${p.quantity} ($${p.price})\n`;
              });
            }
          });
        }
      }

      // 2. Product Catalog Context (Simple semantic simulation)
      if (q.includes("madera") || q.includes("mdf") || q.includes("pino") || q.includes("caoba") || q.includes("cedro") || q.includes("precio") || q.includes("disponible") || q.includes("catálogo")) {
        // Find products related to keywords in the query
        const relevantKeywords = q.split(" ").filter(w => w.length > 3);
        const products = await Product.find({
          $or: [
            { name: { $regex: relevantKeywords.join("|") || q, $options: "i" } },
            { description: { $regex: relevantKeywords.join("|") || q, $options: "i" } }
          ]
        }).limit(5).populate("category");

        if (products && products.length > 0) {
          storeContext += `\n=== PRODUCTOS RECOMENDADOS DE TYMCO ===\n`;
          products.forEach(p => {
            const catName = p.category?.name || "General";
            storeContext += `- ${p.name}: $${p.price} (${catName}). Stock: ${p.stock}\n  Desc: ${p.description.substring(0, 80)}...\n`;
          });
        }
      }
    } catch (err) {
      console.error("[TyMCO-AI] Error gathering context:", err);
    }

    return storeContext;
  }

  /**
   * Main chat logic
   */
  async chat(query, history = [], userContext = {}) {
    const userId = userContext.userId;
    const storeData = await this.getContext(query, userId);

    const systemPrompt = `Eres TyMCO-Bot, el asistente inteligente oficial de TyMCO (Tableros y Maderas de la Costa).
Tu tono es profesional, servicial y moderno ("Style Cyber wood"). Responde siempre en español.
Ayudas a los clientes a encontrar maderas (MDF, Pino, Caoba, Cedro), consultar sus pedidos y resolver dudas sobre productos.

DATOS DEL CLIENTE:
- Nombre: ${userContext.username || 'Colega'}
- Rol: ${userContext.role || 'Usuario'}

INFO ESTRATÉGICA DE TYMCO:
- Somos líderes en Tableros, MDF y Maderas Finas.
- Ofrecemos servicios de dimensionado (cortes a medida).
- Nuestra misión es la excelencia en el servicio maderero.

${storeData ? `\n=== DATOS REALES DE LA TIENDA ===\n${storeData}\n==============================\n` : '\n(Sin datos específicos de pedidos para mostrar en este momento)'}

INSTRUCCIONES DE RESPUESTA:
1. Sé conciso y utiliza un lenguaje amigable pero profesional.
2. Si el cliente tiene pedidos recientes, úsalos para responder dudas sobre "mis compras".
3. Si el cliente pregunta por maderas o precios, usa la lista de "PRODUCTOS RECOMENDADOS" si está disponible.
4. Si no tienes información suficiente, invita al cliente a llamar a sucursal TyMCO o esperar a que un asesor lo contacte.
5. Menciona que eres TyMCO-Bot v1.1.`;

    const messages = [
      new SystemMessage(systemPrompt),
      ...history.map(msg => msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)),
      new HumanMessage(query)
    ];

    try {
      const response = await this.model.invoke(messages);
      return {
        text: response.content,
        timestamp: new Date()
      };
    } catch (error) {
      console.error("❌ [TyMCO-AI] Error in LLM invokation:", error);
      throw new Error("Lo siento, hubo un error procesando tu consulta.");
    }
  }
}

export const tymcoAIService = new TyMCoAIService();
