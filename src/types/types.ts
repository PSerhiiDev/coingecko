export interface CoinData {
  id: string;
  name: string;
  current_price: number;
}

export interface CoinOption {
  value: string;
  label: string;
}

export interface HistoryItem {
  fromAmount: number,
  fromCurrency: string,
  toAmount: number,
  toCurrency: string
}

export interface Balance {
  currency: string;
  amount: number;
}
