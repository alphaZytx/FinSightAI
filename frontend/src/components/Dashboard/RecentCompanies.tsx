import type { Company } from '../../types';
import { mockCompanies } from '../../services/mockData';
import { Badge, Card } from '../Common';

const statusVariant: Record<Company['analysisStatus'], 'success' | 'warning' | 'neutral' | 'error'> = {
  Complete: 'success',
  'In Progress': 'warning',
  Pending: 'neutral',
  Failed: 'error',
};

interface RecentCompaniesProps {
  companies?: Company[];
}

export default function RecentCompanies({ companies = mockCompanies }: RecentCompaniesProps) {
  return (
    <Card title="Recent Companies" subtitle="Latest analyzed entities">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-700/40 text-left text-xs text-surface-400">
              <th className="pb-3 pr-4 font-medium">Company Name</th>
              <th className="pb-3 pr-4 font-medium">Industry</th>
              <th className="pb-3 pr-4 font-medium">Upload Date</th>
              <th className="pb-3 font-medium">Analysis Status</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id} className="border-b border-surface-700/20 last:border-0 hover:bg-surface-800/30">
                <td className="py-3 pr-4 font-medium text-surface-100">{company.name}</td>
                <td className="py-3 pr-4 text-surface-400">{company.industry}</td>
                <td className="py-3 pr-4 text-surface-400">
                  {new Date(company.uploadDate).toLocaleDateString()}
                </td>
                <td className="py-3">
                  <Badge variant={statusVariant[company.analysisStatus]}>
                    {company.analysisStatus}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
