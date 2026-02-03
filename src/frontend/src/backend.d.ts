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
export type Time = bigint;
export interface UserChallengeStatus {
    hasActiveChallenge: boolean;
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
    generateInvitationCode(challengeId: bigint, code: string): Promise<void>;
    getActiveChallengeIdForCreator(): Promise<bigint | null>;
    getAllChallengeParticipantProfiles(challengeId: bigint): Promise<Array<[Principal, UserProfile | null]>>;
    getAssignmentRecordings(challengeId: bigint, day: bigint, assignment: string): Promise<Array<[Principal, ExternalBlob | null]>>;
    getAvailableInvitationCodes(challengeId: bigint): Promise<Array<string>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChallengeAudioRecordings(challengeId: bigint): Promise<Array<Principal>>;
    getChallengeParticipants(challengeId: bigint): Promise<Array<Principal>>;
    getParticipantRecording(challengeId: bigint, participant: Principal, day: bigint, assignment: string): Promise<ExternalBlob>;
    getRecording(challengeId: bigint, day: bigint, assignment: string): Promise<ExternalBlob>;
    getUserChallengeStatus(): Promise<UserChallengeStatus>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    leaveChallenge(challengeId: bigint): Promise<void>;
    redeemInvitationCode(challengeId: bigint, code: string): Promise<void>;
    removeParticipant(challengeId: bigint, participant: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveRecording(challengeId: bigint, day: bigint, assignment: string, recording: ExternalBlob): Promise<void>;
    updateStartTime(challengeId: bigint, newStartTime: Time): Promise<void>;
}
