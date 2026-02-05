import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Storage "blob-storage/Storage";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

module {
  type OldChallenge = {
    id : Nat;
    creator : Principal;
    startTime : Time.Time;
    participants : Set.Set<Principal>;
    isActive : Bool;
    invitationCodes : Map.Map<Text, Bool>;
    recordings : Map.Map<Principal, Map.Map<Nat, Map.Map<Text, Storage.ExternalBlob>>>;
    chatMessages : List.List<{ id : Nat; sender : Principal; senderName : Text; text : Text; timestamp : Int; isEdited : Bool; replyTo : ?Nat }>;
    nextChatId : Nat;
  };

  type OldActor = {
    challenges : Map.Map<Nat, OldChallenge>;
  };

  public func run(old : OldActor) : OldActor {
    let newChallenges = old.challenges.map<Nat, OldChallenge, OldChallenge>(
      func(_, challenge) {
        let newRecordings = challenge.recordings.map<Principal, Map.Map<Nat, Map.Map<Text, Storage.ExternalBlob>>, Map.Map<Nat, Map.Map<Text, Storage.ExternalBlob>>>(
          func(_principal, recordingsMap) {
            let newMap = Map.empty<Nat, Map.Map<Text, Storage.ExternalBlob>>();
            recordingsMap.forEach(
              func(day, assignmentMap) {
                let newAssignmentMap = assignmentMap.map(
                  func(originalKey, blob) {
                    assignmentMap.remove(originalKey);
                    let lowerKey = originalKey.toLower();
                    blob;
                  }
                );
                newMap.add(day, newAssignmentMap);
              }
            );
            newMap;
          }
        );
        { challenge with recordings = newRecordings };
      }
    );
    { old with challenges = newChallenges };
  };
};
