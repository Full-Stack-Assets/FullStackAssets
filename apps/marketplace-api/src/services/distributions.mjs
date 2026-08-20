import { buildEvaluationMatrix, publicCompatibilitySummary } from '../../../../marketplace/distribution/evaluation-matrix.mjs';

function forbidden(code='FORBIDDEN'){const error=new Error(code);error.code=code;error.status=403;throw error;}
export function createDistributionService({repo}={}){
  if(!repo) throw new TypeError('DISTRIBUTION_REPOSITORY_REQUIRED');
  return {
    async compatibility(context,productVersionId){
      if(!context?.user?.id && !context?.subject?.id) forbidden('AUTH_SUBJECT_REQUIRED');
      const version=await repo.getProductVersion(productVersionId);if(!version)return null;
      const distributions=await repo.listRuntimeDistributions(productVersionId);
      const evaluations=await repo.listRuntimeEvaluations(productVersionId);
      const requiredRuntimes=Array.isArray(version.required_runtimes)?version.required_runtimes:[];
      const matrix=buildEvaluationMatrix({distributions,evaluations,requiredRuntimes});
      return {product_version_id:productVersionId,status:matrix.status,blocking_required:matrix.blocking_required,compatibility:publicCompatibilitySummary(matrix)};
    },
  };
}
