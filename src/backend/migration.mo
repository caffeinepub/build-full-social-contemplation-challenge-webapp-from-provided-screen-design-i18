import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Set "mo:core/Set";
import Text "mo:core/Text";
import List "mo:core/List";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";
import InviteLinksModule "invite-links/invite-links-module";

module {
  // Old Types
  type OldChatMessage = {
    id : Nat;
    sender : Principal;
    senderName : Text;
    text : Text;
    timestamp : Int;
    isEdited : Bool;
    replyTo : ?Nat;
  };

  type OldChallenge = {
    id : Nat;
    creator : Principal;
    startTime : Time.Time;
    participants : Set.Set<Principal>;
    isActive : Bool;
    invitationCodes : Map.Map<Text, Bool>;
    recordings : Map.Map<Principal, Map.Map<Nat, Map.Map<Text, Storage.ExternalBlob>>>;
    chatMessages : List.List<OldChatMessage>;
    nextChatId : Nat;
  };

  type OldActor = {
    var nextChallengeId : Nat;
    accessControlState : AccessControl.AccessControlState;
    stableDeployTime : ?Int;
    buildTimeNanos : Nat;
    deployTimeNanos : Nat;
    userProfiles : Map.Map<Principal, { name : Text }>;
    challenges : Map.Map<Nat, OldChallenge>;
    creatorToChallengeId : Map.Map<Principal, Nat>;
    participantToChallengeId : Map.Map<Principal, Nat>;
    inviteLinksState : InviteLinksModule.InviteLinksSystemState;
  };

  // New Types
  type NewRecording = {
    value : Storage.ExternalBlob;
    isShared : Bool;
  };

  type NewChatMessage = {
    id : Nat;
    sender : Principal;
    senderName : Text;
    text : Text;
    timestamp : Int;
    isEdited : Bool;
    replyTo : ?Nat;
  };

  type NewChallenge = {
    id : Nat;
    creator : Principal;
    startTime : Time.Time;
    participants : Set.Set<Principal>;
    isActive : Bool;
    invitationCodes : Map.Map<Text, Bool>;
    recordings : Map.Map<Principal, Map.Map<Nat, Map.Map<Text, NewRecording>>>;
    chatMessages : List.List<NewChatMessage>;
    nextChatId : Nat;
  };

  type NewActor = {
    var nextChallengeId : Nat;
    accessControlState : AccessControl.AccessControlState;
    stableDeployTime : ?Int;
    buildTimeNanos : Nat;
    deployTimeNanos : Nat;
    userProfiles : Map.Map<Principal, { name : Text }>;
    challenges : Map.Map<Nat, NewChallenge>;
    creatorToChallengeId : Map.Map<Principal, Nat>;
    participantToChallengeId : Map.Map<Principal, Nat>;
    inviteLinksState : InviteLinksModule.InviteLinksSystemState;
  };

  public func run(old : OldActor) : NewActor {
    let newChallenges = old.challenges.map<Nat, OldChallenge, NewChallenge>(
      func(_challengeId, oldChallenge) {
        let newRecordings = oldChallenge.recordings.map<Principal, Map.Map<Nat, Map.Map<Text, Storage.ExternalBlob>>, Map.Map<Nat, Map.Map<Text, NewRecording>>>(
          func(_user, userRecordings) {
            userRecordings.map<Nat, Map.Map<Text, Storage.ExternalBlob>, Map.Map<Text, NewRecording>>(
              func(_day, dayRecordings) {
                dayRecordings.map<Text, Storage.ExternalBlob, NewRecording>(
                  func(_assignment, recording) {
                    {
                      value = recording;
                      isShared = false;
                    };
                  }
                );
              }
            );
          }
        );
        {
          oldChallenge with
          recordings = newRecordings;
        };
      }
    );
    {
      var nextChallengeId = old.nextChallengeId;
      accessControlState = old.accessControlState;
      stableDeployTime = old.stableDeployTime;
      buildTimeNanos = old.buildTimeNanos;
      deployTimeNanos = old.deployTimeNanos;
      userProfiles = old.userProfiles;
      challenges = newChallenges;
      creatorToChallengeId = old.creatorToChallengeId;
      participantToChallengeId = old.participantToChallengeId;
      inviteLinksState = old.inviteLinksState;
    };
  };
};
