const OpenAI = require('openai');
const Conversation = require('../models/conversation.model');
const { v4: uuidv4 } = require('uuid');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key'
});

const SYSTEM_PROMPT = `You are a helpful assistant for SmartAutoCheck, a vehicle technical inspection center. 
You help customers with:
- Booking appointments
- Understanding inspection procedures
- Answering questions about required documents
- Explaining inspection results
- General vehicle inspection information

Be friendly, professional, and concise.`;

class ChatbotController {
  static async sendMessage(req, res, next) {
    try {
      const { message, sessionId, userId } = req.body;

      if (!message) {
        return res.status(400).json({ success: false, message: 'Message is required' });
      }

      const session = sessionId || uuidv4();

      // Get or create conversation
      let conversation = await Conversation.findOne({ sessionId: session });
      
      if (!conversation) {
        conversation = new Conversation({
          sessionId: session,
          userId,
          messages: []
        });
      }

      // Add user message
      conversation.messages.push({
        role: 'user',
        content: message
      });

      // Prepare messages for OpenAI
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...conversation.messages.map(m => ({ role: m.role, content: m.content }))
      ];

      // Get AI response (with fallback if no API key)
      let assistantMessage;
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy-key') {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages,
          max_tokens: 500,
          temperature: 0.7
        });
        assistantMessage = completion.choices[0].message.content;
      } else {
        // Fallback responses
        assistantMessage = ChatbotController.getFallbackResponse(message);
      }

      // Add assistant message
      conversation.messages.push({
        role: 'assistant',
        content: assistantMessage
      });

      conversation.updatedAt = new Date();
      await conversation.save();

      res.json({
        success: true,
        data: {
          sessionId: session,
          message: assistantMessage,
          timestamp: new Date()
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static getFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('book') || lowerMessage.includes('appointment')) {
      return 'To book an appointment, please visit our booking page or call us at 1-800-AUTOCHECK. We have slots available Monday through Saturday, 8 AM to 6 PM.';
    } else if (lowerMessage.includes('document') || lowerMessage.includes('need')) {
      return 'For your inspection, please bring: 1) Vehicle registration (carte grise), 2) Valid ID, 3) Previous inspection certificate (if applicable). You can upload your carte grise online when booking.';
    } else if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return 'Our standard technical inspection costs $50. Additional services are available. Payment can be made online or at the center via card or cash.';
    } else if (lowerMessage.includes('result') || lowerMessage.includes('certificate')) {
      return 'After inspection, you\'ll receive results immediately. If your vehicle passes, a certificate will be generated within 24 hours and sent to your email. Valid for 1 year.';
    } else {
      return 'Hello! I\'m here to help with vehicle inspections. You can ask about booking appointments, required documents, pricing, or inspection procedures. How can I assist you today?';
    }
  }

  static async getConversation(req, res, next) {
    try {
      const { id } = req.params;
      const conversation = await Conversation.findOne({ sessionId: id });

      if (!conversation) {
        return res.status(404).json({ success: false, message: 'Conversation not found' });
      }

      res.json({ success: true, data: conversation });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ChatbotController;
