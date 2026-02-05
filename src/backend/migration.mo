import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Storage "blob-storage/Storage";
import Set "mo:core/Set";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Time "mo:core/Time";

module {
  let legacyDay0Mapping : [(Nat, [Nat])] = [(0, [0, 1, 2])];
  let legacyDay1Mapping : [(Nat, [Nat])] = [(1, [3])];

  type UserProfile = {
    name : Text;
  };

  type ChatMessage = {
    id : Nat;
    sender : Principal.Principal;
    senderName : Text;
    text : Text;
    timestamp : Int;
    isEdited : Bool;
    replyTo : ?Nat;
  };

  type Challenge = {
    id : Nat;
    creator : Principal.Principal;
    startTime : Time.Time;
    participants : Set.Set<Principal.Principal>;
    isActive : Bool;
    invitationCodes : Map.Map<Text, Bool>;
    recordings : Map.Map<Principal.Principal, Map.Map<Nat, Map.Map<Text, Storage.ExternalBlob>>>;
    chatMessages : List.List<ChatMessage>;
    nextChatId : Nat;
  };

  type OldActor = {
    challenges : Map.Map<Nat, Challenge>;
  };

  func normalizeDay(originalDay : Nat) : Nat {
    let findDay = func(pair : (Nat, [Nat])) : Bool {
      let (_normalizedDay, validDays) = pair;
      validDays.find(func(validDay) { validDay == originalDay }) != null;
    };

    switch (legacyDay0Mapping.find(findDay)) {
      case (?pair) { pair.0 };
      case (null) {
        switch (legacyDay1Mapping.find(findDay)) {
          case (?pair) { pair.0 };
          case (null) { originalDay };
        };
      };
    };
  };

  public func run(old : OldActor) : OldActor {
    let updatedChallenges = old.challenges.map<Nat, Challenge, Challenge>(
      func(_id, challenge) {
        let updatedRecordings = challenge.recordings.map<Principal.Principal, Map.Map<Nat, Map.Map<Text, Storage.ExternalBlob>>, Map.Map<Nat, Map.Map<Text, Storage.ExternalBlob>>>(
          func(_user, userRecordings) {
            userRecordings.map<Nat, Map.Map<Text, Storage.ExternalBlob>, Map.Map<Text, Storage.ExternalBlob>>(
              func(day, dayRecordings) {
                if (not ([0, 1, 2, 3].find(func(x) { x == day }) != null)) {
                  return dayRecordings;
                };
                dayRecordings.map<Text, Storage.ExternalBlob, Storage.ExternalBlob>(func(assignment, recording) { recording });
              }
            );
          }
        );
        { challenge with recordings = updatedRecordings };
      }
    );
    { old with challenges = updatedChallenges };
  };
};
