import React, { useState, useRef, useEffect } from 'react';
import { Group, ChatMessage, Student } from '../types';
import { getAIChatResponse } from '../services/geminiService';
import * as api from '../services/apiService';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { SendIcon } from './icons/SendIcon';
import { PencilIcon } from './icons/PencilIcon';
import { ExitIcon } from './icons/ExitIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ReplyIcon } from './icons/ReplyIcon';
import { EmojiHappyIcon } from './icons/EmojiHappyIcon';

interface Props {
  group: Group;
  currentUser: Student;
  onBack: () => void;
  onUpdateGroup: (group: Group) => void;
  onLeaveGroup: (groupId: string) => void;
  onDeleteGroup: (groupId: string) => void;
  allStudents: Student[];
}

const userColors = ['bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500'];
const getColorForUser = (userName: string) => {
  if (userName === 'System') return 'bg-slate-600';
  if (userName === 'AI') return 'bg-indigo-600';
  let hash = 0;
  for (let i = 0; i < userName.length; i++) hash = userName.charCodeAt(i) + ((hash << 5) - hash);
  return userColors[Math.abs(hash % userColors.length)];
};


const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮'];

const GroupChat: React.FC<Props> = ({ group, currentUser, onBack, onUpdateGroup, onLeaveGroup, onDeleteGroup, allStudents }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState(group.groupName);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [activePickerId, setActivePickerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load messages from the backend
  useEffect(() => {
    const fetchMessages = async () => {
        try {
            const fetchedMessages = await api.getChatMessages(group.id);
            if (fetchedMessages.length === 0) {
                 setMessages([{
                    id: 'system-1',
                    sender: 'System',
                    text: `Welcome to ${group.groupName}! Say hello, or type '@ai' followed by a question to get help from the AI assistant.`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                }]);
            } else {
                setMessages(fetchedMessages);
            }
        } catch (err) {
            setError("Failed to load chat history.");
        }
    };
    fetchMessages();
  }, [group.id, group.groupName]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiTyping]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
        nameInputRef.current.focus();
    }
  }, [isEditingName]);

  const findStudentName = (username: string) => allStudents.find(s => s.username === username)?.name || username;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = newMessage.trim();
    if (trimmedMessage === '') return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: currentUser.username,
      text: trimmedMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      parentId: replyingTo ? replyingTo.id : undefined,
    };
    
    // Optimistically update UI
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setReplyingTo(null);

    try {
        await api.postChatMessage(group.id, userMessage);
    } catch(err) {
        setError("Failed to send message. Please try again.");
        // Revert optimistic update on failure
        setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    }


    if (trimmedMessage.toLowerCase().startsWith('@ai')) {
        setIsAiTyping(true);
        const aiPrompt = trimmedMessage.substring(3).trim();
        const aiResponseText = await getAIChatResponse(messages, aiPrompt);
        const aiMessage: ChatMessage = {
            id: `msg-ai-${Date.now()}`,
            sender: 'AI',
            text: aiResponseText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        // Post AI message to backend and update state
        try {
            await api.postChatMessage(group.id, aiMessage);
            setMessages(prev => [...prev, aiMessage]);
        } catch (err) {
            setError("The AI assistant failed to send a message.");
        } finally {
            setIsAiTyping(false);
        }
    }
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    const newMessages = messages.map(msg => {
        if (msg.id === messageId) {
            const reactions = { ...(msg.reactions || {}) };
            const reactors = reactions[emoji] || [];
            const userIndex = reactors.indexOf(currentUser.username);

            if (userIndex > -1) {
                reactors.splice(userIndex, 1);
                if (reactors.length === 0) delete reactions[emoji];
            } else {
                reactions[emoji] = [...reactors, currentUser.username];
            }
            return { ...msg, reactions };
        }
        return msg;
    });

    setMessages(newMessages);
    setActivePickerId(null);
    
    // Find the updated group and persist the change to the backend.
    // This updates the entire message log within the group document.
    const updatedGroup = { ...group, messages: newMessages.filter(m => m.sender !== 'System') };
    onUpdateGroup(updatedGroup);
  };

  const handleNameUpdate = () => {
    if (editingName.trim() && editingName !== group.groupName) {
        onUpdateGroup({ ...group, groupName: editingName.trim(), messages: messages.filter(m => m.sender !== 'System') });
    }
    setIsEditingName(false);
  };
  
  const isAdmin = currentUser.username === group.admin;

  return (
    <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl h-full flex flex-col border border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0 bg-slate-900/50 rounded-t-2xl gap-2">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={onBack} className="text-sm font-semibold text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg transition-colors flex-shrink-0">
            &larr;
          </button>
          <div className={`w-12 h-12 rounded-full ${getColorForUser(group.groupName)} flex items-center justify-center font-bold text-xl text-white flex-shrink-0`}>
             <UserGroupIcon className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            {isEditingName && isAdmin ? (
              <input 
                  ref={nameInputRef}
                  value={editingName} 
                  onChange={e => setEditingName(e.target.value)} 
                  onBlur={handleNameUpdate}
                  onKeyDown={e => e.key === 'Enter' && handleNameUpdate()}
                  className="bg-slate-700 text-lg font-bold text-cyan-400 outline-none rounded-md px-2 py-1 w-full"
              />
            ) : (
              <h2 className="text-lg font-bold text-cyan-400 truncate flex items-center gap-2">
                  {group.groupName}
                  {isAdmin && (
                      <button onClick={() => setIsEditingName(true)} className="text-slate-400 hover:text-white transition-colors">
                          <PencilIcon className="w-4 h-4" />
                      </button>
                  )}
              </h2>
            )}
            <p className="text-xs text-slate-400 truncate" title={group.members.map(findStudentName).join(', ')}>{group.members.length} members</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            {!isAdmin && (
                <button onClick={() => onLeaveGroup(group.id)} title="Leave Group" className="text-sm font-semibold text-slate-300 hover:text-white bg-yellow-600/50 hover:bg-yellow-500/50 p-2 rounded-lg transition-colors">
                    <ExitIcon className="w-5 h-5" />
                </button>
            )}
            {isAdmin && (
                <button onClick={() => onDeleteGroup(group.id)} title="Delete Group" className="text-sm font-semibold text-slate-300 hover:text-white bg-red-600/50 hover:bg-red-500/50 p-2 rounded-lg transition-colors">
                    <TrashIcon className="w-5 h-5" />
                </button>
            )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-grow p-4 overflow-y-auto space-y-1">
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {messages.map(msg => {
            if (msg.sender === 'System') {
                return <div key={msg.id} className="text-center text-xs text-slate-400 italic py-2">{msg.text}</div>
            }

            const parentMessage = msg.parentId ? messages.find(p => p.id === msg.parentId) : null;
            const isAI = msg.sender === 'AI';
            const senderName = isAI ? 'AI Assistant' : findStudentName(msg.sender);
            const isCurrentUser = msg.sender === currentUser.username;

            const bubbleClasses = isCurrentUser
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-br-none'
              : isAI
              ? 'bg-slate-900 border border-indigo-700/50 text-slate-100 rounded-bl-none shadow-indigo-500/20'
              : 'bg-slate-700 text-slate-100 rounded-bl-none';
            const senderNameClasses = isAI ? 'text-indigo-300' : 'text-cyan-300';
            const timestampClasses = isCurrentUser ? 'text-cyan-200' : 'text-slate-400';

            return (
              <div key={msg.id} className={msg.parentId ? 'pl-8 border-l-2 border-slate-700' : ''}>
                <div className={`flex items-end gap-3 mt-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full ${getColorForUser(msg.sender)} flex items-center justify-center font-bold text-sm text-white flex-shrink-0`} title={senderName}>
                        {isAI ? <SparklesIcon className="w-5 h-5"/> : senderName.charAt(0)}
                    </div>
                    <div className={`rounded-xl px-4 py-2.5 max-w-xs md:max-w-md shadow-md relative group ${bubbleClasses}`}>
                      {parentMessage && (
                        <div className="text-xs opacity-80 border-l-2 border-slate-400/50 pl-2 mb-2">
                          <p className="font-bold">Replying to {findStudentName(parentMessage.sender)}</p>
                          <p className="truncate italic">"{parentMessage.text}"</p>
                        </div>
                      )}
                      
                      {!isCurrentUser && <p className={`font-bold text-sm mb-1 ${senderNameClasses}`}>{senderName}</p>}
                      <p className="break-words whitespace-pre-wrap">{msg.text}</p>
                      <p className={`text-right text-xs mt-1 ${timestampClasses}`}>{msg.timestamp}</p>
                      
                       {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                              {Object.entries(msg.reactions).map(([emoji, reactors]) => {
                                  const userList = reactors as string[];
                                  return (
                                    <button key={emoji} onClick={() => handleToggleReaction(msg.id, emoji)}
                                        className={`px-2 py-0.5 text-xs rounded-full transition-colors ${userList.includes(currentUser.username) ? 'bg-cyan-600 border border-cyan-400' : 'bg-slate-600/70 border border-transparent hover:bg-slate-600'}`}
                                    >
                                        {emoji} {userList.length}
                                    </button>
                                  );
                              })}
                          </div>
                      )}

                      <div className="absolute top-0 right-0 -translate-y-1/2 flex items-center gap-1 bg-slate-800 border border-slate-600 rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setActivePickerId(activePickerId === msg.id ? null : msg.id)} className="p-1.5 rounded-full hover:bg-slate-700"><EmojiHappyIcon className="w-4 h-4 text-slate-300" /></button>
                        <button onClick={() => setReplyingTo(msg)} className="p-1.5 rounded-full hover:bg-slate-700"><ReplyIcon className="w-4 h-4 text-slate-300" /></button>
                      </div>

                      {activePickerId === msg.id && (
                        <div className="absolute z-10 -top-2 left-1/2 -translate-x-1/2 -translate-y-full flex gap-2 bg-slate-900 border border-slate-600 p-2 rounded-full shadow-xl">
                          {REACTION_EMOJIS.map(emoji => (
                            <button key={emoji} onClick={() => handleToggleReaction(msg.id, emoji)} className="text-xl p-1 rounded-full hover:bg-slate-700 transform hover:scale-125 transition-transform">
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                </div>
              </div>
            )
        })}
        {isAiTyping && (
             <div className="flex items-end gap-3 mt-3">
                <div className={`w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm text-white flex-shrink-0`} title="AI Assistant">
                    <SparklesIcon className="w-5 h-5"/>
                </div>
                <div className="rounded-xl px-4 py-2.5 max-w-xs md:max-w-md relative shadow-md bg-slate-900 border border-indigo-700/50 text-slate-100 rounded-bl-none">
                    <p className="font-bold text-indigo-300 text-sm mb-1">AI Assistant</p>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-0"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-300"></span>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700 flex-shrink-0 bg-slate-900/50 rounded-b-2xl">
        {replyingTo && (
            <div className="bg-slate-700 p-2 rounded-t-lg flex justify-between items-center text-sm">
                <div className="text-slate-300">
                    Replying to <span className="font-semibold text-white">{findStudentName(replyingTo.sender)}</span>
                    <p className="text-slate-400 italic truncate max-w-xs sm:max-w-md">"{replyingTo.text}"</p>
                </div>
                <button onClick={() => setReplyingTo(null)} className="font-bold text-2xl text-slate-400 hover:text-white leading-none px-2">&times;</button>
            </div>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder={`Message ${group.groupName}...`}
            className={`flex-grow bg-slate-700 text-white p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition w-full ${replyingTo ? 'rounded-b-lg' : 'rounded-lg'}`}
          />
          <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold p-3 rounded-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed" disabled={!newMessage.trim() || isAiTyping}>
            <SendIcon />
          </button>
        </form>
      </div>
    </div>
  );
};

export default GroupChat;
