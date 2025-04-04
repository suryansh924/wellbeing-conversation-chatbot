import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Interfaces that match the server response data structures
export interface ApiConversation {
  id: number;
  employee_id: string;
  employee_name: string;
  message_ids: number[];
  date: string;
  time: string;
  report?: string;
}

export interface ApiMessage {
  id: number;
  content: string;
  sender_type: "employee" | "chatbot";
  timestamp: string;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const chatService = {
  // Get conversation history for an employee
  getEmployeeConversations: async (employeeId: string): Promise<{ conversations: ApiConversation[] }> => {
    try {
      const response = await api.get(`/api/conversation/history/employee/${employeeId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching employee conversations:', error);
      throw error;
    }
  },

  // Get messages for a specific conversation
  getConversationMessages: async (conversationId: string): Promise<ApiMessage[]> => {
    try {
      const response = await api.get(`/api/conversation/history/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
      throw error;
    }
  }
};

export default chatService;
