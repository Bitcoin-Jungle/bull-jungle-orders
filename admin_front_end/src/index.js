import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createHashRouter,
  RouterProvider,
} from 'react-router-dom';

import reportWebVitals from './reportWebVitals';

import './index.css';
import './App.css';

import Home from './Home';
import BankAccounts from './BankAccounts';
import OrderHistory from './OrderHistory';
import PhoneNumbers from './PhoneNumbers';
import CreateOrder from './CreateOrder';
import Stats from "./Stats";
import ManageCurrencies from "./ManageCurrencies";
import Ticker from "./Ticker";

const router = createHashRouter([
  {
    path: "/*",
    element: <Home />
  },
  {
    path: "/bankAccounts",
    element: <BankAccounts />,
  },
  {
    path: "/orderHistory",
    element: <OrderHistory />,
  },
  {
    path: "/phoneNumbers",
    element: <PhoneNumbers />,
  },
  {
    path: "/createOrder",
    element: <CreateOrder />,
  },
  {
    path: "/stats",
    element: <Stats />,
  },
  {
    path: "/manageCurrencies",
    element: <ManageCurrencies />,
  }
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <div className="App">
      <h3>
        <a href="#" style={{color: "black"}}>
          Bull Jungle Admin
        </a>
      </h3>
      <Ticker />
      <RouterProvider router={router} />
    </div>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
