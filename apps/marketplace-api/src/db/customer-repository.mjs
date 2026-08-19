function subjectWhere(subject,start=1){
  if(subject.type==='USER') return {sql:`user_id = $${start}`,params:[subject.id]};
  if(subject.type==='ORGANIZATION') return {sql:`organization_id = $${start}`,params:[subject.id]};
  throw new TypeError('Invalid subject');
}
export function createCustomerRepository(db){
  return {
    async getUser(id){const r=await db.query('SELECT * FROM users WHERE id=$1',[id]);return r.rows[0]??null;},
    async getOrganization(id){const r=await db.query('SELECT * FROM organizations WHERE id=$1',[id]);return r.rows[0]??null;},
    async listMemberships(userId){const r=await db.query("SELECT * FROM memberships WHERE user_id=$1 AND status='ACTIVE' ORDER BY organization_id",[userId]);return r.rows;},
    async listEntitlements(subject){const w=subjectWhere(subject);const r=await db.query(`SELECT * FROM entitlements WHERE ${w.sql} ORDER BY product_id,id`,w.params);return r.rows;},
    async getEntitlement(id){const r=await db.query('SELECT * FROM entitlements WHERE id=$1',[id]);return r.rows[0]??null;},
    async upsertInstallation(record){
      const subjectColumn=record.subject.type==='USER'?'user_id':record.subject.type==='ORGANIZATION'?'organization_id':null;
      if(!subjectColumn) throw new TypeError('Invalid subject');
      const values=[record.id,record.subject.id,record.product_version_id,record.runtime_distribution_id??null,record.runtime,record.installed_version,record.status??'INSTALLED'];
      const r=await db.query(`INSERT INTO installations (id,${subjectColumn},product_version_id,runtime_distribution_id,runtime,installed_version,status) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO UPDATE SET product_version_id=EXCLUDED.product_version_id,runtime_distribution_id=EXCLUDED.runtime_distribution_id,runtime=EXCLUDED.runtime,installed_version=EXCLUDED.installed_version,status=EXCLUDED.status,updated_at=NOW() RETURNING *`,values);
      return r.rows[0];
    },
    async listCollections(subject){const w=subjectWhere(subject);const r=await db.query(`SELECT * FROM collections WHERE ${w.sql} ORDER BY created_at,id`,w.params);return r.rows;},
  };
}
