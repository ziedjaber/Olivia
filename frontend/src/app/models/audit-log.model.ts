export interface AuditLog {
  id: string;
  timestamp: string;
  acteurUid: string;
  acteurNom: string;
  acteurRole: string;
  action: string;
  entite: string;
  entiteId: string;
  details: string;
}
