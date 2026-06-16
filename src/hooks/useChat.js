import { useContext } from 'react';
import { ChatContext } from '../context/ChatContext';

export function useChat() {
  return useContext(ChatContext);
}
