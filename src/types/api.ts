export type CoverageCheckRequest = {
  address: string;
};

export type CoverageCheckResponse = {
  covered: boolean;
  reason?: string;
};
