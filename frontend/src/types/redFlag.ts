export type RedFlag = {
  category: string;
  severity: 'Low' | 'Medium' | 'High';
  title: string;
  explanation: string;
  source_page: number;
};
