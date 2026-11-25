export interface AuthenticatedActor {
  userId: string;
  profileId: string;
  permissions: string[];
}
