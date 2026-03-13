import { useEffect, useState, useRef } from 'react';
import { Send, Search, Phone, Video, MoreVertical } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Conversation {
  id: string;
  other_user: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  read: boolean;
}

export function Messages() {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
      const timer = setInterval(loadConversations, 3000);
      return () => clearInterval(timer);
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation && user) {
      loadMessages(selectedConversation.other_user.id);
      markAsRead(selectedConversation.other_user.id);
    }
  }, [selectedConversation, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    if (!user) return;

    const { data: sentMessages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('sender_id', user.id)
      .order('created_at', { ascending: false });

    const { data: receivedMessages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('receiver_id', user.id)
      .order('created_at', { ascending: false });

    const allMessages = [...(sentMessages || []), ...(receivedMessages || [])];
    const conversationMap = new Map<string, Message[]>();

    allMessages.forEach((msg) => {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!conversationMap.has(otherId)) {
        conversationMap.set(otherId, []);
      }
      conversationMap.get(otherId)!.push(msg);
    });

    const convs: Conversation[] = [];

    for (const [otherId, msgs] of conversationMap.entries()) {
      const { data: otherProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', otherId)
        .maybeSingle();

      if (otherProfile) {
        const lastMsg = msgs[0];
        const unreadCount = msgs.filter((m) => m.receiver_id === user.id && !m.read).length;

        convs.push({
          id: otherId,
          other_user: {
            id: otherProfile.id,
            full_name: otherProfile.full_name,
            avatar_url: otherProfile.avatar_url || '',
          },
          last_message: lastMsg.message,
          last_message_time: lastMsg.created_at,
          unread_count: unreadCount,
        });
      }
    }

    setConversations(convs.sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()));
    setLoading(false);
  };

  const loadMessages = async (otherId: string) => {
    if (!user) return;

    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    setMessages(data || []);
  };

  const markAsRead = async (otherId: string) => {
    if (!user) return;

    await supabase
      .from('chat_messages')
      .update({ read: true })
      .eq('receiver_id', user.id)
      .eq('sender_id', otherId);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation || !user) return;

    try {
      const { error } = await supabase.from('chat_messages').insert({
        sender_id: user.id,
        receiver_id: selectedConversation.other_user.id,
        message: messageText,
        read: false,
      });

      if (!error) {
        setMessageText('');
        await loadMessages(selectedConversation.other_user.id);
        await loadConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.other_user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 h-[calc(100vh-4rem)]">
        <div className="max-w-6xl mx-auto h-full">
          <h1 className="text-3xl font-bold text-white mb-6">Messages</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-5rem)]">
            <Card className="p-4 flex flex-col overflow-hidden">
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-3 text-slate-500" size={20} />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <p>{searchQuery ? 'No conversations found' : 'No messages yet'}</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full p-3 rounded-lg transition-all text-left ${
                        selectedConversation?.id === conv.id
                          ? 'bg-blue-600/20 border border-blue-500'
                          : 'hover:bg-slate-800/50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {conv.other_user.avatar_url ? (
                          <img src={conv.other_user.avatar_url} alt={conv.other_user.full_name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{conv.other_user.full_name}</p>
                          <p className="text-xs text-slate-400 truncate">{conv.last_message}</p>
                        </div>
                        {conv.unread_count > 0 && (
                          <span className="flex-shrink-0 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full font-medium">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Card>

            {selectedConversation ? (
              <Card className="lg:col-span-2 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {selectedConversation.other_user.avatar_url ? (
                      <img src={selectedConversation.other_user.avatar_url} alt={selectedConversation.other_user.full_name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full" />
                    )}
                    <div>
                      <h3 className="font-semibold text-white">{selectedConversation.other_user.full_name}</h3>
                      <p className="text-xs text-slate-400">Online</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors">
                      <Phone className="text-slate-400" size={20} />
                    </button>
                    <button className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors">
                      <Video className="text-slate-400" size={20} />
                    </button>
                    <button className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors">
                      <MoreVertical className="text-slate-400" size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.sender_id === user?.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800/50 text-slate-200'
                        }`}
                      >
                        <p className="text-sm break-words">{msg.message}</p>
                        <p className={`text-xs mt-1 ${msg.sender_id === user?.id ? 'text-blue-100' : 'text-slate-400'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={sendMessage} className="p-4 border-t border-slate-700 flex space-x-3">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button type="submit" disabled={!messageText.trim()}>
                    <Send size={20} />
                  </Button>
                </form>
              </Card>
            ) : (
              <Card className="lg:col-span-2 flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <p className="text-lg">Select a conversation to start messaging</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
