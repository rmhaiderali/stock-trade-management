import React, { useState, useEffect, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";
import { useNavigate } from "react-router-dom";

export default function ({ userInfo }) {
  const navigate = useNavigate();

  const [token, setToken] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const onSuccess = useCallback(async (publicToken) => {
    setLoading(true);
    await fetch("/api/plaid/exchangePublicToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ public_token: publicToken }),
    });

    navigate("/");
    // await getBalance();
  }, []);

  // Creates a Link token
  const createLinkToken = React.useCallback(async () => {
    // For OAuth, use previously generated Link token
    if (window.location.href.includes("?oauth_state_id=")) {
      const linkToken = localStorage.getItem("link_token");
      setToken(linkToken);
    } else {
      const response = await fetch("/api/plaid/createLinkToken", {});
      const data = await response.json();
      setToken(data.link_token);
      localStorage.setItem("link_token", data.link_token);
    }
  }, [setToken]);

  // Fetch balance data
  const getBalance = React.useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/plaid/investmentHoldings", {});
    const data = await response.json();
    setData(data);
    setLoading(false);
  }, [setData, setLoading]);

  let isOauth = false;

  const config = {
    token,
    onSuccess,
  };

  // For OAuth, configure the received redirect URI
  if (window.location.href.includes("?oauth_state_id=")) {
    config.receivedRedirectUri = window.location.href;
    isOauth = true;
  }
  const { open, ready } = usePlaidLink(config);

  useEffect(() => {
    if (token == null) {
      createLinkToken();
    }
    if (isOauth && ready) {
      open();
    }
  }, [token, isOauth, ready, open]);

  return (
    <div className="flex grow items-center">
      <button
        className={
          "flex mx-auto text-white border-0 py-2 px-8 focus:outline-none rounded text-md " +
          (ready ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-400")
        }
        onClick={() => open()}
        disabled={!ready}
      >
        Link account with Plaid
      </button>
      {/* <button onClick={() => getBalance()}>
        Manually get investmentHoldings
      </button>

      {!loading &&
        data != null &&
        Object.entries(data).map((entry, i) => (
          <pre key={i}>
            <code>{JSON.stringify(entry[1], null, 2)}</code>
          </pre>
        ))} */}
    </div>
  );
}
