/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useEffect, useState } from 'react';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import './App.css';
import { StockInfo } from 'common/types';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  TextField,
} from '@mui/material';
import { SocketAddress } from 'net';

let timer: NodeJS.Timer;

type StockValue = {
  diff: number;
  diffString: string;
  diffPercentage: number;
  diffPercentageString: string;
};

export default function App() {
  const [stocks, setStocks] = useState<StockInfo[]>([]);
  const [fetchTime, setFetchTime] = useState<Date>();
  const [symbols, setSymbols] = useState<string[]>([
    //'EQNR.OL',
    //'AAPL',
    //'TSLA',
    //'TEL.OL',
    //'SOP.PA',
    //'GOOGL',
    //'BEWI.OL',
  ]);
  const [stockValues, setStockValues] = useState<StockValue[]>([]);

  const [input, setInput] = useState<string>('');

  const fetchStonks = () => {
    window.electron.ipcRenderer.sendMessage('get-symbol', symbols);
  };

  window.electron.ipcRenderer.once('get-symbol', (arg) => {
    console.log(arg);
    setFetchTime(new Date());

    if (arg.length === symbols.length) {
      setStockValues(
        arg.map((stock) => {
          const diff = stock.currentPrice! - stock.previousClose!;
          const diffString =
            diff > 0 ? `+${diff.toFixed(2)}` : `${diff.toFixed(2)}`;
          const diffPercentage =
            (Math.abs(stock.previousClose! - stock.currentPrice!) /
              stock.previousClose!) *
            100;
          const diffPercentageString =
            diff > 0
              ? `+${diffPercentage.toFixed(2)}%`
              : `-${diffPercentage.toFixed(2)}%`;

          return {
            diff,
            diffString,
            diffPercentage,
            diffPercentageString,
          };
        })
      );

      setStocks(arg);
    }
  });

  useEffect(() => fetchStonks(), []);

  useEffect(() => {
    console.log('useeffect');
    fetchStonks();
    clearInterval(timer);
    timer = setInterval(() => {
      fetchStonks();
    }, 10000);
    return () => {
      console.log('clearing');
      clearInterval(timer);
    };
  }, [symbols]);

  if (stocks.length !== symbols.length) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <CircularProgress size="10rem" />
      </Box>
    );
  }

  const handleInput = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setInput(event.target.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      console.log(event.key);
      setSymbols(symbols.concat([input]));
      setInput('');
      setStocks([]);
    }
  };

  return (
    <List sx={{ maxHeight: '98vh', overflow: 'auto' }}>
      <TextField
        sx={{
          display: 'flex',
          maxWidth: '40rem',
          marginLeft: 'auto',
          marginRight: 'auto',
          marginBottom: '1rem',
        }}
        label="Add symbol"
        variant="outlined"
        value={input}
        onChange={(value) => handleInput(value)}
        onKeyDown={(key) => handleKeyDown(key)}
      />
      {stocks.map((stock, index) => (
        <Card
          key={stock.symbol}
          sx={{
            marginBottom: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <CardContent>
            <Typography variant="h6">{stock.longName}</Typography>
            <Typography variant="subtitle1">
              {stock.currentPrice!.toFixed(2)} {stock.currency}{' '}
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{ color: stockValues[index].diff > 0 ? 'green' : 'red' }}
            >
              {stockValues[index].diffString} (
              {stockValues[index].diffPercentageString})
            </Typography>
          </CardContent>
          <CardMedia
            component="img"
            sx={{
              float: 'left',
              width: '90px',
              height: '90px',
              padding: 2,
              objectFit: 'scale-down',
            }}
            image={stock.logo_url}
            alt={`${stock.symbol}_logo`}
          />
        </Card>
      ))}
      <Typography sx={{ float: 'right' }}>
        {stocks.length > 0
          ? `Oppdatert: ${fetchTime?.toLocaleTimeString()}`
          : ''}
      </Typography>
    </List>
  );
}
