import { Balance } from "./types/types";

const DB_NAME = 'crypto_exchange';
const USER_BALANCES_STORE = 'user_balances';
const TRADE_HISTORY_STORE = 'trade_history';

async function openDatabase() {
    return new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onerror = () => {
            reject(request.error);
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
            const db = request.result;
            if (event.oldVersion < 1) {
                db.createObjectStore(USER_BALANCES_STORE, { keyPath: 'currency', autoIncrement: true });
                db.createObjectStore(TRADE_HISTORY_STORE, { autoIncrement: true });
            }
        };
    });
}

export const initializeUserBalance = async () => {
    const db = await openDatabase();
    const transaction = db.transaction(USER_BALANCES_STORE, "readwrite");
    const balancesStore = transaction.objectStore(USER_BALANCES_STORE);

    const countRequest = balancesStore.count();
    await new Promise<void>((resolve, reject) => {
        countRequest.onsuccess = () => {
            if (countRequest.result === 0) {
                const initialBalance = [
                    { currency: "Bitcoin", amount: 5 },
                    // Добавьте другие валюты с начальными балансами здесь
                ];

                initialBalance.forEach((balance) => {
                    balancesStore.add(balance);
                });

                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error);
            } else {
                resolve();
            }
        };

        countRequest.onerror = () => reject(countRequest.error);
    });

    db.close();
};

export const tradeHandler = async (trade: { fromCurrency: string; toCurrency: string; fromAmount: number; toAmount: number }) => {
    const db = await openDatabase();
    const tx = db.transaction(USER_BALANCES_STORE, 'readwrite');
    const store = tx.objectStore(USER_BALANCES_STORE);
    const balanceStore = store.getAll();
    const balance = await new Promise<Balance[]>((resolve, reject) => {
        balanceStore.onsuccess = () => resolve(balanceStore.result);
        balanceStore.onerror = () => reject(balanceStore.error);
    });

    const sellCurrencyIndex = balance.findIndex(
        (balance: Balance) => balance.currency === trade.fromCurrency
    );
    const buyCurrencyIndex = balance.findIndex(
        (balance: Balance) => balance.currency === trade.toCurrency
    );

    balance[sellCurrencyIndex].amount -= trade.fromAmount;
    if (buyCurrencyIndex !== -1) {
        balance[buyCurrencyIndex].amount += trade.toAmount;
    } else {
        balance.push({ currency: trade.toCurrency, amount: trade.toAmount })
    }

    const clearRequest = store.clear();

    await new Promise<void>((resolve, reject) => {
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
    });

    balance.forEach((item) => {
        store.add(item);
    })


    db.close();
}

export const saveTrade = async (trade: { fromCurrency: string; toCurrency: string; fromAmount: number; toAmount: number }) => {
    const db = await openDatabase();
    const tx = db.transaction(TRADE_HISTORY_STORE, 'readwrite');
    const store = tx.objectStore(TRADE_HISTORY_STORE);
    tradeHandler(trade);
    store.add(trade);
}

export async function getTradeHistory() {
    const db = await openDatabase();
    const tx = db.transaction(TRADE_HISTORY_STORE, 'readonly');
    const store = tx.objectStore(TRADE_HISTORY_STORE);
    return store.getAll();
}

export async function getUserBalance() {
    const db = await openDatabase();
    const tx = db.transaction(USER_BALANCES_STORE, 'readonly');
    const store = tx.objectStore(USER_BALANCES_STORE);
    return store.getAll();
}
