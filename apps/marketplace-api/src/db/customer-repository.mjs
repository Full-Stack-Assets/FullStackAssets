function subjectWhere(subject,start=1){
  if(subject.type==='USER') return {sql:`user_id = $${start}`,params:[subject.id],column:'user_id'};
  if(subject.type==='ORGANIZATION') return {sql:`organization_id = $${start}`,params:[subject.id],column:'organization_id'};
  throw new TypeError('Invalid subject');
}
export function createCustomerRepository(db){
  return {
    async getUser(id){const r=await db.query('SELECT * FROM users WHERE id=$1',[id]);return r.rows[0]??null;},
    async getOrganization(id){const r=await db.query('SELECT * FROM organizations WHERE id=$1',[id]);return r.rows[0]??null;},
    async listMemberships(userId){const r=await db.query("SELECT * FROM memberships WHERE user_id=$1 AND status='ACTIVE' ORDER BY organization_id",[userId]);return r.rows;},
    async listEntitlements(subject){const w=subjectWhere(subject);const r=await db.query(`SELECT * FROM entitlements WHERE ${w.sql} ORDER BY product_id,id`,w.params);return r.rows;},
    async getEntitlement(id,subject){const w=subjectWhere(subject,2);const r=await db.query(`SELECT * FROM entitlements WHERE id=$1 AND ${w.sql}`,[id,...w.params]);return r.rows[0]??null;},
    async listInstallations(subject){const w=subjectWhere(subject);const r=await db.query(`SELECT * FROM installations WHERE ${w.sql} ORDER BY updated_at DESC,id`,w.params);return r.rows;},
    async upsertInstallation(record){
      const w=subjectWhere(record.subject);const column=w.column;
      const values=[record.id,record.subject.id,record.product_version_id,record.runtime_distribution_id??null,record.runtime,record.installed_version,record.status??'INSTALLED'];
      const conflict=column==='user_id'?"(user_id,product_version_id,runtime) WHERE user_id IS NOT NULL":"(organization_id,product_version_id,runtime) WHERE organization_id IS NOT NULL";
      const r=await db.query(`INSERT INTO installations (id,${column},product_version_id,runtime_distribution_id,runtime,installed_version,status) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT ${conflict} DO UPDATE SET runtime_distribution_id=EXCLUDED.runtime_distribution_id,installed_version=EXCLUDED.installed_version,status=EXCLUDED.status,updated_at=NOW() RETURNING *`,values);
      return r.rows[0];
    },
    async listCollections(subject){const w=subjectWhere(subject);const r=await db.query(`SELECT * FROM collections WHERE ${w.sql} ORDER BY created_at,id`,w.params);return r.rows;},
    async getCollection(id){const r=await db.query('SELECT * FROM collections WHERE id=$1',[id]);return r.rows[0]??null;},
    async createCollection(record){const w=subjectWhere(record.subject);const r=await db.query(`INSERT INTO collections (id,${w.column},name,visibility) VALUES ($1,$2,$3,$4) RETURNING *`,[record.id,record.subject.id,record.name,record.visibility]);return r.rows[0];},
    async addCollectionItem(record){const r=await db.query('INSERT INTO collection_items (id,collection_id,product_id,pinned_version) VALUES ($1,$2,$3,$4) RETURNING *',[record.id,record.collection_id,record.product_id,record.pinned_version??null]);return r.rows[0];},
  };
}
