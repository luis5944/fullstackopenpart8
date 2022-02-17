import { useApolloClient } from "@apollo/client";
import React, { useState } from "react";
import { useEffect } from "react";
import Authors from "./components/Authors";
import Books from "./components/Books";
import LoginForm from "./components/LoginForm";
import NewBook from "./components/NewBook";
import Recommend from "./components/Recommend";

const App = () => {
  const [page, setPage] = useState("authors");
  const [token, setToken] = useState(null);
  const client = useApolloClient();
  useEffect(() => {
    const tokenLocal = localStorage.getItem("library-user-token");
    setToken(tokenLocal);
  }, []);
  const logout = () => {
    setToken(null);
    localStorage.clear();
    client.resetStore();
  };
  return (
    <div>
      <div>
        <button onClick={() => setPage("authors")}>authors</button>
        <button onClick={() => setPage("books")}>books</button>
        <button onClick={() => setPage("add")}>add book</button>
        {token ? (
          <div style={{ display: "inline" }}>
            <button onClick={() => setPage("recommend")}>recommend</button>
            <button onClick={logout}>logout</button>
          </div>
        ) : (
          <button onClick={() => setPage("login")}>login</button>
        )}
      </div>
      <Authors show={page === "authors"} token={token} />
      <Books show={page === "books"} />
      <NewBook show={page === "add"} />
      {token ? <Recommend show={page === "recommend"} /> : null}
      <LoginForm
        show={page === "login"}
        setToken={setToken}
        setPage={setPage}
      />
    </div>
  );
};

export default App;
