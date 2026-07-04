import PageHeader from '../components/layout/PageHeader';
import ReportPreview from '../components/reports/ReportPreview';

export default function ReportBuilder() {
  return <><PageHeader title="Report Builder" subtitle="Generate analyst-style PDF report." /><ReportPreview /></>;
}
