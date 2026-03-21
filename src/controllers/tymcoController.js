import { tymcoAIService } from "../services/tymco-ai.service.js";

/**
 * Controller for TyMCO-Bot interactions
 */
export const tymcoChat = async (req, res, next) => {
  const { message, history, context } = req.body;
  const user = req.user; // From authMiddleware

  if (!message) {
    return res.status(400).json({ error: "El mensaje es obligatorio." });
  }

  try {
    // Enriching context for TyMCO-Bot
    const userContext = {
      userId: user?.userId || user?.id,
      username: user?.username || user?.email || "Cliente",
      role: user?.role || "user"
    };

    const result = await tymcoAIService.chat(
      message,
      history || [],
      userContext
    );

    res.json({
      success: true,
      response: result.text,
      timestamp: result.timestamp
    });

  } catch (error) {
    console.error("[TyMCO-Ctrl] Chat Error:", error);
    res.status(500).json({
      error: "Error al procesar la respuesta de TyMCO-Bot.",
      details: error.message
    });
  }
};

/**
 * Simple TTS simulation or real engine integration (optional stub)
 */
export const tymcoTTS = async (req, res, next) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Texto requerido." });
  
  // Future: Integration with Piper or ElevenLabs as in SCS
  // For now, we return 501 Not Implemented or a placeholder if requested
  res.status(501).json({ error: "Motor de voz no implementado en esta versión." });
};
