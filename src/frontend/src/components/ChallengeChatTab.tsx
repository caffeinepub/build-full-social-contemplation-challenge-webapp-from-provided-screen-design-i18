import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Edit2, X, Reply } from 'lucide-react';
import { useGetMessages, usePostMessage, useEditMessage, useGetAllChallengeParticipantProfiles } from '../hooks/useQueries';
import { useAuthPrincipal } from '../hooks/useAuthPrincipal';
import { sanitizeErrorMessage } from '../utils/sanitizeErrorMessage';
import { ChatReplyReference } from './ChatReplyReference';
import type { ChatMessage } from '../backend';

interface ChallengeChatTabProps {
  challengeId: bigint | null;
  isActive: boolean;
}

export function ChallengeChatTab({ challengeId, isActive }: ChallengeChatTabProps) {
  const [messageText, setMessageText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<bigint | null>(null);
  const [editText, setEditText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { identity } = useAuthPrincipal();
  const currentPrincipal = identity?.getPrincipal().toString();

  // Fetch messages with polling enabled only when tab is active
  const messagesQuery = useGetMessages(challengeId, isActive);
  const postMessageMutation = usePostMessage();
  const editMessageMutation = useEditMessage();
  
  // Fetch participant profiles to resolve sender names
  const participantProfilesQuery = useGetAllChallengeParticipantProfiles(challengeId);

  const messages = messagesQuery.data || [];

  // Helper to get display name for a sender
  const getSenderDisplayName = (message: ChatMessage): string => {
    // First, use the senderName from the message if available
    if (message.senderName && message.senderName.trim()) {
      return message.senderName;
    }

    // Fallback: look up in participant profiles
    const senderPrincipalStr = message.sender.toString();
    const participantProfile = participantProfilesQuery.data?.find(
      ([principal]) => principal.toString() === senderPrincipalStr
    );

    if (participantProfile && participantProfile[1]?.name) {
      return participantProfile[1].name;
    }

    // Last resort fallback
    return 'Unknown';
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleSendMessage = async () => {
    if (!challengeId) return;

    // Client-side validation
    const trimmedText = messageText.trim();
    if (!trimmedText) {
      setError('Message cannot be empty');
      return;
    }

    setError(null);

    try {
      await postMessageMutation.mutateAsync({
        challengeId,
        text: trimmedText,
        replyTo: replyingTo ? replyingTo.id : null,
      });

      // Clear input and reply state on success
      setMessageText('');
      setReplyingTo(null);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(sanitizeErrorMessage(err));
    }
  };

  const handleStartEdit = (message: ChatMessage) => {
    setEditingMessageId(message.id);
    setEditText(message.text);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText('');
    setError(null);
  };

  const handleSaveEdit = async (messageId: bigint) => {
    if (!challengeId) return;

    const trimmedText = editText.trim();
    if (!trimmedText) {
      setError('Message cannot be empty');
      return;
    }

    setError(null);

    try {
      await editMessageMutation.mutateAsync({
        challengeId,
        messageId,
        newText: trimmedText,
      });

      setEditingMessageId(null);
      setEditText('');
    } catch (err) {
      console.error('Failed to edit message:', err);
      setError(sanitizeErrorMessage(err));
    }
  };

  const handleReply = (message: ChatMessage) => {
    setReplyingTo(message);
    setError(null);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEditKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, messageId: bigint) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit(messageId);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp / BigInt(1_000_000)));
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[500px] sm:h-[600px]">
      {/* Messages Area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 p-0 flex flex-col">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            {messagesQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message: ChatMessage) => {
                  const isMyMessage = message.sender.toString() === currentPrincipal;
                  const isEditing = editingMessageId === message.id;
                  const authorName = getSenderDisplayName(message);

                  return (
                    <div
                      key={message.id.toString()}
                      className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] ${isMyMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                        {/* Reply reference */}
                        {message.replyTo !== undefined && message.replyTo !== null && (
                          <ChatReplyReference challengeId={challengeId!} replyToId={message.replyTo} isActive={isActive} />
                        )}

                        {/* Message bubble */}
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            isMyMessage
                              ? 'bg-green-500 text-white'
                              : 'bg-purple-500 text-white'
                          }`}
                        >
                          {isEditing ? (
                            <div className="space-y-2">
                              <Input
                                value={editText}
                                onChange={(e) => {
                                  setEditText(e.target.value);
                                  if (error) setError(null);
                                }}
                                onKeyDown={(e) => handleEditKeyPress(e, message.id)}
                                className="text-sm bg-white/20 border-white/30 text-white placeholder:text-white/60"
                                disabled={editMessageMutation.isPending}
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleSaveEdit(message.id)}
                                  disabled={editMessageMutation.isPending || !editText.trim()}
                                  className="text-xs h-7"
                                >
                                  {editMessageMutation.isPending ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    'Save'
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelEdit}
                                  disabled={editMessageMutation.isPending}
                                  className="text-xs h-7 text-white hover:bg-white/20"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm break-words whitespace-pre-wrap">{message.text}</p>
                              <div className="flex items-center justify-between gap-2 mt-1">
                                <p
                                  className={`text-xs ${
                                    isMyMessage ? 'text-green-100' : 'text-purple-100'
                                  }`}
                                >
                                  {formatTimestamp(message.timestamp)}
                                  {message.isEdited && <span className="ml-1">(edited)</span>}
                                </p>
                                {isMyMessage && (
                                  <button
                                    onClick={() => handleStartEdit(message)}
                                    className={`text-xs ${
                                      isMyMessage ? 'text-green-100 hover:text-white' : 'text-purple-100 hover:text-white'
                                    } transition-colors`}
                                    title="Edit message"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Author name and reply button */}
                        <div className="flex items-center gap-2 mt-1 px-2">
                          <p className="text-xs text-muted-foreground">{authorName}</p>
                          {!isEditing && (
                            <button
                              onClick={() => handleReply(message)}
                              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                              title="Reply to this message"
                            >
                              <Reply className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Message Input Area */}
      <div className="mt-4 space-y-2">
        {/* Reply indicator */}
        {replyingTo && (
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
            <Reply className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1 text-sm">
              <span className="text-muted-foreground">Replying to </span>
              <span className="font-medium">{getSenderDisplayName(replyingTo)}</span>
              <span className="text-muted-foreground">: </span>
              <span className="text-muted-foreground">
                {replyingTo.text.length > 40 ? replyingTo.text.substring(0, 40) + '...' : replyingTo.text}
              </span>
            </div>
            <button
              onClick={handleCancelReply}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Cancel reply"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <p className="text-xs text-destructive px-1">{error}</p>
        )}
        <div className="flex gap-2">
          <Input
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              if (error) setError(null);
            }}
            onKeyPress={handleKeyPress}
            placeholder={replyingTo ? 'Type your reply...' : 'Type a message...'}
            disabled={postMessageMutation.isPending || !challengeId}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={postMessageMutation.isPending || !messageText.trim() || !challengeId}
            size="default"
          >
            {postMessageMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
