import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Set "mo:core/Set";
import Time "mo:core/Time";
import VarArray "mo:core/VarArray";
import Runtime "mo:core/Runtime";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  public type UserProfile = {
    name : Text;
  };

  public type RecordingSlot = {
    day : Nat;
    assignment : Text;
  };

  public type Challenge = {
    id : Nat;
    creator : Principal;
    startTime : Time.Time;
    participants : Set.Set<Principal>;
    isActive : Bool;
    invitationCodes : Map.Map<Text, Bool>;
    recordings : Map.Map<Principal, Map.Map<Nat, Map.Map<Text, Storage.ExternalBlob>>>;
  };

  public type UserChallengeStatus = {
    hasActiveChallenge : Bool;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let challenges = Map.empty<Nat, Challenge>();
  var nextChallengeId = 0;

  let creatorToChallengeId = Map.empty<Principal, Nat>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };

    if (caller == user) {
      return userProfiles.get(user);
    };

    if (AccessControl.isAdmin(accessControlState, caller)) {
      return userProfiles.get(user);
    };

    let callerIsCreatorOfUserChallenge = challenges.values().any(
      func(challenge : Challenge) : Bool {
        challenge.creator == caller and challenge.participants.contains(user)
      }
    );

    if (callerIsCreatorOfUserChallenge) {
      return userProfiles.get(user);
    };

    Runtime.trap("Unauthorized: Can only view your own profile");
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getUserChallengeStatus() : async UserChallengeStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };

    let hasActiveChallenge = challenges.values().any(func(challenge) { challenge.participants.contains(caller) });

    {
      hasActiveChallenge;
    };
  };

  public shared ({ caller }) func createChallenge(startTime : Time.Time) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create challenges");
    };

    let userHasActiveChallenge = challenges.values().any(func(challenge) { challenge.participants.contains(caller) });

    if (userHasActiveChallenge) {
      Runtime.trap("User already has an active challenge");
    };

    let participants = Set.singleton(caller);
    let invitationCodes = Map.empty<Text, Bool>();
    let recordings = Map.empty<Principal, Map.Map<Nat, Map.Map<Text, Storage.ExternalBlob>>>();

    let challenge : Challenge = {
      id = nextChallengeId;
      creator = caller;
      startTime;
      participants;
      isActive = true;
      invitationCodes;
      recordings;
    };

    challenges.add(nextChallengeId, challenge);

    creatorToChallengeId.add(caller, nextChallengeId);

    nextChallengeId += 1;

    challenge.id;
  };

  public query ({ caller }) func getActiveChallengeIdForCreator() : async ?Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can fetch challenge IDs");
    };

    creatorToChallengeId.get(caller);
  };

  public shared ({ caller }) func generateInvitationCode(challengeId : Nat, code : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can generate invitation codes");
    };

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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can redeem invitation codes");
    };

    let userHasActiveChallenge = challenges.values().any(func(challenge) { challenge.participants.contains(caller) });
    if (userHasActiveChallenge) {
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
          };
        };
      };
    };
  };

  public shared ({ caller }) func updateStartTime(challengeId : Nat, newStartTime : Time.Time) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update start time");
    };

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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can leave challenges");
    };

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
      };
    };
  };

  public query ({ caller }) func getChallengeParticipants(challengeId : Nat) : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view participants");
    };

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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view invitation codes");
    };

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
          },
        );

        unusedCodes;
      };
    };
  };

  public query ({ caller }) func getChallengeAudioRecordings(challengeId : Nat) : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view audio recordings");
    };

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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view participants");
    };

    switch (challenges.get(challengeId)) {
      case (null) { Runtime.trap("Challenge not found") };
      case (?challenge) {
        if (challenge.creator != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Only creator can view all participant profiles");
        };

        let allParticipants = challenge.participants.toArray();

        let profiles = allParticipants.map(func(principal) { (principal, userProfiles.get(principal)) });

        profiles;
      };
    };
  };

  public shared ({ caller }) func deleteChallenge(challengeId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete challenges");
    };

    switch (challenges.get(challengeId)) {
      case (null) { Runtime.trap("Challenge not found") };
      case (?challenge) {
        if (challenge.creator != caller) {
          Runtime.trap("Only the creator can delete the challenge");
        };

        challenges.remove(challengeId);

        creatorToChallengeId.remove(caller);
      };
    };
  };

  public shared ({ caller }) func removeParticipant(challengeId : Nat, participant : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove participants");
    };

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
      };
    };
  };

  public shared ({ caller }) func saveRecording(challengeId : Nat, day : Nat, assignment : Text, recording : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save recordings");
    };

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

        let updatedDayRecordings = existingDayRecordings.clone();
        updatedDayRecordings.add(assignment, recording);

        let updatedUserRecordings = existingUserRecordings.clone();
        updatedUserRecordings.add(day, updatedDayRecordings);

        let newRecordings = challenge.recordings.clone();
        newRecordings.add(caller, updatedUserRecordings);

        let updatedChallenge = { challenge with recordings = newRecordings };
        challenges.add(challengeId, updatedChallenge);
      };
    };
  };

  public query ({ caller }) func getRecording(challengeId : Nat, day : Nat, assignment : Text) : async Storage.ExternalBlob {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get recordings");
    };

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
                switch (dayRecordings.get(assignment)) {
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete recordings");
    };

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

        if (not existingDayRecordings.containsKey(assignment)) {
          Runtime.trap("Recording not found for assignment");
        };

        let updatedDayRecordings = existingDayRecordings.clone();
        updatedDayRecordings.remove(assignment);

        let newUserRecordings = existingUserRecordings.clone();
        newUserRecordings.add(day, updatedDayRecordings);

        let newRecordings = challenge.recordings.clone();
        newRecordings.add(caller, newUserRecordings);

        let updatedChallenge = { challenge with recordings = newRecordings };
        challenges.add(challengeId, updatedChallenge);
      };
    };
  };

  public query ({ caller }) func getAssignmentRecordings(challengeId : Nat, day : Nat, assignment : Text) : async [(Principal, ?Storage.ExternalBlob)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only participants can fetch recordings");
    };

    switch (challenges.get(challengeId)) {
      case (null) { Runtime.trap("Challenge not found") };
      case (?challenge) {
        if (not challenge.participants.contains(caller)) {
          Runtime.trap("Unauthorized: Only participants can fetch recordings");
        };

        challenge.participants.toArray().map(
          func(participant) {
            switch (challenge.recordings.get(participant)) {
              case (null) { (participant, null : ?Storage.ExternalBlob) };
              case (?userRecordings) {
                switch (userRecordings.get(day)) {
                  case (null) { (participant, null : ?Storage.ExternalBlob) };
                  case (?dayRecordings) {
                    switch (dayRecordings.get(assignment)) {
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

  public query ({ caller }) func getParticipantRecording(challengeId : Nat, participant : Principal, day : Nat, assignment : Text) : async Storage.ExternalBlob {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get recordings");
    };

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
                switch (dayRecordings.get(assignment)) {
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
};
