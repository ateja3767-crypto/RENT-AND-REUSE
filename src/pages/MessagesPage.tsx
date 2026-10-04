import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { formatINR } from '../utils/currency';
import { Send, MessageSquare, Package, ChevronRight, User as UserIcon, Calendar, CheckCircle2 } from 'lucide-react';

interface MessagesPageProps {
  setCurrentTab: (tab: string) => void;
  setSelectedItemId: (id: string) => void;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({
  setCurrentTab,
  setSelectedItemId,
}) => {
  const { messages, sendMessage, currentUser, users, items, bookings, getItemById, getUserById } = useApp();

  const [activePartnerId, setActivePartnerId] = useState<string>(() => {
    if (!currentUser) return '';
    const otherUser = users.find((u) => u.id !== currentUser.id);
    return otherUser ? otherUser.id : '';
  });

  const [selectedBookingId, setSelectedBookingId] = useState<string>('all');
  const [messageInput, setMessageInput] = useState('');

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <MessageSquare className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Sign In to Access Messages
        </h2>
        <p className="text-xs text-slate-500">
          Sign in with your verified campus email to chat with peers about equipment handovers.
        </p>
        <button
          onClick={() => setCurrentTab('auth')}
          className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          Sign In with College Email
        </button>
      </div>
    );
  }

  // Group messages into conversations with distinct partners
  const conversationPartners = useMemo(() => {
    const partnerIds = new Set<string>();
    messages.forEach((m) => {
      if (m.senderId === currentUser.id) partnerIds.add(m.recipientId);
      if (m.recipientId === currentUser.id) partnerIds.add(m.senderId);
    });

    // Ensure users with bookings with currentUser are included
    bookings.forEach((b) => {
      if (b.ownerId === currentUser.id) partnerIds.add(b.borrowerId);
      if (b.borrowerId === currentUser.id) partnerIds.add(b.ownerId);
    });

    users.forEach((u) => {
      if (u.id !== currentUser.id) partnerIds.add(u.id);
    });

    return Array.from(partnerIds).map((id) => {
      const user = getUserById(id);
      const threadMessages = messages.filter(
        (m) =>
          (m.senderId === currentUser.id && m.recipientId === id) ||
          (m.senderId === id && m.recipientId === currentUser.id)
      );
      const lastMsg = threadMessages[threadMessages.length - 1];
      return {
        user,
        lastMessage: lastMsg?.content || 'No messages yet',
        lastTime: lastMsg?.createdAt || '',
        unreadCount: threadMessages.filter((m) => m.recipientId === currentUser.id && !m.isRead).length,
      };
    });
  }, [messages, currentUser.id, users, bookings, getUserById]);

  // Bookings involving both current user and active partner
  const sharedBookings = useMemo(() => {
    if (!activePartnerId) return [];
    return bookings.filter(
      (b) =>
        (b.ownerId === currentUser.id && b.borrowerId === activePartnerId) ||
        (b.borrowerId === currentUser.id && b.ownerId === activePartnerId)
    );
  }, [bookings, currentUser.id, activePartnerId]);

  // Messages in active conversation
  const activeConversationMessages = useMemo(() => {
    return messages.filter((m) => {
      const isWithPartner =
        (m.senderId === currentUser.id && m.recipientId === activePartnerId) ||
        (m.senderId === activePartnerId && m.recipientId === currentUser.id);

      if (!isWithPartner) return false;
      if (selectedBookingId !== 'all' && m.bookingId !== selectedBookingId) return false;
      return true;
    }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages, currentUser.id, activePartnerId, selectedBookingId]);

  const activePartner = getUserById(activePartnerId);

  // Check if there is an item associated with the conversation
  const relatedItem = useMemo(() => {
    if (selectedBookingId !== 'all') {
      const b = bookings.find((x) => x.id === selectedBookingId);
      if (b) return getItemById(b.itemId);
    }
    const msgWithItem = activeConversationMessages.find((m) => m.itemId);
    return msgWithItem?.itemId ? getItemById(msgWithItem.itemId) : undefined;
  }, [selectedBookingId, activeConversationMessages, bookings, getItemById]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activePartnerId) return;

    sendMessage({
      recipientId: activePartnerId,
      content: messageInput.trim(),
      bookingId: selectedBookingId !== 'all' ? selectedBookingId : undefined,
      itemId: relatedItem?.id,
    });

    setMessageInput('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Campus Messages & Requests
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Coordinate equipment handovers, discuss rental terms, and arrange returns securely per request.
        </p>
      </div>

      <div className="h-[620px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left column: Conversations List */}
        <div className="md:col-span-4 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-xs uppercase tracking-wider text-slate-500">
            Student Conversations
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800/60">
            {conversationPartners.map(({ user, lastMessage, lastTime, unreadCount }) => {
              if (!user) return null;
              const isSelected = user.id === activePartnerId;

              return (
                <button
                  key={user.id}
                  onClick={() => {
                    setActivePartnerId(user.id);
                    setSelectedBookingId('all');
                  }}
                  className={`w-full text-left p-4 flex items-start gap-3 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-l-4 border-emerald-700'
                      : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-emerald-600/30"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {user.fullName}
                      </div>
                      {lastTime && (
                        <span className="text-[10px] text-slate-400">
                          {lastTime.split('T')[1]?.slice(0, 5) || ''}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {user.department} · {user.trustScore}/100
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 truncate mt-1">
                      {lastMessage}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right column: Active Chat Thread */}
        <div className="md:col-span-8 flex flex-col h-full bg-white dark:bg-slate-900">
          {activePartner ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={activePartner.avatarUrl}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {activePartner.fullName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {activePartner.department} · <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{activePartner.trustScore}/100 Trust</span>
                    </div>
                  </div>
                </div>

                {/* Per-Request Scope Filter Selector */}
                {sharedBookings.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400 text-[11px]">Thread Context:</span>
                    <select
                      value={selectedBookingId}
                      onChange={(e) => setSelectedBookingId(e.target.value)}
                      className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 font-medium"
                    >
                      <option value="all">All Messages with {activePartner.fullName.split(' ')[0]}</option>
                      {sharedBookings.map((b) => {
                        const bItem = getItemById(b.itemId);
                        return (
                          <option key={b.id} value={b.id}>
                            Request: {bItem?.title || 'Equipment'} ({b.status.toUpperCase()})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </div>

              {/* Related item quick preview */}
              {relatedItem && (
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <Package className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {relatedItem.title}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">
                      {relatedItem.isFree ? 'Free to borrow' : `${formatINR(relatedItem.pricePerDay)}/day`}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedItemId(relatedItem.id);
                      setCurrentTab('detail');
                    }}
                    className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline shrink-0 cursor-pointer"
                  >
                    View Listing
                  </button>
                </div>
              )}

              {/* Chat Message Scroll */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeConversationMessages.length === 0 ? (
                  <div className="text-center py-16 text-xs text-slate-400 space-y-1">
                    <p>No messages yet in this request thread.</p>
                    <p className="text-[11px]">Type below to coordinate handover or ask about item details.</p>
                  </div>
                ) : (
                  activeConversationMessages.map((msg) => {
                    const isMe = msg.senderId === currentUser.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-sm sm:max-w-md px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                            isMe
                              ? 'bg-emerald-700 text-white rounded-br-none'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5 px-1">
                          {msg.createdAt.split('T')[1]?.slice(0, 5) || ''}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Send message form */}
              <form onSubmit={handleSend} className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Message ${activePartner.fullName.split(' ')[0]}...`}
                  className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="p-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-40 transition-colors shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
