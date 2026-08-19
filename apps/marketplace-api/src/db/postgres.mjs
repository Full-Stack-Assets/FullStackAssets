import pg from 'pg';
export function createPostgres({connectionString=process.env.DATABASE_URL,poolOptions={}}={}){
  const pool=new pg.Pool({connectionString,...poolOptions});
  return {
    query:(text,params=[])=>pool.query(text,params),
    transaction:async(fn)=>{const client=await pool.connect();try{await client.query('BEGIN');const result=await fn({query:(text,params=[])=>client.query(text,params)});await client.query('COMMIT');return result;}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}},
    close:()=>pool.end(),
  };
}
