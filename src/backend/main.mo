import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import InviteLinksModule "invite-links/invite-links-module";
import Nat "mo:core/Nat";
import Set "mo:core/Set";
import Text "mo:core/Text";
import Map "mo:core/Map";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Array "mo:core/Array";
import Migration "migration";

(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  let inviteLinksState = InviteLinksModule.initState();

  let challenges = Map.empty<Nat, Challenge>();
  var nextChallengeId = 0;

  let creatorToChallengeId = Map.empty<Principal, Nat>();
  let participantToChallengeId = Map.empty<Principal, Nat>();

  public type UserProfile = {
    name : Text;
  };

  public type RecordingSlot = {
    day : Nat;
    assignment : Text;
  };

  public type ChatMessage = {
    id : Nat;
    sender : Principal;
    senderName : Text;
    text : Text;
    timestamp : Int;
    isEdited : Bool;
    replyTo : ?Nat;
  };

  public type Challenge = {
    id : Nat;
    creator : Principal;
    startTime : Time.Time;
    participants : Set.Set<Principal>;
    isActive : Bool;
    invitationCodes : Map.Map<Text, Bool>;
    recordings : Map.Map<Principal, Map.Map<Nat, Map.Map<Text, Storage.ExternalBlob>>>;
    chatMessages : List.List<ChatMessage>;
    nextChatId : Nat;
  };

  public type UserChallengeStatus = {
    hasActiveChallenge : Bool;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  let validAssignments = [
    "awareness",
    "utopia",
    "small-steps",
    "support-strategies",
    "other-contemplations",
  ];

  let maxNameLength = 30;
  let maxMessageLength = 250;
  let maxChatMessages = 250;
  let maxRSVPNameLength = 100;

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    validateUserRole(caller);
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    validateUserRole(caller);

    if (caller == user or AccessControl.isAdmin(accessControlState, caller)) {
      return userProfiles.get(user);
    };

    let callerIsCreatorOfUserChallenge = challenges.values().any(
      func(challenge) { challenge.creator == caller and challenge.participants.contains(user) }
    );

    if (callerIsCreatorOfUserChallenge) {
      userProfiles.get(user);
    } else {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    validateUserRole(caller);
    if (profile.name.trim(#char ' ').size() == 0) {
      Runtime.trap("Profile name cannot be empty or whitespace only");
    };
    if (profile.name.size() > maxNameLength) {
      Runtime.trap("Profile name cannot exceed " # maxNameLength.toText() # " characters");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getUserChallengeStatus() : async UserChallengeStatus {
    validateUserRole(caller);
    let hasActiveChallenge = participantToChallengeId.containsKey(caller);
    { hasActiveChallenge };
  };

  public query ({ caller }) func getActiveChallengeIdForCreator() : async ?Nat {
    validateUserRole(caller);
    creatorToChallengeId.get(caller);
  };

  public query ({ caller }) func getActiveChallengeIdForParticipant() : async ?Nat {
    validateUserRole(caller);
    participantToChallengeId.get(caller);
  };

  public shared ({ caller }) func createChallenge(startTime : Time.Time) : async Nat {
    validateUserRole(caller);

    if (participantToChallengeId.containsKey(caller)) {
      Runtime.trap("User already has an active challenge");
    };

    let participants = Set.singleton(caller);
    let invitationCodes = Map.empty<Text, Bool>();
    let recordings = Map.empty<Principal, Map.Map<Nat, Map.Map<Text, Storage.ExternalBlob>>>();
    let chatMessages = List.empty<ChatMessage>();

    let challenge : Challenge = {
      id = nextChallengeId;
      creator = caller;
      startTime;
      participants;
      isActive = true;
      invitationCodes;
      recordings;
      chatMessages;
      nextChatId = 0;
    };

    challenges.add(nextChallengeId, challenge);
    creatorToChallengeId.add(caller, nextChallengeId);
    participantToChallengeId.add(caller, nextChallengeId);

    nextChallengeId += 1;
    challenge.id;
  };

  public shared ({ caller }) func generateInvitationCode(challengeId : Nat, code : Text) : async () {
    validateUserRole(caller);

    switch (challenges.get(challengeId)) {
      case (null) { Runtime.trap("Challenge not found") };
      case (?challenge) {
        if (challenge.creator != caller) {
          Runtime.trap("Only the creator can generate invitation codes");
        };

        if (Time.now() > challenge.startTime + 24 * 3600 * 1_000_000_000) {
          Runtime.trap("Invitation codes can only be generated before the end of Day 1");
        };

        let newInvitationCodes = challenge.invitationCodes.clone();
        newInvitationCodes.add(code, false);

        let updatedChallenge = { challenge with invitationCodes = newInvitationCodes };
        challenges.add(challengeId, updatedChallenge);
      };
    };
  };

  public shared ({ caller }) func redeemInvitationCode(challengeId : Nat, code : Text) : async () {
    validateUserRole(caller);
    if (participantToChallengeId.containsKey(caller)) {
      Runtime.trap("User already has an active challenge");
    };

    switch (challenges.get(challengeId)) {
      case (null) { Runtime.trap("Challenge not found") };
      case (?challenge) {
        if (Time.now() > challenge.startTime + 24 * 3600 * 1_000_000_000) {
          Runtime.trap("Invitation codes cannot be redeemed after Day 1");
        };

        switch (challenge.invitationCodes.get(code)) {
          case (null) { Runtime.trap("Invalid invitation code") };
          case (?isUsed) {
            if (isUsed) {
              Runtime.trap("Invitation code has already been used");
            };

            let newParticipants = challenge.participants.clone();
            newParticipants.add(caller);

            let newInvitationCodes = challenge.invitationCodes.clone();
            newInvitationCodes.add(code, true);

            let updatedChallenge = {
              challenge with
              participants = newParticipants;
              invitationCodes = newInvitationCodes;
            };

            challenges.add(challengeId, updatedChallenge);
            participantToChallengeId.add(caller, challengeId);
          };
        };
      };
    };
  };

  public shared ({ caller }) func updateStartTime(challengeId : Nat, newStartTime : Time.Time) : async () {
    validateUserRole(caller);
    switch (challenges.get(challengeId)) {
      case (null) { Runtime.trap("Challenge not found") };
      case (?challenge) {
        if (challenge.creator != caller) {
          Runtime.trap("Only the creator can update start time");
        };

        if (Time.now() > challenge.startTime + 24 * 3600 * 1_000_000_000) {
          Runtime.trap("Start time can only be updated before the end of Day 1");
        };

        let updatedChallenge = { challenge with startTime = newStartTime };
        challenges.add(challengeId, updatedChallenge);
      };
    };
  };

  public shared ({ caller }) func leaveChallenge(challengeId : Nat) : async () {
    validateUserRole(caller);

    switch (challenges.get(challengeId)) {
      case (null) { Runtime.trap("Challenge not found") };
      case (?challenge) {
        if (not challenge.participants.contains(caller)) {
          Runtime.trap("Not a participant of this challenge");
        };

        let newParticipants = challenge.participants.clone();
        newParticipants.remove(caller);

        let newRecordings = challenge.recordings.clone();
        newRecordings.remove(caller);

        let updatedChallenge = {
          challenge with
          participants = newParticipants;
          recordings = newRecordings;
        };
        challenges.add(challengeId, updatedChallenge);

        if (caller == challenge.creator) {
          creatorToChallengeId.remove(caller);
        };

        participantToChallengeId.remove(caller);
      };
    };
  };

  public query ({ caller }) func getChallengeParticipants(challengeId : Nat) : async [Principal] {
    validateUserRole(caller);
    switch (challenges.get(challengeId)) {
      case (null) { Runtime.trap("Challenge not found") };
      case (?challenge) {
        if (not challenge.participants.contains(caller)) {
          Runtime.trap("Only participants can view participants");
        };

        challenge.participants.toArray();
      };
    };
  };

  public query ({ caller }) func getAvailableInvitationCodes(challengeId : Nat) : async [Text] {
    validateUserRole(caller);
    switch (challenges.get(challengeId)) {
      case (null) { Runtime.trap("Challenge not found") };
      case (?challenge) {
        if (challenge.creator != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Only the creator can view invitation codes");
        };

        let unusedCodes = challenge.invitationCodes.keys().toArray().filter(
          func(code : Text) : Bool {
            switch (challenge.invitationCodes.get(code)) {
              case (?isUsed) { not isUsed };
              case (null) { false };
            };
          }
        );

        unusedCodes;
      };
    };
  };

  public query ({ caller }) func getChallengeAudioRecordings(challengeId : Nat) : async [Principal] {
    validateUserRole(caller);

    switch (challenges.get(challengeId)) {
      case (null) { Runtime.trap("Challenge not found") };
      case (?challenge) {
        if (not challenge.participants.contains(caller)) {
          Runtime.trap("Only participants can view audio recordings");
        };

        let allParticipants = challenge.participants.toArray();
        allParticipants;
      };
    };
  };

  public query ({ caller }) func getAllChallengeParticipantProfiles(challengeId : Nat) : async [(Principal, ?UserProfile)] {
    validateUserRole(caller);

    switch (challenges.get(challengeId)) {
      case (null) { Runtime.trap("Challenge not found") };
      case (?challenge) {
        if (not challenge.participants.contains(caller)) {
          Runtime.trap("Only participants can view participant profiles");
        };

        let allParticipants = challenge.participants.toArray();

        let profiles = allParticipants.map(func(principal) { (principal, userProfiles.get(principal)) });

        profiles;
      };
    };
  };

  public shared ({ caller }) func deleteChallenge(challengeId : Nat) : async () {
    validateUserRole(caller);

    switch (challenges.get(challengeId)) {
      case (null) { Runtime.trap("Challenge not found") };
      case (?challenge) {
        if (challenge.creator != caller) {
          Runtime.trap("Only the creator can delete the challenge");
        };

        challenges.remove(challengeId);
        removeParticipantsFromChallenge(challengeId, challenge);
      };
    };
  };

  public shared ({ caller }) func removeParticipant(challengeId : Nat, participant : Principal) : async () {
    validateUserRole(caller);

    switch (challenges.get(challengeId)) {
      case (null) { Runtime.trap("Challenge not found") };
      case (?challenge) {
        if (challenge.creator != caller) {
          Runtime.trap("Only the creator can remove participants");
        };

        if (challenge.creator == participant) {
          Runtime.trap("Creator cannot remove themselves");
        };

        let newParticipants = challenge.participants.clone();
        newParticipants.remove(participant);

        let newRecordings = challenge.recordings.clone();
        newRecordings.remove(participant);

        let updatedChallenge = {
          challenge with
          participants = newParticipants;
          recordings = newRecordings;
        };
        challenges.add(challengeId, updatedChallenge);

        participantToChallengeId.remove(participant);
      };
    };
  };

  public shared ({ caller }) func saveRecording(challengeId : Nat, day : Nat, assignment : Text, recording : Storage.ExternalBlob) : async () {
    validateUserRole(caller);
    checkDay(day);

    let canonicalAssignment = canonicalizeAssignment(assignment);
    checkAssignment(canonicalAssignment);

    switch (challenges.get(challengeId)) {
      case (null) { Runtime.trap("Challenge not found") };
      case (?challenge) {
        if (not challenge.participants.contains(caller)) {
          Runtime.trap("Only participants can save recordings");
        };

        let existingUserRecordings = switch (challenge.recordings.get(caller)) {
          case (?userRecordings) { userRecordings };
          case (null) { Map.empty<Nat, Map.Map<Text, Storage.ExternalBlob>>() };
        };

        let existingDayRecordings = switch (existingUserRecordings.get(day)) {
          case (?dayRecordings) { dayRecordings };
          case (null) { Map.empty<Text, Storage.ExternalBlob>() };
        };

        if (existingDayRecordings.containsKey(canonicalAssignment)) {
          Runtime.trap("Recording already exists for this assignment. Delete the existing recording before uploading a new one. Users cannot overwrite an existing recording.");
        };

        let updatedDayRecordings = existingDayRecordings.clone();
        updatedDayRecordings.add(canonicalAssignment, recording);

        let updatedUserRecordings = existingUserRecordings.clone();
        updatedUserRecordings.add(day, updatedDayRecordings);

        let newRecordings = challenge.recordings.clone();
        newRecordings.add(caller, updatedUserRecordings);

        let updatedChallenge = {
          challenge with
          recordings = newRecordings;
        };
        challenges.add(challengeId, updatedChallenge);
      };
    };
  };

  public shared query ({ caller }) func getRecording(challengeId : Nat, day : Nat, assignment : Text) : async Storage.ExternalBlob {
    checkDay(day);

    let canonicalAssignment = canonicalizeAssignment(assignment);
    checkAssignment(canonicalAssignment);

    validateUserRole(caller);

    switch (challenges.get(challengeId)) {
      case (null) { Runtime.trap("Challenge not found") };
      case (?challenge) {
        if (not challenge.participants.contains(caller)) {
          Runtime.trap("Only participants can get recordings");
        };

        switch (challenge.recordings.get(caller)) {
          case (null) { Runtime.trap("No recordings found for user") };
          case (?userRecordings) {
            switch (userRecordings.get(day)) {
              case (null) { Runtime.trap("No recordings found for day") };
              case (?dayRecordings) {
                switch (dayRecordings.get(canonicalAssignment)) {
                  case (null) { Runtime.trap("Recording not found for assignment") };
                  case (?recording) { recording };
                };
              };
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func deleteRecording(challengeId : Nat, day : Nat, assignment : Text) : async () {
    checkDay(day);

    let canonicalAssignment = canonicalizeAssignment(assignment);
    checkAssignment(canonicalAssignment);

    validateUserRole(caller);

    switch (challenges.get(challengeId)) {
      case (null) { Runtime.trap("Challenge not found") };
      case (?challenge) {
        if (not challenge.participants.contains(caller)) {
          Runtime.trap("Only participants can delete recordings");
        };

        let existingUserRecordings = switch (challenge.recordings.get(caller)) {
          case (?userRecordings) { userRecordings };
          case (null) { Runtime.trap("No recordings found for user") };
        };

        let existingDayRecordings = switch (existingUserRecordings.get(day)) {
          case (?dayRecordings) { dayRecordings };
          case (null) { Runtime.trap("No recordings found for day") };
        };

        if (not existingDayRecordings.containsKey(canonicalAssignment)) {
          Runtime.trap("Recording not found for assignment");
        };

        let updatedDayRecordings = existingDayRecordings.clone();
        updatedDayRecordings.remove(canonicalAssignment);

        let newUserRecordings = existingUserRecordings.clone();
        newUserRecordings.add(day, updatedDayRecordings);

        let newRecordings = challenge.recordings.clone();
        newRecordings.add(caller, newUserRecordings);

        let updatedChallenge = { challenge with recordings = newRecordings };
        challenges.add(challengeId, updatedChallenge);
      };
    };
  };

  public shared query ({ caller }) func getAssignmentRecordings(challengeId : Nat, day : Nat, assignment : Text) : async [(Principal, ?Storage.ExternalBlob)] {
    checkDay(day);

    let canonicalAssignment = canonicalizeAssignment(assignment);
    checkAssignment(canonicalAssignment);

    validateUserRole(caller);

    switch (challenges.get(challengeId)) {
      case (null) { Runtime.trap("Challenge not found") };
      case (?challenge) {
        if (not challenge.participants.contains(caller)) {
          Runtime.trap("Only participants can fetch recordings");
        };

        challenge.participants.toArray().map(
          func(participant) {
            switch (challenge.recordings.get(participant)) {
              case (null) { (participant, null : ?Storage.ExternalBlob) };
              case (?userRecordings) {
                switch (userRecordings.get(day)) {
                  case (null) { (participant, null : ?Storage.ExternalBlob) };
                  case (?dayRecordings) {
                    switch (dayRecordings.get(canonicalAssignment)) {
                      case (null) { (participant, null : ?Storage.ExternalBlob) };
                      case (?recording) { (participant, ?recording) };
                    };
                  };
                };
              };
            };
          }
        );
      };
    };
  };

  public shared query ({ caller }) func getParticipantRecording(challengeId : Nat, participant : Principal, day : Nat, assignment : Text) : async Storage.ExternalBlob {
    checkDay(day);

    let canonicalAssignment = canonicalizeAssignment(assignment);
    checkAssignment(canonicalAssignment);

    validateUserRole(caller);

    switch (challenges.get(challengeId)) {
      case (null) { Runtime.trap("Challenge not found") };
      case (?challenge) {
        if (not challenge.participants.contains(caller)) {
          Runtime.trap("Only participants can get recordings");
        };

        switch (challenge.recordings.get(participant)) {
          case (null) { Runtime.trap("No recordings found for participant") };
          case (?userRecordings) {
            switch (userRecordings.get(day)) {
              case (null) { Runtime.trap("No recordings found for day") };
              case (?dayRecordings) {
                switch (dayRecordings.get(canonicalAssignment)) {
                  case (null) { Runtime.trap("Recording not found for assignment") };
                  case (?recording) { recording };
                };
              };
            };
          };
        };
      };
    };
  };

  public query ({ caller }) func getChallengeStartTime(challengeId : Nat) : async Time.Time {
    validateUserRole(caller);

    switch (challenges.get(challengeId)) {
      case (null) { Runtime.trap("Challenge not found") };
      case (?challenge) {
        if (not challenge.participants.contains(caller)) {
          Runtime.trap("Only participants can fetch challenge start time");
        };
        challenge.startTime;
      };
    };
  };

  public shared query ({ caller }) func getMessage(challengeId : Nat, messageId : Nat) : async ChatMessage {
    validateUserRole(caller);

    switch (challenges.get(challengeId)) {
      case (null) { Runtime.trap("Challenge not found") };
      case (?challenge) {
        if (not challenge.participants.contains(caller)) {
          Runtime.trap("Only participants can fetch messages");
        };

        switch (findMessageById(challenge.chatMessages, messageId)) {
          case (null) { Runtime.trap("Message not found") };
          case (?message) { message };
        };
      };
    };
  };

  func findMessageById(messages : List.List<ChatMessage>, messageId : Nat) : ?ChatMessage {
    messages.toArray().find(func(message) { message.id == messageId });
  };

  public shared ({ caller }) func postMessage(challengeId : Nat, text : Text, replyTo : ?Nat) : async Nat {
    validateUserRole(caller);
    validateMessageContent(text);

    switch (challenges.get(challengeId)) {
      case (null) { Runtime.trap("Challenge not found") };
      case (?challenge) {
        if (not challenge.participants.contains(caller)) {
          Runtime.trap("Only participants can post messages");
        };

        let senderProfile = userProfiles.get(caller);
        switch (senderProfile) {
          case (null) {
            Runtime.trap("Profile required: You must complete your profile before posting messages");
          };
          case (?profile) {
            if (profile.name.trim(#char ' ').size() == 0) {
              Runtime.trap("Profile required: Your profile name cannot be empty");
            };

            let newMessage : ChatMessage = {
              id = challenge.nextChatId;
              sender = caller;
              senderName = profile.name;
              text;
              timestamp = Time.now();
              isEdited = false;
              replyTo;
            };

            challenge.chatMessages.add(newMessage);

            challenges.add(challengeId, { challenge with nextChatId = challenge.nextChatId + 1 });

            newMessage.id;
          };
        };
      };
    };
  };

  public shared ({ caller }) func editMessage(challengeId : Nat, messageId : Nat, newText : Text) : async () {
    validateUserRole(caller);
    validateMessageContent(newText);

    switch (challenges.get(challengeId)) {
      case (null) { Runtime.trap("Challenge not found") };
      case (?challenge) {
        if (not challenge.participants.contains(caller)) {
          Runtime.trap("Only participants can edit messages");
        };

        switch (findMessageById(challenge.chatMessages, messageId)) {
          case (null) { Runtime.trap("Message not found") };
          case (?existingMessage) {
            if (existingMessage.sender != caller) {
              Runtime.trap("Unauthorized: Only the author can edit this message");
            };

            let updatedMessages = challenge.chatMessages.map<ChatMessage, ChatMessage>(
              func(msg) {
                if (msg.id == messageId) {
                  { msg with text = newText; isEdited = true };
                } else { msg };
              }
            );

            challenge.chatMessages.clear();
            for (msg in updatedMessages.values()) {
              challenge.chatMessages.add(msg);
            };
          };
        };
      };
    };
  };

  func updateSenderNames(messages : List.List<ChatMessage>, userProfiles : Map.Map<Principal, UserProfile>) : List.List<ChatMessage> {
    messages.map<ChatMessage, ChatMessage>(
      func(msg) {
        let senderName = switch (userProfiles.get(msg.sender)) {
          case (null) { "" };
          case (?profile) { profile.name };
        };
        { msg with senderName };
      }
    );
  };

  public shared query ({ caller }) func getMessages(challengeId : Nat) : async [ChatMessage] {
    validateUserRole(caller);

    switch (challenges.get(challengeId)) {
      case (null) { Runtime.trap("Challenge not found") };
      case (?challenge) {
        if (not challenge.participants.contains(caller)) {
          Runtime.trap("Only participants can fetch messages");
        };

        let messagesWithSenderNames = updateSenderNames(challenge.chatMessages, userProfiles);
        messagesWithSenderNames.toArray();
      };
    };
  };

  public shared ({ caller }) func generateInviteCode() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can generate invite codes");
    };
    let code = "dummy-invite-code";
    InviteLinksModule.generateInviteCode(inviteLinksState, code);
    code;
  };

  public shared func submitRSVP(name : Text, attending : Bool, inviteCode : Text) : async () {
    if (name.trim(#char ' ').size() == 0) {
      Runtime.trap("RSVP name cannot be empty or whitespace only");
    };
    if (name.size() > maxRSVPNameLength) {
      Runtime.trap("RSVP name cannot exceed " # maxRSVPNameLength.toText() # " characters");
    };
    if (inviteCode.trim(#char ' ').size() == 0) {
      Runtime.trap("Invite code cannot be empty");
    };
    InviteLinksModule.submitRSVP(inviteLinksState, name, attending, inviteCode);
  };

  public query ({ caller }) func getAllRSVPs() : async [InviteLinksModule.RSVP] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view RSVPs");
    };
    InviteLinksModule.getAllRSVPs(inviteLinksState);
  };

  public query ({ caller }) func getInviteCodes() : async [InviteLinksModule.InviteCode] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view invite codes");
    };
    InviteLinksModule.getInviteCodes(inviteLinksState);
  };

  func validateUserRole(caller : Principal) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
  };

  func checkDay(day : Nat) {
    if (day > 6) {
      Runtime.trap("Invalid day: Valid range is 0–6 for 7 day challenge");
    };
  };

  func checkAssignment(assignment : Text) {
    switch (validAssignments.find(func(a) { a == assignment })) {
      case (null) {
        Runtime.trap("Invalid assignment: " # assignment);
      };
      case (?_) {};
    };
  };

  func validateMessageContent(text : Text) {
    if (text.trim(#char ' ').size() == 0) {
      Runtime.trap("Message cannot be empty or whitespace only");
    };
    if (text.size() > maxMessageLength) {
      Runtime.trap("Message cannot exceed " # maxMessageLength.toText() # " characters");
    };
  };

  func canonicalizeAssignment(assignment : Text) : Text {
    assignment.toLower();
  };

  func removeParticipantsFromChallenge(challengeId : Nat, challenge : Challenge) {
    for (participant in challenge.participants.values()) {
      if (participant == challenge.creator) {
        if (creatorToChallengeId.get(participant) == ?challengeId) {
          creatorToChallengeId.remove(participant);
        };
      };

      if (participantToChallengeId.get(participant) == ?challengeId) {
        participantToChallengeId.remove(participant);
      };
    };
  };
};
