import { useGetMessages, useGetMessage, useGetAllChallengeParticipantProfiles } from '../hooks/useQueries';
import type { ChatMessage } from '../backend';

interface ChatReplyReferenceProps {
  challengeId: bigint;
  replyToId: bigint;
  isActive?: boolean;
}

export function ChatReplyReference({ challengeId, replyToId, isActive = true }: ChatReplyReferenceProps) {
  // First try to get the message from the cached messages list
  const messagesQuery = useGetMessages(challengeId, isActive);
  const cachedMessage = messagesQuery.data?.find((msg: ChatMessage) => msg.id === replyToId);

  // If not in cache, fetch individually
  const messageQuery = useGetMessage(
    challengeId,
    cachedMessage ? null : replyToId
  );

  // Fetch participant profiles to resolve sender names
  const participantProfilesQuery = useGetAllChallengeParticipantProfiles(challengeId);

  const referencedMessage = cachedMessage || messageQuery.data;

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

  if (!referencedMessage) {
    return (
      <div className="text-xs text-muted-foreground italic mb-1 px-2 py-1 bg-muted/30 rounded">
        Replying to a message...
      </div>
    );
  }

  // Create a short preview (max 50 chars)
  const previewText = referencedMessage.text.length > 50 
    ? referencedMessage.text.substring(0, 50) + '...' 
    : referencedMessage.text;

  const authorName = getSenderDisplayName(referencedMessage);

  return (
    <div className="text-xs text-muted-foreground mb-1 px-2 py-1 bg-muted/30 rounded border-l-2 border-muted-foreground/40">
      <span className="font-medium">{authorName}</span>: {previewText}
    </div>
  );
}
