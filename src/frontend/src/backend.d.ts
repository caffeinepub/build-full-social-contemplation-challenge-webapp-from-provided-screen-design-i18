import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Recording {
    value: ExternalBlob;
    isShared: boolean;
}
export interface RSVP {
    name: string;
    inviteCode: string;
    timestamp: Time;
    attending: boolean;
}
export interface InviteCode {
    created: Time;
    code: string;
    used: boolean;
}
export type Time = bigint;
export interface BuildInfo {
    stableDeployTime?: bigint;
    deployTime: bigint;
    version: string;
    buildTime: bigint;
}
export interface UserChallengeStatus {
    hasActiveChallenge: boolean;
}
export interface ChatMessage {
    id: bigint;
    text: string;
    sender: Principal;
    isEdited: boolean;
    timestamp: bigint;
    senderName: string;
    replyTo?: bigint;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createChallenge(startTime: Time): Promise<bigint>;
    deleteChallenge(challengeId: bigint): Promise<void>;
    deleteRecording(challengeId: bigint, day: bigint, assignment: string): Promise<void>;
    editMessage(challengeId: bigint, messageId: bigint, newText: string): Promise<void>;
    generateInvitationCode(challengeId: bigint, code: string): Promise<void>;
    generateInviteCode(): Promise<string>;
    getActiveChallengeIdForCreator(): Promise<bigint | null>;
    getActiveChallengeIdForParticipant(): Promise<bigint | null>;
    getAllChallengeParticipantProfiles(challengeId: bigint): Promise<Array<[Principal, UserProfile | null]>>;
    getAllRSVPs(): Promise<Array<RSVP>>;
    getAssignmentRecordings(challengeId: bigint, day: bigint, assignment: string): Promise<Array<[Principal, Recording | null]>>;
    getAvailableInvitationCodes(challengeId: bigint): Promise<Array<string>>;
    getBuildInfo(): Promise<BuildInfo>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChallengeAudioRecordings(challengeId: bigint): Promise<Array<Principal>>;
    getChallengeParticipants(challengeId: bigint): Promise<Array<Principal>>;
    getChallengeStartTime(challengeId: bigint): Promise<Time>;
    getInviteCodes(): Promise<Array<InviteCode>>;
    getMessage(challengeId: bigint, messageId: bigint): Promise<ChatMessage>;
    getMessages(challengeId: bigint): Promise<Array<ChatMessage>>;
    getParticipantRecording(challengeId: bigint, participant: Principal, day: bigint, assignment: string): Promise<ExternalBlob>;
    getRecording(challengeId: bigint, day: bigint, assignment: string): Promise<ExternalBlob>;
    getUserChallengeStatus(): Promise<UserChallengeStatus>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    leaveChallenge(challengeId: bigint): Promise<void>;
    postMessage(challengeId: bigint, text: string, replyTo: bigint | null): Promise<bigint>;
    redeemInvitationCode(challengeId: bigint, code: string): Promise<void>;
    removeParticipant(challengeId: bigint, participant: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveRecording(challengeId: bigint, day: bigint, assignment: string, recording: ExternalBlob): Promise<void>;
    shareRecording(challengeId: bigint, day: bigint, assignment: string, isShared: boolean): Promise<void>;
    submitRSVP(name: string, attending: boolean, inviteCode: string): Promise<void>;
    updateStartTime(challengeId: bigint, newStartTime: Time): Promise<void>;
}
