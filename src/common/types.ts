export type StockInfo = {
  ask?: number;
  bid?: number;
  country?: string;
  currency?: string;
  currentPrice?: number;
  currentRatio?: number;
  dayHigh?: number;
  dayLow?: number;
  earningsGrowth?: number;
  earningsQuarterlyGrowth?: number;
  fiftyDayAverage?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  logo_url?: string;
  longName?: string;
  open?: number;
  previousClose?: number;
  sector?: string;
  shortName?: string;
  symbol?: string;
};

export type StockApiResponse = {
  data: StockInfo;
  message: string;
  status: number;
};
