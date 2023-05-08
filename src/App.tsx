/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, ChangeEvent } from "react";
import { Balance, CoinData, CoinOption, HistoryItem } from "./types/types";
import './App.css'
import { getTradeHistory, getUserBalance, initializeUserBalance, saveTrade } from "./indexedDB";
import History from './svg/history.svg'
import Wallet from './svg/wallet.svg'
import Empty from './svg/empty.svg'

const App: React.FC = () => {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [coinOptions, setCoinOptions] = useState<CoinOption[]>([]);
  const [coin1, setCoin1] = useState<CoinOption | null>(null);
  const [coin2, setCoin2] = useState<CoinOption | null>(null);
  const [amount1, setAmount1] = useState("");
  const [amount2, setAmount2] = useState("");
  const [isHistory, setIsHistory] = useState<boolean>(false);
  const [isWallet, setIsWallet] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [balance, setBalance] = useState<Balance[] | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const url = import.meta.env.VITE_COIN_GECKO;

      try {
        const result = await fetch(url);
        const data: CoinData[] = await result.json();
        setCoins(data);
        setCoinOptions(
          data.map((coin) => ({ value: coin.id, label: coin.name }))
        );
      } catch (error) {
        console.log(error)
      }

    };
    fetchData();
    walletHandler();
    historyHandler();
    initializeUserBalance();
  }, []);

  useEffect(() => {
    calculateAmount2();
  }, [amount1, amount2, coin1, coin2])

  const calculateAmount2 = () => {
    if (!amount1) {
      setAmount2("");
    }
    if (!coin1 || !coin2 || !amount1) return;
    const coin1Data = coins.find((coin) => coin.id === coin1.value);
    const coin2Data = coins.find((coin) => coin.id === coin2.value);
    const amount2 =
      (coin1Data!.current_price / coin2Data!.current_price) * Number(amount1);
    setAmount2(amount2.toFixed(4));
  };

  const handleTrade = () => {
    if (coin1 && amount1 && coin2 && balance) {
      const balanceCurrency = balance.filter((currency) => currency.currency === coin1.label)[0];

      if (balanceCurrency && balanceCurrency.amount >= +amount1) {
        saveTrade({ fromAmount: +amount1, fromCurrency: coin1.label, toAmount: +amount2, toCurrency: coin2.label })
        walletHandler();
        historyHandler();
      }
    }
  };

  const inputAmount1Handler = (e: ChangeEvent<HTMLInputElement>) => {
    setAmount1(e.target.value);
  }

  const inputAmount2Handler = (e: ChangeEvent<HTMLInputElement>) => {
    setAmount2(e.target.value);
  }

  const selectAmount1Handler = (e: ChangeEvent<HTMLSelectElement>) => {
    setCoin1(
      coinOptions.find((option) => option.value === e.target.value) ||
      null
    );
  }

  const selectAmount2Handler = (e: ChangeEvent<HTMLSelectElement>) => {
    setCoin2(
      coinOptions.find((option) => option.value === e.target.value) ||
      null
    );
  }
  /* it's can be reduce */
  const historyHandler = async () => {
    const history = await getTradeHistory();
    history.onsuccess = (e) => {
      const target = e.target as IDBRequest;
      const history = target.result;
      setHistory(history)
    }
  }

  const walletHandler = async () => {
    const balance = await getUserBalance();
    balance.onsuccess = (e) => {
      const target = e.target as IDBRequest;
      setBalance(target.result);
    }
  }
  /* it's can be reduce */

  const walletClickHandler = () => {
    setIsWallet(!isWallet)
    setIsHistory(false)
  }

  const historyClickHandler = () => {
    setIsHistory(!isHistory)
    setIsWallet(false)
  }

  return (
    <div className="main-container">
      <div className="container">
        <div className="utils">
          <span className="history" onClick={historyClickHandler}>
            <img className="history-image" src={History} alt="" />
          </span>
          <span className="wallet" onClick={walletClickHandler}>
            <img className="wallet-image" src={Wallet} alt="" />
          </span>
        </div>
        <div className="input-wrapper">
          <input
            type="number"
            value={amount1}
            onChange={(e) => inputAmount1Handler(e)}
          />
          <select
            value={coin1?.value || ""}
            onChange={(e) => selectAmount1Handler(e)}
          >
            <option value="" disabled>
              Select coin
            </option>
            {coinOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="input-wrapper">
          <input
            type="number"
            value={amount2}
            onChange={(e) => inputAmount2Handler(e)}
            readOnly
          />
          <select
            value={coin2?.value || ""}
            onChange={(e) => selectAmount2Handler(e)}
          >
            <option value="" disabled>
              Select coin
            </option>
            {coinOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleTrade}
          disabled={!coin1 || !coin2 || !amount1 || !amount2}
        >
          Trade
        </button>
      </div>
      <div className={`modal${isHistory ? ' enable' : ''}`}>
        {history.length ? <ul className="history-list">
          {history.map((item, i) =>
            <li key={item.fromCurrency + i} className="history-item">
              <span>{item.fromCurrency}</span>
              {' '}
              <span>{item.fromAmount}</span>
              {' '}
              to
              {' '}
              <span>{item.toCurrency}</span>
              {' '}
              <span>{item.toAmount}</span>
            </li>
          )}
        </ul> : <span className="empty-icon"><img className="empty" src={Empty} /></span>}
      </div>

      <div className={`modal${isWallet ? ' enable' : ''}`}>
        {balance ? <ul className="history-list">
          {balance.map(item =>
            <li key={item.currency} className="history-item">
              <span>{item.currency}</span>
              {' '}
              <span>{item.amount}</span>
            </li>
          )}
        </ul> : <span className="empty-icon"><img className="empty" src={Empty} /></span>}
      </div>
    </div>
  );
};

export default App;
